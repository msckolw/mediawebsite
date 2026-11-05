# Reader feedback, investment inquiries, and WebMCP

The public `/contact` form accepts reader experiences, suggestions, investment
interest, and general inquiries. The investment panel and navigation/footer
links open `/contact?interest=investment`. Investing is a conversation only; the
form never starts checkout, accepts funds, or promises returns.

The private `/admin/inquiries` inbox defaults to investment inquiries. The
configured administrator can filter all categories, page through messages, mark
them reviewed, and retry a failed team notification. Access requires the existing
configured-admin cookie and allowed Origin for mutations. No public inquiry read
or lookup endpoint exists. Messages render as text, not HTML.

## Configuration and release

1. Copy the names in `backend/inquiries.env.example` into private backend runtime
   configuration. Keep the existing database, JWT, and configured-admin settings.
2. In Resend, verify a sender domain and configure `RESEND_API_KEY` and
   `INQUIRY_EMAIL_FROM` with an authorized sender. Set `INQUIRY_EMAIL_TO` to
   `contact@thenobiasmedia.com`, or another intended team mailbox. Do not place
   these settings in frontend variables. No real credentials are supplied here.
3. Ensure the Inquiry unique request-ID index and InquiryLimit TTL index exist
   before accepting submissions. Mongoose auto-index behavior depends on runtime
   configuration. Rate limits fail closed if the database is unavailable.
4. Release the backend before the frontend. A frontend build alone does not make
   the submission endpoint available. No deployment, DNS change, provider account
   setup, test email, or live database write is performed by local validation.
5. After release, explicitly submit a test inquiry, verify it in the admin inbox,
   and check delivery to the chosen mailbox. Verify unauthorized inbox access is
   denied. Delete test records through normal approved database operations.

The form stores the inquiry and consent timestamp first. It then attempts a
notification with an eight-second timeout. Delivery failure does not discard a
saved message. The notice contains only the type, reference, and private inbox
link, not visitor contact details or message content. Resend acceptance is not
proof of mailbox delivery; check the Resend dashboard for bounces or filtering.
The inbox displays notification acceptance state and offers a retry action.

`npm run inquiries:notify` from `backend/` performs one bounded retry pass. For
automatic retry in production, run this command with the backend image as a
scheduled Cloud Run Job, for example every 15 minutes. Use existing secrets and
database access. This requires a separately configured job/schedule; the API does
not assume an always-running Cloud Run instance. Up to five attempts are selected
for inquiries younger than 23 hours, with at most 50 per pass. Older pending or
uncertain notices require admin review. Resend's idempotency key is reused for
24-hour provider deduplication; an explicit retry after that window can send a
duplicate. A two-minute database claim protects overlapping notification attempts.

## Validation and abuse controls

`POST /api/inquiries` accepts only JSON from the configured website origins, with
strict string fields, contact consent, a blank honeypot, and a stable request ID.
Same-ID/same-payload retries return the same receipt; changed payloads conflict.
Public responses never include contact details, the inquiry body, internal
fingerprints, or email-provider errors. No automatic reply is sent to visitors.

MongoDB counters enforce five submissions per email per hour, 50 per network
address per hour, and 200 globally per hour. Counters use keyed hashes and expire
after the window; raw addresses are not retained in the inquiry. The application
does not trust arbitrary X-Forwarded-For values. Behind a reverse proxy, a shared
network bucket can limit multiple visitors; tune trusted proxy handling only
after verifying the actual hosting topology. Honeypots and Origin checks are not
bot authentication. Add a verified challenge or edge controls if abuse warrants
it. Do not raise caps blindly while spam is active.

Inquiries remain private in MongoDB until no longer needed for the inquiry or
legal obligations. Handle correction/deletion requests using the receipt
reference. Restrict database access and establish an operational retention and
deletion process; the application does not silently purge prospective investor
conversations.

## WebMCP

The application registers `list_public_articles`, `get_public_article`, and
`prepare_inquiry` when the browser offers WebMCP. The API is experimental; the
ordinary reader and form do not require support. Runtime registration follows
`document.modelContext.registerTool`, with an earlier navigator API fallback.
Supporting-browser setup or an origin trial is separate from code deployment.

`frontend/public/webmcp.json` publishes the full input/output schemas, annotations,
and access rules. `/webmcp.md`, an HTML link, and `/llms.txt` provide discovery
documentation. These files are site-specific documentation, not a standardized
WebMCP manifest protocol or a remote MCP server. They contain no credentials.

The inquiry tool opens a form draft in browser state. It never consents or
submits on the visitor's behalf. Existing unsent drafts cannot be replaced by a
tool call. A visitor reviews the draft, checks consent, and clicks Send. No tool
can read inquiries, book a meeting, accept investments, initiate donations, or
read private accounts. Published article data is projected into explicit public
fields, with no arbitrary remote URL fetching.

Validation: run backend tests, frontend tests, root SEO tests, and the production
frontend build. Tests mock email and database access; they do not certify live
Resend delivery, production indexes, or every experimental browser version.

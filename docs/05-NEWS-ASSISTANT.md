# News Assistant

The admin workspace at `/admin/assistant` manages a source library, research
assignments, drafts, two rounds of model review, and explicit editorial publishing.
It uses Parallel directly for search, OpenAI for writing/revisions, and xAI for
review. OpenRouter, LiteLLM, and OpenCode are not involved.

## Configuration and local operation

Use Node 24. Copy the required entries from `backend/assistant.env.example` into
the private `backend/.env`, retaining the existing database, JWT and URL settings.
No real keys are included. Set `ASSISTANT_ENABLED=true` only when ready for paid
requests. Configure all three backend keys: `PARALLEL_API_KEY`, `OPENAI_API_KEY`,
and `XAI_API_KEY`. The source library remains usable while research is disabled.

Admin sign-in now requires `ADMIN_EMAIL` and a bcrypt `ADMIN_PASSWORD_HASH`;
the former hard-coded credentials no longer work. Generate a hash locally with
bcryptjs using a password manager or an interactive script, not a password typed
into shell history. Quote the hash in dotenv files so `$` characters survive.
Rotate `JWT_SECRET` before a production release to invalidate previously issued
admin sessions. This also signs out readers. Keep API keys and hashes in backend
secrets; never use `REACT_APP_*` variables for them.

Start the existing backend and frontend, then from `backend/` run:

```sh
rtk npm run assistant:worker
```

This is a separate, single-process worker, not a browser request. Jobs are saved
in MongoDB. `rtk npm run assistant:worker -- --once` handles one eligible job and
exits. Do not point a development worker at the production database.

Defaults: writer `gpt-6-luna`, reviewer `grok-4.7`, $20 estimated monthly allowance,
one global active worker, eight selected outlets and eight page reads per job,
one direct Parallel Search API request (up to ten results), a 31-day date range, 30 daily submission attempts
(UTC), and three total worker attempts. Failed submissions can consume a daily
slot. Changing model names also requires updating the pricing variables.

## Editorial workflow

1. Sign in as the configured administrator. Open Admin panel > News Assistant.
2. Import the starter source library. Its categories come from the owner's media
   sheet; domains are proposed mappings requiring editorial confirmation. NPR and
   PBS are split, producing 41 entries from the sheet's 40 rows. Combined labels
   such as `Paid` are represented by access settings, not outlet identity.
   The import does not overwrite existing outlets. Full orientation/focus notes
   are maintained through the editor; they are not an automatic Sheets sync.
3. Select up to eight outlets, enter a topic and dates, and upload the image.
   Optionally provide direct article links from the selected domains.
4. Parallel searches selected domains using the topic, context, and date range.
   Queries are built by the backend without a search-planning model. Candidate
   URLs must come from actual Parallel results or editor-supplied links. Search
   candidates are checkpointed before page reads, so resuming `read_sources`
   does not repeat paid discovery. The worker opens each page separately,
   validates DNS and redirects, and requires readable article/main HTML and a
   page-provided publication date in range. It does not bypass paywalls or use
   search snippets as full article evidence.
5. Luna writes original title, summary and body with a claim/source map. At least
   two read sources from distinct hostnames must be cited. This checks provenance,
   not independence of reporting; editors must inspect syndication and ownership.
6. Grok reviews against the same evidence, then Luna revises. A clean review ends
   early. There are at most two Grok reviews and two Luna revisions. A final Luna
   revision is explicitly marked as not having received a third Grok review.
7. Review sources, gaps, versions, findings and costs. Edit and save as needed.
   Human edits are marked as not reviewed by Grok. Supply a review note and check
   explicit approval before publishing. Rejection keeps the assignment history.

Outlet labels are editorial classifications, not proof of truth or neutrality.
No model certifies an article as unbiased. Findings and claim maps still need
human verification. Source text and model output are untrusted data; the models
have no publishing, secret-reading or arbitrary execution tools.

## Durability, failures and publication

Stages, reviews, versions and usage are checkpointed. A renewable global lease
keeps only one worker active. A crashed job can resume after its three-minute
lease expires. Automatic recovery is limited to three attempts. The local worker
polls saved jobs; Cloud Tasks retries a task after an interrupted HTTP request.
Errors require explicit retry from the UI and preserve completed stages. Too few
readable sources requires a new assignment with different outlets, dates or links.

A crash after a provider has accepted a request but before the checkpoint can
cause that stage to be charged again. This is not exactly-once provider execution.
Unknown charges retain the budget reservation. Never retry billing/quota errors
in an unbounded loop.

Draft saves use revision checks. Publication freezes the assignment in a
`publishing` state and preallocates its article ID before inserting. Retrying an
interrupted publication uses that same ID, preventing duplicate articles. A
`Finish publication` action repairs an interruption. Published articles retain
their assignment reference and emit the existing article-created socket event.

## Production deployment preparation

No cloud resources are created by this feature. Before deployment:

- Store provider keys, admin password hash, JWT secrets, and a random worker
  secret of at least 32 characters in Google Secret Manager.
- The existing Docker image can run the web API or, with a command override,
  `node src/assistantWorker.js`. For an always-running local-style worker on
  Cloud Run, CPU must remain allocated with a minimum instance; this adds cost.
  Prefer Cloud Tasks for scale-to-zero operation.
- For Cloud Tasks, create a queue and set `ASSISTANT_QUEUE_MODE=cloud-tasks`,
  `ASSISTANT_TASK_QUEUE=projects/PROJECT/locations/REGION/queues/QUEUE`,
  `ASSISTANT_WORKER_URL=https://WORKER/api/admin/assistant/worker`, and the shared
  `ASSISTANT_WORKER_SECRET` on the API and worker services. Give the API service
  account `roles/cloudtasks.enqueuer` on that queue. Enable the Cloud Tasks API.
- The worker can use the same image and server entry point as the API, with its
  own service account, resource limits, database connection and provider secrets.
  Set its request timeout to 1800 seconds. Queue requests are authorized using a
  constant-time-checked, assignment-bound HMAC. This implementation does not use
  Cloud Run IAM/OIDC invocation: its HTTP endpoint must be reachable by Cloud
  Tasks, while the HMAC protects the processing action. Do not put the secret in
  URLs or logs. Rotate it if exposed and re-dispatch affected queued jobs.
- Set queue dispatch concurrency to one, max attempts to three, and exponential
  retry backoff starting at 30 seconds. A busy worker returns 503 for later retry.
  Task enqueue failures leave jobs saved; admins can retry dispatch.
- Keep admin/API CORS and the mutation Origin allowlist aligned with the actual
  frontend origin. Assistant admin mutations require an allowed Origin and a
  verified configured-admin cookie.
- Optional image storage: configure `ASSISTANT_IMAGE_BUCKET` and, for a CDN,
  `ASSISTANT_IMAGE_PUBLIC_BASE_URL`. Give the API service account object-create
  access. The bucket/CDN must already serve the article images publicly. Uploads
  are content-addressed with create-only preconditions and publicly validated;
  the code never changes bucket permissions. Without a bucket, the existing
  validated inline-image storage remains in use. Rejected assignments do not
  automatically delete shared image objects. Set a suitable retention policy.
- Ensure unique assignment request-ID and source-name indexes exist before
  accepting jobs. Mongoose creates model indexes unless disabled by deployment.
- Release backend/worker before frontend. Configure all three providers' own budget
  controls and run a small paid pilot before enabling general use.

## Costs and data handling

The assistant records model tokens, Parallel search requests, provider/model IDs,
and estimated costs. Parallel defaults to `fast` mode at an estimated $0.001 per
request. `turbo` also defaults to $0.001; `basic` and `advanced` default to $0.005.
Set `ASSISTANT_PARALLEL_SEARCH_MODE` to choose the mode; the request always caps
results at ten to avoid additional-result charges. Pricing can change: verify
[Parallel's current prices](https://parallel.ai/pricing) before enabling billing.
An optional `ASSISTANT_PARALLEL_SEARCH_USD_PER_REQUEST` overrides the estimate;
update or remove that override when changing modes. Free credits are not deducted
from estimates, so this tracker remains conservative.

Before each search, the assistant reserves its configured per-request price;
a successful response settles one request even when there are no results or no
token usage. Before each Luna/Grok call it reserves $0.75 and releases the
difference after receiving usage. Uncertain calls retain the reservation. A job
needs the relevant reservation remaining to start another call. Parallel HTTP
errors/timeouts do not trigger automatic retries inside the search client.
The existing public-HTML reader performs extraction; the paid Parallel Extract
API is not called. Search excerpts are discarded and never used as article evidence.

Reasoning tokens are included when reported. xAI reasoning is conservatively added if surfaced
separately; this can overestimate costs when already included in completion usage.
Cached-input discounts are not assumed. Estimates use configured rates, not
provider invoices. Provider enforcement, changed pricing and in-flight requests
can differ; configure provider-side hard limits as well.

Topic/context, selected domains, and date range are sent to Parallel for search.
Source text, topic/context and drafts are sent to OpenAI for writing and xAI for
review. Luna and Grok receive no hosted web-search tools. The supplied image, private keys and admin credentials are not included
in model prompts. Research evidence stays in the admin database, not reader APIs.
OpenAI Responses storage is disabled. Review current provider retention policies
before production use. Restrict database access and establish evidence retention.

## Validation

```sh
rtk npm test --prefix backend
rtk npm test --prefix frontend -- --watchAll=false --runInBand
rtk npm run build --prefix frontend
```

Tests use provider mocks and local HTTP servers. They do not establish paid API search/model access, live outlet readability, Cloud Tasks delivery, bucket policy,
production MongoDB indexes, or actual editorial quality. The HTML extractor
intentionally fails closed for pages without readable article/main markup or
publication metadata. Dynamic sites may require a future extraction integration.

API references: [Parallel Search](https://docs.parallel.ai/api-reference/search/search),
[OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create),
[xAI structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs).

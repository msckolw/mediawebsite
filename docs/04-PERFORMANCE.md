# 4. Reader and publishing performance

Reviewed October 23, 2026. This guide describes local website/backend changes.
They have not been deployed in this work. The current React Native app was not
changed or tested. See [setup](01-PROJECT-AND-DEPLOYMENT.md) for environments,
[API contracts](02-MOBILE-AND-PAYMENTS.md) for client integration, and
[release checks](03-OPERATIONS-AND-RELEASE.md) before rollout.

## Changes and their purpose

| Area | Current behavior | Benefit |
|---|---|---|
| Feed payload | Website requests `view=feed`; full bodies and sources are omitted | Less JSON download and parsing before showing cards |
| Embedded uploads | Compact responses use separate versioned image URLs | Images can download on demand and reuse HTTP caches |
| Reader images | First story loads eagerly at high priority; later images load lazily, all decode asynchronously | Prioritizes visible content |
| Database reads | Feed list/count run concurrently; schema declares compound sort indexes | Avoids sequential independent query waits |
| Live updates | Initial socket connection reuses HTTP load; mutations/reconnects refresh page one | Removes a duplicate startup fetch while retaining refresh behavior |
| Initial JavaScript | Alert library loads on demand; unused font request removed and legacy icons load without blocking paint | Reduces startup download and blocking resources |
| Google sign-in | Backend fetches/verifies the profile once; website updates its session without a full reload | Avoids duplicate profile requests and page startup |
| Upload preparation | At most 1600 pixels wide, asynchronous WebP encoding, JPEG fallback | Smaller upload payloads and less base64 work |
| Publish feedback | Saved article appears immediately, followed by background reconciliation | Shortens the wait before seeing a successful save |

## Reader payload compatibility

The website uses:

```text
GET /api/news?page=1&view=feed
GET /api/category/:cat?page=1&view=feed
GET /api/news/:id?media=url
GET /api/news/:id?source=true&media=url
```

Compact feeds retain IDs, titles, complete summaries, categories, timestamps,
and pagination. Full bodies load on the detail screen. Default endpoints retain
full bodies and the original inline-image format for older clients. External
image URLs pass through unchanged. See guide 2 for responses and errors.

For embedded images, `imageUrl` becomes an absolute URL under
`/api/news/:id/image?v=...`. The version uses the article timestamp; an edit
changes it. The endpoint returns stored image bytes and an ETag. Matching version
requests use `Cache-Control: public, max-age=86400`; unversioned or mismatched
requests revalidate. It does not proxy remote image hosts or create thumbnails.

Images still reside in the existing article records; this change does not migrate
storage to Cloud Storage or eliminate image bytes between MongoDB and the API.
The JSON reduction excludes separately downloaded images. Set `PUBLIC_API_URL`
to the canonical HTTPS backend origin so generated URLs are correct.

## Upload quality and processing

The website decodes the selected file through a temporary blob URL, resizes it
without upscaling, and encodes WebP at quality 0.82. Browsers without WebP encoding
fall back to JPEG. Base64 is generated only for the prepared upload. Recent
client image checks are shared between preview and submit; server checks remain
authoritative. Publishing is disabled while image preparation is in progress.

Server requirements for new/replacement images:

| Requirement | Limit |
|---|---|
| Formats | JPEG, PNG, WebP |
| Maximum bytes | 10 MB |
| Minimum dimensions | 1200 × 675 pixels |
| Maximum pixel count | 24 megapixels |
| Landscape aspect ratio | 1.2–2.2 |
| Remote URLs | Public HTTPS addresses; each redirect checked and validated address pinned |

Text-only edits do not retroactively reject an unchanged image. Checks establish
format and resolution, not sharpness, watermark absence, authenticity, ownership,
or permission to publish. Remote URL publishing still depends on that host's
latency and availability. No live publishing/upload benchmark was performed.

## Caching and freshness

- Article/list responses use `no-cache` and revalidate; they are not treated as
  indefinitely fresh snapshots.
- Versioned image URLs cache independently, so a new article version does not
  require stale image bytes to be embedded in the feed JSON.
- Service-worker cache `nobias-media-cache-v7` stores public static assets only.
  API, session, payment, non-GET, and cross-origin requests bypass it.
- News mutations and reconnects reload page one and discard older in-flight
  results. Complete homepage summaries are preserved.
- Logout expires the session cookie; analytics requires explicit consent. Neither
  session state nor payment confirmation is served from the static cache.

## Measured local results

| Measurement | Before | After | Reduction |
|---|---:|---:|---:|
| JSON for one saved eight-article feed sample | 55,594 bytes | 10,060 bytes | 82% |
| Compressed initial JavaScript | 108,378 bytes | 88,025 bytes | 19% |

The feed comparison applies the compact response/presentation to the same saved
public sample. The JavaScript comparison uses gzip-compressed production build
assets; build hashes and byte counts can change with future edits. These numbers
measure payload size, not time to first paint, upload duration, mobile startup,
or a production Lighthouse score. No speed guarantee follows from them.

Latest local validation: 49 backend tests, 27 frontend tests, and a successful
frontend production build. Tests cover compact/legacy response compatibility,
image bytes and ETag handling, upload format fallback/quality rejection, feed
reconnection, sign-in/session behavior, and service-worker cache exclusions.

## Release and follow-up measurements

Release the backend before the frontend. Confirm the generated image URLs load,
the canonical origin is configured, and compound news indexes exist in the target
database. No live index migration or hosting configuration change was performed.

Measure a clean browser load and repeat load on a throttled mobile connection.
Record transferred bytes, first visible content, largest contentful paint, layout
shift, long tasks, API time, image time, and publication request duration. Compare
identical content and network conditions; test delayed external image hosts too.
Verify publishing with a real admin in a test environment before production use.

If first requests remain slow, inspect Cloud Run cold-start traces, MongoDB
connection time and region, and browser waterfalls before changing infrastructure.
Minimum instances add cost. Cloud Storage/CDN image migration and current-app
rendering work are possible follow-ups, not completed features.

## Implementation references

- [News routes](../backend/src/routes/newsRoutes.js)
- [Image presentation and caching](../backend/src/services/articleMedia.js)
- [News indexes](../backend/src/models/News.js)
- [Server image validation](../backend/src/services/imagePolicy.js)
- [Reader feed hook](../frontend/src/hooks/useArticleFeed.js)
- [Reader cards and image priority](../frontend/src/components/ArticleFeed.js)
- [Upload preparation](../frontend/src/services/imageUpload.js)
- [Service worker](../frontend/public/service-worker.js)

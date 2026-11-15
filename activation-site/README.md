# ECB activation page

Requested address: https://mandarin-ecb.onrender.com

Local design preview: node preview-server.mjs, http://localhost:4178. Preview states: ?state=ready, ?state=slow, ?state=error. Local mode never contacts production automatically.

Production: node activation-site/build.mjs from repository root. Publish activation-site/dist only. This strips the local badge and enables credential-free health checks against https://ecb-mandarin.onrender.com/api/health. Redirect to the original app only after valid production/Postgres health. Polling occurs only while a visitor is waiting; it is not a scheduled keepalive. After 3 minutes the visitor can retry.

The original app retains its own login cookie, API and data. No credentials are stored on this static page. The app health endpoint allows only this front-page origin, without credential access or CORS for private endpoints.

No new generated mascot: exact existing recommend-panda.webp asset. Local files do not depend on external fonts or CDNs.

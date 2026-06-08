# TTB Label Verification App

## What This Does

This is a prototype compliance review tool for TTB (Alcohol and Tobacco Tax and Trade Bureau) agents. It lets an agent upload an alcohol label image alongside COLA application data and get a field-by-field verification — brand name, ABV, class/type, net contents, government warning, and others — with pass/fail/warning status for each. It was built as a take-home prototype for the TTB AI developer role.

## Stack

- SvelteKit + TypeScript + Tailwind (frontend)
- Node + Express + TypeScript (backend)
- Redis (response caching, batch job state)
- Anthropic Claude Sonnet 4.6 Vision API

## Get It Running

**Prerequisites:** Node 15+ (for `crypto.randomUUID()`), Redis running locally.

```bash
# Install dependencies — run these in separate terminals or sequentially
cd server && npm install
cd client && npm install
```

**Environment setup:**

```bash
cp server/.env.example server/.env
# Edit server/.env and add your Anthropic API key
```

`.env.example`:

```
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
REDIS_URL="redis://localhost:6379"   # optional, defaults to this
CLIENT_URL="http://localhost:5173"   # optional, defaults to this
PORT="3001"                          # optional, defaults to 3001
```

**Start Redis:**

```bash
redis-server
```



**Start both concurrently** (from the root of the mono repo): 
```bash
npm run dev
```
---- OR -----

**Start the backend** (separate terminal):

```bash
cd server && npm run dev
```

**Start the frontend** (separate terminal):

```bash
cd client && npm run dev
```




Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## How It Works

The agent uploads a label image and fills in the COLA application fields; the frontend encodes the image as base64 and POSTs it to the Express backend. The backend strips any data URL prefix, runs an optional image quality preflight to fail fast on unreadable images, then sends the image and a structured prompt to the Anthropic Vision API with a 15-second timeout. The Claude response is validated against a Zod schema — if validation fails, one retry fires with a stricter prompt. Results stream back to the client via Server-Sent Events, so the first field result appears within roughly two seconds while the full analysis finishes in the background. The `overallStatus` (Approved / Review Required / Rejected) is derived deterministically from the parsed field results, not taken from Claude's self-reported verdict. The government warning is validated against a hardcoded statutory constant in `server/src/constants/warnings.ts`, not against user-supplied text. Verified results are cached in Redis with a 4-hour TTL so identical re-submissions skip the API call.

## What the Load Demo Button Does

The `Load Demo` button opens canned review scenarios so the app can be tested without finding a label image or typing COLA data manually.

Each scenario uses:

- A real label image served from `client/static/demo/`
- Matching or intentionally mismatched application data from `client/src/lib/utils/debug-mocks.ts`

Each scenario has two actions:

- `Preview` loads the image and app data, then injects a pre-built `VerificationResult`. It does not call the backend or AI provider.
- `Run` loads the same image and app data, then submits through the normal verification flow. This calls the backend, uses the active AI provider, streams results over SSE, and still uses Redis caching.

The batch demo follows the same pattern: `Preview` loads pre-built batch results, and `Run` submits the images through the batch processing flow.

The important detail is that `Run` is not a fake path. It behaves like a user-uploaded image. If `AI_PROVIDER=anthropic_direct`, it calls Claude. If `AI_PROVIDER=azure_foundry`, it routes through Azure Foundry. If the app is in `mock` mode, the backend returns deterministic mock results and the UI shows that mock mode is active.

## Paste Samples and Test Images

`PASTE_SAMPLES.md` contains sample COLA-style text blocks for the smart paste workflow. Copy one of those blocks, focus the application data form, and paste it. The app will try to fill fields like brand name, class/type, producer, address, alcohol content, net contents, and country of origin.

The samples cover common formats:

- Clean beer, wine, and distilled spirits text
- All-caps legacy-style exports
- Field-labeled text from emails
- Tab-separated rows copied from spreadsheets

`test-images/` contains standalone label images for manual upload testing. These are useful when you want to test image verification directly instead of using the built-in demo menu. Drag them into the app or use the upload button.

## AI Provider / Government Network Strategy

All AI calls are **backend-only**. The browser never talks directly to any AI service — it only sends requests to the Express backend, which handles the AI provider connection.

### Deployment Modes

The backend selects its AI provider via the `AI_PROVIDER` environment variable:

| `AI_PROVIDER` value | When to use | What it does |
|---|---|---|
| `anthropic_direct` | Local prototype, development | Calls `api.anthropic.com` directly using `ANTHROPIC_API_KEY` |
| `azure_foundry` | Production / agency egress | Routes through an Azure AI Foundry deployment; requires `AZURE_FOUNDRY_*` vars |
| `mock` | Demos, training, restricted networks | Returns deterministic simulated results; no outbound AI traffic |

If `AI_PROVIDER` is not set, the server defaults to `anthropic_direct` when `ANTHROPIC_API_KEY` is present, and falls back to `mock` automatically if no API key is found. Mock mode is logged at startup and displayed prominently in the UI.

### Government Network Deployment

Direct access to `api.anthropic.com` is not acceptable in most government network environments. The intended production path is:

1. Set `AI_PROVIDER=azure_foundry`
2. Provision an Azure AI Foundry deployment in an approved Azure Government region
3. Route all AI calls through that endpoint — no direct internet egress to Anthropic

The provider abstraction is already in place. Once an approved endpoint is available, fill in the `AZURE_FOUNDRY_*` variables and the app works without any application code changes.

### Provider Health Check

```
GET /api/ai/health
```

Returns:

```json
{
  "provider": "anthropic_direct",
  "configured": true,
  "available": true,
  "mode": "real",
  "message": "Claude API reachable"
}
```

The frontend polls this on page load and shows a badge in the header. In mock mode the badge is amber and a warning banner appears — so reviewers always know whether results are real.

### Mock Mode

Mock mode is safe to use in:

- Restricted-network environments where no AI egress is approved yet
- Demos and training sessions
- UI development and integration testing

Mock results are labeled `[Mock — AI provider not active]` in every field and the `imageNotes` field explicitly states that no image analysis was performed. Do not use mock results for real compliance decisions.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `AI_PROVIDER` | Provider selection — optional | `anthropic_direct` \| `azure_foundry` \| `mock` |
| `ANTHROPIC_API_KEY` | Required for `anthropic_direct` mode | `sk-ant-...` |
| `AZURE_FOUNDRY_ENDPOINT` | Required for `azure_foundry` mode | `https://...` |
| `AZURE_FOUNDRY_API_KEY` | Required for `azure_foundry` mode | — |
| `AZURE_FOUNDRY_DEPLOYMENT` | Required for `azure_foundry` mode | `gpt-4o` |
| `AZURE_FOUNDRY_API_VERSION` | Optional, defaults to `2024-02-01` | `2024-02-01` |
| `REDIS_URL` | Redis connection string — optional | `redis://localhost:6379` |
| `CLIENT_URL` | Allowed CORS origin — optional | `http://localhost:5173` |
| `PORT` | Backend port — optional | `3001` |

## Network Requirements

The only outbound AI connection this app makes depends on the active provider:

- `anthropic_direct`: outbound to `api.anthropic.com:443`
- `azure_foundry`: outbound to your Azure Foundry endpoint only
- `mock`: no outbound AI traffic

Redis runs locally. No other external traffic leaves the server.

## Known Limitations

- **Single label per request.** Batch processing UI exists but the backend processes one label at a time with up to 3 concurrent workers per batch job.
- **Response time varies.** Streaming keeps perceived latency low — first result in ~2 seconds — but full analysis takes 4–7 seconds depending on image complexity. The retry path can take up to 30 seconds total if the first call fails Zod validation.
- **Image quality affects accuracy.** Heavily skewed, glared, or low-resolution images may produce `not_found` results on otherwise present fields. A preflight check catches obviously unreadable images early, but degraded-but-legible images are passed through and may produce incomplete output.
- **No COLA system integration.** Application data is entered manually. A production version would pull from TTB's COLA system directly.
- **No persistent storage.** Job results expire after 4 hours. Audit trail and long-term reporting would require durable storage.
- **Rate limiting is in-memory.** Limits reset on server restart and don't share state across instances. `rate-limit-redis` is a drop-in replacement if you need horizontal scaling.

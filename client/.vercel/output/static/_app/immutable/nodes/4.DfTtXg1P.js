import{a as c,f as p}from"../chunks/RnfSjAcc.js";import{j as de,k as x,l as le,n as ce,g as n,o as h,i as s,t as S,q as e,u as i,v as he,w as pe}from"../chunks/CaNPQU-j.js";import{d as ue,s as R,a as Q}from"../chunks/B5W7xRX5.js";import{i as b}from"../chunks/Cy9-SKnC.js";import{e as K,s as Z}from"../chunks/DAO-0LsH.js";var me=p("<button> </button>"),ve=p(`<div class="prose-doc svelte-1xmjmrw"><h2>What This Does</h2> <p>This is a prototype compliance review tool for TTB
                        (Alcohol and Tobacco Tax and Trade Bureau) agents. It
                        lets an agent upload an alcohol label image alongside
                        COLA application data and get a field-by-field
                        verification — brand name, ABV, class/type, net
                        contents, government warning, and others — with
                        pass/fail/warning status for each. Results stream
                        progressively; the first field result appears within
                        roughly two seconds. It was built as a take-home
                        prototype for the TTB AI developer role.</p> <h2>Stack</h2> <ul><li>SvelteKit + TypeScript + Tailwind (frontend)</li> <li>Node + Express + TypeScript (backend)</li> <li>Redis (response caching, batch job state)</li> <li>AI vision via pluggable provider — Claude API
                            (default), Azure AI Foundry (production path), or
                            mock (demo/restricted networks)</li></ul> <h2>How It Works</h2> <p>The agent uploads a label image and fills in the COLA
                        application fields; the frontend encodes the image as
                        base64 and POSTs it to the Express backend. The backend
                        passes the image and a structured prompt to the active
                        AI provider. The response is validated against a Zod
                        schema — if validation fails, one retry fires with a
                        stricter prompt. Results stream back to the client via
                        Server-Sent Events, so the first field result appears in
                        about two seconds while the full analysis finishes in
                        the background. The <code>overallStatus</code> (Approved
                        / Review Required / Rejected) is derived deterministically
                        from the parsed field results, not taken from the AI's
                        self-reported verdict. The government warning is
                        validated against a hardcoded statutory constant in <code>server/src/constants/warnings.ts</code>, not
                        against user-supplied text. Verified results are cached
                        in Redis with a 4-hour TTL so identical re-submissions
                        skip the API call.</p> <h2>AI Provider / Government Network Strategy</h2> <p>All AI calls are <strong>backend-only</strong>. The
                        browser never talks directly to any AI service — it only
                        sends requests to the Express backend, which handles the
                        AI provider connection. The active provider is selected
                        via the <code>AI_PROVIDER</code> environment variable.</p> <div class="table-wrapper"><table><thead><tr><th>AI_PROVIDER value</th><th>When to use</th><th>Outbound traffic</th></tr></thead><tbody><tr><td><code>anthropic_direct</code></td><td>Local development, prototype</td><td><code>api.anthropic.com:443</code></td></tr><tr><td><code>azure_foundry</code></td><td>Production / agency-approved egress</td><td>Your Azure Foundry endpoint only</td></tr><tr><td><code>mock</code></td><td>Demos, training, restricted networks</td><td>None — fully offline</td></tr></tbody></table></div> <p>If <code>AI_PROVIDER</code> is not set, the server
                        defaults to <code>anthropic_direct</code> when <code>ANTHROPIC_API_KEY</code> is present and falls back
                        to <code>mock</code> automatically if no API key is
                        found. Mock mode is logged at startup and shown with an
                        amber warning banner in the UI so reviewers always know
                        whether results are real or simulated.</p> <p><strong>Government network deployment:</strong> Direct
                        access to <code>api.anthropic.com</code> is not
                        acceptable in most government network environments. The
                        intended production path is to set <code>AI_PROVIDER=azure_foundry</code>, provision an
                        Azure AI Foundry deployment in an approved Azure
                        Government region, and route all AI calls through that
                        endpoint — no direct internet egress to Anthropic. The
                        provider abstraction is already in place; once an
                        approved endpoint is available, fill in the <code>AZURE_FOUNDRY_*</code> variables and the app works
                        without any application code changes.</p> <p><strong>Mock mode for restricted environments:</strong> When no AI egress is approved yet, set <code>AI_PROVIDER=mock</code>. The mock provider returns
                        deterministic simulated responses with no outbound
                        traffic — every field is labeled <code>[Mock — AI provider not active]</code> and the UI
                        shows a persistent warning banner. This is safe for
                        demos and training in air-gapped or restricted networks,
                        but must never be used for real compliance decisions.</p> <h2>Environment Variables</h2> <div class="table-wrapper"><table><thead><tr><th>Variable</th><th>Description</th><th>Example</th></tr></thead><tbody><tr><td><code>AI_PROVIDER</code></td><td>Provider selection — <strong>optional</strong>, defaults to <code>anthropic_direct</code> or <code>mock</code></td><td><code>anthropic_direct</code> | <code>azure_foundry</code> | <code>mock</code></td></tr><tr><td><code>ANTHROPIC_API_KEY</code></td><td>Required for <code>anthropic_direct</code></td><td><code>sk-ant-…</code></td></tr><tr><td><code>AZURE_FOUNDRY_ENDPOINT</code></td><td>Required for <code>azure_foundry</code></td><td><code>https://…</code></td></tr><tr><td><code>AZURE_FOUNDRY_API_KEY</code></td><td>Required for <code>azure_foundry</code></td><td>—</td></tr><tr><td><code>AZURE_FOUNDRY_DEPLOYMENT</code></td><td>Required for <code>azure_foundry</code></td><td><code>gpt-4o</code></td></tr><tr><td><code>AZURE_FOUNDRY_API_VERSION</code></td><td>Optional, defaults to <code>2024-02-01</code></td><td><code>2024-02-01</code></td></tr><tr><td><code>REDIS_URL</code></td><td>Redis connection string — <strong>optional</strong></td><td><code>redis://localhost:6379</code></td></tr><tr><td><code>CLIENT_URL</code></td><td>Allowed CORS origin — <strong>optional</strong></td><td><code>http://localhost:5173</code></td></tr><tr><td><code>PORT</code></td><td>Backend port — <strong>optional</strong></td><td><code>3001</code></td></tr></tbody></table></div> <h2>Network Requirements</h2> <p>Outbound AI traffic depends on the active provider:</p> <ul><li><code>anthropic_direct</code>: outbound to <code>api.anthropic.com:443</code></li> <li><code>azure_foundry</code>: outbound to your Azure
                            Foundry endpoint only</li> <li><code>mock</code>: no outbound AI traffic</li></ul> <p>Redis runs locally. No other external traffic leaves the
                        server. To check what provider is currently active and
                        whether it's reachable, call <code>GET /api/ai/health</code>. The frontend header
                        badge reflects this status on every page load.</p></div>`),fe=p(`<div class="prose-doc svelte-1xmjmrw"><p class="lead">Decisions made during the build that aren't obvious from
                        the code, and why they were made.</p> <h2>Provider abstraction for AI calls</h2> <p>All AI calls go through a <code>LabelVisionProvider</code> interface rather than calling the Anthropic SDK directly from
                        verification logic. Three implementations exist: <code>AnthropicProvider</code> (current prototype path), <code>AzureFoundryProvider</code> (production/agency path),
                        and <code>MockProvider</code> (offline/demo). The active
                        provider is selected at startup from the <code>AI_PROVIDER</code> environment variable. No other
                        app code imports from <code>@anthropic-ai/sdk</code> — only
                        the provider layer does. This means the model endpoint can
                        be swapped without touching verification, routing, or batch
                        processing code.</p> <h2>Mock provider for restricted networks</h2> <p>The mock provider was added specifically to address
                        government network egress constraints. Government
                        environments often prohibit outbound connections to
                        commercial AI endpoints during evaluation, procurement,
                        or demo phases. Rather than blocking those scenarios
                        entirely, mock mode lets the app run fully offline —
                        the verification workflow, UI, streaming, and batch
                        processing all function normally, just without real
                        image analysis. Mock responses are clearly labeled in
                        every field and the UI shows a persistent amber warning
                        banner so there is no ambiguity about whether results
                        are real.</p> <h2>Redis over a database</h2> <p>Chose Redis over a traditional database for batch job
                        state. Benefits: sub-millisecond reads for SSE polling,
                        native TTL support for automatic job cleanup, and
                        lightweight enough for a prototype with no persistent
                        storage requirement.</p> <h2>Claude Sonnet 4.6 over GPT-4o</h2> <p>Selected Claude Sonnet 4.6 for vision tasks due to
                        superior structured JSON instruction following,
                        single-pass OCR + reasoning capability for government
                        warning exact-match checks, and competitive pricing at
                        prototype scale (~$0.006/label).</p> <h2>SSE over WebSockets for batch streaming</h2> <p>Server-Sent Events chosen over WebSockets for batch
                        status updates. SSE is unidirectional, simpler to
                        implement, automatically reconnects, and is sufficient
                        for a read-only status stream. WebSockets would be
                        overkill here.</p> <h2>Government warning as a hardcoded constant</h2> <p>Removed government warning from user-supplied
                        application fields entirely. The legally mandated
                        warning text is fixed by statute — it should never vary.
                        The verifier compares label image content against <code>server/src/constants/warnings.ts</code>, not user
                        input. This prevents a class of false positives where
                        submitters paste correct text regardless of what's
                        actually on the label.</p> <h2>Atomic Redis operations via Lua script</h2> <p><code>updateBatchProgress</code> is implemented as a
                        Lua script to prevent race conditions with 3 concurrent
                        workers. A naive read-modify-write in JavaScript would
                        allow two workers finishing simultaneously to overwrite
                        each other's progress count, potentially hanging the SSE
                        stream open forever.</p> <h2>MULTI/EXEC pipeline for label result writes</h2> <p><code>setLabelResult</code> and <code>updateBatchProgress</code> are wrapped in a Redis
                        MULTI/EXEC pipeline so both writes succeed or fail
                        together. Prevents a state where a result key exists in
                        Redis but the batch job's progress never updates, which
                        would cause the SSE client to never see the label
                        complete.</p> <h2>15-second Claude API timeout</h2> <p>Overrode the Anthropic SDK default timeout (10 minutes)
                        with a hard 15 second limit. Enforces the sub-5s SLA at
                        the infrastructure level — a hung Claude call would
                        otherwise block a batch worker slot indefinitely and
                        silently violate the response time requirement.</p> <h2>Data URL stripping before API call</h2> <p>Base64 images arriving with a data URL prefix (<code>data:image/jpeg;base64,…</code>) are stripped before the Anthropic API call. The API
                        rejects prefixed strings with a 400 — this is a common
                        silent failure point when images originate from browser
                        FileReader or certain multer configurations.</p> <h2>Provider errors never reach the browser raw</h2> <p>The route layer catches <code>ProviderError</code> by
                        kind (<code>timeout</code>, <code>auth</code>, <code>rate_limit</code>, <code>endpoint_blocked</code>, <code>unavailable</code>) and converts each to a safe,
                        plain-language message before sending to the client. Raw
                        SDK errors, stack traces, and credential-bearing strings
                        never appear in API responses.</p> <h2>overallStatus derived from field results, not the AI</h2> <p><code>overallStatus</code> is computed deterministically
                        from the parsed <code>FieldResult</code> array after Zod
                        validation, not taken from the AI's response. The
                        AI's self-reported status is ignored. This makes the
                        pass/fail determination authoritative and immune to
                        occasional model misclassification.</p> <h2>Retry is a fresh call, not multi-turn</h2> <p>On Zod validation failure, the retry sends a fresh call
                        with a stricter prompt rather than a multi-turn
                        conversation appending the failed response. A multi-turn
                        approach where the model sees its own malformed output
                        and corrects it would have higher success rates for
                        structural issues. This is a known tradeoff — the
                        current retry improves outcomes by changing prompt
                        strictness but relies on non-determinism rather than
                        targeted correction.</p> <h2>Per-endpoint rate limiting</h2> <p>Rate limits are applied per endpoint rather than
                        globally. Single label verify allows 20 req/min per IP —
                        comfortable headroom for an agent's natural working
                        pace. Batch upload is restricted to 5 req/min per IP
                        since each job is compute and API-credit expensive. SSE
                        streaming endpoints are excluded from rate limiting
                        entirely as they represent long-lived connections, not
                        repeated requests.</p> <h2>504 on provider timeout, not 500</h2> <p>Provider timeout errors are caught explicitly at the
                        route layer and returned as <code>504 Gateway Timeout</code> rather than a generic <code>500</code>. The frontend handles these distinctly,
                        showing a clear timeout message rather than a generic
                        error.</p> <h2>Catastrophic batch failure updates Redis</h2> <p>If <code>processBatch</code> throws at the job level,
                        the <code>.catch</code> handler in the upload route
                        updates <code>job.status</code> to <code>failed</code> in Redis rather than just logging. Prevents jobs getting
                        stuck in <code>processing</code> state forever when the
                        processor crashes entirely.</p> <h2>Two-stage verification with image quality preflight</h2> <p>A fast preflight image quality check runs before full
                        label verification. Poor quality images (cropped,
                        blurry, significant glare) are caught in 1–2 seconds
                        and returned as <code>not_found</code> without
                        triggering a full verification call. Prevents edge cases
                        where the AI spends 8–10 seconds reasoning about
                        unreadable text, keeping the 5 second SLA achievable on
                        clean images while failing fast on bad ones.</p></div>`),ge=p('<span class="speed-detail"> </span>'),be=p('<div class="speed-test-row"><span></span> <span class="speed-label"> </span> <span class="speed-ms"> </span> <!></div>'),ye=p('<div class="speed-test-results"></div>'),we=p(`<p class="speed-note ok">All checks passed. The app is reachable and
                                responding within expected latency.</p>`),Ae=p(`<p class="speed-note err">One or more checks failed. Check that the
                                backend is running and the AI provider is
                                configured.</p>`),ke=p(`<div class="prose-doc svelte-1xmjmrw"><p class="lead">How the app hits sub-5-second perceived latency and
                        where that breaks down.</p> <h2>Run a speed test</h2> <p>This test measures real round-trip latency from your
                        browser to the backend and through the active AI
                        provider. It sends a minimal 1×1 pixel image through
                        the full verification pipeline — the same path a real
                        label takes.</p> <div class="speed-test-box"><button class="speed-test-btn"> </button> <!> <!></div> <h2>Streaming architecture</h2> <p>The backend doesn't wait for the AI to finish before
                        sending anything to the client. As soon as the provider
                        begins returning tokens, the backend parses them
                        incrementally and emits completed <code>FieldResult</code> objects over a Server-Sent
                        Events connection. The frontend renders each field row
                        as it arrives. This means an agent sees meaningful
                        results — brand name, ABV, class/type — within about 2
                        seconds even though full analysis takes 4–7 seconds.</p> <h2>Timing breakdown</h2> <div class="table-wrapper"><table><thead><tr><th>Phase</th><th>Typical duration</th><th>Notes</th></tr></thead><tbody><tr><td>Image resize + upload</td><td>&lt;200ms</td><td>Client-side resize to 1600px max before
                                        POST</td></tr><tr><td>Image quality preflight</td><td>1–2s</td><td>Fast AI call; skips full verify on
                                        unreadable images</td></tr><tr><td>Time to first field result</td><td>~2s</td><td>Stream begins as soon as the AI starts
                                        responding</td></tr><tr><td>Full analysis complete</td><td>4–7s</td><td>Varies with image complexity and field
                                        count</td></tr><tr><td>Retry path (Zod failure)</td><td>up to 30s</td><td>Two sequential 15s-timeout calls back to
                                        back</td></tr><tr><td>Cache hit</td><td>&lt;5ms</td><td>Redis lookup; skips AI entirely</td></tr><tr><td>Mock provider (any path)</td><td>&lt;10ms</td><td>No AI call — fully in-process</td></tr></tbody></table></div> <h2>Redis caching</h2> <p>Verified results are cached in Redis keyed by a hash of
                        the image content and application fields. Cache TTL is 4
                        hours. On a cache hit the full <code>VerificationResult</code> is returned in under
                        5ms — the SSE stream still opens but completes almost
                        instantly. This is most useful during demos and
                        re-reviews of the same label.</p> <h2>Batch concurrency</h2> <p>Batch jobs run with a fixed concurrency limit of 3
                        simultaneous AI calls. This is conservative — the
                        Anthropic API supports higher parallelism — but 3
                        workers keeps the per-job cost predictable and avoids
                        rate limit spikes on an account shared across
                        environments. With 3 workers, a 9-label batch completes
                        in roughly 15–25 seconds total.</p> <h2>Image quality impact</h2> <p>Image quality is the largest variable in response time
                        and accuracy. High-resolution, front-facing, evenly lit
                        labels consistently complete in 4–5 seconds with high
                        confidence scores. Skewed, glared, or low-resolution
                        images either fail the preflight fast (1–2s) or pass
                        through to full analysis and produce more <code>not_found</code> results with lower confidence.
                        There's no in-flight image enhancement — quality that
                        comes in is quality that gets analyzed.</p> <h2>What affects the 5-second SLA</h2> <ul><li><strong>Zod validation failure.</strong> A retry
                            doubles latency. This is rare (&lt;5% of calls) but
                            when it happens it blows past 5 seconds.</li> <li><strong>Image size.</strong> The client resizes
                            before upload, capping at 1600px on the long edge.
                            Larger originals take longer to resize in the
                            browser; the upload itself stays small.</li> <li><strong>Field count.</strong> Labels with more
                            optional fields (sulfite declaration, appellation,
                            age statement, etc.) produce longer AI responses and
                            take slightly longer to stream.</li> <li><strong>Provider latency.</strong> The app has no
                            control over upstream API response times. Under
                            normal conditions this is stable; during peak hours
                            or incidents, all bets are off. Use mock mode to
                            isolate whether slowness is in the app or the
                            provider.</li></ul></div>`),Ie=p(`<div class="prose-doc svelte-1xmjmrw"><p class="lead">Honest accounting of what this prototype doesn't do and
                        where it would need work before production use.</p> <h2>Storage and persistence</h2> <ul><li>Job results expire after 4 hours via Redis TTL. A
                            production deployment would require durable storage
                            (PostgreSQL, etc.) for audit trail and reporting
                            requirements typical of a federal compliance system.</li> <li>On server restart, jobs stuck in <code>processing</code> state older than 30 minutes
                            are marked <code>failed</code>. A production system
                            would want a proper job queue (BullMQ, etc.) with
                            retry logic and dead letter handling.</li></ul> <h2>Azure Foundry integration is a stub</h2> <p>The <code>azure_foundry</code> provider validates config
                        and fails with a clear error, but the actual SDK wiring
                        to call the Azure AI Foundry vision endpoint is not yet
                        implemented. This needs to be completed before
                        production use in a government network environment. The
                        interface contract is defined — the implementation is the
                        remaining work.</p> <h2>Rate limiting</h2> <p>Current <code>express-rate-limit</code> at 20 req/min
                        (verify) and 5 req/min (batch) uses an in-memory store
                        that resets on server restart and doesn't share state
                        across multiple instances. The project already has Redis
                        available — <code>rate-limit-redis</code> is a drop-in
                        replacement store for any scaled or load-balanced
                        deployment.</p> <h2>COLA system integration</h2> <p>This is a standalone proof-of-concept. Application data
                        is entered manually or populated from the demo
                        scenarios. A production version would pull application
                        data directly from TTB's COLA system, eliminating manual
                        entry entirely.</p> <h2>Image quality handling</h2> <p>Degraded images (glare, angle, poor lighting) are
                        flagged with <code>not_found</code> and a note rather
                        than hard rejected, allowing agents to make the final
                        call. MIME type validation is client-declared, not
                        verified against actual file bytes — magic bytes
                        validation would be the correct fix. Current risk is
                        low: the AI provider rejects non-image content
                        regardless, so worst case is wasted API spend on a
                        malformed request.</p> <h2>Concurrency and timeouts</h2> <ul><li>Batch processor is hardcoded to 3 concurrent AI
                            calls. A production system would make this
                            configurable and dynamically tied to provider rate
                            limits.</li> <li>The 15-second timeout gives the AI room to respond
                            on complex or degraded labels. The retry path can
                            take up to 30 seconds total since the route layer
                            enforces no AbortSignal on in-flight calls during
                            retry. A production system would pass a hard
                            deadline into <code>verifyLabel</code> so the route
                            can cancel mid-flight.</li></ul> <h2>Batch edge cases</h2> <ul><li>If every label in a batch fails, the job status
                            resolves to <code>complete</code> rather than <code>failed</code> since all labels are settled.
                            Consumers need to inspect individual <code>BatchLabelItem</code> statuses to determine
                            outcome.</li> <li>Each SSE <code>label</code> event includes the full <code>VerificationResult</code> inline. For large
                            batches this is verbose. A production implementation
                            would stream lightweight status updates and have the
                            client fetch full results on demand.</li></ul> <h2>Retry quality</h2> <p>For structural JSON failures, a multi-turn AI call
                        appending the failed response as an assistant turn would
                        succeed more reliably than a fresh call. Deferred due to
                        prototype time constraints. The current fresh-call retry
                        improves outcomes by tightening the prompt but relies on
                        non-determinism rather than targeted correction.</p> <h2>Node version requirement</h2> <p><code>crypto.randomUUID()</code> requires Node 15+.
                        Ensure the deployment environment meets this requirement.</p></div>`),Te=p('<div class="flex h-full flex-col overflow-hidden"><header class="shrink-0 border-b border-gray-200 bg-white px-6 py-3"><div class="flex items-center justify-between"><div><div class="flex items-center gap-3"><a href="/" class="text-xs font-medium text-gray-500 hover:text-gray-700">← TTB Label Verification</a></div> <h1 class="mt-1 text-lg font-bold text-gray-950">Project Documentation</h1></div></div> <nav class="mt-3 flex gap-1" aria-label="Documentation sections"></nav></header> <div class="min-h-0 flex-1 overflow-y-auto bg-gray-50"><div class="mx-auto max-w-3xl px-6 py-8"><!> <!> <!> <!></div></div></div>');function Ee(G,W){de(W,!0);const P="http://localhost:3000";let y=x("readme");const Y=[{id:"readme",label:"README"},{id:"design",label:"Design Decisions"},{id:"performance",label:"Performance"},{id:"limitations",label:"Known Limitations"}];let I=x(!1),r=x(le([])),w=x(!1);async function J(){i(I,!0),i(w,!1),i(r,[],!0);const t=Date.now();try{await fetch(`${P}/api/health`),i(r,[...e(r),{label:"Server reachable",ms:Date.now()-t,status:"ok"}],!0)}catch{i(r,[...e(r),{label:"Server reachable",ms:Date.now()-t,status:"error",detail:"Could not reach backend"}],!0),i(I,!1),i(w,!0);return}const a=Date.now();let d="unknown",u="unknown";try{const o=await(await fetch(`${P}/api/ai/health`)).json();d=o.mode,u=o.provider,i(r,[...e(r),{label:`AI provider health (${o.provider})`,ms:Date.now()-a,status:o.configured?"ok":"error",detail:o.message}],!0)}catch{i(r,[...e(r),{label:"AI provider health",ms:Date.now()-a,status:"error",detail:"Health endpoint unreachable"}],!0)}const L="/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVIP/2Q==",A=new FormData,O=new Blob([Uint8Array.from(atob(L),m=>m.charCodeAt(0))],{type:"image/jpeg"});A.append("image",O,"speedtest.jpg"),A.append("application",JSON.stringify({beverageType:"distilled_spirits"}));const T=Date.now();let g=null,_=null;try{await new Promise((o,v)=>{const l=new XMLHttpRequest;l.open("POST",`${P}/api/verify/stream`);let f=!1;l.onprogress=()=>{const k=l.responseText;!f&&k.includes('"type":"field"')&&(g=Date.now()-T,f=!0),k.includes("[DONE]")&&(_=Date.now()-T,o())},l.onerror=()=>v(new Error("XHR error")),l.ontimeout=()=>v(new Error("Timed out")),l.timeout=3e4,l.send(A)});const m=d==="mock"?"mock":u==="azure_foundry"?"Azure Foundry":"Claude API";g!==null&&i(r,[...e(r),{label:`Time to first field (${m})`,ms:g,status:g<5e3?"ok":"error",detail:g<5e3?"Within 5s SLA":"Exceeded 5s SLA"}],!0),_!==null&&i(r,[...e(r),{label:`Full verification round-trip (${m})`,ms:_,status:"ok"}],!0)}catch(m){i(r,[...e(r),{label:"End-to-end verification",ms:Date.now()-T,status:"error",detail:m instanceof Error?m.message:"Request failed"}],!0)}i(I,!1),i(w,!0)}var E=Te(),D=n(E),N=h(n(D),2);K(N,21,()=>Y,t=>t.id,(t,a)=>{var d=me(),u=n(d,!0);s(d),S(()=>{Z(d,1,`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${e(y)===e(a).id?"bg-gray-900 text-white":"text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`),R(u,e(a).label)}),Q("click",d,()=>i(y,e(a).id,!0)),c(t,d)}),s(N),s(D);var F=h(D,2),U=n(F),z=n(U);{var $=t=>{var a=ve();c(t,a)};b(z,t=>{e(y)==="readme"&&t($)})}var V=h(z,2);{var X=t=>{var a=fe();c(t,a)};b(V,t=>{e(y)==="design"&&t(X)})}var M=h(V,2);{var ee=t=>{var a=ke(),d=h(n(a),6),u=n(d),L=n(u,!0);s(u);var A=h(u,2);{var O=o=>{var v=ye();K(v,21,()=>e(r),l=>l.label,(l,f)=>{var k=be(),H=n(k),q=h(H,2),re=n(q,!0);s(q);var B=h(q,2),ae=n(B);s(B);var ie=h(B,2);{var se=C=>{var j=ge(),ne=n(j,!0);s(j),S(()=>R(ne,e(f).detail)),c(C,j)};b(ie,C=>{e(f).detail&&C(se)})}s(k),S(()=>{Z(H,1,`speed-dot ${e(f).status==="ok"?"dot-ok":"dot-err"}`),R(re,e(f).label),R(ae,`${e(f).ms??""}ms`)}),c(l,k)}),s(v),c(o,v)};b(A,o=>{e(r).length>0&&o(O)})}var T=h(A,2);{var g=o=>{var v=we();c(o,v)},_=pe(()=>e(w)&&e(r).every(o=>o.status==="ok")),m=o=>{var v=Ae();c(o,v)};b(T,o=>{e(_)?o(g):e(w)&&o(m,1)})}s(d),he(24),s(a),S(()=>{u.disabled=e(I),R(L,e(I)?"Running…":e(w)?"Run Again":"Run Speed Test")}),Q("click",u,J),c(t,a)};b(M,t=>{e(y)==="performance"&&t(ee)})}var te=h(M,2);{var oe=t=>{var a=Ie();c(t,a)};b(te,t=>{e(y)==="limitations"&&t(oe)})}s(U),s(F),s(E),c(G,E),ce()}ue(["click"]);export{Ee as component};

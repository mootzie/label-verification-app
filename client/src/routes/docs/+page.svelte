<script lang="ts">
    type Tab = 'readme' | 'design' | 'performance' | 'limitations'

    let activeTab = $state<Tab>('readme')

    const tabs: { id: Tab; label: string }[] = [
        { id: 'readme', label: 'README' },
        { id: 'design', label: 'Design Decisions' },
        { id: 'performance', label: 'Performance' },
        { id: 'limitations', label: 'Known Limitations' },
    ]
</script>

<div class="flex h-full flex-col overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <a
                        href="/"
                        class="text-xs font-medium text-gray-500 hover:text-gray-700">
                        ← TTB Label Verification
                    </a>
                </div>
                <h1 class="mt-1 text-lg font-bold text-gray-950">
                    Project Documentation
                </h1>
            </div>
        </div>

        <!-- Tabs -->
        <nav class="mt-3 flex gap-1" aria-label="Documentation sections">
            {#each tabs as tab (tab.id)}
                <button
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
                    tab.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
                    onclick={() => (activeTab = tab.id)}>
                    {tab.label}
                </button>
            {/each}
        </nav>
    </header>

    <!-- Content -->
    <div class="min-h-0 flex-1 overflow-y-auto bg-gray-50">
        <div class="mx-auto max-w-3xl px-6 py-8">
            {#if activeTab === 'readme'}
                <div class="prose-doc">
                    <h2>What This Does</h2>
                    <p>
                        This is a prototype compliance review tool for TTB
                        (Alcohol and Tobacco Tax and Trade Bureau) agents. It
                        lets an agent upload an alcohol label image alongside
                        COLA application data and get a field-by-field
                        verification, brand name, ABV, class/type, net contents,
                        government warning, and others, with pass/fail/warning
                        status for each. Results stream progressively; the first
                        field result appears within roughly two seconds. It was
                        built as a take-home prototype for the TTB AI developer
                        role.
                    </p>

                    <h2>Stack</h2>
                    <ul>
                        <li>SvelteKit + TypeScript + Tailwind (frontend)</li>
                        <li>Node + Express + TypeScript (backend)</li>
                        <li>Redis (response caching, batch job state)</li>
                        <li>Anthropic Claude Sonnet 4.6 Vision API</li>
                    </ul>

                    <h2>How It Works</h2>
                    <p>
                        The agent uploads a label image and fills in the COLA
                        application fields; the frontend encodes the image as
                        base64 and POSTs it to the Express backend. The backend
                        strips any data URL prefix, runs an image quality
                        preflight to fail fast on unreadable images, then sends
                        the image and a structured prompt to the Anthropic
                        Vision API with a 15-second timeout. The Claude response
                        is validated against a Zod schema, and if validation
                        fails, one retry fires with a stricter prompt. Results
                        stream back to the client via Server-Sent Events, so the
                        first field result appears in about two seconds while
                        the full analysis finishes in the background. The
                        <code>overallStatus</code>
                        (Approved / Review Required / Rejected) is derived deterministically
                        from the parsed field results, not taken from Claude's self-reported
                        verdict. The government warning is validated against a hardcoded
                        statutory constant in
                        <code>server/src/constants/warnings.ts</code>
                        , not against user-supplied text. Verified results are cached
                        in Redis with a 4-hour TTL so identical re-submissions skip
                        the API call.
                    </p>

                    <h2>Environment Variables</h2>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Variable</th>
                                    <th>Description</th>
                                    <th>Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><code>ANTHROPIC_API_KEY</code></td>
                                    <td>
                                        Anthropic API key: <strong>
                                            required
                                        </strong>
                                    </td>
                                    <td><code>sk-ant-…</code></td>
                                </tr>
                                <tr>
                                    <td><code>REDIS_URL</code></td>
                                    <td>
                                        Redis connection string: <strong>
                                            optional
                                        </strong>
                                    </td>
                                    <td><code>redis://localhost:6379</code></td>
                                </tr>
                                <tr>
                                    <td><code>CLIENT_URL</code></td>
                                    <td>
                                        Allowed CORS origin: <strong>
                                            optional
                                        </strong>
                                    </td>
                                    <td><code>http://localhost:5173</code></td>
                                </tr>
                                <tr>
                                    <td><code>PORT</code></td>
                                    <td>
                                        Backend port: <strong>optional</strong>
                                    </td>
                                    <td><code>3001</code></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h2>Network Requirements</h2>
                    <p>
                        The only outbound connection this app makes is to
                        <code>api.anthropic.com:443</code>
                        . Redis runs locally. No other external traffic leaves the
                        server. If deploying behind a firewall or corporate proxy,
                        <code>api.anthropic.com</code>
                        is the only domain that needs to be allowlisted.
                    </p>
                </div>
            {/if}

            {#if activeTab === 'design'}
                <div class="prose-doc">
                    <p class="lead">
                        Decisions made during the build that aren't obvious from
                        the code, and why they were made.
                    </p>

                    <h2>Redis over a database</h2>
                    <p>
                        Chose Redis over a traditional database for batch job
                        state. Benefits: sub-millisecond reads for SSE polling,
                        native TTL support for automatic job cleanup, and
                        lightweight enough for a prototype with no persistent
                        storage requirement.
                    </p>

                    <h2>Claude Sonnet 4.6 over GPT-4o</h2>
                    <p>
                        Selected Claude Sonnet 4.6 for vision tasks due to
                        superior structured JSON instruction following,
                        single-pass OCR + reasoning capability for government
                        warning exact-match checks, and competitive pricing at
                        prototype scale (~$0.006/label).
                    </p>

                    <h2>SSE over WebSockets for batch streaming</h2>
                    <p>
                        Server-Sent Events chosen over WebSockets for batch
                        status updates. SSE is unidirectional, simpler to
                        implement, automatically reconnects, and is sufficient
                        for a read-only status stream. WebSockets would be
                        overkill here.
                    </p>

                    <h2>Government warning as a hardcoded constant</h2>
                    <p>
                        Removed government warning from user-supplied
                        application fields entirely. The legally mandated
                        warning text is fixed by statute, it should never vary.
                        The verifier compares label image content against
                        <code>server/src/constants/warnings.ts</code>
                        , not user input. This prevents a class of false positives
                        where submitters paste correct text regardless of what's actually
                        on the label.
                    </p>

                    <h2>Atomic Redis operations via Lua script</h2>
                    <p>
                        <code>updateBatchProgress</code>
                        is implemented as a Lua script to prevent race conditions
                        with 3 concurrent workers. A naive read-modify-write in JavaScript
                        would allow two workers finishing simultaneously to overwrite
                        each other's progress count, potentially hanging the SSE stream
                        open forever.
                    </p>

                    <h2>MULTI/EXEC pipeline for label result writes</h2>
                    <p>
                        <code>setLabelResult</code>
                        and
                        <code>updateBatchProgress</code>
                        are wrapped in a Redis MULTI/EXEC pipeline so both writes
                        succeed or fail together. Prevents a state where a result
                        key exists in Redis but the batch job's progress never updates,
                        which would cause the SSE client to never see the label complete.
                    </p>

                    <h2>15-second Claude API timeout</h2>
                    <p>
                        Overrode the Anthropic SDK default timeout (10 minutes)
                        with a hard 15 second limit. Enforces the sub-5s SLA at
                        the infrastructure level, a hung Claude call would
                        otherwise block a batch worker slot indefinitely and
                        silently violate the response time requirement.
                    </p>

                    <h2>Data URL stripping before API call</h2>
                    <p>
                        Base64 images arriving with a data URL prefix (
                        <code>data:image/jpeg;base64,…</code>
                        ) are stripped before the Anthropic API call. The API rejects
                        prefixed strings with a 400, this is a common silent failure
                        point when images originate from browser FileReader or certain
                        multer configurations.
                    </p>

                    <h2>Typed error handling on Claude API responses</h2>
                    <p>
                        Retry logic in <code>labelVerifier.ts</code>
                        uses
                        <code>instanceof Anthropic.APIError</code>
                        and checks
                        <code>.status</code>
                        before deciding whether to retry. Retryable: 429 rate limit.
                        Not retryable: 400 bad request, 401 auth failure. Prevents
                        infinite retry loops on permanent failures.
                    </p>

                    <h2>
                        overallStatus derived from field results, not Claude
                    </h2>
                    <p>
                        <code>overallStatus</code>
                        is computed deterministically from the parsed
                        <code>FieldResult</code>
                        array after Zod validation, not taken from Claude's response.
                        Claude's self-reported status is ignored. This makes the pass/fail
                        determination authoritative and immune to Claude occasionally
                        misclassifying its own output.
                    </p>

                    <h2>Retry is a fresh call, not multi-turn</h2>
                    <p>
                        On Zod validation failure, the retry sends a fresh
                        Claude call with a stricter prompt rather than a
                        multi-turn conversation appending the failed response. A
                        multi-turn approach where Claude sees its own malformed
                        output and corrects it would have higher success rates
                        for structural issues. This is a known tradeoff, the
                        current retry improves outcomes by changing prompt
                        strictness but relies on non-determinism rather than
                        targeted correction.
                    </p>

                    <h2>Per-endpoint rate limiting</h2>
                    <p>
                        Rate limits are applied per endpoint rather than
                        globally. Single label verify allows 20 req/min per IP -
                        comfortable headroom for an agent's natural working
                        pace. Batch upload is restricted to 5 req/min per IP
                        since each job is compute and API-credit expensive. SSE
                        streaming endpoints are excluded from rate limiting
                        entirely as they represent long-lived connections, not
                        repeated requests.
                    </p>

                    <h2>504 on Anthropic timeout, not 500</h2>
                    <p>
                        Anthropic SDK timeout errors are caught explicitly at
                        the route layer and returned as <code>
                            504 Gateway Timeout
                        </code>
                        rather than a generic
                        <code>500</code>
                        . The frontend handles these distinctly, showing a clear timeout
                        message rather than a generic error.
                    </p>

                    <h2>Catastrophic batch failure updates Redis</h2>
                    <p>
                        If <code>processBatch</code>
                        throws at the job level, the
                        <code>.catch</code>
                        handler in the upload route updates
                        <code>job.status</code>
                        to
                        <code>failed</code>
                        in Redis rather than just logging. Prevents jobs getting stuck
                        in
                        <code>processing</code>
                        state forever when the processor crashes entirely.
                    </p>

                    <h2>Two-stage verification with image quality preflight</h2>
                    <p>
                        A fast preflight image quality check runs before full
                        label verification. Poor quality images (cropped,
                        blurry, significant glare) are caught in 1–2 seconds and
                        returned as <code>not_found</code>
                        without triggering a full verification call. Prevents edge
                        cases where Claude spends 8–10 seconds reasoning about unreadable
                        text, keeping the 5 second SLA achievable on clean images
                        while failing fast on bad ones.
                    </p>
                </div>
            {/if}

            {#if activeTab === 'performance'}
                <div class="prose-doc">
                    <p class="lead">
                        How the app hits sub-5-second perceived latency and
                        where that breaks down.
                    </p>

                    <h2>Streaming architecture</h2>
                    <p>
                        The backend doesn't wait for Claude to finish before
                        sending anything to the client. As soon as the Anthropic
                        API begins returning tokens, the backend parses them
                        incrementally and emits completed
                        <code>FieldResult</code>
                        objects over a Server-Sent Events connection. The frontend
                        renders each field row as it arrives. This means an agent
                        sees meaningful results, brand name, ABV, class/type, within
                        about 2 seconds even though full analysis takes 4-7 seconds.
                    </p>

                    <h2>Timing breakdown</h2>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Phase</th>
                                    <th>Typical duration</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Image resize + upload</td>
                                    <td>&lt;200ms</td>
                                    <td>
                                        Client-side resize to 1600px max before
                                        POST
                                    </td>
                                </tr>
                                <tr>
                                    <td>Image quality preflight</td>
                                    <td>1–2s</td>
                                    <td>
                                        Fast Claude call; skips full verify on
                                        unreadable images
                                    </td>
                                </tr>
                                <tr>
                                    <td>Time to first field result</td>
                                    <td>~2s</td>
                                    <td>
                                        Stream begins as soon as Claude starts
                                        responding
                                    </td>
                                </tr>
                                <tr>
                                    <td>Full analysis complete</td>
                                    <td>4–7s</td>
                                    <td>
                                        Varies with image complexity and field
                                        count
                                    </td>
                                </tr>
                                <tr>
                                    <td>Retry path (Zod failure)</td>
                                    <td>up to 30s</td>
                                    <td>
                                        Two sequential 15s-timeout calls back to
                                        back
                                    </td>
                                </tr>
                                <tr>
                                    <td>Cache hit</td>
                                    <td>&lt;5ms</td>
                                    <td>Redis lookup; skips Claude entirely</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h2>Redis caching</h2>
                    <p>
                        Verified results are cached in Redis keyed by a hash of
                        the image content and application fields. Cache TTL is 4
                        hours. On a cache hit the full
                        <code>VerificationResult</code>
                        is returned in under 5ms, the SSE stream still opens but completes
                        almost instantly. This is most useful during demos and re-reviews
                        of the same label.
                    </p>

                    <h2>Batch concurrency</h2>
                    <p>
                        Batch jobs run with a fixed concurrency limit of 3
                        simultaneous Claude calls. This is conservative, the
                        Anthropic API supports higher parallelism, but 3 workers
                        keeps the per-job cost predictable and avoids rate limit
                        spikes on an account shared across environments. With 3
                        workers, a 9-label batch completes in roughly 15-25
                        seconds total.
                    </p>

                    <h2>Image quality impact</h2>
                    <p>
                        Image quality is the largest variable in response time,
                        and accuracy. High-resolution, front-facing, evenly lit
                        labels consistently complete in 4-5 seconds with high
                        confidence scores. Skewed, glared, or low-resolution
                        images either fail the preflight fast (1-2s) or pass
                        through to full analysis and produce more <code>
                            not_found
                        </code>
                        results with lower confidence. There's no in-flight image
                        enhancement, quality that comes in is quality that gets analyzed.
                    </p>

                    <h2>What affects the 5-second SLA</h2>
                    <ul>
                        <li>
                            <strong>Zod validation failure.</strong>
                            A retry doubles latency. This is rare (&lt;5% of calls)
                            but when it happens it blows past 5 seconds.
                        </li>
                        <li>
                            <strong>Image size.</strong>
                            The client resizes before upload, capping at 1600px on
                            the long edge. Larger originals take longer to resize
                            in the browser; the upload itself stays small.
                        </li>
                        <li>
                            <strong>Field count.</strong>
                            Labels with more optional fields (sulfite declaration,
                            appellation, age statement, etc.) produce longer Claude
                            responses and take slightly longer to stream.
                        </li>
                        <li>
                            <strong>Anthropic API latency.</strong>
                            The app has no control over upstream API response times.
                            Under normal conditions this is stable; during peak hours
                            or incidents, all bets are off.
                        </li>
                    </ul>
                </div>
            {/if}

            {#if activeTab === 'limitations'}
                <div class="prose-doc">
                    <p class="lead">
                        Honest accounting of what this prototype doesn't do and
                        where it would need work before production use.
                    </p>

                    <h2>Storage and persistence</h2>
                    <ul>
                        <li>
                            Job results expire after 4 hours via Redis TTL. A
                            production deployment would require durable storage
                            (PostgreSQL, etc.) for audit trail and reporting
                            requirements typical of a federal compliance system.
                        </li>
                        <li>
                            On server restart, jobs stuck in <code>
                                processing
                            </code>
                            state older than 30 minutes are marked
                            <code>failed</code>
                            . A production system would want a proper job queue (BullMQ,
                            etc.) with retry logic and dead letter handling.
                        </li>
                    </ul>

                    <h2>Rate limiting</h2>
                    <p>
                        Current <code>express-rate-limit</code>
                        at 20 req/min (verify) and 5 req/min (batch) uses an in-memory
                        store that resets on server restart and doesn't share state
                        across multiple instances. The project already has Redis available
                        <code>rate-limit-redis</code>
                        is a drop-in replacement store for any scaled or load-balanced
                        deployment.
                    </p>

                    <h2>COLA system integration</h2>
                    <p>
                        This is a standalone proof-of-concept. Application data
                        is entered manually or populated from the demo
                        scenarios. A production version would pull application
                        data directly from TTB's COLA system, eliminating manual
                        entry entirely.
                    </p>

                    <h2>Image quality handling</h2>
                    <p>
                        Degraded images (glare, angle, poor lighting) are
                        flagged with
                        <code>not_found</code>
                        and a note rather than hard rejected, allowing agents to make
                        the final call. MIME type validation is client-declared, not
                        verified against actual file bytes, magic bytes validation
                        would be the correct fix. Current risk is low: the Anthropic
                        API rejects non-image content regardless, so worst case is
                        wasted API spend on a malformed request.
                    </p>

                    <h2>Concurrency and timeouts</h2>
                    <ul>
                        <li>
                            Batch processor is hardcoded to 3 concurrent Claude
                            calls. A production system would make this
                            configurable and dynamically tied to API rate
                            limits.
                        </li>
                        <li>
                            The 15-second timeout gives Claude room to respond
                            on complex or degraded labels. The retry path can
                            take up to 30 seconds total since the route layer
                            enforces no AbortSignal on in-flight calls during
                            retry. A production system would pass a hard
                            deadline into
                            <code>verifyLabel</code>
                            so the route can cancel mid-flight.
                        </li>
                    </ul>

                    <h2>Batch edge cases</h2>
                    <ul>
                        <li>
                            If every label in a batch fails, the job status
                            resolves to
                            <code>complete</code>
                            rather than
                            <code>failed</code>
                            since all labels are settled. Consumers need to inspect
                            individual
                            <code>BatchLabelItem</code>
                            statuses to determine outcome.
                        </li>
                        <li>
                            Each SSE <code>label</code>
                            event includes the full
                            <code>VerificationResult</code>
                            inline. For large batches this is verbose. A production
                            implementation would stream lightweight status updates
                            and have the client fetch full results on demand.
                        </li>
                    </ul>

                    <h2>Retry quality</h2>
                    <p>
                        For structural JSON failures, a multi-turn Claude call
                        appending the failed response as an assistant turn would
                        succeed more reliably than a fresh call. Deferred due to
                        prototype time constraints. The current fresh-call retry
                        improves outcomes by tightening the prompt but relies on
                        non-determinism rather than targeted correction.
                    </p>

                    <h2>Node version requirement</h2>
                    <p>
                        <code>crypto.randomUUID()</code>
                        requires Node 15+. Ensure deployment environment meets this
                        requirement.
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .prose-doc :global(h2) {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 2rem;
        margin-bottom: 0.5rem;
        padding-bottom: 0.375rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .prose-doc :global(h2:first-of-type) {
        margin-top: 0;
    }

    .prose-doc :global(p) {
        font-size: 0.875rem;
        line-height: 1.65;
        color: #374151;
        margin-bottom: 1rem;
    }

    .prose-doc :global(p.lead) {
        font-size: 0.9375rem;
        color: #4b5563;
        margin-bottom: 2rem;
    }

    .prose-doc :global(ul) {
        margin-bottom: 1rem;
        padding-left: 1.25rem;
        list-style-type: disc;
    }

    .prose-doc :global(li) {
        font-size: 0.875rem;
        line-height: 1.65;
        color: #374151;
        margin-bottom: 0.375rem;
    }

    .prose-doc :global(code) {
        font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
        font-size: 0.8125rem;
        background-color: #f1f5f9;
        color: #1e293b;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        border: 1px solid #e2e8f0;
    }

    .prose-doc :global(strong) {
        font-weight: 600;
        color: #0f172a;
    }

    .prose-doc :global(.table-wrapper) {
        overflow-x: auto;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }

    .prose-doc :global(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
    }

    .prose-doc :global(th) {
        background-color: #f8fafc;
        padding: 0.625rem 0.875rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid #e5e7eb;
    }

    .prose-doc :global(td) {
        padding: 0.625rem 0.875rem;
        color: #374151;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
    }

    .prose-doc :global(tr:last-child td) {
        border-bottom: none;
    }

    .prose-doc :global(tr:nth-child(even) td) {
        background-color: #fafafa;
    }
</style>

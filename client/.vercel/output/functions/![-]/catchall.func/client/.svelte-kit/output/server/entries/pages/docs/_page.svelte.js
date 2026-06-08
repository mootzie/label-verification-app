import { h as ensure_array_like, b as attr_class, e as escape_html } from "../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeTab = "readme";
    const tabs = [
      { id: "readme", label: "README" },
      { id: "design", label: "Design Decisions" },
      { id: "performance", label: "Performance" },
      { id: "limitations", label: "Known Limitations" }
    ];
    $$renderer2.push(`<div class="flex h-full flex-col overflow-hidden"><header class="shrink-0 border-b border-gray-200 bg-white px-6 py-3"><div class="flex items-center justify-between"><div><div class="flex items-center gap-3"><a href="/" class="text-xs font-medium text-gray-500 hover:text-gray-700">← TTB Label Verification</a></div> <h1 class="mt-1 text-lg font-bold text-gray-950">Project Documentation</h1></div></div> <nav class="mt-3 flex gap-1" aria-label="Documentation sections"><!--[-->`);
    const each_array = ensure_array_like(tabs);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`)}>${escape_html(tab.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></nav></header> <div class="min-h-0 flex-1 overflow-y-auto bg-gray-50"><div class="mx-auto max-w-3xl px-6 py-8">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="prose-doc svelte-1xmjmrw"><h2>What This Does</h2> <p>This is a prototype compliance review tool for TTB
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
                        badge reflects this status on every page load.</p></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
  });
}
export {
  _page as default
};

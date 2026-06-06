<script lang="ts">
  import type { VerificationResult, FieldStatus } from '$shared/index';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';

  // ── Image state ──────────────────────────────────────────────────────────────
  let imageFile: File | null = $state(null);
  let imagePreviewUrl: string | null = $state(null);
  let isDragging = $state(false);
  let fileInputEl: HTMLInputElement | undefined = $state();

  // ── Form state ───────────────────────────────────────────────────────────────
  let brandName = $state('');
  let productName = $state('');
  let beverageType = $state<'beer' | 'wine' | 'distilled_spirits' | ''>('');
  let alcoholContent = $state('');
  let netContents = $state('');
  let producerName = $state('');
  let producerAddress = $state('');
  let countryOfOrigin = $state('');
  let appellation = $state('');
  let vintageYear = $state('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  let loading = $state(false);
  let result: VerificationResult | null = $state(null);
  let error: string | null = $state(null);

  // Both conditions: image selected AND all required fields filled
  let canSubmit = $derived(
    imageFile !== null &&
    brandName.trim() !== '' &&
    beverageType !== '' &&
    alcoholContent.trim() !== '' &&
    netContents.trim() !== '' &&
    producerName.trim() !== '' &&
    producerAddress.trim() !== ''
  );

  // ── Image handlers ────────────────────────────────────────────────────────────
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  $effect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  });

  function applyFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      error = 'Only JPEG, PNG, and WebP images are accepted';
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imageFile = file;
    imagePreviewUrl = URL.createObjectURL(file);
    if (fileInputEl) fileInputEl.value = '';
    error = null;
  }

  function onFileInputChange(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) applyFile(f);
  }

  function onDragOver(e: DragEvent) { e.preventDefault(); isDragging = true; }
  function onDragLeave() { isDragging = false; }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const f = e.dataTransfer?.files[0];
    if (f) applyFile(f);
  }

  function onDropZoneKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') fileInputEl?.click();
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!imageFile || !canSubmit) return;

    loading = true;
    result = null;
    error = null;

    const application: Record<string, string> = {
      brandName,
      beverageType,
      alcoholContent,
      netContents,
      producerName,
      producerAddress,
    };
    if (productName.trim()) application.productName = productName.trim();
    if (countryOfOrigin.trim()) application.countryOfOrigin = countryOfOrigin.trim();
    if (appellation.trim()) application.appellation = appellation.trim();
    if (vintageYear.trim()) application.vintageYear = vintageYear.trim();

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('application', JSON.stringify(application));

    try {
      const res = await fetch('/api/verify', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        error = data.error ?? 'Verification failed';
      } else {
        result = data as VerificationResult;
      }
    } catch {
      error = 'Network error — please try again';
    } finally {
      loading = false;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function formatFieldName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  const STATUS_LABEL: Record<FieldStatus, string> = {
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
    not_found: 'Not Found',
  };

  const OVERALL_LABEL: Record<string, string> = {
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
  };
</script>

<main class="mx-auto max-w-[800px] px-4 py-8">
  <nav class="mb-8 flex gap-4 border-b pb-4">
    <a href="/" class="font-medium text-blue-600">Single Label</a>
    <a href="/batch" class="text-gray-600 hover:text-blue-600">Batch Upload</a>
  </nav>

  <h1 class="mb-6 text-xl font-semibold">TTB Label Verification</h1>

  <form onsubmit={handleSubmit} class="space-y-4">

    <!-- ── Section 1: Image Upload ─────────────────────────────────────────── -->
    <Card>
      <CardHeader><CardTitle>Label Image</CardTitle></CardHeader>
      <CardContent>
        <input
          bind:this={fileInputEl}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          aria-label="Upload label image"
          onchange={onFileInputChange}
        />

        {#if imagePreviewUrl}
          <div class="mb-3 flex flex-col items-center gap-3">
            <img
              src={imagePreviewUrl}
              alt="Label preview"
              class="max-h-64 max-w-full rounded border object-contain"
            />
            <p class="text-sm text-gray-500">{imageFile?.name}</p>
            <button
              type="button"
              class="text-sm text-blue-600 hover:underline"
              onclick={() => fileInputEl?.click()}
            >
              Replace image
            </button>
          </div>
        {:else}
          <!-- svelte-ignore a11y_interactive_supports_focus -->
          <div
            role="button"
            tabindex="0"
            aria-label="Click or drag to upload a label image"
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-12 text-center transition-colors
              {isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}"
            ondragover={onDragOver}
            ondragleave={onDragLeave}
            ondrop={onDrop}
            onclick={() => fileInputEl?.click()}
            onkeydown={onDropZoneKeydown}
          >
            <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p class="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
            <p class="text-xs text-gray-400">JPEG, PNG, WebP · max 10 MB</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- ── Section 2: Application Fields ──────────────────────────────────── -->
    <Card>
      <CardHeader><CardTitle>Application Data</CardTitle></CardHeader>
      <CardContent class="space-y-4">

        <p class="text-xs text-gray-400">* Required</p>

        <!-- Required fields -->
        <div class="space-y-3">
          <div>
            <label for="brandName" class="mb-1 block text-sm font-medium text-gray-700">Brand Name *</label>
            <input id="brandName" type="text" bind:value={brandName}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label for="beverageType" class="mb-1 block text-sm font-medium text-gray-700">Beverage Type *</label>
            <select id="beverageType" bind:value={beverageType}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select type</option>
              <option value="beer">Beer</option>
              <option value="wine">Wine</option>
              <option value="distilled_spirits">Distilled Spirits</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="alcoholContent" class="mb-1 block text-sm font-medium text-gray-700">Alcohol Content *</label>
              <input id="alcoholContent" type="text" placeholder="e.g. 12.5% ALC/VOL" bind:value={alcoholContent}
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label for="netContents" class="mb-1 block text-sm font-medium text-gray-700">Net Contents *</label>
              <input id="netContents" type="text" placeholder="e.g. 750 mL" bind:value={netContents}
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label for="producerName" class="mb-1 block text-sm font-medium text-gray-700">Producer Name *</label>
            <input id="producerName" type="text" bind:value={producerName}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label for="producerAddress" class="mb-1 block text-sm font-medium text-gray-700">Producer Address *</label>
            <input id="producerAddress" type="text" bind:value={producerAddress}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <Separator />

        <!-- Optional fields -->
        <div class="space-y-3">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Optional</p>

          <div>
            <label for="productName" class="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
            <input id="productName" type="text" bind:value={productName}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label for="countryOfOrigin" class="mb-1 block text-sm font-medium text-gray-700">Country of Origin</label>
            <input id="countryOfOrigin" type="text" bind:value={countryOfOrigin}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="appellation" class="mb-1 block text-sm font-medium text-gray-700">Appellation</label>
              <input id="appellation" type="text" placeholder="Wine only" bind:value={appellation}
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label for="vintageYear" class="mb-1 block text-sm font-medium text-gray-700">Vintage Year</label>
              <input id="vintageYear" type="text" placeholder="Wine only" bind:value={vintageYear}
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div class="pt-2">
          <Button
            type="submit"
            disabled={!canSubmit || loading}
            class="w-full"
          >
            {#if loading}
              <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Verifying…
            {:else}
              Verify Label
            {/if}
          </Button>
        </div>

      </CardContent>
    </Card>

    <!-- ── Error ───────────────────────────────────────────────────────────── -->
    {#if error}
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    {/if}

  </form>

  <!-- ── Section 3: Results ──────────────────────────────────────────────── -->
  {#if result}
    <Card class="mt-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Verification Results</CardTitle>
          <Badge variant={result.overallStatus} class="text-sm px-3 py-1">
            {OVERALL_LABEL[result.overallStatus]}
          </Badge>
        </div>
        {#if result.processingTimeMs !== undefined}
          <p class="text-xs text-gray-400">Completed in {result.processingTimeMs} ms</p>
        {/if}
      </CardHeader>
      <CardContent class="space-y-1">
        {#each result.fields as field}
          <div class="rounded-md border border-gray-100 p-3">
            <div class="flex items-center gap-2">
              <span class="w-36 shrink-0 text-sm font-medium text-gray-700">
                {formatFieldName(field.fieldName)}
              </span>
              <span class="flex-1 truncate text-sm text-gray-500" title={field.expectedValue ?? ''}>
                {#if field.expectedValue}{field.expectedValue}{:else}<span class="italic">—</span>{/if}
              </span>
              <span class="flex-1 truncate text-sm text-gray-900" title={field.foundValue ?? ''}>
                {#if field.foundValue}{field.foundValue}{:else}<span class="italic text-gray-400">not found</span>{/if}
              </span>
              <Badge variant={field.status}>
                {STATUS_LABEL[field.status]}
              </Badge>
            </div>
            {#if field.notes}
              <p class="mt-1 pl-36 text-xs text-gray-500">{field.notes}</p>
            {/if}
          </div>
        {/each}
      </CardContent>
    </Card>
  {/if}

</main>
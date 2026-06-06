<script lang="ts">
  import { cn } from '$lib/utils';
  interface Props { value?: number; class?: string; }
  let { value = 0, class: className = '' }: Props = $props();
  const pct = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
  <div class="h-full bg-gray-900 transition-all duration-300" style="width: {pct}%"></div>
</div>

<script lang="ts">
  import { cn } from '$lib/utils';
  interface Props { class?: string; orientation?: 'horizontal' | 'vertical'; }
  let { class: className = '', orientation = 'horizontal' }: Props = $props();
</script>

<div
  role="separator"
  class={cn(
    orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
    'bg-gray-200',
    className
  )}
></div>

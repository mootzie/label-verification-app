<script lang="ts">
  import { cn } from '$lib/utils';
  interface Props { variant?: 'default' | 'destructive'; class?: string; children?: import('svelte').Snippet; }
  let { variant = 'default', class: className = '', children }: Props = $props();
  const variants: Record<string, string> = {
    default: 'border-gray-200 bg-gray-50 text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
  };
</script>
<div role="alert" class={cn('relative w-full rounded-lg border p-4', variants[variant], className)}>
  {@render children?.()}
</div>

<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg';
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    disabled = false,
    title,
    type = 'button',
    class: className = '',
    onclick,
    children,
  }: Props = $props();

  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants: Record<string, string> = {
    default: 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-900',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  };

  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-6 text-base',
  };
</script>

<button
  {type}
  {disabled}
  {title}
  class={cn(base, variants[variant], sizes[size], className)}
  {onclick}
>
  {@render children?.()}
</button>

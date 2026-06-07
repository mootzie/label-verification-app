<script lang="ts">
    import { cn } from '$lib/utils'

    interface Props {
        variant?:
            | 'default'
            | 'pass'
            | 'warning'
            | 'fail'
            | 'not_found'
            | 'outline'
        class?: string
        children?: import('svelte').Snippet
    }

    let {
        variant = 'default',
        class: className = '',
        children,
    }: Props = $props()

    const variants: Record<string, string> = {
        default: 'bg-gray-100 text-gray-800',
        pass: 'bg-green-600 text-white',
        warning: 'bg-amber-500 text-white',
        fail: 'bg-red-600 text-white',
        not_found: 'bg-gray-500 text-white',
        outline: 'border border-gray-300 text-gray-700',
    }
</script>

<span
    class={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-sm whitespace-nowrap tracking-wide',
        variants[variant],
        className
    )}
>
    {@render children?.()}
</span>

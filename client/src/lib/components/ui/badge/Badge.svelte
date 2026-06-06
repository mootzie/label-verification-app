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
        pass: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        fail: 'bg-red-100 text-red-800',
        not_found: 'bg-gray-100 text-gray-500',
        outline: 'border border-gray-300 text-gray-700',
    }
</script>

<span
    class={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium max-w-fit',
        variants[variant],
        className
    )}
>
    {@render children?.()}
</span>

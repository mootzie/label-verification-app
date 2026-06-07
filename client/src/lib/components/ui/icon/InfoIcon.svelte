<script lang="ts">
    let { size = 18, className = '' } = $props<{
        size?: number
        className?: string
    }>()
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
    aria-hidden="true"
>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
</svg>

<script lang="ts">
    let { size = 22, className = '' } = $props<{
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
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
    aria-hidden="true"
>
    <path d="M12 3v18" />
    <path d="M5 6h14" />
    <path d="M6 6l-3 7h6L6 6z" />
    <path d="M18 6l-3 7h6l-3-7z" />
    <path d="M9 21h6" />
</svg>

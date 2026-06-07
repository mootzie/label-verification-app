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
    <path d="M5 21V4" />
    <path d="M5 4h11l-1 4 1 4H5" />
</svg>

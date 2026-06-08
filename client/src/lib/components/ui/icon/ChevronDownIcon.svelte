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
    <path d="M6 9l6 6 6-6" />
</svg>

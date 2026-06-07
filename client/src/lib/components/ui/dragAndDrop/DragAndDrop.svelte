<script lang="ts">
    interface Props {
        globalDragActive: boolean
    }
    let { globalDragActive }: Props = $props()
</script>

{#if globalDragActive}
    <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-[2px]"
    >
        <div
            class="rounded-2xl border-2 border-dashed border-blue-400 bg-white/95 px-16 py-12 text-center shadow-2xl"
        >
            <svg
                class="mx-auto mb-4 h-14 w-14 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
            </svg>
            <p class="text-lg">Drop anywhere to add labels</p>
            <p class="mt-2 text-sm font-medium">Multiple files supported</p>
        </div>
    </div>
{/if}

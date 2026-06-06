<script lang="ts">
    import type { Snippet } from 'svelte';
    import { fly } from 'svelte/transition';

    let { text, children }: { text: string, children: Snippet } = $props();
    let visible = $state(false);
</script>

<div 
    class="relative inline-block"
    onmouseenter={() => visible = true}
    onmouseleave={() => visible = false}
>
    {@render children()}
    
    {#if visible && text}
        <div 
            transition:fly={{ y: 4, duration: 150 }}
            class="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg"
        >
            {text}
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    {/if}
</div>

<script lang="ts">
    import { fly } from 'svelte/transition';
    import type { FieldResult } from '$shared/index';

    let { fr }: { fr: FieldResult | undefined } = $props();
</script>

{#if fr && fr.status !== 'pass'}
    <div class="mt-2 space-y-1 rounded border border-gray-100 bg-gray-50/50 p-2" in:fly={{ y: -4, duration: 150 }}>
        <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-red-600">Observed</span>
            <span class="text-sm text-gray-700">
                {#if fr.foundValue}{fr.foundValue}{:else}not found{/if}
            </span>
        </div>
        {#if fr.notes}
            <div class="flex items-start gap-2 border-t border-gray-100 pt-1 mt-1">
                <span class="text-[10px] font-bold uppercase text-blue-600">Note</span>
                <p class="text-xs text-gray-600 italic">"{fr.notes}"</p>
            </div>
        {/if}
    </div>
{/if}

<script lang="ts">
    import type { FieldResult } from '$shared/index';
    let { fr }: { fr: FieldResult | undefined } = $props();
</script>

{#if fr && fr.status !== 'pass'}
    <div class="mt-2 rounded border border-gray-200 bg-white p-2.5 space-y-1.5">
        <div class="flex items-start gap-2">
            <span class="text-xs font-bold uppercase tracking-wide text-gray-500 shrink-0 mt-0.5">Found</span>
            <span class="text-sm font-medium text-gray-900">
                {#if fr.foundValue}{fr.foundValue}{:else}<em class="text-gray-400 font-normal">not found on label</em>{/if}
            </span>
        </div>
        {#if fr.notes}
            <div class="flex items-start gap-2 border-t border-gray-100 pt-1.5">
                <span class="text-xs font-bold uppercase tracking-wide text-gray-500 shrink-0 mt-0.5">Why</span>
                <p class="text-xs text-gray-700">{fr.notes}</p>
            </div>
        {/if}
    </div>
{/if}

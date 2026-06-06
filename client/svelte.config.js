import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    vitePlugin: {
        inspector: {
            toggleKeyCombo: 'meta-shift',
            holdMode: true,
            showToggleButton: 'always',
            toggleButtonPos: 'top-right',
        },
    },
    kit: {
        adapter: adapter(),
        alias: {
            $shared: '../server/src/types',
        },
    },
}

export default config

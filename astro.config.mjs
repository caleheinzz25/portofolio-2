// @ts-check
import { defineConfig, envField } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: node({
        mode: 'standalone'
    }),
    integrations: [solidJs()],
    env: {
        schema: {
            GITHUB_ACCESS_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
        }
    }
});

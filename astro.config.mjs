// @ts-check
import { defineConfig, envField } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [solidJs()],
  vite: {
    plugins: [tailwindcss()]
  },
  env: {
    schema: {
      GITHUB_ACCESS_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      })
    }
  }
});


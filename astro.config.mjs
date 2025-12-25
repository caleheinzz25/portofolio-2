// @ts-check
import { defineConfig, envField } from 'astro/config';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  output: 'static',
  integrations: [solidJs()],
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

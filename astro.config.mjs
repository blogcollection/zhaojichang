import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://zhaojichang.cyou',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});

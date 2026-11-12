// Astro beállítások. Statikus oldal: minden oldal build közben elkészül HTML-ként.
import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://magveto-koncepcio.vercel.app',
  trailingSlash: 'never',
  build: { format: 'directory' },
});

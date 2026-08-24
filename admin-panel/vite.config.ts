import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Production builds are served by the backend under the `/admin` path
// (see app.js), so asset URLs need that prefix. The dev server keeps
// running at the root so `npm run dev` behaves as before.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/admin/' : '/',
}))

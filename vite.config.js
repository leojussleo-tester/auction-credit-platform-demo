import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/auction-credit-platform-demo/',
  plugins: [react()],
});

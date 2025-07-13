import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 设置为相对路径
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: { 
      alias: { '@': path.resolve(__dirname, '.') } 
    },
    build: { 
      outDir: 'dist', 
      assetsDir: 'assets', 
      sourcemap: false, // جلوگیری از ساخت نقشه سورس و حذف پوشه src از مرورگر
      minify: 'esbuild',
    },
    esbuild: {
      drop: ['console', 'debugger'], // حذف کامل لاگ‌ها
      legalComments: 'none',        // حذف کامنت‌های توضیحی
    },
  };
});

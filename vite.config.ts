import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173, 
        host: '0.0.0.0',
        proxy: {
          // 这里的配置是关键：将所有 /api 开头的请求转发到 3001 端口
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            // 确保路径被正确转发
            rewrite: (path) => path
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
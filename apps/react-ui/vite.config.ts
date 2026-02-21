import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, '../../')
  const env = loadEnv(mode, rootEnvDir, '')
  const localWebApiPort = Number(env.VITE_WEB_API_PORT || 0) || 3000

  return {
    plugins: [react(), tailwindcss()],
    envDir: rootEnvDir,
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      proxy: {
        '/api/v1.0/randomnumber': {
          target: 'https://www.randomnumberapi.com',
          changeOrigin: true,
        },
        '/sse/trades': {
          target: `http://localhost:${localWebApiPort}`,
          changeOrigin: true,
        },
        '/db/history': {
          target: `http://localhost:${localWebApiPort}`,
          changeOrigin: true,
        }
      },
    }
  }
});
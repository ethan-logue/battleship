import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    define: {
      'process.env.DB_HOST': JSON.stringify(env.DB_HOST),
      'process.env.DB_USER': JSON.stringify(env.DB_USER),
      'process.env.DB_PASSWORD': JSON.stringify(env.DB_PASSWORD),
      'process.env.DB_NAME': JSON.stringify(env.DB_NAME),
      'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET),
      'process.env.REACT_APP_BASE_URL': JSON.stringify(env.REACT_APP_BASE_URL)
    },
    plugins: [react()],
    build: {
      outDir: 'dist'
    }
  }
})

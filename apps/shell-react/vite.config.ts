import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4400,
    proxy: {
      '/vlg_service_v1': {
        target: 'http://165.232.184.121:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // The backend's security layer 403s requests whose Origin header doesn't match
          // an allow-list. changeOrigin only rewrites Host, so strip Origin/Referer here
          // to make proxied requests look like same-origin requests, matching curl's behavior.
          proxy.on('proxyReq', (proxyReq, req: IncomingMessage) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
            void req
          })
        },
      },
    },
  },
})

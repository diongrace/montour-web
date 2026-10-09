import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Toujours le port 5173 : c'est la seule adresse autorisée par le backend (CORS).
  server: {
    port: 5173,
    strictPort: true,
    // Accessible depuis un téléphone sur le même Wi-Fi (http://<adresse-du-PC>:5173).
    host: true,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: 'https://github.com/arpitjhajharia/LEDTool9/', // Add this line - use your exact GitHub repo name here
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { api } from './lib/api'

// Wake up the backend on startup
const wakeBackend = async () => {
  try {
    await api.get('/health', { timeout: 5000 })
  } catch (error) {
    console.log('Backend health check failed or timed out, but continuing...')
  }
}

// Start the app
const startApp = async () => {
  await wakeBackend()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

startApp()

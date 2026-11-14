import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { api } from './lib/api'

// Render immediately — never block first paint on a backend health check.
// The check runs in the background to warm up a sleeping Render instance.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

api.get('/health', { timeout: 5000 }).catch(() => {
  // Backend may be asleep or unreachable — pages show their own errors.
})

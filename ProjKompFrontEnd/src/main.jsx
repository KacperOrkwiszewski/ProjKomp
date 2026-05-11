import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { THEME_STORAGE_KEY, getPreferredTheme } from './utils/ThemeUtils.ts'

if (typeof document !== 'undefined') {
  const theme = getPreferredTheme()
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <PrimeReactProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PrimeReactProvider>
    </Router>
  </StrictMode>,
)

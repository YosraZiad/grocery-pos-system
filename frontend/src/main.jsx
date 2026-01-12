import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from './context/I18nContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

// إنشاء QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
      <App />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

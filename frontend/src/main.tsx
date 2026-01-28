import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n/config'
import './index.css'
import App from './App.tsx'
import { initEImzo } from './vendors/e-imzo-func'

// Инициализация e-imzo при старте приложения
initEImzo()

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Умная логика retry: не retry для клиентских ошибок (4xx)
      retry: (failureCount, error: any) => {
        // Не retry для ошибок авторизации/доступа (401, 403)
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false
        }
        // Не retry для ошибок "не найдено" (404)
        if (error?.response?.status === 404) {
          return false
        }
        // Для остальных ошибок - максимум 1 retry
        return failureCount < 1
      },
      // Экспоненциальная задержка между retries (1s, 2s, max 30s)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // 30 seconds
    },
    mutations: {
      // Для мутаций обычно не нужны retries
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)

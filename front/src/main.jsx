import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/modify" element={<ModifyPage />} />
          <Route path="/delete" element={<DeletePage />} />

        </Routes>
      </QueryClientProvider>
    </BrowserRouter>

  </StrictMode>,
)

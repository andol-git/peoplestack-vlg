import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import './index.css'
import App from './App.tsx'

// Required for antd DatePicker to parse manually-typed dates against a custom `format` (e.g. DD-MM-YYYY).
dayjs.extend(customParseFormat)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

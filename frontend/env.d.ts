/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_FB_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_DATABASE_ID?: string  // opcional, para database não-default
  
  // Supabase
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Sienge (optional)
  readonly VITE_SIENGE_SUBDOMAIN?: string
  readonly VITE_SIENGE_API_USER?: string
  readonly VITE_SIENGE_API_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

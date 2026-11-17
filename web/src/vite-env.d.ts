/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" = el panel usa la API simulada de lib/mockApi.ts (sin backend). */
  readonly VITE_MOCK_API?: string;
  /** "1" = build de la demo pública (/demo): mock + entrada directa + aviso de demo. */
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

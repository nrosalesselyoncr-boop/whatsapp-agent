// ─────────────────────────────────────────────────────────────────────────────
// Tono del avatar con iniciales (bandeja de WhatsApp, lista de clientes): uno de cinco
// tonos de estado (verde, azul, rosa, ámbar, gris; ver .avatar-tone-* en global.css),
// estable para la misma persona. Es decoración: no comunica nada por sí solo.
// ─────────────────────────────────────────────────────────────────────────────

const TONES = 5;

/** Clase `avatar-tone-1`…`avatar-tone-5` según un id (siempre la misma para el mismo id). */
export function avatarToneClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `avatar-tone-${(hash % TONES) + 1}`;
}

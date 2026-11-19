// ─────────────────────────────────────────────────────────────────────────────
// Ids de la semilla del mock que se enlazan desde AFUERA del mock (el recorrido de la demo
// pública y landing/whatsapp-ia.html). Viven acá, sin importar el mock, para que el panel
// real no arrastre los datos ficticios a su bundle.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Conversación de la clínica dental (negocio 1 del mock) en la que el agente agenda una
 * cita: la segunda del arranque (`head[1] = "booking"` en whatsappMock.ts, que la genera con
 * `conversationId(1, 2)`). test/unit/demo.test.ts verifica que el sitio enlaza esta misma.
 */
export const DEMO_BOOKING_CONVERSATION_ID = "da000000-0000-4000-8100-000000000002";

import { formatInt } from "../../modules/whatsapp/format";
import { useWhatsappSummary } from "../../modules/whatsapp/whatsappApi";

/**
 * Contador de WhatsApp IA en el menú (`GET /whatsapp/summary`, el mismo resumen de la
 * tarjeta del Inicio; se refresca solo cada minuto). El resaltador es SOLO para lo que
 * espera a una persona (`conversationsWaiting`, el mismo número del Inicio); si nadie
 * espera pero hay conversaciones abiertas (las atiende el agente), va un contador neutro.
 * El número es aria-hidden y se anuncia como descripción del enlace (`idPrefix-whatsapp`).
 * Solo se monta si la sección está abierta para la sesión, así que no consulta nada en
 * planes sin el módulo.
 */
export function WhatsappCount({ idPrefix = "nav-count" }: { idPrefix?: string }) {
  const { data } = useWhatsappSummary();
  const waiting = data?.conversationsWaiting ?? 0;
  const open = data?.openConversations ?? 0;
  if (waiting <= 0 && open <= 0) return null;
  const shown = waiting > 0 ? waiting : open;
  const description =
    waiting > 0
      ? waiting === 1
        ? "Una conversación espera a una persona"
        : `${formatInt(waiting)} conversaciones esperan a una persona`
      : open === 1
        ? "Una conversación abierta, la atiende el agente"
        : `${formatInt(open)} conversaciones abiertas, las atiende el agente`;
  return (
    <>
      <span className={"nav-count" + (waiting > 0 ? "" : " nav-count-neutral")} aria-hidden="true">
        {shown > 99 ? "99+" : formatInt(shown)}
      </span>
      <span id={`${idPrefix}-whatsapp`} hidden>
        {description}
      </span>
    </>
  );
}

/** Punto resaltado en "Más" (barra inferior) cuando WhatsApp IA vive en la hoja y alguien espera. */
export function WaitingDot() {
  const { data } = useWhatsappSummary();
  const waiting = data?.conversationsWaiting ?? 0;
  if (waiting <= 0) return null;
  return (
    <>
      <span className="bottom-nav-count" aria-hidden="true">
        {waiting > 99 ? "99+" : formatInt(waiting)}
      </span>
      <span className="visually-hidden">
        {waiting === 1 ? ", una conversación espera a una persona" : `, ${formatInt(waiting)} conversaciones esperan a una persona`}
      </span>
    </>
  );
}

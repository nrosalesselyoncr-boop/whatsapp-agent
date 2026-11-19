import { useState } from "react";
import { Link } from "react-router-dom";
import { IS_DEMO } from "../../lib/mockMode";
import { readStorage, writeStorage } from "../../lib/storage";
import { DEMO_BOOKING_CONVERSATION_ID } from "../../lib/demoIds";

/** Cerrado por el visitante (en sessionStorage con el prefijo del mock: «Reiniciar demo» lo trae de vuelta). */
const DISMISS_KEY = "selyon.mock.tour-dismissed";

const STEPS = [
  { id: "booking", title: "Mirá al agente agendar una cita por WhatsApp", to: `/whatsapp/conversations/${DEMO_BOOKING_CONVERSATION_ID}`, cta: "Abrir la conversación" },
  { id: "handoff", title: "Tomá una conversación que pide a una persona", to: "/whatsapp", cta: "Ir a la bandeja" },
  { id: "agenda", title: "Revisá la agenda de hoy y mové una cita", to: "/agenda?view=day", cta: "Abrir la agenda" },
  { id: "sales", title: "Cobrá una cita y mirá el resumen del día", to: "/sales/today", cta: "Ver cobros" },
] as const;

/**
 * Recorrido de la demo pública (solo en /demo): cuatro pasos a lo que el producto hace de
 * verdad, con el estilo de los primeros pasos del Inicio. Se puede cerrar.
 */
export default function DemoTour() {
  const [dismissed, setDismissed] = useState(() => readStorage(DISMISS_KEY, "session") === "1");
  if (!IS_DEMO || dismissed) return null;
  return (
    <section className="card onboarding demo-tour" aria-labelledby="demo-tour-title">
      <div className="onboarding-head">
        <div>
          <h2 id="demo-tour-title" className="card-title">
            Recorré la demo en 4 pasos
          </h2>
          <p className="muted">Es una clínica dental de ejemplo. Tocá lo que quieras: no le llega nada a nadie.</p>
        </div>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            writeStorage(DISMISS_KEY, "1", "session");
            setDismissed(true);
          }}
        >
          Cerrar
        </button>
      </div>
      <ol className="onboarding-steps">
        {STEPS.map((s, i) => (
          <li key={s.id} className="onboarding-step">
            <span className="onboarding-check demo-tour-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="onboarding-text">
              <span className="onboarding-title">{s.title}</span>
            </span>
            <Link className="btn btn-secondary onboarding-cta" to={s.to}>
              {s.cta}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

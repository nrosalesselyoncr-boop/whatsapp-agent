import { DEMO_WHATSAPP_URL, IS_DEMO, resetDemo } from "../../lib/mockMode";
import Icon from "../../ui/Icons";

/**
 * ¿Está abierta el alta real (SIGNUP_ENABLED)? El server lo avisa con
 * `<meta name="selyon-signup" content="open">` en el index de la demo (staticPanel.ts): así
 * la demo sigue sin hacer pedidos de red y no manda a nadie a un alta cerrada (que redirige
 * al login).
 */
function signupOpen(): boolean {
  return document.querySelector('meta[name="selyon-signup"]')?.getAttribute("content") === "open";
}

/**
 * Aviso fijo de la demo pública (/demo): qué es, que no le llega nada a nadie, y dos
 * salidas: reiniciar la demo y el paso siguiente real (crear la cuenta si el alta está
 * abierta; si no, escribirnos por WhatsApp). Solo existe en el build de la demo.
 */
export default function DemoBanner() {
  if (!IS_DEMO) return null;
  const open = signupOpen();
  return (
    <div className="demo-banner" role="region" aria-label="Aviso de demo">
      <p className="demo-banner-text demo-banner-long">
        <strong>Estás en la demo de Selyon CRM</strong>, con una clínica dental de ejemplo. Probá lo que quieras: no le llega
        nada a nadie y los cambios se borran al cerrar la pestaña.
      </p>
      <p className="demo-banner-text demo-banner-short">
        <strong>Demo con datos de ejemplo.</strong> No le llega nada a nadie.
      </p>
      <div className="demo-banner-actions">
        <button type="button" className="btn btn-ghost demo-banner-reset" onClick={resetDemo}>
          Reiniciar demo
        </button>
        {open ? (
          <a className="btn btn-primary" href="/panel/signup">
            Crear mi cuenta gratis
          </a>
        ) : (
          <a className="btn btn-primary" href={DEMO_WHATSAPP_URL} target="_blank" rel="noopener">
            <Icon id="chat" size={16} />
            Hablar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

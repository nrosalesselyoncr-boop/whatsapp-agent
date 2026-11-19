import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { withDemoConfig } from "../../src/platform/http/staticPanel";
import { applySecurityHeaders } from "../../src/platform/net/securityHeaders";
import { signupEnabled } from "../../src/signup";
import { DEMO_BOOKING_CONVERSATION_ID } from "../../web/src/lib/demoIds";

// ─────────────────────────────────────────────────────────────────────────────
// Demo pública (/demo): el mismo panel con la API simulada (web/dist-demo). Acá: el aviso
// de alta abierta que el server pone en su index, la CSP que recibe y el enlace del sitio a
// la conversación de ejemplo.
// ─────────────────────────────────────────────────────────────────────────────

const INDEX = "<html><head><title>x</title></head><body><div id=\"root\"></div></body></html>";

test("demo: el index avisa «alta abierta» exactamente cuando signupEnabled() lo está", () => {
  for (const value of [undefined, "", "0", "false", "no", "1", "true", "yes", "on", " TRUE ", "si"]) {
    const env = { SIGNUP_ENABLED: value };
    const html = withDemoConfig(INDEX, env);
    const marked = html.includes('<meta name="selyon-signup" content="open">');
    assert.equal(marked, signupEnabled(env), `SIGNUP_ENABLED=${JSON.stringify(value)}`);
    if (marked) assert.ok(html.indexOf("selyon-signup") < html.indexOf("</head>"), "va dentro del <head>");
  }
});

function headersFor(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const res = { setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = String(v)) } as unknown as ServerResponse;
  const req = { headers: {}, socket: {} } as unknown as IncomingMessage;
  applySecurityHeaders(req, res, pathname);
  return headers;
}

test("demo: /demo recibe la CSP del panel (no la de la landing) y sin el SDK de Meta", () => {
  const panel = headersFor("/panel/agenda")["content-security-policy"];
  assert.equal(headersFor("/demo")["content-security-policy"], panel);
  assert.equal(headersFor("/demo/whatsapp/settings")["content-security-policy"], panel, "en la demo nunca se carga el SDK de Meta");
  assert.notEqual(headersFor("/demo/whatsapp/settings")["content-security-policy"], headersFor("/panel/whatsapp/settings")["content-security-policy"]);
  assert.equal(headersFor("/demonio")["content-security-policy"], headersFor("/")["content-security-policy"], "solo /demo y /demo/*");
});

test("demo: el sitio enlaza la conversación de ejemplo en la que el agente agenda", () => {
  const html = readFileSync(new URL("../../landing/whatsapp-ia.html", import.meta.url), "utf8");
  assert.ok(html.includes(`href="/demo/whatsapp/conversations/${DEMO_BOOKING_CONVERSATION_ID}"`));
  for (const page of ["index", "gestion", "whatsapp-ia", "planes"]) {
    const s = readFileSync(new URL(`../../landing/${page}.html`, import.meta.url), "utf8");
    assert.ok(s.includes("Probá la demo"), `${page}: botón de la demo`);
    assert.ok(!s.includes("Pedí una demo"), `${page}: no conviven dos «demos»`);
  }
});

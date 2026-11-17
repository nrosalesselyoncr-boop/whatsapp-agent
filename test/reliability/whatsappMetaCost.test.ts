import assert from "node:assert/strict";
import { after, before, test } from "node:test";

// ─────────────────────────────────────────────────────────────────────────────
// Consumo de WhatsApp que cobra Meta (src/modules/whatsapp/metaCost.ts):
//   • la estimación del mes (servicio = salientes − plantillas, tramo gratis, tarifas);
//   • el aviso a los DUEÑOS (correo + push solo a sus dispositivos) al pasar el 80 % y al
//     agotar el tramo, una sola vez por nivel y mes, aunque el loop corra muchas veces;
//   • la ruta del panel, solo para dueño y admin.
// Sobre PGlite como el rol de la app.
// ─────────────────────────────────────────────────────────────────────────────

process.env.TOKENS_ENCRYPTION_KEY = "d".repeat(64);

const { metaConsumption, checkMetaFreeTier, getMetaConsumption, META_NOTICE_METRIC } = await import("../../src/modules/whatsapp/metaCost");
const { incrementAiUsage } = await import("../../src/modules/whatsapp/usage");
const { metaFreeTierEmail } = await import("../../src/platform/email/templates");
const { pushSubscriptions, dailyUsage } = await import("../../src/platform/db/schema");
const { withTenant } = await import("../../src/platform/db/scope");
const { createEphemeralDb } = await import("../helpers/pgliteDb");
const { allJobs, silenceConsole } = await import("../helpers/queue");
const { createTestBusiness, createTestMember } = await import("../helpers/identityFixtures");
const { createChannel } = await import("../helpers/whatsappFixtures");
const { and, eq } = await import("drizzle-orm");

const RATES = { freeServiceMessages: 1000, warnRatio: 0.8, serviceUsd: 0.0113, utilityUsd: 0.0113, marketingUsd: 0.074 };
const NOV = new Date("2026-11-17T15:00:00Z");
const DEC = new Date("2026-12-02T15:00:00Z");

const base = await createEphemeralDb();
const { db } = base;
let restoreConsole: () => void;

before(async () => {
  restoreConsole = silenceConsole();
  await base.client.exec("SET ROLE app_runtime");
});
after(async () => {
  restoreConsole();
  await base.close();
});

test("estimación: servicio = salientes − plantillas; tramo gratis; plantillas siempre cobran", () => {
  const quiet = metaConsumption({ messagesOut: 300, utilityTemplates: 100, marketingTemplates: 0 }, RATES, NOV);
  assert.equal(quiet.month, "2026-11");
  assert.equal(quiet.serviceMessages, 200);
  assert.equal(quiet.chargedServiceMessages, 0);
  assert.equal(quiet.level, 0);
  assert.equal(quiet.estimatedUsd, 1.13); // 100 recordatorios × 0,0113

  assert.equal(metaConsumption({ messagesOut: 799, utilityTemplates: 0, marketingTemplates: 0 }, RATES, NOV).level, 0);
  assert.equal(metaConsumption({ messagesOut: 800, utilityTemplates: 0, marketingTemplates: 0 }, RATES, NOV).level, 1);
  assert.equal(metaConsumption({ messagesOut: 1000, utilityTemplates: 0, marketingTemplates: 0 }, RATES, NOV).level, 1);

  const busy = metaConsumption({ messagesOut: 3300, utilityTemplates: 200, marketingTemplates: 100 }, RATES, NOV);
  assert.equal(busy.serviceMessages, 3000);
  assert.equal(busy.chargedServiceMessages, 2000);
  assert.equal(busy.level, 2);
  // 2000 × 0,0113 + 200 × 0,0113 + 100 × 0,074 = 22,6 + 2,26 + 7,4
  assert.equal(busy.estimatedUsd, 32.26);

  // Nunca negativo aunque los contadores vengan desparejos.
  assert.equal(metaConsumption({ messagesOut: 1, utilityTemplates: 5, marketingTemplates: 0 }, RATES, NOV).serviceMessages, 0);
});

test("correo: cerca del límite y agotado, con la tarifa y el aviso de que cobra Meta", () => {
  const near = metaFreeTierEmail({
    businessName: "Uñas Ana",
    userName: "Ana",
    exhausted: false,
    serviceMessages: 812,
    freeServiceMessages: 1000,
    serviceUsd: 0.0113,
    panelUrl: "https://crm.ejemplo.test/panel/whatsapp/settings",
  });
  assert.match(near.subject, /se acaban las respuestas gratis/);
  assert.match(near.text, /812/);
  assert.match(near.text, /Meta directamente/);
  const done = metaFreeTierEmail({ ...{ businessName: "Uñas Ana", serviceMessages: 1001, freeServiceMessages: 1000, serviceUsd: 0.0113 }, exhausted: true, panelUrl: "https://crm.ejemplo.test/panel/whatsapp/settings" });
  assert.match(done.subject, /ya cobra/);
});

async function connectedBusiness() {
  const biz = await createTestBusiness(db, { name: "Uñas Ana" });
  await createChannel(db, biz.businessId);
  const owner = await createTestMember(db, { businessId: biz.businessId, role: "owner", name: "Ana" });
  const admin = await createTestMember(db, { businessId: biz.businessId, role: "admin" });
  await withTenant(db, biz.businessId, (tx) =>
    tx.insert(pushSubscriptions).values([
      { businessId: biz.businessId, userId: owner.userId, sessionEpoch: 0, endpoint: `https://fcm.googleapis.com/fcm/send/owner-${biz.businessId}`, p256dh: "B".repeat(87), auth: "A".repeat(22) },
      { businessId: biz.businessId, userId: admin.userId, sessionEpoch: 0, endpoint: `https://fcm.googleapis.com/fcm/send/admin-${biz.businessId}`, p256dh: "B".repeat(87), auth: "A".repeat(22) },
    ]),
  );
  return { ...biz, owner, admin };
}

function recordingPush() {
  const endpoints: string[] = [];
  return { endpoints, transport: async (target: { endpoint: string }) => void endpoints.push(target.endpoint) };
}

async function emailsTo(businessId: string) {
  return (await allJobs(db))
    .filter((j) => j.type === "email.send" && j.businessId === businessId)
    .map((j) => (j.payload as { message: { to: string; subject: string } }).message);
}

test("aviso: 80 % → un correo y un push SOLO al dueño; repetir el tick no duplica", async () => {
  const w = await connectedBusiness();
  const push = recordingPush();
  await incrementAiUsage(db, w.businessId, { messagesOut: 700 }, NOV);
  assert.deepEqual(await checkMetaFreeTier(db, { push: push.transport, rates: RATES }, NOV), []);

  await incrementAiUsage(db, w.businessId, { messagesOut: 120 }, NOV); // 820 respuestas
  const sent = await checkMetaFreeTier(db, { push: push.transport, rates: RATES }, NOV);
  assert.deepEqual(sent, [{ businessId: w.businessId, level: 1, owners: 1 }]);
  const mails = await emailsTo(w.businessId);
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, w.owner.email);
  assert.match(mails[0].subject, /se acaban las respuestas gratis/);
  assert.deepEqual(push.endpoints, [`https://fcm.googleapis.com/fcm/send/owner-${w.businessId}`]);

  // Otro tick con el mismo nivel: nada nuevo.
  assert.deepEqual(await checkMetaFreeTier(db, { push: push.transport, rates: RATES }, NOV), []);
  assert.equal((await emailsTo(w.businessId)).length, 1);

  // Al agotar el tramo sale el segundo aviso, también una sola vez.
  await incrementAiUsage(db, w.businessId, { messagesOut: 200 }, NOV); // 1020
  assert.deepEqual(await checkMetaFreeTier(db, { push: push.transport, rates: RATES }, NOV), [{ businessId: w.businessId, level: 2, owners: 1 }]);
  assert.deepEqual(await checkMetaFreeTier(db, { push: push.transport, rates: RATES }, NOV), []);
  const after2 = await emailsTo(w.businessId);
  assert.equal(after2.length, 2);
  assert.match(after2[1].subject, /ya cobra/);
  assert.equal(push.endpoints.length, 2);

  // El nivel avisado queda en daily_usage, el día 1 del mes.
  const [row] = await withTenant(db, w.businessId, (tx) =>
    tx.select().from(dailyUsage).where(and(eq(dailyUsage.businessId, w.businessId), eq(dailyUsage.metric, META_NOTICE_METRIC))),
  );
  assert.equal(String(row.date), "2026-11-01");
  assert.equal(Number(row.value), 2);
});

test("aviso: de 0 a agotado en un mismo tick sale solo el de nivel 2; el mes nuevo empieza de cero", async () => {
  const w = await connectedBusiness();
  await incrementAiUsage(db, w.businessId, { messagesOut: 1500 }, NOV);
  assert.deepEqual(await checkMetaFreeTier(db, { rates: RATES }, NOV), [{ businessId: w.businessId, level: 2, owners: 1 }]);
  assert.equal((await emailsTo(w.businessId)).length, 1);

  // Diciembre: contadores en cero → nada; al pasar el 80 % vuelve a avisar.
  assert.deepEqual(await checkMetaFreeTier(db, { rates: RATES }, DEC), []);
  await incrementAiUsage(db, w.businessId, { messagesOut: 850 }, DEC);
  assert.deepEqual(await checkMetaFreeTier(db, { rates: RATES }, DEC), [{ businessId: w.businessId, level: 1, owners: 1 }]);
});

test("aviso apagado con tramo 0; consumo del panel desde ai_usage_monthly", async () => {
  const w = await connectedBusiness();
  await incrementAiUsage(db, w.businessId, { messagesOut: 5000 }, NOV);
  assert.deepEqual(await checkMetaFreeTier(db, { rates: { ...RATES, freeServiceMessages: 0 } }, NOV), []);

  await incrementAiUsage(db, w.businessId, { messagesOut: 10, utilityTemplates: 10 }, NOV);
  const usage = await getMetaConsumption(db, w.businessId, NOV);
  assert.equal(usage.serviceMessages, 5000);
  assert.equal(usage.utilityTemplates, 10);
});

# Plan de producto — que lo amen y lo paguen

**Fecha:** 2026-11-10 · **Estado:** propuesto; se ajusta con lo que digan los primeros clientes · **ROADMAP:** Carril V
**Épicas (briefs):** [`docs/plan-producto/BACKLOG.md`](docs/plan-producto/BACKLOG.md) · **Se ejecuta con:** `/producto` y `/feedback`

`PLAN-GESTION.md` definió qué producto es, y ya está construido (I0–I6). `docs/prompts-produccion/` lo deja listo para
producción (Carril P, 11 de 37). Este plan responde lo que sigue: **qué le falta para que un negocio lo use todos los
días, lo recomiende y pague contento**, en qué orden hacerlo y cómo ejecutarlo todo con Claude.

---

## 0. El plan en una página

**Qué es.** Un software de gestión para negocios con cita (uñas, pestañas, estética, dental) donde **el WhatsApp del
negocio agenda solo**: un agente de IA responde, agenda, confirma y recuerda, y un panel ordena la agenda, las clientas
y la plata.

**La idea central.** No gana el que tiene más funciones. En esta categoría gana el que logra cinco cosas, en este orden:

1. **Arranca en un día**, sin perder el WhatsApp que la dueña ya usa.
2. **No falla donde duele**: nunca una cita doble, un precio inventado ni un mensaje sin responder.
3. **Demuestra la plata que trae**, todos los meses, con números que se pueden defender.
4. **Se siente hecho para ese negocio**: SINPE, colones, voseo, su rubro, su marca.
5. **Se recomienda solo**: la dueña se lo muestra a la del local de al lado.

Lo ya construido cubre casi todo el "qué hace". Lo que falta es sobre todo de los puntos 1, 3 y 5.

**Cinco fases, cada una con una meta que la cierra.** No se arranca la siguiente hasta cumplir la meta de la actual.
Las metas son iniciales: se recalibran con datos reales.

| Fase | Meta que la cierra | Qué se construye |
|---|---|---|
| **V0 · Un negocio feliz** | El primer negocio usa su número real 2 semanas seguidas, el agente le agenda al menos 15 citas sin errores graves y la dueña lo recomendaría (9 o 10 de 10) | Producción firme, número real sin perder la app, costo por conversación medido, ayuda y feedback en el panel |
| **V1 · Cinco negocios que pagan** | 5 pagando; del alta a la primera cita agendada por el agente en menos de 24 h sin tocar nada técnico; 4 de 5 siguen activos a las 4 semanas | Probar el agente antes de conectarlo, alta con IA, plantillas de Meta solas, link y QR, demo viva y precios, reporte de valor del mes |
| **V2 · No pueden vivir sin él** | 20 pagando; baja mensual menor al 5 %; al menos 40 % de las citas entran por el agente; 40 % o más estaría "muy decepcionada" si lo perdiera | Resumen diario, señas por SINPE, no-shows, lista de espera, agenda rápida, ficha 360, calendario en el celular |
| **V3 · Les hace ganar más** | 50 pagando; al menos 30 % en Pro; cada negocio ve 5 veces o más lo que paga | Recompra automática, copiloto de la dueña por WhatsApp, Instagram, paquetes, campañas con IA |
| **V4 · Se vende solo** | 100 pagando; más de la mitad de las altas se activan sin ayuda | Alta abierta, referidos entre negocios, soporte con IA, segundo rubro, marca definitiva |

**Regla contra construir de más.** Lo marcado *validar* en el backlog (factura electrónica, inventario, reservas web,
paquetes, cobro automático) no se construye hasta que aparezca su señal: una cantidad concreta de negocios que lo piden
o que pagarían más por eso.

---

## 1. Dónde estamos (2026-11-10)

- **Construido:** todo `PLAN-GESTION.md` (I0–I6). Agente de WhatsApp que agenda, reprograma y cancela; bandeja;
  recordatorios con Confirmar/Cancelar; agenda por profesional sin solapes; clientes con estados, etiquetas y campos
  propios; cobros, señas y comisiones; reportes; campañas con consentimiento, reseñas, rescate de cotizaciones y upsell;
  marca propia; Stripe y cobro manual; alta self-service (apagada); plantillas de rubro (uñas, estética, dental, genérica).
- **Publicado:** `https://crm.selyon.app`, con el primer negocio (uñas y pestañas) dado de alta, alertas por Telegram y
  backup diario (ver `docs/prompts-produccion/PROGRESO.md`).
- **Lo que hoy frena a un negocio real:**
  1. El número de WhatsApp es el de **prueba** de Meta. Faltan la verificación del negocio y el acceso de proveedor de
     tecnología. Además, hoy conectar un número lo saca de la app WhatsApp Business (no hay coexistencia).
  2. Producción a medias: faltan los P0 de Carril P (staging, deploy automático, restore probado, rollback, monitoreo
     de caída, prompt injection, topes de gasto) y el CI está en rojo por dos causas ajenas a los PRs.
  3. No hay precios publicados ni forma de probar el producto sin hablar con nosotros.
  4. Los evals del agente (35 casos) nunca corrieron contra el modelo real.
  5. Los textos legales tienen marcadores `[PENDIENTE]`.

---

## 2. Para quién, y contra qué competimos

**Cliente ideal para arrancar:** negocio de belleza en Costa Rica (uñas, pestañas, cejas, estética) de 1 a 8 personas,
que hoy agenda a mano por WhatsApp. Motivos: ahí está el primer negocio real, la venta es corta (decide la dueña), el
dolor es diario (contesta mensajes entre clientas y pierde citas de noche) y no pide expediente clínico. **Dental**
sigue en el producto (plantilla, terminología, evals), pero se va a fondo cuando haya 3 consultorios pagando: pide
presupuestos, plan de tratamiento y cuotas (V4.4).

**El competidor de verdad es el cuaderno más la app WhatsApp Business**, que la dueña ya usa y es gratis. Por eso el
producto tiene que ser más fácil que eso y nunca quitarle su WhatsApp. Después vienen:

| Alternativa | Qué ofrece | Dónde le ganamos |
|---|---|---|
| Cuaderno + WhatsApp Business | Gratis y conocido | Responde y agenda sola a cualquier hora, recuerda, no se le pasan citas y muestra números |
| AgendaPro (líder regional) | Agenda, punto de venta y recordatorios por WhatsApp medidos por paquete; su IA de marketing figura como "próximamente" y la respuesta por WhatsApp con IA es un producto aparte (según su página de planes y su blog, noviembre de 2026) | La clienta agenda **dentro del chat** con un agente que entiende; hecho para Costa Rica; precio simple |
| Fresha, Booksy | Reservas por app o web y mercado de clientes | Poca presencia local y sin SINPE, hasta donde vimos; la clienta de acá escribe por WhatsApp, no baja una app |

**Posicionamiento en una línea:** *"Tu WhatsApp agenda solo, y a fin de mes ves cuánta plata te trajo."*

---

## 3. Qué tiene que vivir la dueña, y qué falta para lograrlo

| Momento | Lo que tiene que sentir | Ya hay | Falta (épica) |
|---|---|---|---|
| **1. Lo descubre** | "Esto es para mí", en 30 segundos | Landing | Demo viva por WhatsApp, precios y páginas por rubro (V1.5) |
| **2. Primer día** | "Ya quedó andando y no llamé a nadie" | Alta con plantilla de rubro, primeros pasos, importar clientes | Número real sin perder la app (V0.3), probar el agente (V1.1), alta con IA (V1.2), plantillas solas (V1.3), link y QR (V1.4), embudo de activación (V1.6) |
| **3. Cada día** | "Trabaja por mí y no me hace quedar mal" | Agente, bandeja, recordatorios, agenda | Resumen diario (V2.1), agenda rápida (V2.5), ficha 360 con memoria (V2.6), calendario en el celular (V2.7) |
| **4. La plata** | "Me cuida de los plantones" | Confirmar/Cancelar, registro de pagos y señas | Señas por SINPE en el chat (V2.2), política de no-shows (V2.3), lista de espera (V2.4) |
| **5. Fin de mes** | "Me trajo más de lo que cuesta" | Métricas del agente, reportes | "Tu mes con Selyon" (V1.7) |
| **6. Crecer** | "Me llena la agenda sola" | Campañas, reseñas, rescate, upsell | Recompra automática (V3.1), copiloto por WhatsApp (V3.2), Instagram (V3.3), paquetes (V3.4) |
| **Siempre** | "Confío: no se cae y me responden" | Alertas, backups, 2FA, aislamiento entre negocios | P0 de Carril P (V0.2), ayuda y feedback (V0.5), novedades (V2.8) |

**Detalles que enamoran.** Son baratos y se meten dentro de las épicas, no son épicas aparte: el agente saluda por el
nombre y propone "¿con Ana, como siempre?"; el recordatorio trae el link de Waze; la dueña amanece con "mientras dormías
te agendé 3 citas"; se festeja la primera cita del agente y la número 100; "deshacer" en vez de "¿estás segura?"; el
soporte lo contesta una persona en minutos.

---

## 4. Las épicas, por fase

El porqué, el alcance mínimo y el "listo cuando" de cada una están en
[`docs/plan-producto/BACKLOG.md`](docs/plan-producto/BACKLOG.md). Tamaños: **S** = un PR chico · **M** = uno o dos PRs
con flujo o migración nuevos · **L** = tres o más PRs, o depende de terceros (Meta, pagos).

**V0 · Un negocio feliz**
- V0.1 CI en verde otra vez (S)
- V0.2 Cerrar los P0 de Carril P (serie existente, con `/prod-readiness`)
- V0.3 Número real sin perder la app: Embedded Signup al día y coexistencia (L)
- V0.4 Costo real por conversación, de Meta y de IA, medido y controlado (M)
- V0.5 Ayuda y feedback dentro del panel (S)

**V1 · Cinco negocios que pagan**
- V1.1 "Probá tu agente": chat de prueba en el panel (M)
- V1.2 Alta con IA: de la lista de precios al catálogo en minutos (M)
- V1.3 Plantillas de Meta creadas y seguidas solas (M)
- V1.4 Link y QR de reservas por WhatsApp (S)
- V1.5 Demo viva por WhatsApp y landing con precios (M)
- V1.6 Embudo de activación y aviso de negocio trabado (S)
- V1.7 "Tu mes con Selyon": el reporte de valor (M)

**V2 · No pueden vivir sin él**
- V2.1 Resumen diario para la dueña y cada profesional (S)
- V2.2 Señas por SINPE desde el chat (L)
- V2.3 Política de cancelación y no-shows (M)
- V2.4 Lista de espera y relleno de huecos (M)
- V2.5 Agenda que vuela en el celular (M)
- V2.6 Ficha 360 y memoria de la clienta (L)
- V2.7 Mi agenda en el calendario del celular (S)
- V2.8 "Qué hay de nuevo" y centro de ayuda (S)
- V2.9 Salud de los negocios: quién está por irse (S)

**V3 · Les hace ganar más**
- V3.1 "Te toca de nuevo": recompra automática (M)
- V3.2 Copiloto de la dueña por WhatsApp (L)
- V3.3 Instagram y Messenger en la misma bandeja (L)
- V3.4 Paquetes, bonos de sesiones y tarjetas de regalo (L, *validar*)
- V3.5 Cumpleaños, referidos de clientas y sellos (M)
- V3.6 Campañas con IA (S)
- V3.7 Cobro automático con un procesador local (L, *validar*)
- V3.8 Factura electrónica vía un proveedor (L, *validar*)
- V3.9 Página de reservas web (M, *validar*)
- V3.10 Venta de productos e inventario simple (M, *validar*)

**V4 · Se vende solo**
- V4.1 Alta abierta de punta a punta (M)
- V4.2 Referidos entre negocios (S)
- V4.3 Soporte de Selyon atendido por su propio agente (S)
- V4.4 Segundo rubro a fondo (L)
- V4.5 Nombre y marca definitivos (S)
- V4.6 Segundo país (L)

**Siempre, en paralelo:** rendimiento (Q1), calidad del agente (Q2), diseño consistente (Q3) y confiabilidad (Q4).

---

## 5. Precios: hipótesis para probar, no decisiones

**Qué cuesta atender a un negocio por mes (estimación, a verificar):**
- **IA:** entre US$1 y US$3 con `gpt-4o-mini` y unas 300 conversaciones.
- **WhatsApp (Meta):** varias fuentes reportan que desde el 2026-10-01 Meta cobra también los mensajes dentro de la
  ventana de 24 horas, a la tarifa *utility* del país, y discrepan sobre si queda una franquicia mensual gratis. No se
  pudo abrir la página oficial desde la sesión que escribió este plan. Si se confirma, 300 conversaciones de unos 6
  mensajes del agente son cerca de 1.800 mensajes al mes: podría rondar entre US$10 y US$20 por negocio. **Hay que
  confirmarlo en la tarifa oficial de Meta para Costa Rica antes de fijar precios** (V0.4).
- **Servidor y base:** despreciable a esta escala.

**Consecuencia:** conviene que cada negocio le pague a Meta sus mensajes con su propio medio de pago (es lo normal
cuando el número se conecta con Embedded Signup) y que el panel le muestre un estimado. La alternativa es incluir un
cupo en el plan y cobrar el extra.

**Punto de partida sugerido** (planes de `PLAN-GESTION.md` §5, sin cambiar el empaque):

| Plan | Hipótesis de precio | Incluye |
|---|---|---|
| **Básico** | US$35 al mes (rango a probar: 29 a 39) | Agente, bandeja, agenda, recordatorios, 1 sucursal, hasta 3 profesionales, cupo mensual de conversaciones |
| **Pro** | US$69 al mes (rango: 59 a 79), más un extra por profesional o sucursal adicional | Todo: clientes completo, cobros, comisiones, reportes, crecimiento, marca propia |

- **Clientes fundadores (10 cupos):** 50 % de descuento por 6 meses a cambio de 30 minutos de feedback cada dos semanas
  y un testimonio. Precio anual: dos meses gratis.
- **Garantía:** "si en 30 días el agente no te agendó al menos 10 citas, te devolvemos el mes".
- **Cómo probar el precio:** decile el precio completo a los primeros cinco antes de mencionar el descuento. Si ninguno
  duda, está barato.
- **Pregunta abierta:** si 3 de los primeros 5 negocios son de una sola persona y el Básico las frena, se crea un plan
  "Solo" más barato (1 profesional, menos conversaciones).

---

## 6. Cómo conseguir los primeros 20

1. **La red de la primera clienta.** El gremio de uñas y pestañas se conoce: tres demostraciones en persona, con el
   teléfono de ella, valen más que cualquier anuncio.
2. **Demo viva** (V1.5): "escribile a este número y pedí una cita". Es la mejor venta de un producto así.
3. **Oferta de clientes fundadores** (§5).
4. **Alta acompañada:** mientras V0.3 y V1 no estén, conectás vos el WhatsApp de cada negocio en una videollamada de 30
   minutos. No escala, y está bien: de ahí sale la lista de fricciones.
5. **Prueba social:** capturas reales con permiso y "Tu mes con Selyon" (V1.7) como caso.
6. **Canales siguientes:** Instagram y TikTok mostrando chats reales, distribuidoras de insumos y academias de uñas y
   pestañas (con comisión por referido), grupos del gremio.
7. **Referidos entre negocios** (V4.2) cuando haya unos 20.

Claude ayuda con todo lo escrito: páginas por rubro, guiones de video, respuestas a objeciones, casos de éxito y mensajes
de venta. Eso se le pide en una sesión normal; no necesita épica.

---

## 7. Qué medimos

| Qué | Métrica | Meta inicial | Dónde se ve |
|---|---|---|---|
| **Estrella** | Citas agendadas por el agente por negocio activo por semana | 10 o más | Métricas del superadmin |
| **Activación** | Altas con WhatsApp conectado y primera cita del agente en 48 h | 60 % o más | Superadmin (activación) y V1.6 |
| **Hábito** | Negocios que usan el panel 4 días o más por semana | 70 % o más | `daily_usage` |
| **Retención** | Negocios que siguen pagando al tercer mes | 85 % o más | Cobro |
| **Calidad del agente** | Conversaciones resueltas sin una persona; errores graves reportados | 70 % o más; cero | Métricas del agente y `FEEDBACK.md` |
| **Valor** | Plata atribuida al agente dividida por el precio del plan | 5 veces o más | "Tu mes con Selyon" (V1.7) |
| **Economía** | Costo de IA (y de Meta, si lo pagamos nosotros) dividido por el precio | 15 % o menos | V0.4 |
| **Amor** | "¿Qué tan decepcionada estarías si mañana no pudieras usarlo?": responde "muy" | 40 % o más | Encuesta al día 30 (V0.5) |

---

## 8. Cómo se ejecuta todo con Claude

**Quién hace qué**

| Vos | Claude |
|---|---|
| Hablar con clientes y vender | Convertir lo que dicen en épicas, casos de prueba y arreglos (`/feedback`) |
| Decidir prioridades, precios y lo que pregunta cada épica | Escribir la especificación, el código, las pruebas y la documentación |
| Aprobar y unir los PRs | Abrir PRs chicos, apilados sobre el último, con "cómo probarlo en 2 minutos" |
| Cuentas, pagos y trámites (Meta, OpenAI, dominio, legal) | Guiarte paso a paso; con la sesión de la Mac, operar el servidor y los paneles web |
| Probar en tu teléfono y en el del cliente | Probar en celular y escritorio, claro y oscuro, antes de pedirte nada |

**El ciclo de una épica (`/producto <slug>`)**

1. **Base:** el último PR abierto, como en Carril P.
2. **Especificar al momento:** Claude lee el brief y el código de ese día y escribe `docs/plan-producto/specs/<slug>.md`
   (problema, flujo paso a paso con los textos reales, datos, API, pantallas, costos, pruebas, riesgos, rebanadas). No se
   escriben especificaciones por adelantado: envejecen.
3. **Decidir:** te hace juntas todas las preguntas y guarda tus respuestas en la especificación.
4. **Construir** en `feat/<slug>`, en rebanadas que dejan algo usable.
5. **Verificar:** typecheck, tests, E2E, evals si toca al agente, capturas en celular y escritorio, y la lista de
   "terminado" de abajo.
6. **PR apilado** sobre el último. Vos lo revisás y lo unís.
7. **Publicar y medir:** deploy a producción con smoke; a los 7 a 14 días se mira si se usa. Lo que no se usa se
   arregla o se quita.

**`/producto` sin argumento** dice en qué fase estamos, qué falta para la meta y propone la siguiente épica.

**`/feedback`** recibe lo que dijo un cliente (texto, audio transcrito o captura): lo clasifica, lo anota en
`docs/plan-producto/FEEDBACK.md` sin datos personales, suma evidencia a la épica que corresponde, convierte cada error
del agente en un caso de eval y propone qué responderle.

**"Terminado" quiere decir:**
- Funciona en celular (390 px), tablet y escritorio, en claro y oscuro, y con la marca propia del negocio.
- Textos en voseo y sin jerga; pantallas vacías, de carga y de error pensadas.
- Permisos por rol y por plan (candado en Básico si es de Pro), su fila en el inventario de rutas y un test de
  aislamiento entre negocios si toca datos.
- Tests del flujo principal; evals si toca al agente; `ci:*` en verde.
- Registra un evento de uso, para saber después si se usa.
- Si manda WhatsApp o usa IA, respeta los topes y muestra el costo.
- `ROADMAP.md` actualizado en el mismo commit; migraciones aditivas; se puede apagar si es riesgoso.

**Ritmo y límites**
- Una épica a la vez. Dos en paralelo solo si no tocan los mismos archivos: el límite de uso se gasta rápido.
- Una semana tipo: lunes se decide qué entra, de martes a jueves se construye, viernes se publica y se muestra a los
  clientes. La semana siguiente arranca con lo que dijeron.
- Todo queda en el repo (este plan, el backlog, las especificaciones, `ROADMAP.md`), así otra persona u otra sesión
  puede seguir sin contexto previo.

---

## 9. Riesgos, y lo que no se hace todavía

| Riesgo | Qué hacemos |
|---|---|
| **Meta:** verificación lenta, cambios de precio o de reglas, número bloqueado | Verificación ya en curso; coexistencia; costo medido (V0.4); push y correo como respaldo; el agente es de atención del negocio, no un asistente general |
| **El agente se equivoca** en un precio o un horario | Evals con línea base, guardias, "ante la duda, pasa a una persona", y cada error real entra como caso (`/feedback`) |
| **Construir de más** | Metas por fase y épicas *validar* |
| **El soporte no escala** con una sola persona | Alta con IA, ayuda en la app, soporte con IA (V4.3) |
| **Todo depende de una persona** | Todo en el repo, PRs chicos, staging, documento de traspaso |
| **Baja alta, típica de negocios chicos** | Valor visible cada mes, plan anual, foco en negocios de 2 personas o más |
| **Legal y datos** | Completar privacidad y términos antes de cobrar; el repo es público: nunca datos de clientes |

**No se hace todavía:** expediente clínico u odontograma, app nativa, mercado de clientes, nómina o contabilidad,
recepcionista de voz por teléfono y pasarela de pagos propia.

---

## 10. Decisiones tuyas

1. **Rubro de arranque para vender.** Recomendado: uñas, pestañas y estética.
2. **Precios de lanzamiento** y la oferta de clientes fundadores (§5).
3. **Quién le paga a Meta los mensajes.** Recomendado: cada negocio con su medio de pago, una vez confirmada la tarifa.
4. **Número oficial de Selyon** para soporte y para la demo viva (hoy la landing muestra un número sin decidir).
5. **Repo público o privado.** Este plan y el registro de feedback quedan a la vista de cualquiera.
6. **Nombre definitivo** (`PLAN-GESTION.md` §8), cuando llegue V4.5.

**Esta semana**

| Vos | Claude |
|---|---|
| Terminar la verificación de Meta y pedir el acceso de proveedor de tecnología | `/producto ci-verde` |
| Sentarte una hora con la primera clienta mientras usa el panel, y pasar todo por `/feedback` | `/prod-readiness` con los P0 que faltan |
| Confirmar en la página oficial de Meta la tarifa de mensajes vigente para Costa Rica | `/producto numero-real-coexistencia` (especificación y preguntas mientras Meta aprueba) |
| Decidir precios, número oficial y lo pendiente de Carril P | `/producto ayuda-y-feedback` |

---

## 11. Fuentes consultadas (2026-11-10)

Son de terceros salvo donde dice "oficial"; lo marcado *a verificar* arriba no se pudo confirmar en la fuente oficial.

- AgendaPro, planes: <https://agendapro.com/planes>
- Meta (oficial), alta de usuarios de la app WhatsApp Business (coexistencia):
  <https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users>
- Meta (oficial), registro de cambios de la plataforma: <https://developers.facebook.com/documentation/business-messaging/whatsapp/changelog/>
- Meta (oficial), precios de la plataforma: <https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing>
- Cambios de precio de WhatsApp del 2026-10-01: <https://www.medianama.com/2026/09/223-whatsapp-business-pricing-changes-october-1-what-businesses-need-to-know/>
  y <https://en.tempo.co/read/2120492/5-facts-on-whatsapp-business-rate-updates-october-1>
- Coexistencia, disponibilidad y límites: <https://chakrahq.com/article/whatsapp-coexistence-live-eu-uk-europe-whatsapp-business-for-api-live/>
- Tilopay, API y SDK con SINPE Móvil: <https://tilopay.com/guias/api-y-sdk>
- ONVO Pay, tarjetas y SINPE Móvil: <https://wordpress.org/plugins/onvo-pay/>
- Factura electrónica 4.4 obligatoria: <https://siemprealdia.co/costa-rica/impuestos/hacienda-confirma-obligatoriedad-de-la-factura-electronica-4-4/>

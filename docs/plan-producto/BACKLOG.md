# Backlog de producto — épicas en orden

Las épicas de [`PLAN-PRODUCTO.md`](../../PLAN-PRODUCTO.md), en el orden en que se hacen. Cada una se ejecuta con
`/producto <slug>`.

- **El brief de acá dice el porqué y el alcance mínimo.** El detalle técnico no se escribe por adelantado: lo arma
  Claude al empezar la épica, en `specs/<slug>.md`, leyendo el código de ese día. Así no envejece.
- **El estado de cada épica vive en `ROADMAP.md` (Carril V)**, no acá.
- **Orden:** de arriba hacia abajo dentro de la fase. No se arranca una fase sin cumplir la meta de la anterior. El
  grupo **M** (momentos mágicos) va aparte: se prueba desde ya, en paralelo a la fase en curso.
- **Tamaños:** S = un PR chico · M = uno o dos PRs con flujo o migración nuevos · L = tres o más PRs, o depende de
  terceros (Meta, pagos).
- **Evidencia:** *hipótesis* mientras ningún cliente lo haya pedido. `/feedback` la va actualizando ("pedido por 2
  negocios"). Con evidencia, una épica puede subir de lugar; sin evidencia, las *validar* no se construyen.
- **"Ya hay"** se escribió el 2026-11-10 mirando el código de `prod/readiness`. La especificación lo vuelve a verificar.

---

## M · Momentos mágicos

Lo que hace que alguien se enamore del producto y no solo lo use (`PLAN-PRODUCTO.md` §3.1). **Cada uno se prueba a mano
con el primer negocio antes de construirlo**, y se construye solo si la prueba enamora: lo vuelve a pedir al día
siguiente, se molesta si falta, o se lo muestra a una colega sin que nadie se lo pida. Las maquetas para mostrar están
en [`maquetas/`](maquetas/).

### M1 · "Mi socia me habla" — `socia-por-audio` · L

- **La escena:** a las 6:45 llega un audio: "Buenos días. Hoy tenés 6 citas, la primera a las 9. Ayer entraron ₡85.000.
  Quedan 3 campos libres el jueves, ¿los lleno?". La dueña contesta con otro audio ("sí, y bloqueame el viernes después
  de la 1") y queda hecho.
- **Por qué enamora:** trabaja con las manos ocupadas; el audio es como ya se comunica. Deja de sentirse sola con el
  negocio. Es la apuesta principal: las demás se enchufan en ella.
- **Prueba barata:** durante cinco días, mandarle a mano un audio a las 6:45 con su día (leyendo el panel) y hacer en
  el panel lo que conteste. Señal: al tercer día lo espera o pregunta por él.
- **Se construye en rebanadas:** (1) audio de la mañana y resumen de la noche, solo lectura; (2) cinco órdenes por
  audio o texto, con confirmación antes de cambiar algo: ver la agenda, bloquear un horario, mover o cancelar una cita,
  cuánto se vendió, llenar huecos; (3) propuestas que la socia hace sola ("hay 12 clientas que no vienen hace 6 semanas,
  ¿les escribo?"); (4) el cierre de la semana: cuánto entró, cuánto apartar para insumos e impuestos según los
  porcentajes que ella defina, cuánto es su sueldo y qué servicio le deja más por hora.
- **Ya hay:** transcripción de audios, los servicios del núcleo (agenda, reportes, campañas), push y auditoría. La API de
  WhatsApp permite mandar notas de voz (Ogg/Opus con `voice: true`, según la documentación de Meta).
- **Decisiones tuyas:** nombre por defecto de la asistente (la dueña lo puede cambiar); la voz; a qué hora habla.
- **Cuidado:** solo teléfonos verificados del equipo; confirmación o PIN para lo sensible; nunca clonar la voz de la
  dueña para hablarles a sus clientas; cada mensaje cuesta (V0.4).
- **Absorbe:** V2.1 (resumen diario) y V3.2 (copiloto).
- **Evidencia:** hipótesis.

### M2 · "Cotiza con solo ver la foto" — `cotizador-por-foto` · M

- **La escena:** la clienta manda una foto de referencia y pregunta "¿cuánto me sale?". La asistente responde: "es
  acrílico largo en almendra, con francés y 4 uñas decoradas a mano: entre ₡18.000 y ₡20.000, unas 2 horas", ofrece
  horarios, agenda el tiempo correcto y le deja la foto a la profesional para que tenga todo listo.
- **Por qué enamora:** es la pregunta que más se repite en uñas y pestañas, y hoy siempre la contesta una persona.
- **Prueba barata:** pedirle a la primera clienta 15 fotos que le hayan mandado y cuánto cobró por cada una; pasarlas
  por el modelo con su tabla de precios y comparar. Señal: acierta el nivel en 12 de 15 y ella dice "eso lo usaría".
- **Se construye:** una tabla de niveles del negocio (sencillo, medio, elaborado, por uña decorada, extra por largo)
  con fotos de ejemplo; la asistente clasifica, da un rango y la duración, agenda y adjunta la foto a la cita. Si no
  está segura, le pasa a la dueña su mejor estimación ("creo que es nivel 3, ¿confirmás?") y aprende de la corrección.
- **Ya hay:** el agente recibe fotos; hoy, ante un diseño de precio variable, pide la foto y pasa a una persona (caso de
  eval 19). Precio y duración por servicio.
- **Cuidado:** siempre un rango y "te lo confirma la profesional al verte", nunca un precio exacto. Sin imágenes
  generadas de "así te quedaría": crean expectativas que el trabajo real puede no cumplir; mejor mostrar trabajos
  reales del negocio (M5).
- **Evidencia:** hipótesis; en una búsqueda rápida no apareció ningún producto que cotice desde la foto.

### M3 · "El SINPE se confirma solo" — `sinpe-solo` · L

- **La escena:** la asistente pide la seña: "hacé un SINPE de ₡5.000 al 8888-1234 y poné en el detalle: LUNA47". Cuando
  el banco avisa que entró la plata, le escribe a la clienta "recibido, tu cita quedó confirmada" y a la dueña "Mariana
  pagó la seña, no tenés que revisar nada".
- **Por qué enamora:** nadie quiere abrir la app del banco por cada seña ni discutir por un comprobante. El Banco
  Central recomienda fiarse del aviso del propio banco y no del comprobante que manda quien paga.
- **Prueba barata:** que la primera clienta reenvíe tres avisos de SINPE recibido de su banco (correo o SMS), para ver
  qué datos traen. Señal: el aviso llega por correo y trae monto, nombre y detalle.
- **Se construye:** una dirección de correo propia por negocio; la dueña crea en su correo una regla que reenvía solo
  los avisos de SINPE (con el paso de verificación del reenvío guiado); el sistema lee monto, nombre y detalle; al
  llegar el aviso que coincide con el código, registra la seña y confirma la cita. Si el banco no avisa por correo o
  no hay coincidencia, queda el camino de V2.2 (comprobante y un toque).
- **Ya hay:** señas en Ventas y correo saliente. No hay correo entrante (el DNS está en Cloudflare, que ofrece
  enrutamiento de correo: a evaluar en la especificación).
- **Cuidado:** nunca credenciales del banco: solo los avisos, guardando lo mínimo. Cada banco tiene su formato y lo
  puede cambiar: un lector por banco y una alerta cuando deja de reconocer. Revisar las reglas vigentes de SINPE para
  comercios.
- **Mejora:** V2.2, y vuelve innecesaria V3.7 para la mayoría.
- **Evidencia:** hipótesis fuerte; falta ver el aviso real del banco de la primera clienta.

### M4 · "Ya me conoce" — `ya-me-conoce` · M

- **La escena:** al conectar su número: "Ya leí tus chats de los últimos 3 meses. Esto aprendí: set acrílico ₡15.000,
  atendés de martes a sábado, pedís ₡5.000 de seña, saludás con «hola linda». ¿Empiezo a atender así?".
- **Por qué enamora:** no llena formularios y se siente conocida desde el primer minuto.
- **Prueba barata:** que la primera clienta exporte 5 chats (sin archivos) y sacar de ahí, con el modelo, el resumen
  "esto aprendí"; mostrárselo. Señal: "¿cómo supo eso?" y menos de tres correcciones.
- **Se construye:** al conectar con coexistencia, pedir el historial (hay una sola oportunidad, dentro de las 24 horas
  de conectar, y los webhooks tienen que estar listos antes) y extraer solo hechos del negocio: servicios y precios,
  horario, política de seña, preguntas frecuentes y forma de saludar. Se muestra para confirmar. Después aprende de
  las correcciones de la dueña en la bandeja ("a las frecuentes les doy 10 %": ¿lo aplico siempre?). Mientras no haya
  coexistencia: subir chats exportados o la foto de la lista de precios (V1.2).
- **Cuidado:** son mensajes de las clientas: se procesan para configurar el negocio, no se guarda el texto y va en la
  política de privacidad. Siempre confirma la dueña.
- **Depende de:** V0.3 para la versión automática. **Mejora:** V1.2.
- **Evidencia:** hipótesis.

### M5 · "Me hace quedar como una pro" — `me-hace-quedar-pro` · M

- **La escena:** cada tarde: "tu historia de mañana está lista, tocá y compartila" con la imagen de espacios
  disponibles y su marca. Al terminar un trabajo, la profesional le manda la foto a la asistente: la clienta la recibe
  con los cuidados y el link de reseña, y a las tres semanas, "ya te toca relleno".
- **Por qué enamora:** publicar los espacios y las fotos todos los días es una carga; esto la hace ver profesional sin
  esfuerzo.
- **Prueba barata:** armarle a mano la historia de mañana y mandársela. Señal: la publica, y al otro día la pide.
- **Se construye:** (1) la imagen diaria de espacios disponibles, lista para compartir; (2) foto del trabajo terminado:
  queda en la ficha, se le manda a la clienta y vuelve con un texto listo para Instagram; (3) cuando alguien pregunta
  "¿tenés fotos?", la asistente manda trabajos reales parecidos.
- **Ya hay:** marca propia, fotos en Storage, reseñas, recordatorios.
- **Cuidado:** permiso de la clienta para publicar su foto. Generar la imagen sin dependencias pesadas.
- **Se conecta con:** V2.6 (fotos en la ficha) y V3.1 (te toca de nuevo).
- **Evidencia:** hipótesis (publicar los espacios disponibles en historias es práctica común del rubro).

### M6 · "Tu recepcionista en 60 segundos" — `recepcionista-en-60s` · M

- **La escena:** en la landing: "mandanos tu lista de precios". Un minuto después: "esta es TU asistente, escribile
  como si fueras una clienta". La prueba con sus servicios y sus precios, y se la reenvía a una colega.
- **Por qué enamora:** ve la suya, no una demo genérica, antes de registrarse. También sirve para vender: se le arma la
  asistente a un negocio y se le manda el link.
- **Prueba barata:** armarle a mano la asistente a una colega de la primera clienta en el chat de prueba y mandarle el
  link. Señal: la prueba y pregunta el precio.
- **Se construye:** un número de Selyon que atiende muchas asistentes de prueba (cada link trae un código que elige
  cuál); alta sin registro desde la lista de precios; vence a los 7 días; botón "la quiero para mi negocio".
- **Cuidado:** tope de costo por prueba y por día; ningún dato real de clientas.
- **Depende de:** V1.1 y V1.2. **Mejora:** V1.5.
- **Evidencia:** hipótesis.

### M7 · "Mi semana, para presumir" — `mi-semana` · S

- **La escena:** el sábado llega una tarjeta linda: "23 clientas atendidas, ₡412.000, 3 clientas nuevas, 14 citas las
  agendó tu asistente mientras trabajabas".
- **Por qué enamora:** ve lo que logró, y lo comparte. Cada tarjeta compartida nos muestra a otras dueñas.
- **Prueba barata:** una tarjeta hecha a mano con sus números reales. Señal: la comparte en su estado.
- **Se construye:** tarjeta semanal y mensual con botón para compartir y opción de ocultar los montos. A fin de año, "tu
  año" para el negocio y, con permiso, para cada clienta.
- **Se conecta con:** V1.7 (los mismos números, con "cómo se calcula").
- **Evidencia:** hipótesis.

---

## V0 · Un negocio feliz

**Meta que cierra la fase:** el primer negocio usa su número real 2 semanas seguidas, el agente le agenda al menos 15
citas sin errores graves y la dueña lo recomendaría (9 o 10 de 10).

### V0.1 · CI en verde otra vez — `ci-verde` · S

- **Por qué:** hoy todos los PRs salen en rojo por dos causas que no son de los PRs, así que la señal no sirve.
- **Incluye:** que el typecheck raíz no dependa de `web/` sin instalar (o instalar antes); fijar el runner en
  `ubuntu-24.04` (en 26.04 Playwright 1.60 no instala Chromium); confirmar en CI el test de push de
  `whatsapp.panel.spec.ts`, que en el contenedor de la nube falla por el navegador.
- **Ya hay:** las dos causas diagnosticadas en `docs/prompts-produccion/PROGRESO.md` (sección del deploy).
- **Listo cuando:** los checks del PR abierto más viejo de la pila pasan sin tocar código del producto.
- **Evidencia:** hecho comprobado. Es parte del prompt `ci-cd` de Carril P y se adelanta.

### V0.2 · Cerrar los P0 de Carril P — `produccion-p0` · serie existente

- **Por qué:** antes de que un negocio dependa del producto tiene que haber restore probado, rollback, monitoreo de
  caída y topes de gasto.
- **Incluye:** los P0 que faltan del índice de `docs/prompts-produccion/`: staging, dominio y SSL, CI/CD del stack
  nuevo, backups (copia fuera del servidor), restore probado, rollback, correo (SPF, DKIM, DMARC), uptime, prompt
  injection y topes de gasto.
- **Cómo:** con `/prod-readiness`, no con `/producto`.
- **Te toca a vos:** responder las decisiones pendientes de esa serie; correr los evals con la key real; completar los
  `[PENDIENTE]` legales; lo urgente del sistema viejo (`DEPLOY.md` §26.1).
- **Listo cuando:** los P0 figuran "hecho" en `docs/prompts-produccion/PROGRESO.md` y el deploy sale del CI.

### V0.3 · Número real sin perder la app — `numero-real-coexistencia` · L

- **Por qué:** es lo que hoy impide que el primer negocio lo use de verdad. Una dueña no va a entregar su WhatsApp: tiene
  que poder seguir usando la app WhatsApp Business en su teléfono mientras el agente atiende.
- **Incluye:**
  1. Primero, leer la documentación oficial de Meta: versión vigente de Embedded Signup (se reportó que la v2 se
     retiró el 2026-10-15), requisitos y países de la coexistencia, y sus límites.
  2. Embedded Signup al día y alta con coexistencia (`featureType: "whatsapp_business_app_onboarding"`).
  3. Los mensajes que la dueña manda desde su app entran a la conversación (webhooks de eco) y **callan al agente en
     ese chat** (modo humano), para que nunca contesten los dos.
  4. Aviso cuando la cuenta se desconecta o se reconecta; guía en el panel (versión mínima de la app, abrirla cada
     tantos días, qué cambia en la app).
  5. Decidir si se traen contactos e historial al conectar.
- **Ya hay:** Embedded Signup sin coexistencia (`web/src/modules/whatsapp/embeddedSignup.ts`), modo humano en la
  bandeja, alta manual de un número desde el superadmin.
- **Decisiones tuyas:** si se sincroniza el historial; qué pasa con los chats que ya estaban abiertos al conectar.
- **Te toca a vos:** terminar la verificación del negocio en Meta, pedir el acceso de proveedor de tecnología, crear la
  configuración de Embedded Signup y probar con el número de la primera clienta.
- **Listo cuando:** la primera clienta conecta su número desde el panel, sigue usando su app, el agente responde, y si
  ella contesta desde el teléfono el agente se calla en ese chat. Tests con los payloads de eco.
- **Evidencia:** bloqueo real del primer negocio.

### V0.4 · Costo real por conversación — `costo-por-conversacion` · M

- **Por qué:** el precio del plan depende de esto. Se reportó que desde el 2026-10-01 Meta cobra también los mensajes
  dentro de la ventana de 24 horas; si es así, cada respuesta del agente cuesta.
- **Incluye:** contar los mensajes enviados por negocio, mes y tipo (texto libre, plantilla *utility*, plantilla de
  marketing); tabla de tarifas configurable por entorno; costo estimado de Meta junto al de IA en el superadmin; un
  agente que no gaste mensajes de más (una respuesta por turno, botones en vez de listas largas, sin confirmaciones
  repetidas) con un eval "mensajes por cita agendada".
- **Ya hay:** costo de IA por negocio y mes y topes por plan (`ai_usage_monthly`, `src/plans.ts`). No hay, a confirmar
  en la especificación, un conteo de mensajes enviados por tipo.
- **Decisiones tuyas:** quién le paga a Meta (cada negocio con su medio de pago, o Selyon con un cupo incluido); si el
  negocio ve su costo estimado.
- **Te toca a vos:** confirmar la tarifa vigente para Costa Rica en la página oficial de Meta.
- **Listo cuando:** el superadmin muestra por negocio el costo del mes (IA más Meta estimado) y el promedio de mensajes
  por conversación; el eval nuevo corre en seco.
- **Evidencia:** reportes de terceros sobre el cambio de tarifa; falta la fuente oficial.

### V0.5 · Ayuda y feedback dentro del panel — `ayuda-y-feedback` · S

- **Por qué:** sin un canal directo, los primeros negocios se traban en silencio y se van.
- **Incluye:** botón "¿Necesitás ayuda?" que abre el WhatsApp de soporte con el negocio y la pantalla ya escritos; caja
  "Contanos qué te faltó" que guarda el mensaje y avisa por Telegram; una encuesta de una sola pregunta al día 30
  ("¿qué tan decepcionada estarías si mañana no pudieras usarlo?").
- **Ya hay:** alertas a Telegram (`src/platform/observability/alerts.ts`).
- **Decisiones tuyas:** el número oficial de soporte.
- **Listo cuando:** un mensaje de prueba llega a Telegram con el negocio y la pantalla; E2E del botón.
- **Evidencia:** hipótesis (práctica común en productos en etapa temprana).

---

## V1 · Cinco negocios que pagan

**Meta que cierra la fase:** 5 negocios pagando; del alta a la primera cita agendada por el agente en menos de 24 horas
sin tocar nada técnico; 4 de 5 siguen activos a las 4 semanas.

### V1.1 · "Probá tu agente" — `probar-agente` · M

- **Por qué:** la verificación de Meta tarda días; la dueña tiene que ver a su agente funcionar en los primeros
  minutos. También es la demostración de venta.
- **Incluye:** un chat de prueba en WhatsApp IA que corre el agente real con la configuración del negocio; lo que
  agenda queda marcado como prueba y no ensucia la agenda ni los reportes; tope propio de mensajes de prueba.
- **Ya hay:** el agente corre separado del canal (`createAgentRunner`); no hay simulador.
- **Decisiones tuyas:** si las citas de prueba se guardan marcadas o no se guardan.
- **Listo cuando:** un negocio recién creado conversa con su agente antes de conectar WhatsApp; E2E.
- **Evidencia:** hipótesis.

### V1.2 · Alta con IA — `alta-con-ia` · M

- **Por qué:** cargar servicios, precios y horarios a mano es donde se abandona. Meta: negocio configurado en menos de
  10 minutos.
- **Incluye:** pegar el texto o subir la foto de la lista de precios y que la IA proponga servicios (nombre, duración,
  precio, categoría) en una pantalla para revisar y guardar; lo mismo para el horario y las preguntas frecuentes,
  contados en una frase.
- **Ya hay:** plantillas de rubro con servicios de ejemplo, importar clientes por CSV, lectura de fotos y audios en el
  módulo de WhatsApp.
- **Decisiones tuyas:** tope de costo de IA por alta.
- **Listo cuando:** de una foto real de una lista de precios sale un catálogo revisable; nunca se guarda sin que la
  dueña confirme; tests con el modelo simulado.
- **Momento mágico:** M4 lo aprende de sus chats.
- **Evidencia:** hipótesis.

### V1.3 · Plantillas de Meta solas — `plantillas-meta-auto` · M

- **Por qué:** hoy cada número necesita que alguien cree y haga aprobar sus plantillas a mano (`GUIA-META.md` §E). Con
  eso no hay alta sin ayuda.
- **Incluye:** al conectar un número, crear por la API las plantillas estándar (recordatorio, seguimiento, rescate,
  marketing) en el registro del negocio; seguir su estado y mostrarlo en el panel; reintentar con una variante si la
  rechazan.
- **Ya hay:** el panel guarda nombre e idioma de las plantillas de cada número; los textos por registro (vos, tú, usted).
- **Depende de:** V0.3 (permisos de la app de Meta).
- **Listo cuando:** un número nuevo queda con sus plantillas enviadas a revisión sin intervención, y el panel avisa
  cuáles están aprobadas.
- **Evidencia:** pendiente operativo conocido (I2 e I6 en `ROADMAP.md`).

### V1.4 · Link y QR de reservas por WhatsApp — `link-y-qr` · S

- **Por qué:** es la "página de reservas" de un producto que vive en WhatsApp, y cuesta casi nada.
- **Incluye:** link `wa.me` con mensaje inicial; QR con la marca del negocio para imprimir; textos listos para la bio de
  Instagram y el perfil de Google; contar las citas que entraron por el link.
- **Decisiones tuyas:** generar el QR con una librería conocida (pasa por la política de dependencias) o a mano.
- **Listo cuando:** la dueña descarga su QR y una cita agendada desde el link queda atribuida.
- **Evidencia:** hipótesis.

### V1.5 · Demo viva y landing con precios — `demo-y-precios` · M

- **Por qué:** nadie compra un agente de WhatsApp sin chatear con uno. Hoy la landing dice "Consultar precio".
- **Incluye:** un número de Selyon con un negocio de demostración que cualquiera puede probar y que se reinicia solo
  cada noche; botón "Probalo por WhatsApp"; precios publicados y oferta de clientes fundadores; una página por rubro
  (uñas y pestañas, estética, dental).
- **Ya hay:** landing en `landing/`, negocio demo del seed (`npm run seed:dev`).
- **Decisiones tuyas:** precios, oferta, número de la demo.
- **Te toca a vos:** conseguir el número de la demo.
- **Listo cuando:** un visitante agenda una cita ficticia desde la landing sin hablar con nadie.
- **Momento mágico:** M6 le arma su propia asistente.
- **Evidencia:** hipótesis fuerte (es como se venden estos productos).

### V1.6 · Embudo de activación — `embudo-activacion` · S

- **Por qué:** con pocos negocios, cada alta trabada se puede rescatar a mano si alguien se entera a tiempo.
- **Incluye:** por negocio, en qué paso va (alta, horario, servicios, WhatsApp conectado, primera cita del agente, 10
  citas); aviso por Telegram si lleva más de 48 horas en el mismo paso; correo automático a la dueña con el paso que
  sigue.
- **Ya hay:** métricas de activación y uso en el superadmin (`src/admin/metrics.ts`, `daily_usage`) y los primeros
  pasos del Inicio (I6.9).
- **Listo cuando:** un negocio de prueba detenido dispara el aviso y el correo.
- **Evidencia:** hipótesis.

### V1.7 · "Tu mes con Selyon" — `valor-del-mes` · M

- **Por qué:** es lo que justifica el pago. Tiene que llegar antes de la primera renovación.
- **Incluye:** tarjeta en el Inicio y resumen mensual por correo con: citas que agendó el agente y cuántas fuera de
  horario, conversaciones atendidas sin una persona, horas ahorradas (con la regla a la vista), plata de rescate, upsell
  y recompra, y la comparación con el precio del plan. Solo números defendibles, cada uno con "cómo se calcula".
- **Ya hay:** métricas del agente y de crecimiento, reportes y correo por la cola.
- **Decisiones tuyas:** la regla de "horas ahorradas"; si además se manda por WhatsApp (cuesta una plantilla).
- **Listo cuando:** el primer negocio recibe su resumen con números que coinciden con Reportes.
- **Momento mágico:** M7 lo vuelve una tarjeta para compartir.
- **Evidencia:** hipótesis fuerte.

---

## V2 · No pueden vivir sin él

**Meta que cierra la fase:** 20 negocios pagando; baja mensual menor al 5 %; al menos 40 % de las citas entran por el
agente; 40 % o más de las dueñas estaría "muy decepcionada" si lo perdiera.

### V2.1 · Resumen diario — `resumen-diario` · S

- **Por qué:** crea el hábito sin tener que abrir el panel.
- **Incluye:** a la hora que elija cada persona, la agenda de mañana, lo que falta confirmar o cobrar y lo que hizo el
  agente ("mientras dormías agendó 3"). Por push y por correo; por WhatsApp solo si el costo lo justifica.
- **Ya hay:** push por usuario, correo por la cola, Inicio con citas de hoy y sin confirmar.
- **Listo cuando:** dueña y profesional reciben cada uno lo suyo; se puede apagar.
- **Momento mágico:** la versión que enamora es M1 (por audio y con respuesta).
- **Evidencia:** hipótesis.

### V2.2 · Señas por SINPE desde el chat — `senas-sinpe` · L

- **Por qué:** la seña es lo que más baja los plantones, y hoy se pide y se revisa a mano.
- **Incluye:** reglas de seña (por servicio, clienta nueva, reincidente); el agente la pide con los datos de SINPE que
  cargó el negocio, nunca inventados; la clienta manda el comprobante; la IA lee monto, fecha y referencia; queda "seña
  por verificar" y la dueña aprueba o rechaza con un toque; al aprobar se registra el pago y se confirma la cita; si no
  llega, el cupo se libera solo.
- **Ya hay:** señas en Ventas (`kind: deposit`), SINPE como método de pago, fotos de las clientas en Storage.
- **Decisiones tuyas:** monto por defecto; cuánto se espera el comprobante.
- **Cuidado:** un comprobante se puede falsificar: siempre aprueba una persona. La confirmación automática es V3.7.
- **Listo cuando:** una cita con seña pasa de pedida a confirmada sin que la dueña escriba un mensaje.
- **Momento mágico:** M3 la confirma sola con el aviso del banco.
- **Evidencia:** hipótesis fuerte (práctica común del rubro).

### V2.3 · Política de cancelación y no-shows — `no-shows` · M

- **Incluye:** hasta cuándo se puede cancelar o reprogramar por el chat y cuántas veces; quien dejó plantada queda con
  seña obligatoria la próxima vez; mensaje automático y amable; reporte de plantones y de plata protegida.
- **Ya hay:** estado `no_show`, motivo de cancelación, tope de citas próximas por clienta.
- **Depende de:** V2.2 para exigir la seña.
- **Listo cuando:** el agente respeta la política en los evals y el reporte muestra los plantones del mes.
- **Evidencia:** hipótesis.

### V2.4 · Lista de espera y relleno de huecos — `lista-de-espera` · M

- **Incluye:** "avisame si se libera": el agente anota día, servicio y profesional; cuando se cancela una cita ofrece
  el hueco en orden, con botones, y se lo da a la primera que acepta; la lista se ve en el panel; se cuentan los huecos
  rellenados.
- **Ya hay:** nada.
- **Listo cuando:** una cancelación de prueba termina en una cita nueva sin intervención.
- **Evidencia:** hipótesis.

### V2.5 · Agenda que vuela en el celular — `agenda-rapida` · M

- **Por qué:** la agenda es la pantalla que más se usa. Si cuesta, vuelven al cuaderno.
- **Incluye:** primero observar a dos negocios usándola y contar toques por tarea. De ahí se elige: arrastrar para
  mover o alargar, crear una cita en tres toques desde un hueco, citas que se repiten, bloqueos rápidos, deshacer.
- **Ya hay:** vistas de día y semana por profesional; crear, mover y cancelar; anti-solape en la base.
- **Te toca a vos:** la observación (o grabar la pantalla con permiso).
- **Listo cuando:** las tres tareas más frecuentes bajan de toques, medido antes y después.
- **Evidencia:** falta la observación.

### V2.6 · Ficha 360 y memoria de la clienta — `ficha-360` · L

- **Incluye:** una sola línea de tiempo (citas, pagos, mensajes, notas); el chat de WhatsApp dentro de la ficha; fotos
  del trabajo; y **memoria**: preferencias que el agente guarda y usa ("siempre con Ana", "prefiere sábados", "alérgica
  al látex"), que la dueña puede ver, corregir y borrar.
- **Ya hay:** ficha con historial, notas, etiquetas, campos propios y profesional preferido; conversaciones en el
  módulo de WhatsApp.
- **Decisiones tuyas:** consentimiento para las fotos; qué puede recordar el agente y qué no.
- **Listo cuando:** el agente propone a la profesional de siempre en un eval, y la dueña puede borrar ese recuerdo.
- **Evidencia:** hipótesis.

### V2.7 · Mi agenda en el calendario del celular — `calendario-ical` · S

- **Incluye:** un enlace privado por profesional para ver sus citas en el calendario de Google o de Apple; se puede
  anular; sin dependencias nuevas.
- **Cuidado:** es una ruta pública con token: va al inventario de rutas, con token largo y sin datos de más.
- **Listo cuando:** una cita nueva aparece en el calendario del teléfono.
- **Evidencia:** hipótesis.

### V2.8 · "Qué hay de nuevo" y centro de ayuda — `novedades-y-ayuda` · S

- **Incluye:** una tarjeta por cada cambio visible, escrita en el mismo PR que lo hace; diez guías cortas con capturas
  generadas con Playwright; pantallas vacías que enseñan el siguiente paso.
- **Listo cuando:** la definición de "terminado" incluye la tarjeta de novedades.
- **Evidencia:** hipótesis.

### V2.9 · Salud de los negocios — `salud-de-clientes` · S

- **Incluye:** en el superadmin, un semáforo por negocio (uso de los últimos 7 días contra las 4 semanas anteriores,
  citas del agente, último ingreso, errores); aviso por Telegram cuando uno cae; lista "llamar esta semana".
- **Ya hay:** métricas de uso por negocio.
- **Listo cuando:** un negocio que deja de usarlo aparece en rojo y avisa.
- **Evidencia:** hipótesis.

---

## V3 · Les hace ganar más

**Meta que cierra la fase:** 50 negocios pagando; al menos 30 % en Pro; cada negocio ve 5 veces o más lo que paga.

### V3.1 · "Te toca de nuevo" — `te-toca-de-nuevo` · M

- **Por qué:** es plata que llega sin que la dueña haga nada.
- **Incluye:** un ciclo por servicio (la plantilla de rubro trae valores: relleno de pestañas cada 3 semanas, limpieza
  dental cada 6 meses); a quien le toca y no tiene cita, el agente le escribe con horarios como botones; frenos por
  consentimiento, baja y un máximo por ciclo; citas y plata recuperadas en "Tu mes".
- **Ya hay:** segmento "te toca de nuevo" en Campañas (manual), barrido y plantilla del rescate de cotizaciones.
- **Listo cuando:** una clienta de prueba recibe la invitación una sola vez y agenda con un toque.
- **Evidencia:** hipótesis fuerte.

### V3.2 · Copiloto de la dueña por WhatsApp — `copiloto-duena` · L

- **Por qué:** nadie más lo tiene y calza con la promesa: manejar el negocio desde WhatsApp.
- **Incluye:** la dueña escribe desde su teléfono registrado: "¿qué tengo mañana?", "bloqueame el viernes de 2 a 5",
  "pasá a María al sábado a las 10", "¿cuánto vendí esta semana?". Un agente aparte, con herramientas de
  administración, que confirma antes de cambiar algo y deja todo en la auditoría.
- **Cuidado:** solo teléfonos verificados del equipo, y PIN para lo sensible.
- **Listo cuando:** las diez preguntas y acciones más comunes pasan en evals propios.
- **Momento mágico:** se adelanta dentro de M1.
- **Evidencia:** hipótesis.

### V3.3 · Instagram y Messenger en la misma bandeja — `instagram-messenger` · L

- **Por qué:** en belleza, la mitad de las consultas entra por Instagram.
- **Incluye:** mensajes de Instagram y Messenger en la bandeja, con el mismo agente y las mismas reglas.
- **Te toca a vos:** la revisión de la app en Meta para esos permisos.
- **Listo cuando:** un mensaje directo de Instagram termina en una cita.
- **Evidencia:** hipótesis.

### V3.4 · Paquetes, bonos y tarjetas de regalo — `paquetes-y-bonos` · L · *validar*

- **Señal para construirlo:** 3 negocios que hoy venden paquetes y los llevan en un cuaderno.
- **Alcance mínimo:** vender un paquete de N sesiones, descontar al completar la cita, saldo en la ficha, y que el
  agente sepa "te quedan 2".

### V3.5 · Cumpleaños, referidos de clientas y sellos — `cumple-referidos-lealtad` · M

- **Incluye:** saludo de cumpleaños con regalo, "traé una amiga" con código, tarjeta de sellos. Montado sobre Campañas.
  Cada mensaje fuera de la ventana cuesta: se muestra el costo estimado antes de activar.
- **Evidencia:** hipótesis.

### V3.6 · Campañas con IA — `campanas-con-ia` · S

- **Incluye:** "quiero llenar el martes": la IA propone a quién, el texto en el tono del negocio, la hora y el costo
  estimado; la dueña aprueba.
- **Ya hay:** Campañas con segmentos, vista previa y resultados.
- **Evidencia:** hipótesis.

### V3.7 · Cobro automático con un procesador local — `sinpe-automatico` · L · *validar*

- **Señal para construirlo:** negocios con más de 30 señas al mes que piden dejar de revisar comprobantes.
- **Alcance mínimo:** confirmación automática de la seña con un procesador que ofrezca SINPE Móvil y tarjeta (Tilopay
  y ONVO Pay lo anuncian; faltan comisiones y requisitos).

### V3.8 · Factura electrónica vía un proveedor — `factura-electronica` · L · *validar*

- **Señal para construirlo:** 5 negocios formales que lo ponen como condición o pagarían más.
- **Alcance mínimo:** emitir desde el cobro a través de un proveedor de factura electrónica (versión 4.4), nunca
  directo contra Hacienda.

### V3.9 · Página de reservas web — `reservas-web` · M · *validar*

- **Señal para construirlo:** clientas que no quieren chatear, o un canal que lo exija (Google, Instagram).
- **Ya hay:** el canal `web` en el modelo de citas.

### V3.10 · Venta de productos e inventario simple — `productos-inventario` · M · *validar*

- **Señal para construirlo:** 3 negocios que venden productos y lo piden.

---

## V4 · Se vende solo

**Meta que cierra la fase:** 100 negocios pagando; más de la mitad de las altas se activan sin ayuda.

### V4.1 · Alta abierta de punta a punta — `alta-abierta` · M

- **Incluye:** abrir `SIGNUP_ENABLED` con el recorrido completo sin intervención: alta, plantilla, alta con IA, probar
  el agente, conectar WhatsApp con coexistencia y primera cita. Con los candados de seguridad y legales resueltos.
- **Ya hay:** alta self-service apagada, verificación de correo, prueba gratis y pausa por falta de pago.
- **Depende de:** V0.3, V1.1, V1.2, V1.3.

### V4.2 · Referidos entre negocios — `referidos-negocios` · S

- **Incluye:** "invitá a otro negocio: un mes gratis para las dos"; código, seguimiento y crédito en el cobro.

### V4.3 · Soporte atendido por nuestro propio agente — `soporte-con-ia` · S

- **Incluye:** Selyon como cliente de sí mismo: el número de soporte lo atiende el agente con el centro de ayuda como
  conocimiento, y te pasa lo que no sabe.
- **Depende de:** V2.8.

### V4.4 · Segundo rubro a fondo — `segundo-rubro` · L

- **Señal para construirlo:** 3 negocios pagando de ese rubro. Candidatos: dental (presupuestos y plan de tratamiento
  con cuotas) o barbería (fila y atención sin cita).

### V4.5 · Nombre y marca definitivos — `marca-definitiva` · S

- **Incluye:** elegir el nombre (`PLAN-GESTION.md` §8), dominio y marca. El nombre vive en una constante.

### V4.6 · Segundo país — `segundo-pais` · L

- **Señal para construirlo:** demanda entrante. Pide pagos, tarifas de mensajes, moneda y textos legales del país.

---

## Siempre, en paralelo

No son épicas con principio y fin: se revisan en cada PR que las toque.

### Q1 · Rendimiento — `rendimiento`

El panel tiene que ser usable en menos de 2 segundos con 4G. El archivo principal pesa unos 811 kB: partirlo por
pantalla. Medir en cada PR grande.

### Q2 · Calidad del agente — `calidad-del-agente`

Cada error real entra como caso de eval (`/feedback`). Línea base corrida con la key real. Cada dos semanas, revisar
conversaciones anonimizadas y buscar patrones.

### Q3 · Diseño consistente — `diseno-consistente`

Una guía viva del sistema de diseño ("Banca privada") y capturas en celular y escritorio, claro y oscuro, en cada PR
que toque pantallas.

### Q4 · Confiabilidad — `confiabilidad`

Objetivo de 99,5 % mensual, alertas, una página de estado simple y un restore probado cada trimestre.

---

## Cómo entra una épica nueva

Por `/feedback`. Si lo que pide un cliente no calza en ninguna épica, Claude propone un brief corto con este mismo
formato, en la fase que corresponda, o explica por qué no ahora. Vos decidís si entra.

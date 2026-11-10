---
description: Procesa lo que dijo un cliente (texto, audio transcrito o captura): lo clasifica, lo anota sin datos personales, suma evidencia al backlog y propone qué hacer y qué responderle
---

Feedback recibido: $ARGUMENTS

Si vino vacío, pedímelo: qué dijo o qué pasó, de qué tipo de negocio es (rubro y cuántas personas, sin nombres) y en
qué pantalla o chat ocurrió.

Leé `docs/plan-producto/FEEDBACK.md` y `docs/plan-producto/BACKLOG.md`.

1. **Clasificá:** error (algo falló) · error del agente (dijo o hizo algo mal en un chat) · fricción (se puede, pero
   cuesta) · pedido (función nueva) · elogio.
2. **Anotalo** como una fila en `FEEDBACK.md`. El repo es público: nunca nombres, teléfonos ni mensajes textuales de
   clientas, ni el nombre del negocio. Usá "Negocio A, uñas, 2 personas"; si es un negocio nuevo, dale la letra que
   sigue y decime cuál es para que yo lleve la lista aparte.
3. **Según el tipo:**
   - **Error:** reproducilo. Si el arreglo es chico, hacelo en `fix/<slug>` con un test que falle antes, y abrí un PR
     apilado sobre el último PR abierto. Si no es chico, proponé la épica.
   - **Error del agente:** escribí un caso nuevo en `eval/transcripts/` que lo reproduzca, con datos inventados.
     Después corregí el prompt, las tools o las guardias, corré los evals y abrí el PR.
   - **Fricción o pedido:** buscá la épica del BACKLOG que lo cubre y actualizá su línea de **Evidencia** ("pedido por
     2 negocios: A y C"). Si es una épica *validar* y llegó a su señal, avisame. Si no calza en ninguna, proponé un
     brief corto con el formato del BACKLOG y en qué fase iría, o decime por qué no ahora.
   - **Elogio:** anotalo y recordame pedir permiso para usarlo como testimonio.
4. **Proponé qué responderle** al cliente, en dos líneas, en voseo y sin prometer fechas.
5. **Resumí** en tres líneas: qué anotaste, qué cambió en el backlog y qué vas a hacer ahora, o qué necesitás que yo
   decida.

Cuando una épica o un arreglo se publique, revisá en `FEEDBACK.md` a quién hay que avisarle y marcá esas filas como
"publicado".

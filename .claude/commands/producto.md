---
description: Ejecuta una épica del plan de producto (PLAN-PRODUCTO.md) como PR apilado sobre el último PR abierto; sin argumento, dice dónde estamos y propone la siguiente
---

Ejecutás el plan de producto. Leé primero `PLAN-PRODUCTO.md` (§0, §4 y §8), `docs/plan-producto/BACKLOG.md`, el
Carril V de `ROADMAP.md` y `docs/plan-producto/FEEDBACK.md`.

Épica pedida (slug del BACKLOG): $ARGUMENTS

**Si no vino ninguna:** decime en cinco líneas en qué fase estamos, qué falta para la meta que la cierra y qué épicas
están hechas o en curso. Proponé la siguiente según el orden del BACKLOG y la evidencia de FEEDBACK, y esperá a que te
diga cuál.

**Antes de empezar una épica:**
- Si es `produccion-p0`, no sigas acá: se hace con `/prod-readiness`.
- Si es de una fase posterior a la actual, o está marcada *validar*, decime qué meta o qué señal falta y preguntame si
  igual seguimos.
- Si ya existe `docs/plan-producto/specs/<slug>.md`, retomá desde ahí: no la reescribas.
- Si es del grupo M (momentos mágicos), revisá primero si su prueba barata ya se hizo y qué salió (FEEDBACK). Si no se
  hizo, proponeme hacerla antes de construir y ayudame a prepararla.

**Ciclo de una épica**

0. **Base.** Buscá el último PR abierto que no sea borrador (`gh pr list` o la herramienta de GitHub de la sesión) y
   traé su rama. Creá `feat/<slug>` desde su cabeza. Nunca rebase ni force-push de ramas ajenas.
1. **Especificación al momento.** Leé el brief y el código de hoy, y escribí `docs/plan-producto/specs/<slug>.md` con:
   problema y para quién · cómo funciona hoy (archivo y función, verificado, sin números de línea) · flujo propuesto
   paso a paso con los textos reales en voseo · datos y migraciones · API (rutas, roles, plan) · pantallas con sus
   estados vacío, de carga y de error, en celular · agente (tools, prompt, evals) si lo toca · costos (IA y mensajes de
   Meta) · qué evento de uso se registra · pruebas · riesgos y cómo se apaga · fuera de alcance · rebanadas (un PR cada
   una) en orden · decisiones mías · lo que me toca hacer a mí. Si el brief dice "verificar en la documentación
   oficial", hacelo primero y citá la fuente; si no se puede abrir, decímelo.
2. **Decisiones.** Haceme juntas todas las preguntas, con tu recomendación en cada una. Guardá mis respuestas textuales
   en la especificación. No construyas antes.
3. **Construir** la primera rebanada: algo usable de punta a punta, no una capa suelta. Trabajá vos en esta sesión;
   subagentes en paralelo solo si te lo pido.
4. **Verificar.** `npm run typecheck` en la raíz y en `web/`, `npm test`, los `ci:*`, `db:check` si hay migración,
   Playwright (panel simulado y smoke del server), `EVAL_DRY_RUN=1 npm run eval` si tocaste al agente (y la corrida
   real si hay key). Sacá capturas en celular (390 px) y escritorio, en claro y oscuro, y miralas vos antes de
   mostrármelas. Repasá la lista de "terminado" de `PLAN-PRODUCTO.md` §8 y decime qué punto no se cumple.
5. **PR apilado** sobre el último PR abierto. En la descripción: qué cambia para la dueña, en simple · cómo probarlo en
   2 minutos · verificación con números · decisiones tomadas · lo que me queda a mí. Nunca lo unás vos.
6. **Cierre.** En el mismo commit del trabajo: casilla de la épica en `ROADMAP.md` (y la fecha de "Última
   actualización"). Si cambió la evidencia o el alcance, actualizá el brief. Decime cómo publicarlo
   (`docs/prompts-produccion/PROGRESO.md`, "Deploy de un cambio") y a qué negocios avisarles, según FEEDBACK.
7. Si quedan rebanadas, preguntame si sigo con la próxima.

**Reglas**
- Una épica a la vez. No arranques otra sin preguntarme.
- Política de dependencias de `CLAUDE.md`. Sin secretos. El repo es público: ningún dato de clientes en archivos,
  commits ni PRs.
- Migraciones aditivas. Rutas nuevas, a `test/security/routeInventory.test.ts`. Lo que toca datos lleva su test de
  aislamiento entre negocios.
- Si un test queda en rojo o algo no se puede verificar, pará y decímelo con la salida. No lo des por bueno.

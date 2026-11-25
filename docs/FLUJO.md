# Flujo del proyecto

## Quién hace qué
| Capa | Carpeta | Lenguaje | Responsabilidad |
|---|---|---|---|
| Interfaz | codigo/frontend | HTML, CSS, JS | Mostrar pictogramas, voz, capturar toques |
| Servidor | codigo/backend | Python (FastAPI) | Puente: recibe el estado, llama al agente, responde |
| Cerebro | codigo/ia_models | Python | Decidir cómo y qué ayuda dar |
| Datos | datos | JSON | Escenarios y pictogramas (una sola fuente) |

## Qué pasa en una partida
```
 NAVEGADOR (JS)                        SERVIDOR (Python)
 ─────────────                         ─────────────────
 1. Abre la página  ──GET /api/retos──▶ lee datos/*.json ──▶ devuelve retos y pictogramas
 2. Muestra reto (pictogramas + voz)
 3. Jugador toca un pictograma
      ├─ acierta → ✔ verde, siguiente reto
      └─ se equivoca (o pasan 15 s, o pide 💡)
            │  POST /api/agente/decidir  {reto, errores, nivel_ayuda, evento, previo}
            ▼
                                       agente.py:
                                        a) Q-Learning mira el estado y elige ACCIÓN:
                                           esperar / pista sutil / media / explícita / animar
                                           (previo = cómo le fue en el reto anterior)
                                        b) Entropía elige QUÉ PISTA: etiqueta con más ganancia,
                                           su pictograma y qué opciones incorrectas atenuar
            ◀─ {accion, nivel, mensaje, picto, quitar} ─
 4. api.js ejecuta la acción: muestra y dice la pista, atenúa opciones, anima
 5. Cada evento ──POST /api/registro──▶ datos/resultados/registro_partidas.jsonl
```
Si el servidor no responde, `api.js` aplica las reglas fijas de la demo: el juego nunca se rompe.

## Cómo se entrena (offline, antes de jugar)
`entrenar_evaluar.py` hace jugar al agente 4 000 partidas (36 000 retos) contra jugadores simulados,
repite el entrenamiento con 5 semillas, guarda lo aprendido en `q_table.npy` y compara 3 agentes
(reglas fijas, entropía, Q-Learning) sobre las mismas partidas.
Reglas que el agente respeta siempre: no repetir la misma ayuda seguida y, si el jugador pide 💡, darle una pista.

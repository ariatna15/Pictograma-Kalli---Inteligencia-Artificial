# PictoViaje · El Gran Viaje (Kallpa-Play AI · 1ASI0404)

Juego con pictogramas para la Asociación Kallpa. El **agente de IA** decide cómo ayudar al jugador
(Q-Learning) y qué pista dar (entropía / ganancia de información).

## Estructura
```
PictoViaje/
├── codigo/
│   ├── frontend/            LO QUE VE EL JUGADOR (HTML + CSS + JS, sin Python)
│   │   ├── index.html       estructura de las pantallas
│   │   ├── css/styles.css   estilos (alto contraste, botones grandes)
│   │   ├── js/app.js        lógica de la pantalla (turnos, aciertos, pistas)
│   │   ├── js/voz.js        voz: audios pregrabados de Kalli o, si faltan, voz del navegador
│   │   ├── js/kalli.js      Kalli, la mascota guía (poses y globo de texto). Elegir "camaleon" o "llama" y el crédito aquí
│   │   ├── img/mascota/     poses del camaleón: pregunta, idea, lentes, graduado
│   │   ├── audio/           voz de Kalli en .mp3 (se crea con generar_audios.py)
│   │   ├── js/api.js        habla con el backend; si no hay backend usa reglas fijas
│   │   ├── js/datos-respaldo.js   copia de los datos (GENERADA, no editar)
│   │   └── img/             pictogramas ARASAAC
│   ├── backend/main.py      SERVIDOR (FastAPI): recibe eventos, devuelve decisiones
│   ├── backend/generar_audios.py   crea la voz de Kalli con voz neuronal (una sola vez)
│   └── ia_models/           EL CEREBRO (Python puro, sin web)
│       ├── entorno.py       estados S, acciones A, carga de datos
│       ├── entropia.py      BASELINE: pista por ganancia de información
│       ├── q_learning.py    MODELO PRINCIPAL: tabla Q
│       ├── simulador.py     jugadores simulados (rápido, normal, lento, frustrable)
│       ├── entrenar_evaluar.py   entrena (5 semillas) y compara 3 agentes
│       ├── demo_consola.py  partida guiada paso a paso en la consola (evidencia Hito 2)
│       ├── agente.py        une Q-Learning + entropía para usarlo en vivo
│       └── q_table.npy      lo aprendido (se regenera al entrenar)
├── datos/
│   ├── escenarios.json      niveles, retos, mensajes y frases de Kalli  <- EDITAR AQUÍ
│   ├── pictogramas.json     catálogo con etiquetas (tags) de cada pictograma
│   └── resultados/          comparacion_agentes.csv, convergencia_semillas.csv,
│                            politica_aprendida.csv y registro de partidas
├── docs/                    FLUJO.md, gráficos (convergencia_q.png, comparacion_agentes.png) e informe
└── requirements.txt
```

## Cómo ejecutarlo (Visual Studio Code + Python 3.9+)
Abrir la carpeta `PictoViaje` en VS Code, abrir una terminal (Ctrl+ñ) y:
```
python -m venv .venv                 # una sola vez: entorno aislado
.venv\Scripts\activate               # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt      # una sola vez
python -m codigo.ia_models.entrenar_evaluar   # opcional: reentrena y genera métricas (~10 s)
python -m codigo.ia_models.demo_consola       # opcional: partida guiada en la consola
uvicorn codigo.backend.main:app --reload      # levanta el juego
```
Abrir http://127.0.0.1:8000 en el navegador. Panel del educador: `?educador` al final de la URL.

**Importante:** los comandos se ejecutan desde la carpeta `PictoViaje` (la raíz), no desde `codigo`.
Si abren `index.html` con doble clic funciona en modo respaldo (reglas fijas, sin IA).

## Si cambian los escenarios
1. Editar `datos/escenarios.json` / `datos/pictogramas.json` (cada pictograma lleva `tags`).
2. `python -m codigo.ia_models.exportar_respaldo`
3. `python -m codigo.ia_models.entrenar_evaluar`  (reentrenar el agente)

## Voz de Kalli (que no suene robótica)
El juego trae una voz de respaldo (la del navegador; en **Microsoft Edge** suena mucho más natural que en Chrome).
Para la voz definitiva, generen los audios **una sola vez** (necesita internet, ~2 minutos):
```
pip install edge-tts
python -m codigo.backend.generar_audios                      # voz peruana: es-PE-CamilaNeural
python -m codigo.backend.generar_audios --voz es-MX-DaliaNeural --rehacer   # probar otra voz
```
Se crean `codigo/frontend/audio/*.mp3` e `indice.js`; el juego los usa solos. Si cambian frases en
`datos/escenarios.json`, vuelvan a ejecutar el comando (solo crea los audios que faltan).

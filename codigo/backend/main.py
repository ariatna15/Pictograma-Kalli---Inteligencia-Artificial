"""BACKEND (FastAPI). Recibe lo que pasa en la pantalla y responde qué hacer.
Ejecutar desde la carpeta PictoViaje/:   uvicorn codigo.backend.main:app --reload
Luego abrir:  http://127.0.0.1:8000
"""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from codigo.ia_models.agente import AgenteGuia
from codigo.ia_models.entorno import RAIZ

app = FastAPI(title="PictoViaje")
agente = AgenteGuia()                       # carga la tabla Q una sola vez
LOG = RAIZ / "datos" / "resultados" / "registro_partidas.jsonl"


class Estado(BaseModel):                    # lo que manda el navegador
    escenario_id: str
    errores: int = 0
    nivel_ayuda: int = -1
    evento: str = "error"                   # "error" | "tiempo" | "pedida"
    intentadas: List[str] = []
    aciertos: List[str] = []
    ultima_accion: Optional[str] = None
    previo: int = 0                         # cómo le fue en el reto anterior: 0 bien · 1 regular · 2 le costó


@app.get("/api/retos")
def retos():
    """Escenarios y pictogramas (la fuente única son los JSON de /datos)."""
    esc = json.load(open(RAIZ / "datos" / "escenarios.json", encoding="utf-8"))
    pic = json.load(open(RAIZ / "datos" / "pictogramas.json", encoding="utf-8"))
    return {"pictos": pic, "niveles": esc["niveles"], "retos": esc["retos"], "frases": esc["frases"], "agente_entrenado": agente.entrenado}


@app.post("/api/agente/decidir")
def decidir(e: Estado):
    datos = e.model_dump() if hasattr(e, "model_dump") else e.dict()   # pydantic 2 o 1
    return agente.decidir(**datos)


@app.post("/api/registro")
def registro(evento: dict):
    """Guarda cada evento de la partida (sirve para CRISP-DM y para el panel del educador)."""
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(evento, ensure_ascii=False) + "\n")
    return {"ok": True}


# Debe ir al final: sirve la carpeta frontend como página principal.
app.mount("/", StaticFiles(directory=RAIZ / "codigo" / "frontend", html=True), name="frontend")

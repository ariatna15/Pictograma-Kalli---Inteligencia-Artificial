"""Genera frontend/js/datos-respaldo.js desde los JSON de /datos (copia para modo sin servidor).
Ejecutar desde PictoViaje/:  python -m codigo.ia_models.exportar_respaldo"""
import json
from .entorno import RAIZ

esc = json.load(open(RAIZ / "datos" / "escenarios.json", encoding="utf-8"))
pic = json.load(open(RAIZ / "datos" / "pictogramas.json", encoding="utf-8"))
dump = lambda x: json.dumps(x, ensure_ascii=False, indent=1)
(RAIZ / "codigo" / "frontend" / "js" / "datos-respaldo.js").write_text(
    "// GENERADO por ia_models/exportar_respaldo.py -- no editar a mano (editar /datos/*.json)\n"
    f"let PICTOS = {dump(pic)};\nlet NIVELES = {dump(esc['niveles'])};\nlet RETOS = {dump(esc['retos'])};\n"
    f"let FRASES = {dump(esc['frases'])};\n",
    encoding="utf-8")
print("datos-respaldo.js generado")

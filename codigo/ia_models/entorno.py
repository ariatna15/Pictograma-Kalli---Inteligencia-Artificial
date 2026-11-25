"""ENTORNO DEL JUEGO: formaliza S (estados), A (acciones) y carga los datos.

Estado S del agente (lo que sabe en cada decisión) = 4 variables:
    errores     : 0, 1 o 2  (con 3 errores se muestra la respuesta y termina el reto)
    nivel_ayuda : -1 (ninguna), 0 sutil, 1 media, 2 explícita  (la mayor dada en este reto)
    evento      : por qué se pide decidir -> "error", "tiempo" (15 s sin tocar) o "pedida" (tocó 💡)
    previo      : cómo le fue al jugador en el reto ANTERIOR
                  0 = sin errores · 1 = con 1 error · 2 = le costó (2+ errores, respuesta mostrada o abandono)
  "previo" es la memoria del agente: así distingue a un jugador que viene bien de uno que viene
  con dificultades, y adapta la ayuda a cada persona.
  Tamaño: 3 x 4 x 3 x 3 = 108 estados.

Acciones A del agente (qué hace el sistema):
    0 esperar | 1 pista sutil | 2 pista media | 3 pista explícita | 4 animar

Reglas de transición (resumen):
    - acierto  -> se llena una casilla; si completó las que pide el reto, VICTORIA del reto
    - error    -> errores + 1, esa opción se descarta; el agente decide cómo ayudar
    - tiempo / pedida -> el agente decide cómo ayudar
Fin del reto: victoria (completó), respuesta mostrada (3 errores) o abandono (solo en simulación).
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]          # carpeta PictoViaje/
ACCIONES = ["esperar", "pista_sutil", "pista_media", "pista_explicita", "animar"]
EVENTOS = ["error", "tiempo", "pedida"]
MAX_ERRORES = 3
ESPERAR, SUTIL, MEDIA, EXPLICITA, ANIMAR = 0, 1, 2, 3, 4


def cargar_datos():
    esc = json.load(open(RAIZ / "datos" / "escenarios.json", encoding="utf-8"))
    pic = json.load(open(RAIZ / "datos" / "pictogramas.json", encoding="utf-8"))
    retos = {r["id"]: r for r in esc["retos"]}
    return retos, pic, esc["mensajes_tag"], esc


def indice_estado(errores, nivel_ayuda, evento, previo=0):
    """Convierte el estado en 4 números (índices de la tabla Q)."""
    return (min(errores, 2), nivel_ayuda + 1, EVENTOS.index(evento), min(max(previo, 0), 2))


def calcular_previo(final, errores):
    """Resume un reto terminado en 0, 1 o 2 (es el 'previo' del siguiente reto)."""
    if final != "exito" or errores >= 2:
        return 2
    return errores


def acciones_prohibidas(evento, ultima):
    """Reglas de seguridad que el agente respeta SIEMPRE (al entrenar y al jugar):
    - no repetir la misma ayuda dos veces seguidas (evita respuestas repetitivas);
    - si el jugador pide una pista (💡), se le da una pista: no se le ignora ni solo se le anima."""
    prohibidas = set()
    if ultima is not None and ultima != ESPERAR:
        prohibidas.add(ultima)
    if evento == "pedida":
        prohibidas |= {ESPERAR, ANIMAR}
    if len(prohibidas) >= len(ACCIONES):      # nunca dejar al agente sin opciones
        prohibidas = {ESPERAR, ANIMAR} if evento == "pedida" else set()
    return prohibidas

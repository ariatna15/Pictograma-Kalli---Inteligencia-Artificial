"""AGENTE EN VIVO: lo que usa el backend durante una partida real.
Combina las dos piezas de IA:
  - Q-Learning decide QUÉ HACER (esperar, pista sutil/media/explícita o animar).
  - Entropía decide QUÉ PISTA dar (qué etiqueta mencionar, con qué pictograma, y qué opciones apagar).
Respeta las mismas reglas de seguridad que se usaron al entrenar (entorno.acciones_prohibidas).
"""
from pathlib import Path
from .entorno import (cargar_datos, indice_estado, acciones_prohibidas, ACCIONES,
                      ESPERAR, SUTIL, MEDIA, EXPLICITA)
from .entropia import mejor_pista
from .q_learning import AgenteQ

RUTA_Q = Path(__file__).parent / "q_table.npy"


class AgenteGuia:
    def __init__(self):
        self.retos, self.pictos, self.mensajes, esc = cargar_datos()
        self.picto_tag = esc.get("picto_tag", {})
        self.q = AgenteQ()
        try:
            self.q.cargar(RUTA_Q)
            self.entrenado = True
        except (FileNotFoundError, ValueError):     # sin tabla (o de otra versión): reglas fijas
            self.entrenado = False

    def _accion(self, estado, evento, nivel_ayuda, ultima):
        prohibidas = acciones_prohibidas(evento, ultima)
        if self.entrenado:
            return self.q.elegir(estado, 0.0, prohibidas)
        # Respaldo sin entrenar = escalera de la demo del Hito 1
        if evento == "pedida":
            return min(nivel_ayuda + 1, 2) + 1
        if evento == "error":
            return min(estado[0], 2) + 1
        return MEDIA if nivel_ayuda < 1 else ESPERAR

    def decidir(self, escenario_id, errores, nivel_ayuda, evento, intentadas=(), aciertos=(),
                ultima_accion=None, previo=0):
        reto = self.retos[escenario_id]
        ultima = ACCIONES.index(ultima_accion) if ultima_accion in ACCIONES else None
        estado = indice_estado(errores, nivel_ayuda, evento, previo)
        a = self._accion(estado, evento, nivel_ayuda, ultima)

        cand = [c for c in reto["opciones"] if c not in intentadas and c not in aciertos]
        tag, ganancia, quitar = mejor_pista(cand, set(reto["correctos"]), self.pictos)
        resp = dict(accion=ACCIONES[a], nivel=None, quitar=[], mensaje=None, tag=tag, picto=None,
                    ganancia=round(ganancia, 3), fuente="q_learning" if self.entrenado else "reglas",
                    estado=dict(errores=estado[0], nivel_ayuda=nivel_ayuda, evento=evento, previo=estado[3]))
        if a in (SUTIL, MEDIA, EXPLICITA):
            resp["nivel"] = a - 1                                          # 0 sutil · 1 media · 2 explícita
            resp["mensaje"] = self.mensajes.get(tag) if tag else None      # None -> el front usa la pista del reto
            resp["picto"] = self.picto_tag.get(tag) if tag else None       # pictograma que acompaña la pista
            if a >= MEDIA:
                resp["quitar"] = quitar
        return resp

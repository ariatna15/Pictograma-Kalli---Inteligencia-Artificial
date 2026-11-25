"""JUGADORES SIMULADOS: sirven para ENTRENAR y EVALUAR al agente sin niños reales.
Cada perfil se parece a un tipo de jugador distinto. El mismo jugador juega TODOS los retos
de una partida, así que su frustración se arrastra (en parte) de un reto al siguiente.
(Limitación a declarar en el informe: son supuestos nuestros; lo ideal es validarlos con
jugadores reales de Kallpa.)
"""
import random

# habilidad: prob. de acertar sabiendo | paciencia: frustración que aguanta | bloqueo: prob. de quedarse parado
PERFILES = {
    "rapido":     dict(habilidad=0.75, paciencia=3.5, bloqueo=0.05),
    "normal":     dict(habilidad=0.45, paciencia=2.5, bloqueo=0.20),
    "lento":      dict(habilidad=0.20, paciencia=2.5, bloqueo=0.45),
    "frustrable": dict(habilidad=0.35, paciencia=1.2, bloqueo=0.20),
}
# Perfil que el agente NUNCA ve al entrenar: sirve para probar si generaliza.
PERFILES_PRUEBA = {
    "distraido":  dict(habilidad=0.50, paciencia=2.0, bloqueo=0.55),
}
TODOS = {**PERFILES, **PERFILES_PRUEBA}


class Jugador:
    def __init__(self, perfil, rng=None):
        self.p = TODOS[perfil]
        self.rng = rng or random
        self.frustracion = 0.0

    def nuevo_reto(self):
        """Al pasar de reto se calma un poco, pero no del todo."""
        self.frustracion *= 0.5

    def turno(self, n_cand, n_correctas, ayuda):
        """Devuelve 'acierto', 'error', 'tiempo' (se queda parado), 'pedida' (toca 💡) o 'abandono'."""
        if self.frustracion > self.p["paciencia"] and self.rng.random() < 0.5:
            return "abandono"
        if self.rng.random() < self.p["bloqueo"] * (1 - 0.25 * (ayuda + 1)):
            return "pedida" if self.rng.random() < 0.3 else "tiempo"
        s = min(0.95, self.p["habilidad"] + 0.12 * (ayuda + 1))
        p_ok = s + (1 - s) * n_correctas / max(n_cand, 1)     # si no sabe, adivina entre las que quedan
        if self.rng.random() < p_ok:
            return "acierto"
        self.frustracion += 1
        return "error"

    def animar(self):
        self.frustracion = max(0.0, self.frustracion - 1.5)

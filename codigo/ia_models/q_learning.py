"""MODELO PRINCIPAL: Q-LEARNING.

Una tabla Q guarda "qué tan buena es cada ACCIÓN en cada ESTADO".
Después de cada decisión se corrige con la fórmula:
    Q[s,a] = Q[s,a] + alfa * ( recompensa + gamma * max(Q[s',:]) - Q[s,a] )
    - alfa  : cuánto cambiamos lo aprendido (0.1 = poquito cada vez)
    - gamma : cuánto importa el futuro (0.9 = mucho)
Exploración epsilon-greedy: al inicio prueba acciones al azar (epsilon = 1) y poco a poco
usa lo aprendido (epsilon baja hasta 0.05).
Con el tiempo, la tabla aprende por ejemplo: "a un jugador que viene con dificultades y
acaba de equivocarse conviene animarlo o darle una pista más clara".
"""
import numpy as np
from .entorno import ACCIONES

FORMA = (3, 4, 3, 3, len(ACCIONES))   # errores x nivel_ayuda x evento x previo x acciones


class AgenteQ:
    def __init__(self, alfa=0.1, gamma=0.9, rng=None):
        self.Q = np.zeros(FORMA)
        self.visitas = np.zeros(FORMA[:-1], dtype=int)   # cuántas veces se decidió en cada estado
        self.alfa, self.gamma = alfa, gamma
        self.rng = rng or np.random.default_rng(0)

    def elegir(self, s, epsilon=0.0, prohibidas=()):
        """epsilon > 0: a veces prueba una acción al azar (explorar)."""
        validas = [a for a in range(len(ACCIONES)) if a not in prohibidas]
        if self.rng.random() < epsilon:
            return int(self.rng.choice(validas))
        return max(validas, key=lambda a: self.Q[s][a])

    def actualizar(self, s, a, r, s_sig):
        self.visitas[s] += 1
        futuro = 0.0 if s_sig is None else self.Q[s_sig].max()
        self.Q[s][a] += self.alfa * (r + self.gamma * futuro - self.Q[s][a])

    def guardar(self, ruta):
        np.save(ruta, self.Q)

    def cargar(self, ruta):
        Q = np.load(ruta)
        if Q.shape != FORMA:
            raise ValueError(f"q_table.npy tiene forma {Q.shape} y se esperaba {FORMA}: vuelve a entrenar")
        self.Q = Q

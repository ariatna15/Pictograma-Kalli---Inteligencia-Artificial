"""BASELINE: pista elegida con ENTROPÍA y GANANCIA DE INFORMACIÓN (idea de ID3).

Idea: quedan varias opciones (candidatas) y solo algunas son correctas.
La entropía mide cuánta duda hay: 0 = ya se sabe todo, 1 = mitad y mitad.
Cada pictograma tiene etiquetas (tags): "sol", "estudio", "juego"...
Para cada etiqueta calculamos cuánto BAJA la duda si separamos las candidatas
en "con la etiqueta" y "sin la etiqueta". Elegimos la etiqueta con más ganancia
(y que apunte hacia lo correcto). Esa etiqueta es la pista y las opciones
incorrectas que no la tienen se atenúan.
"""
import math


def entropia(n_correctas, n_total):
    if n_total == 0 or n_correctas in (0, n_total):
        return 0.0
    p = n_correctas / n_total
    return -(p * math.log2(p) + (1 - p) * math.log2(1 - p))


def mejor_pista(candidatas, correctas, pictos):
    """Devuelve (etiqueta, ganancia, a_quitar) o (None, 0, []) si no hay pista útil."""
    n = len(candidatas)
    k = sum(c in correctas for c in candidatas)
    h0 = entropia(k, n)
    mejor = (None, 0.0, [])
    etiquetas = {t for c in candidatas for t in pictos[c]["tags"]}
    for t in sorted(etiquetas):
        con = [c for c in candidatas if t in pictos[c]["tags"]]
        sin = [c for c in candidatas if t not in pictos[c]["tags"]]
        if not con or not sin:
            continue
        kc, ks = sum(c in correctas for c in con), sum(c in correctas for c in sin)
        if kc / len(con) <= ks / len(sin):      # la etiqueta debe apuntar a lo correcto
            continue
        h = len(con) / n * entropia(kc, len(con)) + len(sin) / n * entropia(ks, len(sin))
        gan = h0 - h
        if gan > mejor[1] + 1e-9:
            mejor = (t, gan, [c for c in sin if c not in correctas])
    return mejor


def quitar_mitad(candidatas, correctas, pictos=None):
    """Lo que hace la demo actual (reglas fijas): atenuar la mitad de las incorrectas."""
    malas = [c for c in candidatas if c not in correctas]
    return malas[: len(malas) // 2]


def quitar_entropia(candidatas, correctas, pictos):
    return mejor_pista(candidatas, correctas, pictos)[2]

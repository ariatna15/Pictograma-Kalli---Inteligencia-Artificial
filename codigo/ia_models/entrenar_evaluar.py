"""Entrena el Q-Learning con jugadores simulados y compara 3 agentes.
Ejecutar desde la carpeta PictoViaje/:   python -m codigo.ia_models.entrenar_evaluar

Agentes que se comparan (los tres juegan EXACTAMENTE las mismas partidas simuladas):
  1_reglas_fijas : estrategia de la demo del Hito 1 (sube la ayuda según los errores)
                   y, en la pista media, apaga opciones incorrectas al azar.
  2_entropia     : BASELINE de IA. Misma escalera de ayuda, pero la pista y las opciones que
                   se apagan se eligen con ganancia de información (idea de ID3).
  3_qlearning    : MODELO PRINCIPAL. La tabla Q decide qué hacer en cada estado
                   (esperar, pista sutil/media/explícita o animar) + pistas por entropía.

Genera:
  codigo/ia_models/q_table.npy               lo aprendido (semilla 0)
  datos/resultados/comparacion_agentes.csv   métricas por agente y perfil de jugador
  datos/resultados/convergencia_semillas.csv resultado final de 5 entrenamientos (semillas 0-4)
  datos/resultados/politica_aprendida.csv    qué decide el agente en cada estado frecuente
  docs/convergencia_q.png, docs/comparacion_agentes.png   gráficos para el informe
"""
import csv
import random
import numpy as np
from .entorno import (cargar_datos, indice_estado, calcular_previo, acciones_prohibidas,
                      RAIZ, MAX_ERRORES, ACCIONES, EVENTOS,
                      ESPERAR, SUTIL, MEDIA, EXPLICITA, ANIMAR)
from .entropia import quitar_mitad, quitar_entropia
from .q_learning import AgenteQ
from .simulador import Jugador, PERFILES, TODOS

SESIONES_ENTRENAMIENTO = 4000      # 1 sesión = un jugador juega todos los retos (9) -> 36 000 retos
SESIONES_EVALUACION = 500          # por perfil y por agente
SEMILLAS = [0, 1, 2, 3, 4]

# Recompensa (lo que le decimos al agente que es "bueno" para Kallpa)
R_PASO = -0.2           # cada decisión cuesta un poco: no alargar el reto
R_REPETIR = -1.0        # repetir la misma ayuda seguida
R_EXITO = 10.0          # el jugador resolvió el reto...
R_POR_AYUDA = 1.5       # ...menos 1.5 por cada nivel de ayuda que necesitó (queremos autonomía)
R_POR_TURNO = 0.3       # ...menos 0.3 por turno
R_REVELADA = -6.0       # hubo que mostrarle la respuesta
R_ABANDONO = -15.0      # se frustró y dejó de jugar: lo peor para un usuario de Kallpa


# ---------------------------------------------------------------------------
# Políticas
# ---------------------------------------------------------------------------
def politica_reglas(s, evento, prohibidas=()):
    """Escalera fija de la demo del Hito 1 (no evita repetir: es la referencia)."""
    errores, ayuda1, _, _ = s                      # ayuda1 = nivel_ayuda + 1
    if evento == "pedida":
        return min(ayuda1, 2) + 1                  # la siguiente pista
    if evento == "error":
        return min(errores, 2) + 1                 # 1 error -> media, 2 errores -> explícita
    return MEDIA if ayuda1 < 2 else ESPERAR        # tiempo: pista media si aún no la tuvo


def politica_q(q, epsilon=0.0):
    return lambda s, evento, prohibidas: q.elegir(s, epsilon, prohibidas)


# ---------------------------------------------------------------------------
# Un reto y una sesión
# ---------------------------------------------------------------------------
def jugar_reto(politica, quitar_fn, jug, reto, pictos, rng, previo, aprender=None):
    jug.nuevo_reto()
    cand = list(reto["opciones"])
    correctas = set(reto["correctos"])
    faltan = reto["cuantos"]
    ayuda, errores, turnos, ult, prev, total = -1, 0, 0, None, None, 0.0
    decisiones = repetidas = 0
    while True:
        turnos += 1
        res = jug.turno(len(cand), sum(c in correctas for c in cand), ayuda)
        if res == "abandono":
            final = "abandono"
            break
        if res == "acierto":
            cand.remove(rng.choice([c for c in cand if c in correctas]))
            faltan -= 1
            if faltan <= 0:
                final = "exito"
                break
            continue                                   # acierto parcial: no se pide ayuda
        if res == "error":
            errores += 1
            cand.remove(rng.choice([c for c in cand if c not in correctas]))
            if errores >= MAX_ERRORES:
                final = "revelada"
                break
        evento = "error" if res == "error" else res    # "error", "tiempo" o "pedida"
        s = indice_estado(errores, ayuda, evento, previo)
        if aprender and prev:
            aprender.actualizar(*prev, s)
        a = politica(s, evento, acciones_prohibidas(evento, ult))
        repite = a == ult and a != ESPERAR
        decisiones += 1
        repetidas += repite
        if a == SUTIL:
            ayuda = max(ayuda, 0)
        elif a == MEDIA:
            ayuda = max(ayuda, 1)
            cand = [c for c in cand if c not in quitar_fn(cand, correctas, pictos)]
        elif a == EXPLICITA:
            ayuda = 2
            cand = [c for c in cand if c in correctas]     # se señala lo correcto
        elif a == ANIMAR:
            jug.animar()
        r = R_PASO + (R_REPETIR if repite else 0.0)
        prev, ult, total = (s, a, r), a, total + r
    R = {"exito": R_EXITO - R_POR_AYUDA * (ayuda + 1) - R_POR_TURNO * turnos,
         "revelada": R_REVELADA, "abandono": R_ABANDONO}[final]
    if aprender and prev:
        aprender.actualizar(prev[0], prev[1], prev[2] + R, None)
    return dict(final=final, errores=errores, turnos=turnos, ayuda=ayuda + 1,
                decisiones=decisiones, repetidas=repetidas, recompensa=total + R)


def jugar_sesion(politica, quitar_fn, perfil, retos, pictos, rng, aprender=None):
    """Un mismo jugador juega todos los retos en orden; 'previo' pasa de un reto al siguiente."""
    jug = Jugador(perfil, rng)
    previo, salida = 0, []
    for reto in retos:
        r = jugar_reto(politica, quitar_fn, jug, reto, pictos, rng, previo, aprender)
        previo = calcular_previo(r["final"], r["errores"])
        salida.append(r)
    return salida


# ---------------------------------------------------------------------------
# Entrenamiento
# ---------------------------------------------------------------------------
def entrenar(retos, pictos, semilla=0, sesiones=SESIONES_ENTRENAMIENTO):
    rng = random.Random(semilla)
    q = AgenteQ(rng=np.random.default_rng(semilla))
    curva = []                                       # (recompensa, éxito) de cada reto
    for ses in range(sesiones):
        eps = max(0.05, 1.0 - ses / (0.7 * sesiones))   # explora mucho al inicio y poco al final
        for r in jugar_sesion(politica_q(q, eps), quitar_entropia, rng.choice(list(PERFILES)),
                              retos, pictos, rng, aprender=q):
            curva.append((r["recompensa"], r["final"] == "exito"))
    return q, np.array(curva)


# ---------------------------------------------------------------------------
# Evaluación (sin explorar, sin aprender)
# ---------------------------------------------------------------------------
def resumir(nombre, perfil, rs):
    dec = sum(x["decisiones"] for x in rs)
    return dict(agente=nombre, perfil=perfil,
                exito=np.mean([x["final"] == "exito" for x in rs]),
                abandono=np.mean([x["final"] == "abandono" for x in rs]),
                revelada=np.mean([x["final"] == "revelada" for x in rs]),
                turnos=np.mean([x["turnos"] for x in rs]),
                ayuda=np.mean([x["ayuda"] for x in rs]),
                repeticion=(sum(x["repetidas"] for x in rs) / dec) if dec else 0.0,
                recompensa=np.mean([x["recompensa"] for x in rs]))


def evaluar(nombre, politica, quitar_fn, retos, pictos, perfiles=TODOS, n=SESIONES_EVALUACION, semilla=123):
    filas, todos = [], []
    for perfil in perfiles:
        rng = random.Random(semilla)                 # mismas partidas para todos los agentes
        rs = [r for _ in range(n) for r in jugar_sesion(politica, quitar_fn, perfil, retos, pictos, rng)]
        filas.append(resumir(nombre, perfil, rs))
        if perfil in PERFILES:
            todos += rs
    filas.append(resumir(nombre, "PROMEDIO (4 perfiles de entrenamiento)", todos))
    return filas


def politica_aprendida(q):
    """Estados que el agente visitó al menos 50 veces y la acción que elige en cada uno."""
    filas = []
    for idx in np.ndindex(q.visitas.shape):
        if q.visitas[idx] < 50:
            continue
        e, a1, ev, pr = idx
        valores = q.Q[idx]
        proh = acciones_prohibidas(EVENTOS[ev], None)
        mejor = max((a for a in range(len(ACCIONES)) if a not in proh), key=lambda a: valores[a])
        filas.append(dict(errores=e, nivel_ayuda=a1 - 1, evento=EVENTOS[ev], previo=pr,
                          accion=ACCIONES[mejor], visitas=int(q.visitas[idx]),
                          **{f"Q_{n}": round(float(v), 2) for n, v in zip(ACCIONES, valores)}))
    return filas


def guardar_csv(ruta, filas):
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=filas[0].keys())
        w.writeheader()
        w.writerows({k: (round(v, 3) if isinstance(v, (float, np.floating)) else v) for k, v in x.items()}
                    for x in filas)


# ---------------------------------------------------------------------------
# Gráficos para el informe
# ---------------------------------------------------------------------------
AZUL, NARANJA, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
TINTA, TINTA2, GRILLA = "#0b0b0b", "#52514e", "#e4e3df"


def _ejes(ax):
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    for lado in ("left", "bottom"):
        ax.spines[lado].set_color(GRILLA)
    ax.tick_params(colors=TINTA2, labelsize=9)
    ax.grid(axis="y", color=GRILLA, linewidth=0.8)
    ax.set_axisbelow(True)


def graficar(curvas, filas, docs):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    # 1) Convergencia: recompensa y tasa de éxito por bloques de 1 800 retos (200 sesiones)
    bloque = 1800
    n_bloques = min(len(c) for c in curvas) // bloque
    x = (np.arange(n_bloques) + 1) * bloque
    rec = np.array([[c[i * bloque:(i + 1) * bloque, 0].mean() for i in range(n_bloques)] for c in curvas])
    exi = np.array([[c[i * bloque:(i + 1) * bloque, 1].mean() * 100 for i in range(n_bloques)] for c in curvas])
    fig, axs = plt.subplots(1, 2, figsize=(9, 3.4))
    for ax, datos, titulo in ((axs[0], rec, "Recompensa media por reto"), (axs[1], exi, "Retos resueltos (%)")):
        m, d = datos.mean(0), datos.std(0)
        ax.fill_between(x, m - d, m + d, color=AZUL, alpha=0.18, linewidth=0)
        ax.plot(x, m, color=AZUL, linewidth=2)
        ax.axvline(0.7 * len(curvas[0]), color=TINTA2, linewidth=1, linestyle=(0, (3, 3)))
        ax.set_title(titulo, fontsize=10, color=TINTA, loc="left")
        ax.set_xlabel("retos jugados durante el entrenamiento", fontsize=9, color=TINTA2)
        _ejes(ax)
    axs[0].text(0.7 * len(curvas[0]), axs[0].get_ylim()[0], "  fin de la exploración", fontsize=8,
                color=TINTA2, va="bottom")
    fig.suptitle("Convergencia del Q-Learning (media ± desviación de 5 semillas)", fontsize=11, color=TINTA, x=0.01, ha="left")
    fig.tight_layout()
    fig.savefig(docs / "convergencia_q.png", dpi=160)
    plt.close(fig)

    # 2) Comparación de agentes por perfil (barras desde cero)
    perfiles = list(TODOS)
    agentes = [("1_reglas_fijas", "Reglas fijas (Hito 1)", AZUL),
               ("2_entropia", "Baseline: entropía (ID3)", NARANJA),
               ("3_qlearning", "Q-Learning", AQUA)]
    metricas = [(lambda f: (1 - f["exito"]) * 100, "Retos sin resolver (%)  · menos es mejor"),
                (lambda f: f["ayuda"], "Nivel de ayuda medio (0-3)  · menos es mejor")]
    fig, axs = plt.subplots(1, 2, figsize=(10, 3.6))
    ancho = 0.26
    for ax, (valor, titulo) in zip(axs, metricas):
        for i, (ag, etiqueta, color) in enumerate(agentes):
            vals = [valor(next(f for f in filas if f["agente"] == ag and f["perfil"] == p)) for p in perfiles]
            ax.bar(np.arange(len(perfiles)) + (i - 1) * ancho, vals, ancho - 0.03, color=color, label=etiqueta,
                   edgecolor="white", linewidth=1)
        ax.set_xticks(np.arange(len(perfiles)))
        ax.set_xticklabels([p + ("*" if p not in PERFILES else "") for p in perfiles], fontsize=9)
        ax.set_title(titulo, fontsize=10, color=TINTA, loc="left")
        ax.set_ylim(bottom=0)
        _ejes(ax)
    h, l = axs[0].get_legend_handles_labels()
    fig.legend(h, l, fontsize=9, frameon=False, loc="upper left", ncol=3, bbox_to_anchor=(0.01, 0.99))
    fig.text(0.01, 0.01, "* perfil no visto durante el entrenamiento (prueba de generalización)", fontsize=8, color=TINTA2)
    fig.tight_layout(rect=(0, 0.04, 1, 0.9))
    fig.savefig(docs / "comparacion_agentes.png", dpi=160)
    plt.close(fig)


# ---------------------------------------------------------------------------
def main():
    retos_dic, pictos, _, _ = cargar_datos()
    retos = list(retos_dic.values())                 # en el orden del juego (nivel 1 -> 3)
    resultados = RAIZ / "datos" / "resultados"
    docs = RAIZ / "docs"

    # Entrenar con 5 semillas: muestra que el resultado no depende de la suerte
    curvas, por_semilla, q0 = [], [], None
    for sem in SEMILLAS:
        q, curva = entrenar(retos, pictos, semilla=sem)
        curvas.append(curva)
        prom = evaluar("3_qlearning", politica_q(q), quitar_entropia, retos, pictos, perfiles=PERFILES)[-1]
        por_semilla.append(dict(semilla=sem, **{k: v for k, v in prom.items() if k not in ("agente", "perfil")}))
        if sem == 0:
            q0 = q
    q0.guardar(RAIZ / "codigo" / "ia_models" / "q_table.npy")
    guardar_csv(resultados / "convergencia_semillas.csv", por_semilla)
    guardar_csv(resultados / "politica_aprendida.csv", politica_aprendida(q0))

    filas = (evaluar("1_reglas_fijas", politica_reglas, quitar_mitad, retos, pictos)
             + evaluar("2_entropia", politica_reglas, quitar_entropia, retos, pictos)
             + evaluar("3_qlearning", politica_q(q0), quitar_entropia, retos, pictos))
    guardar_csv(resultados / "comparacion_agentes.csv", filas)
    graficar(curvas, filas, docs)

    print(f"{'agente':16}{'perfil':40}{'éxito':>7}{'aband.':>8}{'revel.':>8}{'turnos':>8}{'ayuda':>7}{'repite':>8}{'recomp.':>9}")
    for x in filas:
        print(f"{x['agente']:16}{x['perfil']:40}{x['exito']:7.3f}{x['abandono']:8.3f}{x['revelada']:8.3f}"
              f"{x['turnos']:8.2f}{x['ayuda']:7.2f}{x['repeticion']:8.3f}{x['recompensa']:9.2f}")
    print("\nQ-Learning con 5 semillas (promedio de los 4 perfiles):")
    for x in por_semilla:
        print(f"  semilla {x['semilla']}: éxito {x['exito']:.3f} · abandono {x['abandono']:.3f} · "
              f"ayuda {x['ayuda']:.2f} · recompensa {x['recompensa']:.2f}")


if __name__ == "__main__":
    main()

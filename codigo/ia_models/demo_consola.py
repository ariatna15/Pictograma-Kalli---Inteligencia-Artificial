"""PARTIDA GUIADA EN CONSOLA: muestra, turno a turno, cómo el agente guía a un jugador.
Sirve como evidencia del Hito 2 (interacción usuario -> agente -> pista hasta la respuesta).

Ejecutar desde la carpeta PictoViaje/:
    python -m codigo.ia_models.demo_consola                       (jugador "normal", todos los retos)
    python -m codigo.ia_models.demo_consola --perfil frustrable --semilla 3
    python -m codigo.ia_models.demo_consola --retos E2 E3

El jugador es simulado (simulador.py); el agente es el MISMO que usa el juego (agente.py).
"""
import argparse
import random
from .agente import AgenteGuia
from .entorno import MAX_ERRORES, calcular_previo
from .simulador import Jugador, TODOS

ANIMOS = "Casi. ¡Tú puedes! Prueba otra vez."


def jugar(agente, reto, jug, rng, previo, nombre):
    P = agente.pictos
    txt = lambda c: P[c]["texto"]
    print(f"\n=== Reto {reto['id']} · nivel {reto['nivel']} ===")
    print(f"Agente pregunta (pictogramas): {' + '.join('[' + txt(c).upper() + ']' for c in reto['pregunta'])}")
    print(f"Agente dice: \"{reto['frase']}\"")
    print(f"Opciones: {', '.join(txt(c) for c in reto['opciones'])}")

    correctas = set(reto["correctos"])
    intentadas, aciertos, apagadas = [], [], set()
    errores, ayuda, ultima, turno = 0, -1, None, 0
    jug.nuevo_reto()
    while True:
        turno += 1
        cand = [c for c in reto["opciones"] if c not in intentadas and c not in aciertos]
        visibles = [c for c in cand if c not in apagadas] or cand
        res = jug.turno(len(visibles), sum(c in correctas for c in visibles), ayuda)

        if res == "abandono":
            print(f"  Turno {turno} · {nombre} deja de jugar (frustración).")
            return "abandono", errores
        if res == "acierto":
            c = rng.choice([c for c in visibles if c in correctas])
            aciertos.append(c)
            print(f"  Turno {turno} · {nombre} toca: {txt(c)}  ✔")
            if len(aciertos) >= reto["cuantos"]:
                print("  Agente: ¡Muy bien! ⭐  -> reto resuelto")
                return "exito", errores
            print("  Agente: ¡Muy bien! Falta uno más.")
            continue
        if res == "error":
            c = rng.choice([c for c in visibles if c not in correctas])
            intentadas.append(c)
            errores += 1
            print(f"  Turno {turno} · {nombre} toca: {txt(c)}  ✘ (sin castigo: la opción se descarta)")
            if errores >= MAX_ERRORES:
                falta = [c for c in reto["opciones"] if c in correctas and c not in aciertos][0]
                print(f"  Agente: Aquí va {txt(falta)}. ¡Sigamos juntos!  -> respuesta mostrada")
                return "revelada", errores
            evento = "error"
        else:
            evento = res
            quien = "no toca nada (15 s)" if res == "tiempo" else "toca 💡 (pide pista)"
            print(f"  Turno {turno} · {nombre} {quien}")

        d = agente.decidir(reto["id"], errores, ayuda, evento, intentadas, aciertos, ultima, previo)
        e = d["estado"]
        print(f"     estado S = (errores={e['errores']}, nivel_ayuda={e['nivel_ayuda']}, "
              f"evento={e['evento']}, previo={e['previo']})")
        ultima = d["accion"]
        if d["nivel"] is None:
            frase = ANIMOS if d["accion"] == "animar" or evento == "error" else reto["frase"]
            print(f"     Agente ({d['fuente']}) -> {d['accion']}: \"{frase}\"")
            if d["accion"] == "animar":
                jug.animar()
            continue
        ayuda = max(ayuda, d["nivel"])
        mensaje = d["mensaje"] or reto["pista"]
        extra = f" · pista «{d['tag']}» (ganancia de información {d['ganancia']})" if d["tag"] else ""
        print(f"     Agente ({d['fuente']}) -> {d['accion']}{extra}")
        print(f"        dice: \"{mensaje}\"" + (f"  + pictograma [{txt(d['picto']).upper()}]"
                                                  if d["picto"] and d["picto"] not in reto["opciones"] else ""))
        nuevas = [c for c in d["quitar"] if c in cand and c not in apagadas]
        if nuevas:
            apagadas |= set(nuevas)
            print(f"        apaga opciones que no van: {', '.join(txt(c) for c in nuevas)}")
        if d["nivel"] == 2:
            falta = [c for c in reto["opciones"] if c in correctas and c not in aciertos][0]
            apagadas |= {c for c in cand if c != falta}
            print(f"        señala la respuesta: 👆 {txt(falta)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--perfil", default="normal", choices=list(TODOS))
    ap.add_argument("--semilla", type=int, default=1)
    ap.add_argument("--retos", nargs="*", help="ids de retos (por defecto, todos en orden)")
    args = ap.parse_args()

    agente = AgenteGuia()
    rng = random.Random(args.semilla)
    jug = Jugador(args.perfil, rng)
    retos = [agente.retos[r] for r in args.retos] if args.retos else list(agente.retos.values())
    print(f"Agente: {'Q-Learning entrenado (q_table.npy)' if agente.entrenado else 'reglas fijas (sin entrenar)'}")
    print(f"Jugador simulado: perfil '{args.perfil}' · semilla {args.semilla}")

    previo, resumen = 0, []
    for reto in retos:
        final, errores = jugar(agente, reto, jug, rng, previo, "Jugador")
        previo = calcular_previo(final, errores)
        resumen.append((reto["id"], final, errores))
    print("\n=== Resumen de la partida ===")
    for rid, final, err in resumen:
        print(f"  {rid:4} {final:9} errores: {err}")
    print(f"  Retos resueltos: {sum(f == 'exito' for _, f, _ in resumen)} de {len(resumen)}")


if __name__ == "__main__":
    main()

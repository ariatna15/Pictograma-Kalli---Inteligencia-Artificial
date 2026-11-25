import argparse
import asyncio
import hashlib
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SALIDA = RAIZ / "codigo" / "frontend" / "audio"


def rellenar(plantilla, **vars):
    """Igual que fr() en app.js: reemplaza {nombre}, {elogio}, {nombres}."""
    return re.sub(r"\{(\w+)\}", lambda m: vars[m.group(1)], plantilla)


def todos_los_textos():
    """Todo lo que Kalli puede decir en el juego (mismas reglas que app.js y api.js)."""
    esc = json.load(open(RAIZ / "datos" / "escenarios.json", encoding="utf-8"))
    pic = json.load(open(RAIZ / "datos" / "pictogramas.json", encoding="utf-8"))
    F = esc["frases"]
    textos = {F["saludo"], F["empezar"], F["fin"], *F["elogios"], *F["animos"]}
    textos |= {n["voz"] for n in esc["niveles"].values()}
    textos |= set(esc["mensajes_tag"].values())
    for r in esc["retos"]:
        textos |= {r["frase"], r["pista"]}
        correctas = [c for c in r["opciones"] if c in r["correctos"]]
        for c in correctas:
            nombre = pic[c]["texto"]
            textos.add(rellenar(F["falta_uno"], nombre=nombre))
            textos.add(rellenar(F["senalar"], nombre=nombre))
            textos.add(rellenar(F["revelar"], nombres=nombre))
            textos |= {rellenar(F["acierto"], nombre=nombre, elogio=e) for e in F["elogios"]}
        if r["cuantos"] >= 2:                                  # se muestran las dos que faltan
            nombres = " y ".join(pic[c]["texto"] for c in correctas[: r["cuantos"]])
            textos.add(rellenar(F["revelar"], nombres=nombres))
    return sorted(t for t in textos if t)


def nombre_archivo(texto):
    return hashlib.sha1(texto.encode("utf-8")).hexdigest()[:12] + ".mp3"


async def generar(textos, voz, velocidad, tono):
    import edge_tts
    SALIDA.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    hechos = 0

    async def uno(t):
        nonlocal hechos
        destino = SALIDA / nombre_archivo(t)
        if destino.exists():
            return
        async with sem:
            await edge_tts.Communicate(t, voz, rate=velocidad, pitch=tono).save(str(destino))
            hechos += 1
            print(f"  ✔ {t}")

    await asyncio.gather(*(uno(t) for t in textos))
    return hechos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voz", default="es-PE-CamilaNeural")
    ap.add_argument("--velocidad", default="-8%", help="ej. -10%% más lento, +0%% normal")
    ap.add_argument("--tono", default="+6Hz", help="ej. +6Hz un poco más alegre")
    ap.add_argument("--rehacer", action="store_true", help="borra los audios y los vuelve a crear")
    args = ap.parse_args()

    if args.rehacer and SALIDA.exists():
        for f in SALIDA.glob("*.mp3"):
            f.unlink()
    textos = todos_los_textos()
    print(f"{len(textos)} frases · voz {args.voz}")
    nuevos = asyncio.run(generar(textos, args.voz, args.velocidad, args.tono))
    indice = {t: nombre_archivo(t) for t in textos if (SALIDA / nombre_archivo(t)).exists()}
    (SALIDA / "indice.js").write_text(
        "// GENERADO por codigo/backend/generar_audios.py -- no editar a mano\n"
        f"window.AUDIOS = {json.dumps(indice, ensure_ascii=False, indent=1)};\n", encoding="utf-8")
    print(f"Listo: {nuevos} audios nuevos, {len(indice)} en total -> {SALIDA}")


if __name__ == "__main__":
    main()

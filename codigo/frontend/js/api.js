// =====================================================================
// COMUNICACIÓN CON EL BACKEND (Python). Si el servidor no responde, el juego
// sigue funcionando con las reglas fijas de la demo (modo respaldo).
// =====================================================================
const API = {
  disponible: false,
  async init() {                       // trae escenarios y pictogramas desde /datos (vía backend)
    try {
      const r = await fetch("/api/retos");
      if (!r.ok) return;
      const d = await r.json();
      PICTOS = d.pictos; NIVELES = d.niveles; RETOS = d.retos; if (d.frases) FRASES = d.frases;
      this.disponible = true;
    } catch (e) { /* modo respaldo: se usan los datos de datos-respaldo.js */ }
  },
  async decidir(estado) {              // el agente responde qué hacer
    if (!this.disponible) return null;
    try {
      const r = await fetch("/api/agente/decidir", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(estado) });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  },
  registrar(ev) {                      // guarda cada evento de la partida (no espera respuesta)
    if (!this.disponible) return;
    fetch("/api/registro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ev) }).catch(() => {});
  },
};
window.onPictoEvento = ev => API.registrar(ev);

// Reglas fijas de la demo original (respaldo si no hay backend)
function reglasFijas(evento, ronda) {
  if (evento === "pedida") return { accion: "pista", nivel: Math.min(ronda.ayuda + 1, 2), fuente: "respaldo" };
  if (evento === "tiempo") return ronda.ayuda < 1 ? { accion: "pista", nivel: 1, fuente: "respaldo" } : { accion: "esperar", nivel: null, fuente: "respaldo" };
  return { accion: "pista", nivel: Math.min(ronda.errores, 2), fuente: "respaldo" };
}

// Punto único donde el juego pide una decisión al agente
async function decidirAyuda(evento) {
  if (!ronda || ronda.resuelto) return;
  const miRonda = ronda, r = RETOS[actual];
  const d = (await API.decidir({
    escenario_id: r.id, errores: ronda.errores, nivel_ayuda: ronda.ayuda, evento,
    intentadas: ronda.intentadas, aciertos: ronda.aciertos, ultima_accion: ronda.ultimaAccion || null,
    previo,                                                  // cómo le fue en el reto anterior (memoria del agente)
  })) || reglasFijas(evento, ronda);
  if (ronda !== miRonda || ronda.resuelto) return;          // el jugador ya pasó de reto
  ronda.ultimaAccion = d.accion;
  registrar("decision_agente", { evento, accion_agente: d.accion, fuente: d.fuente, pista_tag: (d.nivel !== null && d.nivel !== undefined && d.tag) || "", ganancia: d.ganancia });
  if (d.nivel === null || d.nivel === undefined) {           // esperar o animar
    if (evento === "tiempo" && d.accion === "esperar") { Kalli.cara("feliz"); Voz.decir(r.frase); }
    else Kalli.decir(azar(FRASES.animos), "anima");
    return;
  }
  aplicarAyuda(d.nivel, evento === "pedida" ? "pedida" : "auto_" + evento, { mensaje: d.mensaje, quitar: d.quitar, picto: d.picto });
}

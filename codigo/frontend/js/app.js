// PictoViaje · lógica de la pantalla. Datos: datos-respaldo.js · Voz: voz.js · Backend: api.js
// Parámetros de ayuda (informe §4.4 y §4.5)
const MAX_ERRORES   = 3;      // tras 3 errores se muestra la respuesta, con cariño
const SEGUNDOS_IDLE = 15;     // sin respuesta → pista media automática

// Las frases que dice Kalli están en datos/escenarios.json ("frases"), así la voz pregrabada
// (generar_audios.py) y el juego usan exactamente el mismo texto.
const azar = a => a[Math.floor(Math.random() * a.length)];
const fr = (clave, vars = {}) => FRASES[clave].replace(/\{(\w+)\}/g, (_, k) => vars[k]);


// =====================================================================
// 4. ESTADO  (variables del informe §4.1: seleccion, errores, nivel_ayuda, fase_nivel…)
// =====================================================================
let actual = 0;          // índice del escenario
let ronda = null;        // estado del escenario en curso
let ultimoNivelMostrado = 0;
let registro = [];       // lo que se captura (Experimento B) → panel del educador
let idleTimer = null;
let previo = 0;          // cómo le fue en el reto anterior: 0 bien · 1 regular · 2 le costó (lo usa el agente)

const $ = id => document.getElementById(id);

// =====================================================================
// 5. REGISTRO PARA EL EDUCADOR / FUTURO AGENTE
// =====================================================================
function registrar(accion, extra = {}) {
  const r = RETOS[actual];
  const ev = Object.assign({
    hora: new Date().toLocaleTimeString("es-PE"),
    escenario: r ? r.id : "-", nivel: r ? r.nivel : 0,
    accion,
    errores: ronda ? ronda.errores : 0,
    nivel_ayuda: ronda ? ronda.ayuda : -1,
    seg: ronda ? Math.round((Date.now() - ronda.t0) / 1000) : 0,
  }, extra);
  registro.push(ev);
  if (typeof window.onPictoEvento === "function") window.onPictoEvento(ev);  // gancho para enviarlo al agente (Hito 2)
  if (!$("panel").hidden) pintarPanel();
}

// =====================================================================
// 6. PANTALLAS
// =====================================================================
function mostrar(id) {
  ["sInicio", "sNivel", "sJuego", "sFin"].forEach(s => $(s).hidden = (s !== id));
  window.scrollTo(0, 0);
}

function pintarProgreso() {
  $("progreso").innerHTML = RETOS.map((_, i) =>
    `<i class="${i < actual ? "ok" : i === actual ? "ahora" : ""}"></i>`).join("");
}

function empezar() {
  registro = []; actual = 0; ultimoNivelMostrado = 0; previo = 0;
  // La pantalla de nivel que sigue ya habla (en este mismo toque, así que también desbloquea el audio
  // en móviles). Antes aquí se decía otra frase y las dos se pisaban.
  siguienteVista();
}

// Decide si toca la pantalla de nivel o el escenario
function siguienteVista() {
  if (actual >= RETOS.length) return terminar();
  const r = RETOS[actual];
  if (r.nivel !== ultimoNivelMostrado) {
    ultimoNivelMostrado = r.nivel;
    const n = NIVELES[r.nivel];
    $("nvIcono").textContent = n.icono;
    $("nvNum").textContent = "Nivel " + r.nivel;
    $("nvTitulo").textContent = n.titulo;
    pintarProgreso();
    mostrar("sNivel");
    Kalli.cara("graduado", "nivelKalli");
    Voz.decir(n.voz);
  } else {
    iniciarReto();
  }
}

// Crea una tarjeta de pictograma (imagen + nombre)
function crearPicto(clave, etiqueta = "div") {
  const p = PICTOS[clave];
  const el = document.createElement(etiqueta);
  el.className = "picto";
  el.innerHTML = `<img src="${encodeURI(p.img)}" alt=""><span>${p.texto}</span>`;
  el.querySelector("img").onerror = function () { this.outerHTML = `<span class="emoji">${p.emoji}</span>`; };
  return el;
}

function iniciarReto() {
  const r = RETOS[actual];
  ronda = { aciertos: [], errores: 0, ayuda: -1, resuelto: false, t0: Date.now(), intentadas: [] };

  mostrar("sJuego");
  cerrarAviso();
  pintarProgreso();
  $("chipNivel").textContent = `Nivel ${r.nivel} · ${NIVELES[r.nivel].titulo}`;
  $("pistaMsg").hidden = true;
  $("escenario").classList.remove("pulsa");
  pintarPips();
  Kalli.callar(); Kalli.cara("feliz");

  // Escenario (la pregunta se queda visible todo el turno — informe §1.4)
  const esc = $("escenario"); esc.innerHTML = "";
  r.pregunta.forEach(c => esc.appendChild(crearPicto(c)));

  // "Mi respuesta": casillas vacías
  const m = $("maleta"); m.innerHTML = "";
  for (let i = 0; i < r.cuantos; i++) m.insertAdjacentHTML("beforeend", '<div class="casilla"></div>');

  // Opciones: al tocar una se evalúa al instante (sin botón de confirmar/borrar)
  const ops = $("opciones"); ops.innerHTML = "";
  r.opciones.forEach(clave => {
    const p = crearPicto(clave, "div");
    const b = document.createElement("button");
    b.className = "opcion"; b.dataset.clave = clave;
    b.setAttribute("aria-label", PICTOS[clave].texto);
    b.appendChild(p);
    b.onclick = () => elegir(clave, b);
    ops.appendChild(b);
  });

  registrar("inicio_escenario");
  Voz.decir(r.frase);
  reiniciarIdle();
}

// =====================================================================
// 7. JUGADA: tocar un pictograma
// =====================================================================
function elegir(clave, boton) {
  if (!ronda || ronda.resuelto) return;
  const r = RETOS[actual];
  reiniciarIdle();

  const ok = r.correctos.includes(clave);
  const nombre = PICTOS[clave].texto;
  registrar("seleccion", { pictograma: clave, correcto: ok });

  if (ok) {
    ronda.aciertos.push(clave);
    boton.classList.add("bien", "vacia");
    llenarCasilla(clave);
    sonidoBien();
    quitarBrillo();
    if (ronda.aciertos.length >= r.cuantos) {
      const elogio = azar(FRASES.elogios);
      completar(false, fr("acierto", { nombre, elogio }), elogio);
    } else {
      Kalli.decir(fr("falta_uno", { nombre }), "celebra");
    }
  } else {
    // Error SIN castigo: se agita suave, se atenúa y se escala la ayuda
    ronda.errores++;
    ronda.intentadas.push(clave);
    boton.classList.add("mal");
    sonidoMal();
    Kalli.cara("anima");
    setTimeout(() => { boton.classList.remove("mal"); boton.classList.add("descartada"); }, 450);

    if (ronda.errores >= MAX_ERRORES) { revelar(); return; }
    decidirAyuda("error");                       // el agente decide cómo ayudar
  }
}

function llenarCasilla(clave, esAyuda = false) {
  const vacia = document.querySelector("#maleta .casilla:not(.lleno):not(.ayuda)");
  if (!vacia) return;
  const p = PICTOS[clave];
  vacia.classList.add(esAyuda ? "ayuda" : "lleno");
  vacia.innerHTML = `<img src="${encodeURI(p.img)}" alt="${p.texto}"><span class="marca-ok">${esAyuda ? "💡" : "✔"}</span>`;
  vacia.querySelector("img").onerror = function () { this.outerHTML = `<span class="emoji">${p.emoji}</span>`; };
}

// =====================================================================
// 8. PISTAS (informe §4.5): 0 sutil · 1 media · 2 explícita
// =====================================================================
function pedirPista() {
  if (!ronda || ronda.resuelto) return;
  reiniciarIdle();
  decidirAyuda("pedida");
}

function aplicarAyuda(nivel, origen, extra = {}) {
  if (!ronda || ronda.resuelto) return;
  const r = RETOS[actual];
  const nuevo = Math.max(ronda.ayuda, nivel);
  const subio = nuevo > ronda.ayuda || origen === "pedida";
  ronda.ayuda = nuevo;
  pintarPips();
  registrar("pista", { origen, nivel_pista: nuevo });

  const msg = $("pistaMsg");
  let voz = "";

  // 0 · sutil: orientación general + los dibujos de la pregunta "laten"
  Kalli.callar(); Kalli.cara("piensa");
  $("escenario").classList.remove("pulsa"); void $("escenario").offsetWidth;
  $("escenario").classList.add("pulsa");
  // la pista también se VE: pictograma de la idea (si no es una de las opciones, para no regalar la respuesta)
  const pp = extra.picto && PICTOS[extra.picto] && !r.opciones.includes(extra.picto) ? PICTOS[extra.picto] : null;
  const pictoPista = pp ? `<span class="pista-picto"><img src="${encodeURI(pp.img)}" alt="${pp.texto}"
      onerror="this.outerHTML='<span class=&quot;emoji&quot;>${pp.emoji}</span>'"></span>` : "";
  msg.innerHTML = `<span class="bombilla">💡</span>${pictoPista}<span>${extra.mensaje || r.pista}</span>`;
  msg.hidden = false;
  voz = extra.mensaje || r.pista;

  // 1 · media: se apagan algunas opciones que no van (reduce candidatos)
  if (nuevo >= 1) {
    const sinProbar = r.opciones.filter(c => !r.correctos.includes(c) && !ronda.intentadas.includes(c)
                                           && !document.querySelector(`.opcion[data-clave="${c}"]`).classList.contains("menos"));
    const quitar = Array.isArray(extra.quitar) ? extra.quitar.filter(c => sinProbar.includes(c))
                                                 : sinProbar.slice(0, Math.floor(sinProbar.length / 2));
    quitar.forEach(c => document.querySelector(`.opcion[data-clave="${c}"]`).classList.add("menos"));
  }

  // 2 · explícita: se señala la opción correcta
  if (nuevo >= 2) {
    const falta = r.opciones.find(c => r.correctos.includes(c) && !ronda.aciertos.includes(c));
    if (falta) {
      quitarBrillo();
      document.querySelector(`.opcion[data-clave="${falta}"]`).classList.add("brilla");
      voz = fr("senalar", { nombre: PICTOS[falta].texto });
    }
  }
  if (subio) Voz.decir(voz);
}

function quitarBrillo() { document.querySelectorAll(".opcion.brilla").forEach(o => o.classList.remove("brilla")); }

function pintarPips() {
  document.querySelectorAll("#pips i").forEach((p, i) => p.classList.toggle("on", i <= (ronda ? ronda.ayuda : -1)));
}

// Sin respuesta durante 15 s → pista media automática
function reiniciarIdle() {
  clearTimeout(idleTimer);
  if (!ronda || ronda.resuelto) return;
  idleTimer = setTimeout(() => {
    if (!ronda || ronda.resuelto) return;
    $("btnPista").classList.remove("llama"); void $("btnPista").offsetWidth; $("btnPista").classList.add("llama");
    decidirAyuda("tiempo");
    reiniciarIdle();
  }, SEGUNDOS_IDLE * 1000);
}

// Tras 3 errores: se muestra la respuesta con amabilidad (informe §4.4)
function revelar() {
  const r = RETOS[actual];
  const faltan = r.opciones.filter(c => r.correctos.includes(c) && !ronda.aciertos.includes(c))
                           .slice(0, r.cuantos - ronda.aciertos.length);
  faltan.forEach(c => {
    llenarCasilla(c, true);
    const b = document.querySelector(`.opcion[data-clave="${c}"]`);
    b.classList.add("bien", "vacia");
  });
  quitarBrillo();
  registrar("revelado", { pictograma: faltan.join("+") });
  const nombres = faltan.map(c => PICTOS[c].texto).join(" y ");
  completar(true, fr("revelar", { nombres }), "¡Sigamos juntos!");
}

function completar(revelada, textoVoz, textoAviso) {
  ronda.resuelto = true;
  clearTimeout(idleTimer);
  previo = (revelada || ronda.errores >= 2) ? 2 : ronda.errores;   // se lo pasamos al agente en el próximo reto
  registrar("completado", { revelada, seleccion: ronda.aciertos.join("+") });
  const av = $("aviso");
  av.classList.toggle("ayuda", revelada);
  $("avTexto").textContent = textoAviso;
  Kalli.callar();
  Kalli.cara(revelada ? "anima" : "celebra");
  Kalli.cara(revelada ? "anima" : "celebra", "avKalli");
  if (!revelada) sonidoBien();
  av.classList.add("ver");
  $("app").classList.add("con-aviso");
  Voz.decir(textoVoz);
  setTimeout(() => $("btnContinuar").focus({ preventScroll: true }), 350);
}

function cerrarAviso() { $("aviso").classList.remove("ver"); $("app").classList.remove("con-aviso"); }

function continuar() {
  cerrarAviso();
  actual++;
  siguienteVista();
}

// =====================================================================
// 9. FINAL
// =====================================================================
function terminar() {
  ronda = null; clearTimeout(idleTimer);
  actual = RETOS.length; pintarProgreso();
  mostrar("sFin");
  registrar("fin_juego");
  sonidoFin();
  Voz.decir(fr("fin"));
  Kalli.cara("graduado", "finKalli");
  confeti();
}

function confeti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const f = ["🎉", "⭐", "🎈", "✨", "🧳"];
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("span");
    s.className = "confeti"; s.textContent = f[i % f.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
    s.style.animationDelay = Math.random() * 1.2 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 7000);
  }
}

// =====================================================================
// 10. PANEL DEL EDUCADOR (oculto)
// =====================================================================
function togglePanel(ver) {
  const p = $("panel");
  p.hidden = ver === undefined ? !p.hidden : !ver;
  if (!p.hidden) pintarPanel();
}

function pintarPanel() {
  const sel  = registro.filter(e => e.accion === "seleccion");
  const dato = (n, t) => `<div class="dato"><b>${n}</b>${t}</div>`;
  $("pResumen").innerHTML =
    dato(registro.filter(e => e.accion === "completado").length, "escenarios completados") +
    dato(sel.filter(e => e.correcto).length, "aciertos") +
    dato(sel.filter(e => !e.correcto).length, "intentos fallidos") +
    dato(registro.filter(e => e.accion === "pista" && e.origen === "pedida").length, "pistas pedidas") +
    dato(registro.filter(e => e.accion === "pista" && e.origen !== "pedida").length, "pistas automáticas") +
    dato(registro.filter(e => e.accion === "revelado").length, "respuestas mostradas") +
    dato(registro.filter(e => e.accion === "decision_agente" && e.accion_agente === "animar").length, "ánimos del agente");

  const nombre = e => e.pictograma ? e.pictograma.split("+").map(c => PICTOS[c] ? PICTOS[c].texto : c).join(" + ") : "";
  const linea = e => {
    let cls = "info", txt = "";
    switch (e.accion) {
      case "inicio_escenario": txt = "▶ inicia escenario"; break;
      case "seleccion":  cls = e.correcto ? "bien" : "mal"; txt = (e.correcto ? "✔ " : "✘ ") + nombre(e); break;
      case "pista":      txt = `💡 pista ${["sutil", "media", "explícita"][e.nivel_pista]} (${e.origen})`; break;
      case "revelado":   cls = "mal"; txt = "↪ se mostró: " + nombre(e); break;
      case "completado": cls = "bien"; txt = "★ completado" + (e.revelada ? " (con ayuda)" : ""); break;
      case "fin_juego":  cls = "bien"; txt = "🏆 fin del juego"; break;
      case "decision_agente": txt = `🤖 agente (${e.fuente}): ${e.accion_agente.replace("_", " ")}`
                                   + (e.pista_tag ? ` · pista «${e.pista_tag}»` : "") + ` · por ${e.evento}`; break;
      default: txt = e.accion;
    }
    return `<div class="${cls}">${e.hora} · ${e.escenario} · ${e.seg}s · ${txt}</div>`;
  };
  $("registro").innerHTML = registro.length ? registro.slice().reverse().map(linea).join("") : "Aún no hay datos.";
}

function descargar(nombre, tipo, contenido) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre; a.click(); URL.revokeObjectURL(a.href);
}

// =====================================================================
// 11. EVENTOS
// =====================================================================
$("btnJugar").onclick = empezar;
$("btnEmpezarNivel").onclick = iniciarReto;
$("btnContinuar").onclick = continuar;
$("btnOtraVez").onclick = () => { empezar(); };
$("btnPista").onclick = pedirPista;
$("btnOir").onclick = () => Voz.decir(RETOS[actual].frase);
$("btnSonido").onclick = () => {
  Voz.activa = !Voz.activa;
  $("btnSonido").textContent = Voz.activa ? "🔊" : "🔇";
  if (!Voz.activa) Voz.callar();
};

// Panel del educador: 3 formas de abrirlo
let lp = null;
const marca = $("marca");
marca.addEventListener("pointerdown", () => { lp = setTimeout(() => togglePanel(true), 1200); });
["pointerup", "pointerleave", "pointercancel"].forEach(e => marca.addEventListener(e, () => clearTimeout(lp)));
marca.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") { e.preventDefault(); togglePanel(); }
  if (e.key === "Escape") togglePanel(false);
});
if (/[?&]educador/.test(location.search)) togglePanel(true);

$("pCerrar").onclick = () => togglePanel(false);
$("pJson").onclick = () => descargar("pictoviaje_registro.json", "application/json", JSON.stringify(registro, null, 2));
$("pCsv").onclick = () => {
  const cols = ["hora", "escenario", "nivel", "accion", "pictograma", "correcto", "errores", "nivel_ayuda", "nivel_pista", "origen", "evento", "accion_agente", "fuente", "pista_tag", "revelada", "seg"];
  const csv = [cols.join(",")].concat(registro.map(e => cols.map(c => e[c] === undefined ? "" : e[c]).join(","))).join("\n");
  descargar("pictoviaje_registro.csv", "text/csv", csv);
};
$("pLimpiar").onclick = () => { registro = []; pintarPanel(); };

// =====================================================================
// 12. EMPEZAR
// =====================================================================
Voz.init();
Kalli.montar();

// Saludo de la pantalla de inicio.
// 1) Al cargar la página se intenta decir el saludo. Algunos navegadores lo permiten.
// 2) Si el navegador lo bloquea (lo normal: no deja sonar nada hasta que la persona toca la pantalla),
//    se muestra "Toca a Kalli" y el saludo suena con el primer toque (que no sea "Jugar")
//    y cada vez que toquen a Kalli.
const hintKalli = $("hintKalli");
Voz.decir(fr("saludo"), {
  sinRespaldo: true,                                  // sin voz robótica del navegador
  alBloquear: () => { hintKalli.hidden = false; },
});
document.addEventListener("pointerdown", e => {
  if ($("sInicio").hidden || e.target.closest("#btnJugar, #btnSonido, #marca")) return;
  if (e.target.closest("#inicioKalli") || !hintKalli.hidden) {   // tocaron a Kalli, o el saludo estaba bloqueado
    hintKalli.hidden = true;
    Voz.decir(fr("saludo"));
  }
});
$("inicioKalli").style.cursor = "pointer";
pintarProgreso();
API.init();                      // intenta conectar con el backend (Python)

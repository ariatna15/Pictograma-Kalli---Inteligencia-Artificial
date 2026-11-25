// =====================================================================
// KALLI: la mascota que acompaña al jugador.
// Cambia de pose según lo que pasa y "dice" los mensajes en un globo de texto (además de la voz).
// Caras que usa el juego: feliz · piensa (pista) · anima (error) · celebra (acierto) · graduado (nivel/fin)
//
// ELEGIR LA MASCOTA: "camaleon" usa las imágenes de img/mascota/ ; "llama" usa el dibujo original del equipo.
// IMPORTANTE: si usan el camaleón, completen el crédito con el autor y el sitio de donde sale la ilustración
// y verifiquen que su licencia permita usarla (si no, vuelvan a "llama").
// =====================================================================
const MASCOTA = {
  tipo: "camaleon",
  //credito: "Ilustración de la mascota: COMPLETAR autor y sitio de origen",
  // pose (archivo en img/mascota/) que se muestra para cada cara
  poses: { feliz: "pregunta", anima: "pregunta", piensa: "idea", celebra: "lentes", graduado: "graduado" },
};

const KALLI_SVG = `
<svg class="kalli" viewBox="0 0 170 200" data-expr="feliz" aria-hidden="true" focusable="false">
  <g stroke="#1B1F3B" stroke-width="3" stroke-linejoin="round">
    <rect x="58" y="160" width="15" height="34" rx="7" fill="#E9D3A8"/>
    <rect x="120" y="160" width="15" height="34" rx="7" fill="#E9D3A8"/>
    <rect x="46" y="62" width="36" height="96" rx="16" fill="#F6E7C8"/>
    <ellipse cx="98" cy="146" rx="56" ry="30" fill="#F6E7C8"/>
    <path d="M152 136 q12 -2 6 12" fill="none" stroke-linecap="round"/>
    <rect x="104" y="114" width="42" height="34" rx="10" fill="#E4572E"/>
    <rect x="112" y="124" width="26" height="9" rx="4" fill="#FFC93C" stroke-width="2"/>
    <rect x="42" y="102" width="44" height="15" rx="6" fill="#C0392B"/>
    <ellipse cx="48" cy="22" rx="7" ry="16" transform="rotate(-14 48 22)" fill="#F6E7C8"/>
    <ellipse cx="82" cy="20" rx="7" ry="16" transform="rotate(14 82 20)" fill="#F6E7C8"/>
    <ellipse cx="64" cy="50" rx="31" ry="26" fill="#F6E7C8"/>
    <path d="M50 28 q6 -11 12 -2 q6 -11 13 0" fill="#F6E7C8"/>
    <ellipse cx="57" cy="64" rx="18" ry="12" fill="#FFF6E4"/>
  </g>
  <path d="M47 110 H82" stroke="#FFC93C" stroke-width="4" stroke-dasharray="6 5"/>
  <ellipse cx="57" cy="58" rx="4" ry="2.5" fill="#1B1F3B"/>
  <circle cx="38" cy="57" r="5" fill="#F4A3A3"/>
  <circle cx="88" cy="55" r="5" fill="#F4A3A3"/>
  <g class="x e-feliz e-piensa e-anima" fill="#1B1F3B">
    <circle cx="52" cy="44" r="4.5"/><circle cx="76" cy="44" r="4.5"/>
    <circle cx="53.5" cy="42.5" r="1.4" fill="#fff"/><circle cx="77.5" cy="42.5" r="1.4" fill="#fff"/>
  </g>
  <g class="x e-celebra" fill="none" stroke="#1B1F3B" stroke-width="3" stroke-linecap="round">
    <path d="M47 45 q5 -6 10 0"/><path d="M71 45 q5 -6 10 0"/>
  </g>
  <path class="x e-feliz" d="M50 66 q7 6 14 0" fill="none" stroke="#1B1F3B" stroke-width="3" stroke-linecap="round"/>
  <g class="x e-piensa">
    <path d="M52 68 h10" stroke="#1B1F3B" stroke-width="3" stroke-linecap="round"/>
    <path d="M70 35 q6 -5 12 -1" fill="none" stroke="#1B1F3B" stroke-width="3" stroke-linecap="round"/>
    <g fill="#1B1F3B"><circle cx="104" cy="32" r="3"/><circle cx="115" cy="24" r="4"/><circle cx="128" cy="15" r="5"/></g>
  </g>
  <ellipse class="x e-anima" cx="57" cy="68" rx="5" ry="4" fill="#1B1F3B"/>
  <path class="x e-celebra" d="M48 65 q9 11 18 0 z" fill="#1B1F3B" stroke="#1B1F3B" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

const Kalli = {
  timer: null,
  usaImagen: MASCOTA.tipo === "camaleon",
  montar() {                                   // dibuja a la mascota en cada <div data-kalli="cara">
    if (this.usaImagen) Object.values(MASCOTA.poses).forEach(p => { new Image().src = `img/mascota/${p}.png`; }); // precarga
    document.querySelectorAll("[data-kalli]").forEach(el => {
      el.innerHTML = this.usaImagen ? '<img class="kalli" alt="">' : KALLI_SVG;
      this.poner(el.querySelector(".kalli"), el.dataset.kalli || "feliz");
    });
    const c = document.getElementById("creditoMascota");
    if (c) c.textContent = this.usaImagen && MASCOTA.credito ? " · " + MASCOTA.credito : "";
  },
  poner(el, expr) {
    if (!el) return;
    if (this.usaImagen) el.src = `img/mascota/${MASCOTA.poses[expr] || MASCOTA.poses.feliz}.png`;
    el.dataset.expr = (!this.usaImagen && expr === "graduado") ? "celebra" : expr;  // la llama no tiene birrete
  },
  cara(expr, dondeId = "mascota") {           // cambia la pose (y la reanima para que se note)
    const el = document.querySelector(`#${dondeId} .kalli`);
    if (!el) return;
    this.poner(el, expr);
    el.classList.remove("mueve"); void el.getBoundingClientRect(); el.classList.add("mueve");
  },
  decir(texto, expr = "feliz", hablar = true) { // globo de texto + cara + voz
    this.cara(expr);
    const g = document.getElementById("kalliDice");
    if (g) {
      g.textContent = texto;
      g.className = "kalli-dice " + expr;
      g.hidden = false;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { g.hidden = true; }, 4000);
    }
    if (hablar) Voz.decir(texto);
  },
  callar() { clearTimeout(this.timer); const g = document.getElementById("kalliDice"); if (g) g.hidden = true; },
};

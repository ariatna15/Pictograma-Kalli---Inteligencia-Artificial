// =====================================================================
// 3. VOZ (Text-to-Speech en español, ritmo lento — informe §2.5)
// =====================================================================
const Voz = {
  soportada: "speechSynthesis" in window,
  activa: true,
  voz: null,
  audio: null,                // audio pregrabado que está sonando
  // AUDIOS lo crea audio/indice.js (generado por codigo/backend/generar_audios.py):
  // { "texto exacto": "archivo.mp3" }. Si no existe, se usa la voz del navegador.
  init() {
    if (!this.soportada) return;
    const elegir = () => {
      const es = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
      if (!es.length) return;
      // Preferimos voces neuronales (suenan humanas): Edge trae "Microsoft Camila Online (Natural)",
      // Chrome trae "Google español". Las voces de escritorio antiguas (Helena, Sabina) suenan robóticas.
      const puntaje = v => (/natural|neural/i.test(v.name) ? 6 : 0)
                        + (/camila|dalia|elena|paloma|salome|ximena|lupe/i.test(v.name) ? 3 : 0)
                        + (/google/i.test(v.name) ? 2 : 0)
                        + (/online|premium|enhanced/i.test(v.name) ? 1 : 0)
                        + (/es[-_]PE/i.test(v.lang) ? 2 : /es[-_](419|MX|CO|US|AR|CL)/i.test(v.lang) ? 1 : 0)
                        - (/helena|sabina|laura|pablo|raul|hilda/i.test(v.name) && !/natural|online/i.test(v.name) ? 3 : 0);
      this.voz = es.sort((a, b) => puntaje(b) - puntaje(a))[0];
    };
    elegir();
    speechSynthesis.onvoiceschanged = elegir;
  },
  // opciones: alBloquear = qué hacer si el navegador aún no permite sonido (sin toque previo)
  //             sinRespaldo = no usar la voz del navegador si no hay audio pregrabado
  decir(texto, { alBloquear = null, sinRespaldo = false } = {}) {
    if (!this.activa || !texto) return;
    this.callar();
    const archivo = (window.AUDIOS || {})[texto];
    if (archivo) {                                   // 1) audio pregrabado con voz neuronal
      const a = new Audio("audio/" + encodeURIComponent(archivo));
      this.audio = a;
      a.play().catch(e => {
        // AbortError: otra frase tomó el turno antes de que esta empezara (antes eso disparaba la voz
        //   robótica del navegador y se oían las dos a la vez).
        // NotAllowedError: el navegador aún no permite sonido (la persona no ha tocado la pantalla).
        // Solo usamos la voz del navegador si el archivo en sí falla.
        if (this.audio !== a) return;                // otra frase ya tomó el turno
        if (e.name === "NotAllowedError") { if (alBloquear) alBloquear(); return; }
        if (e.name !== "AbortError") this.sintetizar(texto);
      });
      return;
    }
    if (!sinRespaldo) this.sintetizar(texto);        // 2) voz del navegador
  },
  sintetizar(texto) {
    if (!this.soportada) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang  = this.voz ? this.voz.lang : "es-ES";
    if (this.voz) u.voice = this.voz;
    u.rate  = 0.9;       // un poco lento, pero natural
    u.pitch = 1.1;       // un poco más alegre
    speechSynthesis.speak(u);
  },
  callar() {
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this.soportada) speechSynthesis.cancel();
  },
};

// Sonidos suaves (nunca estridentes) con Web Audio
let audioCtx = null;
function tono(notas, dur = 0.14, tipo = "sine", vol = 0.16) {
  if (!Voz.activa) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    notas.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = tipo; o.frequency.value = f;
      const t = audioCtx.currentTime + i * dur;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + dur);
    });
  } catch (e) {}
}
const sonidoBien  = () => tono([660, 880]);
const sonidoMal   = () => tono([300, 260], 0.16, "triangle", 0.1);
const sonidoFin   = () => tono([523, 659, 784, 1047], 0.16);


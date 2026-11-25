// GENERADO por ia_models/exportar_respaldo.py -- no editar a mano (editar /datos/*.json)
let PICTOS = {
 "dolor_muela": {
  "texto": "Dolor de muela",
  "img": "img/necesidad/dolor de muela.png",
  "emoji": "🦷",
  "tags": [
   "diente"
  ]
 },
 "hambre": {
  "texto": "Hambre",
  "img": "img/necesidad/hambre.png",
  "emoji": "😋",
  "tags": [
   "comer"
  ]
 },
 "dentista": {
  "texto": "Dentista",
  "img": "img/lugares/consultorio dentista.png",
  "emoji": "🧑‍⚕️",
  "tags": [
   "diente",
   "salud"
  ]
 },
 "colegio": {
  "texto": "Colegio",
  "img": "img/lugares/colegio.png",
  "emoji": "🏫",
  "tags": [
   "estudio"
  ]
 },
 "parque": {
  "texto": "Parque",
  "img": "img/lugares/parque.png",
  "emoji": "🌳",
  "tags": [
   "juego",
   "aire_libre"
  ]
 },
 "playa": {
  "texto": "Playa",
  "img": "img/lugares/playa.png",
  "emoji": "🏖️",
  "tags": [
   "sol",
   "aire_libre"
  ]
 },
 "restaurante": {
  "texto": "Restaurante",
  "img": "img/lugares/restaurante.png",
  "emoji": "🍽️",
  "tags": [
   "comer"
  ]
 },
 "soleado": {
  "texto": "Soleado",
  "img": "img/clima/soleado.png",
  "emoji": "☀️",
  "tags": [
   "sol"
  ]
 },
 "lluvia": {
  "texto": "Lluvia",
  "img": "img/clima/lluvia.png",
  "emoji": "🌧️",
  "tags": [
   "agua",
   "frio"
  ]
 },
 "nevada": {
  "texto": "Nevada",
  "img": "img/clima/nevada.png",
  "emoji": "❄️",
  "tags": [
   "frio"
  ]
 },
 "abrigo": {
  "texto": "Abrigo",
  "img": "img/objetos/abrigo.png",
  "emoji": "🧥",
  "tags": [
   "frio"
  ]
 },
 "paraguas": {
  "texto": "Paraguas",
  "img": "img/objetos/paraguas.png",
  "emoji": "☂️",
  "tags": [
   "agua"
  ]
 },
 "cometa": {
  "texto": "Cometa",
  "img": "img/objetos/cometa.png",
  "emoji": "🪁",
  "tags": [
   "juego",
   "aire_libre"
  ]
 },
 "computadora": {
  "texto": "Computadora",
  "img": "img/objetos/computadora.png",
  "emoji": "💻",
  "tags": [
   "estudio",
   "tecnologia"
  ]
 },
 "cuaderno": {
  "texto": "Cuaderno",
  "img": "img/objetos/cuaderno.png",
  "emoji": "📓",
  "tags": [
   "estudio"
  ]
 },
 "gafas": {
  "texto": "Gafas de sol",
  "img": "img/objetos/gafas de sol.png",
  "emoji": "🕶️",
  "tags": [
   "sol"
  ]
 },
 "gorra": {
  "texto": "Gorra",
  "img": "img/objetos/gorra.png",
  "emoji": "🧢",
  "tags": [
   "sol"
  ]
 },
 "lapiz": {
  "texto": "Lápiz",
  "img": "img/objetos/lapiz.png",
  "emoji": "✏️",
  "tags": [
   "estudio"
  ]
 },
 "mochila": {
  "texto": "Mochila",
  "img": "img/objetos/mochila.png",
  "emoji": "🎒",
  "tags": [
   "estudio"
  ]
 },
 "pelota": {
  "texto": "Pelota de playa",
  "img": "img/objetos/pelota de playa.png",
  "emoji": "🏐",
  "tags": [
   "juego",
   "playa"
  ]
 },
 "protector": {
  "texto": "Protector solar",
  "img": "img/objetos/protector solar.png",
  "emoji": "🧴",
  "tags": [
   "sol",
   "playa"
  ]
 },
 "sombrilla": {
  "texto": "Sombrilla",
  "img": "img/objetos/sombrilla de playa.png",
  "emoji": "⛱️",
  "tags": [
   "sol",
   "playa"
  ]
 },
 "toalla": {
  "texto": "Toalla",
  "img": "img/objetos/toalla de playa.png",
  "emoji": "🧖",
  "tags": [
   "playa",
   "agua"
  ]
 },
 "fuente_agua": {
  "texto": "Fuente de agua",
  "img": "img/objetos/fuente de agua.png",
  "emoji": "🚰",
  "tags": [
   "beber",
   "agua"
  ]
 },
 "cubo_pala": {
  "texto": "Cubo y pala",
  "img": "img/objetos/cubo y pala.png",
  "emoji": "🪣",
  "tags": [
   "juego",
   "playa"
  ]
 }
};
let NIVELES = {
 "1": {
  "titulo": "¿Adónde voy?",
  "icono": "📍",
  "voz": "Nivel uno. ¿Adónde voy?"
 },
 "2": {
  "titulo": "¿Qué llevo?",
  "icono": "🎒",
  "voz": "Nivel dos. ¿Qué llevo?"
 },
 "3": {
  "titulo": "¡Imprevisto!",
  "icono": "⛈️",
  "voz": "Nivel tres. ¡Imprevisto!"
 }
};
let RETOS = [
 {
  "id": "E1",
  "nivel": 1,
  "pregunta": [
   "dolor_muela"
  ],
  "correctos": [
   "dentista"
  ],
  "cuantos": 1,
  "opciones": [
   "dentista",
   "parque",
   "colegio"
  ],
  "frase": "Me duele la muela. ¿Adónde voy?",
  "pista": "Piensa: ¿quién cuida los dientes?"
 },
 {
  "id": "E1b",
  "nivel": 1,
  "pregunta": [
   "hambre"
  ],
  "correctos": [
   "restaurante"
  ],
  "cuantos": 1,
  "opciones": [
   "colegio",
   "restaurante",
   "playa"
  ],
  "frase": "Tengo hambre. ¿Adónde voy?",
  "pista": "Piensa: ¿dónde se come rico?"
 },
 {
  "id": "E2",
  "nivel": 2,
  "pregunta": [
   "playa",
   "soleado"
  ],
  "correctos": [
   "protector",
   "toalla",
   "gafas",
   "sombrilla",
   "pelota"
  ],
  "cuantos": 2,
  "opciones": [
   "protector",
   "abrigo",
   "toalla",
   "cuaderno",
   "gafas",
   "lapiz"
  ],
  "frase": "Voy a la playa y hace sol. ¿Qué llevo? Elige dos cosas.",
  "pista": "Hace sol y vamos a la playa. Piensa en cosas para el sol."
 },
 {
  "id": "E4",
  "nivel": 2,
  "pregunta": [
   "colegio"
  ],
  "correctos": [
   "mochila",
   "cuaderno",
   "lapiz"
  ],
  "cuantos": 2,
  "opciones": [
   "cuaderno",
   "pelota",
   "lapiz",
   "gafas",
   "mochila",
   "cometa"
  ],
  "frase": "Voy al colegio. ¿Qué llevo? Elige dos cosas.",
  "pista": "Piensa en cosas para estudiar."
 },
 {
  "id": "E6",
  "nivel": 2,
  "pregunta": [
   "parque",
   "soleado"
  ],
  "correctos": [
   "gorra",
   "cometa",
   "gafas",
   "sombrilla"
  ],
  "cuantos": 2,
  "opciones": [
   "abrigo",
   "gorra",
   "cuaderno",
   "cometa",
   "computadora",
   "sombrilla"
  ],
  "frase": "Voy al parque y hace sol. ¿Qué llevo? Elige dos cosas.",
  "pista": "Piensa en cosas para jugar y cuidarte del sol."
 },
 {
  "id": "E7",
  "nivel": 2,
  "pregunta": [
   "playa"
  ],
  "correctos": [
   "cubo_pala",
   "pelota",
   "toalla",
   "protector"
  ],
  "cuantos": 2,
  "opciones": [
   "cubo_pala",
   "cuaderno",
   "pelota",
   "abrigo",
   "computadora",
   "lapiz"
  ],
  "frase": "Voy a la playa a jugar con la arena. ¿Qué llevo? Elige dos cosas.",
  "pista": "Piensa en cosas para jugar en la playa."
 },
 {
  "id": "E3",
  "nivel": 3,
  "pregunta": [
   "parque",
   "lluvia"
  ],
  "correctos": [
   "paraguas"
  ],
  "cuantos": 1,
  "opciones": [
   "gafas",
   "paraguas",
   "cometa"
  ],
  "frase": "Estoy en el parque y empezó a llover. ¿Qué necesito?",
  "pista": "Está lloviendo. Piensa en algo para no mojarte."
 },
 {
  "id": "E5",
  "nivel": 3,
  "pregunta": [
   "parque",
   "nevada"
  ],
  "correctos": [
   "abrigo"
  ],
  "cuantos": 1,
  "opciones": [
   "protector",
   "abrigo",
   "pelota"
  ],
  "frase": "Estoy en el parque y está nevando. ¿Qué necesito?",
  "pista": "Hace mucho frío. Piensa en algo que abriga."
 },
 {
  "id": "E8",
  "nivel": 3,
  "pregunta": [
   "parque",
   "soleado"
  ],
  "correctos": [
   "fuente_agua"
  ],
  "cuantos": 1,
  "opciones": [
   "abrigo",
   "fuente_agua",
   "cuaderno"
  ],
  "frase": "En el parque hace mucho calor y tengo sed. ¿Qué busco?",
  "pista": "Tienes sed. Piensa en algo para tomar agua."
 }
];
let FRASES = {
 "saludo": "¡Hola! Soy Kalli. Ayúdame a saber qué hacer en cada viaje. ¿Me ayudas?",
 "empezar": "¡Genial! ¡Vamos de viaje!",
 "elogios": [
  "¡Muy bien!",
  "¡Excelente!",
  "¡Eso es!",
  "¡Genial!",
  "¡Lo lograste!"
 ],
 "animos": [
  "Casi. Prueba otra vez.",
  "Tú puedes. Intenta con otra.",
  "Mira otra vez. ¡Tú puedes!"
 ],
 "falta_uno": "{nombre}. ¡Muy bien! Falta uno más.",
 "acierto": "{nombre}. {elogio}",
 "senalar": "Mira, aquí. Es {nombre}.",
 "revelar": "Aquí va {nombres}. ¡Sigamos juntos!",
 "fin": "¡Completaste el viaje! ¡Felicitaciones!"
};

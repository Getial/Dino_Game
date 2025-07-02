const dificultades = ["facil", "medio", "dificil"];
const sonidoSalto = new Audio("./assets/sounds/jump.mp3");
const sonidoSelva = new Audio("./assets/sounds/selva3.mp3");
let dificultad = 0; // 0 = facil, 1 = medio, 2 = dificil
let preguntas = [];
let preguntasPorDificultad = {};
let preguntasUsadas = JSON.parse(localStorage.getItem("preguntasUsadas")) || [];
let vidas = 3;
let progreso = 0;
let velocidad = 2700;
let distanciaPista = 7000;
let puntaje = 1;
let mejorPuntaje = localStorage.getItem("mejorPuntaje") || 0;
let colisionInterval;
let progresoInterval;
// Variables de estado del juego
let colisionDetectada = false;
let esperandoPregunta = false;
let preguntaActiva = false;
let sonidoActivado = true;
let clickCount = 0;

// Elementos del DOM
const dino = document.getElementById("dino");
const obstaculo = document.getElementById("obstaculo");
const hitboxDino = document.getElementById("hitboxDino");
const hitboxObstaculo = document.getElementById("hitboxObstaculo");
const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaJuego = document.getElementById("pantallaJuego");
const zonaJuego = document.getElementById("zonaJuego");
const preguntaBox = document.getElementById("preguntaBox");
const preguntaTxt = document.getElementById("pregunta");
const contenedorOpciones = document.querySelector(".opciones");
const mensaje = document.getElementById("mensajeRespuesta");
const toggleBtn = document.getElementById("toggleSonido");
const easterEgg = document.getElementById("easterEgg");
const mainDino = document.getElementById("mainDino");
const closeEasterEgg = document.getElementById("closeEasterEgg");

//precargar assets
function precargarAssets(callback) {
  const assets = {
    sonidos: ["assets/sounds/jump.mp3", "assets/sounds/selva3.mp3"],
    imagenes: [
      "assets/images/dino.png",
      "assets/images/background_main.png",
      "assets/images/obstaculo.png",
      "assets/images/fondo_juego.png",
      "assets/images/dino_regalo.png",
    ],
  };

  const total = assets.sonidos.length + assets.imagenes.length;
  let cargados = 0;

  const barra = document.getElementById("barraCarga");
  const porcentajeTxt = document.getElementById("porcentaje");

  function actualizarCarga() {
    cargados++;
    const progreso = Math.floor((cargados / total) * 100);
    barra.style.width = progreso + "%";
    porcentajeTxt.textContent = progreso + "%";

    if (cargados === total) {
      setTimeout(() => {
        document.getElementById("pantallaCarga").style.display = "none";
        // callback(); // Todo cargado, inicia el juego
      }, 500);
    }
  }

  // Cargar sonidos
  assets.sonidos.forEach((src) => {
    const audio = new Audio();
    audio.src = src;
    audio.addEventListener("canplaythrough", actualizarCarga, { once: true });
  });

  // Cargar imágenes
  assets.imagenes.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = actualizarCarga;
  });
}

precargarAssets(() => {
  document.getElementById("pantallaCarga").style.display = "none";
  document.getElementById("pantallaInicio").classList.add("activa");
});

document.getElementById("mejorPuntaje").textContent = mejorPuntaje;

//add event listeners
// Pausar cuando se pierde visibilidad (cambia de pestaña o app)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sonidoSelva.pause();
  } else if (sonidoActivado) {
    sonidoSelva.play();
  }
});

// También en móviles, cuando el usuario cierra o minimiza
window.addEventListener("pagehide", () => {
  sonidoSelva.pause();
});
window.addEventListener("pageshow", () => {
  if (!document.hidden && sonidoActivado) {
    sonidoSelva.play();
  }
});

toggleBtn.addEventListener("click", () => {
  sonidoActivado = !sonidoActivado;
  if (sonidoActivado) {
    sonidoSelva.play();
    toggleBtn.classList.remove("off");
  } else {
    sonidoSelva.pause();
    toggleBtn.classList.add("off");
  }
});

closeEasterEgg.addEventListener("click", () => {
  clickCount = 0; // Reinicia el contador de clicks
  easterEgg.style.display = "none";
});

zonaJuego.addEventListener("click", saltar);

mainDino.addEventListener("click", () => {
  clickCount++;
  if (clickCount === 20) {
    easterEgg.style.display = "block";
  }
});

sonidoSelva.loop = true;
sonidoSalto.volume = 0.5; // Ajusta el volumen del sonido de salto

fetch("preguntas_dinosaurios_100.json")
  .then((res) => res.json())
  .then((data) => {
    preguntasPorDificultad = agruparPreguntas(data);
  })
  .catch((err) => console.error("Error al cargar preguntas:", err));

function agruparPreguntas(preguntas) {
  return {
    facil: preguntas.filter((p) => p.dificultad === "facil"),
    medio: preguntas.filter((p) => p.dificultad === "medio"),
    dificil: preguntas.filter((p) => p.dificultad === "dificil"),
  };
}

function obtenerPregunta(preguntasPorDificultad) {
  const nivel = dificultades[dificultad];
  const disponibles = preguntasPorDificultad[nivel].filter(
    (p) => !preguntasUsadas.includes(p.id)
  );

  // Si ya usamos todas las preguntas de este nivel, reiniciamos el ciclo completo
  if (disponibles.length === 0) {
    preguntasUsadas = [];
    localStorage.removeItem("preguntasUsadas");
    return obtenerPregunta(preguntasPorDificultad); // vuelve a intentar
  }

  // Seleccionar una pregunta aleatoria
  const pregunta = disponibles[Math.floor(Math.random() * disponibles.length)];
  preguntasUsadas.push(pregunta.id);
  localStorage.setItem("preguntasUsadas", JSON.stringify(preguntasUsadas));

  return pregunta;
}

function iniciarJuego() {
  sonidoActivado && sonidoSelva.play();
  pantallaInicio.classList.remove("activa");
  pantallaJuego.classList.add("activa");
  document.getElementById("vidas").textContent = vidas;
  document.getElementById("puntaje").textContent = puntaje;
  progreso = 0;
  iniciarNivel();
}

function iniciarNivel() {
  sonidoSelva.volume = 0.5; // Ajusta el volumen de la música
  // obstaculo.style.right = "0";
  // progreso = 0;
  esperandoPregunta = false;
  actualizarProgreso();
  moverObstaculo();
  iniciarColisiones();

  if (progresoInterval) {
    clearInterval(progresoInterval); // Limpia cualquier progreso previo
  }

  progresoInterval = setInterval(() => {
    progreso += 1;
    actualizarProgreso();
    if (progreso >= 100) {
      clearInterval(progresoInterval);
      esperandoPregunta = true;
    }
  }, distanciaPista / 100);
}

function actualizarProgreso() {
  document.getElementById("barraProgreso").style.width = progreso + "%";
}

function moverObstaculo() {
  // obstaculo.style.right = obstaculoRight + "px"; // Mantiene la posición actual
  obstaculo.style.animationDuration = velocidad / 1000 + "s";
  obstaculo.style.animationName = "moverObstaculo";
}

function detenerObstaculo() {
  const obstaculoRight = parseInt(
    window.getComputedStyle(obstaculo).getPropertyValue("right")
  );
  obstaculo.style.animationName = "none";
  obstaculo.style.right = obstaculoRight + "px"; // Mantiene la posición actual
  obstaculo.offsetHeight; // Fuerza reflow
  // obstaculo.style.right = "0"; // Opcional: restablecer posición
}

function mostrarPregunta() {
  sonidoSelva.volume = 0.2; // Reduce el volumen de la música al mostrar la pregunta
  clearInterval(progresoInterval);
  preguntaActiva = true;
  preguntaBox.style.display = "flex";
  const pregunta = obtenerPregunta(preguntasPorDificultad);
  preguntaTxt.textContent = pregunta.pregunta;
  contenedorOpciones.innerHTML = "";
  pregunta.opciones.forEach((op) => {
    const btn = document.createElement("button");
    btn.textContent = op;
    btn.onclick = () => responder(op, pregunta.respuesta);
    contenedorOpciones.appendChild(btn);
  });
}

function responder(opcion, respuestaCorrecta) {
  contenedorOpciones.innerHTML = "";
  if (opcion === respuestaCorrecta) {
    puntaje++;
    document.getElementById("puntaje").textContent = puntaje;

    mensaje.textContent = "¡Respuesta correcta!";
    mensaje.style.color = "green";
    // Avanzar al siguiente nivel
    dificultad = (dificultad + 1) % dificultades.length;
    velocidad *= 0.95;

    progreso = 0; // Reinicia el progreso
    finalizarRespuesta(() => iniciarNivel());
  } else {
    mensaje.textContent = "Respuesta incorrecta";
    mensaje.style.color = "red";

    finalizarRespuesta(() => perderVida());
  }
}

function finalizarRespuesta(callback) {
  setTimeout(() => {
    mensaje.textContent = "";
    ocultarPregunta();
    preguntaActiva = false;
    callback();
  }, 1500);
}

function ocultarPregunta() {
  preguntaBox.style.display = "none";
}

function saltar() {
  if (preguntaActiva) return; // Evita saltar si hay una pregunta activa

  if (!dino.classList.contains("jump")) {
    if (sonidoActivado) {
      sonidoSalto.volume = 0.5; // Ajusta el volumen del sonido de salto
      sonidoSalto.currentTime = 0; // Reinicia el sonido
      sonidoSalto.play();
    }
    dino.classList.add("jump");
    setTimeout(() => {
      dino.classList.remove("jump");
    }, 600);
  }
}

// function iniciarColisiones() {
//   if (colisionInterval) {
//     clearInterval(colisionInterval); // Limpia cualquier colisión previa
//   }

//   colisionInterval = setInterval(() => {
//     const dinoBottom = parseInt(
//       window.getComputedStyle(dino).getPropertyValue("bottom")
//     );
//     const obstaculoRight = parseInt(
//       window.getComputedStyle(obstaculo).getPropertyValue("right")
//     );
//     const obstaculoLeft = window.innerWidth - obstaculoRight;

//     const colision =
//       obstaculoLeft < 160 && obstaculoLeft > 90 && dinoBottom < 110;
//     console.log(
//       `Dino Bottom: ${dinoBottom}, Obstaculo Left: ${obstaculoLeft}, Colision: ${colision}`
//     );

//     if (colision && !colisionDetectada) {
//       colisionDetectada = true; // Evita colisiones múltiples
//       perderVida();
//     }

//     // Restablece el flag si el obstáculo ya pasó al dino
//     if (obstaculoLeft <= 40 || obstaculoLeft >= 160) {
//       colisionDetectada = false;
//     }

//     if (obstaculoLeft <= 10 && esperandoPregunta) {
//       detenerObstaculo();
//       clearInterval(colisionInterval);
//       mostrarPregunta();
//     }
//   }, 50);
// }

function iniciarColisiones() {
  if (colisionInterval) {
    clearInterval(colisionInterval); // Limpia cualquier colisión previa
  }

  colisionInterval = setInterval(() => {
    const dinoRect = hitboxDino.getBoundingClientRect();
    const obstaculoRect = hitboxObstaculo.getBoundingClientRect();

    const colision = !(
      dinoRect.top > obstaculoRect.bottom ||
      dinoRect.bottom < obstaculoRect.top ||
      dinoRect.right < obstaculoRect.left ||
      dinoRect.left > obstaculoRect.right
    );

    console.log("Dino:", dinoRect);
    console.log("Obstáculo:", obstaculoRect);
    console.log("Colisión:", colision);

    if (colision && !colisionDetectada) {
      colisionDetectada = true; // Evita colisiones múltiples
      perderVida();
    }

    // Restablece el flag si el obstáculo ya pasó al dino
    if (
      (obstaculoRect.right < dinoRect.left ||
        obstaculoRect.left > dinoRect.right) &&
      colisionDetectada
    ) {
      colisionDetectada = false;
    }

    if (obstaculoRect.left <= 0 && esperandoPregunta) {
      detenerObstaculo();
      clearInterval(colisionInterval);
      mostrarPregunta();
    }
  }, 50);
}

function perderVida() {
  vidas--;
  document.getElementById("vidas").textContent = vidas;
  if (vidas <= 0) {
    terminarJuego("¡Juego terminado!");
  } else {
    // obstaculo.style.animationDuration = velocidad / 1000 + "s"; // Reinicia la velocidad del obstáculo
    progreso = 0; // Reinicia el progreso
    iniciarNivel(); // Reinicia el nivel actual
  }
}

function pausarJuego() {
  if (!preguntaActiva) {
    preguntaActiva = true;
    detenerObstaculo();
    clearInterval(colisionInterval);
    clearInterval(progresoInterval);
    preguntaBox.style.display = "flex";
    preguntaTxt.classList.add("juego-pausado");
    preguntaTxt.textContent = "Juego Pausado";
    sonidoSelva.pause();
  } else {
    preguntaBox.style.display = "none";
    preguntaTxt.classList.remove("juego-pausado");
    preguntaTxt.textContent = "";
    preguntaActiva = false;
    sonidoSelva.play();
    iniciarNivel();
  }
}

function ganarJuego() {
  terminarJuego("¡Felicidades, terminaste el juego!");
}

function terminarJuego(msj) {
  localStorage.setItem("mejorPuntaje", Math.max(mejorPuntaje, puntaje));
  detenerObstaculo();
  colisionDetectada = false;
  preguntaActiva = false;
  esperandoPregunta = false;
  clearInterval(colisionInterval);
  preguntaBox.style.display = "flex";
  preguntaBox.removeChild(contenedorOpciones);
  preguntaBox.removeChild(preguntaTxt);
  mensaje.textContent = msj || "¡El Juego Acabo!";
  mensaje.classList.add("mensajeFinal");
  setTimeout(() => {
    preguntaBox.style.display = "none";
    mensaje.classList.remove("mensajeFinal");
    mensaje.textContent = "";
    pantallaJuego.classList.remove("activa");
    pantallaInicio.classList.add("activa");
    document.getElementById("mejorPuntaje").textContent =
      localStorage.getItem("mejorPuntaje");
    preguntaBox.removeChild(mensaje);
    preguntaBox.appendChild(preguntaTxt);
    preguntaBox.appendChild(contenedorOpciones);
    preguntaBox.appendChild(mensaje);
    vidas = 3;
    puntaje = 1;
    dificultad = 0;
    progreso = 0;
    velocidad = 2000;
    dino.classList.remove("jump"); // Asegura que el dino no esté saltando
    // location.reload();
  }, 2500);
}

const niveles = ["facil", "medio", "dificil"];
let nivelActual = 0; // 0 = facil, 1 = medio, 2 = dificil
let preguntas = [];
let preguntasPorNivel = {};
let preguntasUsadas = JSON.parse(localStorage.getItem("preguntasUsadas")) || [];
let vidas = 3;
let progreso = 0;
let velocidad = 2000;
let distanciaPista = 5000;
let puntaje = 1;
let mejorPuntaje = localStorage.getItem("mejorPuntaje") || 0;
let colisionInterval;
let colisionDetectada = false;
let esperandoPregunta = false;
let preguntaActiva = false;

// Elementos del DOM
const dino = document.getElementById("dino");
const obstaculo = document.getElementById("obstaculo");
const pantallaJuego = document.getElementById("pantallaJuego");
const preguntaBox = document.getElementById("preguntaBox");
const preguntaTxt = document.getElementById("pregunta");
const contenedorOpciones = document.querySelector(".opciones");
const mensaje = document.getElementById("mensajeRespuesta");

document.getElementById("mejorPuntaje").textContent = mejorPuntaje;

pantallaJuego.addEventListener("click", saltar);

fetch("preguntas.json")
  .then((res) => res.json())
  .then((data) => {
    preguntasPorNivel = agruparPreguntas(data);
  })
  .catch((err) => console.error("Error al cargar preguntas:", err));

function agruparPreguntas(preguntas) {
  return {
    facil: preguntas.filter((p) => p.nivel === "facil"),
    medio: preguntas.filter((p) => p.nivel === "medio"),
    dificil: preguntas.filter((p) => p.nivel === "dificil"),
  };
}

function obtenerPregunta(preguntasPorNivel) {
  const nivel = niveles[nivelActual];
  const disponibles = preguntasPorNivel[nivel].filter(
    (p) => !preguntasUsadas.includes(p.id)
  );

  // Si ya usamos todas las preguntas de este nivel, reiniciamos el ciclo completo
  if (disponibles.length === 0) {
    preguntasUsadas = [];
    localStorage.removeItem("preguntasUsadas");
    return obtenerPregunta(preguntasPorNivel); // vuelve a intentar
  }

  // Seleccionar una pregunta aleatoria
  const pregunta = disponibles[Math.floor(Math.random() * disponibles.length)];
  preguntasUsadas.push(pregunta.id);
  localStorage.setItem("preguntasUsadas", JSON.stringify(preguntasUsadas));

  return pregunta;
}

function iniciarJuego() {
  document.getElementById("pantallaInicio").classList.remove("activa");
  document.getElementById("pantallaJuego").classList.add("activa");
  document.getElementById("vidas").textContent = vidas;
  document.getElementById("puntaje").textContent = puntaje;
  iniciarNivel();
}

function iniciarNivel() {
  progreso = 0;
  esperandoPregunta = false;
  actualizarProgreso();
  moverObstaculo();
  iniciarColisiones();

  let progresoInterval = setInterval(() => {
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
  obstaculo.style.animationDuration = velocidad / 1000 + "s";
  obstaculo.style.animationName = "moverObstaculo";
}

function detenerObstaculo() {
  obstaculo.style.animationName = "none";
  obstaculo.offsetHeight; // Fuerza reflow
  obstaculo.style.right = "0"; // Opcional: restablecer posición
}

function mostrarPregunta() {
  preguntaActiva = true;
  preguntaBox.style.display = "flex";
  const pregunta = obtenerPregunta(preguntasPorNivel);
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
    nivelActual = (nivelActual + 1) % niveles.length;
    velocidad *= 0.9;

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
    dino.classList.add("jump");
    setTimeout(() => {
      dino.classList.remove("jump");
    }, 600);
  }
}

function iniciarColisiones() {
  colisionInterval = setInterval(() => {
    const dinoBottom = parseInt(
      window.getComputedStyle(dino).getPropertyValue("bottom")
    );
    const obstaculoRight = parseInt(
      window.getComputedStyle(obstaculo).getPropertyValue("right")
    );
    const obstaculoLeft = window.innerWidth - obstaculoRight;

    const colision =
      obstaculoLeft < 110 && obstaculoLeft > 60 && dinoBottom < 110;

    if (colision && !colisionDetectada) {
      colisionDetectada = true; // Evita colisiones múltiples
      perderVida();
    }

    // Restablece el flag si el obstáculo ya pasó al dino
    if (obstaculoLeft <= 40 || obstaculoLeft >= 110) {
      colisionDetectada = false;
    }

    if (obstaculoLeft <= 10 && esperandoPregunta) {
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
    iniciarNivel(); // Reinicia el nivel actual
  }
}

function ganarJuego() {
  terminarJuego("¡Felicidades, terminaste el juego!");
}

function terminarJuego(msj) {
  detenerObstaculo();
  colisionDetectada = false;
  preguntaActiva = false;
  esperandoPregunta = false;
  clearInterval(colisionInterval);
  preguntaBox.style.display = "flex";
  preguntaBox.removeChild(contenedorOpciones);
  preguntaBox.removeChild(preguntaTxt);
  mensaje.textContent = msj || "¡Juego terminado!";
  mensaje.classList.add("mensajeFinal");
  setTimeout(() => {
    preguntaBox.style.display = "none";
    location.reload();
  }, 2500);
  localStorage.setItem("mejorPuntaje", Math.max(mejorPuntaje, puntaje));
}

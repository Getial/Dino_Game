let preguntas = [];

fetch("preguntas.json")
  .then((res) => res.json())
  .then((data) => {
    preguntas = data;
    // iniciarJuego(); // iniKcia el juego una vez cargadas las preguntas
  })
  .catch((err) => console.error("Error al cargar preguntas:", err));

let nivel = 0;
let vidas = 3;
let progreso = 0;
let velocidad = 2000;
let distanciaPista = 5000;
let mejorPuntaje = localStorage.getItem("mejorPuntaje") || 0;
let colisionInterval;
let colisionDetectada = false;
let esperandoPregunta = false;

const dino = document.getElementById("dino");
const obstaculo = document.getElementById("obstaculo");
const pantallaJuego = document.getElementById("pantallaJuego");
const preguntaBox = document.getElementById("preguntaBox");
const contenedorOpciones = document.querySelector(".opciones");
const mensaje = document.getElementById("mensajeRespuesta");

document.getElementById("mejorPuntaje").textContent = mejorPuntaje;

pantallaJuego.addEventListener("click", saltar);

function iniciarJuego() {
  document.getElementById("pantallaInicio").classList.remove("activa");
  document.getElementById("pantallaJuego").classList.add("activa");
  document.getElementById("vidas").textContent = vidas;
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
      // detenerObstaculo();
      // clearInterval(colisionInterval);
      // mostrarPregunta();
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
  preguntaBox.style.display = "flex";
  const pregunta = preguntas[nivel];
  document.getElementById("pregunta").textContent = pregunta.pregunta;
  contenedorOpciones.innerHTML = "";
  pregunta.opciones.forEach((op) => {
    const btn = document.createElement("button");
    btn.textContent = op;
    btn.onclick = () => responder(op);
    contenedorOpciones.appendChild(btn);
  });
}

function responder(opcion) {
  contenedorOpciones.innerHTML = "";
  if (opcion === preguntas[nivel].respuesta) {
    mensaje.textContent = "¡Respuesta correcta!";
    mensaje.style.color = "green";
    nivel++;
    velocidad *= 0.9;
    setTimeout(() => {
      ocultarPregunta();
      mensaje.textContent = ""; // limpiar mensaje
      if (nivel < preguntas.length) {
        iniciarNivel();
      } else {
        ganarJuego();
      }
    }, 1500); // esperar 1.5 segundos antes de cerrar
  } else {
    mensaje.textContent = "Respuesta incorrecta";
    mensaje.style.color = "red";
    setTimeout(() => {
      mensaje.textContent = ""; // limpiar mensaje
      ocultarPregunta();
      perderVida();
    }, 1500); // esperar 1.5 segundos antes de cerrar
  }
}

function ocultarPregunta() {
  document.getElementById("preguntaBox").style.display = "none";
}

function saltar() {
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

function terminarJuego(mensaje) {
  clearInterval(colisionInterval);
  alert(mensaje);
  localStorage.setItem("mejorPuntaje", Math.max(mejorPuntaje, nivel));
  location.reload();
}

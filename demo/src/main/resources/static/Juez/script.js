// --- VARIABLES DE ESTADO ---
let puntos1 = 0, puntos2 = 0;
let game1 = 0, game2 = 0;
let set1 = 0, set2 = 0;
let tieBreak = false;
let superTieBreak = false;
let quienSirve = 0; 
let quienInicioRecibiendoTie = 0; 
let puntosServidosEnTie = 0; 
let gamesSet1J1_guardados = 0;
let gamesSet1J2_guardados = 0;
let gamesSet2J1_guardados = 0;
let gamesSet2J2_guardados = 0;
let gamesSet3J1_guardados = 0; // 🔥 Declaradas globalmente
let gamesSet3J2_guardados = 0;

// --- OBJETOS DE ESTADÍSTICA ---
let statsJugador1 = { ace: 0, dobleFalta: 0, errorNo: 0, red: 0, winner: 0 };
let statsJugador2 = { ace: 0, dobleFalta: 0, errorNo: 0, red: 0, winner: 0 };

let nombreRealJ1 = "Jugador 1";
let nombreRealJ2 = "Jugador 2";

// --- WEBSOCKET CONNECTION ---
let stompClient = null;

function conectarWS() {
    console.log("Intentando establecer conexión WebSocket...");
    // 🔥 CAMBIO AQUÍ: Usa la URL completa de tu backend
    const socket = new SockJS('http://localhost:8080/ws-tenis'); 
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, (frame) => {
        console.log("✅ JUEZ: Conectado con éxito. Marcador activo.");
        document.getElementById("estado").innerText = "EN_CURSO";
        enviarActualizacion(); 
    }, (error) => {
        console.error("❌ JUEZ: Error de conexión STOMP:", error);
    });
}

function cargarDatosPartidoExistente(partidoData) {
    console.log("Reanudando marcador con los datos de la BD:", partidoData);
    
    const mapeoPuntos = {"0": 0, "15": 1, "30": 2, "40": 3, "AD": 4};

    // 1. Cargar y pintar Puntos
    if (partidoData.puntosActualesJ1) {
        document.getElementById("puntaje1").innerText = partidoData.puntosActualesJ1;
        puntos1 = mapeoPuntos[partidoData.puntosActualesJ1] || 0;
    }
    if (partidoData.puntosActualesJ2) {
        document.getElementById("puntaje2").innerText = partidoData.puntosActualesJ2;
        puntos2 = mapeoPuntos[partidoData.puntosActualesJ2] || 0;
    }
    
    // 2. Cargar y pintar Sets
    set1 = partidoData.setsGanadosJ1 || 0;
    set2 = partidoData.setsGanadosJ2 || 0;
    document.getElementById("setJug1").innerText = set1;
    document.getElementById("setJug2").innerText = set2;

    // 3. Cargar y pintar Games dependiendo del Set actual
    let setActual = set1 + set2 + 1;
    if (setActual === 1) {
        game1 = partidoData.gamesSet1J1 || 0;
        game2 = partidoData.gamesSet1J2 || 0;
    } else if (setActual === 2) {
        game1 = partidoData.gamesSet2J1 || 0;
        game2 = partidoData.gamesSet2J2 || 0;
    } else {
        game1 = partidoData.gamesSet3J1 || 0;
        game2 = partidoData.gamesSet3J2 || 0;
    }
    
    document.getElementById("sumarGameJug1").innerText = game1;
    document.getElementById("sumarGameJug2").innerText = game2;
    
    // Guardar los estados históricos en memoria local del script (¡Asegúrate de incluir el Set 3 aquí!)
    gamesSet1J1_guardados = partidoData.gamesSet1J1 || 0;
    gamesSet1J2_guardados = partidoData.gamesSet1J2 || 0;
    gamesSet2J1_guardados = partidoData.gamesSet2J1 || 0;
    gamesSet2J2_guardados = partidoData.gamesSet2J2 || 0;
    gamesSet3J1_guardados = partidoData.gamesSet3J1 || 0; // 🔥 Inicializadas con lo que traiga la BD
    gamesSet3J2_guardados = partidoData.gamesSet3J2 || 0; // 🔥

    // 4. Conectar el WebSocket
    conectarWS();
}

function enviarActualizacion() {
    const partidoIdActual = localStorage.getItem('partidoIdEnCurso');
    if (!partidoIdActual) return;

    const p1Text = document.getElementById("puntaje1").innerText;
    const p2Text = document.getElementById("puntaje2").innerText;
    let setActual = set1 + set2 + 1;

    // 🔥 Si estamos en Super Tie-Break, los games del 3er Set corresponden a los puntos actuales del Tie
    let g3_j1 = gamesSet3J1_guardados;
    let g3_j2 = gamesSet3J2_guardados;

    if (superTieBreak) {
        g3_j1 = puntos1;
        g3_j2 = puntos2;
    } else if (setActual === 3) {
        g3_j1 = game1;
        g3_j2 = game2;
    }

    const payload = {
        partidoId: parseInt(partidoIdActual),
        puntaje1: p1Text,
        puntaje2: p2Text,
        games1: game1,
        games2: game2,
        sets1: set1,
        sets2: set2,
        gamesSet1J1: (setActual === 1) ? game1 : gamesSet1J1_guardados,
        gamesSet1J2: (setActual === 1) ? game2 : gamesSet1J2_guardados,
        gamesSet2J1: (setActual === 2) ? game1 : gamesSet2J1_guardados,
        gamesSet2J2: (setActual === 2) ? game2 : gamesSet2J2_guardados,
        gamesSet3J1: g3_j1,
        gamesSet3J2: g3_j2,
        estado: document.getElementById("estado").innerText || "EN_JUEGO",
        servidor: quienSirve
    };

    if (stompClient && stompClient.connected) {
        stompClient.send("/app/actualizar-marcador", {}, JSON.stringify(payload));
    }

    fetch(`/api/torneos/partidos/${partidoIdActual}/actualizar-marcador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("⚠️ Error guardando punto en BD:", err));
}

function preguntarServicio(n1, n2) {
    nombreRealJ1 = n1 || "Jugador 1";
    nombreRealJ2 = n2 || "Jugador 2";
    
    let seleccion = prompt(`¿Quién inicia sirviendo?\n\n1 - ${nombreRealJ1}\n2 - ${nombreRealJ2}\n\nIngresa el número (1 o 2):`);
    if (seleccion === "1" || seleccion === "2") {
        quienSirve = parseInt(seleccion);
        actualizarBotonesServicio();
    } else if (seleccion !== null) { preguntarServicio(n1, n2); }
}
function actualizarBotonesServicio() {
    // Mantener todos los botones de estadísticas permanentemente habilitados
    const todosLosBotones = document.querySelectorAll('.panel-stats button');
    todosLosBotones.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = "1";
    });
}

function registrarStat(jugador, tipo) {
    const s = (jugador === 1) ? statsJugador1 : statsJugador2;
    s[tipo]++;
    
    if (tipo === 'ace' || tipo === 'winner') (jugador === 1) ? sumarJugador1() : sumarJugador2();
    else if (tipo === 'dobleFalta' || tipo === 'errorNo' || tipo === 'red') (jugador === 1) ? sumarJugador2() : sumarJugador1();
}

// --- LÓGICA DE SUMA DE PUNTOS ---
function sumarJugador1() {
    if (superTieBreak) { manejarSuperTieBreak(1); return; }
    if (tieBreak) { manejarTieBreak(1); return; }

    puntos1++;
    if ((puntos1 >= 4 && puntos1 - puntos2 >= 2) || (puntos1 === 5 && puntos2 === 4)) {
        game1++;
        document.getElementById("sumarGameJug1").innerText = game1;
        quienSirve = (quienSirve === 1) ? 2 : 1;
        actualizarBotonesServicio();
        resetPuntos();
        verificarSet();
        enviarActualizacion();
    } else { actualizarPuntajes(); }
}

function sumarJugador2() {
    if (superTieBreak) { manejarSuperTieBreak(2); return; }
    if (tieBreak) { manejarTieBreak(2); return; }

    puntos2++;
    if ((puntos2 >= 4 && puntos2 - puntos1 >= 2) || (puntos2 === 5 && puntos1 === 4)) {
        game2++;
        document.getElementById("sumarGameJug2").innerText = game2;
        quienSirve = (quienSirve === 1) ? 2 : 1;
        actualizarBotonesServicio();
        resetPuntos();
        verificarSet();
        enviarActualizacion();
    } else { actualizarPuntajes(); }
}

// --- TIE-BREAK (A 7) ---
function manejarTieBreak(ganadorPunto) {
    (ganadorPunto === 1) ? puntos1++ : puntos2++;
    puntosServidosEnTie++;

    if (puntosServidosEnTie === 1 || (puntosServidosEnTie > 1 && (puntosServidosEnTie - 1) % 2 === 0)) {
        quienSirve = (quienSirve === 1) ? 2 : 1;
        actualizarBotonesServicio();
    }

    document.getElementById("puntaje1").innerText = puntos1;
    document.getElementById("puntaje2").innerText = puntos2;
    document.getElementById("estado").innerText = "TIE-BREAK";

    // 🔥 SUMAR EL GAME (7° GAME) AL GANADOR DEL TIE-BREAK
    if (puntos1 >= 7 && puntos1 - puntos2 >= 2) {
        game1++; 
        document.getElementById("sumarGameJug1").innerText = game1;
        finalizarSet(1);
    } else if (puntos2 >= 7 && puntos2 - puntos1 >= 2) {
        game2++; 
        document.getElementById("sumarGameJug2").innerText = game2;
        finalizarSet(2);
    }
    enviarActualizacion();
}

// --- SUPER TIE-BREAK (A 10) ---
// --- SUPER TIE-BREAK (A 10) ---
function manejarSuperTieBreak(ganadorPunto) {
    (ganadorPunto === 1) ? puntos1++ : puntos2++;
    puntosServidosEnTie++;

    if (puntosServidosEnTie === 1 || (puntosServidosEnTie > 1 && (puntosServidosEnTie - 1) % 2 === 0)) {
        quienSirve = (quienSirve === 1) ? 2 : 1;
        actualizarBotonesServicio();
    }

    document.getElementById("puntaje1").innerText = puntos1;
    document.getElementById("puntaje2").innerText = puntos2;
    document.getElementById("estado").innerText = "SUPER TIE-BREAK (A 10)";

    // 🔥 GUARDAR LOS PUNTOS DEL SUPER TIE-BREAK COMO RESULTADO DEL 3er SET
    if (puntos1 >= 10 && puntos1 - puntos2 >= 2) {
        gamesSet3J1_guardados = puntos1;
        gamesSet3J2_guardados = puntos2;
        set1++;
        chequearPartido();
    } else if (puntos2 >= 10 && puntos2 - puntos1 >= 2) {
        gamesSet3J1_guardados = puntos1;
        gamesSet3J2_guardados = puntos2;
        set2++;
        chequearPartido();
    }
    enviarActualizacion();
}

function verificarSet() {
    if ((game1 >= 6 && game1 - game2 >= 2) || game1 === 7) finalizarSet(1);
    else if ((game2 >= 6 && game2 - game1 >= 2) || game2 === 7) finalizarSet(2);
    else if (game1 === 6 && game2 === 6) {
        tieBreak = true;
        puntosServidosEnTie = 0;
        quienInicioRecibiendoTie = (quienSirve === 1) ? 1 : 2; 
        alert("🎾 ¡Tie-break!");
    }
}

function finalizarSet(ganador) {
    let setActual = set1 + set2 + 1; // 1, 2 o 3

    // 🔥 Guardar los games acumulados del set que acaba de terminar antes de reiniciar
    if (setActual === 1) {
        gamesSet1J1_guardados = game1;
        gamesSet1J2_guardados = game2;
    } else if (setActual === 2) {
        gamesSet2J1_guardados = game1;
        gamesSet2J2_guardados = game2;
    } else if (setActual === 3) {
        gamesSet3J1_guardados = game1;
        gamesSet3J2_guardados = game2;
    }

    (ganador === 1) ? set1++ : set2++;
    document.getElementById("setJug1").innerText = set1;
    document.getElementById("setJug2").innerText = set2;
    
    if (tieBreak) {
        quienSirve = quienInicioRecibiendoTie;
        actualizarBotonesServicio();
    }

    tieBreak = false;
    reiniciarGames();
    chequearPartido();
}

function chequearPartido() {
    if (set1 === 2 || set2 === 2) {
        document.getElementById("estado").innerText = "FINALIZADO";
        enviarActualizacion();
        mostrarInterfazStats();
    } else if (set1 === 1 && set2 === 1) {
        superTieBreak = true;
        puntosServidosEnTie = 0;
        alert("🎾 ¡Súper Tie-break a 10 puntos!");
    }
}

// --- UTILIDADES ---
function actualizarPuntajes() {
    const p1 = document.getElementById("puntaje1");
    const p2 = document.getElementById("puntaje2");
    const estado = document.getElementById("estado");

    if (puntos1 === 4 && puntos2 === 4) {
        p1.innerText = "AD"; p2.innerText = "AD";
        estado.innerText = "¡PUNTO DECISIVO!";
    } else if (puntos1 === 4 && puntos2 === 3) {
        p1.innerText = "AD"; p2.innerText = "40";
        estado.innerText = "Ventaja J1";
    } else if (puntos2 === 4 && puntos1 === 3) {
        p1.innerText = "40"; p2.innerText = "AD";
        estado.innerText = "Ventaja J2";
    } else {
        p1.innerText = cambiarPunto(puntos1);
        p2.innerText = cambiarPunto(puntos2);
        estado.innerText = (puntos1 === 3 && puntos2 === 3) ? "DEUCE" : "";
    }
    enviarActualizacion();
}

function resetPuntos() { puntos1 = 0; puntos2 = 0; actualizarPuntajes(); }
function reiniciarGames() { 
    game1 = 0; game2 = 0; resetPuntos(); 
    document.getElementById("sumarGameJug1").innerText = "0";
    document.getElementById("sumarGameJug2").innerText = "0";
}

function cambiarPunto(num) {
    const t = ["0", "15", "30", "40"];
    return t[num] || "40";
}

function mostrarInterfazStats() {
    document.getElementById("tabla-j1").innerHTML = crearFilas(statsJugador1);
    document.getElementById("tabla-j2").innerHTML = crearFilas(statsJugador2);
    document.getElementById("modal-stats").style.display = "flex";
}

function crearFilas(obj) {
    const nombres = { ace: "Aces", dobleFalta: "D. Faltas", errorNo: "Errores NF", red: "Red", winner: "Winners" };
    let html = "";
    for (let key in obj) html += `<tr><td>${nombres[key]}</td><td>${obj[key]}</td></tr>`;
    return html;
}

function cerrarStats() {
    window.location.href = "panel-juez.html"; 
}

// --- PERSISTENCIA Y CIERRE ---

// --- PERSISTENCIA Y CIERRE ACTUALIZADOS ---

async function terminarManual(tipo) {
    const matchId = localStorage.getItem('partidoIdEnCurso');
    if (!matchId) return;

    const nombreJ1 = document.getElementById('nombreJ1').innerText.trim();
    const nombreJ2 = document.getElementById('nombreJ2').innerText.trim();
    
    let nuevoEstado = "FINALIZADO";
    let ganadorElegido = null;

    switch(tipo) {
        case 'Normal':
            if (!confirm("¿Estás seguro de que deseas dar por terminado el partido de forma normal?")) return;
            document.getElementById("estado").innerText = nuevoEstado;
            mostrarInterfazStats();
            return;

        case 'W': 
            let opW = prompt(`🏆 GANAR POR WALKOVER (W)\n\n¿Quién avanza a la siguiente ronda?\n1 - ${nombreJ1}\n2 - ${nombreJ2}\n\nIngresa el número (1 o 2):`);
            if (opW === "1") ganadorElegido = nombreJ1;
            else if (opW === "2") ganadorElegido = nombreJ2;
            else { alert("Operación cancelada o inválida."); return; }
            break;

        case 'R': 
            let opR = prompt(`❌ RETIRO EN PARTIDO\n\n¿Quién es el jugador que SE RETIRA?\n1 - ${nombreJ1}\n2 - ${nombreJ2}\n\nIngresa el número (1 o 2):`);
            if (opR === "1") ganadorElegido = nombreJ2; 
            else if (opR === "2") ganadorElegido = nombreJ1; 
            else { alert("Operación cancelada o inválida."); return; }
            break;

        case 'Su': // 🔥 INTEGRADO CON TU NUEVA FUNCIÓN DE SUSPENSIÓN ÚNICA
            if (!confirm("¿Deseas pausar y suspender el partido? Se guardará el marcador actual para reanudar después.")) return;
            document.getElementById("estado").innerText = "SUSPENDIDO";
            await suspenderPartido();
            return;
    }

    if (ganadorElegido) {
        document.getElementById("estado").innerText = "FINALIZADO";
        ejecutarCierreDirectoBD(matchId, ganadorElegido);
    }
}

// Función auxiliar para enviar cierres automáticos (W y R) sin exigir estadísticas
async function ejecutarCierreDirectoBD(matchId, ganador) {
    const payload = {
        ganador: ganador,
        sets1: set1,
        sets2: set2,
        games1: game1,
        games2: game2,
        statsJ1: statsJugador1, // Se van limpias en 0
        statsJ2: statsJugador2
    };

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`Partido finalizado con éxito. ¡Ganador: ${ganador} avanza de ronda!`);
            window.location.href = "panel-juez.html";
        } else {
            alert("Error al procesar el cierre automático en el servidor.");
        }
    } catch (error) {
        console.error("Error en el cierre directo del partido:", error);
    }
}

// Reemplaza esta función en tu script.js
async function guardarYPasarSiguienteRonda() {
    const matchId = localStorage.getItem('partidoIdEnCurso');
    if (!matchId) return;

    const nombreJ1 = document.getElementById('nombreJ1').innerText.trim();
    const nombreJ2 = document.getElementById('nombreJ2').innerText.trim();
    
    let ganador = (set1 > set2) ? nombreJ1 : nombreJ2;

    const btnGuardar = document.getElementById('btn-guardar-bd');
    if (btnGuardar) btnGuardar.disabled = true;

    // 🔥 Guardar los parciales finales garantizando los games correctos de cada set
    const payload = {
        ganador: ganador,
        setsGanadosJ1: set1,
        setsGanadosJ2: set2,
        gamesSet1J1: gamesSet1J1_guardados,
        gamesSet1J2: gamesSet1J2_guardados,
        gamesSet2J1: gamesSet2J1_guardados,
        gamesSet2J2: gamesSet2J2_guardados,
        gamesSet3J1: gamesSet3J1_guardados,
        gamesSet3J2: gamesSet3J2_guardados,
        statsJ1: statsJugador1, 
        statsJ2: statsJugador2
    };

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`Partido guardado. ¡Ganador: ${ganador} avanza de ronda!`);
            window.location.href = "panel-juez.html";
        } else {
            alert("Error al procesar el cierre en el servidor.");
            if (btnGuardar) btnGuardar.disabled = false;
        }
    } catch (error) {
        console.error("Error al finalizar el partido:", error);
        if (btnGuardar) btnGuardar.disabled = false;
    }
}

// En tu script.js
async function suspenderPartido() {
    const matchId = localStorage.getItem('partidoIdEnCurso');
    if (!matchId) return;

    const mapeoInverso = {0: "0", 1: "15", 2: "30", 3: "40", 4: "AD"};
    let setActual = set1 + set2 + 1;
    
    const datosASuspender = {
        estado: "SUSPENDIDO",
        puntosActualesJ1: mapeoInverso[puntos1] || "0",
        puntosActualesJ2: mapeoInverso[puntos2] || "0",
        setsGanadosJ1: set1,
        setsGanadosJ2: set2,
        gamesSet1J1: (setActual === 1) ? game1 : gamesSet1J1_guardados,
        gamesSet1J2: (setActual === 1) ? game2 : gamesSet1J2_guardados,
        gamesSet2J1: (setActual === 2) ? game1 : gamesSet2J1_guardados,
        gamesSet2J2: (setActual === 2) ? game2 : gamesSet2J2_guardados,
        gamesSet3J1: (setActual === 3) ? game1 : gamesSet3J1_guardados,
        gamesSet3J2: (setActual === 3) ? game2 : gamesSet3J2_guardados
    };

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/suspender`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosASuspender)
        });

        if (response.ok) {
            alert("Partido suspendido y guardado con éxito.");
            window.location.href = "panel-juez.html";
        } else {
            alert("Error al intentar suspender el partido.");
        }
    } catch (error) {
        console.error("Error al suspender el partido:", error);
    }
}


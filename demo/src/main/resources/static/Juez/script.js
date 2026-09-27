// --- VARIABLES DE ESTADO ---
let puntos1 = 0, puntos2 = 0;
let game1 = 0, game2 = 0;
let set1 = 0, set2 = 0;
let tieBreak = false;
let superTieBreak = false;
let quienSirve = 1; 
let puntosServidosEnTie = 0; 
let esDobles = false;

let gamesSet1J1_guardados = 0, gamesSet1J2_guardados = 0;
let gamesSet2J1_guardados = 0, gamesSet2J2_guardados = 0;
let gamesSet3J1_guardados = 0, gamesSet3J2_guardados = 0;

// Nombres individuales
let nombreJugador1_A = "Jugador 1", nombreJugador1_B = "";
let nombreJugador2_A = "Jugador 2", nombreJugador2_B = "";

// --- ESTRUCTURA DE ESTADÍSTICAS INDIVIDUALES ---
let statsJ1_A = { ace: 0, dobleFalta: 0, primerFalta: 0, errorNo: 0, errorForzado: 0, winner: 0 };
let statsJ1_B = { ace: 0, dobleFalta: 0, primerFalta: 0, errorNo: 0, errorForzado: 0, winner: 0 };
let statsJ2_A = { ace: 0, dobleFalta: 0, primerFalta: 0, errorNo: 0, errorForzado: 0, winner: 0 };
let statsJ2_B = { ace: 0, dobleFalta: 0, primerFalta: 0, errorNo: 0, errorForzado: 0, winner: 0 };

let historial = [];
let stompClient = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');

    if (!matchId) {
        alert("Error: No se especificó un ID de partido.");
        window.location.href = "panel-juez.html";
        return;
    }

    localStorage.setItem('partidoIdEnCurso', matchId);

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/verificar-arbitraje`);
        if (!response.ok) throw new Error("Error en la respuesta del servidor.");
        
        const data = await response.json();
        if (data.permitido === false) {
            alert(`⚠️ Acceso denegado:\n${data.mensaje}`);
            window.location.href = "panel-juez.html";
            return;
        }

        const estadoOriginal = data.estado;
        const respPartido = await fetch(`/api/torneos/partidos/${matchId}`);
        if (!respPartido.ok) throw new Error("No se pudieron obtener los datos del partido.");
        const partidoCompleto = await respPartido.json();

        esDobles = (data.tipoModalidad === "Dobles" || partidoCompleto.modalidad === "Dobles");

        if (esDobles) {
            nombreJugador1_A = data.jugador1 || "Jugador 1A";
            nombreJugador1_B = data.jugador2 || "Jugador 1B";
            nombreJugador2_A = data.jugador3 || "Jugador 2A";
            nombreJugador2_B = data.jugador4 || "Jugador 2B";

            document.getElementById('nombreJ1').innerText = `${nombreJugador1_A} / ${nombreJugador1_B}`;
            document.getElementById('nombreJ2').innerText = `${nombreJugador2_A} / ${nombreJugador2_B}`;


        } else {
            nombreJugador1_A = data.jugador1 || "Jugador 1";
            nombreJugador2_A = data.jugador2 || "Jugador 2";
            document.getElementById('nombreJ1').innerText = nombreJugador1_A;
            document.getElementById('nombreJ2').innerText = nombreJugador2_A;
        }

        await cambiarEstadoPartidoAEnCurso(matchId);

        if (typeof cargarDatosPartidoExistente === 'function') {
            cargarDatosPartidoExistente(partidoCompleto);
        }

        const tieneProgreso = partidoCompleto.puntosActualesJ1 || partidoCompleto.setsGanadosJ1 > 0 || partidoCompleto.setsGanadosJ2 > 0;
        if (estadoOriginal === "PROGRAMADO" && !tieneProgreso) {
            preguntarServicioInicial(document.getElementById('nombreJ1').innerText, document.getElementById('nombreJ2').innerText);
        }
    } catch (error) {
        console.error("Error cargando el partido:", error);
        alert("Hubo un error de red o de base de datos al inicializar.");
        window.location.href = "panel-juez.html";
    }
});


let resolverSeleccionJugador = null;

function solicitarJugadorModal(nombreA, nombreB) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modal-seleccion-jugador");
        const btn1 = document.getElementById("btn-jugador-1");
        const btn2 = document.getElementById("btn-jugador-2");

        btn1.innerText = nombreA;
        btn2.innerText = nombreB;

        btn1.onclick = () => { modal.style.display = "none"; resolve(1); };
        btn2.onclick = () => { modal.style.display = "none"; resolve(2); };

        resolverSeleccionJugador = resolve;
        modal.style.display = "flex";
    });
}

function cerrarModalSeleccion() {
    document.getElementById("modal-seleccion-jugador").style.display = "none";
    if (resolverSeleccionJugador) {
        resolverSeleccionJugador(null);
        resolverSeleccionJugador = null;
    }
}

async function registrarStat(equipo, tipo) {
    let targetStats = null;

    if (esDobles) {
        const pA = (equipo === 1) ? nombreJugador1_A : nombreJugador2_A;
        const pB = (equipo === 1) ? nombreJugador1_B : nombreJugador2_B;

        // Despliega el modal con botones interactivos
        const seleccion = await solicitarJugadorModal(pA, pB);

        if (seleccion === 1) {
            targetStats = (equipo === 1) ? statsJ1_A : statsJ2_A;
        } else if (seleccion === 2) {
            targetStats = (equipo === 1) ? statsJ1_B : statsJ2_B;
        } else {
            // Se canceló la acción
            return;
        }
    } else {
        targetStats = (equipo === 1) ? statsJ1_A : statsJ2_A;
    }

    // Guardar estado e incrementar métrica
    guardarEstadoHistorial();

    if (tipo === '1raFalta') {
        targetStats.primerFalta++;
        return; 
    }

    targetStats[tipo]++;

    // Actualización del marcador
    if (tipo === 'ace' || tipo === 'winner') {
        (equipo === 1) ? sumarJugador1(false) : sumarJugador2(false);
    } else if (tipo === 'dobleFalta' || tipo === 'errorNo' || tipo === 'errorForzado') {
        (equipo === 1) ? sumarJugador2(false) : sumarJugador1(false);
    }
}

function guardarEstadoHistorial() {
    const snapshot = {
        puntos1, puntos2, game1, game2, set1, set2,
        tieBreak, superTieBreak, quienSirve, puntosServidosEnTie,
        gamesSet1J1_guardados, gamesSet1J2_guardados,
        gamesSet2J1_guardados, gamesSet2J2_guardados,
        gamesSet3J1_guardados, gamesSet3J2_guardados,
        sJ1_A: { ...statsJ1_A }, sJ1_B: { ...statsJ1_B },
        sJ2_A: { ...statsJ2_A }, sJ2_B: { ...statsJ2_B }
    };
    historial.push(JSON.stringify(snapshot));
    if (historial.length > 30) historial.shift();
}

function deshacerUltimaAccion() {
    if (historial.length === 0) {
        alert("No hay acciones anteriores para deshacer.");
        return;
    }

    const prev = JSON.parse(historial.pop());
    puntos1 = prev.puntos1; puntos2 = prev.puntos2;
    game1 = prev.game1; game2 = prev.game2;
    set1 = prev.set1; set2 = prev.set2;
    tieBreak = prev.tieBreak; superTieBreak = prev.superTieBreak;
    quienSirve = prev.quienSirve; puntosServidosEnTie = prev.puntosServidosEnTie;
    
    gamesSet1J1_guardados = prev.gamesSet1J1_guardados;
    gamesSet1J2_guardados = prev.gamesSet1J2_guardados;
    gamesSet2J1_guardados = prev.gamesSet2J1_guardados;
    gamesSet2J2_guardados = prev.gamesSet2J2_guardados;
    gamesSet3J1_guardados = prev.gamesSet3J1_guardados;
    gamesSet3J2_guardados = prev.gamesSet3J2_guardados;

    statsJ1_A = { ...prev.sJ1_A }; statsJ1_B = { ...prev.sJ1_B };
    statsJ2_A = { ...prev.sJ2_A }; statsJ2_B = { ...prev.sJ2_B };

    document.getElementById("sumarGameJug1").innerText = game1;
    document.getElementById("sumarGameJug2").innerText = game2;
    document.getElementById("setJug1").innerText = set1;
    document.getElementById("setJug2").innerText = set2;

    actualizarPuntajes();
}

function mostrarInterfazStats() {
    const wrapper = document.getElementById("container-tablas");
    wrapper.innerHTML = "";

    if (esDobles) {
        wrapper.appendChild(crearColumnaStats(nombreJugador1_A, statsJ1_A));
        wrapper.appendChild(crearColumnaStats(nombreJugador1_B, statsJ1_B));
        wrapper.appendChild(crearColumnaStats(nombreJugador2_A, statsJ2_A));
        wrapper.appendChild(crearColumnaStats(nombreJugador2_B, statsJ2_B));
    } else {
        wrapper.appendChild(crearColumnaStats(nombreJugador1_A, statsJ1_A));
        wrapper.appendChild(crearColumnaStats(nombreJugador2_A, statsJ2_A));
    }

    document.getElementById("modal-stats").style.display = "flex";
}

function crearColumnaStats(nombre, objStats) {
    const col = document.createElement("div");
    col.className = "tabla-col";
    col.style.flex = "1";
    col.style.minWidth = "120px";

    col.innerHTML = `
        <h3 class="jugador-nombre" style="font-size: 0.85rem; text-align:center;">${nombre}</h3>
        <table class="stats-table" style="width:100%; border-collapse:collapse;">
            ${crearFilas(objStats)}
        </table>
    `;
    return col;
}

function crearFilas(obj) {
    const nombres = { ace: "Aces", dobleFalta: "D. Faltas", primerFalta: "1ra Falta", errorNo: "Errores NF", errorForzado: "Err. Forzados", winner: "Winners" };
    let html = "";
    for (let key in obj) {
        html += `<tr><td style="padding:2px 4px; border-bottom:1px solid #333;">${nombres[key]}</td><td style="padding:2px 4px; border-bottom:1px solid #333; text-align:right;">${obj[key]}</td></tr>`;
    }
    return html;
}

async function guardarYPasarSiguienteRonda(ganadorForzado = null) {
    const matchId = localStorage.getItem('partidoIdEnCurso');
    if (!matchId) return;

    const btnGuardar = document.getElementById("btn-guardar-bd");
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerText = "Guardando..."; }

    let nombreGanador = ganadorForzado;
    if (!nombreGanador) {
        if (set1 > set2) nombreGanador = document.getElementById("nombreJ1")?.innerText.trim() || "";
        else if (set2 > set1) nombreGanador = document.getElementById("nombreJ2")?.innerText.trim() || "";
    }

    if (!nombreGanador) {
        alert("⚠️ No se puede determinar el ganador.");
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerText = "💾 Guardar Resultado"; }
        return;
    }

    // Payload soporta formato de dobles e individual
    const payloadFinal = {
        ganador: nombreGanador,
        setsGanadosJ1: set1,
        setsGanadosJ2: set2,
        gamesSet1J1: gamesSet1J1_guardados || 0,
        gamesSet1J2: gamesSet1J2_guardados || 0,
        gamesSet2J1: gamesSet2J1_guardados || 0,
        gamesSet2J2: gamesSet2J2_guardados || 0,
        gamesSet3J1: gamesSet3J1_guardados || 0,
        gamesSet3J2: gamesSet3J2_guardados || 0,
        modalidad: esDobles ? "Dobles" : "Singles",
        statsJ1: statsJ1_A,
        statsJ2: statsJ2_A,
        // Campos adicionales enviados si el partido es de Dobles
        statsJ1_B: esDobles ? statsJ1_B : null,
        statsJ2_B: esDobles ? statsJ2_B : null
    };

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFinal)
        });

        if (response.ok) {
            alert("✅ ¡Partido guardado y finalizado con éxito!");
            localStorage.removeItem('partidoIdEnCurso');
            window.location.href = "panel-juez.html";
        } else {
            const errorData = await response.json();
            alert("⚠️ Error al finalizar: " + (errorData.error || "Rechazado por el servidor"));
            if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerText = "💾 Guardar Resultado"; }
        }
    } catch (error) {
        console.error("Error al guardar el partido:", error);
        alert("Error de conexión con el servidor.");
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerText = "💾 Guardar Resultado"; }
    }
}

// LÓGICA DE CONTROL DE PUNTOS & MATCH FLOW
function conectarWS() {
    const socket = new SockJS('/ws-tenis'); 
    stompClient = Stomp.over(socket);
    stompClient.connect({}, () => {
        document.getElementById("estado").innerText = "EN_CURSO";
        enviarActualizacion(); 
    });
}

async function cambiarEstadoPartidoAEnCurso(id) {
    try {
        await fetch(`/api/torneos/partidos/${id}/cambiar-estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: "EN_CURSO" })
        });
    } catch (err) { console.error(err); }
}

function preguntarServicioInicial(j1, j2) {
    let sel = prompt(`¿Quién inicia sirviendo?\n1. ${j1}\n2. ${j2}`, "1");
    quienSirve = (sel === "2") ? 2 : 1;
}

function enviarActualizacion() {
    const partidoIdActual = localStorage.getItem('partidoIdEnCurso');
    if (!partidoIdActual) return;

    let setActual = set1 + set2 + 1;
    const payload = {
        partidoId: parseInt(partidoIdActual),
        puntaje1: document.getElementById("puntaje1").innerText,
        puntaje2: document.getElementById("puntaje2").innerText,
        games1: game1, games2: game2, sets1: set1, sets2: set2,
        gamesSet1J1: (setActual === 1) ? game1 : gamesSet1J1_guardados,
        gamesSet1J2: (setActual === 1) ? game2 : gamesSet1J2_guardados,
        gamesSet2J1: (setActual === 2) ? game1 : gamesSet2J2_guardados,
        gamesSet2J2: (setActual === 2) ? game2 : gamesSet2J2_guardados,
        gamesSet3J1: superTieBreak ? puntos1 : ((setActual === 3) ? game1 : gamesSet3J1_guardados),
        gamesSet3J2: superTieBreak ? puntos2 : ((setActual === 3) ? game2 : gamesSet3J2_guardados),
        estado: document.getElementById("estado").innerText || "EN_JUEGO",
        servidor: quienSirve
    };

    if (stompClient && stompClient.connected) stompClient.send("/app/actualizar-marcador", {}, JSON.stringify(payload));

    fetch(`/api/torneos/partidos/${partidoIdActual}/actualizar-marcador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Error al actualizar:", err));
}

function sumarJugador1(guardar = true) {
    if (guardar) guardarEstadoHistorial();
    if (superTieBreak) { manejarSuperTieBreak(1); return; }
    if (tieBreak) { manejarTieBreak(1); return; }

    puntos1++;
    if ((puntos1 >= 4 && puntos1 - puntos2 >= 2) || (puntos1 === 5 && puntos2 === 4)) {
        game1++;
        document.getElementById("sumarGameJug1").innerText = game1;
        quienSirve = (quienSirve === 1) ? 2 : 1;
        resetPuntos();
        verificarSet();
        enviarActualizacion();
    } else { actualizarPuntajes(); }
}

function sumarJugador2(guardar = true) {
    if (guardar) guardarEstadoHistorial();
    if (superTieBreak) { manejarSuperTieBreak(2); return; }
    if (tieBreak) { manejarTieBreak(2); return; }

    puntos2++;
    if ((puntos2 >= 4 && puntos2 - puntos1 >= 2) || (puntos2 === 5 && puntos1 === 4)) {
        game2++;
        document.getElementById("sumarGameJug2").innerText = game2;
        quienSirve = (quienSirve === 1) ? 2 : 1;
        resetPuntos();
        verificarSet();
        enviarActualizacion();
    } else { actualizarPuntajes(); }
}

function manejarTieBreak(ganadorPunto) {
    (ganadorPunto === 1) ? puntos1++ : puntos2++;
    puntosServidosEnTie++;
    if (puntosServidosEnTie === 1 || (puntosServidosEnTie > 1 && (puntosServidosEnTie - 1) % 2 === 0)) {
        quienSirve = (quienSirve === 1) ? 2 : 1;
    }

    document.getElementById("puntaje1").innerText = puntos1;
    document.getElementById("puntaje2").innerText = puntos2;
    document.getElementById("estado").innerText = "TIE-BREAK";

    if (puntos1 >= 7 && puntos1 - puntos2 >= 2) { game1++; document.getElementById("sumarGameJug1").innerText = game1; finalizarSet(1); }
    else if (puntos2 >= 7 && puntos2 - puntos1 >= 2) { game2++; document.getElementById("sumarGameJug2").innerText = game2; finalizarSet(2); }
    enviarActualizacion();
}

function manejarSuperTieBreak(ganadorPunto) {
    (ganadorPunto === 1) ? puntos1++ : puntos2++;
    puntosServidosEnTie++;
    if (puntosServidosEnTie === 1 || (puntosServidosEnTie > 1 && (puntosServidosEnTie - 1) % 2 === 0)) {
        quienSirve = (quienSirve === 1) ? 2 : 1;
    }

    document.getElementById("puntaje1").innerText = puntos1;
    document.getElementById("puntaje2").innerText = puntos2;
    document.getElementById("estado").innerText = "SUPER TIE-BREAK";

    if (puntos1 >= 10 && puntos1 - puntos2 >= 2) { gamesSet3J1_guardados = puntos1; gamesSet3J2_guardados = puntos2; set1++; chequearPartido(); }
    else if (puntos2 >= 10 && puntos2 - puntos1 >= 2) { gamesSet3J1_guardados = puntos1; gamesSet3J2_guardados = puntos2; set2++; chequearPartido(); }
    enviarActualizacion();
}

function verificarSet() {
    if ((game1 >= 6 && game1 - game2 >= 2) || game1 === 7) finalizarSet(1);
    else if ((game2 >= 6 && game2 - game1 >= 2) || game2 === 7) finalizarSet(2);
    else if (game1 === 6 && game2 === 6) { tieBreak = true; puntosServidosEnTie = 0; alert("🎾 ¡Tie-break!"); }
}

function finalizarSet(ganador) {
    let setActual = set1 + set2 + 1;
    if (setActual === 1) { gamesSet1J1_guardados = game1; gamesSet1J2_guardados = game2; }
    else if (setActual === 2) { gamesSet2J1_guardados = game1; gamesSet2J2_guardados = game2; }
    else if (setActual === 3) { gamesSet3J1_guardados = game1; gamesSet3J2_guardados = game2; }

    (ganador === 1) ? set1++ : set2++;
    document.getElementById("setJug1").innerText = set1;
    document.getElementById("setJug2").innerText = set2;

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

function actualizarPuntajes() {
    const p1 = document.getElementById("puntaje1");
    const p2 = document.getElementById("puntaje2");
    const estado = document.getElementById("estado");

    if (tieBreak || superTieBreak) { p1.innerText = puntos1; p2.innerText = puntos2; return; }

    if (puntos1 >= 3 && puntos2 >= 3) {
        if (puntos1 === puntos2) { p1.innerText = "40"; p2.innerText = "40"; estado.innerText = "DEUCE"; }
        else if (puntos1 === puntos2 + 1) { p1.innerText = "AD"; p2.innerText = "40"; estado.innerText = "Ventaja E1"; }
        else if (puntos2 === puntos1 + 1) { p1.innerText = "40"; p2.innerText = "AD"; estado.innerText = "Ventaja E2"; }
    } else {
        p1.innerText = cambiarPunto(puntos1);
        p2.innerText = cambiarPunto(puntos2);
        estado.innerText = "EN_JUEGO";
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

function cargarDatosPartidoExistente(partidoData) {
    const mapeoPuntos = {"0": 0, "15": 1, "30": 2, "40": 3, "AD": 4};
    if (partidoData.puntosActualesJ1) puntos1 = mapeoPuntos[partidoData.puntosActualesJ1] || 0;
    if (partidoData.puntosActualesJ2) puntos2 = mapeoPuntos[partidoData.puntosActualesJ2] || 0;
    
    set1 = partidoData.setsGanadosJ1 || 0;
    set2 = partidoData.setsGanadosJ2 || 0;
    document.getElementById("setJug1").innerText = set1;
    document.getElementById("setJug2").innerText = set2;

    let setActual = set1 + set2 + 1;
    if (setActual === 1) { game1 = partidoData.gamesSet1J1 || 0; game2 = partidoData.gamesSet1J2 || 0; }
    else if (setActual === 2) { game1 = partidoData.gamesSet2J1 || 0; game2 = partidoData.gamesSet2J2 || 0; }
    else { game1 = partidoData.gamesSet3J1 || 0; game2 = partidoData.gamesSet3J2 || 0; }
    
    document.getElementById("sumarGameJug1").innerText = game1;
    document.getElementById("sumarGameJug2").innerText = game2;

    gamesSet1J1_guardados = partidoData.gamesSet1J1 || 0; gamesSet1J2_guardados = partidoData.gamesSet1J2 || 0;
    gamesSet2J1_guardados = partidoData.gamesSet2J1 || 0; gamesSet2J2_guardados = partidoData.gamesSet2J2 || 0;
    gamesSet3J1_guardados = partidoData.gamesSet3J1 || 0; gamesSet3J2_guardados = partidoData.gamesSet3J2 || 0;

    actualizarPuntajes();
    conectarWS();
}

function cerrarStats() { window.location.href = "panel-juez.html"; }

async function terminarManual(tipo) {
    const matchId = localStorage.getItem('partidoIdEnCurso');
    if (!matchId) return;

    const j1 = document.getElementById('nombreJ1')?.innerText.trim() || "";
    const j2 = document.getElementById('nombreJ2')?.innerText.trim() || "";
    let ganadorElegido = null;

    switch (tipo) {
        case 'Normal':
            if (!confirm("¿Deseas finalizar el partido?")) return;
            document.getElementById("estado").innerText = "FINALIZADO";
            mostrarInterfazStats();
            return;
        case 'W':
            let opW = prompt(`🏆 GANAR POR WALKOVER\n1 - ${j1}\n2 - ${j2}`);
            if (opW === "1") ganadorElegido = j1;
            else if (opW === "2") ganadorElegido = j2;
            else return;
            await guardarYPasarSiguienteRonda(ganadorElegido);
            return;
        case 'R':
            let opR = prompt(`❌ RETIRO\n¿Quién se retira?\n1 - ${j1}\n2 - ${j2}`);
            if (opR === "1") ganadorElegido = j2;
            else if (opR === "2") ganadorElegido = j1;
            else return;
            await guardarYPasarSiguienteRonda(ganadorElegido);
            return;
        case 'Su':
            if (!confirm("¿Deseas suspender el partido?")) return;
            await ejecutarSuspensionBackend(matchId);
            return;
    }
}

async function ejecutarSuspensionBackend(matchId) {
    let setActual = set1 + set2 + 1;
    const payloadSuspension = {
        puntosActualesJ1: document.getElementById("puntaje1")?.innerText || "0",
        puntosActualesJ2: document.getElementById("puntaje2")?.innerText || "0",
        setsGanadosJ1: set1, setsGanadosJ2: set2,
        gamesSet1J1: (setActual === 1) ? game1 : gamesSet1J1_guardados,
        gamesSet1J2: (setActual === 1) ? game2 : gamesSet1J2_guardados,
        gamesSet2J1: (setActual === 2) ? game1 : gamesSet2J2_guardados,
        gamesSet2J2: (setActual === 2) ? game2 : gamesSet2J2_guardados,
        gamesSet3J1: (setActual === 3) ? game1 : gamesSet3J1_guardados,
        gamesSet3J2: (setActual === 3) ? game2 : gamesSet3J2_guardados
    };

    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/suspender`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadSuspension)
        });
        if (response.ok) {
            alert("⏸️ Partido suspendido exitosamente.");
            localStorage.removeItem('partidoIdEnCurso');
            window.location.href = "panel-juez.html";
        }
    } catch (error) { console.error("Error al suspender:", error); }
}
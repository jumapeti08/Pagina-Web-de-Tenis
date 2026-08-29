let stompClient = null;
let partidoSuscritoId = null;
const partidosMap = new Map();

function obtenerNombreJugador(jugador) {
    if (!jugador) return "Por definir";
    if (typeof jugador === "string") return jugador;
    
    return jugador.nombreCompleto || 
           jugador.nombre || 
           jugador.usuario ||         // 👈 Agregado para coincidir con tu entidad Usuario
           jugador.nombreUsuario || 
           jugador.username || 
           (jugador.usuario && typeof jugador.usuario === 'object' ? (jugador.usuario.nombreCompleto || jugador.usuario.nombre || jugador.usuario.usuario) : null) || 
           (jugador.primerNombre && jugador.primerApellido ? `${jugador.primerNombre} ${jugador.primerApellido}` : null) ||
           "Jugador";
}

document.addEventListener("DOMContentLoaded", () => {
    conectarWebSocketVisualizador();
    const urlParams = new URLSearchParams(window.location.search);
    const torneoId = urlParams.get("id");

    if (!torneoId) {
        alert("Torneo no especificado.");
        window.location.href = "dashboard-jugador.html";
        return;
    }

    cargarPartidosDelTorneo(torneoId);
});

function conectarWebSocketVisualizador() {
    const socket = new SockJS('/ws-tenis');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Desactiva los logs excesivos en consola
    stompClient.connect({}, () => {
        console.log("✅ Visualizador WebSocket conectado.");
    });
}

async function cargarPartidosDelTorneo(torneoId) {
    const rondasContainer = document.getElementById("rondas-container");
    rondasContainer.innerHTML = `<p style="color:#aaa;">Cargando partidos...</p>`;

    try {
        const response = await fetch(`/api/usuarios/torneos/${torneoId}/partidos`);
        if (!response.ok) throw new Error("Error al obtener los partidos");

        const data = await response.json(); 
        document.getElementById("nombre-torneo").textContent = `🎾 ${data.nombreTorneo || 'Detalle del Torneo'}`;

        rondasContainer.innerHTML = "";
        partidosMap.clear();

        if (!data.rondas || data.rondas.length === 0) {
            rondasContainer.innerHTML = `<p style="color:#888;">No hay partidos programados para este torneo.</p>`;
            return;
        }

        // 1. ORDENAR LAS RONDAS ASCENDENTEMENTE (Ronda 1, Ronda 2, Ronda 3...)
        const rondasOrdenadas = data.rondas.sort((a, b) => {
            const numA = a.numero ?? a.numeroRonda ?? 0;
            const numB = b.numero ?? b.numeroRonda ?? 0;
            return numA - numB;
        });

        // 2. RENDERIZAR RONDAS Y SUS PARTIDOS
        rondasOrdenadas.forEach(ronda => {
            const rondaDiv = document.createElement("div");
            rondaDiv.className = "ronda-seccion";

            let partidosHTML = `<h3 class="ronda-titulo">${ronda.nombreRonda || 'Ronda ' + (ronda.numero || '')}</h3><div class="partidos-grid">`;

            // Ordenar partidos dentro de la ronda por su ID si vienen desordenados
            const partidosOrdenados = (ronda.partidos || []).sort((a, b) => a.id - b.id);

            partidosOrdenados.forEach(p => {
                partidosMap.set(p.id, p);

                // Soporte para Sencillos y Dobles en las tarjetas
                let textoEnfrentamiento = "";
                if (p.jugador3 || p.jugador4) {
                    // Dobles
                    const j1 = obtenerNombreJugador(p.jugador1);
                    const j2 = obtenerNombreJugador(p.jugador2);
                    const j3 = obtenerNombreJugador(p.jugador3);
                    const j4 = obtenerNombreJugador(p.jugador4);
                    textoEnfrentamiento = `[${j1} / ${j2}] <span style="color:#d4f01e;">vs</span> [${j3} / ${j4}]`;
                } else {
                    // Sencillos
                    const j1 = obtenerNombreJugador(p.jugador1);
                    const j2 = obtenerNombreJugador(p.jugador2);
                    textoEnfrentamiento = `${j1} <span style="color:#d4f01e;">vs</span> ${j2}`;
                }

                partidosHTML += `
                    <div class="partido-card" onclick="seleccionarPartidoPorId(${p.id})">
                        <div id="estado-card-${p.id}" style="font-size:0.8rem; color:#888; margin-bottom:5px;">${p.estado || 'PROGRAMADO'}</div>
                        <div style="color:#fff; font-weight:bold;">${textoEnfrentamiento}</div>
                    </div>
                `;
            });

            partidosHTML += `</div>`;
            rondaDiv.innerHTML = partidosHTML;
            rondasContainer.appendChild(rondaDiv);
        });

    } catch (error) {
        console.error("Error en cargarPartidosDelTorneo:", error);
        rondasContainer.innerHTML = `<p style="color:red;">Error al cargar la información del torneo.</p>`;
    }
}

async function seleccionarPartidoPorId(partidoId) {
    const viewer = document.getElementById("match-viewer");
    if (viewer) {
        viewer.style.display = "block";
        viewer.innerHTML = `<div style="color:#aaa; padding:20px; text-align:center;">Cargando marcador en vivo...</div>`;
        viewer.scrollIntoView({ behavior: 'smooth' });
    }

    try {
        // 🛠️ CORRECCIÓN: Ruta apuntando a /api/torneos/partidos/
        const response = await fetch(`/api/torneos/partidos/${partidoId}`);
        
        let partidoActualizado;
        if (response.ok) {
            partidoActualizado = await response.json();
            partidosMap.set(partidoId, partidoActualizado);
        } else {
            partidoActualizado = partidosMap.get(partidoId);
        }

        if (partidoActualizado) {
            seleccionarPartido(partidoActualizado);
        }
    } catch (error) {
        console.error("⚠️ Error trayendo datos actualizados del partido:", error);
        const partidoLocal = partidosMap.get(partidoId);
        if (partidoLocal) seleccionarPartido(partidoLocal);
    }
}

function seleccionarPartido(partido) {
    const viewer = document.getElementById("match-viewer");
    viewer.style.display = "block";
    viewer.scrollIntoView({ behavior: 'smooth' });

    // 1. Renderiza inmediatamente con los datos EXACTOS del backend
    renderizarVisorPartido(partido);

    // 2. Controlar la suscripción de WebSockets para actualización en vivo
    if (stompClient && stompClient.connected) {
        if (partidoSuscritoId) {
            stompClient.unsubscribe(`sub-${partidoSuscritoId}`);
        }

        if (partido.estado !== "FINALIZADO") {
            partidoSuscritoId = partido.id;
            
            stompClient.subscribe(`/topic/marcador/${partido.id}`, (message) => {
                const data = JSON.parse(message.body);

                if (data.estado === "FINALIZADO") {
                    const urlParams = new URLSearchParams(window.location.search);
                    const torneoId = urlParams.get("id");
                    if (torneoId) cargarPartidosDelTorneo(torneoId);
                } else {
                    actualizarMarcadorEnVivoUI(data);
                }
            }, { id: `sub-${partido.id}` });
        }
    }
}

function generarBarraStat(titulo, val1, val2) {
    const total = Number(val1) + Number(val2);
    const pct1 = total > 0 ? ((val1 / total) * 100).toFixed(0) : 50;
    const pct2 = total > 0 ? ((val2 / total) * 100).toFixed(0) : 50;

    return `
        <div class="stat-row">
            <div class="stat-labels">
                <span>${val1} (${pct1}%)</span>
                <span><strong>${titulo}</strong></span>
                <span>${val2} (${pct2}%)</span>
            </div>
            <div class="bar-track">
                <div class="bar-p1" style="width: ${pct1}%;"></div>
                <div class="bar-p2" style="width: ${pct2}%;"></div>
            </div>
        </div>
    `;
}

function actualizarMarcadorEnVivoUI(data) {
    const p1Elem = document.getElementById("puntos-j1");
    const p2Elem = document.getElementById("puntos-j2");
    const g1Elem = document.getElementById("games-j1");
    const g2Elem = document.getElementById("games-j2");
    const s1Elem = document.getElementById("sets-j1");
    const s2Elem = document.getElementById("sets-j2");
    const estadoElem = document.getElementById("estado-partido-tag");

    // 🛠️ Mapeo flexible de datos entrantes del WS
    const p1 = data.p1 ?? data.puntaje1 ?? "0";
    const p2 = data.p2 ?? data.puntaje2 ?? "0";
    const g1 = data.g1 ?? data.games1 ?? 0;
    const g2 = data.g2 ?? data.games2 ?? 0;
    const s1 = data.s1 ?? data.sets1 ?? 0;
    const s2 = data.s2 ?? data.sets2 ?? 0;

    if (p1Elem) p1Elem.textContent = p1;
    if (p2Elem) p2Elem.textContent = p2;
    if (g1Elem) g1Elem.textContent = g1;
    if (g2Elem) g2Elem.textContent = g2;
    if (s1Elem) s1Elem.textContent = s1;
    if (s2Elem) s2Elem.textContent = s2;

    if (estadoElem && data.estado) {
        estadoElem.textContent = data.estado;
        if (data.estado === "FINALIZADO") {
            estadoElem.style.background = "#28a745";
            estadoElem.style.color = "#fff";
        } else if (data.estado === "EN_JUEGO" || data.estado === "EN JUEGO") {
            estadoElem.style.background = "#d4f01e";
            estadoElem.style.color = "#000";
        }
    }

    const tarjetaEstado = document.getElementById(`estado-card-${data.partidoId}`);
    if (tarjetaEstado && data.estado) {
        tarjetaEstado.textContent = data.estado;
    }
}

function renderizarVisorPartido(partido) {
    const viewer = document.getElementById("match-viewer");

    const nombreJ1 = obtenerNombreJugador(partido.jugador1);
    const nombreJ2 = obtenerNombreJugador(partido.jugador2);

    const rawStats = partido.estadisticas || {};

    const stats = {
        acesJ1: rawStats.acesJ1 ?? rawStats.aces1 ?? 0,
        acesJ2: rawStats.acesJ2 ?? rawStats.aces2 ?? 0,
        winnersJ1: rawStats.winnersJ1 ?? rawStats.winners1 ?? 0,
        winnersJ2: rawStats.winnersJ2 ?? rawStats.winners2 ?? 0,
        erroresJ1: rawStats.erroresJ1 ?? rawStats.erroresNoForzadosJ1 ?? 0,
        erroresJ2: rawStats.erroresJ2 ?? rawStats.erroresNoForzadosJ2 ?? 0,
        doblesFaltasJ1: rawStats.doblesFaltasJ1 ?? rawStats.doblesFaltas1 ?? 0,
        doblesFaltasJ2: rawStats.doblesFaltasJ2 ?? rawStats.doblesFaltas2 ?? 0
    };

    const estado = partido.estado || "PROGRAMADO";
    const esFinalizado = estado === "FINALIZADO";

    const s1 = partido.setsGanadosJ1 ?? partido.setsJ1 ?? 0;
    const s2 = partido.setsGanadosJ2 ?? partido.setsJ2 ?? 0;

    // 1. DEFINICIÓN DE COLORES DEL TAG DE ESTADO (Soluciona el ReferenceError)
    let colorFondo = "#6c757d"; 
    let colorTexto = "#fff";

    if (esFinalizado) {
        colorFondo = "#28a745";
        colorTexto = "#fff";
    } else if (estado === "EN_JUEGO" || estado === "EN JUEGO" || estado === "EN_CURSO") {
        colorFondo = "#d4f01e";
        colorTexto = "#000";
    }

    // 2. Extraer datos de los Sets individuales
    const set1_j1 = partido.gamesSet1J1 ?? 0;
    const set1_j2 = partido.gamesSet1J2 ?? 0;

    const set2_j1 = partido.gamesSet2J1 ?? 0;
    const set2_j2 = partido.gamesSet2J2 ?? 0;

    const set3_j1 = partido.gamesSet3J1 ?? 0;
    const set3_j2 = partido.gamesSet3J2 ?? 0;

    const huboSet3 = (set3_j1 > 0 || set3_j2 > 0);

    // 3. Banner para el Ganador
    let bannerGanador = "";
    if (esFinalizado) {
        let nombreGanador = partido.ganador ? obtenerNombreJugador(partido.ganador) : null;
        
        if (!nombreGanador) {
            if (s1 > s2) nombreGanador = nombreJ1;
            else if (s2 > s1) nombreGanador = nombreJ2;
        }

        if (nombreGanador) {
            bannerGanador = `
                <div style="background: linear-gradient(90deg, #d4f01e, #8ac000); color: #000; padding: 12px 15px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    🏆 GANADOR: ${nombreGanador}
                </div>
            `;
        }
    }

    // 4. Bloque HTML del desglose de los Sets
    let HTMLDesgloseSets = "";
    if (esFinalizado) {
        HTMLDesgloseSets = `
            <div style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; color: #d4f01e; font-weight: bold; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    📊 Parciales del Partido
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- Set 1 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 14px; border-radius: 6px; color: #fff; font-size: 0.9rem;">
                        <span style="color: #aaa; font-weight: bold;">Set 1</span>
                        <span style="font-weight: bold; font-size: 1rem;">${set1_j1} - ${set1_j2}</span>
                    </div>

                    <!-- Set 2 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 14px; border-radius: 6px; color: #fff; font-size: 0.9rem;">
                        <span style="color: #aaa; font-weight: bold;">Set 2</span>
                        <span style="font-weight: bold; font-size: 1rem;">${set2_j1} - ${set2_j2}</span>
                    </div>

                    <!-- Super Tie-Break (Solo si se jugó) -->
                    ${huboSet3 ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(212, 240, 30, 0.1); padding: 8px 14px; border-radius: 6px; border: 1px solid rgba(212, 240, 30, 0.3); color: #fff; font-size: 0.9rem;">
                        <span style="color: #d4f01e; font-weight: bold;">Super Tie-Break</span>
                        <span style="color: #d4f01e; font-weight: bold; font-size: 1.05rem;">${set3_j1} - ${set3_j2}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    let setActual = s1 + s2 + 1;
    let g1 = 0;
    let g2 = 0;

    if (setActual === 1) {
        g1 = set1_j1;
        g2 = set1_j2;
    } else if (setActual === 2) {
        g1 = set2_j1;
        g2 = set2_j2;
    } else {
        g1 = set3_j1;
        g2 = set3_j2;
    }

    const p1 = partido.puntosActualesJ1 ?? partido.puntosJ1 ?? "0";
    const p2 = partido.puntosActualesJ2 ?? partido.puntosJ2 ?? "0";

    // 5. Renderizado final del DOM
    viewer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="margin:0; color:#fff;">
                ${nombreJ1} <span style="color:#d4f01e;">VS</span> ${nombreJ2}
            </h2>
            <span id="estado-partido-tag" style="background:${colorFondo}; color:${colorTexto}; padding:6px 12px; font-weight:bold; border-radius:6px; font-size:0.85rem; text-transform:uppercase;">
                ${estado}
            </span>
        </div>

        ${bannerGanador}

        <div class="vertical-scoreboard">
            <div style="display:flex; justify-content:space-around; color:#aaa; font-size:0.9rem; font-weight:bold; margin-bottom: 10px;">
                <span>${nombreJ1}</span>
                <span>${nombreJ2}</span>
            </div>

            <!-- Sets -->
            <div class="score-row-block">
                <span class="block-label">Sets Ganados</span>
                <div class="block-values highlight">
                    <span id="sets-j1">${s1}</span>
                    <span>:</span>
                    <span id="sets-j2">${s2}</span>
                </div>
            </div>

            <!-- Desglose por Set en partidos finalizados -->
            ${HTMLDesgloseSets}

            <!-- Games en Vivo -->
            <div class="score-row-block" style="${esFinalizado ? 'display:none;' : ''}">
                <span class="block-label">Games (Set ${setActual})</span>
                <div class="block-values">
                    <span id="games-j1">${g1}</span>
                    <span>:</span>
                    <span id="games-j2">${g2}</span>
                </div>
            </div>

            <!-- Puntos Actuales en Vivo -->
            <div class="score-row-block" style="${esFinalizado ? 'display:none;' : ''}">
                <span class="block-label">Puntos Actuales</span>
                <div class="block-values">
                    <span id="puntos-j1">${p1}</span>
                    <span>:</span>
                    <span id="puntos-j2">${p2}</span>
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="stats-section" style="margin-top:20px;">
            <h3 style="color:#fff; margin-bottom:15px;"><i class="fa-solid fa-chart-simple"></i> Estadísticas del Partido</h3>
            ${generarBarraStat("Aces / Serv. Ganadores", stats.acesJ1, stats.acesJ2)}
            ${generarBarraStat("Tiros Ganadores (Winners)", stats.winnersJ1, stats.winnersJ2)}
            ${generarBarraStat("Errores No Forzados", stats.erroresJ1, stats.erroresJ2)}
            ${generarBarraStat("Dobles Faltas", stats.doblesFaltasJ1, stats.doblesFaltasJ2)}
        </div>
    `;
}

function crearTarjetaPartidoHTML(partido) {
    const j1 = obtenerNombreJugador(partido.jugador1);
    const j2 = obtenerNombreJugador(partido.jugador2);

    return `
        <div class="partido-card" onclick="seleccionarPartidoPorId(${partido.id})">
            <div class="partido-header">
                <span id="estado-card-${partido.id}" class="badge-estado ${partido.estado ? partido.estado.toLowerCase() : ''}">
                    ${partido.estado || 'PROGRAMADO'}
                </span>
            </div>
            <div class="partido-body">
                <div>${j1}</div>
                <div>vs</div>
                <div>${j2}</div>
            </div>
        </div>
    `;
}
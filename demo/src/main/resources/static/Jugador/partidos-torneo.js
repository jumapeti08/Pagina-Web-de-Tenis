let stompClient = null;
let partidoSuscritoId = null;
const partidosMap = new Map();

function obtenerNombreJugador(jugador) {
    if (!jugador) return "Por definir";
    if (typeof jugador === "string") return jugador;
    
    return jugador.nombreCompleto || 
           jugador.nombre || 
           jugador.usuario || 
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
    stompClient.debug = null;
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

        const rondasOrdenadas = data.rondas.sort((a, b) => {
            const numA = a.numero ?? a.numeroRonda ?? 0;
            const numB = b.numero ?? b.numeroRonda ?? 0;
            return numA - numB;
        });

        rondasOrdenadas.forEach(ronda => {
            const rondaDiv = document.createElement("div");
            rondaDiv.className = "ronda-seccion";

            let partidosHTML = `<h3 class="ronda-titulo">${ronda.nombreRonda || 'Ronda ' + (ronda.numero || '')}</h3><div class="partidos-grid">`;
            const partidosOrdenados = (ronda.partidos || []).sort((a, b) => a.id - b.id);

            partidosOrdenados.forEach(p => {
                partidosMap.set(p.id, p);

                let textoEnfrentamiento = "";
                if (p.esDobles || p.jugador3 || p.jugador4) {
                    const j1 = obtenerNombreJugador(p.jugador1);
                    const j2 = obtenerNombreJugador(p.jugador2);
                    const j3 = obtenerNombreJugador(p.jugador3);
                    const j4 = obtenerNombreJugador(p.jugador4);
                    textoEnfrentamiento = `[${j1} / ${j2}] <span style="color:#d4f01e;">vs</span> [${j3} / ${j4}]`;
                } else {
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

    renderizarVisorPartido(partido);

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
    console.log("🔍 DATOS COMPLETOS RECIBIDOS:", partido);

    const viewer = document.getElementById("match-viewer");

    // Detección estricta de Dobles
    const tieneJugador3Valido = partido.jugador3 && 
                                (partido.jugador3.id || partido.jugador3.nombre) && 
                                obtenerNombreJugador(partido.jugador3) !== "Por definir";

    const esDobles = partido.esDobles === true || 
                     (partido.modalidad && partido.modalidad.toUpperCase() === "DOBLES") || 
                     tieneJugador3Valido;

    const nombreJ1 = obtenerNombreJugador(partido.jugador1);
    const nombreJ2 = obtenerNombreJugador(partido.jugador2);
    const nombreJ3 = esDobles ? obtenerNombreJugador(partido.jugador3) : "";
    const nombreJ4 = esDobles ? obtenerNombreJugador(partido.jugador4) : "";

    const tituloEnfrentamiento = esDobles 
        ? `[${nombreJ1} / ${nombreJ2}] <span style="color:#d4f01e;">VS</span> [${nombreJ3} / ${nombreJ4}]`
        : `${nombreJ1} <span style="color:#d4f01e;">VS</span> ${nombreJ2}`;

    // Selección de estadísticas basada en la modalidad real
    const rawStats = (esDobles && partido.estadisticasDobles) 
        ? partido.estadisticasDobles 
        : (partido.estadisticas || partido.stats || partido);

    const getStat = (...keys) => {
        for (let key of keys) {
            if (rawStats && rawStats[key] !== undefined && rawStats[key] !== null) {
                return Number(rawStats[key]);
            }
        }
        return 0;
    };

    const estado = partido.estado || "PROGRAMADO";
    const esFinalizado = estado === "FINALIZADO";

    const s1 = partido.setsGanadosJ1 ?? partido.setsJ1 ?? 0;
    const s2 = partido.setsGanadosJ2 ?? partido.setsJ2 ?? 0;

    let colorFondo = "#6c757d"; 
    let colorTexto = "#fff";

    if (esFinalizado) {
        colorFondo = "#28a745";
        colorTexto = "#fff";
    } else if (estado === "EN_JUEGO" || estado === "EN JUEGO" || estado === "EN_CURSO") {
        colorFondo = "#d4f01e";
        colorTexto = "#000";
    }

    const set1_j1 = partido.gamesSet1J1 ?? 0;
    const set1_j2 = partido.gamesSet1J2 ?? 0;
    const set2_j1 = partido.gamesSet2J1 ?? 0;
    const set2_j2 = partido.gamesSet2J2 ?? 0;
    const set3_j1 = partido.gamesSet3J1 ?? 0;
    const set3_j2 = partido.gamesSet3J2 ?? 0;
    const huboSet3 = (set3_j1 > 0 || set3_j2 > 0);

    let bannerGanador = "";
    if (esFinalizado) {
        let nombreGanador = partido.ganador ? obtenerNombreJugador(partido.ganador) : null;
        if (!nombreGanador) {
            if (s1 > s2) nombreGanador = esDobles ? `[${nombreJ1} / ${nombreJ2}]` : nombreJ1;
            else if (s2 > s1) nombreGanador = esDobles ? `[${nombreJ3} / ${nombreJ4}]` : nombreJ2;
        }

        if (nombreGanador) {
            bannerGanador = `
                <div style="background: linear-gradient(90deg, #d4f01e, #8ac000); color: #000; padding: 12px 15px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 20px;">
                    🏆 GANADOR: ${nombreGanador}
                </div>
            `;
        }
    }

    let HTMLDesgloseSets = "";
    if (esFinalizado) {
        HTMLDesgloseSets = `
            <div style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; color: #d4f01e; font-weight: bold; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase;">
                    📊 Parciales del Partido
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; background: rgba(0, 0, 0, 0.2); padding: 8px 14px; border-radius: 6px; color: #fff;">
                        <span style="color: #aaa; font-weight: bold;">Set 1</span>
                        <span style="font-weight: bold;">${set1_j1} - ${set1_j2}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; background: rgba(0, 0, 0, 0.2); padding: 8px 14px; border-radius: 6px; color: #fff;">
                        <span style="color: #aaa; font-weight: bold;">Set 2</span>
                        <span style="font-weight: bold;">${set2_j1} - ${set2_j2}</span>
                    </div>
                    ${huboSet3 ? `
                    <div style="display: flex; justify-content: space-between; background: rgba(212, 240, 30, 0.1); padding: 8px 14px; border-radius: 6px; border: 1px solid rgba(212, 240, 30, 0.3); color: #fff;">
                        <span style="color: #d4f01e; font-weight: bold;">Super Tie-Break</span>
                        <span style="color: #d4f01e; font-weight: bold;">${set3_j1} - ${set3_j2}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    let setActual = s1 + s2 + 1;
    let g1 = setActual === 1 ? set1_j1 : setActual === 2 ? set2_j1 : set3_j1;
    let g2 = setActual === 1 ? set1_j2 : setActual === 2 ? set2_j2 : set3_j2;

    const p1 = partido.puntosActualesJ1 ?? partido.puntosJ1 ?? "0";
    const p2 = partido.puntosActualesJ2 ?? partido.puntosJ2 ?? "0";

    // --- SECCIÓN DE ESTADÍSTICAS ---
    let htmlEstadisticas = "";

    if (!esDobles) {
        // Mapeo adaptado con los nombres provenientes de la API
        const statsSencillos = {
            acesJ1: getStat('acesJ1', 'aceJ1', 'aces_j1'),
            acesJ2: getStat('acesJ2', 'aceJ2', 'aces_j2'),
            winnersJ1: getStat('winnersJ1', 'winnerJ1', 'winners_j1'),
            winnersJ2: getStat('winnersJ2', 'winnerJ2', 'winners_j2'),
            erroresJ1: getStat('erroresNoForzadosJ1', 'erroresJ1', 'errores_j1'),
            erroresJ2: getStat('erroresNoForzadosJ2', 'erroresJ2', 'errores_j2'),
            doblesFaltasJ1: getStat('doblesFaltasJ1', 'dobleFaltaJ1'),
            doblesFaltasJ2: getStat('doblesFaltasJ2', 'dobleFaltaJ2'),
            primerFaltaJ1: getStat('primerFaltaJ1', 'primerServicioFaltaJ1'),
            primerFaltaJ2: getStat('primerFaltaJ2', 'primerServicioFaltaJ2'),
            errorForzadoJ1: getStat('errorForzadoJ1', 'erroresForzadosJ1'),
            errorForzadoJ2: getStat('errorForzadoJ2', 'erroresForzadosJ2')
        };

        htmlEstadisticas = `
            ${generarBarraStat("Aces Directos", statsSencillos.acesJ1, statsSencillos.acesJ2)}
            ${generarBarraStat("Winners", statsSencillos.winnersJ1, statsSencillos.winnersJ2)}
            ${generarBarraStat("Faltas 1er Servicio", statsSencillos.primerFaltaJ1, statsSencillos.primerFaltaJ2)}
            ${generarBarraStat("Errores No Forzados", statsSencillos.erroresJ1, statsSencillos.erroresJ2)}
            ${generarBarraStat("Errores Forzados", statsSencillos.errorForzadoJ1, statsSencillos.errorForzadoJ2)}
            ${generarBarraStat("Dobles Faltas", statsSencillos.doblesFaltasJ1, statsSencillos.doblesFaltasJ2)}
        `;
    } else {
        // Mapeo detallado por jugador coincidiendo con el JSON del backend
        const statsIndividuales = [
            { nombre: nombreJ1, aces: getStat('acesJ1'), winners: getStat('winnersJ1'), primerFalta: getStat('primerFaltaJ1'), errores: getStat('erroresNoForzadosJ1', 'erroresJ1'), errorForzado: getStat('errorForzadoJ1'), doblesFaltas: getStat('doblesFaltasJ1'), pareja: "Pareja 1" },
            { nombre: nombreJ2, aces: getStat('acesJ2'), winners: getStat('winnersJ2'), primerFalta: getStat('primerFaltaJ2'), errores: getStat('erroresNoForzadosJ2', 'erroresJ2'), errorForzado: getStat('errorForzadoJ2'), doblesFaltas: getStat('doblesFaltasJ2'), pareja: "Pareja 1" },
            { nombre: nombreJ3, aces: getStat('acesJ3'), winners: getStat('winnersJ3'), primerFalta: getStat('primerFaltaJ3'), errores: getStat('erroresNoForzadosJ3', 'erroresJ3'), errorForzado: getStat('errorForzadoJ3'), doblesFaltas: getStat('doblesFaltasJ3'), pareja: "Pareja 2" },
            { nombre: nombreJ4, aces: getStat('acesJ4'), winners: getStat('winnersJ4'), primerFalta: getStat('primerFaltaJ4'), errores: getStat('erroresNoForzadosJ4', 'erroresJ4'), errorForzado: getStat('errorForzadoJ4'), doblesFaltas: getStat('doblesFaltasJ4'), pareja: "Pareja 2" }
        ];

        // Totales consolidados
        const p1Aces = statsIndividuales[0].aces + statsIndividuales[1].aces;
        const p2Aces = statsIndividuales[2].aces + statsIndividuales[3].aces;
        
        const p1Winners = statsIndividuales[0].winners + statsIndividuales[1].winners;
        const p2Winners = statsIndividuales[2].winners + statsIndividuales[3].winners;

        const p1PrimerFalta = statsIndividuales[0].primerFalta + statsIndividuales[1].primerFalta;
        const p2PrimerFalta = statsIndividuales[2].primerFalta + statsIndividuales[3].primerFalta;

        const p1Errores = statsIndividuales[0].errores + statsIndividuales[1].errores;
        const p2Errores = statsIndividuales[2].errores + statsIndividuales[3].errores;

        const p1ErrorForzado = statsIndividuales[0].errorForzado + statsIndividuales[1].errorForzado;
        const p2ErrorForzado = statsIndividuales[2].errorForzado + statsIndividuales[3].errorForzado;

        const p1DoblesFaltas = statsIndividuales[0].doblesFaltas + statsIndividuales[1].doblesFaltas;
        const p2DoblesFaltas = statsIndividuales[2].doblesFaltas + statsIndividuales[3].doblesFaltas;

        htmlEstadisticas = `
            <div style="background: rgba(0,0,0,0.25); padding: 15px; border-radius: 12px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="text-align: center; color: #d4f01e; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; margin-bottom: 15px;">
                    🎾 Resumen por Parejas
                </div>
                ${generarBarraStat("Aces Directos", p1Aces, p2Aces)}
                ${generarBarraStat("Winners", p1Winners, p2Winners)}
                ${generarBarraStat("1er Servicio Faltas", p1PrimerFalta, p2PrimerFalta)}
                ${generarBarraStat("Errores No Forzados", p1Errores, p2Errores)}
                ${generarBarraStat("Errores Forzados", p1ErrorForzado, p2ErrorForzado)}
                ${generarBarraStat("Dobles Faltas", p1DoblesFaltas, p2DoblesFaltas)}
            </div>

            <div style="text-align: center; color: #aaa; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">
                👤 Desglose Individual
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                ${statsIndividuales.map((j, idx) => `
                    <div style="background: ${idx < 2 ? 'rgba(212, 240, 30, 0.05)' : 'rgba(52, 152, 219, 0.05)'}; border: 1px solid ${idx < 2 ? 'rgba(212, 240, 30, 0.2)' : 'rgba(52, 152, 219, 0.2)'}; padding: 12px; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;">
                            <span style="font-weight: bold; color: #fff; font-size: 0.95rem;">${j.nombre}</span>
                            <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${idx < 2 ? '#d4f01e' : '#3498db'}; color: #000; font-weight: bold;">
                                ${j.pareja}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; color: #ccc;">
                            <div>🚀 Aces: <strong style="color:#fff;">${j.aces}</strong></div>
                            <div>⭐ Winners: <strong style="color:#fff;">${j.winners}</strong></div>
                            <div>❌ 1er Serv. Falta: <strong style="color:#f39c12;">${j.primerFalta}</strong></div>
                            <div>🚫 Errores N.F.: <strong style="color:#e67e22;">${j.errores}</strong></div>
                            <div>🎯 Errores Forz.: <strong style="color:#3498db;">${j.errorForzado}</strong></div>
                            <div>⚠️ Dobles Faltas: <strong style="color:#e74c3c;">${j.doblesFaltas}</strong></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    viewer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="margin:0; color:#fff; font-size:1.3rem;">
                ${tituloEnfrentamiento}
            </h2>
            <span id="estado-partido-tag" style="background:${colorFondo}; color:${colorTexto}; padding:6px 12px; font-weight:bold; border-radius:6px; font-size:0.85rem; text-transform:uppercase;">
                ${estado}
            </span>
        </div>

        ${bannerGanador}

        <div class="vertical-scoreboard">
            <div style="display:flex; justify-content:space-around; color:#aaa; font-size:0.9rem; font-weight:bold; margin-bottom: 10px;">
                <span>${esDobles ? `[${nombreJ1} / ${nombreJ2}]` : nombreJ1}</span>
                <span>${esDobles ? `[${nombreJ3} / ${nombreJ4}]` : nombreJ2}</span>
            </div>

            <div class="score-row-block">
                <span class="block-label">Sets Ganados</span>
                <div class="block-values highlight">
                    <span id="sets-j1">${s1}</span>
                    <span>:</span>
                    <span id="sets-j2">${s2}</span>
                </div>
            </div>

            ${HTMLDesgloseSets}

            <div class="score-row-block" style="${esFinalizado ? 'display:none;' : ''}">
                <span class="block-label">Games (Set ${setActual})</span>
                <div class="block-values">
                    <span id="games-j1">${g1}</span>
                    <span>:</span>
                    <span id="games-j2">${g2}</span>
                </div>
            </div>

            <div class="score-row-block" style="${esFinalizado ? 'display:none;' : ''}">
                <span class="block-label">Puntos Actuales</span>
                <div class="block-values">
                    <span id="puntos-j1">${p1}</span>
                    <span>:</span>
                    <span id="puntos-j2">${p2}</span>
                </div>
            </div>
        </div>

        <div class="stats-section" style="margin-top:20px;">
            <h3 style="color:#fff; margin-bottom:15px;"><i class="fa-solid fa-chart-simple"></i> Estadísticas del Partido</h3>
            ${htmlEstadisticas}
        </div>
    `;
}
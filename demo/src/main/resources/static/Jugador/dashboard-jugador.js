document.addEventListener("DOMContentLoaded", () => {
    const sessionToken = localStorage.getItem("sessionToken");
    const userRole = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");

    if (!sessionToken || userRole !== "JUGADOR") {
        alert("Acceso no autorizado.");
        window.location.href = "/login.html";
        return;
    }

    const profileName = document.querySelector(".profile-name");
    if (profileName && username) {
        profileName.textContent = username;
    }

    // Carga inicial
    cargarMisEstadisticas();
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    }
}

function seleccionarOpcion(elemento, opcion) {
    document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));
    elemento.classList.add("active");

    const titulo = document.getElementById("seccion-titulo");

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }

    switch (opcion) {
        case "mis-stats":
            if (titulo) titulo.textContent = "Mis Estadísticas";
            cargarMisEstadisticas();
            break;
            
        case "ver-torneos":
            if (titulo) titulo.textContent = "Ver Torneos";
            cargarTorneosAgrupados();
            break;
            
        case "stats-otros":
            if (titulo) titulo.textContent = "Stats de Otros Jugadores";
            renderizarBuscadorJugadores();
            break;

        // NUEVO CASO AGREGADO
        case "datos-personales":
            if (titulo) titulo.textContent = "Datos Personales";
            renderizarFormularioDatosPersonales();
            break;
    }
}

async function cargarMisEstadisticas() {
    const container = document.getElementById("dynamic-container");
    const username = localStorage.getItem("username");

    if (!username) {
        container.innerHTML = `<p style="color: #e74c3c; text-align: center;">Error: Usuario no identificado.</p>`;
        return;
    }

    // Animación de pelota rebotando durante la carga
    container.innerHTML = `
        <div class="tennis-loader">
            <div class="tennis-ball-animated"></div>
            <p>OBTENIENDO ESTADÍSTICAS...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/usuarios/${username}/estadisticas-globales`);
        if (!response.ok) throw new Error("Sin datos");

        const data = await response.json();

        container.innerHTML = `
            <div class="stats-container">
                <div class="hero-summary-grid">
                    <div class="hero-card win">
                        <i class="fa-solid fa-trophy"></i>
                        <div class="hero-title">Victorias</div>
                        <div class="hero-value">${data.partidosGanados}</div>
                    </div>
                    <div class="hero-card loss">
                        <i class="fa-solid fa-circle-xmark"></i>
                        <div class="hero-title">Derrotas</div>
                        <div class="hero-value">${data.partidosPerdidos}</div>
                    </div>
                    <div class="hero-card rate">
                        <i class="fa-solid fa-chart-pie"></i>
                        <div class="hero-title">Efectividad</div>
                        <div class="hero-value">${data.porcentajeVictorias}%</div>
                    </div>
                    <div class="hero-card">
                        <i class="fa-solid fa-hashtag"></i>
                        <div class="hero-title">Jugados</div>
                        <div class="hero-value">${data.partidosJugados}</div>
                    </div>
                </div>

                <div class="section-subtitle">
                    <i class="fa-solid fa-chart-simple"></i> Rendimiento Promedio por Partido
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Aces / Serv. Ganadores</p>
                            <div class="metric-avg">${data.promAces} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalAces}</span>
                        </div>
                        <div class="metric-icon-box">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Dobles Faltas</p>
                            <div class="metric-avg" style="color: #e74c3c;">${data.promDoblesFaltas} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalDoblesFaltas}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(231, 76, 60, 0.15); color: #e74c3c;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Errores No Forzados</p>
                            <div class="metric-avg" style="color: #e67e22;">${data.promErrores} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalErrores}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(230, 126, 34, 0.15); color: #e67e22;">
                            <i class="fa-solid fa-ban"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Tiros Ganadores (Winners)</p>
                            <div class="metric-avg" style="color: #2ecc71;">${data.promWinners} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalWinners}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(46, 204, 113, 0.15); color: #2ecc71;">
                            <i class="fa-solid fa-star"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Puntos en Red</p>
                            <div class="metric-avg" style="color: #3498db;">${data.promPuntosRed} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalPuntosRed}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(52, 152, 219, 0.15); color: #3498db;">
                            <i class="fa-solid fa-border-all"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-info" style="font-size: 35px; color: var(--clay-light); margin-bottom: 10px;"></i>
                <h2>Sin datos de partidos</h2>
                <p>Juega tus primeros partidos para ver aquí tus estadísticas calculadas.</p>
            </div>
        `;
    }
}

function renderizarBuscadorJugadores() {
    const container = document.getElementById("dynamic-container");
    container.innerHTML = `
        <div class="search-section">
            <div class="search-box-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input 
                    type="text" 
                    id="player-search-input" 
                    placeholder="Escribe el nombre del jugador..." 
                    autocomplete="off"
                    oninput="buscarJugadores(this.value)"
                >
                <div id="search-results-dropdown" class="search-results-dropdown"></div>
            </div>
        </div>
        <div id="rival-stats-container">
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-users-viewfinder" style="font-size: 40px; color: var(--clay-light); margin-bottom: 15px;"></i>
                <h2>Buscar Rivales</h2>
                <p>Ingresa el nombre de un jugador arriba para analizar sus métricas.</p>
            </div>
        </div>
    `;
}

// Búsqueda en tiempo real (Autocompletado)
// Búsqueda en tiempo real (Autocompletado)
async function buscarJugadores(query) {
    const dropdown = document.getElementById("search-results-dropdown");
    const term = query.trim();

    if (term.length === 0) {
        dropdown.style.display = "none";
        dropdown.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(`/api/usuarios/buscar?query=${encodeURIComponent(term)}`);
        if (!response.ok) throw new Error("Error en la búsqueda");
        
        const jugadores = await response.json();

        if (jugadores.length === 0) {
            dropdown.innerHTML = `<div class="search-item-empty">No se encontraron jugadores</div>`;
        } else {
            dropdown.innerHTML = jugadores.map(j => `
                <div class="search-item" onclick="seleccionarRival('${j.usuario}', '${j.usuario}')">
                    <i class="fa-solid fa-user"></i>
                    <span>${j.usuario}</span>
                </div>
            `).join('');
        }
        dropdown.style.display = "block";
    } catch (err) {
        dropdown.innerHTML = `<div class="search-item-empty">Error al buscar jugadores</div>`;
        dropdown.style.display = "block";
    }
}

// Carga las estadísticas del jugador seleccionado
async function seleccionarRival(targetUsername, nombreMostrar) {
    const dropdown = document.getElementById("search-results-dropdown");
    const input = document.getElementById("player-search-input");
    const container = document.getElementById("rival-stats-container");

    input.value = nombreMostrar;
    dropdown.style.display = "none";

    container.innerHTML = `
        <div class="tennis-loader">
            <div class="tennis-ball-animated"></div>
            <p>CARGANDO DATOS DE ${nombreMostrar.toUpperCase()}...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/usuarios/${targetUsername}/estadisticas-globales`);
        if (!response.ok) throw new Error("Sin datos");

        const data = await response.json();

        container.innerHTML = `
            <div class="stats-container">
                <div class="hero-summary-grid">
                    <div class="hero-card win">
                        <i class="fa-solid fa-trophy"></i>
                        <div class="hero-title">Victorias</div>
                        <div class="hero-value">${data.partidosGanados}</div>
                    </div>
                    <div class="hero-card loss">
                        <i class="fa-solid fa-circle-xmark"></i>
                        <div class="hero-title">Derrotas</div>
                        <div class="hero-value">${data.partidosPerdidos}</div>
                    </div>
                    <div class="hero-card rate">
                        <i class="fa-solid fa-chart-pie"></i>
                        <div class="hero-title">Efectividad</div>
                        <div class="hero-value">${data.porcentajeVictorias}%</div>
                    </div>
                    <div class="hero-card">
                        <i class="fa-solid fa-hashtag"></i>
                        <div class="hero-title">Jugados</div>
                        <div class="hero-value">${data.partidosJugados}</div>
                    </div>
                </div>

                <div class="section-subtitle">
                    <i class="fa-solid fa-chart-simple"></i> Rendimiento Promedio de ${nombreMostrar}
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Aces / Serv. Ganadores</p>
                            <div class="metric-avg">${data.promAces} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalAces}</span>
                        </div>
                        <div class="metric-icon-box"><i class="fa-solid fa-bolt"></i></div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Dobles Faltas</p>
                            <div class="metric-avg" style="color: #e74c3c;">${data.promDoblesFaltas} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalDoblesFaltas}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(231, 76, 60, 0.15); color: #e74c3c;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Errores No Forzados</p>
                            <div class="metric-avg" style="color: #e67e22;">${data.promErrores} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalErrores}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(230, 126, 34, 0.15); color: #e67e22;">
                            <i class="fa-solid fa-ban"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Tiros Ganadores (Winners)</p>
                            <div class="metric-avg" style="color: #2ecc71;">${data.promWinners} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalWinners}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(46, 204, 113, 0.15); color: #2ecc71;">
                            <i class="fa-solid fa-star"></i>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-info">
                            <p>Puntos en Red</p>
                            <div class="metric-avg" style="color: #3498db;">${data.promPuntosRed} <small>/partido</small></div>
                            <span class="metric-total-badge">Total: ${data.totalPuntosRed}</span>
                        </div>
                        <div class="metric-icon-box" style="background: rgba(52, 152, 219, 0.15); color: #3498db;">
                            <i class="fa-solid fa-border-all"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-info" style="font-size: 35px; color: var(--clay-light); margin-bottom: 10px;"></i>
                <h2>Sin registros</h2>
                <p>Este jugador aún no tiene datos de partidos registrados.</p>
            </div>
        `;
    }
}


let torneosFinalizadosCache = [];
document.getElementById("filtro-modalidad")?.addEventListener("change", cargarTorneosFinalizados);
document.getElementById("filtro-categoria")?.addEventListener("change", cargarTorneosFinalizados);

async function cargarTorneosFinalizados() {
    const container = document.getElementById("torneos-finalizados-list");
    if (!container) return;

    // Obtener los valores seleccionados en los selectores/filtros del HTML
    const modalidadSel = document.getElementById("filtro-modalidad")?.value || "SENCILLOS";
    const categoriaSel = document.getElementById("filtro-categoria")?.value || "TODAS";

    container.innerHTML = `<p style="text-align:center; color:#aaa;">Buscando torneos...</p>`;

    try {
        // Enviar modalidad y categoría como Query Parameters
        const response = await fetch(`/api/usuarios/torneos/finalizados?modalidad=${modalidadSel}&categoria=${categoriaSel}`);
        
        if (!response.ok) {
            throw new Error(`Error en servidor: ${response.status}`);
        }

        const torneos = await response.json();

        container.innerHTML = ""; // Limpiar mensaje de carga

        if (torneos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #888;">
                    <p>No se encontraron torneos finalizados que cumplan con los filtros seleccionados.</p>
                </div>`;
            return;
        }

        // Dibujar los torneos encontrados
        torneos.forEach(torneo => {
            const card = document.createElement('div');
            card.className = 'tournament-card';
            card.innerHTML = `
                <h3>🎾 ${torneo.nombre} <span style="font-size: 0.9rem; color: #d4f01e;">[${torneo.clasificacion || ''}]</span></h3>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #ccc;">
                    Modalidad: <strong>${torneo.categoria}</strong> | Estado: <strong>${torneo.estado}</strong>
                </p>
                <div id="matches-${torneo.id}" class="match-list" onclick="event.stopPropagation()"></div>
            `;
            
            // Permite desplegar o cargar partidos al hacer clic en la tarjeta
            card.onclick = () => cargarPartidos(torneo.id);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error al obtener torneos finalizados:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: red;">
                <p>Ocurrió un error al cargar los torneos. Por favor intenta de nuevo.</p>
            </div>`;
    }
}


// Función auxiliar para realizar la petición HTTP y pintar las tarjetas
async function cargarTorneosAgrupados() {
    const mainContainer = document.getElementById("dynamic-container");
    if (!mainContainer) return;

    // Renderizamos la estructura de filtros con la lista completa de categorías
    mainContainer.innerHTML = `
        <div class="filters-wrapper" style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Modalidad:</label>
                <select id="filtro-modalidad" style="padding: 8px 12px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #444; border-radius: 6px;">
                    <option value="SENCILLOS">Sencillos</option>
                    <option value="DOBLES">Dobles</option>
                </select>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.85rem; color: var(--text-muted, #aaa);">Categoría / Nivel:</label>
                <select id="filtro-categoria" style="padding: 8px 12px; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid #444; border-radius: 6px;">
                    <option value="TODAS">Todas las categorías</option>
                    <option value="FUTURO_50">Futuro 50</option>
                    <option value="FUTURO_100">Futuro 100</option>
                    <option value="FUTURO_250">Futuro 250</option>
                    <option value="FUTURO_500">Futuro 500</option>
                    <option value="MASTER_1000">Master 1000</option>
                </select>
            </div>
        </div>

        <div id="torneos-clasificados-list">
            <p style="text-align:center; color:#aaa;">Cargando torneos...</p>
        </div>
    `;

    // Escuchar eventos de cambio en los selectores dinámicos
    document.getElementById("filtro-modalidad")?.addEventListener("change", obtenerYRenderizarTorneos);
    document.getElementById("filtro-categoria")?.addEventListener("change", obtenerYRenderizarTorneos);

    // Cargar la lista inicial
    await obtenerYRenderizarTorneos();
}

async function obtenerYRenderizarTorneos() {
    const listContainer = document.getElementById("torneos-clasificados-list");
    if (!listContainer) return;

    const modalidadSel = document.getElementById("filtro-modalidad")?.value || "SENCILLOS";
    const categoriaSel = document.getElementById("filtro-categoria")?.value || "TODAS";

    listContainer.innerHTML = `
        <div class="tennis-loader">
            <div class="tennis-ball-animated"></div>
            <p>BUSCANDO TORNEOS...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/usuarios/torneos/clasificados?modalidad=${modalidadSel}&categoria=${categoriaSel}`);
        if (!response.ok) throw new Error("Error en el servidor al consultar torneos");

        const torneos = await response.json();
        listContainer.innerHTML = "";

        if (torneos.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted, #888);">
                    <i class="fa-solid fa-trophy" style="font-size: 35px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>No se encontraron torneos para los filtros seleccionados.</p>
                </div>`;
            return;
        }

        // Agrupar localmente por estado según los registros de la DB
        const programados = torneos.filter(t => t.estado === 'SIN_JUGAR' || t.estado === 'PROGRAMADO');
        const enCurso = torneos.filter(t => t.estado === 'EN_CURSO');
        const finalizados = torneos.filter(t => t.estado === 'FINALIZADO');

        // Pintar cada bloque dinámicamente si tiene elementos
        renderizarSeccionTorneos(listContainer, "📅 Torneos Programados", programados);
        renderizarSeccionTorneos(listContainer, "🎾 Torneos En Curso", enCurso);
        renderizarSeccionTorneos(listContainer, "🏆 Torneos Finalizados", finalizados);

    } catch (error) {
        console.error("Error al obtener torneos:", error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <p>Ocurrió un error al cargar los torneos. Revisa la conexión con el servidor.</p>
            </div>`;
    }
}

// Función auxiliar para dibujar cada bloque con su título de estado
function renderizarSeccionTorneos(container, titulo, lista) {
    if (lista.length === 0) return;

    const seccion = document.createElement('div');
    seccion.style.marginBottom = "25px";

    let html = `<h3 style="color: #d4f01e; border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">${titulo} (${lista.length})</h3>`;
    
    lista.forEach(torneo => {
        // Redirección al HTML de detalle del torneo enviando el ID
        html += `
            <div class="tournament-card" onclick="window.location.href='partidos-torneo.html?id=${torneo.id}'" style="margin-bottom: 10px; cursor: pointer;">
                <h4 style="margin: 0; color: #fff;">🎾 ${torneo.nombre} <span style="font-size: 0.85rem; color: #aaa;">[${torneo.clasificacion || ''}]</span></h4>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #ccc;">
                    Modalidad: <strong>${torneo.categoria}</strong> | Estado: <strong>${torneo.estado}</strong>
                </p>
            </div>
        `;
    });

    seccion.innerHTML = html;
    container.appendChild(seccion);
}

function aplicarFiltrosTorneosFinalizados() {
    const modalidadSel = document.getElementById("filtro-clasificacion")?.value; // "SENCILLOS" o "DOBLES"
    const categoriaSel = document.getElementById("filtro-categoria")?.value;     // "TODAS", "FUTURO_50", etc.
    const container = document.getElementById("torneos-finalizados-list");

    if (!container) return;

    // Filtrado local según los atributos de tus objetos Torneo
    const filtrados = torneosFinalizadosCache.filter(torneo => {
        // Normalizamos a mayúsculas para evitar diferencias de casing
        const modalidadMatch = !modalidadSel || 
            (torneo.categoria && torneo.categoria.toUpperCase() === modalidadSel.toUpperCase());

        const categoriaMatch = !categoriaSel || categoriaSel === "TODAS" || 
            (torneo.clasificacion && torneo.clasificacion.toUpperCase().replace(/\s+/g, '_') === categoriaSel.toUpperCase());

        return modalidadMatch && categoriaMatch;
    });

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <p>No se encontraron torneos finalizados para los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    renderizarTarjetasTorneos(container, filtrados);
}

function aplicarFiltrosTorneosFinalizados() {
    cargarTorneosFinalizados();
}

function renderizarPartidoEnVivo(partidoData) {
    const container = document.getElementById("dynamic-container");

    container.innerHTML = `
        <div class="live-match-wrapper">
            <button class="btn-back" onclick="renderizarSeccionTorneos()">
                <i class="fa-solid fa-arrow-left"></i> Volver a torneos
            </button>

            <div class="scoreboard-card">
                <div class="live-header">
                    <span class="live-badge"><span class="pulse-dot"></span> EN VIVO</span>
                    <span class="match-tournament">${partidoData.nombreTorneo} - ${partidoData.ronda}</span>
                </div>

                <table class="scoreboard-table">
                    <thead>
                        <tr>
                            <th class="col-player">Jugador</th>
                            <th class="col-score">Sets</th>
                            <th class="col-score">Games</th>
                            <th class="col-score highlight">Puntos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="player-row">
                            <td class="player-name">${partidoData.jugador1}</td>
                            <td class="col-score" id="j1-sets">0</td>
                            <td class="col-score" id="j1-games">0</td>
                            <td class="col-score highlight" id="j1-points">0</td>
                        </tr>
                        <tr class="player-row">
                            <td class="player-name">${partidoData.jugador2}</td>
                            <td class="col-score" id="j2-sets">0</td>
                            <td class="col-score" id="j2-games">0</td>
                            <td class="col-score highlight" id="j2-points">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderizarEstadisticasFinales(partidoData, stats) {
    const container = document.getElementById("dynamic-container");

    container.innerHTML = `
        <div class="match-recap-wrapper">
            <button class="btn-back" onclick="renderizarSeccionTorneos()">
                <i class="fa-solid fa-arrow-left"></i> Volver
            </button>

            <!-- Marcador Final -->
            <div class="final-score-header">
                <h3>Resultado Final</h3>
                <div class="players-vs-card">
                    <span class="p-name ${stats.ganador === 1 ? 'winner' : ''}">${partidoData.jugador1}</span>
                    <span class="final-sets">${partidoData.setsJ1} - ${partidoData.setsJ2}</span>
                    <span class="p-name ${stats.ganador === 2 ? 'winner' : ''}">${partidoData.jugador2}</span>
                </div>
            </div>

            <!-- Contenedor de Barras Estadísticas -->
            <div class="stats-comparison-card">
                <h4><i class="fa-solid fa-chart-simple"></i> Estadísticas del Partido</h4>
                
                ${generarBarraComparativa("Aces / Serv. Ganadores", stats.acesJ1, stats.acesJ2)}
                ${generarBarraComparativa("Errores No Forzados", stats.erroresJ1, stats.erroresJ2)}
                ${generarBarraComparativa("Tiros Ganadores (Winners)", stats.winnersJ1, stats.winnersJ2)}
                ${generarBarraComparativa("Puntos en Red", stats.redJ1, stats.redJ2)}
                ${generarBarraComparativa("Dobles Faltas", stats.doblesFaltasJ1, stats.doblesFaltasJ2)}
            </div>
        </div>
    `;
}

// Función auxiliar para calcular porcentajes y crear el HTML de cada barra
function generarBarraComparativa(titulo, val1, val2) {
    const total = val1 + val2;
    const pct1 = total > 0 ? ((val1 / total) * 100).toFixed(1) : 50;
    const pct2 = total > 0 ? ((val2 / total) * 100).toFixed(1) : 50;

    return `
        <div class="stat-row">
            <div class="stat-info">
                <span class="val-p1">${val1} (${pct1}%)</span>
                <span class="stat-title">${titulo}</span>
                <span class="val-p2">${val2} (${pct2}%)</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill-p1" style="width: ${pct1}%;"></div>
                <div class="bar-fill-p2" style="width: ${pct2}%;"></div>
            </div>
        </div>
    `;
}

// Renderiza la vista de actualización de perfil
async function renderizarFormularioDatosPersonales() {
    const container = document.getElementById("dynamic-container");
    const usernameActual = localStorage.getItem("username") || "";

    container.innerHTML = `
        <div class="profile-settings-card" style="max-width: 600px; margin: 0 auto; background: rgba(0,0,0,0.2); padding: 25px; border-radius: 10px; border: 1px solid #444;">
            <h2 style="color: #fff; margin-bottom: 20px; font-size: 1.4rem;">
                <i class="fa-solid fa-user-pen" style="color: #d4f01e; margin-right: 10px;"></i>Editar Información Personal
            </h2>
            
            <form id="form-datos-personales" onsubmit="guardarDatosPersonales(event)" style="display: flex; flex-direction: column; gap: 18px;">
                
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="color: #ccc; font-size: 0.9rem;">Nombre de Usuario / Acceso:</label>
                    <input type="text" id="edit-username" value="${usernameActual}" required
                        style="padding: 10px; background: #222; border: 1px solid #555; color: #fff; border-radius: 5px; font-size: 1rem;">
                </div>

                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="color: #ccc; font-size: 0.9rem;">Correo Electrónico:</label>
                    <input type="email" id="edit-email" placeholder="ejemplo@correo.com" required
                        style="padding: 10px; background: #222; border: 1px solid #555; color: #fff; border-radius: 5px; font-size: 1rem;">
                </div>

                <hr style="border: 0; border-top: 1px solid #444; margin: 10px 0;">

                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="color: #ccc; font-size: 0.9rem;">Nueva Contraseña (opcional):</label>
                    <input type="password" id="edit-password" placeholder="Dejar en blanco si no se desea cambiar"
                        style="padding: 10px; background: #222; border: 1px solid #555; color: #fff; border-radius: 5px; font-size: 1rem;">
                </div>

                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="color: #ccc; font-size: 0.9rem;">Confirmar Nueva Contraseña:</label>
                    <input type="password" id="edit-confirm-password" placeholder="Repite la nueva contraseña"
                        style="padding: 10px; background: #222; border: 1px solid #555; color: #fff; border-radius: 5px; font-size: 1rem;">
                </div>

                <div id="msg-feedback" style="display: none; padding: 10px; border-radius: 5px; text-align: center; font-size: 0.9rem;"></div>

                <button type="submit" style="padding: 12px; background: #d4f01e; color: #111; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; margin-top: 10px;">
                    <i class="fa-solid fa-floppy-disk"></i> Guardar Cambios
                </button>
            </form>
        </div>
    `;

    // Cargar datos actuales desde la API backend
    try {
        const response = await fetch(`/api/usuarios/${usernameActual}`);
        if (response.ok) {
            const usuario = await response.json();
            if (usuario.email) {
                document.getElementById("edit-email").value = usuario.email;
            }
        }
    } catch (err) {
        console.warn("No se pudieron pre-cargar los datos adicionales del usuario.", err);
    }
}

// Envía la solicitud de cambio al servidor backend
async function guardarDatosPersonales(event) {
    event.preventDefault();

    const usernameActual = localStorage.getItem("username");
    const nuevoUsername = document.getElementById("edit-username").value.trim();
    const nuevoEmail = document.getElementById("edit-email").value.trim();
    const nuevaPassword = document.getElementById("edit-password").value;
    const confirmarPassword = document.getElementById("edit-confirm-password").value;
    const msgBox = document.getElementById("msg-feedback");

    // Validación local de coincidencia de contraseña
    if (nuevaPassword !== "" && nuevaPassword !== confirmarPassword) {
        mostrarMensajeFeedback(msgBox, "Las contraseñas no coinciden.", "error");
        return;
    }

    const payload = {
        usuarioActual: usernameActual,
        nuevoUsuario: nuevoUsername,
        email: nuevoEmail,
        password: nuevaPassword !== "" ? nuevaPassword : null
    };

    try {
        const response = await fetch(`/api/usuarios/${usernameActual}/actualizar-perfil`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("sessionToken")}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || "Error al actualizar perfil.");
        }

        // Actualización exitosa
        localStorage.setItem("username", nuevoUsername);
        
        const profileName = document.querySelector(".profile-name");
        if (profileName) profileName.textContent = nuevoUsername;

        mostrarMensajeFeedback(msgBox, "¡Datos actualizados correctamente!", "exito");
        
        // Limpiar campos de contraseña
        document.getElementById("edit-password").value = "";
        document.getElementById("edit-confirm-password").value = "";

    } catch (err) {
        mostrarMensajeFeedback(msgBox, err.message, "error");
    }
}

function mostrarMensajeFeedback(elemento, mensaje, tipo) {
    elemento.style.display = "block";
    elemento.textContent = mensaje;
    if (tipo === "exito") {
        elemento.style.background = "rgba(46, 204, 113, 0.2)";
        elemento.style.color = "#2ecc71";
        elemento.style.border = "1px solid #2ecc71";
    } else {
        elemento.style.background = "rgba(231, 76, 60, 0.2)";
        elemento.style.color = "#e74c3c";
        elemento.style.border = "1px solid #e74c3c";
    }
}

// Cerrar sesión
document.addEventListener("click", (e) => {
    if (e.target.closest(".logout-btn")) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "/login.html";
    }
});
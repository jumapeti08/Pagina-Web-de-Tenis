let todosLosTorneos = []; // Almacena temporalmente la respuesta de la API

document.addEventListener('DOMContentLoaded', obtenerTodosLosTorneos);

// 1. Carga inicial de datos desde la API
async function obtenerTodosLosTorneos() {
    const container = document.getElementById('listaTorneos');
    try {
        const response = await fetch('/api/torneos');
        todosLosTorneos = await response.json();

        if (todosLosTorneos.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">No hay torneos activos en este momento.</p>';
            return;
        }
        
        // Inicialmente mostramos un mensaje invitando a filtrar
        container.innerHTML = '<p style="text-align:center; color:#aaa; font-style: italic;">Por favor, selecciona una modalidad y clasificación arriba para ver los torneos correspondientes.</p>';

    } catch (error) {
        console.error("Error cargando torneos de la API:", error);
        container.innerHTML = '<p style="text-align:center; color:red;">Error de conexión al cargar los torneos.</p>';
    }
}

// 2. Evento cuando cambia el filtro 1 (Modalidad)
function actualizarFiltroModalidad() {
    const categoriaSeleccionada = document.getElementById('filtroCategoria').value;
    const selectClasificacion = document.getElementById('filtroClasificacion');
    
    // Limpiar selector de clasificación y habilitar
    selectClasificacion.innerHTML = '<option value="" selected disabled>-- Selecciona Clasificación --</option>';
    selectClasificacion.disabled = false;

    // Extraer clasificaciones unívocas que pertenezcan a la modalidad seleccionada
    const clasificacionesDisponibles = new Set();
    todosLosTorneos.forEach(torneo => {
        if (torneo.categoria === categoriaSeleccionada && torneo.clasificacion) {
            clasificacionesDisponibles.add(torneo.clasificacion);
        }
    });

    // Rellenar selector de clasificaciones encontradas
    if (clasificacionesDisponibles.size === 0) {
        selectClasificacion.innerHTML += '<option value="" disabled>No hay clasificaciones disponibles</option>';
    } else {
        clasificacionesDisponibles.forEach(clasif => {
            selectClasificacion.innerHTML += `<option value="${clasif}">${clasif}</option>`;
        });
    }

    // Limpiamos los resultados mostrados abajo hasta que se elija el segundo filtro
    document.getElementById('listaTorneos').innerHTML = '<p style="text-align:center; color:#aaa; font-style: italic;">Ahora, selecciona la clasificación del torneo.</p>';
}

// 3. Evento cuando cambia el filtro 2 (Clasificación) -> Muestra los torneos
function aplicarFiltroFinal() {
    const categoriaSel = document.getElementById('filtroCategoria').value;
    const clasificacionSel = document.getElementById('filtroClasificacion').value;
    const container = document.getElementById('listaTorneos');

    // Filtrar la lista local de torneos
    const torneosFiltrados = todosLosTorneos.filter(torneo => 
        torneo.categoria === categoriaSel && torneo.clasificacion === clasificacionSel
    );

    container.innerHTML = ""; // Limpiar panel

    if (torneosFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">No se encontraron torneos que cumplan con los filtros seleccionados.</p>';
        return;
    }

    // Renderizar tarjetas de torneos filtrados
    torneosFiltrados.forEach(torneo => {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.innerHTML = `
            <h3>🎾 ${torneo.nombre} <span style="font-size: 0.9rem; color: #d4f01e;">[${torneo.clasificacion}]</span></h3>
            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #ccc;">Modalidad: <strong>${torneo.categoria}</strong> | Estado: <strong>${torneo.estado}</strong></p>
            <div id="matches-${torneo.id}" class="match-list" onclick="event.stopPropagation()"></div>
        `;
        card.onclick = () => cargarPartidos(torneo.id);
        container.appendChild(card);
    });
}

// 4. Renderizado dinámico de partidos (Idéntico a tu lógica actual)
async function cargarPartidos(torneoId) {
    const matchContainer = document.getElementById(`matches-${torneoId}`);
    
    if (matchContainer.innerHTML !== "") { 
        matchContainer.innerHTML = ""; 
        return; 
    }

    try {
        const response = await fetch(`/api/torneos/${torneoId}`);
        const torneo = await response.json();

        let htmlContenido = "";

        torneo.rondas.forEach(ronda => {
            htmlContenido += `<h4 style="color: #d4f01e; margin: 15px 0 5px 0; font-size: 0.9rem;">${ronda.nombreRonda}</h4>`;
            
            ronda.partidos.forEach(partido => {
                let nombres = "";

                if (torneo.categoria === 'Dobles') {
                    const j1 = partido.jugador1 ? partido.jugador1.usuario : "BYE";
                    const j2 = partido.jugador2 ? partido.jugador2.usuario : "BYE";
                    const j3 = partido.jugador3 ? partido.jugador3.usuario : "BYE";
                    const j4 = partido.jugador4 ? partido.jugador4.usuario : "BYE";
                    nombres = `👥 [${j1} / ${j2}] vs [${j3} / ${j4}]`;
                } else {
                    const j1 = partido.jugador1 ? partido.jugador1.usuario : "BYE";
                    const j2 = partido.jugador2 ? partido.jugador2.usuario : "BYE";
                    nombres = `👤 ${j1} vs ${j2}`;
                }

                const estadoTexto = partido.estado || 'PROGRAMADO';

                htmlContenido += `
                    <div class="match-item">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.95rem; font-weight: 500;">${nombres}</span>
                            <small style="color: #aaa; font-size: 0.75rem; margin-top: 2px;">Estado: ${estadoTexto}</small>
                        </div>
                        <button class="btn-arbitrar" onclick="event.stopPropagation(); verificarYEntrar(${partido.id})">
                            Arbitrar
                        </button>
                    </div>`;
            });
        });

        matchContainer.innerHTML = htmlContenido;

    } catch (error) {
        console.error("Error cargando partidos:", error);
        matchContainer.innerHTML = `<p style="color:red; font-size:0.85rem;">Error al cargar los partidos.</p>`;
    }
}

// 5. Interceptor de seguridad al marcador
async function verificarYEntrar(matchId, categoria) {
    try {
        const response = await fetch(`/api/torneos/partidos/${matchId}/verificar-arbitraje`);
        
        if (!response.ok) {
            alert("No se pudo verificar el estado del partido con el servidor.");
            return;
        }

        const data = await response.json();

        if (data.permitido) {
            // 🔥 Agregamos la categoría como parámetro en la redirección URL
            window.location.href = `index.html?matchId=${matchId}&categoria=${encodeURIComponent(categoria)}`;
        } else {
            alert(`⚠️ Acceso denegado:\n${data.mensaje}`);
        }
    } catch (error) {
        console.error("Error en la verificación de arbitraje:", error);
        alert("Error de red. No se pudo comprobar si el partido está disponible.");
    }
}
let listaTorneosCompletos = [];
let torneoActual = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarTorneosGrid();
});

// GET: Obtener los torneos y armar el Grid de tarjetas
async function cargarTorneosGrid() {
    try {
        const response = await fetch('/api/torneos');
        listaTorneosCompletos = await response.json();
        const contenedor = document.getElementById('contenedorTorneos');
        
        contenedor.innerHTML = "";
        
        if (listaTorneosCompletos.length === 0) {
            contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#666;">No hay torneos creados en el sistema.</p>`;
            return;
        }

        listaTorneosCompletos.forEach(t => {
            contenedor.innerHTML += `
                <div class="torneo-card" id="card-${t.id}" onclick="seleccionarTorneo(${t.id})">
                    <h3>🎾 ${t.nombre}</h3>
                    <span class="badge badge-cat">${t.categoria}</span>
                    <span class="badge badge-status">${t.estado}</span>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar la grilla de torneos:", error);
    }
}

// Acción disparada al hacer CLICK en una tarjeta
function seleccionarTorneo(id) {
    document.querySelectorAll('.torneo-card').forEach(card => card.classList.remove('selected'));
    
    const tarjetaElegida = document.getElementById(`card-${id}`);
    if (tarjetaElegida) tarjetaElegida.classList.add('selected');

    torneoActual = listaTorneosCompletos.find(t => t.id === id);
    if (!torneoActual) return;

    document.getElementById('editNombre').value = torneoActual.nombre;
    document.getElementById('editEstado').value = torneoActual.estado;
    document.getElementById('editClasificacion').value = torneoActual.clasificacion || "Futuro 50";

    const contenedorLlaves = document.getElementById('contenedorLlavesEdicion');
    contenedorLlaves.innerHTML = "";

    if (!torneoActual.rondas || torneoActual.rondas.length === 0) {
        contenedorLlaves.innerHTML = "<p>Este torneo no cuenta con una estructura de partidos inicializada.</p>";
        return;
    }

    // Ordenar las rondas numéricamente para mostrarlas en orden (Ronda 1, Ronda 2... Final)
    const rondasOrdenadas = [...torneoActual.rondas].sort((a, b) => {
        const numA = a.numero || a.numeroRonda || 0;
        const numB = b.numero || b.numeroRonda || 0;
        return numA - numB;
    });

    rondasOrdenadas.forEach(ronda => {
        const rNum = ronda.numero || ronda.numeroRonda;
        const rNombre = ronda.nombreRonda || `Ronda ${rNum}`;
        
        // Creamos un contenedor o cabecera visual para cada ronda
        contenedorLlaves.innerHTML += `
            <div class="ronda-header" style="margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid var(--clay-orange); padding-bottom: 5px;">
                <h4 style="color: var(--clay-orange); margin: 0; text-transform: uppercase; font-size: 1.1rem;">📅 ${rNombre}</h4>
            </div>
        `;

        if (!ronda.partidos || ronda.partidos.length === 0) {
            contenedorLlaves.innerHTML += `<p style="color: #666; font-style: italic; margin-left: 15px;">No hay partidos definidos para esta ronda.</p>`;
            return;
        }

        ronda.partidos.forEach((partido, index) => {
            const pNum = index + 1;
            const estadoActual = partido.estado || "PROGRAMADO";

            // Selector HTML único para el estado del partido (basado en ronda y partido)
            const selectEstadoHtml = `
                <select id="input_r${rNum}_p${pNum}_estado" class="select-partido-estado" style="margin-left: 10px; padding: 4px; width: auto;">
                    <option value="PROGRAMADO" ${estadoActual === 'PROGRAMADO' ? 'selected' : ''}>PROGRAMADO</option>
                    <option value="EN_CURSO" ${estadoActual === 'EN_CURSO' ? 'selected' : ''}>EN_CURSO</option>
                    <option value="FINALIZADO" ${estadoActual === 'FINALIZADO' ? 'selected' : ''}>FINALIZADO</option>
                    <option value="SUSPENDIDO" ${estadoActual === 'SUSPENDIDO' ? 'selected' : ''}>SUSPENDIDO</option>
                </select>
            `;

            if (torneoActual.categoria === 'Dobles') {
                const j1 = partido.jugador1 ? partido.jugador1.usuario : "BYE";
                const j2 = partido.jugador2 ? partido.jugador2.usuario : "BYE";
                const j3 = partido.jugador3 ? partido.jugador3.usuario : "BYE";
                const j4 = partido.jugador4 ? partido.jugador4.usuario : "BYE";

                contenedorLlaves.innerHTML += `
                    <div class="llave-item">
                        <span style="color:#aaa; font-weight:bold; min-width:80px;">Mesa ${pNum}</span>
                        <div class="player-pair">
                            <input type="text" id="input_r${rNum}_p${pNum}_j1" value="${j1}" placeholder="Pareja 1 - Jugador A">
                            <input type="text" id="input_r${rNum}_p${pNum}_j2" value="${j2}" placeholder="Pareja 1 - Jugador B">
                        </div>
                        <span class="vs">VS</span>
                        <div class="player-pair">
                            <input type="text" id="input_r${rNum}_p${pNum}_j3" value="${j3}" placeholder="Pareja 2 - Jugador A">
                            <input type="text" id="input_r${rNum}_p${pNum}_j4" value="${j4}" placeholder="Pareja 2 - Jugador B">
                        </div>
                        ${selectEstadoHtml}
                    </div>`;
            } else {
                const j1 = partido.jugador1 ? partido.jugador1.usuario : "BYE";
                const j2 = partido.jugador2 ? partido.jugador2.usuario : "BYE";

                contenedorLlaves.innerHTML += `
                    <div class="llave-item">
                        <span style="color:#aaa; font-weight:bold; min-width:80px;">Llave ${pNum}</span>
                        <input type="text" id="input_r${rNum}_p${pNum}_j1" value="${j1}" placeholder="Jugador 1">
                        <span class="vs">VS</span>
                        <input type="text" id="input_r${rNum}_p${pNum}_j2" value="${j2}" placeholder="Jugador 2">
                        ${selectEstadoHtml}
                    </div>`;
            }
        });
    });

    document.getElementById('seccionEditor').style.display = 'block';
    document.getElementById('seccionEditor').scrollIntoView({ behavior: 'smooth' });
}

// PUT: Guardar los cambios en todas las rondas
async function actualizarTorneo() {
    if (!torneoActual) return;

    // Recorremos y recolectamos la información de cada ronda y cada partido de la interfaz
    torneoActual.rondas.forEach(ronda => {
        const rNum = ronda.numero || ronda.numeroRonda;
        
        if (ronda.partidos) {
            ronda.partidos.forEach((partido, index) => {
                const pNum = index + 1;
                
                // Capturamos el estado de este partido específico
                partido.estado = document.getElementById(`input_r${rNum}_p${pNum}_estado`).value;

                if (torneoActual.categoria === 'Dobles') {
                    partido.pareja1 = {
                        jugador1: { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j1`).value.trim() },
                        jugador2: { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j2`).value.trim() }
                    };
                    partido.pareja2 = {
                        jugador1: { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j3`).value.trim() },
                        jugador2: { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j4`).value.trim() }
                    };
                } else {
                    partido.jugador1 = { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j1`).value.trim() };
                    partido.jugador2 = { nombre: document.getElementById(`input_r${rNum}_p${pNum}_j2`).value.trim() };
                }
            });
        }
    });

    const payload = {
        nombre: document.getElementById('editNombre').value.trim(),
        estado: document.getElementById('editEstado').value,
        clasificacion: document.getElementById('editClasificacion').value,
        rondas: torneoActual.rondas
    };

    try {
        const response = await fetch(`/api/torneos/${torneoActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("¡Todas las rondas y estados de partidos se han actualizado con éxito!");
            cargarTorneosGrid();
            document.getElementById('seccionEditor').style.display = 'none';
        } else {
            const err = await response.text();
            alert("Error en la validación: " + err);
        }
    } catch (error) {
        alert("Ocurrió un error al contactar al servidor.");
    }
}

// DELETE: Eliminar el torneo por completo
async function eliminarTorneo() {
    if (!torneoActual) return;
    if (!confirm(`¿Estás seguro de eliminar "${torneoActual.nombre}"?\nEsta operación no se puede deshacer.`)) return;

    try {
        const response = await fetch(`/api/torneos/${torneoActual.id}`, { method: 'DELETE' });

        if (response.ok) {
            alert("Torneo eliminado correctamente.");
            document.getElementById('seccionEditor').style.display = 'none';
            cargarTorneosGrid();
        } else {
            const err = await response.text();
            alert("No se pudo eliminar: " + err);
        }
    } catch (error) {
        alert("Error de comunicación de red.");
    }
}
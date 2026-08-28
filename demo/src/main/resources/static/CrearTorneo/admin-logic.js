let totalRondasGlobal = 0;
let categoriaTorneoGlobal = "Sencillos"; // Default
let tournamentState = {}; // Persistencia de datos de jugadores entre pestañas

function calcularPartidos() {
    const numRondas = parseInt(document.getElementById('numRondas').value);
    const tabsContainer = document.getElementById('tabsRondas');
    const info = document.getElementById('infoPartidos');
    
    if (numRondas > 0 && numRondas <= 7) {
        categoriaTorneoGlobal = document.querySelector('input[name="categoria"]:checked').value;

        totalRondasGlobal = numRondas;
        tournamentState = {}; // Limpiar datos al cambiar la estructura
        info.innerText = `Estructura: ${Math.pow(2, numRondas)} jugadores totales.`;

        tabsContainer.innerHTML = "";
        for (let i = 1; i <= numRondas; i++) {
            const label = (i === numRondas) ? "Final" : (i === numRondas-1) ? "Semis" : `Ronda ${i}`;
            tabsContainer.innerHTML += `
                <button class="tab-button ${i === 1 ? 'active' : ''}" onclick="mostrarRonda(${i}, this)">
                    ${label}
                </button>
            `;
        }
        mostrarRonda(1);
    }
}

function toggleSiembras() {
    const seccion = document.getElementById('seccionSiembras');
    seccion.style.display = (document.getElementById('haySiembras').value === 'si') ? 'block' : 'none';
}

function generarCamposSiembras() {
    const cantidad = document.getElementById('cantSiembras').value;
    const contenedor = document.getElementById('contenedorCamposSiembras');
    contenedor.innerHTML = "";
    for (let i = 1; i <= cantidad; i++) {
        contenedor.innerHTML += `
            <div style="display: flex; gap: 5px; margin-bottom: 8px;">
                <input type="text" placeholder="Nombre Siembra ${i}" id="seed_name_${i}">
                <input type="number" placeholder="Llave R2" id="seed_llave_${i}" style="width: 100px;">
            </div>`;
    }
}

function mostrarRonda(rondaActual, elemento = null) {
    // Guardar los valores de los inputs de la ronda actual antes de cambiar de pestaña
    document.querySelectorAll('#contenedorLlaves input').forEach(input => {
        tournamentState[input.id] = input.value;
    });

    const contenedor = document.getElementById('contenedorLlaves');
    const haySiembras = document.getElementById('haySiembras').value === 'si';
    const esDobles = categoriaTorneoGlobal === 'Dobles';

    if (elemento) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        elemento.classList.add('active');
    }

    const partidosEnEstaRonda = Math.pow(2, totalRondasGlobal - rondaActual);
    contenedor.innerHTML = "";

    for (let i = 1; i <= partidosEnEstaRonda; i++) {
        let p1_j1_name = "", p1_j2_name = "", p2_j1_name = "", p2_j2_name = "";
        let p1_j1_disabled = (rondaActual > 1), p1_j2_disabled = (rondaActual > 1);
        let p2_j1_disabled = (rondaActual > 1), p2_j2_disabled = (rondaActual > 1);
        let esSiembraR1 = false;

        if (haySiembras) {
            const cant = document.getElementById('cantSiembras').value;
            for (let s = 1; s <= cant; s++) {
                let nomS = document.getElementById(`seed_name_${s}`)?.value || `Siembra ${s}`;
                let nomS_j2 = ""; // Para dobles, si la siembra es una pareja
                if (esDobles) {
                    // Asumiendo que para siembras de dobles, el nombre es "Jugador1 & Jugador2"
                    // O que hay un campo separado para el segundo jugador de la siembra
                    // Por simplicidad, aquí solo usamos el nomS para el primer jugador de la pareja
                    // y el segundo jugador de la pareja de siembra se dejaría vacío o se inferiría.
                    // Para una implementación real, se necesitarían campos de siembra para J1 y J2 de la pareja.
                    // Aquí, si nomS es "A & B", lo dividimos.
                    const seedNames = nomS.split(' & ');
                    if (seedNames.length === 2) {
                        nomS = seedNames[0];
                        nomS_j2 = seedNames[1];
                    } else {
                        nomS_j2 = "Jugador 2 Siembra"; // Placeholder
                    }
                }

                let llaveS = parseInt(document.getElementById(`seed_llave_${s}`)?.value);

                // En RONDA 2: Ponemos a la siembra en el lugar J1 de la llave elegida
                if (rondaActual === 2 && i === llaveS) {
                    if (esDobles) {
                        p1_j1_name = nomS; p1_j2_name = nomS_j2;
                        p2_j1_name = "Ganador R1-L" + (llaveS * 2) + " (J1)";
                        p2_j2_name = "Ganador R1-L" + (llaveS * 2) + " (J2)";
                        p1_j1_disabled = p1_j2_disabled = p2_j1_disabled = p2_j2_disabled = true;
                    } else {
                        p1_j1_name = nomS;
                        p2_j1_name = "Ganador R1-L" + (llaveS * 2);
                        p1_j1_disabled = p2_j1_disabled = true;
                    }
                }
                // En RONDA 1: Bloqueamos SOLO la llave impar que alimenta ese puesto de R2
                if (rondaActual === 1 && i === (llaveS * 2 - 1)) {
                    if (esDobles) {
                        p1_j1_name = nomS; p1_j2_name = nomS_j2;
                        p2_j1_name = "--- (BYE) ---"; p2_j2_name = "--- (BYE) ---";
                        p1_j1_disabled = p1_j2_disabled = p2_j1_disabled = p2_j2_disabled = esSiembraR1 = true;
                    } else {
                        p1_j1_name = nomS;
                        p2_j1_name = "--- (BYE) ---";
                        p1_j1_disabled = p2_j1_disabled = esSiembraR1 = true;
                    }
                }
            }
        }

        if (rondaActual > 1 && p1_j1_name === "") {
            if (esDobles) {
                p1_j1_name = "Ganador anterior (J1)"; p1_j2_name = "Ganador anterior (J2)";
                p2_j1_name = "Ganador anterior (J1)"; p2_j2_name = "Ganador anterior (J2)";
            } else {
                p1_j1_name = "Ganador anterior";
                p2_j1_name = "Ganador anterior";
            }
        }

        if (esDobles) {
            contenedor.innerHTML += `
                <div class="llave-item ${esSiembraR1 ? 'siembra-card' : ''}" data-ronda="${rondaActual}" data-llave="${i}">
                    <span style="min-width: 55px; font-size: 0.7rem; color: #888;">R${rondaActual}-L${i}</span>
                    <div class="player-pair">
                        <input type="text" id="r${rondaActual}l${i}p1j1" value="${tournamentState[`r${rondaActual}l${i}p1j1`] || p1_j1_name}" placeholder="Pareja 1 - Jugador 1" ${p1_j1_disabled ? 'disabled class="input-bloqueado"' : ''}>
                        <input type="text" id="r${rondaActual}l${i}p1j2" value="${tournamentState[`r${rondaActual}l${i}p1j2`] || p1_j2_name}" placeholder="Pareja 1 - Jugador 2" ${p1_j2_disabled ? 'disabled class="input-bloqueado"' : ''}>
                    </div>
                    <span class="vs">VS</span>
                    <div class="player-pair">
                        <input type="text" id="r${rondaActual}l${i}p2j1" value="${tournamentState[`r${rondaActual}l${i}p2j1`] || p2_j1_name}" placeholder="Pareja 2 - Jugador 1" ${p2_j1_disabled ? 'disabled class="input-bloqueado"' : ''}>
                        <input type="text" id="r${rondaActual}l${i}p2j2" value="${tournamentState[`r${rondaActual}l${i}p2j2`] || p2_j2_name}" placeholder="Pareja 2 - Jugador 2" ${p2_j2_disabled ? 'disabled class="input-bloqueado"' : ''}>
                    </div>
                </div>`;
        } else {
            contenedor.innerHTML += `
                <div class="llave-item ${esSiembraR1 ? 'siembra-card' : ''}" data-ronda="${rondaActual}" data-llave="${i}">
                    <span style="min-width: 55px; font-size: 0.7rem; color: #888;">R${rondaActual}-L${i}</span>
                    <input type="text" id="r${rondaActual}l${i}j1" value="${tournamentState[`r${rondaActual}l${i}j1`] || p1_j1_name}" placeholder="Jugador 1" ${p1_j1_disabled ? 'disabled class="input-bloqueado"' : ''}>
                    <span class="vs">VS</span>
                    <input type="text" id="r${rondaActual}l${i}j2" value="${tournamentState[`r${rondaActual}l${i}j2`] || p2_j1_name}" placeholder="Jugador 2" ${p2_j1_disabled ? 'disabled class="input-bloqueado"' : ''}>
                </div>`;
        }
    }
}

async function guardarTorneo() {
    // Sincronizar los inputs que están visibles en este momento antes de procesar
    document.querySelectorAll('#contenedorLlaves input').forEach(input => {
        tournamentState[input.id] = input.value;
    });

    const nombreTorneo = document.getElementById('nombreTorneo').value;
    const categoria = document.querySelector('input[name="categoria"]:checked').value;
    const numRondas = parseInt(document.getElementById('numRondas').value);
    
    // 🔥 NUEVO: Capturar el valor seleccionado de la clasificación
    const clasificacionTorneo = document.getElementById('clasificacionTorneo').value;

    if (!nombreTorneo) {
        return alert("Por favor, ingresa un nombre para el torneo.");
    }

    // Mensaje de confirmación
    if (!confirm(`¿Estás seguro de que deseas guardar el torneo "${nombreTorneo}"?`)) return;

    const torneoData = {
        nombre: nombreTorneo,
        categoria: categoria,
        clasificacion: clasificacionTorneo, // 🔥 NUEVO: Se envía al backend
        estado: "SIN_JUGAR", // Estado inicial
        rondas: []
    };

    for (let r = 1; r <= numRondas; r++) {
        const ronda = {
            numeroRonda: r,
            nombreRonda: (r === numRondas) ? "Final" : (r === numRondas-1) ? "Semifinal" : `Ronda ${r}`,
            partidos: []
        };

        const partidosEnEstaRonda = Math.pow(2, numRondas - r);
        for (let l = 1; l <= partidosEnEstaRonda; l++) {
            let partido;
            if (categoria === 'Dobles') {
                const p1j1 = tournamentState[`r${r}l${l}p1j1`] || "";
                const p1j2 = tournamentState[`r${r}l${l}p1j2`] || "";
                const p2j1 = tournamentState[`r${r}l${l}p2j1`] || "";
                const p2j2 = tournamentState[`r${r}l${l}p2j2`] || "";

                if (!p1j1 || !p1j2 || !p2j1 || !p2j2) {
                    return alert(`Faltan jugadores en la Ronda ${r}, Llave ${l} para dobles.`);
                }

                partido = {
                    '@class': 'com.Tenis.demo.model.entities.PartidoDobles', // Para deserialización polimórfica
                    pareja1: {
                        jugador1: { nombre: p1j1 },
                        jugador2: { nombre: p1j2 }
                    },
                    pareja2: {
                        jugador1: { nombre: p2j1 },
                        jugador2: { nombre: p2j2 }
                    }
                };
            } else { // Sencillos
                const j1 = tournamentState[`r${r}l${l}j1`] || "";
                const j2 = tournamentState[`r${r}l${l}j2`] || "";

                if (!j1 || !j2) {
                    return alert(`Faltan jugadores en la Ronda ${r}, Llave ${l} para sencillos.`);
                }

                partido = {
                    '@class': 'com.Tenis.demo.model.entities.PartidoSencillos', // Para deserialización polimórfica
                    jugador1: { nombre: j1 },
                    jugador2: { nombre: j2 }
                };
            }
            ronda.partidos.push(partido);
        }
        torneoData.rondas.push(ronda);
    }

    console.log("Datos del torneo a enviar:", torneoData);

    try {
        const response = await fetch('/api/torneos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(torneoData)
        });

        if (response.ok) {
            const result = await response.json();
            alert("¡TORNEO GUARDADO EXITOSAMENTE!\n\nEl torneo '" + result.nombre + "' ha sido registrado en el sistema.");
            window.location.href = "Admin.html"; // Redirigir a la página principal de admin
        } else {
            const errorText = await response.text();
            alert("Error al crear el torneo: " + errorText);
            console.error("Error al crear el torneo:", errorText);
        }
    } catch (error) {
        console.error("Error de conexión al guardar el torneo:", error);
        alert("No se pudo conectar con el servidor para guardar el torneo.");
    }
}
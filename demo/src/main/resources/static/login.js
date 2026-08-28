console.log("Script login.js cargado e iniciando...");

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, password })
        });

        if (response.ok) {
            const tokenUsuario = await response.json();
            
            // Guardamos token, rol y el nombre de usuario
            localStorage.setItem('sessionToken', tokenUsuario.contenido);
            localStorage.setItem('userRole', tokenUsuario.rol.nombre);
            localStorage.setItem('username', tokenUsuario.usuario);

            redirigirUsuario(tokenUsuario.rol.nombre);
        } else {
            alert("Credenciales incorrectas. Intente de nuevo.");
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor.");
    }
});

function redirigirUsuario(rol) {
    switch(rol) {
        case 'ADMINISTRADOR':
            window.location.href = '/CrearTorneo/Admin.html';
            break;
            
        case 'JUEZ':
            window.location.href = '/Juez/panel-juez.html';
            break;
            
        case 'JUGADOR':
            // Redirección a la nueva interfaz del jugador
            window.location.href = '/Jugador/dashboard-jugador.html'; 
            break;
            
        default:
            alert("Rol no reconocido");
            window.location.href = '/index.html';
    }
}

window.ejecutarSetup = async function() {
    console.log("Iniciando setup manual...");
    try {
        const response = await fetch('/api/setup-usuarios', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            alert("¡Éxito!\n" + data.admin + "\n" + data.juez + "\n" + data.jugador);
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        alert("Error de conexión. Mira la consola (F12).");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnForgot = document.getElementById('btnForgot');
    const modalRecuperar = document.getElementById('modalRecuperar');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const recuperarForm = document.getElementById('recuperarForm');
    const mensajeResultado = document.getElementById('mensajeResultado');

    // Abrir modal
    btnForgot.addEventListener('click', (e) => {
        e.preventDefault();
        mensajeResultado.innerText = '';
        mensajeResultado.style.color = '';
        document.getElementById('inputIdentificador').value = '';
        modalRecuperar.style.display = 'flex';
    });

    // Cerrar modal
    btnCerrarModal.addEventListener('click', () => {
        modalRecuperar.style.display = 'none';
    });

    // Enviar solicitud de recuperación al backend
    recuperarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identificador = document.getElementById('inputIdentificador').value.trim();

        mensajeResultado.style.color = '#333';
        mensajeResultado.innerText = 'Consultando...';

        try {
            const response = await fetch('/api/auth/recuperar-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identificador: identificador })
            });

            const data = await response.json();

            if (data.exito) {
                mensajeResultado.style.color = '#28a745'; // Verde
            } else {
                mensajeResultado.style.color = '#dc3545'; // Rojo
            }
            mensajeResultado.innerText = data.mensaje;

        } catch (error) {
            mensajeResultado.style.color = '#dc3545';
            mensajeResultado.innerText = 'Error al conectar con el servidor.';
        }
    });
});
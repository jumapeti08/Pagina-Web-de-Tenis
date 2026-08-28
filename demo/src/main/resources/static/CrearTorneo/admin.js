document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin JS cargado correctamente.");
    const registroUsuarioForm = document.getElementById('registroUsuarioForm');

    if (registroUsuarioForm) {
        registroUsuarioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Intentando registrar nuevo usuario...");
            
            const usuario = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const rolId = document.getElementById('newRolId').value;

            try {
                const response = await fetch('/api/usuarios/registrar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ usuario, password, rolId })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert("✅ " + result.message);
                    registroUsuarioForm.reset();
                } else {
                    const result = await response.json().catch(() => ({ error: "Error desconocido en el servidor" }));
                    console.error("Error detallado:", result);
                    alert("Error: " + (result.error || "No se pudo crear el usuario"));
                }
            } catch (error) {
                console.error("Error en la petición:", error);
                alert("Error de conexión con el servidor");
            }
        });
    }
});

function navegar(ruta) {
    if (ruta === 'editar') {
        window.location.href = 'editar-torneo.html';
    } else {
        console.log("Navegando a la sección: " + ruta);
        // Aquí puedes meter más redirecciones en el futuro (ej. 'vivo' o 'antiguos')
    }
}
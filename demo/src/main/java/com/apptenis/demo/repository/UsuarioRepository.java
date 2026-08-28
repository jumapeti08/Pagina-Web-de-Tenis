package com.apptenis.demo.repository;

import com.apptenis.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Método existente para login / búsqueda por nombre visible
    Optional<Usuario> findByUsuario(String usuario);

    // Búsqueda por el nuevo identificador único de acceso
    Optional<Usuario> findByNombreAcceso(String nombreAcceso);

    Optional<Usuario> findByUsuarioOrNombreAcceso(String usuario, String nombreAcceso);

    // Nuevo método para el autocompletado del buscador
    List<Usuario> findByUsuarioContainingIgnoreCase(String usuario);
}
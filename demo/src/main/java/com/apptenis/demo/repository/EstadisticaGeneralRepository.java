package com.apptenis.demo.repository;

import com.apptenis.demo.model.EstadisticaGeneral;
import com.apptenis.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EstadisticaGeneralRepository extends JpaRepository<EstadisticaGeneral, Long> {
    // Este método es crucial para que el controlador busque si el jugador ya tiene historial
    Optional<EstadisticaGeneral> findByUsuario(Usuario usuario);
}
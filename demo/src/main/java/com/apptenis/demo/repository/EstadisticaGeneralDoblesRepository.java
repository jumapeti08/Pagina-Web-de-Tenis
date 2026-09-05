package com.apptenis.demo.repository;

import com.apptenis.demo.model.EstadisticaGeneralDobles;
import com.apptenis.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EstadisticaGeneralDoblesRepository extends JpaRepository<EstadisticaGeneralDobles, Long> {
    Optional<EstadisticaGeneralDobles> findByUsuario(Usuario usuario);
}

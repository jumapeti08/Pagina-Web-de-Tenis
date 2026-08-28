package com.apptenis.demo.repository;

import com.apptenis.demo.model.Torneo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TorneoRepository extends JpaRepository<Torneo, Long> {

    // Busca ignorando mayúsculas/minúsculas en 'categoria' y 'estado'
    List<Torneo> findByCategoriaIgnoreCaseAndEstadoIgnoreCase(String categoria, String estado);

    // Busca ignorando mayúsculas/minúsculas en 'categoria', 'clasificacion' y 'estado'
    List<Torneo> findByCategoriaIgnoreCaseAndClasificacionIgnoreCaseAndEstadoIgnoreCase(
            String categoria, String clasificacion, String estado);

    List<Torneo> findByCategoriaIgnoreCase(String categoria);

    // Buscar todos los estados por categoría y clasificación
    List<Torneo> findByCategoriaIgnoreCaseAndClasificacionIgnoreCase(String categoria, String clasificacion);
}
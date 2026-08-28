package com.apptenis.demo.repository;

import com.apptenis.demo.model.Ronda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RondaRepository extends JpaRepository<Ronda, Long> {

    // Esta es la query mágica que te hace falta:
    @Query("SELECT r FROM Ronda r JOIN r.partidos p WHERE p.id = :partidoId")
    Optional<Ronda> findByPartidoId(@Param("partidoId") Long partidoId);
}

package com.apptenis.demo.repository;

import com.apptenis.demo.model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {
    List<Partido> findByRondaTorneoId(Long torneoId);
}
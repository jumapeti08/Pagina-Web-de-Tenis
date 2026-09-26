package com.apptenis.demo.scheduler; // <-- El paquete correspondiente

import com.apptenis.demo.model.Partido;
import com.apptenis.demo.repository.PartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SchedulerPartidos {

    @Autowired
    private PartidoRepository partidoRepository;

    // Se ejecuta cada 30 segundos
    @Scheduled(fixedRate = 30000)
    public void autoSuspenderPartidosInactivos() {
        LocalDateTime limiteInactividad = LocalDateTime.now().minusSeconds(45);

        List<Partido> partidosAbandonados = partidoRepository.findByEstadoAndUltimaConexionJuezBefore(
            "EN_CURSO", limiteInactividad
        );

        for (Partido partido : partidosAbandonados) {
            partido.setEstado("SUSPENDIDO");
            partidoRepository.save(partido);
            System.out.println("Partido ID " + partido.getId() + " suspendido automáticamente por desconexión del juez.");
        }
    }
}
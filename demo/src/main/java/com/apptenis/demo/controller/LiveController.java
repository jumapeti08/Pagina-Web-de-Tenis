package com.apptenis.demo.controller;

import com.apptenis.demo.model.Partido;
import com.apptenis.demo.repository.PartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/live")
@CrossOrigin(origins = "*")
public class LiveController {

    @Autowired
    private PartidoRepository partidoRepository;

    @PostMapping("/{partidoId}/evento")
    public ResponseEntity<?> registrarGolpe(@PathVariable Long partidoId, 
                                            @RequestParam String jugador, // "J1" o "J2"
                                            @RequestParam String accion) { // "ACE", "DFALTA", "WINNER", "ERROR_NF", "RED"
        
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado"));

        // 1. Registrar la estadística acumulativa de los botones
        if ("J1".equals(jugador)) {
            switch (accion) {
                case "ACE" -> partido.getEstadisticas().setAcesJ1(partido.getEstadisticas().getAcesJ1() + 1);
                case "DFALTA" -> partido.getEstadisticas().setDoblesFaltasJ1(partido.getEstadisticas().getDoblesFaltasJ1() + 1);
                case "WINNER" -> partido.getEstadisticas().setWinnersJ1(partido.getEstadisticas().getWinnersJ1() + 1);
                case "ERROR_NF" -> partido.getEstadisticas().setErroresNoForzadosJ1(partido.getEstadisticas().getErroresNoForzadosJ1() + 1);
                case "RED" -> partido.getEstadisticas().setPuntosEnRedJ1(partido.getEstadisticas().getPuntosEnRedJ1() + 1);
            }
        } else {
            switch (accion) {
                case "ACE" -> partido.getEstadisticas().setAcesJ2(partido.getEstadisticas().getAcesJ2() + 1);
                case "DFALTA" -> partido.getEstadisticas().setDoblesFaltasJ2(partido.getEstadisticas().getDoblesFaltasJ2() + 1);
                case "WINNER" -> partido.getEstadisticas().setWinnersJ2(partido.getEstadisticas().getWinnersJ2() + 1);
                case "ERROR_NF" -> partido.getEstadisticas().setErroresNoForzadosJ2(partido.getEstadisticas().getErroresNoForzadosJ2() + 1);
                case "RED" -> partido.getEstadisticas().setPuntosEnRedJ2(partido.getEstadisticas().getPuntosEnRedJ2() + 1);
            }
        }

        // 2. Aquí puedes añadir tu método matemático para llevar el tanteador (0 -> 15 -> 30 -> 40 -> Game)
        // Por ejemplo, si es un ACE o WINNER de J1, suma punto para J1. Si es D.FALTA de J1, suma punto para J2.

        partidoRepository.save(partido);
        return ResponseEntity.ok(partido);
    }
}

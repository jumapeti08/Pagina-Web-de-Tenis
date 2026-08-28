package com.apptenis.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class MarcadorWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/actualizar-marcador")
    public void actualizarMarcador(Map<String, Object> payload) {
        Object partidoId = payload.get("partidoId");
        if (partidoId != null) {
            // Reenvía la actualización en tiempo real a los jugadores/espectadores suscritos a este partido
            messagingTemplate.convertAndSend("/topic/marcador/" + partidoId, payload);
        }
    }
}
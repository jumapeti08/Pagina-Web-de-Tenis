package com.apptenis.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 🔥 Habilita la ruta /ws-tenis y permite CORS para que el frontend pueda conectarse
        registry.addEndpoint("/ws-tenis")
                .setAllowedOriginPatterns("*") // Permite conexión desde cualquier frontend (ej: Live Server)
                .withSockJS(); // Habilita compatibilidad con SockJS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijo para enviar mensajes desde el backend a los clientes (espectadores)
        registry.enableSimpleBroker("/topic");
        
        // Prefijo para que el frontend (Juez) envíe datos al backend (/app/actualizar-marcador)
        registry.setApplicationDestinationPrefixes("/app");
    }
}
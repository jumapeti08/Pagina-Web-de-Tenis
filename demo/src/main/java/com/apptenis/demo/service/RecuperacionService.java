package com.apptenis.demo.service;

import com.apptenis.demo.model.Usuario;
import com.apptenis.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class RecuperacionService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JavaMailSender mailSender;

    // Inyecta el correo emisor definido en tu application.properties
    @Value("${spring.mail.username}")
    private String emailRemitente;

    public Map<String, Object> recuperarContrasena(String identificador) {
        Map<String, Object> respuesta = new HashMap<>();

        // Busca por 'usuario' (nombre real) O por 'nombreAcceso'
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuarioOrNombreAcceso(identificador, identificador);

        if (usuarioOpt.isEmpty()) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "El usuario o nombre de acceso no existe.");
            return respuesta;
        }

        Usuario usuario = usuarioOpt.get();

        // Verifica si tiene correo asignado
        if (usuario.getCorreo() == null || usuario.getCorreo().trim().isEmpty()) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "El usuario no tiene un correo registrado. Por favor, comunícate con el administrador.");
            return respuesta;
        }

        // Envía el correo con la contraseña/información
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(emailRemitente); // OBLIGATORIO PARA GMAIL
            mailMessage.setTo(usuario.getCorreo());
            mailMessage.setSubject("Recuperación de Contraseña - App Tenis");
            mailMessage.setText("Hola " + usuario.getUsuario() + ",\n\n" +
                    "Tus credenciales de acceso son:\n" +
                    "Nombre de acceso: " + usuario.getNombreAcceso() + "\n" +
                    "Contraseña: " + usuario.getPassword() + "\n\n" +
                    "Si no solicitaste este cambio, por favor contacta al administrador.");

            mailSender.send(mailMessage);

            respuesta.put("exito", true);
            respuesta.put("mensaje", "La información de acceso ha sido enviada a tu correo electrónico.");
        } catch (Exception e) {
            // Imprime la causa exacta en la consola de Spring Boot para depuración
            System.err.println("Error enviando correo de recuperación:");
            e.printStackTrace();

            respuesta.put("exito", false);
            respuesta.put("mensaje", "Ocurrió un error al intentar enviar el correo. Intenta de nuevo más tarde.");
        }

        return respuesta;
    }
}
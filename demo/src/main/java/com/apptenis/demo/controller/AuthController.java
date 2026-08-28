package com.apptenis.demo.controller;

import com.apptenis.demo.model.Usuario;
import com.apptenis.demo.model.TokenUsuario;
import com.apptenis.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.apptenis.demo.service.RecuperacionService;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("usuario");
        String password = loginRequest.get("password");

        // En lugar de findByUsuario(username)
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreAcceso(username);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            if (usuario.getPassword().equals(password)) {
                String tokenSimulado = "JWT-" + UUID.randomUUID().toString();

                // Pasamos contenido, rol y username al DTO
                TokenUsuario tokenUsuarioResponse = new TokenUsuario(tokenSimulado, usuario.getRol(), usuario.getUsuario());

                return ResponseEntity.ok(tokenUsuarioResponse);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Credenciales incorrectas"));
    }


    @Autowired
    private RecuperacionService recuperacionService;

    @PostMapping("/recuperar-password")
    public ResponseEntity<Map<String, Object>> recuperarPassword(@RequestBody Map<String, String> request) {
        String identificador = request.get("identificador");
        Map<String, Object> resultado = recuperacionService.recuperarContrasena(identificador);
        return ResponseEntity.ok(resultado);
    }
}
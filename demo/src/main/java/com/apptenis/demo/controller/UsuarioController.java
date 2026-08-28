package com.apptenis.demo.controller;

import com.apptenis.demo.model.Usuario;
import com.apptenis.demo.model.EstadisticaGeneral;
import com.apptenis.demo.model.Partido;
import com.apptenis.demo.model.Rol;
import com.apptenis.demo.model.Torneo;
import com.apptenis.demo.repository.UsuarioRepository;
import com.apptenis.demo.repository.EstadisticaGeneralRepository;
import com.apptenis.demo.repository.PartidoRepository;
import com.apptenis.demo.repository.RolRepository;
import com.apptenis.demo.repository.TorneoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.apptenis.demo.service.UsuarioService;
import java.util.List;
import com.apptenis.demo.DTOs.ActualizarPerfilDTO;

import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Optional;


@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private TorneoRepository torneoRepository;

    @Autowired
    private UsuarioService usuarioService;

    // Conecta con el formulario del Admin.html (admin.js)
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarUsuario(@RequestBody Map<String, String> request) {
        String username = request.get("usuario");
        String password = request.get("password");
        String rolNombre = request.get("rolId");

        Map<String, String> response = new HashMap<>();

        // La validación de existencia se debe hacer por nombreAcceso
        if (usuarioRepository.findByNombreAcceso(username).isPresent()) {
            response.put("error", "El nombre de acceso ya existe.");
            return ResponseEntity.badRequest().body(response);
        }

        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new RuntimeException("Error: El Rol no fue encontrado en la Base de Datos."));

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setUsuario(username);
        nuevoUsuario.setNombreAcceso(username); // Se inicializa con el mismo nombre ingresado
        nuevoUsuario.setCorreo(null);           // Se asigna explícitamente como null
        nuevoUsuario.setPassword(password);
        nuevoUsuario.setRol(rol);

        usuarioRepository.save(nuevoUsuario);

        response.put("message", "Usuario " + username + " creado exitosamente con rol " + rolNombre);
        return ResponseEntity.ok(response);
    }

    @Autowired
private EstadisticaGeneralRepository estadisticaGeneralRepository;

    @GetMapping("/{username}/estadisticas-globales")
    public ResponseEntity<?> obtenerEstadisticasGlobales(@PathVariable String username) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(username);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = usuarioOpt.get();

        // Buscar las estadísticas asociadas al usuario en la tabla 'estadisticas_generales'
        EstadisticaGeneral stats = estadisticaGeneralRepository.findByUsuario(usuario)
                .orElseGet(() -> {
                    // Si aún no tiene registro, devolvemos uno vacío
                    EstadisticaGeneral nuevaStat = new EstadisticaGeneral();
                    nuevaStat.setUsuario(usuario);
                    return nuevaStat;
                });

        // Mapear métricas desde la entidad EstadisticaGeneral
        int partidosJugados = stats.getPartidosJugados();
        int partidosGanados = stats.getPartidosGanados();
        int partidosPerdidos = Math.max(0, partidosJugados - partidosGanados);

        int totalAces = stats.getAces();
        int totalDoblesFaltas = stats.getDoblesFaltas();
        int totalErrores = stats.getErroresNoForzados();
        int totalWinners = stats.getWinners();
        int totalPuntosRed = stats.getRed();

        // Calcular promedios por partido
        double promAces = partidosJugados > 0 ? (double) totalAces / partidosJugados : 0.0;
        double promDoblesFaltas = partidosJugados > 0 ? (double) totalDoblesFaltas / partidosJugados : 0.0;
        double promErrores = partidosJugados > 0 ? (double) totalErrores / partidosJugados : 0.0;
        double promWinners = partidosJugados > 0 ? (double) totalWinners / partidosJugados : 0.0;
        double promPuntosRed = partidosJugados > 0 ? (double) totalPuntosRed / partidosJugados : 0.0;
        
        double porcentajeVictorias = partidosJugados > 0 ? ((double) partidosGanados / partidosJugados) * 100 : 0.0;

        Map<String, Object> response = new HashMap<>();
        response.put("partidosJugados", partidosJugados);
        response.put("partidosGanados", partidosGanados);
        response.put("partidosPerdidos", partidosPerdidos);
        response.put("porcentajeVictorias", String.format("%.1f", porcentajeVictorias));

        // Totales
        response.put("totalAces", totalAces);
        response.put("totalDoblesFaltas", totalDoblesFaltas);
        response.put("totalErrores", totalErrores);
        response.put("totalWinners", totalWinners);
        response.put("totalPuntosRed", totalPuntosRed);

        // Promedios por partido
        response.put("promAces", String.format("%.1f", promAces));
        response.put("promDoblesFaltas", String.format("%.1f", promDoblesFaltas));
        response.put("promErrores", String.format("%.1f", promErrores));
        response.put("promWinners", String.format("%.1f", promWinners));
        response.put("promPuntosRed", String.format("%.1f", promPuntosRed));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Usuario>> buscarJugadores(@RequestParam("query") String query) {
        List<Usuario> resultados = usuarioService.buscarJugadoresPorNombre(query);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping("/torneos/finalizados")
    public ResponseEntity<?> obtenerTorneosFinalizados(
            @RequestParam(value = "modalidad", defaultValue = "SENCILLOS") String modalidad,
            @RequestParam(value = "categoria", defaultValue = "TODAS") String categoria) {

        try {
            String modFiltro = modalidad.trim();
            String clasificacionFiltro = categoria.replace("_", " ").trim();

            List<Torneo> torneos;

            // Usamos IgnoreCase para que no importe si es "Sencillos", "SENCILLOS" o "sencillos"
            if ("TODAS".equalsIgnoreCase(clasificacionFiltro) || "TODOS".equalsIgnoreCase(clasificacionFiltro)) {
                torneos = torneoRepository.findByCategoriaIgnoreCaseAndEstadoIgnoreCase(
                        modFiltro, "FINALIZADO");
            } else {
                torneos = torneoRepository.findByCategoriaIgnoreCaseAndClasificacionIgnoreCaseAndEstadoIgnoreCase(
                        modFiltro, clasificacionFiltro, "FINALIZADO");
            }

            return ResponseEntity.ok(torneos);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensaje", "Error al consultar los torneos finalizados."));
        }
    }

    @GetMapping("/torneos/clasificados")
    public ResponseEntity<?> obtenerTorneosClasificados(
            @RequestParam(value = "modalidad", defaultValue = "SENCILLOS") String modalidad,
            @RequestParam(value = "categoria", defaultValue = "TODAS") String categoria) {

        try {
            String modFiltro = modalidad.trim();
            String clasificacionFiltro = categoria.replace("_", " ").trim();

            List<Torneo> torneos;

            if ("TODAS".equalsIgnoreCase(clasificacionFiltro) || "TODOS".equalsIgnoreCase(clasificacionFiltro)) {
                torneos = torneoRepository.findByCategoriaIgnoreCase(modFiltro);
            } else {
                torneos = torneoRepository.findByCategoriaIgnoreCaseAndClasificacionIgnoreCase(
                        modFiltro, clasificacionFiltro);
            }

            return ResponseEntity.ok(torneos);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensaje", "Error al consultar los torneos."));
        }
    }
    
    @Autowired
    private PartidoRepository partidoRepository;

    @GetMapping("/torneos/{torneoId}/partidos")
    public ResponseEntity<?> obtenerPartidosPorTorneo(@PathVariable Long torneoId) {
        try {
            Optional<Torneo> torneoOpt = torneoRepository.findById(torneoId);
            if (torneoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("mensaje", "Torneo no encontrado"));
            }

            Torneo torneo = torneoOpt.get();

            // 1. Obtener los partidos del torneo a través de la ronda
            List<Partido> partidos = partidoRepository.findByRondaTorneoId(torneoId);

            // 2. Agrupar partidos por el nombre de la Ronda
            Map<String, List<Map<String, Object>>> partidosPorRonda = new HashMap<>();

            for (Partido p : partidos) {
                // Formateo del nombre de la ronda usando getNumero()
                String nombreRonda = (p.getRonda() != null) 
                        ? "Ronda " + p.getRonda().getNumero() 
                        : "Fase General";

                Map<String, Object> partidoDTO = new HashMap<>();
                partidoDTO.put("id", p.getId());
                
                // Nombres para sencillos / dobles
                // ✅ CÓDIGO CORREGIDO
                partidoDTO.put("jugador1", p.getJugador1());
                partidoDTO.put("jugador2", p.getJugador2());
                partidoDTO.put("jugador3", p.getJugador3());
                partidoDTO.put("jugador4", p.getJugador4());
                partidoDTO.put("estado", p.getEstado());



                // Dentro del bucle for (Partido p : partidos) en UsuarioController.java

// Games por Set individual
                partidoDTO.put("gamesSet1J1", p.getGamesSet1J1());
                partidoDTO.put("gamesSet1J2", p.getGamesSet1J2());

                partidoDTO.put("gamesSet2J1", p.getGamesSet2J1());
                partidoDTO.put("gamesSet2J2", p.getGamesSet2J2());

                partidoDTO.put("gamesSet3J1", p.getGamesSet3J1());
                partidoDTO.put("gamesSet3J2", p.getGamesSet3J2());

                // Marcador en vivo (Puntos, Games y Sets)
                partidoDTO.put("puntosJ1", p.getPuntosActualesJ1());
                partidoDTO.put("puntosJ2", p.getPuntosActualesJ2());
                
                int totalGamesJ1 = p.getGamesSet1J1() + p.getGamesSet2J1() + p.getGamesSet3J1();
                int totalGamesJ2 = p.getGamesSet1J2() + p.getGamesSet2J2() + p.getGamesSet3J2();
                partidoDTO.put("gamesJ1", totalGamesJ1);
                partidoDTO.put("gamesJ2", totalGamesJ2);
                
                partidoDTO.put("setsJ1", p.getSetsGanadosJ1());
                partidoDTO.put("setsJ2", p.getSetsGanadosJ2());

                // Estadísticas
                Map<String, Integer> statsMap = new HashMap<>();
                if (p.getEstadisticas() != null) {
                    statsMap.put("acesJ1", p.getEstadisticas().getAcesJ1());
                    statsMap.put("acesJ2", p.getEstadisticas().getAcesJ2());
                    statsMap.put("winnersJ1", p.getEstadisticas().getWinnersJ1());
                    statsMap.put("winnersJ2", p.getEstadisticas().getWinnersJ2());
                    statsMap.put("erroresJ1", p.getEstadisticas().getErroresNoForzadosJ1());
                    statsMap.put("erroresJ2", p.getEstadisticas().getErroresNoForzadosJ2());
                    statsMap.put("doblesFaltasJ1", p.getEstadisticas().getDoblesFaltasJ1());
                    statsMap.put("doblesFaltasJ2", p.getEstadisticas().getDoblesFaltasJ2());
                } else {
                    statsMap.put("acesJ1", 0); statsMap.put("acesJ2", 0);
                    statsMap.put("winnersJ1", 0); statsMap.put("winnersJ2", 0);
                    statsMap.put("erroresJ1", 0); statsMap.put("erroresJ2", 0);
                    statsMap.put("doblesFaltasJ1", 0); statsMap.put("doblesFaltasJ2", 0);
                }

                partidoDTO.put("estadisticas", statsMap);

                partidosPorRonda.computeIfAbsent(nombreRonda, k -> new ArrayList<>()).add(partidoDTO);
            }

            // 3. Estructura JSON final para JavaScript
            List<Map<String, Object>> rondasDTO = new ArrayList<>();
            for (Map.Entry<String, List<Map<String, Object>>> entry : partidosPorRonda.entrySet()) {
                Map<String, Object> rondaObj = new HashMap<>();
                rondaObj.put("nombreRonda", entry.getKey());
                rondaObj.put("partidos", entry.getValue());
                rondasDTO.add(rondaObj);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("nombreTorneo", torneo.getNombre());
            response.put("rondas", rondasDTO);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensaje", "Error al obtener los partidos del torneo."));
        }
    }

    @PutMapping("/{username}/actualizar-perfil")
    public ResponseEntity<?> actualizarPerfil(
            @PathVariable String username,
            @RequestBody ActualizarPerfilDTO dto) {

        // 1. Buscar al usuario usando el campo 'nombreAcceso'
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreAcceso(username);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // 2. Asignar los valores usando los setters reales de Lombok
        usuario.setNombreAcceso(dto.getNuevoUsuario());
        usuario.setCorreo(dto.getEmail());

        // 3. Actualizar contraseña solo si fue enviada
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            // Si usas Spring Security: usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
            usuario.setPassword(dto.getPassword());
        }

        // 4. Guardar cambios en BD
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("mensaje", "Perfil actualizado con éxito."));
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable String username) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreAcceso(username);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        Usuario u = usuarioOpt.get();
        return ResponseEntity.ok(Map.of(
            "username", u.getNombreAcceso(),
            "email", u.getCorreo() != null ? u.getCorreo() : ""
        ));
    }
}
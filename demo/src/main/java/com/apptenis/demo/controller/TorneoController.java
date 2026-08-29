package com.apptenis.demo.controller;

import com.apptenis.demo.model.*;
import com.apptenis.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.*;

@RestController
@RequestMapping("/api/torneos")
@CrossOrigin(origins = "*")
public class TorneoController {

    @Autowired
    private RondaRepository rondaRepository;

    @Autowired
    private EstadisticaGeneralRepository estadisticaGeneralRepository;

    @Autowired
    private TorneoRepository torneoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<Torneo>> obtenerTorneos() {
        return ResponseEntity.ok(torneoRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> crearTorneo(@RequestBody Map<String, Object> payload) {

        try {
            String nombre = (String) payload.get("nombre");
            String categoria = (String) payload.get("categoria");
            String clasificacion = (String) payload.get("clasificacion");
            String estado = (String) payload.get("estado");
            List<Map<String, Object>> rondasRaw = (List<Map<String, Object>>) payload.get("rondas");

            // --- 1. RECOLECTAR Y VALIDAR JUGADORES ---
            Set<String> nombresJugadores = new HashSet<>();

            // Vamos a leer la Ronda 1 (que es donde el Admin digita los nombres manualmente)
            for (Map<String, Object> rondaMap : rondasRaw) {
                int numRonda = (int) rondaMap.get("numeroRonda");
                if (numRonda == 1) { 
                    List<Map<String, Object>> partidosRaw = (List<Map<String, Object>>) rondaMap.get("partidos");
                    
                    for (Map<String, Object> partRaw : partidosRaw) {
                        if ("Dobles".equals(categoria)) {
                            Map<String, Object> p1 = (Map<String, Object>) partRaw.get("pareja1");
                            Map<String, Object> p2 = (Map<String, Object>) partRaw.get("pareja2");
                            
                            String j1 = (String) ((Map<String, Object>) p1.get("jugador1")).get("nombre");
                            String j2 = (String) ((Map<String, Object>) p1.get("jugador2")).get("nombre");
                            String j3 = (String) ((Map<String, Object>) p2.get("jugador1")).get("nombre");
                            String j4 = (String) ((Map<String, Object>) p2.get("jugador2")).get("nombre");

                            if (!j1.contains("BYE") && !nombresJugadores.add(j1)) return error("Jugador duplicado: " + j1);
                            if (!j2.contains("BYE") && !nombresJugadores.add(j2)) return error("Jugador duplicado: " + j2);
                            if (!j3.contains("BYE") && !nombresJugadores.add(j3)) return error("Jugador duplicado: " + j3);
                            if (!j4.contains("BYE") && !nombresJugadores.add(j4)) return error("Jugador duplicado: " + j4);

                        } else { // Sencillos
                            String j1 = (String) ((Map<String, Object>) partRaw.get("jugador1")).get("nombre");
                            String j2 = (String) ((Map<String, Object>) partRaw.get("jugador2")).get("nombre");

                            if (!j1.contains("BYE") && !nombresJugadores.add(j1)) return error("El jugador '" + j1 + "' está repetido en la llave.");
                            if (!j2.contains("BYE") && !nombresJugadores.add(j2)) return error("El jugador '" + j2 + "' está repetido en la llave.");
                        }
                    }
                }
            }

            // --- 2. VERIFICAR QUE EXISTAN EN BD Y SEAN ROL 'JUGADOR' ---
            for (String nombreUser : nombresJugadores) {
                Optional<Usuario> userOpt = usuarioRepository.findByUsuario(nombreUser);
                if (userOpt.isEmpty()) {
                    return error("El usuario '" + nombreUser + "' no está registrado en el sistema.");
                }
                
                Usuario usuario = userOpt.get();
                if (!"JUGADOR".equals(usuario.getRol().getNombre())) {
                    return error("El usuario '" + nombreUser + "' existe, pero NO tiene rol de JUGADOR.");
                }
            }

            // --- 3. CONSTRUIR OBJETO RELACIONAL JPA ---
            // --- 3. CONSTRUIR OBJETO RELACIONAL JPA ---
Torneo nuevoTorneo = new Torneo();
nuevoTorneo.setNombre(nombre);
nuevoTorneo.setCategoria(categoria);
nuevoTorneo.setClasificacion(clasificacion);
nuevoTorneo.setEstado(estado);

List<Ronda> listaRondas = new ArrayList<>();
for (Map<String, Object> rondaRaw : rondasRaw) {
    Ronda ronda = new Ronda();
    ronda.setNumero((int) rondaRaw.get("numeroRonda"));
    

    ronda.setTorneo(nuevoTorneo); 

    List<Partido> listaPartidos = new ArrayList<>();
    List<Map<String, Object>> partidosRaw = (List<Map<String, Object>>) rondaRaw.get("partidos");

    for (Map<String, Object> pRaw : partidosRaw) {
        Partido p = new Partido();
        p.setEstadisticas(new EstadisticaPartido());
        
        // 🔥 CRÍTICO: Vincular el partido con su ronda madre
        p.setRonda(ronda); 
        
        // Dejar el estado por defecto listo para que el Juez lo inicie
        p.setEstado("PROGRAMADO"); 

        if ("Dobles".equals(categoria)) {
            Map<String, Object> p1 = (Map<String, Object>) pRaw.get("pareja1");
            Map<String, Object> p2 = (Map<String, Object>) pRaw.get("pareja2");
            
            String nameJ1 = (String) ((Map<String, Object>) p1.get("jugador1")).get("nombre");
            String nameJ2 = (String) ((Map<String, Object>) p1.get("jugador2")).get("nombre");
            String nameJ3 = (String) ((Map<String, Object>) p2.get("jugador1")).get("nombre");
            String nameJ4 = (String) ((Map<String, Object>) p2.get("jugador2")).get("nombre");

            if (!nameJ1.contains("BYE") && !nameJ1.isEmpty()) p.setJugador1(usuarioRepository.findByUsuario(nameJ1).orElse(null));
            if (!nameJ2.contains("BYE") && !nameJ2.isEmpty()) p.setJugador2(usuarioRepository.findByUsuario(nameJ2).orElse(null));
            if (!nameJ3.contains("BYE") && !nameJ3.isEmpty()) p.setJugador3(usuarioRepository.findByUsuario(nameJ3).orElse(null));
            if (!nameJ4.contains("BYE") && !nameJ4.isEmpty()) p.setJugador4(usuarioRepository.findByUsuario(nameJ4).orElse(null));
        
        } else { // Sencillos
            String nameJ1 = (String) ((Map<String, Object>) pRaw.get("jugador1")).get("nombre");
            String nameJ2 = (String) ((Map<String, Object>) pRaw.get("jugador2")).get("nombre");

            if (!nameJ1.contains("BYE") && !nameJ1.isEmpty()) p.setJugador1(usuarioRepository.findByUsuario(nameJ1).orElse(null));
            if (!nameJ2.contains("BYE") && !nameJ2.isEmpty()) p.setJugador2(usuarioRepository.findByUsuario(nameJ2).orElse(null));
        }
        listaPartidos.add(p);
    }
    ronda.setPartidos(listaPartidos);
    listaRondas.add(ronda);
}

nuevoTorneo.setRondas(listaRondas);

Torneo torneoGuardado = torneoRepository.save(nuevoTorneo);
return ResponseEntity.ok(torneoGuardado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error interno procesando los datos del torneo.");
        }
    }

    private ResponseEntity<?> error(String mensaje) {
        return ResponseEntity.badRequest().body(mensaje);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarTorneo(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Optional<Torneo> torneoOpt = torneoRepository.findById(id);
            if (torneoOpt.isEmpty()) {
                return error("El torneo con ID " + id + " no existe.");
            }
            Torneo torneoExistente = torneoOpt.get();

            String nuevoNombre = (String) payload.get("nombre");
            String nuevoEstado = (String) payload.get("estado");
            String nuevaClasificacion = (String) payload.get("clasificacion");
            List<Map<String, Object>> rondasRaw = (List<Map<String, Object>>) payload.get("rondas");

            // --- 1. RECOLECTAR Y VALIDAR JUGADORES (PROTEGIDO CONTRA NULL) ---
            Set<String> nombresJugadores = new HashSet<>();
            for (Map<String, Object> rondaMap : rondasRaw) {
                Number numRondaObj = (Number) rondaMap.get("numeroRonda");
                if (numRondaObj != null && numRondaObj.intValue() == 1) { 
                    List<Map<String, Object>> partidosRaw = (List<Map<String, Object>>) rondaMap.get("partidos");
                    if (partidosRaw != null) {
                        for (Map<String, Object> partRaw : partidosRaw) {
                            if ("Dobles".equals(torneoExistente.getCategoria())) {
                                String j1 = obtenerNombreJugadorSeguro(partRaw, "pareja1", "jugador1");
                                String j2 = obtenerNombreJugadorSeguro(partRaw, "pareja1", "jugador2");
                                String j3 = obtenerNombreJugadorSeguro(partRaw, "pareja2", "jugador1");
                                String j4 = obtenerNombreJugadorSeguro(partRaw, "pareja2", "jugador2");

                                if (!j1.isEmpty() && !j1.contains("BYE") && !nombresJugadores.add(j1)) return error("Jugador duplicado: " + j1);
                                if (!j2.isEmpty() && !j2.contains("BYE") && !nombresJugadores.add(j2)) return error("Jugador duplicado: " + j2);
                                if (!j3.isEmpty() && !j3.contains("BYE") && !nombresJugadores.add(j3)) return error("Jugador duplicado: " + j3);
                                if (!j4.isEmpty() && !j4.contains("BYE") && !nombresJugadores.add(j4)) return error("Jugador duplicado: " + j4);
                            } else {
                                String j1 = obtenerNombreJugadorSeguro(partRaw, null, "jugador1");
                                String j2 = obtenerNombreJugadorSeguro(partRaw, null, "jugador2");

                                if (!j1.isEmpty() && !j1.contains("BYE") && !nombresJugadores.add(j1)) return error("El jugador '" + j1 + "' está repetido.");
                                if (!j2.isEmpty() && !j2.contains("BYE") && !nombresJugadores.add(j2)) return error("El jugador '" + j2 + "' está repetido.");
                            }
                        }
                    }
                }
            }

            // --- 2. VERIFICAR QUE EXISTAN EN BD Y SEAN ROL 'JUGADOR' ---
            for (String nombreUser : nombresJugadores) {
                Optional<Usuario> userOpt = usuarioRepository.findByUsuario(nombreUser);
                if (userOpt.isEmpty()) {
                    return error("El usuario '" + nombreUser + "' no está registrado.");
                }
                if (!"JUGADOR".equals(userOpt.get().getRol().getNombre())) {
                    return error("El usuario '" + nombreUser + "' no tiene rol de JUGADOR.");
                }
            }

            // --- 3. ACTUALIZAR METADATOS BÁSICOS ---
            torneoExistente.setNombre(nuevoNombre);
            torneoExistente.setEstado(nuevoEstado);
            torneoExistente.setClasificacion(nuevaClasificacion);

            // --- 4. ASIGNAR LOS JUGADORES A LAS ENTIDADES REALES ---
            // --- 4. ASIGNAR LOS JUGADORES Y ESTADOS A LAS ENTIDADES REALES ---
            @SuppressWarnings("unchecked")
            int rondaIndex = 0;
            for (Map<String, Object> rRaw : rondasRaw) {
                if (rondaIndex < torneoExistente.getRondas().size()) {
                    Ronda rondaExistente = torneoExistente.getRondas().get(rondaIndex);
                    List<Map<String, Object>> partidosRaw = (List<Map<String, Object>>) rRaw.get("partidos");
                    
                    if (partidosRaw != null) {
                        int partidoIndex = 0;
                        for (Map<String, Object> pRaw : partidosRaw) {
                            if (partidoIndex < rondaExistente.getPartidos().size()) {
                                Partido pExistente = rondaExistente.getPartidos().get(partidoIndex);
                                
                                // NUEVO: Extraer y actualizar el estado del partido enviado desde el editor
                                if (pRaw.get("estado") != null) {
                                    pExistente.setEstado(pRaw.get("estado").toString());
                                }
                                
                                if ("Dobles".equals(torneoExistente.getCategoria())) {
                                    String nameJ1 = obtenerNombreJugadorSeguro(pRaw, "pareja1", "jugador1");
                                    String nameJ2 = obtenerNombreJugadorSeguro(pRaw, "pareja1", "jugador2");
                                    String nameJ3 = obtenerNombreJugadorSeguro(pRaw, "pareja2", "jugador1");
                                    String nameJ4 = obtenerNombreJugadorSeguro(pRaw, "pareja2", "jugador2");

                                    pExistente.setJugador1(!nameJ1.isEmpty() && !nameJ1.contains("BYE") ? usuarioRepository.findByUsuario(nameJ1).orElse(null) : null);
                                    pExistente.setJugador2(!nameJ2.isEmpty() && !nameJ2.contains("BYE") ? usuarioRepository.findByUsuario(nameJ2).orElse(null) : null);
                                    pExistente.setJugador3(!nameJ3.isEmpty() && !nameJ3.contains("BYE") ? usuarioRepository.findByUsuario(nameJ3).orElse(null) : null);
                                    pExistente.setJugador4(!nameJ4.isEmpty() && !nameJ4.contains("BYE") ? usuarioRepository.findByUsuario(nameJ4).orElse(null) : null);
                                } else {
                                    String nameJ1 = obtenerNombreJugadorSeguro(pRaw, null, "jugador1");
                                    String nameJ2 = obtenerNombreJugadorSeguro(pRaw, null, "jugador2");

                                    pExistente.setJugador1(!nameJ1.isEmpty() && !nameJ1.contains("BYE") ? usuarioRepository.findByUsuario(nameJ1).orElse(null) : null);
                                    pExistente.setJugador2(!nameJ2.isEmpty() && !nameJ2.contains("BYE") ? usuarioRepository.findByUsuario(nameJ2).orElse(null) : null);
                                }
                            }
                            partidoIndex++;
                        }
                    }
                }
                rondaIndex++;
            }

            Torneo torneoActualizado = torneoRepository.save(torneoExistente);
            return ResponseEntity.ok(torneoActualizado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error interno al modificar el torneo: " + e.getMessage());
        }
    }

    // Método auxiliar ultra seguro para extraer el string "nombre" o "usuario" sin importar cómo venga estructurado el mapa
    private String obtenerNombreJugadorSeguro(Map<String, Object> partidoMap, String parejaKey, String jugadorKey) {
        try {
            Map<String, Object> objetivo = partidoMap;
            
            // Si es dobles, bajamos un nivel ("pareja1" o "pareja2")
            if (parejaKey != null) {
                objetivo = (Map<String, Object>) partidoMap.get(parejaKey);
                if (objetivo == null) return "";
            }
            
            Object jugadorObj = objetivo.get(jugadorKey);
            if (jugadorObj == null) return "";
            
            if (jugadorObj instanceof Map) {
                Map<String, Object> jugadorMap = (Map<String, Object>) jugadorObj;
                if (jugadorMap.containsKey("nombre")) {
                    return (String) jugadorMap.get("nombre");
                } else if (jugadorMap.containsKey("usuario")) {
                    return (String) jugadorMap.get("usuario");
                }
            }
        } catch (Exception e) {
            // Si ocurre algún fallo de casteo, retorna un string vacío para no romper la petición
        }
        return "";
    }

    // --- 5. ELIMINAR TORNEO ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTorneo(@PathVariable Long id) {
        try {
            if (!torneoRepository.existsById(id)) {
                return error("El torneo que intenta eliminar no existe.");
            }
            torneoRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("mensaje", "Torneo eliminado con éxito."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("No se pudo eliminar el torneo debido a dependencias activas.");
        }
    }

    // Inyecta tu repositorio de partidos si no lo tienes en este controlador
    @Autowired
    private PartidoRepository partidoRepository; 

    @GetMapping("/partidos/{id}/verificar-arbitraje")
    public ResponseEntity<?> verificarEstadoArbitraje(@PathVariable Long id) {
        return partidoRepository.findById(id)
            .map(partido -> {
                String estadoActual = partido.getEstado();
                Map<String, Object> response = new HashMap<>();

                // ====================================================================
                // SOLUCIÓN: Soporte para Sencillos y Dobles (Extraer 4 jugadores)
                // ====================================================================
                String nombreJ1 = (partido.getJugador1() != null) ? partido.getJugador1().getUsuario() : "Invitado 1";
                String nombreJ2 = (partido.getJugador2() != null) ? partido.getJugador2().getUsuario() : "Invitado 2";
                String nombreJ3 = (partido.getJugador3() != null) ? partido.getJugador3().getUsuario() : null;
                String nombreJ4 = (partido.getJugador4() != null) ? partido.getJugador4().getUsuario() : null;
                
                response.put("jugador1", nombreJ1);
                response.put("jugador2", nombreJ2);
                
                // Si el partido cuenta con jugador 3 y jugador 4, se inyectan dinámicamente
                if (nombreJ3 != null || nombreJ4 != null) {
                    response.put("jugador3", nombreJ3 != null ? nombreJ3 : "Invitado 3");
                    response.put("jugador4", nombreJ4 != null ? nombreJ4 : "Invitado 4");
                    response.put("tipoModalidad", "Dobles");
                } else {
                    response.put("tipoModalidad", "Sencillos");
                }
                // ====================================================================

                // Regla estricta: Solo entran si está PROGRAMADO o SUSPENDIDO
                if ("PROGRAMADO".equalsIgnoreCase(estadoActual) || "SUSPENDIDO".equalsIgnoreCase(estadoActual)) {
                    response.put("permitido", true);
                    response.put("estado", estadoActual);
                    return ResponseEntity.ok(response);
                } else {
                    // Bloqueado si está EN_CURSO o FINALIZADO
                    response.put("permitido", false);
                    response.put("estado", estadoActual);

                    if ("EN_CURSO".equalsIgnoreCase(estadoActual)) {
                        response.put("mensaje", "El partido ya está siendo arbitrado en este momento.");
                    } else if ("FINALIZADO".equalsIgnoreCase(estadoActual)) {
                        response.put("mensaje", "El partido ya ha concluido y su marcador está cerrado.");
                    } else {
                        response.put("mensaje", "No es posible arbitrar este partido en su estado actual (" + estadoActual + ").");
                    }
                    return ResponseEntity.ok(response);
                }
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", "El partido con ID " + id + " no existe.")));
    }
    @PostMapping("/partidos/{id}/cambiar-estado")
    public ResponseEntity<?> cambiarEstadoPartido(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return partidoRepository.findById(id)
            .map(partido -> {
                String nuevoEstado = request.get("estado");
                partido.setEstado(nuevoEstado);
                partidoRepository.save(partido);
                return ResponseEntity.ok().body(Map.of("mensaje", "Estado actualizado con éxito"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerTorneoPorId(@PathVariable Long id) {
        Optional<Torneo> torneoOpt = torneoRepository.findById(id);
        
        if (torneoOpt.isPresent()) {
            return ResponseEntity.ok(torneoOpt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", "El torneo con ID " + id + " no existe."));
        }
    }

    // 1. Actualizar marcador y estadísticas en tiempo real
// DEJA SOLO ESTE MÉTODO EN TU TORNEOCONTROLLER:
@PostMapping("/partidos/{id}/actualizar-marcador")
@jakarta.transaction.Transactional
public ResponseEntity<?> actualizarMarcador(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
    return partidoRepository.findById(id)
        .map(partido -> {
            // 1. Puntos actuales ("0", "15", "30", "40", "AD")
            if (datos.get("puntaje1") != null) partido.setPuntosActualesJ1(datos.get("puntaje1").toString());
            if (datos.get("puntaje2") != null) partido.setPuntosActualesJ2(datos.get("puntaje2").toString());
            
            // 2. Sets ganados con casteo seguro vía Number
            if (datos.get("sets1") != null) partido.setSetsGanadosJ1(((Number) datos.get("sets1")).intValue());
            if (datos.get("sets2") != null) partido.setSetsGanadosJ2(((Number) datos.get("sets2")).intValue());
            
            // 3. Determinar el Set en curso (Set 1, Set 2 o Set 3)
            int setActual = partido.getSetsGanadosJ1() + partido.getSetsGanadosJ2() + 1;
            
            int games1 = datos.get("games1") != null ? ((Number) datos.get("games1")).intValue() : 0;
            int games2 = datos.get("games2") != null ? ((Number) datos.get("games2")).intValue() : 0;
            
            // Preservar el historial acumulado en memoria de cada Set
            if (setActual == 1) {
                partido.setGamesSet1J1(games1);
                partido.setGamesSet1J2(games2);
            } else if (setActual == 2) {
                partido.setGamesSet2J1(games1);
                partido.setGamesSet2J2(games2);
            } else {
                partido.setGamesSet3J1(games1);
                partido.setGamesSet3J2(games2);
            }

            // Cambiar estado a EN_JUEGO si estaba en PROGRAMADO
            if (!"FINALIZADO".equals(partido.getEstado()) && !"SUSPENDIDO".equals(partido.getEstado())) {
                partido.setEstado("EN_JUEGO");
            }
            
            // 🔥 Persistencia inmediata en PostgreSQL
            partidoRepository.save(partido);
            
            return ResponseEntity.ok(Map.of("mensaje", "Marcador actualizado con éxito en Base de Datos"));
        })
        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
}

@GetMapping("/partidos/{id}")
public ResponseEntity<?> obtenerPartidoPorId(@PathVariable Long id) {
    Optional<Partido> partidoOpt = partidoRepository.findById(id);
    
    if (partidoOpt.isPresent()) {
        return ResponseEntity.ok(partidoOpt.get()); // Devuelve el Partido si existe
    } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "El partido con ID " + id + " no existe en la base de datos.")); // Devuelve el error si no
    }
}

// 2. Finalizar el partido y avanzar al ganador en la estructura del torneo
@PostMapping("/partidos/{id}/finalizar")
@jakarta.transaction.Transactional
public ResponseEntity<?> finalizarPartido(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
    return partidoRepository.findById(id)
        .map(partido -> {
            if (datos.get("ganador") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No se especificó un ganador."));
            }

            String ganadorEnviado = datos.get("ganador").toString().trim();
            partido.setEstado("FINALIZADO");

            if (datos.get("setsGanadosJ1") != null) partido.setSetsGanadosJ1(((Number) datos.get("setsGanadosJ1")).intValue());
            if (datos.get("setsGanadosJ2") != null) partido.setSetsGanadosJ2(((Number) datos.get("setsGanadosJ2")).intValue());

            if (datos.get("gamesSet1J1") != null) partido.setGamesSet1J1(((Number) datos.get("gamesSet1J1")).intValue());
            if (datos.get("gamesSet1J2") != null) partido.setGamesSet1J2(((Number) datos.get("gamesSet1J2")).intValue());

            if (datos.get("gamesSet2J1") != null) partido.setGamesSet2J1(((Number) datos.get("gamesSet2J1")).intValue());
            if (datos.get("gamesSet2J2") != null) partido.setGamesSet2J2(((Number) datos.get("gamesSet2J2")).intValue());

            if (datos.get("gamesSet3J1") != null) partido.setGamesSet3J1(((Number) datos.get("gamesSet3J1")).intValue());
            if (datos.get("gamesSet3J2") != null) partido.setGamesSet3J2(((Number) datos.get("gamesSet3J2")).intValue());

            // Limpiar los puntos en vivo
            partido.setPuntosActualesJ1("0");
            partido.setPuntosActualesJ2("0");

            // =========================================================================
            // 0. VERIFICAR SI ES DOBLES O SENCILLOS DESDE TORNEO O JUGADORES
            // =========================================================================
            boolean esDobles = false;
            
            // Check 1: Vía Entidad Torneo (Usando el getter getCategoria())
            if (partido.getRonda() != null && partido.getRonda().getTorneo() != null) {
                String cat = partido.getRonda().getTorneo().getCategoria();
                if (cat != null && "Dobles".equalsIgnoreCase(cat.trim())) {
                    esDobles = true;
                }
            }
            
            // Check 2: Respando por si la relación de torneo fuera nula en partidos amistosos/libres
            if (!esDobles && (partido.getJugador3() != null || partido.getJugador4() != null)) {
                esDobles = true;
            }

            // =========================================================================
            // 1. DETERMINAR GANADOR
            // =========================================================================
            Usuario ganadorRep = null;

            if (!esDobles) {
                // SENCILLOS
                if (partido.getJugador1() != null && ganadorEnviado.equalsIgnoreCase(partido.getJugador1().getUsuario())) {
                    ganadorRep = partido.getJugador1();
                } else if (partido.getJugador2() != null && ganadorEnviado.equalsIgnoreCase(partido.getJugador2().getUsuario())) {
                    ganadorRep = partido.getJugador2();
                } else {
                    ganadorRep = usuarioRepository.findByUsuario(ganadorEnviado).orElse(null);
                }
            } else {
                // DOBLES
                boolean ganaPareja1 = false;
                boolean ganaPareja2 = false;

                // Verificar si ganó algún integrante de Pareja 1 (jugador1 o jugador2)
                if ((partido.getJugador1() != null && ganadorEnviado.toLowerCase().contains(partido.getJugador1().getUsuario().toLowerCase())) ||
                    (partido.getJugador2() != null && ganadorEnviado.toLowerCase().contains(partido.getJugador2().getUsuario().toLowerCase()))) {
                    ganaPareja1 = true;
                }

                // Verificar si ganó algún integrante de Pareja 2 (jugador3 o jugador4)
                if ((partido.getJugador3() != null && ganadorEnviado.toLowerCase().contains(partido.getJugador3().getUsuario().toLowerCase())) ||
                    (partido.getJugador4() != null && ganadorEnviado.toLowerCase().contains(partido.getJugador4().getUsuario().toLowerCase()))) {
                    ganaPareja2 = true;
                }

                // Usar a jugador1 como representante de Pareja 1, o jugador3 para Pareja 2
                if (ganaPareja1) {
                    ganadorRep = partido.getJugador1();
                } else if (ganaPareja2) {
                    ganadorRep = partido.getJugador3();
                }
            }

            partido.setGanador(ganadorRep);

            // =========================================================================
            // 2. GUARDAR ESTADÍSTICAS DEL PARTIDO (Se persisten para Sencillos y Dobles)
            // =========================================================================
            try {
                if (partido.getEstadisticas() == null) {
                    partido.setEstadisticas(new EstadisticaPartido());
                }

                EstadisticaPartido ep = partido.getEstadisticas();

                if (datos.get("statsJ1") != null) {
                    Map<String, Object> s1 = (Map<String, Object>) datos.get("statsJ1");
                    ep.setAcesJ1(Integer.parseInt(s1.getOrDefault("ace", 0).toString()));
                    ep.setDoblesFaltasJ1(Integer.parseInt(s1.getOrDefault("dobleFalta", 0).toString()));
                    ep.setErroresNoForzadosJ1(Integer.parseInt(s1.getOrDefault("errorNo", 0).toString()));
                    ep.setPuntosEnRedJ1(Integer.parseInt(s1.getOrDefault("red", 0).toString()));
                    ep.setWinnersJ1(Integer.parseInt(s1.getOrDefault("winner", 0).toString()));
                }

                if (datos.get("statsJ2") != null) {
                    Map<String, Object> s2 = (Map<String, Object>) datos.get("statsJ2");
                    ep.setAcesJ2(Integer.parseInt(s2.getOrDefault("ace", 0).toString()));
                    ep.setDoblesFaltasJ2(Integer.parseInt(s2.getOrDefault("dobleFalta", 0).toString()));
                    ep.setErroresNoForzadosJ2(Integer.parseInt(s2.getOrDefault("errorNo", 0).toString()));
                    ep.setPuntosEnRedJ2(Integer.parseInt(s2.getOrDefault("red", 0).toString()));
                    ep.setWinnersJ2(Integer.parseInt(s2.getOrDefault("winner", 0).toString()));
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error al mapear estadísticas del encuentro: " + e.getMessage());
            }

            partidoRepository.save(partido);

            // =========================================================================
            // 3. HISTÓRICO GENERAL (ÚNICAMENTE SI NO ES DOBLES)
            // =========================================================================
            if (!esDobles) {
                if (partido.getJugador1() != null && datos.get("statsJ1") != null) {
                    Map<String, Object> s1 = (Map<String, Object>) datos.get("statsJ1");
                    actualizarEstadisticasGlobales(partido.getJugador1(), s1, partido.getJugador1().equals(ganadorRep));
                }
                if (partido.getJugador2() != null && datos.get("statsJ2") != null) {
                    Map<String, Object> s2 = (Map<String, Object>) datos.get("statsJ2");
                    actualizarEstadisticasGlobales(partido.getJugador2(), s2, partido.getJugador2().equals(ganadorRep));
                }
            }

            // =========================================================================
            // 4. AVANCE DE RONDA EN EL CUADRO
            // =========================================================================
            Ronda rondaActual = partido.getRonda();
            if (rondaActual != null && rondaActual.getTorneo() != null) {
                Torneo torneo = rondaActual.getTorneo();

                // 1. Obtener y ORDENAR los partidos de la ronda actual por su ID
                List<Partido> partidosRondaActual = rondaActual.getPartidos().stream()
                        .sorted(java.util.Comparator.comparing(Partido::getId))
                        .collect(java.util.stream.Collectors.toList());

                int indicePartidoActual = partidosRondaActual.indexOf(partido);

                if (indicePartidoActual != -1) {
                    int numeroSiguienteRonda = rondaActual.getNumero() + 1;

                    Optional<Ronda> siguienteRondaOpt = torneo.getRondas().stream()
                            .filter(r -> r.getNumero() == numeroSiguienteRonda)
                            .findFirst();

                    if (siguienteRondaOpt.isPresent()) {
                        // 2. Obtener y ORDENAR los partidos de la siguiente ronda por su ID
                        List<Partido> partidosSiguienteRonda = siguienteRondaOpt.get().getPartidos().stream()
                                .sorted(java.util.Comparator.comparing(Partido::getId))
                                .collect(java.util.stream.Collectors.toList());

                        // 3. Índice matemático del partido destino: 0 y 1 van al 0, 2 y 3 van al 1, etc.
                        int indiceSiguientePartido = indicePartidoActual / 2;

                        if (indiceSiguientePartido < partidosSiguienteRonda.size()) {
                            Partido partidoSiguiente = partidosSiguienteRonda.get(indiceSiguientePartido);

                            // 4. Determinar si la llave actual es PAR (Jugador1/3) o IMPAR (Jugador2/4)
                            boolean esPosicion1 = (indicePartidoActual % 2 == 0);

                            if (!esDobles) {
                                // --- SENCILLOS ---
                                if (esPosicion1) {
                                    partidoSiguiente.setJugador1(ganadorRep);
                                } else {
                                    partidoSiguiente.setJugador2(ganadorRep);
                                }
                            } else {
                                // --- DOBLES ---
                                // Detección correcta: La Pareja 1 la forman jugador1 y jugador2
                                boolean ganaPareja1 = (partido.getJugador1() != null && partido.getJugador1().equals(ganadorRep))
                                                || (partido.getJugador2() != null && partido.getJugador2().equals(ganadorRep));

                                // Si gana Pareja 1: (jugador1, jugador2) | Si gana Pareja 2: (jugador3, jugador4)
                                Usuario integrante1 = ganaPareja1 ? partido.getJugador1() : partido.getJugador3();
                                Usuario integrante2 = ganaPareja1 ? partido.getJugador2() : partido.getJugador4();

                                if (esPosicion1) {
                                    // Pasa a ocupar el lado de Pareja 1 en el siguiente partido
                                    partidoSiguiente.setJugador1(integrante1);
                                    partidoSiguiente.setJugador2(integrante2);
                                } else {
                                    // Pasa a ocupar el lado de Pareja 2 en el siguiente partido
                                    partidoSiguiente.setJugador3(integrante1);
                                    partidoSiguiente.setJugador4(integrante2);
                                }
                            }

                            partidoRepository.save(partidoSiguiente);
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of("mensaje", "Partido finalizado. Se han registrado los marcadores correctamente."));
        })
        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
}


    private void actualizarEstadisticasGlobales(Usuario usuario, Map<String, Object> stats, boolean esGanador) {
        EstadisticaGeneral global = estadisticaGeneralRepository.findByUsuario(usuario)
                .orElseGet(() -> {
                    EstadisticaGeneral nuevo = new EstadisticaGeneral();
                    nuevo.setUsuario(usuario);
                    return nuevo;
                });

        global.setPartidosJugados(global.getPartidosJugados() + 1);
        if (esGanador) {
            global.setPartidosGanados(global.getPartidosGanados() + 1);
        }

        global.setAces(global.getAces() + Integer.parseInt(stats.getOrDefault("ace", 0).toString()));
        global.setDoblesFaltas(global.getDoblesFaltas() + Integer.parseInt(stats.getOrDefault("dobleFalta", 0).toString()));
        global.setErroresNoForzados(global.getErroresNoForzados() + Integer.parseInt(stats.getOrDefault("errorNo", 0).toString()));
        
        // Si en EstadisticaGeneral lo llamaste 'red', déjalo así. Si lo llamaste 'puntosEnRed', cámbialo a setPuntosEnRed
        global.setRed(global.getRed() + Integer.parseInt(stats.getOrDefault("red", 0).toString())); 
        
        global.setWinners(global.getWinners() + Integer.parseInt(stats.getOrDefault("winner", 0).toString()));

        estadisticaGeneralRepository.save(global);
    }


    // =========================================================================
// 🔥 SOLUCIÓN: Endpoint para recibir toda la carga útil de la suspensión
// =========================================================================
    @PostMapping("/partidos/{id}/suspender")
    @jakarta.transaction.Transactional
    public ResponseEntity<?> suspenderPartido(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        return partidoRepository.findById(id)
            .map(partido -> {
                // 1. Cambiar estado principal
                partido.setEstado("SUSPENDIDO");
                
                // 2. Almacenar el marcador exacto de puntos de tenis ("15", "30", "AD", etc.)
                partido.setPuntosActualesJ1(datos.get("puntosActualesJ1").toString());
                partido.setPuntosActualesJ2(datos.get("puntosActualesJ2").toString());
                
                // 3. Almacenar Sets de forma segura casteando a Number primero
                partido.setSetsGanadosJ1(((Number) datos.get("setsGanadosJ1")).intValue());
                partido.setSetsGanadosJ2(((Number) datos.get("setsGanadosJ2")).intValue());
                
                // 4. Mapear el historial completo de los Games por Set
                partido.setGamesSet1J1(((Number) datos.get("gamesSet1J1")).intValue());
                partido.setGamesSet1J2(((Number) datos.get("gamesSet1J2")).intValue());
                partido.setGamesSet2J1(((Number) datos.get("gamesSet2J1")).intValue());
                partido.setGamesSet2J2(((Number) datos.get("gamesSet2J2")).intValue());
                partido.setGamesSet3J1(((Number) datos.get("gamesSet3J1")).intValue());
                partido.setGamesSet3J2(((Number) datos.get("gamesSet3J2")).intValue());
                
                // 5. Persistir en la base de datos
                partidoRepository.save(partido);
                return ResponseEntity.ok(Map.of("mensaje", "Partido suspendido y congelado con éxito"));
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No se encontró el partido para suspender.")));
    }

}



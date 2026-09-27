package com.apptenis.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "partidos")
@Data
public class Partido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Estadísticas para Sencillos
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "estadisticas_id")
    private EstadisticaPartido estadisticas = new EstadisticaPartido();

    // Estadísticas para Dobles
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "estadisticas_dobles_id")
    private EstadisticaPartidoDobles estadisticasDobles = new EstadisticaPartidoDobles();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ronda_id")
    @JsonIgnore
    private Ronda ronda;

    // Relaciones a la tabla de usuarios (para Sencillos y Dobles)
    @ManyToOne
    @JoinColumn(name = "jugador1_id")
    private Usuario jugador1;

    @ManyToOne
    @JoinColumn(name = "jugador2_id")
    private Usuario jugador2;

    @ManyToOne
    @JoinColumn(name = "jugador3_id") // Dobles: Pareja 1 - Jugador 2
    private Usuario jugador3;

    @ManyToOne
    @JoinColumn(name = "jugador4_id") // Dobles: Pareja 2 - Jugador 2
    private Usuario jugador4;

    @ManyToOne
    @JoinColumn(name = "ganador_id")
    private Usuario ganador;

    // --- MARCADOR EN VIVO DE TENIS ---
    private String puntosActualesJ1 = "0"; // "0", "15", "30", "40", "A"
    private String puntosActualesJ2 = "0";

    private int gamesSet1J1 = 0;
    private int gamesSet1J2 = 0;

    private int gamesSet2J1 = 0;
    private int gamesSet2J2 = 0;

    private int gamesSet3J1 = 0;
    private int gamesSet3J2 = 0;

    private int setsGanadosJ1 = 0;
    private int setsGanadosJ2 = 0;

    private String estado = "PROGRAMADO"; // "PROGRAMADO", "EN_CURSO", "FINALIZADO"

    @ManyToOne
    @JoinColumn(name = "juez_id")
    private Usuario juez;
}
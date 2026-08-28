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

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "estadisticas_id")
    private EstadisticaPartido estadisticas = new EstadisticaPartido();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ronda_id") // Asegúrate de que coincida con el nombre de la columna en tu BD
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
    @JoinColumn(name = "jugador3_id") // Se usa si es Dobles (Pareja 1 - J2)
    private Usuario jugador3; // <- Cambiado de Optional<Usuario> a Usuario

    @ManyToOne
    @JoinColumn(name = "jugador4_id") // Se usa si es Dobles (Pareja 2 - J2)
    private Usuario jugador4; // <- Cambiado de Optional<Usuario> a Usuario

    @ManyToOne
    @JoinColumn(name = "ganador_id") // Columna en la BD para guardar el objeto Usuario que ganó
    private Usuario ganador;

    // --- MARCADOR EN VIVO DE TENIS ---
    private String puntosActualesJ1 = "0"; // "0", "15", "30", "40", "A"
    private String puntosActualesJ2 = "0";

    private int gamesSet1J1 = 0;
    private int gamesSet1J2 = 0;

    private int gamesSet2J1 = 0;
    private int gamesSet2J2 = 0;

    private int gamesSet3J1 = 0; // Por si se van a un 3er Set definitivo
    private int gamesSet3J2 = 0;

    private int setsGanadosJ1 = 0;
    private int setsGanadosJ2 = 0;

    private String estado = "PROGRAMADO"; // "PROGRAMADO", "EN_CURSO", "FINALIZADO"

    @ManyToOne
    @JoinColumn(name = "juez_id") // Juez asignado para llevar el partido
    private Usuario juez;

}
package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "estadisticas_partidos")
@Data
public class EstadisticaPartido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Estadísticas Jugador/Pareja 1 ---
    private int acesJ1 = 0;
    private int doblesFaltasJ1 = 0;
    private int erroresNoForzadosJ1 = 0;
    private int puntosEnRedJ1 = 0;
    private int winnersJ1 = 0;

    // --- Estadísticas Jugador/Pareja 2 ---
    private int acesJ2 = 0;
    private int doblesFaltasJ2 = 0;
    private int erroresNoForzadosJ2 = 0;
    private int puntosEnRedJ2 = 0;
    private int winnersJ2 = 0;
}
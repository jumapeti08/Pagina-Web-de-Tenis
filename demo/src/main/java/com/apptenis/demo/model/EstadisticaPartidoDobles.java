package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "estadisticas_partidos_dobles")
@Data
public class EstadisticaPartidoDobles {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con el partido al que pertenecen estas estadísticas
    @OneToOne
    @JoinColumn(name = "partido_id", referencedColumnName = "id")
    @JsonIgnore // Evita ciclos infinitos al serializar a JSON
    private Partido partido;

    // Pareja 1 (Jugador 1)
    private int acesJ1 = 0;
    private int doblesFaltasJ1 = 0;
    private int erroresNoForzadosJ1 = 0;
    private int puntosEnRedJ1 = 0;
    private int winnersJ1 = 0;
    private int primerFaltaJ1 = 0;
    private int errorForzadoJ1 = 0;

    // Pareja 1 (Jugador 2)
    private int acesJ2 = 0;
    private int doblesFaltasJ2 = 0;
    private int erroresNoForzadosJ2 = 0;
    private int puntosEnRedJ2 = 0;
    private int winnersJ2 = 0;
    private int primerFaltaJ2 = 0;
    private int errorForzadoJ2 = 0;

    // Pareja 2 (Jugador 3)
    private int acesJ3 = 0;
    private int doblesFaltasJ3 = 0;
    private int erroresNoForzadosJ3 = 0;
    private int puntosEnRedJ3 = 0;
    private int winnersJ3 = 0;
    private int primerFaltaJ3 = 0;
    private int errorForzadoJ3 = 0;

    // Pareja 2 (Jugador 4)
    private int acesJ4 = 0;
    private int doblesFaltasJ4 = 0;
    private int erroresNoForzadosJ4 = 0;
    private int puntosEnRedJ4 = 0;
    private int winnersJ4 = 0;
    private int primerFaltaJ4 = 0;
    private int errorForzadoJ4 = 0;
}
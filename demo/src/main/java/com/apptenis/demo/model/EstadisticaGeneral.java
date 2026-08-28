package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "estadisticas_generales")
@Data
public class EstadisticaGeneral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private int partidosJugados = 0;
    private int partidosGanados = 0;
    private int aces = 0;
    private int doblesFaltas = 0;
    private int erroresNoForzados = 0;
    private int red = 0;
    private int winners = 0;
}
package com.apptenis.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "rondas")
@Data
public class Ronda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "numero_ronda")
    private int numero; // Número de la ronda (1, 2, 3...)

    // 1. Relación bidireccional con Torneo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "torneo_id") // Esta columna se creará en la tabla rondas
    @JsonIgnore // Evita ciclos infinitos al serializar a JSON
    private Torneo torneo;

    // 2. 🔥 ESTO ES LO QUE FALTA: Cascade hacia partidos mapeado por el atributo 'ronda' de la clase Partido
    @OneToMany(mappedBy = "ronda", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Partido> partidos;
}
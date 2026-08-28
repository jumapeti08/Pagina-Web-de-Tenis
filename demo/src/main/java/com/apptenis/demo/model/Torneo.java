package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "torneos")
@Data
public class Torneo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String categoria;    // "Sencillos" o "Dobles"
    
    // 🔥 NUEVO: Atributo para guardar "Futuro 50", "Futuro 100", "Futuro 250", etc.
    @Column(name = "clasificacion")
    private String clasificacion; 

    private String estado;       // "SIN_JUGAR", "EN_CURSO", "FINALIZADO"

    // CascadeType.ALL guarda automáticamente las rondas cuando guardas el torneo
    @OneToMany(mappedBy = "torneo", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Ronda> rondas;
}
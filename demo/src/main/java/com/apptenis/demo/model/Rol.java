package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "roles")
@Data
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nombre; // Aquí se guardará: 'ADMINISTRADOR', 'JUEZ', 'JUGADOR'
}
package com.apptenis.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario; // Nombre visible o completo del usuario

    @Column(name = "nombre_acceso", unique = true, nullable = false)
    private String nombreAcceso; // Identificador único para hacer login

    @Column(nullable = true)
    private String correo; // Inicia como null por defecto

    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;
}
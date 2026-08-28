package com.apptenis.demo.DTOs;

public class UsuarioDTO {
    private String username;
    private String nombreCompleto;

    // Constructor vacío
    public UsuarioDTO() {
    }

    // Constructor con parámetros
    public UsuarioDTO(String username, String nombreCompleto) {
        this.username = username;
        this.nombreCompleto = nombreCompleto;
    }

    // Getters y Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }
}

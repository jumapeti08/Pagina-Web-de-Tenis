package com.apptenis.demo.DTOs;

public class ActualizarPerfilDTO {

    private String usuarioActual;
    private String nuevoUsuario;
    private String email;
    private String password;

    public ActualizarPerfilDTO() {
    }

    public String getUsuarioActual() {
        return usuarioActual;
    }

    public void setUsuarioActual(String usuarioActual) {
        this.usuarioActual = usuarioActual;
    }

    public String getNuevoUsuario() {
        return nuevoUsuario;
    }

    public void setNuevoUsuario(String nuevoUsuario) {
        this.nuevoUsuario = nuevoUsuario;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
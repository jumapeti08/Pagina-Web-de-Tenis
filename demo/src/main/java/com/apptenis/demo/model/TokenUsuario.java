package com.apptenis.demo.model;

public class TokenUsuario {
    private String contenido;
    private Rol rol;
    private String usuario;

    // Constructor vacío
    public TokenUsuario() {
    }

    // Constructor anterior (2 parámetros)
    public TokenUsuario(String contenido, Rol rol) {
        this.contenido = contenido;
        this.rol = rol;
    }

    // 🔥 Constructor nuevo (3 parámetros)
    public TokenUsuario(String contenido, Rol rol, String usuario) {
        this.contenido = contenido;
        this.rol = rol;
        this.usuario = usuario;
    }

    // Getters y Setters
    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }
}
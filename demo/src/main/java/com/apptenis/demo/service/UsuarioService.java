package com.apptenis.demo.service;

import com.apptenis.demo.model.Usuario;
import com.apptenis.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Usuario> buscarJugadoresPorNombre(String query) {
        return usuarioRepository.findByUsuarioContainingIgnoreCase(query);
    }
}
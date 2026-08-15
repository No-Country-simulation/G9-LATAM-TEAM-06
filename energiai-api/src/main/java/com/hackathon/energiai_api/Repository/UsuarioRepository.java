package com.hackathon.energiai_api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hackathon.energiai_api.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    /** Incremento atómico del contador correlativo de análisis por usuario. */
    @Modifying
    @Query("update Usuario u set u.contadorAnalisis = u.contadorAnalisis + 1 where u.id = :id")
    int incrementarContador(@Param("id") Long id);

    @Query("select u.contadorAnalisis from Usuario u where u.id = :id")
    Integer obtenerContadorAnalisis(@Param("id") Long id);
}
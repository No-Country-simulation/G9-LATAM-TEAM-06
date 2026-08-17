package com.hackathon.energiai_api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hackathon.energiai_api.model.Analisis;

@Repository
public interface AnalisisRepository extends JpaRepository<Analisis, Long> {

    Page<Analisis> findByUsuarioId(String usuarioId, Pageable pageable);

    Page<Analisis> findByUsuarioIdAndCategoria(String usuarioId, String categoria, Pageable pageable);

    long deleteByUsuarioId(String usuarioId);
}

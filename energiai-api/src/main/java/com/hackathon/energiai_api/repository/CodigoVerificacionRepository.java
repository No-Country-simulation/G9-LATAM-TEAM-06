package com.hackathon.energiai_api.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hackathon.energiai_api.model.CodigoVerificacion;

@Repository
public interface CodigoVerificacionRepository extends JpaRepository<CodigoVerificacion, Long> {

    Optional<CodigoVerificacion> findByEmailAndUsadoFalse(String email);

    Optional<CodigoVerificacion> findByEmail(String email);

    long countByIpOrigenAndCreadoEnAfter(String ipOrigen, LocalDateTime desde);
}
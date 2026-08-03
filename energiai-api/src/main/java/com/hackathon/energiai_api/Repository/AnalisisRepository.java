package com.hackathon.energiai_api.Repository;

import com.hackathon.energiai_api.model.Analisis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalisisRepository extends JpaRepository <Analisis, Long> {
}

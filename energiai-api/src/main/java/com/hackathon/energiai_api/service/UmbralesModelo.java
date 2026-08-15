package com.hackathon.energiai_api.service;

/** Umbrales de dominio del modelo, centralizados para evitar divergencias entre servicios. */
public final class UmbralesModelo {

    /** Consumo a partir del cual el respaldo clasifica como ineficiente. */
    public static final int CONSUMO_INEFICIENTE = 800;

    /** Horas de alto consumo para clasificar como ineficiente en el respaldo. */
    public static final int HORAS_ALTO_CONSUMO_CLASIFICACION = 8;

    /** Consumo por debajo del cual el respaldo clasifica como eficiente. */
    public static final int CONSUMO_EFICIENTE = 300;

    /** Horas de alto consumo que disparan la recomendación de distribuir la demanda. */
    public static final int HORAS_ALTO_CONSUMO_RECOMENDACION = 6;

    private UmbralesModelo() {
    }
}
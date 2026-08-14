package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.DTOs.RecomendacionModelo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class RecomendacionServiceTest {

    @InjectMocks
    private RecomendacionService recomendacionService;

    @Test
    void generarRecomendaciones_conRequestNull_debeRetornarListaVacia() {
        List<String> resultado = recomendacionService.generarRecomendaciones(null);
        assertThat(resultado).isEmpty();
    }

    @Test
    void generarRecomendaciones_conUsoHorarioPicoTrue_debeIncluirRecomendacionPico() {
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Reducir el uso de equipos durante horarios pico");
    }

    @Test
    void generarRecomendaciones_conDistribucion_debeIncluirLasTresCategorias() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 10, "Casa", 6,
                null, null, null, null, null, null,
                "user1", null, 2, 3, 5
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains(
                "Priorizar el uso eficiente y mantenimiento de los equipos de mayor demanda",
                "Programar y agrupar el uso de los equipos de consumo medio para evitar funcionamiento innecesario",
                "Desconectar o suspender los equipos de bajo consumo cuando no estén en uso para reducir consumos acumulados"
        );
    }

    @Test
    void generarRecomendaciones_conMuchasHorasAltoConsumo_debeIncluirRecomendacionDistribuir() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 5, "Casa", 8,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Distribuir actividades de mayor consumo a lo largo del día");
    }

    @Test
    void generarRecomendaciones_perfilEficiente_debeRetornarRecomendacionDefault() {
        AnalisisRequest request = new AnalisisRequest(
                200, false, 3, "Casa", 2,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Mantener los buenos hábitos de consumo actuales y monitorear periódicamente");
    }

    @Test
    void generarRecomendaciones_conModeloResponse_debeUsarRecomendacionesDelModelo() {
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Ineficiente",
                0.85,
                "avanzado",
                List.of(),
                List.of(new RecomendacionModelo("rec_test", "Recomendación del modelo IA", 0.9))
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request, modeloResponse);

        assertThat(resultado).contains("Recomendación del modelo IA");
    }

    @Test
    void generarRecomendaciones_sinEquiposAltos_noDebeRecomendarEquiposAltos() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 10, "Casa", 2,
                null, null, 0, null, null, null,
                "user1", null, 0, 4, 6
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).noneMatch(texto -> texto.contains("mayor demanda"));
        assertThat(resultado).anyMatch(texto -> texto.contains("consumo medio"));
        assertThat(resultado).anyMatch(texto -> texto.contains("bajo consumo"));
    }

    @Test
    void generarRecomendaciones_conAccionConcreta_noDebeMantenerHabitos() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 5, "Casa", 2,
                null, null, null, null, null, null,
                "user1@example.com", null, 1, 2, 2
        );
        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Eficiente",
                0.85,
                "basico",
                List.of(),
                List.of(
                        new RecomendacionModelo("rec_mantener_habitos", "Mantener hábitos", 0.8),
                        new RecomendacionModelo("rec_mejorar_eficiencia_inmueble", "Mejorar eficiencia", 0.7)
                )
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request, modeloResponse);

        assertThat(resultado).containsExactly("Mejorar eficiencia");
    }
}

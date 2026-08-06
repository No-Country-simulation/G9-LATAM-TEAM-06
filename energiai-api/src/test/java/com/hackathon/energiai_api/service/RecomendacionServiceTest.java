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
                250, true, 5, "Residencial", 6,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Reducir el uso de equipos durante horarios pico");
    }

    @Test
    void generarRecomendaciones_conMuchosEquipos_debeIncluirRecomendacionEquipos() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 10, "Residencial", 6,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Evaluar aparatos con alto consumo electrico");
    }

    @Test
    void generarRecomendaciones_conMuchasHorasAltoConsumo_debeIncluirRecomendacionDistribuir() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 5, "Residencial", 8,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Distribuir actividades de mayor consumo a lo largo del día");
    }

    @Test
    void generarRecomendaciones_perfilEficiente_debeRetornarRecomendacionDefault() {
        AnalisisRequest request = new AnalisisRequest(
                100, false, 3, "Residencial", 2,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        List<String> resultado = recomendacionService.generarRecomendaciones(request);

        assertThat(resultado).contains("Mantener los buenos hábitos de consumo actuales y monitorear periódicamente");
    }

    @Test
    void generarRecomendaciones_conModeloResponse_debeUsarRecomendacionesDelModelo() {
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Residencial", 6,
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
}
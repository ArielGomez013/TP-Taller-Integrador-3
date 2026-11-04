package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CursoDTO {
    private Long idCurso;
    // Validaciones de Bean
    @NotNull(message = "El año de cursado es obligatorio")
    @Min(value = 1, message = "El año de cursado debe ser al menos 1")
    private Integer anioCursado;

    @NotBlank(message = "La división es obligatoria")
    private String division;

    @NotNull(message = "La capacidad máxima es obligatoria")
    @Min(value = 1, message = "La capacidad debe ser mayor a 0")
    private Integer capacidadMaxima;

    @NotNull(message = "El ID del ciclo lectivo es obligatorio")
    private Long idCiclo;


    private Integer anioCiclo; // Campo informativo que se devuelve al frontend
}
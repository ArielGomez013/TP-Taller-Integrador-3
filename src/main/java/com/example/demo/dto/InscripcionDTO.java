package com.example.demo.dto;

import com.example.demo.enums.EstadoInscripcion;

import java.time.LocalDate;

public record InscripcionDTO(
        Long id,
        Long alumnoId,
        Long cursoId,
        LocalDate fecha,
        EstadoInscripcion estado) {}
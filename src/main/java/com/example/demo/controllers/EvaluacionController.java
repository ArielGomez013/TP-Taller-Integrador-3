package com.example.demo.controllers;

import com.example.demo.dto.CalificacionDTO;
import com.example.demo.dto.CalificacionRequest;
import com.example.demo.dto.EvaluacionDTO;
import com.example.demo.dto.EvaluacionRequest;
import com.example.demo.dto.EvaluacionUpdateRequest;
import com.example.demo.services.CalificacionService;
import com.example.demo.services.EvaluacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private final EvaluacionService service;
    private final CalificacionService calificacionService;

    // RF36
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluacionDTO registrar(@Valid @RequestBody EvaluacionRequest req) {
        return service.registrar(req);
    }

    // RF37
    @GetMapping("/{id}")
    public EvaluacionDTO obtener(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/curso/{cursoId}")
    public List<EvaluacionDTO> porCurso(@PathVariable Long cursoId) {
        return service.porCurso(cursoId);
    }

    @GetMapping("/curso-materia/{cursoMateriaId}")
    public List<EvaluacionDTO> porCursoMateria(@PathVariable Long cursoMateriaId) {
        return service.porCursoMateria(cursoMateriaId);
    }

    @PutMapping("/{id}")
    public EvaluacionDTO modificar(@PathVariable Long id,
                                   @Valid @RequestBody EvaluacionUpdateRequest req) {
        return service.modificar(id, req);
    }

    // POST /api/evaluaciones/{id}/calificaciones — Registra una calificación para esta evaluación
    @PostMapping("/{id}/calificaciones")
    @ResponseStatus(HttpStatus.CREATED)
    public CalificacionDTO registrarCalificacion(
            @PathVariable Long id,
            @Valid @RequestBody CalificacionRequest req) {
        // Forzamos el evaluacionId desde la URL para coherencia REST
        CalificacionRequest reqConId = new CalificacionRequest(
                req.docenteId(),
                req.inscripcionId(),
                id,
                req.nota(),
                req.observaciones()
        );
        return calificacionService.registrar(reqConId);
    }

    // GET /api/evaluaciones/{id}/calificaciones — Lista calificaciones de esta evaluación
    @GetMapping("/{id}/calificaciones")
    public List<CalificacionDTO> calificacionesPorEvaluacion(@PathVariable Long id) {
        return calificacionService.porEvaluacion(id);
    }
}

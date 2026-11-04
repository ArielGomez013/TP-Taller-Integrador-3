package com.example.demo.controllers;

import com.example.demo.dto.AsistenciaCursoRequest;
import com.example.demo.dto.AsistenciaDTO;
import com.example.demo.dto.CursoDTO;
import com.example.demo.entities.Curso;
import com.example.demo.services.AsistenciaService;
import com.example.demo.services.CursoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cursos") // Ruta base de la API REST para Cursos
public class CursoController {

    @Autowired
    private CursoService cursoService;

    @Autowired
    private AsistenciaService asistenciaService;

    @GetMapping
    public ResponseEntity<List<Curso>> listar(@RequestParam(required = false) Long idCiclo) {
        if (idCiclo != null) {
            return ResponseEntity.ok(cursoService.listarPorCiclo(idCiclo));
        }
        return ResponseEntity.ok(cursoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Curso> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(cursoService.buscarPorId(id));
    }

    // POST /api/cursos (Crea un curso nuevo)
    // Devuelve código HTTP 201
    @PostMapping
    public ResponseEntity<Curso> crear(@Valid @RequestBody CursoDTO dto) {
        return new ResponseEntity<>(cursoService.crear(dto), HttpStatus.CREATED);
    }

    // POST /api/cursos/{id}/asistencias — se registra asistencias para este curso
    @PostMapping("/{id}/asistencias")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AsistenciaDTO> registrarAsistencias(
            @PathVariable Long id,
            @Valid @RequestBody AsistenciaCursoRequest req) {
        // se fuerza el cursoId desde la URL para una coherencia REST
        AsistenciaCursoRequest reqConId = new AsistenciaCursoRequest(
                req.docenteId(),
                id,
                req.fecha(),
                req.asistencias()
        );
        return asistenciaService.registrar(reqConId);
    }
}

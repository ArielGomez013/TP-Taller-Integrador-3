package com.example.demo.controllers;

import com.example.demo.dto.CuotaDTO;
import com.example.demo.dto.SituacionAdministrativaDTO;
import com.example.demo.entities.Alumno;
import com.example.demo.services.AlumnoService;
import com.example.demo.services.CuotaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/alumnos")
public class AlumnoController {

    private final AlumnoService alumnoService;
    private final CuotaService cuotaService;

    public AlumnoController(AlumnoService alumnoService, CuotaService cuotaService) {
        this.alumnoService = alumnoService;
        this.cuotaService = cuotaService;
    }

    @GetMapping
    public List<Alumno> listar() {
        return alumnoService.listar();
    }

    @GetMapping("/{id}")
    public Optional<Alumno> buscarPorId(@PathVariable Long id) {
        return alumnoService.buscarPorId(id);
    }

    @PostMapping
    public Alumno guardar(@RequestBody Alumno alumno) {
        return alumnoService.guardar(alumno);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        alumnoService.eliminar(id);
    }

    @PutMapping("/{id}")
    public Alumno actualizar(
            @PathVariable Long id,
            @RequestBody Alumno alumno) {

        Alumno existente = alumnoService.buscarPorId(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Alumno no encontrado"
                        ));

        alumno.setIdAlumno(existente.getIdAlumno());

        return alumnoService.guardar(alumno);
    }

    // [RF-14] GET /api/alumnos/{id}/cuotas — Lista todas las cuotas del alumno
    @GetMapping("/{id}/cuotas")
    public ResponseEntity<List<CuotaDTO>> cuotasPorAlumno(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cuotaService.cuotasPorAlumno(id));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // [RF-14] GET /api/alumnos/{id}/situacion-administrativa — Situación administrativa completa
    @GetMapping("/{id}/situacion-administrativa")
    public ResponseEntity<SituacionAdministrativaDTO> situacionAdministrativa(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cuotaService.situacionAdministrativa(id));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}

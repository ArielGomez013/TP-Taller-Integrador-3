package com.example.demo.services;

import com.example.demo.entities.Cuota;
import com.example.demo.entities.Matricula;
import com.example.demo.exceptions.ReglaNegocioException;
import com.example.demo.repositories.MatriculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MatriculaService {

    @Autowired
    private MatriculaRepository matriculaRepository;

    public List<Matricula> listar() {
        return matriculaRepository.findAll();
    }

    public Optional<Matricula> buscarPorId(Long id) {
        return matriculaRepository.findById(id);
    }

    public List<Matricula> buscarPorAlumno(Long idAlumno) {
        return matriculaRepository.findByAlumnoIdAlumno(idAlumno);
    }

    public Matricula guardar(Matricula matricula) {
        // RN: un alumno solo puede tener una matrícula por ciclo lectivo
        if (matricula.getIdMatricula() == null
                && matriculaRepository.existsByAlumnoAndCicloLectivo(
                matricula.getAlumno(), matricula.getCicloLectivo())) {
            throw new ReglaNegocioException("El alumno ya está matriculado en este ciclo lectivo");
        }
        return matriculaRepository.save(matricula);
    }

    @Transactional
    public Matricula cambiarEstado(Long idMatricula, String nuevoEstado) {
        Matricula matricula = matriculaRepository.findById(idMatricula)
                .orElseThrow(() -> new RuntimeException("Matrícula no encontrada"));

        matricula.setEstado(nuevoEstado);

        // [RN22] Al cancelar una matrícula, sus cuotas sin pagos pasan automáticamente a ANULADA
        if ("CANCELADA".equals(nuevoEstado)) {
            if (matricula.getCuotas() != null) {
                for (Cuota cuota : matricula.getCuotas()) {
                    if (cuota.getPagos() == null || cuota.getPagos().isEmpty()) {
                        cuota.setEstado("ANULADA");
                    }
                }
            }
        }
        return matriculaRepository.save(matricula);
    }
}

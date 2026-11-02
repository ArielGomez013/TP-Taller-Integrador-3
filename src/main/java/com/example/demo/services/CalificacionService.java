package com.example.demo.services;

import com.example.demo.dto.CalificacionDTO;
import com.example.demo.dto.CalificacionRequest;
import com.example.demo.dto.CalificacionUpdateRequest;
import com.example.demo.entities.*;
import com.example.demo.enums.EstadoInscripcion;
import com.example.demo.exceptions.RecursoNoEncontradoException;
import com.example.demo.exceptions.ReglaNegocioException;
import com.example.demo.repositories.AlumnoRepository;
import com.example.demo.repositories.CalificacionRepository;
import com.example.demo.repositories.EvaluacionRepository;
import com.example.demo.repositories.InscripcionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final InscripcionRepository inscripcionRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final AlumnoRepository alumnoRepository;

    // RF38
    @Transactional
    public CalificacionDTO registrar(CalificacionRequest req) {
        Inscripcion inscripcion = inscripcionRepository.findById(req.inscripcionId())
                .orElseThrow(() -> new RecursoNoEncontradoException("inscripción", req.inscripcionId()));
        Evaluacion evaluacion = evaluacionRepository.findById(req.evaluacionId())
                .orElseThrow(() -> new RecursoNoEncontradoException("evaluación", req.evaluacionId()));

        // RN12
        verificarDocente(req.docenteId(), evaluacion.getCursoMateria());

        // RN14
        if (inscripcion.getEstado() != EstadoInscripcion.ACTIVA) {
            throw new ReglaNegocioException("La inscripción no está activa");
        }
        Long cursoDelAlumno = inscripcion.getCurso().getIdCurso();
        Long cursoDeLaEvaluacion = evaluacion.getCursoMateria().getCurso().getIdCurso();
        if (!cursoDelAlumno.equals(cursoDeLaEvaluacion)) {
            throw new ReglaNegocioException("El alumno no está inscripto en el curso de esta evaluación");
        }

        // RN15: una sola nota por alumno y evaluación
        if (calificacionRepository.existsByInscripcionAndEvaluacion(inscripcion, evaluacion)) {
            throw new ReglaNegocioException("El alumno ya tiene una calificación en esta evaluación");
        }

        Calificacion calificacion = new Calificacion();
        calificacion.setInscripcion(inscripcion);
        calificacion.setEvaluacion(evaluacion);
        calificacion.setNota(req.nota());
        calificacion.setObservacion(req.observaciones());
        if (!calificacion.esNotaValida()) {
            throw new ReglaNegocioException("La nota debe estar entre 1 y 10");
        }
        return aDTO(calificacionRepository.save(calificacion));
    }

    // RF39
    @Transactional
    public CalificacionDTO modificar(Long id, CalificacionUpdateRequest req) {
        Calificacion calificacion = calificacionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("calificación", id));

        verificarDocente(req.docenteId(), calificacion.getEvaluacion().getCursoMateria());

        calificacion.setNota(req.nota());
        calificacion.setObservacion(req.observacion());
        if (!calificacion.esNotaValida()) {
            throw new ReglaNegocioException("La nota debe estar entre 1 y 10");
        }
        return aDTO(calificacion);
    }

    // RF40
    @Transactional(readOnly = true)
    public List<CalificacionDTO> porAlumno(Long alumnoId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("alumno", alumnoId));
        return calificacionRepository.findByInscripcionAlumno(alumno).stream().map(this::aDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<CalificacionDTO> porEvaluacion(Long evaluacionId) {
        Evaluacion evaluacion = evaluacionRepository.findById(evaluacionId)
                .orElseThrow(() -> new RecursoNoEncontradoException("evaluación", evaluacionId));
        return calificacionRepository.findByEvaluacion(evaluacion).stream().map(this::aDTO).toList();
    }

    // RN12: acá se DEFINE. Solo compara, no consulta la base.
    private void verificarDocente(Long docenteId, CursoMateria cursoMateria) {
        Docente asignado = cursoMateria.getDocente();
        if (asignado == null || !asignado.getIdDocente().equals(docenteId)) {
            throw new ReglaNegocioException("El docente no tiene asignada esta materia en el curso");
        }
    }

    private CalificacionDTO aDTO(Calificacion c) {
        return new CalificacionDTO(
                c.getIdCalificacion(),
                c.getInscripcion().getIdInscripcion(),
                c.getEvaluacion().getIdEvaluacion(),
                c.getInscripcion().getAlumno().getIdAlumno(),
                c.getNota(),
                c.getObservacion());
    }
}
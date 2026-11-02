package com.example.demo.services;

import com.example.demo.dto.AsistenciaCursoRequest;
import com.example.demo.dto.AsistenciaDTO;
import com.example.demo.dto.AsistenciaItem;
import com.example.demo.dto.ResumenAsistencia;
import com.example.demo.entities.Alumno;
import com.example.demo.entities.Asistencia;
import com.example.demo.entities.Asistencia.EstadoAsistencia;
import com.example.demo.entities.Curso;
import com.example.demo.entities.Inscripcion;
import com.example.demo.enums.EstadoInscripcion;
import com.example.demo.exceptions.RecursoNoEncontradoException;
import com.example.demo.exceptions.ReglaNegocioException;
import com.example.demo.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;
    private final InscripcionRepository inscripcionRepository;
    private final AlumnoRepository alumnoRepository;
    private final CursoRepository cursoRepository;// de tus compañeros
    private final CursoMateriaRepository cursoMateriaRepository; // de tus compañeros (nombre a confirmar)

    // RF41: registra la asistencia de un curso en una fecha
    @Transactional
    public List<AsistenciaDTO> registrar(AsistenciaCursoRequest req) {
        Curso curso = cursoRepository.findById(req.cursoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("curso", req.cursoId()));

        if (!cursoMateriaRepository.existsByCursoIdCursoAndDocenteIdDocente(curso.getIdCurso(), req.docenteId())) {
            throw new ReglaNegocioException("El docente no tiene asignado este curso (RN13)");
        }

        List<AsistenciaDTO> registradas = new ArrayList<>();
        for (AsistenciaItem item : req.asistencias()) {
            Inscripcion inscripcion = inscripcionRepository.findById(item.inscripcionId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("inscripción", item.inscripcionId()));

            if (inscripcion.getEstado() != EstadoInscripcion.ACTIVA) {
                throw new ReglaNegocioException("La inscripción " + item.inscripcionId() + " no está activa");
            }
            if (!inscripcion.getCurso().getIdCurso().equals(curso.getIdCurso())) {
                throw new ReglaNegocioException("La inscripción " + item.inscripcionId() + " no pertenece a ese curso");
            }
            // RN16: una única asistencia por alumno, curso y fecha
            if (asistenciaRepository.existsByInscripcionAndFecha(inscripcion, req.fecha())) {
                throw new ReglaNegocioException("Ya hay asistencia registrada para la inscripción "
                        + item.inscripcionId() + " en esa fecha");
            }

            Asistencia asistencia = new Asistencia();
            asistencia.setInscripcion(inscripcion);
            asistencia.setFecha(req.fecha());
            com.example.demo.entities.Asistencia.EstadoAsistencia estadoEnum = com.example.demo.entities.Asistencia.EstadoAsistencia.valueOf(item.estado().name());
            asistencia.setEstado(estadoEnum);
            asistencia.setObservacion(item.observacion());
            registradas.add(aDTO(asistenciaRepository.save(asistencia)));
        }
        return registradas;
    }

    // RF42
    @Transactional(readOnly = true)
    public List<AsistenciaDTO> historial(Long alumnoId) {
        Alumno alumno = buscarAlumno(alumnoId);
        return asistenciaRepository.findByInscripcionAlumnoOrderByFechaDesc(alumno)
                .stream().map(this::aDTO).toList();
    }

    // RF43: solo PRESENTE cuenta como asistencia
    @Transactional(readOnly = true)
    public ResumenAsistencia resumen(Long alumnoId) {
        Alumno alumno = buscarAlumno(alumnoId);

        long total = asistenciaRepository.countByInscripcionAlumno(alumno);
        long presentes = asistenciaRepository.countByInscripcionAlumnoAndEstado(alumno, EstadoAsistencia.PRESENTE);
        long ausentes = asistenciaRepository.countByInscripcionAlumnoAndEstado(alumno, EstadoAsistencia.AUSENTE);
        double porcentaje = total == 0 ? 0 : (presentes * 100.0) / total;

        return new ResumenAsistencia(total, presentes, ausentes, porcentaje);
    }

    private Alumno buscarAlumno(Long alumnoId) {
        return alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("alumno", alumnoId));
    }

    private AsistenciaDTO aDTO(Asistencia a) {
        return new AsistenciaDTO(
                a.getIdAsistencia(),
                a.getInscripcion().getIdInscripcion(),
                a.getInscripcion().getAlumno().getIdAlumno(),
                a.getFecha(),
                a.getEstado(),
                a.getObservacion());
    }
}
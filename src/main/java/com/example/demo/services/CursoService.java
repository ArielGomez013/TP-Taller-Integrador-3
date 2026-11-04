package com.example.demo.services;

import com.example.demo.dto.CursoDTO;
import com.example.demo.entities.CicloLectivo;
import com.example.demo.entities.Curso;
import com.example.demo.repositories.CicloLectivoRepository;
import com.example.demo.repositories.CursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CursoService {
    // Inyección de dependencias de los repositorios
    @Autowired
    private CursoRepository cursoRepository;

    @Autowired
    private CicloLectivoRepository cicloRepository;

    @Transactional(readOnly = true)          //Optimiza la consulta en PostgreSQL
    public List<Curso> listarTodos() {
        return cursoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Curso> listarPorCiclo(Long idCiclo) {
        return cursoRepository.findByCicloLectivoIdCiclo(idCiclo);
    }

    @Transactional(readOnly = true)
    public Curso buscarPorId(Long id) {
        return cursoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado con ID: " + id));
    }
    //Si ocurre un error a la mitad, hace ROLLBACK automático para no dejar datos corruptos
    @Transactional
    public Curso crear(CursoDTO dto) {   // Valida que el ciclo lectivo exista
        CicloLectivo ciclo = cicloRepository.findById(dto.getIdCiclo())
                .orElseThrow(() -> new IllegalArgumentException("El ciclo lectivo no existe"));
        //Regla de Negocio: Validar que no exista un curso idéntico en ese ciclo
        if (cursoRepository.existsByCicloLectivoIdCicloAndAnioCursadoAndDivisionIgnoreCase(
                dto.getIdCiclo(), dto.getAnioCursado(), dto.getDivision().trim())) {
            throw new IllegalStateException("Ya existe la división " + dto.getDivision() +
                    " para el año " + dto.getAnioCursado() + " en este ciclo lectivo");
        }
// Mapear DTO a la Entidad y persistir en PostgreSQL
        Curso curso = Curso.builder()
                .anioCursado(dto.getAnioCursado())
                .division(dto.getDivision().trim().toUpperCase())
                .capacidadMaxima(dto.getCapacidadMaxima())
                .cicloLectivo(ciclo)
                .build();
        return cursoRepository.save(curso);
    }
}
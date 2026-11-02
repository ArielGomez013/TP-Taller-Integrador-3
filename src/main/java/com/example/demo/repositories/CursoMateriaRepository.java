package com.example.demo.repositories;

import com.example.demo.entities.CursoMateria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CursoMateriaRepository extends JpaRepository<CursoMateria, Long> {
    List<CursoMateria> findByCursoIdCurso(Long idCurso);
    List<CursoMateria> findByDocenteIdDocente(Long idDocente);
    boolean existsByCursoIdCursoAndMateriaIdMateria(Long idCurso, Long idMateria);
    boolean existsByCursoIdCursoAndDocenteIdDocente(Long idCurso, Long idDocente);
}
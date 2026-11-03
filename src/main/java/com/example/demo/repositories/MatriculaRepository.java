package com.example.demo.repositories;

import com.example.demo.entities.Alumno;
import com.example.demo.entities.CicloLectivo;
import com.example.demo.entities.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    List<Matricula> findByAlumnoIdAlumno(Long idAlumno);

    boolean existsByAlumnoAndCicloLectivo(Alumno alumno, CicloLectivo cicloLectivo);


}

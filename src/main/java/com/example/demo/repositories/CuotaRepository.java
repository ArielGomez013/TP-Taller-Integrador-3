package com.example.demo.repositories;

import com.example.demo.entities.Cuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, Long> {
    List<Cuota> findByEstado(String estado);
    List<Cuota> findByMatriculaIdMatricula(Long idMatricula);

    // [RF-14] Obtener todas las cuotas de un alumno (a través de sus matrículas)
    @Query("SELECT c FROM Cuota c WHERE c.matricula.alumno.idAlumno = :idAlumno ORDER BY c.matricula.idMatricula, c.numeroCuota")
    List<Cuota> findByAlumnoId(@Param("idAlumno") Long idAlumno);
}

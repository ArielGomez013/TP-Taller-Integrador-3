package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.example.demo.entities.CicloLectivo;
import com.example.demo.entities.Alumno;
import com.example.demo.entities.Matricula;
// importá también Matricula, Alumno y CicloLectivo (según el paquete donde estén tus entidades)

public record MatriculaDTO(
        Long idMatricula,
        LocalDate fecha,
        BigDecimal importe,
        String estado,
        AlumnoResumen alumno,
        CicloResumen cicloLectivo
) {
    public record AlumnoResumen(Long idAlumno, String legajo, String dni,
                                String apellido, String nombre) {}

    public record CicloResumen(Long idCiclo, Integer anio, String estado) {}

    public static MatriculaDTO desde(Matricula m) {
        Alumno a = m.getAlumno();
        CicloLectivo c = m.getCicloLectivo();
        return new MatriculaDTO(
                m.getIdMatricula(),
                m.getFecha(),
                m.getImporte(),
                String.valueOf(m.getEstado()),
                new AlumnoResumen(a.getIdAlumno(), a.getLegajo(), a.getDni(),
                        a.getApellido(), a.getNombre()),
                new CicloResumen(c.getIdCiclo(), c.getAnio(), String.valueOf(c.getEstado()))
        );
    }
}

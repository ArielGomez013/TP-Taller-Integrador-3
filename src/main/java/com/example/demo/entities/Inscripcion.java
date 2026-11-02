package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import com.example.demo.enums.EstadoInscripcion;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "Inscripcion", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_inscripcion_alumno_curso",
        columnNames = {"idAlumno", "idCurso"}
    )
})
public class Inscripcion {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInscripcion;

    @ManyToOne
    @JoinColumn(name= "idAlumno", nullable = false)
    private Alumno alumno;

    @ManyToOne
    @JoinColumn(name= "idCurso", nullable = false)
    private Curso curso;

    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    private EstadoInscripcion estado = EstadoInscripcion.ACTIVA;

    public void anular() {
        this.estado = EstadoInscripcion.ANULADA;
    }
}

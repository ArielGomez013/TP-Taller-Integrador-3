package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "curso", uniqueConstraints = {   //No puede existir repetida la misma división en el mismo año escolar y ciclo
        @UniqueConstraint(
                name = "uk_curso_ciclo_anio_division",
                columnNames = {"id_ciclo", "anio_cursado", "division"}
        )
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_curso")
    private Long idCurso;

    @Column(name = "anio_cursado", nullable = false)
    private Integer anioCursado;

    @Column(nullable = false, length = 10)
    private String division;

    @Column(name = "capacidad_maxima", nullable = false) // Regla de Negocio RN02: Capacidad máxima del aula para validar cupos al inscribir
    private Integer capacidadMaxima;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_ciclo", nullable = false)
    private CicloLectivo cicloLectivo;


    public String getNombre() {
        return this.anioCursado + "° Año \"" + this.division + "\"";
    }

    public boolean tieneCupo(int cantidadInscriptos) { // Regla RN02: Valida si todavía queda lugar en el aula
        return cantidadInscriptos < this.capacidadMaxima;
    }
}
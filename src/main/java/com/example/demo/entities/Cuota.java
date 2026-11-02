package com.example.demo.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


@Entity
@Table(name = "CUOTA", uniqueConstraints = {
        // [RN05] El número de cuota es único dentro de la matrícula
        @UniqueConstraint(columnNames = {"id_matricula", "numeroCuota"})
})
public class Cuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idCuota")
    private Long idCuota;

    @Column(nullable = false)
    private Integer numeroCuota;

    @Column(name = "fechaVencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false, length = 15)
    private String estado; // PENDIENTE, PAGADA, VENCIDA, ANULADA

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_matricula", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Matricula matricula;

    @JsonIgnore
    @OneToMany(mappedBy = "cuota", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Pago> pagos;

    public Cuota() {}

    public BigDecimal calcularSaldo() {
        if (pagos == null || pagos.isEmpty()) return this.importe;
        BigDecimal totalPagado = pagos.stream()
                .map(Pago::getImporte)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return this.importe.subtract(totalPagado);
    }

    public Long getIdCuota() { return idCuota; }
    public void setIdCuota(Long idCuota) { this.idCuota = idCuota; }
    public Integer getNumeroCuota() { return numeroCuota; }
    public void setNumeroCuota(Integer numeroCuota) { this.numeroCuota = numeroCuota; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Matricula getMatricula() { return matricula; }
    public void setMatricula(Matricula matricula) { this.matricula = matricula; }
    public List<Pago> getPagos() { return pagos; }
    public void setPagos(List<Pago> pagos) { this.pagos = pagos; }
    public BigDecimal getSaldo() { return calcularSaldo(); }
}

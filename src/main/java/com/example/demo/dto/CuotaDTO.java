package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.example.demo.entities.Cuota;

public record CuotaDTO(
        Long idCuota,
        Integer numeroCuota,
        LocalDate fechaVencimiento,
        BigDecimal importe,
        String estado,
        BigDecimal saldo,
        Long idMatricula
) {
    public static CuotaDTO desde(Cuota c) {
        return new CuotaDTO(
                c.getIdCuota(),
                c.getNumeroCuota(),
                c.getFechaVencimiento(),
                c.getImporte(),
                String.valueOf(c.getEstado()),
                c.calcularSaldo(),
                c.getMatricula().getIdMatricula()
        );
    }
}

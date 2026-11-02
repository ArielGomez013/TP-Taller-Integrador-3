package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.example.demo.entities.Pago;
import com.example.demo.entities.Usuario;

public record PagoDTO(
        Long idPago,
        LocalDate fecha,
        BigDecimal importe,
        String medioPago,
        Long idCuota,
        UsuarioResumen usuario
) {
    public record UsuarioResumen(Long idUsuario, String username) {}

    public static PagoDTO desde(Pago p) {
        Usuario u = p.getUsuario();
        return new PagoDTO(
                p.getIdPago(),
                p.getFecha(),
                p.getImporte(),
                p.getMedioPago(),
                p.getCuota().getIdCuota(),
                new UsuarioResumen(u.getIdUsuario(), u.getUsername())
        );
    }
}

package com.example.demo.services;

import com.example.demo.dto.PagoDTO;
import com.example.demo.entities.Cuota;
import com.example.demo.entities.Pago;
import com.example.demo.entities.Usuario;
import com.example.demo.repositories.CuotaRepository;
import com.example.demo.repositories.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private CuotaRepository cuotaRepository;

    @Transactional(readOnly = true)
    public List<PagoDTO> listar() {
        return pagoRepository.findAll().stream().map(PagoDTO::desde).toList();
    }

    @Transactional(readOnly = true)
    public Optional<PagoDTO> buscarPorId(Long id) {
        return pagoRepository.findById(id).map(PagoDTO::desde);
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> buscarPorCuota(Long idCuota) {
        return pagoRepository.findByCuotaIdCuota(idCuota).stream().map(PagoDTO::desde).toList();
    }
    @Transactional
    public PagoDTO registrarPago(Long idCuota, BigDecimal importePago, String medioPago, Usuario usuarioOperador) {
        Cuota cuota = cuotaRepository.findById(idCuota)
                .orElseThrow(() -> new RuntimeException("Cuota no encontrada"));

        // [RN10] No se pueden registrar pagos sobre cuotas ANULADAS ni sobre cuotas ya PAGADAS
        if ("PAGADA".equals(cuota.getEstado()) || "ANULADA".equals(cuota.getEstado())) {
            throw new IllegalStateException("Operación inválida: La cuota ya está PAGADA o ANULADA");
        }

        // [RN09] El importe debe ser mayor a cero y no superar el saldo pendiente [finance]
        BigDecimal saldoPendiente = cuota.calcularSaldo();
        if (importePago.compareTo(BigDecimal.ZERO) <= 0 || importePago.compareTo(saldoPendiente) > 0) {
            throw new IllegalArgumentException("Importe inválido o excede el saldo pendiente");
        }

        // [RN11] Registro estructurado del Pago con auditoría completa
        Pago pago = new Pago();
        pago.setCuota(cuota);
        pago.setImporte(importePago);
        pago.setFecha(LocalDate.now());
        pago.setMedioPago(medioPago);
        pago.setUsuario(usuarioOperador); // Administrativo que efectúa el cobro
        pagoRepository.save(pago);

        // [RN08] Una cuota pasa a PAGADA si la suma cubre el importe completo
        if (cuota.calcularSaldo().compareTo(BigDecimal.ZERO) == 0) {
            cuota.setEstado("PAGADA");
            cuotaRepository.save(cuota);
        }

        return PagoDTO.desde(pago);
    }
}

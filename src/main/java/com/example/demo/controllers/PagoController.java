package com.example.demo.controllers;

import com.example.demo.dto.PagoDTO;
import com.example.demo.entities.Pago;
import com.example.demo.entities.Usuario;
import com.example.demo.services.PagoService;
import com.example.demo.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<PagoDTO>> listar() {
        return ResponseEntity.ok(pagoService.listar());
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return pagoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cuota/{cuotaId}")
    public ResponseEntity<List<PagoDTO>> buscarPorCuota(@PathVariable Long cuotaId) {
        return ResponseEntity.ok(pagoService.buscarPorCuota(cuotaId));
    }

    @PostMapping
    public ResponseEntity<?> registrarPago(@RequestBody Map<String, Object> req) {
        try {
            Long idCuota = Long.valueOf(req.get("idCuota").toString());
            BigDecimal importe = new BigDecimal(req.get("importe").toString());
            String medioPago = req.get("medioPago").toString();

            Usuario operador = null;
            if (req.get("idUsuario") != null) {
                Long idUsuario = Long.valueOf(req.get("idUsuario").toString());
                operador = usuarioService.buscarPorId(idUsuario).orElse(null);
            }
            if (operador == null) {
                // Si no se especifica operador, tomar el primer usuario disponible o crear uno mock
                List<Usuario> usuarios = usuarioService.listar();
                if (!usuarios.isEmpty()) {
                    operador = usuarios.get(0);
                }
            }

            PagoDTO pago = pagoService.registrarPago(idCuota, importe, medioPago, operador);
            return new ResponseEntity<>(pago, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

package com.example.demo.services;

import com.example.demo.dto.CuotaDTO;
import com.example.demo.dto.SituacionAdministrativaDTO;
import com.example.demo.entities.Alumno;
import com.example.demo.entities.Cuota;
import com.example.demo.entities.Matricula;
import com.example.demo.repositories.AlumnoRepository;
import com.example.demo.repositories.CuotaRepository;
import com.example.demo.repositories.MatriculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class CuotaService {

    @Autowired
    private CuotaRepository cuotaRepository;

    @Autowired
    private MatriculaRepository matriculaRepository;

    @Autowired
    private AlumnoRepository alumnoRepository;

    public List<Cuota> listar() {
        return cuotaRepository.findAll();
    }

    public Optional<Cuota> buscarPorId(Long id) {
        return cuotaRepository.findById(id);
    }

    public List<Cuota> buscarPorMatricula(Long idMatricula) {
        return cuotaRepository.findByMatriculaIdMatricula(idMatricula);
    }

    // [RF-14] Cuotas de un alumno (todas sus matrículas)
    @Transactional(readOnly = true)
    public List<CuotaDTO> cuotasPorAlumno(Long idAlumno) {
        return cuotaRepository.findByAlumnoId(idAlumno)
                .stream()
                .map(CuotaDTO::desde)
                .toList();
    }

    // [RF-14] Situación administrativa completa del alumno
    @Transactional(readOnly = true)
    public SituacionAdministrativaDTO situacionAdministrativa(Long idAlumno) {
        Alumno alumno = alumnoRepository.findById(idAlumno)
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado con id: " + idAlumno));

        List<Cuota> cuotas = cuotaRepository.findByAlumnoId(idAlumno);

        // Estado de matrícula: tomamos la más reciente
        List<Matricula> matriculas = matriculaRepository.findByAlumnoIdAlumno(idAlumno);
        String estadoMatricula = matriculas.stream()
                .max(Comparator.comparing(Matricula::getFecha))
                .map(Matricula::getEstado)
                .orElse("SIN MATRÍCULA");

        List<CuotaDTO> cuotasDTO = cuotas.stream().map(CuotaDTO::desde).toList();

        long pendientes = cuotas.stream().filter(c -> "PENDIENTE".equals(c.getEstado())).count();
        long vencidas   = cuotas.stream().filter(c -> "VENCIDA".equals(c.getEstado())).count();
        long pagadas    = cuotas.stream().filter(c -> "PAGADA".equals(c.getEstado())).count();

        // Importe adeudado: saldo de cuotas PENDIENTES y VENCIDAS
        BigDecimal adeudado = cuotas.stream()
                .filter(c -> "PENDIENTE".equals(c.getEstado()) || "VENCIDA".equals(c.getEstado()))
                .map(Cuota::calcularSaldo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total abonado: importe original - saldo de cada cuota
        BigDecimal totalAbonado = cuotas.stream()
                .map(c -> c.getImporte().subtract(c.calcularSaldo()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SituacionAdministrativaDTO(
                alumno.getIdAlumno(),
                alumno.getApellido() + ", " + alumno.getNombre(),
                estadoMatricula,
                cuotasDTO,
                pendientes,
                vencidas,
                pagadas,
                adeudado,
                totalAbonado
        );
    }

    public void generarCuotasParaMatricula(Long idMatricula, int cantidad, BigDecimal monto, LocalDate primerVencimiento) {
        Matricula matricula = matriculaRepository.findById(idMatricula)
                .orElseThrow(() -> new RuntimeException("Matrícula no encontrada"));

        // [RN06] Las cuotas solo pueden generarse para matrículas en estado ACTIVA
        if (!"ACTIVA".equals(matricula.getEstado())) {
            throw new IllegalStateException("No se pueden generar cuotas: La matrícula no está ACTIVA");
        }

        for (int i = 1; i <= cantidad; i++) {
            Cuota cuota = new Cuota();
            cuota.setMatricula(matricula);
            cuota.setNumeroCuota(i); // [RN05] Número correlativo
            cuota.setImporte(monto);
            cuota.setFechaVencimiento(primerVencimiento.plusMonths(i - 1));
            cuota.setEstado("PENDIENTE");
            cuotaRepository.save(cuota);
        }
    }

    // [RN07] Tarea programada diaria automática para vencer cuotas impagas expiradas
    @Scheduled(cron = "0 5 0 * * ?") // Se ejecuta todos los días a las 00:05 hs de la madrugada
    public void verificarCuotasVencidas() {
        List<Cuota> pendientes = cuotaRepository.findByEstado("PENDIENTE");
        LocalDate hoy = LocalDate.now();
        for (Cuota cuota : pendientes) {
            if (hoy.isAfter(cuota.getFechaVencimiento())) {
                cuota.setEstado("VENCIDA");
                cuotaRepository.save(cuota);
            }
        }
    }
}

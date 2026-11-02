/* =====================================================
     ASISTENCIAS — Lógica de UI
     ===================================================== */

// Inicializar fecha con la de hoy
document.getElementById('asi-fecha').value = new Date().toISOString().split('T')[0];

// Contador para IDs únicos de filas
let filaCounter = 0;

/* ---------- AGREGAR FILA DINÁMICA ---------- */
document.getElementById('btn-agregar-fila').addEventListener('click', () => {
    filaCounter++;
    const id = filaCounter;
    const tbody = document.getElementById('tbody-asistencias');
    document.getElementById('msg-sin-filas').classList.add('d-none');

    const tr = document.createElement('tr');
    tr.className = 'attendance-row';
    tr.id = `fila-asistencia-${id}`;
    tr.innerHTML = `
      <td>
        <input type="number" class="form-control form-control-sm insc-id"
          placeholder="Inscripción ID" min="1" required />
      </td>
      <td>
        <select class="form-select form-select-sm est-estado">
          <option value="PRESENTE">✅ PRESENTE</option>
          <option value="AUSENTE">❌ AUSENTE</option>
          <option value="TARDANZA">⚠️ TARDANZA</option>
          <option value="JUSTIFICADO">📋 JUSTIFICADO</option>
        </select>
      </td>
      <td>
        <input type="text" class="form-control form-control-sm obs-obs"
          placeholder="Observación (opcional)" maxlength="255" />
      </td>
      <td class="text-center">
        <button type="button" class="btn btn-sm btn-outline-danger btn-quitar-fila" data-fila="${id}">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
});

/* ---------- QUITAR FILA ---------- */
document.getElementById('tbody-asistencias').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-quitar-fila');
    if (!btn) return;
    const filaId = btn.dataset.fila;
    document.getElementById(`fila-asistencia-${filaId}`)?.remove();
    // Mostrar mensaje si no quedan filas
    if (document.getElementById('tbody-asistencias').children.length === 0) {
        document.getElementById('msg-sin-filas').classList.remove('d-none');
    }
});

/* ---------- SUBMIT: REGISTRAR ASISTENCIAS ---------- */
document.getElementById('form-asistencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-asistencia-alert');
    alertEl.innerHTML = '';

    const docenteId = parseInt(document.getElementById('asi-docente-id').value);
    const cursoId   = parseInt(document.getElementById('asi-curso-id').value);
    const fecha     = document.getElementById('asi-fecha').value;

    if (!docenteId || !cursoId || !fecha) {
        showAlert(alertEl, 'Complete Docente ID, Curso ID y Fecha.', 'warning');
        return;
    }

    // Recopilar filas de la tabla dinámica
    const filas = Array.from(document.querySelectorAll('#tbody-asistencias tr'));
    if (filas.length === 0) {
        showAlert(alertEl, 'Agregue al menos un alumno a la lista.', 'warning');
        return;
    }

    const asistencias = [];
    let valido = true;

    for (const fila of filas) {
        const inscripcionId = parseInt(fila.querySelector('.insc-id').value);
        const estado        = fila.querySelector('.est-estado').value;
        const observacion   = fila.querySelector('.obs-obs').value.trim() || undefined;

        if (!inscripcionId) {
            showAlert(alertEl, 'Todos los alumnos deben tener un ID de inscripción válido.', 'warning');
            fila.querySelector('.insc-id').classList.add('is-invalid');
            valido = false;
            break;
        }

        fila.querySelector('.insc-id').classList.remove('is-invalid');
        asistencias.push({ inscripcionId, estado, ...(observacion ? { observacion } : {}) });
    }

    if (!valido) return;

    setLoading(true);
    try {
        const resultado = await AsistenciaAPI.registrar({ docenteId, cursoId, fecha, asistencias });
        showAlert(document.getElementById('alert-container'),
            `✅ Asistencia registrada correctamente para ${resultado.length} alumno(s) — Fecha: ${formatDate(fecha)}`, 'success');
        // Limpiar tabla y formulario
        document.getElementById('tbody-asistencias').innerHTML = '';
        document.getElementById('msg-sin-filas').classList.remove('d-none');
        document.getElementById('asi-docente-id').value = '';
        document.getElementById('asi-curso-id').value = '';
    } catch (err) {
        showAlert(alertEl, err.message, 'danger');
    } finally {
        setLoading(false);
    }
});

/* ---------- BUSCAR HISTORIAL ---------- */
document.getElementById('btn-buscar-historial').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('hist-alumno-id').value);
    const alertEl = document.getElementById('hist-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un ID de alumno válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    setLoading(true);
    try {
        const lista = await AsistenciaAPI.porAlumno(id);
        renderHistorial(lista);
    } catch (err) {
        showAlert(alertEl, err.message, 'danger');
    } finally {
        setLoading(false);
    }
});

function renderHistorial(lista) {
    const tbody = document.getElementById('tbody-historial');
    if (!lista || lista.length === 0) {
        renderEmpty(tbody, 5, 'Este alumno no tiene asistencias registradas');
        return;
    }
    tbody.innerHTML = lista.map(a => `
      <tr>
        <td><strong>#${escapeHtml(String(a.id))}</strong></td>
        <td>${escapeHtml(String(a.inscripcionId))}</td>
        <td>${formatDate(a.fecha)}</td>
        <td>${badgeEstadoAsistencia(a.estado)}</td>
        <td class="text-muted small">${escapeHtml(a.observacion || '—')}</td>
      </tr>`).join('');
}

/* ---------- CALCULAR RESUMEN ---------- */
document.getElementById('btn-calcular-resumen').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('resumen-alumno-id').value);
    const alertEl = document.getElementById('resumen-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un ID de alumno válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    setLoading(true);
    try {
        const res = await AsistenciaAPI.resumen(id);
        mostrarResumen(res);
    } catch (err) {
        showAlert(alertEl, err.message, 'danger');
    } finally {
        setLoading(false);
    }
});

function mostrarResumen(res) {
    document.getElementById('met-total').textContent    = res.total ?? 0;
    document.getElementById('met-presentes').textContent = res.presentes ?? 0;
    document.getElementById('met-ausentes').textContent  = res.ausentes ?? 0;

    const pct = typeof res.porcentaje === 'number'
        ? Math.round(res.porcentaje)
        : 0;
    document.getElementById('met-porcentaje').textContent = `${pct}%`;

    // Barra de progreso con color según porcentaje
    const barra = document.getElementById('barra-asistencia');
    barra.style.width = `${pct}%`;
    barra.textContent = `${pct}%`;
    barra.setAttribute('aria-valuenow', pct);
    barra.className = 'progress-bar ' + (
        pct >= 75 ? 'bg-success' :
            pct >= 50 ? 'bg-warning'  : 'bg-danger'
    );

    document.getElementById('resumen-metricas').classList.remove('d-none');
}

/* ---------- Enter en inputs de búsqueda ---------- */
document.getElementById('hist-alumno-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-historial').click();
});
document.getElementById('resumen-alumno-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-calcular-resumen').click();
});
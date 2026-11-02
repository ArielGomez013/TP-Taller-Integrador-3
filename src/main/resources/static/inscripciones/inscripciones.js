
    /* =====================================================
    INSCRIPCIONES — Lógica de UI
    ===================================================== */

    // Referencia al modal de confirmación de Bootstrap
    const modalAnular = new bootstrap.Modal(document.getElementById('modal-confirmar-anular'));

    // ID de inscripción a anular (guardado al abrir el modal)
    let inscripcionIdPendiente = null;

    /* ---------- FORMULARIO: NUEVA INSCRIPCIÓN ---------- */
    document.getElementById('form-inscripcion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-inscripcion-alert');
    alertEl.innerHTML = '';

    const alumnoId      = parseInt(document.getElementById('inp-alumno-id').value);
    const cursoId       = parseInt(document.getElementById('inp-curso-id').value);
    const cicloLectivoId = parseInt(document.getElementById('inp-ciclo-id').value);

    // Validación básica client-side
    if (!alumnoId || !cursoId || !cicloLectivoId) {
    showAlert(alertEl, 'Complete todos los campos obligatorios.', 'warning');
    return;
}

    setLoading(true);
    try {
    const nueva = await InscripcionAPI.crear({ alumnoId, cursoId, cicloLectivoId });
    showAlert(document.getElementById('alert-container'),
    `✅ Inscripción creada exitosamente. ID: ${nueva.id} — Estado: ${nueva.estado}`, 'success');
    // Limpiar formulario tras éxito
    document.getElementById('form-inscripcion').reset();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- BUSCAR POR ALUMNO ---------- */
    document.getElementById('btn-buscar-alumno').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-alumno-id').value);
    if (!id) { showAlert(document.getElementById('search-alert'), 'Ingrese un ID de alumno válido.', 'warning'); return; }

    document.getElementById('search-alert').innerHTML = '';
    setLoading(true);
    try {
    const lista = await InscripcionAPI.porAlumno(id);
    renderTablaInscripciones(lista, `Inscripciones del alumno #${id}`);
} catch (err) {
    showAlert(document.getElementById('search-alert'), err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- BUSCAR POR CURSO ---------- */
    document.getElementById('btn-buscar-curso').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-curso-id').value);
    if (!id) { showAlert(document.getElementById('search-alert'), 'Ingrese un ID de curso válido.', 'warning'); return;  }

    document.getElementById('search-alert').innerHTML = '';
    setLoading(true);
    try {
    const lista = await InscripcionAPI.porCurso(id);
    renderTablaInscripciones(lista, `Alumnos del curso #${id}`);
} catch (err) {
    showAlert(document.getElementById('search-alert'), err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- ANULAR — Abrir modal ---------- */
    document.getElementById('btn-anular-abrir-modal').addEventListener('click', () => {
    const id = parseInt(document.getElementById('inp-anular-id').value);
    if (!id) {
    showAlert(document.getElementById('anular-alert'), 'Ingrese un ID de inscripción válido.', 'warning');
    return;
}
    document.getElementById('anular-alert').innerHTML = '';
    inscripcionIdPendiente = id;
    document.getElementById('modal-inscripcion-id-text').textContent = `#${id}`;
    modalAnular.show();
});

    /* ---------- ANULAR — Confirmar ---------- */
    document.getElementById('btn-confirmar-anular').addEventListener('click', async () => {
    modalAnular.hide();
    if (!inscripcionIdPendiente) return;

    setLoading(true);
    try {
    const actualizada = await InscripcionAPI.anular(inscripcionIdPendiente);
    showAlert(document.getElementById('alert-container'),
    `Inscripción #${inscripcionIdPendiente} anulada correctamente. Estado actual: ${actualizada.estado}`, 'success');
    document.getElementById('inp-anular-id').value = '';

    // Si hay resultados en tabla, actualizar el badge de esa fila
    actualizarFilaTabla(inscripcionIdPendiente, actualizada);
} catch (err) {
    showAlert(document.getElementById('anular-alert'), err.message, 'danger');
} finally {
    setLoading(false);
    inscripcionIdPendiente = null;
}
});

    /* ---------- ANULAR INLINE (desde tabla) ---------- */
    document.getElementById('tabla-inscripciones').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="anular-inline"]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    document.getElementById('inp-anular-id').value = id;
    document.getElementById('btn-anular-abrir-modal').click();
});

    /* ---------- RENDER TABLA ---------- */
    function renderTablaInscripciones(lista, titulo = '') {
    const tbody = document.getElementById('tabla-inscripciones');

    if (!lista || lista.length === 0) {
    renderEmpty(tbody, 6, `Sin inscripciones para: ${titulo}`);
    return;
}

    tbody.innerHTML = lista.map(ins => `
      <tr id="row-inscripcion-${ins.id}">
        <td><strong>#${escapeHtml(String(ins.id))}</strong></td>
        <td>${escapeHtml(String(ins.alumnoId))}</td>
        <td>${escapeHtml(String(ins.cursoId))}</td>
        <td>${formatDate(ins.fecha)}</td>
        <td>${badgeEstadoInscripcion(ins.estado)}</td>
        <td>
          ${ins.estado === 'ACTIVA'
    ? `<button class="btn btn-sm btn-outline-danger" data-action="anular-inline" data-id="${ins.id}">
                <i class="bi bi-x-circle me-1"></i>Anular
               </button>`
    : '<span class="text-muted small">—</span>'
}
        </td>
      </tr>`).join('');
}

    /* ---------- ACTUALIZAR FILA EN TABLA TRAS ANULACIÓN ---------- */
    function actualizarFilaTabla(id, dto) {
    const row = document.getElementById(`row-inscripcion-${id}`);
    if (!row) return;
    // Actualizar badge de estado (columna 5, índice 4)
    row.cells[4].innerHTML = badgeEstadoInscripcion(dto.estado);
    // Quitar botón anular
    row.cells[5].innerHTML = '<span class="text-muted small">—</span>';
}

    /* ---------- Tecla Enter en inputs de búsqueda ---------- */
    document.getElementById('search-alumno-id').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-alumno').click();
});
    document.getElementById('search-curso-id').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-curso').click();
});

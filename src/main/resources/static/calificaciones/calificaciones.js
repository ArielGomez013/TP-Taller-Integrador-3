 /* =====================================================
    CALIFICACIONES — Lógica de UI
    ===================================================== */

    /* ---------- SINCRONIZAR SLIDER ↔ INPUT NUMÉRICO ---------- */
    const rangeEl   = document.getElementById('nca-nota-range');
    const displayEl = document.getElementById('nca-nota-display');
    const numEl     = document.getElementById('nca-nota-num');
    const validMsg  = document.getElementById('nota-validation-msg');

    function actualizarDisplayNota(val) {
    const n = parseFloat(val);
    displayEl.textContent = n;
    // Color según nota
    if (n >= 6) {
    displayEl.style.color = 'var(--success)';
} else if (n >= 4) {
    displayEl.style.color = '#b5860d';
} else {
    displayEl.style.color = 'var(--accent)';
}
}

    rangeEl.addEventListener('input', () => {
    numEl.value = rangeEl.value;
    actualizarDisplayNota(rangeEl.value);
});

    numEl.addEventListener('input', () => {
    const v = parseFloat(numEl.value);
    if (v >= 1 && v <= 10) {
    rangeEl.value = v;
    actualizarDisplayNota(v);
    validMsg.classList.add('d-none');
} else {
    validMsg.classList.remove('d-none');
}
});

    // Inicializar display
    actualizarDisplayNota(rangeEl.value);

    /* ---------- FORM: NUEVA CALIFICACIÓN ---------- */
    document.getElementById('form-nueva-cali').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-nueva-cali-alert');
    alertEl.innerHTML = '';

    const docenteId    = parseInt(document.getElementById('nca-docente-id').value);
    const inscripcionId = parseInt(document.getElementById('nca-inscripcion-id').value);
    const evaluacionId  = parseInt(document.getElementById('nca-evaluacion-id').value);
    const nota          = parseFloat(numEl.value);
    const observaciones = document.getElementById('nca-observaciones').value.trim() || undefined;

    // Validación client-side
    if (!docenteId || !inscripcionId || !evaluacionId) {
    showAlert(alertEl, 'Complete todos los campos obligatorios.', 'warning');
    return;
}
    if (isNaN(nota) || nota < 1 || nota > 10) {
    showAlert(alertEl, 'La nota debe estar entre 1 y 10.', 'warning');
    validMsg.classList.remove('d-none');
    return;
}

    setLoading(true);
    try {
    const nueva = await CalificacionAPI.crear({
    docenteId, inscripcionId, evaluacionId, nota,
    ...(observaciones ? { observaciones } : {}),
});
    showAlert(document.getElementById('alert-container'),
    `✅ Calificación registrada. ID: ${nueva.id} — Nota: ${nueva.nota}`, 'success');
    document.getElementById('form-nueva-cali').reset();
    rangeEl.value = 7; numEl.value = 7; actualizarDisplayNota(7);
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- CARGAR CALIFICACIÓN PARA EDITAR ---------- */
    // Nota: el backend no tiene GET /calificaciones/{id}, usamos la búsqueda
    // por alumno o evaluación; aquí implementamos una búsqueda genérica por
    // el ID que el usuario puede obtener de la tabla de resultados.
    // El campo "Cargar" busca en las listas cargadas recientemente.
    // Para una experiencia completa, el backend debería exponer GET /calificaciones/{id}.
    // Mientras tanto, pedimos al usuario docenteId + nota directamente tras ingresar el ID.
    document.getElementById('btn-cargar-cali').addEventListener('click', () => {
    const id = parseInt(document.getElementById('edit-cali-id').value);
    const alertEl = document.getElementById('edit-load-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un ID de calificación válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    // Intentar encontrar en filas actuales de la tabla
    const fila = calificacionesCache.find(c => c.id === id);
    if (fila) {
    cargarFormularioEdicion(fila);
} else {
    // No está en caché: mostrar formulario vacío con el ID para edición directa
    showAlert(alertEl,
    'No se encontró esa calificación en los resultados actuales. Búsquela primero por alumno o evaluación, o complete los campos manualmente.',
    'info');
    document.getElementById('edit-cali-id-hidden').value = id;
    document.getElementById('edit-docente-id').value    = '';
    document.getElementById('edit-nota').value          = '';
    document.getElementById('edit-observacion').value   = '';
    document.getElementById('form-edit-wrap').classList.remove('d-none');
}
});

    function cargarFormularioEdicion(dto) {
    document.getElementById('edit-cali-id-hidden').value = dto.id;
    document.getElementById('edit-docente-id').value     = '';   // no viene en el DTO
    document.getElementById('edit-nota').value           = dto.nota;
    document.getElementById('edit-observacion').value    = dto.observaciones || '';
    document.getElementById('form-edit-wrap').classList.remove('d-none');
    document.getElementById('form-edit-cali-alert').innerHTML = '';
}

    /* ---------- GUARDAR CAMBIOS EDICIÓN ---------- */
    document.getElementById('form-edit-cali').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-edit-cali-alert');
    alertEl.innerHTML = '';

    const id         = parseInt(document.getElementById('edit-cali-id-hidden').value);
    const docenteId  = parseInt(document.getElementById('edit-docente-id').value);
    const nota       = parseFloat(document.getElementById('edit-nota').value);
    const observacion = document.getElementById('edit-observacion').value.trim() || undefined;

    if (!docenteId) {
    showAlert(alertEl, 'El Docente ID es obligatorio para modificar.', 'warning');
    return;
}
    if (isNaN(nota) || nota < 1 || nota > 10) {
    showAlert(alertEl, 'La nota debe estar entre 1 y 10.', 'warning');
    return;
}

    setLoading(true);
    try {
    const actualizada = await CalificacionAPI.actualizar(id, {
    docenteId, nota, ...(observacion ? { observacion } : {}),
});
    showAlert(document.getElementById('alert-container'),
    `✅ Calificación #${id} actualizada. Nueva nota: ${actualizada.nota}`, 'success');
    document.getElementById('form-edit-wrap').classList.add('d-none');
    document.getElementById('edit-cali-id').value = '';
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- CANCELAR EDICIÓN ---------- */
    document.getElementById('btn-cancelar-edit-cali').addEventListener('click', () => {
    document.getElementById('form-edit-wrap').classList.add('d-none');
    document.getElementById('edit-cali-id').value = '';
    document.getElementById('edit-load-alert').innerHTML = '';
});

    /* ---------- Caché de calificaciones cargadas ---------- */
    let calificacionesCache = [];

    /* ---------- BUSCAR POR ALUMNO ---------- */
    document.getElementById('btn-buscar-por-alumno').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-alumno-id').value);
    const alertEl = document.getElementById('search-cali-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un Alumno ID válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    setLoading(true);
    try {
    const lista = await CalificacionAPI.porAlumno(id);
    calificacionesCache = lista || [];
    renderTablaCalificaciones(lista);
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- BUSCAR POR EVALUACIÓN ---------- */
    document.getElementById('btn-buscar-por-eval').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-eval-id').value);
    const alertEl = document.getElementById('search-cali-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un ID de evaluación válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    setLoading(true);
    try {
    const lista = await CalificacionAPI.porEvaluacion(id);
    calificacionesCache = lista || [];
    renderTablaCalificaciones(lista);
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- EDITAR INLINE DESDE TABLA ---------- */
    document.getElementById('tbody-calificaciones').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="editar-cali"]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const dto = calificacionesCache.find(c => c.id === id);
    document.getElementById('edit-cali-id').value = id;
    if (dto) {
    cargarFormularioEdicion(dto);
} else {
    document.getElementById('btn-cargar-cali').click();
}
    // Scroll a sección de edición
    document.getElementById('edit-cali-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

    /* ---------- RENDER TABLA ---------- */
    function renderTablaCalificaciones(lista) {
    const tbody = document.getElementById('tbody-calificaciones');
    if (!lista || lista.length === 0) {
    renderEmpty(tbody, 7, 'No se encontraron calificaciones');
    return;
}
    tbody.innerHTML = lista.map(c => `
      <tr>
        <td><strong>#${escapeHtml(String(c.id))}</strong></td>
        <td>${escapeHtml(String(c.alumnoId))}</td>
        <td>${escapeHtml(String(c.evaluacionId))}</td>
        <td>${escapeHtml(String(c.inscripcionId))}</td>
        <td>${badgeNota(c.nota)}</td>
        <td class="text-muted small">${escapeHtml(c.observaciones || '—')}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-action="editar-cali" data-id="${c.id}">
            <i class="bi bi-pencil me-1"></i>Editar
          </button>
        </td>
      </tr>`).join('');
}

    /* ---------- Enter en búsquedas ---------- */
    document.getElementById('search-alumno-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-por-alumno').click();
});
    document.getElementById('search-eval-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-por-eval').click();
});
    document.getElementById('edit-cali-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-cargar-cali').click();
});

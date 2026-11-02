
    /* =====================================================
    EVALUACIONES — Lógica de UI
    ===================================================== */

    // Fecha por defecto = hoy
    document.getElementById('neval-fecha').value = new Date().toISOString().split('T')[0];

    /* ---------- FORMULARIO: CREAR EVALUACIÓN ---------- */
    document.getElementById('form-nueva-eval').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-nueva-eval-alert');
    alertEl.innerHTML = '';

    const cursoMateriaId = parseInt(document.getElementById('neval-cursoMateria-id').value);
    const fecha          = document.getElementById('neval-fecha').value;
    const tipo           = document.getElementById('neval-tipo').value;
    const descripcion    = document.getElementById('neval-descripcion').value.trim() || undefined;

    if (!cursoMateriaId || !fecha || !tipo) {
    showAlert(alertEl, 'Complete CursoMateria ID, Fecha y Tipo.', 'warning');
    return;
}

    setLoading(true);
    try {
    const nueva = await EvaluacionAPI.crear({
    cursoMateriaId, fecha, tipo,
    ...(descripcion ? { descripcion } : {}),
});
    showAlert(document.getElementById('alert-container'),
    `✅ Evaluación creada. ID: ${nueva.id} — Tipo: ${nueva.tipo} — Fecha: ${formatDate(nueva.fecha)}`, 'success');
    document.getElementById('form-nueva-eval').reset();
    document.getElementById('neval-fecha').value = new Date().toISOString().split('T')[0];
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- CARGAR EVALUACIÓN PARA EDITAR ---------- */
    document.getElementById('btn-cargar-eval').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('edit-eval-id').value);
    const alertEl = document.getElementById('edit-load-alert');
    if (!id) { showAlert(alertEl, 'Ingrese un ID de evaluación válido.', 'warning'); return; }
    alertEl.innerHTML = '';

    setLoading(true);
    try {
    const eval_ = await EvaluacionAPI.porId(id);
    // Rellenar formulario de edición
    document.getElementById('edit-id-hidden').value   = eval_.id;
    document.getElementById('edit-fecha').value       = eval_.fecha?.split('T')[0] || '';
    document.getElementById('edit-tipo').value        = eval_.tipo;
    document.getElementById('edit-descripcion').value = eval_.descripcion || '';
    document.getElementById('form-edit-wrap').classList.remove('d-none');
    document.getElementById('form-edit-eval-alert').innerHTML = '';
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- GUARDAR CAMBIOS DE EDICIÓN ---------- */
    document.getElementById('form-edit-eval').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-edit-eval-alert');
    alertEl.innerHTML = '';

    const id          = parseInt(document.getElementById('edit-id-hidden').value);
    const fecha       = document.getElementById('edit-fecha').value;
    const tipo        = document.getElementById('edit-tipo').value;
    const descripcion = document.getElementById('edit-descripcion').value.trim() || undefined;

    if (!fecha || !tipo) {
    showAlert(alertEl, 'Fecha y Tipo son obligatorios.', 'warning');
    return;
}

    setLoading(true);
    try {
    const actualizada = await EvaluacionAPI.actualizar(id, {
    fecha, tipo, ...(descripcion ? { descripcion } : {}),
});
    showAlert(document.getElementById('alert-container'),
    `✅ Evaluación #${id} actualizada correctamente.`, 'success');
    document.getElementById('form-edit-wrap').classList.add('d-none');
    document.getElementById('edit-eval-id').value = '';
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- CANCELAR EDICIÓN ---------- */
    document.getElementById('btn-cancelar-edit').addEventListener('click', () => {
    document.getElementById('form-edit-wrap').classList.add('d-none');
    document.getElementById('edit-eval-id').value = '';
    document.getElementById('edit-load-alert').innerHTML = '';
});

    /* ---------- BUSCAR POR CURSO ---------- */
    document.getElementById('btn-buscar-por-curso').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-curso-id').value);
    if (!id) { showAlert(document.getElementById('search-alert'), 'Ingrese un Curso ID válido.', 'warning'); return; }
    document.getElementById('search-alert').innerHTML = '';
    setLoading(true);
    try {
    const lista = await EvaluacionAPI.porCurso(id);
    renderTablaEvaluaciones(lista);
} catch (err) {
    showAlert(document.getElementById('search-alert'), err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- BUSCAR POR CURSO-MATERIA ---------- */
    document.getElementById('btn-buscar-por-cm').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-cm-id').value);
    if (!id) { showAlert(document.getElementById('search-alert'), 'Ingrese un CursoMateria ID válido.', 'warning'); return; }
    document.getElementById('search-alert').innerHTML = '';
    setLoading(true);
    try {
    const lista = await EvaluacionAPI.porCursoMateria(id);
    renderTablaEvaluaciones(lista);
} catch (err) {
    showAlert(document.getElementById('search-alert'), err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- BUSCAR POR ID ---------- */
    document.getElementById('btn-buscar-por-id').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('search-eval-id').value);
    if (!id) { showAlert(document.getElementById('search-alert'), 'Ingrese un ID de evaluación válido.', 'warning'); return; }
    document.getElementById('search-alert').innerHTML = '';
    setLoading(true);
    try {
    const eval_ = await EvaluacionAPI.porId(id);
    renderTablaEvaluaciones([eval_]); // siempre devuelve objeto, envolver en array
} catch (err) {
    showAlert(document.getElementById('search-alert'), err.message, 'danger');
} finally {
    setLoading(false);
}
});

    /* ---------- EDITAR INLINE DESDE TABLA ---------- */
    document.getElementById('tbody-evaluaciones').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="editar-eval"]');
    if (!btn) return;
    const id = btn.dataset.id;
    // Poner el ID en el input y disparar carga
    document.getElementById('edit-eval-id').value = id;
    document.getElementById('btn-cargar-eval').click();
    // Scroll hacia la sección de edición
    document.getElementById('edit-eval-id').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

    /* ---------- RENDER TABLA ---------- */
    function renderTablaEvaluaciones(lista) {
    const tbody = document.getElementById('tbody-evaluaciones');
    if (!lista || lista.length === 0) {
    renderEmpty(tbody, 7, 'No se encontraron evaluaciones');
    return;
}
    tbody.innerHTML = lista.map(ev => `
      <tr>
        <td><strong>#${escapeHtml(String(ev.id))}</strong></td>
        <td>${escapeHtml(String(ev.cursoMateriaId))}</td>
        <td>${escapeHtml(String(ev.cursoId ?? '—'))}</td>
        <td>${formatDate(ev.fecha)}</td>
        <td>${badgeTipoEvaluacion(ev.tipo)}</td>
        <td class="text-muted small">${escapeHtml(ev.descripcion || '—')}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-action="editar-eval" data-id="${ev.id}">
            <i class="bi bi-pencil me-1"></i>Editar
          </button>
        </td>
      </tr>`).join('');
}

    /* ---------- Enter en búsquedas ---------- */
    document.getElementById('search-curso-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-por-curso').click();
});
    document.getElementById('search-cm-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-por-cm').click();
});
    document.getElementById('search-eval-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar-por-id').click();
});
    document.getElementById('edit-eval-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-cargar-eval').click();
});
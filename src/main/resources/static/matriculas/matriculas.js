    let matriculasList = [];
    let alumnosList = [];
    let ciclosList = [];
    let idMatriculaSeleccionada = null;

    const modalMatricula = new bootstrap.Modal(document.getElementById('modal-matricula'));
    const modalEstado = new bootstrap.Modal(document.getElementById('modal-cambiar-estado'));

    async function cargarInicial() {
    setLoading(true);
    try {
    const [mats, alums, ciclos] = await Promise.all([
    MatriculaAPI.listar(),
    AlumnoAPI.listar(),
    CicloLectivoAPI.listar()
    ]);
    matriculasList = mats;
    alumnosList = alums;
    ciclosList = ciclos;

    poblarSelects();
    renderTabla();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function poblarSelects() {
    const selAlum = document.getElementById('mat-alumno-id');
    selAlum.innerHTML = '<option value="">Seleccione alumno...</option>';
    alumnosList.filter(a => a.estado === 'ACTIVO').forEach(a => {
    selAlum.innerHTML += `<option value="${a.idAlumno}">${escapeHtml(a.apellido)}, ${escapeHtml(a.nombre)} (DNI: ${a.dni})</option>`;
});

    const selCiclo = document.getElementById('mat-ciclo-id');
    selCiclo.innerHTML = '<option value="">Seleccione ciclo lectivo...</option>';
    ciclosList.forEach(c => {
    selCiclo.innerHTML += `<option value="${c.idCiclo}">${c.anio} (${c.estado})</option>`;
});
}

    function renderTabla() {
    const q = document.getElementById('filtro-matricula').value.toLowerCase().trim();
    const est = document.getElementById('filtro-estado-matricula').value;

    const filtrados = matriculasList.filter(m => {
    const alumNombre = m.alumno ? `${m.alumno.apellido} ${m.alumno.nombre}`.toLowerCase() : '';
    const alumDni = m.alumno ? String(m.alumno.dni).toLowerCase() : '';
    const cicloAnio = m.cicloLectivo ? String(m.cicloLectivo.anio) : '';

    const matchQ = !q || alumNombre.includes(q) || alumDni.includes(q) || cicloAnio.includes(q);
    const matchEst = !est || m.estado === est;
    return matchQ && matchEst;
});

    document.getElementById('contador-matriculas').textContent = filtrados.length;
    const tbody = document.getElementById('tbody-matriculas');

    if (filtrados.length === 0) {
    renderEmpty(tbody, 8, 'No se encontraron matrículas registradas');
    return;
}

    tbody.innerHTML = filtrados.map(m => {
    let badgeColor = 'bg-secondary';
    if (m.estado === 'ACTIVA') badgeColor = 'bg-success';
    else if (m.estado === 'PENDIENTE') badgeColor = 'bg-warning text-dark';
    else if (m.estado === 'CANCELADA') badgeColor = 'bg-danger';

    return `
          <tr>
            <td><strong>#${m.idMatricula}</strong></td>
            <td><strong>${m.alumno ? escapeHtml(m.alumno.apellido + ', ' + m.alumno.nombre) : '—'}</strong></td>
            <td>${m.alumno ? escapeHtml(m.alumno.dni) : '—'}</td>
            <td><span class="badge bg-light text-dark border">${m.cicloLectivo ? m.cicloLectivo.anio : '—'}</span></td>
            <td>${formatDate(m.fecha)}</td>
            <td>${formatCurrency(m.importe)}</td>
            <td><span class="badge ${badgeColor}">${escapeHtml(m.estado)}</span></td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-warning me-1" onclick="abrirCambioEstado(${m.idMatricula}, '${escapeHtml(m.estado)}')" title="Cambiar Estado">
                <i class="bi bi-arrow-repeat"></i>
              </button>
              <a href="../cuotas/cuotas.html?matriculaId=${m.idMatricula}" class="btn btn-sm btn-outline-primary" title="Ver Cuotas">
                <i class="bi bi-cash-stack"></i>
              </a>
            </td>
          </tr>
        `;
}).join('');
}

    document.getElementById('btn-nueva-matricula').addEventListener('click', () => {
    document.getElementById('form-matricula').reset();
    document.getElementById('modal-matricula-alert').innerHTML = '';
    modalMatricula.show();
});

    function abrirCambioEstado(id, estadoActual) {
    idMatriculaSeleccionada = id;
    document.getElementById('desc-mat-cambio').textContent = `#${id}`;
    document.getElementById('select-nuevo-estado').value = estadoActual;
    modalEstado.show();
}

    document.getElementById('btn-guardar-nuevo-estado').addEventListener('click', async () => {
    if (!idMatriculaSeleccionada) return;
    const nuevoEstado = document.getElementById('select-nuevo-estado').value;

    modalEstado.hide();
    setLoading(true);
    try {
    await MatriculaAPI.cambiarEstado(idMatriculaSeleccionada, nuevoEstado);
    showAlert(document.getElementById('alert-container'), 'Estado de matrícula actualizado.', 'success');
    await cargarInicial();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
    idMatriculaSeleccionada = null;
}
});

    document.getElementById('form-matricula').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-matricula-alert');
    alertEl.innerHTML = '';

    const idAlumno = parseInt(document.getElementById('mat-alumno-id').value);
    const idCiclo = parseInt(document.getElementById('mat-ciclo-id').value);
    const importe = parseFloat(document.getElementById('mat-importe').value);

    if (!idAlumno || !idCiclo || isNaN(importe) || importe < 0) {
    showAlert(alertEl, 'Complete todos los campos obligatorios correctamente.', 'warning');
    return;
}

    setLoading(true);
    try {
    await MatriculaAPI.crear({ idAlumno, idCiclo, importe });
    showAlert(document.getElementById('alert-container'), 'Matrícula emitida con éxito.', 'success');
    modalMatricula.hide();
    await cargarInicial();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-matricula').addEventListener('input', renderTabla);
    document.getElementById('filtro-estado-matricula').addEventListener('change', renderTabla);
    document.getElementById('btn-recargar-matriculas').addEventListener('click', cargarInicial);

    cargarInicial();

    let alumnosList = [];

    async function cargarAlumnos() {
    setLoading(true);
    try {
    alumnosList = await AlumnoAPI.listar();
    const sel = document.getElementById('select-alumno-consulta');
    sel.innerHTML = '<option value="">Seleccione un alumno...</option>';
    alumnosList.forEach(a => {
    sel.innerHTML += `<option value="${a.idAlumno}">${escapeHtml(a.apellido)}, ${escapeHtml(a.nombre)} (DNI: ${a.dni} — Legajo: ${a.legajo || '—'})</option>`;
});
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    async function consultarSituacion() {
    const alumnoId = parseInt(document.getElementById('select-alumno-consulta').value);
    if (!alumnoId) {
    showAlert(document.getElementById('alert-container'), 'Por favor seleccione un alumno.', 'warning');
    return;
}

    setLoading(true);
    try {
    const [alumno, matriculas, todasCuotas] = await Promise.all([
    AlumnoAPI.porId(alumnoId),
    MatriculaAPI.porAlumno(alumnoId),
    CuotaAPI.listar()
    ]);

    // Filtrar cuotas correspondientes a las matrículas de este alumno
    const idsMats = matriculas.map(m => m.idMatricula);
    const cuotasAlumno = todasCuotas.filter(c => c.matricula && idsMats.includes(c.matricula.idMatricula));

    mostrarResumen(alumno, matriculas, cuotasAlumno);
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function mostrarResumen(alumno, matriculas, cuotas) {
    document.getElementById('resultado-situacion').classList.remove('d-none');
    document.getElementById('resumen-nombre-alumno').textContent = `${alumno.apellido}, ${alumno.nombre}`;
    document.getElementById('resumen-dni').textContent = alumno.dni;
    document.getElementById('resumen-legajo').textContent = alumno.legajo || 'Sin legajo';

    const totalMats = matriculas.length;
    let pagadas = 0;
    let pendientes = 0;
    let saldoTotal = 0;

    cuotas.forEach(c => {
    if (c.estado === 'PAGADA') {
    pagadas++;
} else if (c.estado === 'PENDIENTE' || c.estado === 'VENCIDA') {
    pendientes++;
    saldoTotal += Number(c.importe || 0);
}
});

    document.getElementById('kpi-total-matriculas').textContent = totalMats;
    document.getElementById('kpi-cuotas-pagadas').textContent = pagadas;
    document.getElementById('kpi-cuotas-pendientes').textContent = pendientes;
    document.getElementById('kpi-saldo-total').textContent = formatCurrency(saldoTotal);

    const badgeEstado = document.getElementById('resumen-badge-estado');
    if (pendientes === 0) {
    badgeEstado.className = 'fs-5 badge bg-success p-2 px-3';
    badgeEstado.innerHTML = '<i class="bi bi-check-circle me-1"></i>AL DÍA';
} else {
    badgeEstado.className = 'fs-5 badge bg-danger p-2 px-3';
    badgeEstado.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>CON DEUDA (${pendientes} impaga${pendientes > 1 ? 's' : ''})`;
}

    // Renderizar tabla cuotas
    const tbodyCuotas = document.getElementById('tbody-cuotas-alumno');
    if (cuotas.length === 0) {
    renderEmpty(tbodyCuotas, 6, 'No hay cuotas generadas para este alumno');
} else {
    tbodyCuotas.innerHTML = cuotas.map(c => {
    let badgeCls = 'bg-secondary';
    if (c.estado === 'PAGADA') badgeCls = 'bg-success';
    else if (c.estado === 'PENDIENTE') badgeCls = 'bg-primary';
    else if (c.estado === 'VENCIDA') badgeCls = 'bg-danger';
    else if (c.estado === 'ANULADA') badgeCls = 'bg-dark';

    const puedePagar = (c.estado === 'PENDIENTE' || c.estado === 'VENCIDA');

    return `
            <tr>
              <td><strong>Cuota ${c.numeroCuota}</strong></td>
              <td>Matrícula #${c.matricula ? c.matricula.idMatricula : '—'}</td>
              <td>${formatDate(c.fechaVencimiento)}</td>
              <td><strong>${formatCurrency(c.importe)}</strong></td>
              <td><span class="badge ${badgeCls}">${escapeHtml(c.estado)}</span></td>
              <td class="text-center">
                ${puedePagar ? `
                  <a href="../pagos/index.html?cuotaId=${c.idCuota}&importe=${c.importe}" class="btn btn-sm btn-outline-success">
                    <i class="bi bi-credit-card me-1"></i>Pagar
                  </a>
                ` : `<span class="text-muted small">—</span>`}
              </td>
            </tr>
          `;
}).join('');
}

    // Renderizar tabla matriculas
    const tbodyMats = document.getElementById('tbody-matriculas-alumno');
    if (matriculas.length === 0) {
    renderEmpty(tbodyMats, 5, 'No hay matrículas registradas para este alumno');
} else {
    tbodyMats.innerHTML = matriculas.map(m => `
          <tr>
            <td><strong>#${m.idMatricula}</strong></td>
            <td>${m.cicloLectivo ? m.cicloLectivo.anio : '—'}</td>
            <td>${formatDate(m.fecha)}</td>
            <td>${formatCurrency(m.importe)}</td>
            <td><span class="badge ${m.estado === 'ACTIVA' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(m.estado)}</span></td>
          </tr>
        `).join('');
}
}

    document.getElementById('btn-consultar-situacion').addEventListener('click', consultarSituacion);

    cargarAlumnos();

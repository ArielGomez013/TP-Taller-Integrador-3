    let cuotasList = [];
    let matriculasList = [];
    const modalGenerar = new bootstrap.Modal(document.getElementById('modal-generar'));

    // Si viene ?matriculaId=XX en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const filtroMatriculaUrl = urlParams.get('matriculaId');

    async function cargarInicial() {
    setLoading(true);
    try {
    const [cuotas, mats] = await Promise.all([
    filtroMatriculaUrl ? CuotaAPI.porMatricula(filtroMatriculaUrl) : CuotaAPI.listar(),
    MatriculaAPI.listar()
    ]);
    cuotasList = cuotas;
    matriculasList = mats;

    if (filtroMatriculaUrl) {
    document.getElementById('filtro-cuota').value = filtroMatriculaUrl;
}

    poblarSelectMatriculas();
    renderTabla();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function poblarSelectMatriculas() {
    const sel = document.getElementById('gen-matricula-id');
    sel.innerHTML = '<option value="">Seleccione matrícula activa...</option>';
    matriculasList.filter(m => m.estado === 'ACTIVA').forEach(m => {
    sel.innerHTML += `<option value="${m.idMatricula}">#${m.idMatricula} — ${m.alumno ? escapeHtml(m.alumno.apellido + ', ' + m.alumno.nombre) : 'Alumno'}</option>`;
});

    if (filtroMatriculaUrl) {
    sel.value = filtroMatriculaUrl;
}
}

    function renderTabla() {
    const q = document.getElementById('filtro-cuota').value.toLowerCase().trim();
    const est = document.getElementById('filtro-estado-cuota').value;

    const filtradas = cuotasList.filter(c => {
    const matId = c.matricula ? String(c.matricula.idMatricula) : '';
    const matchQ = !q || matId.includes(q) || String(c.idCuota).includes(q);
    const matchEst = !est || c.estado === est;
    return matchQ && matchEst;
});

    document.getElementById('contador-cuotas').textContent = filtradas.length;
    const tbody = document.getElementById('tbody-cuotas');

    if (filtradas.length === 0) {
    renderEmpty(tbody, 7, 'No se encontraron cuotas para los filtros seleccionados');
    return;
}

    tbody.innerHTML = filtradas.map(c => {
    let badgeCls = 'bg-secondary';
    if (c.estado === 'PAGADA') badgeCls = 'bg-success';
    else if (c.estado === 'PENDIENTE') badgeCls = 'bg-primary';
    else if (c.estado === 'VENCIDA') badgeCls = 'bg-danger';
    else if (c.estado === 'ANULADA') badgeCls = 'bg-dark';

    const puedePagar = (c.estado === 'PENDIENTE' || c.estado === 'VENCIDA');

    return `
          <tr>
            <td><strong>#${c.idCuota}</strong></td>
            <td>Matrícula #${c.matricula ? c.matricula.idMatricula : '—'}</td>
            <td><span class="badge bg-light text-dark border">Cuota ${c.numeroCuota}</span></td>
            <td>${formatDate(c.fechaVencimiento)}</td>
            <td><strong>${formatCurrency(c.importe)}</strong></td>
            <td><span class="badge ${badgeCls}">${escapeHtml(c.estado)}</span></td>
            <td class="text-center">
              ${puedePagar ? `
                <a href="../pagos/pagos.html?cuotaId=${c.idCuota}&importe=${c.importe}" class="btn btn-sm btn-success">
                  <i class="bi bi-credit-card me-1"></i>Pagar
                </a>
              ` : `
                <a href="../pagos/pagos.html?cuotaId=${c.idCuota}" class="btn btn-sm btn-outline-secondary" title="Ver Pagos">
                  <i class="bi bi-eye"></i>
                </a>
              `}
            </td>
          </tr>
        `;
}).join('');
}

    document.getElementById('btn-generar-cuotas').addEventListener('click', () => {
    document.getElementById('form-generar-cuotas').reset();
    document.getElementById('gen-cantidad').value = '10';
    const hoy = new Date();
    hoy.setDate(10); // día 10 del mes actual/próximo
    document.getElementById('gen-primer-vto').value = hoy.toISOString().split('T')[0];
    document.getElementById('modal-generar-alert').innerHTML = '';
    if (filtroMatriculaUrl) {
    document.getElementById('gen-matricula-id').value = filtroMatriculaUrl;
}
    modalGenerar.show();
});

    document.getElementById('form-generar-cuotas').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-generar-alert');
    alertEl.innerHTML = '';

    const idMatricula = parseInt(document.getElementById('gen-matricula-id').value);
    const cantidad = parseInt(document.getElementById('gen-cantidad').value);
    const monto = parseFloat(document.getElementById('gen-monto').value);
    const primerVencimiento = document.getElementById('gen-primer-vto').value;

    if (!idMatricula || !cantidad || isNaN(monto) || monto <= 0 || !primerVencimiento) {
    showAlert(alertEl, 'Por favor complete todos los campos con valores válidos.', 'warning');
    return;
}

    setLoading(true);
    try {
    await CuotaAPI.generar({ idMatricula, cantidad, monto, primerVencimiento });
    showAlert(document.getElementById('alert-container'), `Se generaron exitosamente las ${cantidad} cuotas.`, 'success');
    modalGenerar.hide();
    await cargarInicial();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-cuota').addEventListener('input', renderTabla);
    document.getElementById('filtro-estado-cuota').addEventListener('change', renderTabla);
    document.getElementById('btn-recargar-cuotas').addEventListener('click', cargarInicial);

    cargarInicial();

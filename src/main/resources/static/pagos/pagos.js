    let pagosList = [];
    let cuotaActualVerificada = null;

    const urlParams = new URLSearchParams(window.location.search);
    const cuotaParam = urlParams.get('cuotaId');
    const importeParam = urlParams.get('importe');

    if (cuotaParam) {
    document.getElementById('pago-cuota-id').value = cuotaParam;
    if (importeParam) {
    document.getElementById('pago-importe').value = importeParam;
}
}

    async function cargarPagos() {
    setLoading(true);
    try {
    pagosList = await PagoAPI.listar();
    renderTabla();
    if (cuotaParam) {
    verificarCuota();
}
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function renderTabla() {
    const q = document.getElementById('filtro-pagos').value.toLowerCase().trim();
    const filtrados = pagosList.filter(p => {
    const id = String(p.idPago || '');
    const cuotaId = String(p.idCuota ?? '');
    const medio = (p.medioPago || '').toLowerCase();
    return !q || id.includes(q) || cuotaId.includes(q) || medio.includes(q);
});

    const tbody = document.getElementById('tbody-pagos');
    if (filtrados.length === 0) {
    renderEmpty(tbody, 6, 'No hay pagos registrados para el filtro');
    return;
}

    tbody.innerHTML = filtrados.map(p => `
        <tr>
          <td><strong>#${p.idPago}</strong></td>
          <td><span class="badge bg-light text-dark border">Cuota #${p.idCuota ?? '—'}</span></td>
          <td>${formatDate(p.fecha)}</td>
          <td><strong class="text-success">${formatCurrency(p.importe)}</strong></td>
          <td><span class="badge bg-info text-dark">${escapeHtml(p.medioPago || '—')}</span></td>
          <td><small class="text-muted">${p.usuario ? escapeHtml(p.usuario.username) : 'Sistema'}</small></td>
        </tr>
      `).join('');
}

    async function verificarCuota() {
    const id = parseInt(document.getElementById('pago-cuota-id').value);
    const infoBox = document.getElementById('info-cuota-wrap');
    if (!id) {
    infoBox.classList.add('d-none');
    return;
}

    setLoading(true);
    try {
    cuotaActualVerificada = await CuotaAPI.porId(id);
    infoBox.classList.remove('d-none');
    const puede = (cuotaActualVerificada.estado === 'PENDIENTE' || cuotaActualVerificada.estado === 'VENCIDA');
    infoBox.innerHTML = `
          <strong>Cuota N° ${cuotaActualVerificada.numeroCuota}</strong> (Matrícula #${cuotaActualVerificada.matricula?.idMatricula || '—'})<br/>
          Vencimiento: ${formatDate(cuotaActualVerificada.fechaVencimiento)} &bull; Importe: ${formatCurrency(cuotaActualVerificada.importe)}<br/>
          Estado actual: <span class="badge ${puede ? 'bg-primary' : 'bg-secondary'}">${cuotaActualVerificada.estado}</span>
        `;
    if (puede && !document.getElementById('pago-importe').value) {
    document.getElementById('pago-importe').value = cuotaActualVerificada.importe;
}
} catch (err) {
    infoBox.classList.remove('d-none');
    infoBox.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>${escapeHtml(err.message)}</span>`;
    cuotaActualVerificada = null;
} finally {
    setLoading(false);
}
}

    document.getElementById('btn-verificar-cuota').addEventListener('click', verificarCuota);

    document.getElementById('form-pago').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('form-pago-alert');
    alertEl.innerHTML = '';

    const idCuota = parseInt(document.getElementById('pago-cuota-id').value);
    const importe = parseFloat(document.getElementById('pago-importe').value);
    const medioPago = document.getElementById('pago-medio').value;

    if (!idCuota || isNaN(importe) || importe <= 0) {
    showAlert(alertEl, 'Complete la cuota y un importe válido mayor a cero.', 'warning');
    return;
}

    const currentUser = AuthAPI.getUsuario();
    const payload = {
    idCuota,
    importe,
    medioPago,
    idUsuario: currentUser?.idUsuario || null
};

    setLoading(true);
    try {
    const resp = await PagoAPI.registrar(payload);
    showAlert(document.getElementById('alert-container'), `✅ Pago #${resp.idPago} de ${formatCurrency(resp.importe)} registrado con éxito.`, 'success');
    document.getElementById('form-pago').reset();
    document.getElementById('info-cuota-wrap').classList.add('d-none');
    await cargarPagos();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-pagos').addEventListener('input', renderTabla);
    document.getElementById('btn-recargar-pagos').addEventListener('click', cargarPagos);

    cargarPagos();

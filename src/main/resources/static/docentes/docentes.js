    let docentesList = [];
    let idEliminarDocente = null;
    const modalDocente = new bootstrap.Modal(document.getElementById('modal-docente'));
    const modalEliminarDocente = new bootstrap.Modal(document.getElementById('modal-confirmar-eliminar-docente'));

    async function cargarDocentes() {
    setLoading(true);
    try {
    docentesList = await DocenteAPI.listar();
    renderTabla();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function renderTabla() {
    const q = document.getElementById('filtro-busqueda').value.toLowerCase().trim();
    const est = document.getElementById('filtro-estado').value;

    const filtrados = docentesList.filter(d => {
    const matchQ = !q ||
    (d.dni && d.dni.toLowerCase().includes(q)) ||
    (d.apellido && d.apellido.toLowerCase().includes(q)) ||
    (d.nombre && d.nombre.toLowerCase().includes(q)) ||
    (d.especialidad && d.especialidad.toLowerCase().includes(q));
    const matchEst = !est || (d.estado && d.estado.toUpperCase() === est);
    return matchQ && matchEst;
});

    document.getElementById('contador-docentes').textContent = filtrados.length;
    const tbody = document.getElementById('tbody-docentes');

    if (filtrados.length === 0) {
    renderEmpty(tbody, 8, 'No se encontraron docentes con los criterios seleccionados');
    return;
}

    tbody.innerHTML = filtrados.map(d => `
        <tr>
          <td><strong>#${d.idDocente}</strong></td>
          <td>${escapeHtml(d.dni || '—')}</td>
          <td><strong>${escapeHtml(d.apellido)}, ${escapeHtml(d.nombre)}</strong></td>
          <td><span class="badge bg-light text-dark border">${escapeHtml(d.especialidad || 'General')}</span></td>
          <td><small>${escapeHtml(d.email || '—')}</small></td>
          <td><small>${escapeHtml(d.telefono || '—')}</small></td>
          <td>
            <span class="badge ${d.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(d.estado)}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirEditar(${d.idDocente})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="abrirEliminar(${d.idDocente}, '${escapeHtml(d.apellido + ', ' + d.nombre)}')" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
}

    document.getElementById('btn-nuevo-docente').addEventListener('click', () => {
    document.getElementById('form-docente').reset();
    document.getElementById('docente-id').value = '';
    document.getElementById('docente-estado').value = 'ACTIVO';
    document.getElementById('modal-docente-alert').innerHTML = '';
    document.getElementById('modalDocenteLabel').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Nuevo Docente';
    modalDocente.show();
});

    function abrirEditar(id) {
    const d = docentesList.find(item => item.idDocente === id);
    if (!d) return;

    document.getElementById('form-docente').reset();
    document.getElementById('docente-id').value = d.idDocente;
    document.getElementById('docente-dni').value = d.dni || '';
    document.getElementById('docente-apellido').value = d.apellido || '';
    document.getElementById('docente-nombre').value = d.nombre || '';
    document.getElementById('docente-especialidad').value = d.especialidad || '';
    document.getElementById('docente-email').value = d.email || '';
    document.getElementById('docente-telefono').value = d.telefono || '';
    document.getElementById('docente-estado').value = d.estado || 'ACTIVO';

    document.getElementById('modal-docente-alert').innerHTML = '';
    document.getElementById('modalDocenteLabel').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Editar Docente #${d.idDocente}`;
    modalDocente.show();
}

    function abrirEliminar(id, nombre) {
    idEliminarDocente = id;
    document.getElementById('eliminar-nombre-docente').textContent = nombre;
    modalEliminarDocente.show();
}

    document.getElementById('btn-confirmar-eliminar-docente').addEventListener('click', async () => {
    if (!idEliminarDocente) return;
    modalEliminarDocente.hide();
    setLoading(true);
    try {
    await DocenteAPI.eliminar(idEliminarDocente);
    showAlert(document.getElementById('alert-container'), 'Docente eliminado correctamente.', 'success');
    await cargarDocentes();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
    idEliminarDocente = null;
}
});

    document.getElementById('form-docente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const alertModal = document.getElementById('modal-docente-alert');
    alertModal.innerHTML = '';

    if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
}

    const id = document.getElementById('docente-id').value;
    const data = {
    dni: document.getElementById('docente-dni').value.trim(),
    apellido: document.getElementById('docente-apellido').value.trim(),
    nombre: document.getElementById('docente-nombre').value.trim(),
    especialidad: document.getElementById('docente-especialidad').value.trim() || null,
    email: document.getElementById('docente-email').value.trim(),
    telefono: document.getElementById('docente-telefono').value.trim() || null,
    estado: document.getElementById('docente-estado').value,
};

    setLoading(true);
    try {
    if (id) {
    await DocenteAPI.actualizar(id, data);
    showAlert(document.getElementById('alert-container'), 'Docente actualizado correctamente.', 'success');
} else {
    await DocenteAPI.guardar(data);
    showAlert(document.getElementById('alert-container'), 'Docente registrado con éxito.', 'success');
}
    modalDocente.hide();
    await cargarDocentes();
} catch (err) {
    showAlert(alertModal, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-busqueda').addEventListener('input', renderTabla);
    document.getElementById('filtro-estado').addEventListener('change', renderTabla);
    document.getElementById('btn-recargar').addEventListener('click', cargarDocentes);

    cargarDocentes();
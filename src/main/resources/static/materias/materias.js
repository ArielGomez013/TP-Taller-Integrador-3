    let materiasList = [];
    let idBajaPendiente = null;
    const modalMateria = new bootstrap.Modal(document.getElementById('modal-materia'));
    const modalBajaMateria = new bootstrap.Modal(document.getElementById('modal-baja-materia'));

    async function cargarMaterias() {
    setLoading(true);
    try {
    materiasList = await MateriaAPI.listar(false);
    renderTabla();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function renderTabla() {
    const q = document.getElementById('filtro-materia').value.toLowerCase().trim();
    const filtroEst = document.getElementById('filtro-estado-materia').value;

    const filtradas = materiasList.filter(m => {
    const matchQ = !q ||
    (m.nombre && m.nombre.toLowerCase().includes(q)) ||
    (m.descripcion && m.descripcion.toLowerCase().includes(q));
    let matchEst = true;
    if (filtroEst === 'soloActivas') matchEst = (m.estado === 'ACTIVO');
    else if (filtroEst === 'inactivas') matchEst = (m.estado !== 'ACTIVO');
    return matchQ && matchEst;
});

    document.getElementById('contador-materias').textContent = filtradas.length;
    const tbody = document.getElementById('tbody-materias');

    if (filtradas.length === 0) {
    renderEmpty(tbody, 5, 'No se encontraron materias con los criterios seleccionados');
    return;
}

    tbody.innerHTML = filtradas.map(m => `
        <tr>
          <td><strong>#${m.idMateria}</strong></td>
          <td><strong>${escapeHtml(m.nombre)}</strong></td>
          <td><small class="text-muted">${escapeHtml(m.descripcion || '—')}</small></td>
          <td>
            <span class="badge ${m.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${escapeHtml(m.estado)}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirEditarMateria(${m.idMateria})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            ${m.estado === 'ACTIVO'
    ? `<button class="btn btn-sm btn-outline-danger" onclick="abrirBajaMateria(${m.idMateria}, '${escapeHtml(m.nombre)}')" title="Baja Lógica">
                  <i class="bi bi-slash-circle"></i>
                 </button>`
    : '<span class="text-muted small">Inactiva</span>'
}
          </td>
        </tr>
      `).join('');
}

    document.getElementById('btn-nueva-materia').addEventListener('click', () => {
    document.getElementById('form-materia').reset();
    document.getElementById('materia-id').value = '';
    document.getElementById('modal-materia-alert').innerHTML = '';
    document.getElementById('modalMateriaLabel').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nueva Materia';
    modalMateria.show();
});

    function abrirEditarMateria(id) {
    const m = materiasList.find(item => item.idMateria === id);
    if (!m) return;

    document.getElementById('form-materia').reset();
    document.getElementById('materia-id').value = m.idMateria;
    document.getElementById('materia-nombre').value = m.nombre || '';
    document.getElementById('materia-descripcion').value = m.descripcion || '';
    document.getElementById('modal-materia-alert').innerHTML = '';
    document.getElementById('modalMateriaLabel').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Editar Materia #${m.idMateria}`;
    modalMateria.show();
}

    function abrirBajaMateria(id, nombre) {
    idBajaPendiente = id;
    document.getElementById('baja-nombre-materia').textContent = nombre;
    modalBajaMateria.show();
}

    document.getElementById('btn-confirmar-baja-materia').addEventListener('click', async () => {
    if (!idBajaPendiente) return;
    modalBajaMateria.hide();
    setLoading(true);
    try {
    await MateriaAPI.bajaLogica(idBajaPendiente);
    showAlert(document.getElementById('alert-container'), 'Materia dada de baja lógica exitosamente.', 'success');
    await cargarMaterias();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
    idBajaPendiente = null;
}
});

    document.getElementById('form-materia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const alertModal = document.getElementById('modal-materia-alert');
    alertModal.innerHTML = '';

    if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
}

    const id = document.getElementById('materia-id').value;
    const data = {
    nombre: document.getElementById('materia-nombre').value.trim(),
    descripcion: document.getElementById('materia-descripcion').value.trim() || null,
};

    setLoading(true);
    try {
    if (id) {
    await MateriaAPI.actualizar(id, data);
    showAlert(document.getElementById('alert-container'), 'Materia actualizada correctamente.', 'success');
} else {
    await MateriaAPI.crear(data);
    showAlert(document.getElementById('alert-container'), 'Materia registrada exitosamente.', 'success');
}
    modalMateria.hide();
    await cargarMaterias();
} catch (err) {
    showAlert(alertModal, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-materia').addEventListener('input', renderTabla);
    document.getElementById('filtro-estado-materia').addEventListener('change', renderTabla);
    document.getElementById('btn-recargar-materias').addEventListener('click', cargarMaterias);

    cargarMaterias();

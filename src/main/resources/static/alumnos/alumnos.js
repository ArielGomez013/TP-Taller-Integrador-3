
    let alumnosList = [];
    let idEliminarPendiente = null;
    const modalAlumno = new bootstrap.Modal(document.getElementById('modal-alumno'));
    const modalEliminar = new bootstrap.Modal(document.getElementById('modal-confirmar-eliminar'));

    async function cargarAlumnos() {
    setLoading(true);
    try {
    alumnosList = await AlumnoAPI.listar();
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

    const filtrados = alumnosList.filter(a => {
    const matchQ = !q ||
    (a.dni && a.dni.toLowerCase().includes(q)) ||
    (a.legajo && a.legajo.toLowerCase().includes(q)) ||
    (a.apellido && a.apellido.toLowerCase().includes(q)) ||
    (a.nombre && a.nombre.toLowerCase().includes(q));
    const matchEst = !est || (a.estado && a.estado.toUpperCase() === est);
    return matchQ && matchEst;

});

    document.getElementById('contador-alumnos').textContent = filtrados.length;
    const tbody = document.getElementById('tbody-alumnos');

    if (filtrados.length === 0) {
    renderEmpty(tbody, 9, 'No se encontraron alumnos con los criterios seleccionados');
    return;
}

    tbody.innerHTML = filtrados.map(a => `
        <tr>
          <td><strong>#${a.idAlumno}</strong></td>
          <td><span class="badge bg-light text-dark border">${escapeHtml(a.legajo || '—')}</span></td>
          <td>${escapeHtml(a.dni || '—')}</td>
          <td><strong>${escapeHtml(a.apellido)}, ${escapeHtml(a.nombre)}</strong></td>
          <td><small>${escapeHtml(a.email || '—')}</small></td>
          <td><small>${escapeHtml(a.telefono || '—')}</small></td>
          <td>${formatDate(a.fechaNacimiento)}</td>
          <td>
            <span class="badge ${a.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(a.estado)}</span>
           <td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirEditar(${a.idAlumno})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            ${tieneRol('ADMIN') ? `
              <button class="btn btn-sm btn-outline-danger" onclick="abrirEliminar(${a.idAlumno}, '${escapeHtml(a.apellido + ', ' + a.nombre)}')" title="Eliminar">
                <i class="bi bi-trash"></i>
              </button>` : ''}
          </td>
        </tr>
      `).join('');
}

    document.getElementById('btn-nuevo-alumno').addEventListener('click', () => {
    document.getElementById('form-alumno').reset();
    document.getElementById('alumno-id').value = '';
    document.getElementById('alumno-estado').value = 'ACTIVO';
    document.getElementById('modal-alumno-alert').innerHTML = '';
    document.getElementById('modalAlumnoLabel').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Nuevo Alumno';
    modalAlumno.show();
});

    function abrirEditar(id) {
    const a = alumnosList.find(item => item.idAlumno === id);
    if (!a) return;

    document.getElementById('form-alumno').reset();
    document.getElementById('alumno-id').value = a.idAlumno;
    document.getElementById('alumno-legajo').value = a.legajo || '';
    document.getElementById('alumno-dni').value = a.dni || '';
    document.getElementById('alumno-apellido').value = a.apellido || '';
    document.getElementById('alumno-nombre').value = a.nombre || '';
    document.getElementById('alumno-email').value = a.email || '';
    document.getElementById('alumno-telefono').value = a.telefono || '';
    document.getElementById('alumno-fechanac').value = a.fechaNacimiento || '';
    document.getElementById('alumno-fechaingreso').value = a.fechaIngreso || '';
    document.getElementById('alumno-domicilio').value = a.domicilio || '';
    document.getElementById('alumno-estado').value = a.estado || 'ACTIVO';

    document.getElementById('modal-alumno-alert').innerHTML = '';
    document.getElementById('modalAlumnoLabel').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Editar Alumno #${a.idAlumno}`;
    modalAlumno.show();
}

    function abrirEliminar(id, nombre) {
    idEliminarPendiente = id;
    document.getElementById('eliminar-nombre-alumno').textContent = nombre;
    modalEliminar.show();
}

    document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
    if (!idEliminarPendiente) return;
    modalEliminar.hide();
    setLoading(true);
    try {
    await AlumnoAPI.eliminar(idEliminarPendiente);
    showAlert(document.getElementById('alert-container'), 'Alumno eliminado correctamente.', 'success');
    await cargarAlumnos();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
    idEliminarPendiente = null;
}
});

    document.getElementById('form-alumno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const alertModal = document.getElementById('modal-alumno-alert');
    alertModal.innerHTML = '';

    if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
}

    const id = document.getElementById('alumno-id').value;
    const data = {
    legajo: document.getElementById('alumno-legajo').value.trim(),
    dni: document.getElementById('alumno-dni').value.trim(),
    apellido: document.getElementById('alumno-apellido').value.trim(),
    nombre: document.getElementById('alumno-nombre').value.trim(),
    email: document.getElementById('alumno-email').value.trim(),
    telefono: document.getElementById('alumno-telefono').value.trim() || null,
    fechaNacimiento: document.getElementById('alumno-fechanac').value,
    fechaIngreso: document.getElementById('alumno-fechaingreso').value || null,
    domicilio: document.getElementById('alumno-domicilio').value.trim() || null,
    estado: document.getElementById('alumno-estado').value,
};

    setLoading(true);
    try {
    if (id) {
    await AlumnoAPI.actualizar(id, data);
    showAlert(document.getElementById('alert-container'), 'Alumno actualizado correctamente.', 'success');
} else {
    await AlumnoAPI.guardar(data);
    showAlert(document.getElementById('alert-container'), 'Alumno registrado con éxito.', 'success');
}
    modalAlumno.hide();
    await cargarAlumnos();
} catch (err) {
    showAlert(alertModal, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-busqueda').addEventListener('input', renderTabla);
    document.getElementById('filtro-estado').addEventListener('change', renderTabla);
    document.getElementById('btn-recargar').addEventListener('click', cargarAlumnos);

    cargarAlumnos();

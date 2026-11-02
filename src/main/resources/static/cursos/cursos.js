    let cursosList = [];
    let ciclosList = [];
    let materiasList = [];
    let docentesList = [];
    let cursoActivo = null;

    const modalCurso = new bootstrap.Modal(document.getElementById('modal-curso'));
    const modalAsignar = new bootstrap.Modal(document.getElementById('modal-asignar-materia'));
    const modalCiclo = new bootstrap.Modal(document.getElementById('modal-ciclo'));

    async function cargarInicial() {
    setLoading(true);
    try {
    const [cursos, ciclos, materias, docentes] = await Promise.all([
    CursoAPI.listar(),
    CicloLectivoAPI.listar(),
    MateriaAPI.listar(true),
    DocenteAPI.listar()
    ]);
    cursosList = cursos;
    ciclosList = ciclos;
    materiasList = materias;
    docentesList = docentes;

    poblarSelects();
    renderCursos();
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    function poblarSelects() {
    // Filtro ciclo
    const filtro = document.getElementById('filtro-ciclo');
    filtro.innerHTML = '<option value="">Todos los ciclos</option>';
    ciclosList.forEach(c => {
    filtro.innerHTML += `<option value="${c.idCiclo}">${c.anio} (${c.estado})</option>`;
});

    // Select ciclo en modal nuevo curso
    const selCursoCiclo = document.getElementById('curso-ciclo');
    selCursoCiclo.innerHTML = '<option value="">Seleccione ciclo lectivo...</option>';
    ciclosList.forEach(c => {
    selCursoCiclo.innerHTML += `<option value="${c.idCiclo}">${c.anio}</option>`;
});

    // Select materias en modal asignación
    const selMat = document.getElementById('asignar-materia-id');
    selMat.innerHTML = '<option value="">Seleccione materia activa...</option>';
    materiasList.forEach(m => {
    selMat.innerHTML += `<option value="${m.idMateria}">${escapeHtml(m.nombre)}</option>`;
});

    // Select docentes en modal asignación
    const selDoc = document.getElementById('asignar-docente-id');
    selDoc.innerHTML = '<option value="">Sin docente asignado por ahora</option>';
    docentesList.filter(d => d.estado === 'ACTIVO').forEach(d => {
    selDoc.innerHTML += `<option value="${d.idDocente}">${escapeHtml(d.apellido)}, ${escapeHtml(d.nombre)} (${escapeHtml(d.especialidad || 'General')})</option>`;
});
}

    function renderCursos() {
    const cicloFiltro = document.getElementById('filtro-ciclo').value;
    const filtrados = cicloFiltro
    ? cursosList.filter(c => c.cicloLectivo && String(c.cicloLectivo.idCiclo) === cicloFiltro)
    : cursosList;

    const tbody = document.getElementById('tbody-cursos');
    if (filtrados.length === 0) {
    renderEmpty(tbody, 4, 'No hay cursos registrados para este filtro');
    return;
}

    tbody.innerHTML = filtrados.map(c => `
        <tr class="${cursoActivo && cursoActivo.idCurso === c.idCurso ? 'table-primary' : ''}">
          <td><span class="badge bg-secondary">${c.cicloLectivo ? c.cicloLectivo.anio : '—'}</span></td>
          <td><strong>${c.anioCursado}° Año "${escapeHtml(c.division)}"</strong></td>
          <td>${c.capacidadMaxima} alumnos</td>
          <td class="text-center">
            <button class="btn btn-sm btn-primary-custom" onclick="seleccionarCurso(${c.idCurso})">
              <i class="bi bi-eye me-1"></i>Ver Materias
            </button>
          </td>
        </tr>
      `).join('');
}

    async function seleccionarCurso(idCurso) {
    cursoActivo = cursosList.find(c => c.idCurso === idCurso);
    renderCursos();

    if (!cursoActivo) return;

    document.getElementById('curso-seleccionado-info').className = 'alert alert-info py-2 small mb-3';
    document.getElementById('curso-seleccionado-info').innerHTML = `
        <strong>Curso:</strong> ${cursoActivo.anioCursado}° "${escapeHtml(cursoActivo.division)}" (${cursoActivo.cicloLectivo?.anio || ''}) &bull; Capacidad: ${cursoActivo.capacidadMaxima}
      `;
    document.getElementById('btn-asignar-materia').classList.remove('d-none');

    setLoading(true);
    try {
    const materias = await CursoAPI.materiasPorCurso(idCurso);
    const tbody = document.getElementById('tbody-materias-curso');

    if (!materias || materias.length === 0) {
    renderEmpty(tbody, 3, 'Este curso no tiene materias asignadas aún');
    return;
}

    tbody.innerHTML = materias.map(cm => `
          <tr>
            <td><strong>#${cm.idCursoMateria}</strong></td>
            <td><strong>${escapeHtml(cm.materia ? cm.materia.nombre : '—')}</strong></td>
            <td><small>${cm.docente ? escapeHtml(cm.docente.apellido + ', ' + cm.docente.nombre) : '<em class="text-muted">Sin docente</em>'}</small></td>
          </tr>
        `).join('');
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    document.getElementById('btn-nuevo-curso').addEventListener('click', () => {
    document.getElementById('form-curso').reset();
    document.getElementById('curso-capacidad').value = '30';
    document.getElementById('modal-curso-alert').innerHTML = '';
    modalCurso.show();
});

    document.getElementById('btn-nuevo-ciclo').addEventListener('click', () => {
    document.getElementById('form-ciclo').reset();
    document.getElementById('ciclo-anio').value = new Date().getFullYear();
    document.getElementById('modal-ciclo-alert').innerHTML = '';
    modalCiclo.show();
});

    document.getElementById('btn-asignar-materia').addEventListener('click', () => {
    if (!cursoActivo) return;
    document.getElementById('form-asignar-materia').reset();
    document.getElementById('modal-asignar-curso-desc').textContent =
    `Asignando asignatura a: ${cursoActivo.anioCursado}° "${cursoActivo.division}" (${cursoActivo.cicloLectivo?.anio || ''})`;
    document.getElementById('modal-asignar-alert').innerHTML = '';
    modalAsignar.show();
});

    document.getElementById('form-curso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-curso-alert');
    alertEl.innerHTML = '';

    const data = {
    idCiclo: parseInt(document.getElementById('curso-ciclo').value),
    anioCursado: parseInt(document.getElementById('curso-anio').value),
    division: document.getElementById('curso-division').value.trim(),
    capacidadMaxima: parseInt(document.getElementById('curso-capacidad').value),
};

    if (!data.idCiclo || !data.anioCursado || !data.division || !data.capacidadMaxima) {
    showAlert(alertEl, 'Complete todos los campos obligatorios.', 'warning');
    return;
}

    setLoading(true);
    try {
    await CursoAPI.crear(data);
    showAlert(document.getElementById('alert-container'), 'Curso registrado con éxito.', 'success');
    modalCurso.hide();
    await cargarInicial();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('form-asignar-materia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-asignar-alert');
    alertEl.innerHTML = '';

    const idMateria = parseInt(document.getElementById('asignar-materia-id').value);
    const docVal = document.getElementById('asignar-docente-id').value;
    const idDocente = docVal ? parseInt(docVal) : null;

    if (!idMateria || !cursoActivo) {
    showAlert(alertEl, 'Seleccione una materia.', 'warning');
    return;
}

    const data = {
    idCurso: cursoActivo.idCurso,
    idMateria: idMateria,
    idDocente: idDocente
};

    setLoading(true);
    try {
    await CursoAPI.asignarMateria(cursoActivo.idCurso, data);
    showAlert(document.getElementById('alert-container'), 'Materia asignada al curso con éxito.', 'success');
    modalAsignar.hide();
    await seleccionarCurso(cursoActivo.idCurso);
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('form-ciclo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-ciclo-alert');
    alertEl.innerHTML = '';

    const data = {
    anio: parseInt(document.getElementById('ciclo-anio').value),
    fechaInicio: document.getElementById('ciclo-inicio').value,
    fechaFin: document.getElementById('ciclo-fin').value,
};

    if (!data.anio || !data.fechaInicio || !data.fechaFin) {
    showAlert(alertEl, 'Complete todos los campos del ciclo.', 'warning');
    return;
}

    setLoading(true);
    try {
    await CicloLectivoAPI.crear(data);
    showAlert(document.getElementById('alert-container'), 'Ciclo lectivo creado exitosamente.', 'success');
    modalCiclo.hide();
    await cargarInicial();
} catch (err) {
    showAlert(alertEl, err.message, 'danger');
} finally {
    setLoading(false);
}
});

    document.getElementById('filtro-ciclo').addEventListener('change', renderCursos);

    cargarInicial();

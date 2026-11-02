    async function inicializar() {
    const usuarioLogueado = AuthAPI.getUsuario();

    if (usuarioLogueado && usuarioLogueado.idAlumno) {
    // Alumno logueado automáticamente
    document.getElementById('card-selector-alumno').classList.add('d-none');
    cargarPortalAlumno(usuarioLogueado.idAlumno);
} else {
    // Cargar selector de alumnos
    setLoading(true);
    try {
    const alumnos = await AlumnoAPI.listar();
    const sel = document.getElementById('sel-alumno-propio');
    sel.innerHTML = '<option value="">Seleccione alumno...</option>';
    alumnos.forEach(a => {
    sel.innerHTML += `<option value="${a.idAlumno}">${escapeHtml(a.apellido)}, ${escapeHtml(a.nombre)} (DNI: ${a.dni})</option>`;
});
} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}
}

    async function cargarPortalAlumno(idAlumno) {
    setLoading(true);
    try {
    const [alumno, inscripciones, calificaciones, asistenciaResumen] = await Promise.all([
    AlumnoAPI.porId(idAlumno),
    InscripcionAPI.porAlumno(idAlumno).catch(() => []),
    CalificacionAPI.porAlumno(idAlumno).catch(() => []),
    AsistenciaAPI.resumen(idAlumno).catch(() => ({ total: 0, presentes: 0, ausentes: 0, porcentaje: 0 }))
    ]);

    document.getElementById('portal-contenido').classList.remove('d-none');

    // Datos personales
    document.getElementById('alum-nombre-completo').textContent = `${alumno.apellido}, ${alumno.nombre}`;
    document.getElementById('alum-legajo').textContent = `Legajo: ${alumno.legajo || '—'}`;
    document.getElementById('alum-estado').textContent = alumno.estado || 'ACTIVO';
    document.getElementById('alum-dni').textContent = alumno.dni || '—';
    document.getElementById('alum-fechanac').textContent = formatDate(alumno.fechaNacimiento);
    document.getElementById('alum-email').textContent = alumno.email || '—';
    document.getElementById('alum-telefono').textContent = alumno.telefono || '—';
    document.getElementById('alum-ingreso').textContent = formatDate(alumno.fechaIngreso);

    // Asistencias
    document.getElementById('asis-total').textContent = asistenciaResumen.total ?? 0;
    document.getElementById('asis-presentes').textContent = asistenciaResumen.presentes ?? 0;
    document.getElementById('asis-ausentes').textContent = asistenciaResumen.ausentes ?? 0;
    const pct = Math.round(asistenciaResumen.porcentaje ?? 0);
    document.getElementById('asis-porcentaje-texto').textContent = `${pct}%`;
    const barra = document.getElementById('asis-barra');
    barra.style.width = `${pct}%`;
    barra.textContent = `${pct}%`;
    barra.className = 'progress-bar ' + (pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-warning text-dark' : 'bg-danger');

    // Calificaciones
    const tbodyCali = document.getElementById('tbody-mis-calificaciones');
    if (!calificaciones || calificaciones.length === 0) {
    renderEmpty(tbodyCali, 3, 'No tienes calificaciones cargadas aún');
    document.getElementById('promedio-general').textContent = '—';
    document.getElementById('total-evaluaciones-rendidas').textContent = '0';
} else {
    let sumaNotas = 0;
    tbodyCali.innerHTML = calificaciones.map(c => {
    sumaNotas += Number(c.nota || 0);
    return `
              <tr>
                <td><strong>Evaluación #${c.evaluacionId}</strong></td>
                <td>${badgeNota(c.nota)}</td>
                <td><small class="text-muted">${escapeHtml(c.observaciones || '—')}</small></td>
              </tr>
            `;
}).join('');

    const prom = (sumaNotas / calificaciones.length).toFixed(2);
    document.getElementById('promedio-general').textContent = prom;
    document.getElementById('total-evaluaciones-rendidas').textContent = calificaciones.length;
}

    // Inscripciones
    const tbodyInsc = document.getElementById('tbody-mis-inscripciones');
    if (!inscripciones || inscripciones.length === 0) {
    renderEmpty(tbodyInsc, 4, 'No tienes inscripciones a cursos');
} else {
    tbodyInsc.innerHTML = inscripciones.map(i => `
            <tr>
              <td><strong>#${i.id}</strong></td>
              <td>Curso #${i.cursoId}</td>
              <td>${formatDate(i.fecha)}</td>
              <td>${badgeEstadoInscripcion(i.estado)}</td>
            </tr>
          `).join('');
}

} catch (err) {
    showAlert(document.getElementById('alert-container'), err.message, 'danger');
} finally {
    setLoading(false);
}
}

    document.getElementById('btn-cargar-mi-portal').addEventListener('click', () => {
    const id = parseInt(document.getElementById('sel-alumno-propio').value);
    if (!id) {
    showAlert(document.getElementById('alert-container'), 'Seleccione un alumno.', 'warning');
    return;
}
    cargarPortalAlumno(id);
});

    inicializar();

/**
 * api.js — Módulo central de comunicación con el backend Spring Boot
 * Base URL: http://localhost:8080/api
 */

const API_BASE = 'http://localhost:8080/api';

/* ============================================================
   HELPER CENTRAL — apiFetch
   ============================================================ */
async function apiFetch(url, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${url}`, config);
  } catch (networkErr) {
    throw new Error(
      'No se pudo conectar con el servidor. Verifique que el backend esté corriendo en http://localhost:8080'
    );
  }

  if (response.status === 204) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const serverMessage =
      body?.message ||
      body?.error ||
      body?.detail ||
      (typeof body === 'string' ? body : null) ||
      `Error ${response.status}: ${response.statusText}`;
    throw new Error(serverMessage);
  }

  return body;
}

/* ============================================================
   AUTH API — Gestión de Sesión y Acceso
   ============================================================ */
const AuthAPI = {
  async login(username, password) {
    const res = await apiFetch('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('currentUser', JSON.stringify(res));
    return res;
  },

  logout() {
    localStorage.removeItem('currentUser');
    window.location.href = (window.location.pathname.includes('/') && !window.location.pathname.endsWith('/login.html'))
      ? (window.location.pathname.split('/').length > 2 ? '../login.html' : 'login.html')
      : 'login.html';
  },

  getUsuario() {
    const u = localStorage.getItem('currentUser');
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn() {
    return this.getUsuario() !== null;
  },

  initNavbarUser() {
    const u = this.getUsuario();
    const userContainer = document.getElementById('navbar-user-info');
    if (!userContainer) return;

    if (u) {
      userContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2 text-white">
          <span class="badge bg-light text-primary fw-bold"><i class="bi bi-person-circle me-1"></i>${escapeHtml(u.username)} (${escapeHtml(u.rol || 'USER')})</span>
          <button class="btn btn-sm btn-outline-light" onclick="AuthAPI.logout()">
            <i class="bi bi-box-arrow-right"></i> Salir
          </button>
        </div>`;
    } else {
      userContainer.innerHTML = `
        <a href="${window.location.pathname.split('/').length > 2 ? '../login.html' : 'login.html'}" class="btn btn-sm btn-outline-light">
          <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
        </a>`;
    }
  }
};

/* ============================================================
   ALUMNO API
   ============================================================ */
const AlumnoAPI = {
  listar() {
    return apiFetch('/alumnos');
  },
  porId(id) {
    return apiFetch(`/alumnos/${id}`);
  },
  guardar(data) {
    return apiFetch('/alumnos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizar(id, data) {
    return apiFetch(`/alumnos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  eliminar(id) {
    return apiFetch(`/alumnos/${id}`, { method: 'DELETE' });
  }
};

/* ============================================================
   DOCENTE API
   ============================================================ */
const DocenteAPI = {
  listar() {
    return apiFetch('/docentes');
  },
  porId(id) {
    return apiFetch(`/docentes/${id}`);
  },
  guardar(data) {
    return apiFetch('/docentes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizar(id, data) {
    return apiFetch(`/docentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  eliminar(id) {
    return apiFetch(`/docentes/${id}`, { method: 'DELETE' });
  }
};

/* ============================================================
   CURSO API
   ============================================================ */
const CursoAPI = {
  listar(idCiclo) {
    const qs = idCiclo ? `?idCiclo=${idCiclo}` : '';
    return apiFetch(`/cursos${qs}`);
  },
  porId(id) {
    return apiFetch(`/cursos/${id}`);
  },
  crear(data) {
    return apiFetch('/cursos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  materiasPorCurso(idCurso) {
    return apiFetch(`/cursos/${idCurso}/materias`);
  },
  asignarMateria(idCurso, data) {
    return apiFetch(`/cursos/${idCurso}/materias`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

/* ============================================================
   MATERIA API
   ============================================================ */
const MateriaAPI = {
  listar(soloActivas = false) {
    return apiFetch(`/materias?soloActivas=${soloActivas}`);
  },
  porId(id) {
    return apiFetch(`/materias/${id}`);
  },
  crear(data) {
    return apiFetch('/materias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizar(id, data) {
    return apiFetch(`/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  bajaLogica(id) {
    return apiFetch(`/materias/${id}`, { method: 'DELETE' });
  }
};

/* ============================================================
   CICLO LECTIVO API
   ============================================================ */
const CicloLectivoAPI = {
  listar() {
    return apiFetch('/ciclos');
  },
  porId(id) {
    return apiFetch(`/ciclos/${id}`);
  },
  crear(data) {
    return apiFetch('/ciclos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizar(id, data) {
    return apiFetch(`/ciclos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

/* ============================================================
   MATRICULA API
   ============================================================ */
const MatriculaAPI = {
  listar() {
    return apiFetch('/matriculas');
  },
  porId(id) {
    return apiFetch(`/matriculas/${id}`);
  },
  crear(data) {
    return apiFetch('/matriculas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  porAlumno(alumnoId) {
    return apiFetch(`/matriculas/alumno/${alumnoId}`);
  },
  cambiarEstado(id, estado) {
    return apiFetch(`/matriculas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }
};

/* ============================================================
   CUOTA API
   ============================================================ */
const CuotaAPI = {
  listar() {
    return apiFetch('/cuotas');
  },
  porId(id) {
    return apiFetch(`/cuotas/${id}`);
  },
  porMatricula(matriculaId) {
    return apiFetch(`/cuotas/matricula/${matriculaId}`);
  },
  generar(data) {
    return apiFetch('/cuotas/generar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

/* ============================================================
   PAGO API
   ============================================================ */
const PagoAPI = {
  listar() {
    return apiFetch('/pagos');
  },
  porId(id) {
    return apiFetch(`/pagos/${id}`);
  },
  porCuota(cuotaId) {
    return apiFetch(`/pagos/cuota/${cuotaId}`);
  },
  registrar(data) {
    return apiFetch('/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

/* ============================================================
   INSCRIPCION API
   ============================================================ */
const InscripcionAPI = {
  crear(data) {
    return apiFetch('/inscripciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  porAlumno(alumnoId) {
    return apiFetch(`/inscripciones/alumno/${alumnoId}`);
  },
  porCurso(cursoId) {
    return apiFetch(`/inscripciones/curso/${cursoId}`);
  },
  anular(id) {
    return apiFetch(`/inscripciones/${id}/anular`, { method: 'PUT' });
  },
};

/* ============================================================
   ASISTENCIA API
   ============================================================ */
const AsistenciaAPI = {
  registrar(data) {
    return apiFetch('/asistencias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  porAlumno(alumnoId) {
    return apiFetch(`/asistencias/alumno/${alumnoId}`);
  },
  resumen(alumnoId) {
    return apiFetch(`/asistencias/alumno/${alumnoId}/resumen`);
  },
};

/* ============================================================
   EVALUACION API
   ============================================================ */
const EvaluacionAPI = {
  crear(data) {
    return apiFetch('/evaluaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  porId(id) {
    return apiFetch(`/evaluaciones/${id}`);
  },
  porCurso(cursoId) {
    return apiFetch(`/evaluaciones/curso/${cursoId}`);
  },
  porCursoMateria(cursoMateriaId) {
    return apiFetch(`/evaluaciones/curso-materia/${cursoMateriaId}`);
  },
  actualizar(id, data) {
    return apiFetch(`/evaluaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/* ============================================================
   CALIFICACION API
   ============================================================ */
const CalificacionAPI = {
  crear(data) {
    return apiFetch('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizar(id, data) {
    return apiFetch(`/calificaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  porAlumno(alumnoId) {
    return apiFetch(`/calificaciones/alumno/${alumnoId}`);
  },
  porEvaluacion(evaluacionId) {
    return apiFetch(`/calificaciones/evaluacion/${evaluacionId}`);
  },
};

/* ============================================================
   RELACIONADOS API — Entidades auxiliares
   ============================================================ */
const RelacionadosAPI = {
  alumnos()       { return apiFetch('/alumnos'); },
  cursos()        { return apiFetch('/cursos'); },
  docentes()      { return apiFetch('/docentes'); },
  ciclosLectivos(){ return apiFetch('/ciclos'); },
};

/* ============================================================
   UTILIDADES DE UI
   ============================================================ */
function showAlert(container, message, type = 'danger') {
  if (!container) return;
  const icon = {
    success: 'bi-check-circle-fill',
    danger:  'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info:    'bi-info-circle-fill',
  }[type] || 'bi-info-circle-fill';

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
      <i class="bi ${icon}"></i>
      <span>${escapeHtml(message)}</span>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
    </div>`;
}

function setLoading(visible) {
  let spinner = document.getElementById('global-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'global-spinner';
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `
      <div class="text-center">
        <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status"></div>
        <div class="mt-2 fw-semibold text-primary">Cargando...</div>
      </div>`;
    document.body.appendChild(spinner);
  }
  spinner.style.display = visible ? 'flex' : 'none';
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function formatCurrency(val) {
  if (val == null) return '$ 0.00';
  return '$ ' + Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function badgeEstadoInscripcion(estado) {
  const cls = estado === 'ACTIVA' ? 'badge-activa' : 'badge-anulada';
  return `<span class="badge ${cls}">${escapeHtml(estado)}</span>`;
}

function badgeEstadoAsistencia(estado) {
  const map = {
    PRESENTE:    'badge-presente',
    AUSENTE:     'badge-ausente',
    TARDANZA:    'badge-tardanza',
    JUSTIFICADO: 'badge-justificado',
  };
  return `<span class="badge ${map[estado] || 'bg-secondary'}">${escapeHtml(estado)}</span>`;
}

function badgeNota(nota) {
  let cls = 'badge-nota-baja';
  if (nota >= 6) cls = 'badge-nota-alta';
  else if (nota >= 4) cls = 'badge-nota-media';
  return `<span class="badge ${cls} fs-6">${nota}</span>`;
}

function badgeTipoEvaluacion(tipo) {
  const labels = {
    PRIMER_PARCIAL:   '1er Parcial',
    SEGUNDO_PARCIAL:  '2do Parcial',
    EXAMEN_FINAL:     'Final',
    TRABAJO_PRACTICO: 'TP',
    RECUPERATORIO:    'Recuperatorio',
  };
  return `<span class="badge badge-tipo">${escapeHtml(labels[tipo] || tipo)}</span>`;
}

function renderEmpty(tbody, colspan, msg = 'No hay datos para mostrar') {
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-center text-muted py-4">
        <i class="bi bi-inbox fs-3 d-block mb-2"></i>${escapeHtml(msg)}
      </td>
    </tr>`;
}

function rolActual() {
  return String(AuthAPI.getUsuario()?.rol || '').toUpperCase();
}
function tieneRol(...roles) {
  return roles.map(r => r.toUpperCase()).includes(rolActual());
}

document.addEventListener('DOMContentLoaded', () => {
  AuthAPI.initNavbarUser();
});

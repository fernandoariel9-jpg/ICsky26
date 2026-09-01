// src/config.js

// URL base de la API
const API_BASE_URL = "https://sky26.onrender.com";

export const API_URL = {
  Base: API_BASE_URL,
  Usuarios: `${API_BASE_URL}/usuarios`,
  Login_usuarios: `${API_BASE_URL}/usuarios/login`,
  personal: `${API_BASE_URL}/personal`,
  Login_Personal: `${API_BASE_URL}/personal/login`,
  Areas: `${API_BASE_URL}/areas`,
  Servicios: `${API_BASE_URL}/servicios`,
  Tareas: `${API_BASE_URL}/tareas`,
  API: `${API_BASE_URL}/api`,
  ResumenTiempos: `${API_BASE_URL}/api/resumen_tiempos`,
  ResumenTareas: `${API_BASE_URL}/api/resumen_tareas`,
  ResumenTiemposPorArea: `${API_BASE_URL}/api/resumen_tiempos_por_area`,
  TiemposAnalitica: `${API_BASE_URL}/api/tiempos_analitica`,
  Equipos: `${API_BASE_URL}/api/equipos`,
  BuscarEquipo: `${API_BASE_URL}/buscar-equipo`,
  BuscarEquipos: `${API_BASE_URL}/buscar-equipos`,
  Ric01: `${API_BASE_URL}/ric01`,
  Ric29: `${API_BASE_URL}/api/ric29`,
  Ric44: `${API_BASE_URL}/api/ric44`,
  DiagnosticosRIC02: `${API_BASE_URL}/diagnosticos/ric02`,
  Guardias: `${API_BASE_URL}/api/guardias`,
  Estados: `${API_BASE_URL}/estados`,
  ResumenTipos: "/api/equipos/resumen-tipos",
  AlertasEquipos: `${API_BASE_URL}/api/equipos/alertas`,
  ResumenEstados: `${API_BASE_URL}/api/equipos/estados/resumen`,
  DashboardResumen:  `${API_BASE_URL}/api/dashboard/resumen`,
  HistorialEquipo: `${API_BASE_URL}/equipos`,
  EquiposMantenimientoVencido: `${API_BASE_URL}/api/equipos/mantenimiento-vencido`,
  EquiposMantenimientoProximo: `${API_BASE_URL}/api/equipos/mantenimiento-proximo`,
  AsignarEquipo: `${API_BASE_URL}/ric01/asignar-equipo`
};

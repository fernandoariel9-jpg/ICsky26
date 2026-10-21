// Fechas calendario sin conversiones implícitas de zona horaria.
// Las fechas con barras importadas se interpretan como DD/MM/AAAA o AAAA/MM/DD.
export function fechaISO(valor) {
  if (valor == null || valor === "") return "";
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return "";
    return [valor.getFullYear(), String(valor.getMonth() + 1).padStart(2, "0"), String(valor.getDate()).padStart(2, "0")].join("-");
  }

  const texto = String(valor).trim();
  let anio, mes, dia;
  let match = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (match) {
    [, anio, mes, dia] = match;
  } else {
    match = texto.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s.*)?$/);
    if (!match) return "";
    [, dia, mes, anio] = match;
  }
  const y = Number(anio), m = Number(mes), d = Number(dia);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  if (fecha.getUTCFullYear() !== y || fecha.getUTCMonth() !== m - 1 || fecha.getUTCDate() !== d) return "";
  return `${anio}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function fechaCalendario(valor) {
  const iso = fechaISO(valor);
  return iso ? new Date(`${iso}T12:00:00`) : null;
}

export function mostrarFecha(valor, vacio = "-") {
  const iso = fechaISO(valor);
  if (!iso) return vacio;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function diferenciaDiasCalendario(valor, referencia = new Date()) {
  const iso = fechaISO(valor);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const diasUTC = Date.UTC(y, m - 1, d);
  const hoyUTC = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return Math.round((diasUTC - hoyUTC) / 86400000);
}

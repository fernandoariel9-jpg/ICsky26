import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { API_URL } from "./config";

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha);

  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function NotificacionesMantenimiento({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [usuarioId, setUsuarioId] = useState(null);
  const [cargando, setCargando] = useState(false);

  const obtenerUsuarioId = async () => {
    if (usuario?.id) return Number(usuario.id);

    const mail = usuario?.mail;
    if (!mail) return null;

    const res = await fetch(API_URL.Usuarios);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const usuarios = await res.json();
    const encontrado = usuarios.find(
      (u) => String(u.mail || "").trim().toLowerCase() === String(mail).trim().toLowerCase()
    );

    return encontrado?.id ? Number(encontrado.id) : null;
  };

  const cargarNotificaciones = async () => {
    try {
      const id = await obtenerUsuarioId();

      if (!id) {
        console.warn("No se pudo determinar el ID del usuario para las notificaciones");
        return;
      }

      setUsuarioId(id);

      const res = await fetch(
        `${API_URL.Ric29}/notificaciones?usuario_id=${encodeURIComponent(id)}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  useEffect(() => {
    if (!usuario) return;

    cargarNotificaciones();

    const intervalo = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  const noLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const marcarLeida = async (id) => {
    try {
      const uid = usuarioId || (await obtenerUsuarioId());
      if (!uid) return;

      const res = await fetch(`${API_URL.Ric29}/notificaciones/${id}/leida`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: uid }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, leida: true, fecha_lectura: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
      toast.error("No se pudo marcar la notificación como leída ❌");
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      const uid = usuarioId || (await obtenerUsuarioId());
      if (!uid) return;

      const res = await fetch(`${API_URL.Ric29}/notificaciones/leidas/todas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: uid }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setNotificaciones((prev) =>
        prev.map((n) => ({
          ...n,
          leida: true,
          fecha_lectura: n.fecha_lectura || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Error marcando todas las notificaciones:", error);
      toast.error("No se pudieron marcar todas como leídas ❌");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative bg-white border border-gray-300 shadow-sm rounded-full w-11 h-11 flex items-center justify-center text-xl hover:bg-gray-50"
        aria-label="Notificaciones de mantenimiento"
        title="Notificaciones de mantenimiento"
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-[min(92vw,420px)] max-h-[75vh] overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-xl z-50">
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">🔔 Mantenimiento preventivo</h2>
              <p className="text-xs text-gray-500">
                {noLeidas} sin leer · {notificaciones.length} en historial
              </p>
            </div>

            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[65vh] p-3 space-y-3">
            {cargando && (
              <p className="text-center text-sm text-gray-500 py-4">Cargando…</p>
            )}

            {!cargando && notificaciones.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-3xl mb-2">🔕</div>
                <p>No hay notificaciones.</p>
              </div>
            )}

            {notificaciones.map((n) => (
              <article
                key={n.id}
                onClick={() => !n.leida && marcarLeida(n.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  n.leida
                    ? "bg-gray-50 border-gray-200"
                    : "bg-blue-50 border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">
                      {n.leida ? "📋" : "🆕"} Mantenimiento {n.protocolo}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Informado: {formatearFecha(n.fecha_notificacion)}
                    </p>
                  </div>

                  {!n.leida && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-2 py-1">
                      NUEVO
                    </span>
                  )}
                </div>

                <div className="mt-3 text-sm space-y-1">
                  <p><strong>Fecha mantenimiento:</strong> {formatearFecha(n.fecha_mantenimiento)}</p>
                  <p><strong>Equipo:</strong> {n.descripcion || "—"}</p>
                  <p><strong>Marca / modelo:</strong> {n.marca_modelo || "—"}</p>
                  <p><strong>N.º de serie:</strong> {n.numero_serie || "—"}</p>
                  <p><strong>Resultado:</strong>{" "}
                    <span className={`font-bold ${String(n.resultado || "").toUpperCase() === "CONFORME" ? "text-green-600" : "text-red-600"}`}>
                      {n.resultado || "—"}
                    </span>
                  </p>
                </div>

                {n.observaciones && (
                  <div className="mt-2 p-2 rounded-lg bg-white border text-sm">
                    <strong>Observaciones:</strong> {n.observaciones}
                  </div>
                )}

                {n.link_drive && (
                  <a
                    href={n.link_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    📄 Ver informe PDF
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

export const RICS_CON_SEGURIDAD_ELECTRICA = [
  "RIC29",
  "RIC39",
  "RIC48",
  "RIC59",
  "RIC64",
  "RIC10"
];

const CONTEXTO_KEY = "ric37_contexto_preventivo";

const normalizarCodigo = (codigo = "") => String(codigo).trim().toUpperCase();

export function requiereRIC37Preventivo(codigo) {
  return RICS_CON_SEGURIDAD_ELECTRICA.includes(normalizarCodigo(codigo));
}

export function useRIC37Preventivo({ codigo, ric01Id, setVista }) {
  const requerido = requiereRIC37Preventivo(codigo);
  const [cargando, setCargando] = useState(false);
  const [realizado, setRealizado] = useState(false);
  const [ric37, setRic37] = useState(null);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [noAplica, setNoAplica] = useState(false);
  const [motivoNoAplica, setMotivoNoAplica] = useState("");

  const claveNoAplica = useMemo(
    () => ric01Id ? `preventivo:ric37-no-aplica:${ric01Id}` : "",
    [ric01Id]
  );

  const consultar = async () => {
    if (!requerido || !ric01Id) return;

    try {
      setCargando(true);
      const res = await fetch(
        `${API_URL.Base}/api/ric37/por-ric01/${encodeURIComponent(ric01Id)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo consultar RIC37");

      setRealizado(Boolean(data.realizado));
      setRic37(data.ric37 || null);

      if (data.realizado) {
        setNoAplica(false);
        setMotivoNoAplica("");
        if (claveNoAplica) localStorage.removeItem(claveNoAplica);
      }
    } catch (error) {
      console.error(`Error consultando RIC37 para ${codigo}:`, error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!requerido || !claveNoAplica) return;

    try {
      const raw = localStorage.getItem(claveNoAplica);
      if (!raw) return;
      const data = JSON.parse(raw);
      setNoAplica(Boolean(data.noAplica));
      setMotivoNoAplica(String(data.motivo || ""));
    } catch (error) {
      console.warn("No se pudo recuperar la excepción RIC37:", error);
    }
  }, [requerido, claveNoAplica]);

  useEffect(() => {
    consultar();
  }, [requerido, ric01Id]);

  useEffect(() => {
    if (!requerido || !claveNoAplica || realizado) return;

    if (!noAplica && !motivoNoAplica.trim()) {
      localStorage.removeItem(claveNoAplica);
      return;
    }

    localStorage.setItem(
      claveNoAplica,
      JSON.stringify({ noAplica, motivo: motivoNoAplica })
    );
  }, [requerido, claveNoAplica, realizado, noAplica, motivoNoAplica]);

  useEffect(() => {
    const actualizar = (event) => {
      const id = Number(event?.detail?.ric01Id);
      if (Number(ric01Id) === id) consultar();
    };

    window.addEventListener("ric37-actualizado", actualizar);
    return () => window.removeEventListener("ric37-actualizado", actualizar);
  }, [ric01Id, requerido]);

  const abrirRIC37 = () => {
    if (!ric01Id) {
      alert("No se pudo identificar el mantenimiento preventivo.");
      return;
    }

    localStorage.setItem(
      CONTEXTO_KEY,
      JSON.stringify({
        codigo: normalizarCodigo(codigo),
        vista: normalizarCodigo(codigo).toLowerCase(),
        ric01_id: Number(ric01Id)
      })
    );

    setVista("ric37");
  };

  const validarAntesDeGuardar = () => {
    if (!requerido || realizado) return true;

    if (noAplica && motivoNoAplica.trim()) return true;

    setMostrarAviso(true);
    return false;
  };

  const textoObservacion = realizado
    ? ""
    : noAplica && motivoNoAplica.trim()
      ? `RIC37 - Ensayo de seguridad eléctrica: NO APLICA. Motivo: ${motivoNoAplica.trim()}`
      : "";

  const agregarAObservaciones = (observaciones = "") => {
    const base = String(observaciones || "").trim();
    if (!textoObservacion) return base;
    return base ? `${base}\n${textoObservacion}` : textoObservacion;
  };

  return {
    requerido,
    cargando,
    realizado,
    ric37,
    mostrarAviso,
    setMostrarAviso,
    noAplica,
    setNoAplica,
    motivoNoAplica,
    setMotivoNoAplica,
    abrirRIC37,
    validarAntesDeGuardar,
    agregarAObservaciones,
    consultar
  };
}

export function BloqueRIC37Preventivo({ control }) {
  if (!control?.requerido) return null;

  const {
    cargando,
    realizado,
    ric37,
    mostrarAviso,
    noAplica,
    setNoAplica,
    motivoNoAplica,
    setMotivoNoAplica,
    abrirRIC37
  } = control;

  if (realizado) {
    return (
      <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4">
        <p className="font-bold text-green-800">✅ RIC37 - Ensayo de seguridad eléctrica realizado</p>
        <p className="text-sm text-green-700 mt-1">
          {ric37?.id ? `RIC37 #${ric37.id}` : "Ensayo registrado"} para este mantenimiento.
        </p>
      </div>
    );
  }

  if (noAplica && motivoNoAplica.trim()) {
    return (
      <div className="mt-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
        <p className="font-bold text-gray-800">☑ RIC37 - No aplica</p>
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
          {motivoNoAplica.trim()}
        </p>
        <button
          type="button"
          onClick={() => {
            setNoAplica(false);
            setMotivoNoAplica("");
          }}
          className="mt-3 text-sm text-blue-700 underline"
        >
          Cambiar decisión
        </button>
      </div>
    );
  }

  return (
    <div className={`mt-4 rounded-xl border p-4 ${mostrarAviso ? "border-amber-400 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-800">⚡ RIC37 - Ensayo de seguridad eléctrica</p>
          <p className="text-sm text-gray-600 mt-1">
            {cargando
              ? "Verificando si el ensayo ya fue realizado..."
              : "Debe realizarse antes de guardar el mantenimiento preventivo, salvo que no aplique."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={abrirRIC37}
        disabled={cargando}
        className="w-full mt-3 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-xl p-3 font-bold"
      >
        ⚡ Realizar RIC37
      </button>

      {mostrarAviso && (
        <div className="mt-4 border-t border-amber-300 pt-4">
          <p className="font-semibold text-amber-900">
            ⚠️ No se realizó RIC37 - Ensayo de seguridad eléctrica.
          </p>

          <label className="flex items-center gap-2 mt-3 font-semibold text-sm">
            <input
              type="checkbox"
              checked={noAplica}
              onChange={(e) => setNoAplica(e.target.checked)}
            />
            No aplica
          </label>

          {noAplica && (
            <div className="mt-3">
              <label className="block text-sm font-semibold mb-1">
                Aclare por qué no aplica
              </label>
              <textarea
                value={motivoNoAplica}
                onChange={(e) => setMotivoNoAplica(e.target.value)}
                rows={3}
                className="w-full border rounded-xl p-3 bg-white"
                placeholder="Motivo obligatorio..."
              />
              {!motivoNoAplica.trim() && (
                <p className="text-xs text-red-600 mt-1">
                  Debe indicar el motivo para continuar sin RIC37.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const RIC37_CONTEXTO_PREVENTIVO_KEY = CONTEXTO_KEY;

// src/FormularioUsuario.js
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import QrReader from "react-qr-scanner";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [filtro, setFiltro] = useState("pendientes"); // 👈 NUEVO estado para pestañas

  useEffect(() => {
    fetchTareas();
    window.addEventListener("online", enviarTareasPendientes);
    return () => window.removeEventListener("online", enviarTareasPendientes);
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      if (!usuario) return;
      const areaParam = encodeURIComponent(usuario.area || "");
      const url = areaParam ? `${API_TAREAS}/${areaParam}` : API_TAREAS;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      const userIdentifier =
        typeof usuario === "string"
          ? usuario
          : usuario.nombre || usuario.mail || String(usuario);

      setTareas(
        data
          .filter((t) => t.usuario === userIdentifier)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      );
    } catch {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  // ✅ FUNCIÓN CORREGIDA PARA MOSTRAR HORAS EXACTAS
  function formatTimestamp(ts) {
    if (!ts) return "";
    // ts puede venir como "2025-10-20 08:41:00" (sin TZ)
    const [fechaPart, horaPart] = ts.split(" ");
    if (!fechaPart || !horaPart) return ts;

    const [year, month, day] = fechaPart.split("-").map(Number);
    const [hour, min, sec] = horaPart.split(":").map(Number);

    // Retornamos con formato dd/mm/yyyy, hh:mm:ss sin ajustar zona
    return `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}, ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  function getFechaLocal() {
    const d = new Date();
    d.setSeconds(0, 0);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${año}-${mes}-${dia} ${hora}:${min}`;
  }

  const handleFinalizar = async (id) => {
    try {
      const fecha_fin = getFechaLocal();
      const res = await fetch(`${API_TAREAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fin: true, fecha_fin }),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fin: true } : t))
      );
      toast.success("✅ Tarea finalizada");
    } catch {
      toast.error("❌ No se pudo finalizar la tarea");
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        const base64Data = compressedDataUrl.split(",")[1];

        setNuevaImagen(base64Data);
        setPreviewImagen(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setNuevaImagen(null);
    setPreviewImagen(null);
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return toast.error("Ingrese una descripción de tarea");
    if (!usuario) return toast.error("Usuario no disponible");

    const userIdentifier =
      typeof usuario === "string"
        ? usuario
        : usuario.nombre || usuario.mail || String(usuario);

    const areaValor = usuario?.area ?? null;
    const servicioValor = usuario?.servicio ?? null;
    const subservicioValor = usuario?.subservicio ?? null;
    const fecha = getFechaLocal();

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: nuevaTarea,
      area: areaValor,
      servicio: servicioValor,
      subservicio: subservicioValor,
      imagen: nuevaImagen,
      fin: false,
      fecha,
    };

    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error("offline");

      const res = await fetch(API_TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const text = await res.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }

      if (!res.ok) {
        const serverMsg =
          payload && typeof payload === "object" && payload.error
            ? payload.error
            : typeof payload === "string"
            ? payload
            : `HTTP ${res.status}`;
        toast.error("❌ Error al crear tarea: " + serverMsg);
        return;
      }

      setTareas((prev) => [payload, ...prev]);
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.success("✅ Tarea creada");
    } catch (err) {
      let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
      pendientes.push(bodyToSend);
      localStorage.setItem("tareasPendientes", JSON.stringify(pendientes));
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.info("⚠️ Sin conexión: tarea guardada localmente");
    } finally {
      setLoading(false);
    }
  };

  const enviarTareasPendientes = async () => {
    let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
    if (!pendientes.length) return;

    for (const tarea of pendientes) {
      try {
        await fetch(API_TAREAS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tarea),
        });
      } catch {
        toast.error("❌ No se pudieron enviar algunas tareas");
        return;
      }
    }

    localStorage.removeItem("tareasPendientes");
    toast.success("✅ Tareas pendientes enviadas");
    fetchTareas();
  };

  const handleScan = (data) => {
    if (data) {
      let qrData;
      try {
        qrData = JSON.parse(data.text || data);
      } catch {
        qrData = { info: data.text || data };
      }
      setNuevaTarea(
        `Solicitud automática de asistencia para: ${qrData.marca || qrData.info} - ${qrData.numeroSerie || ""} - ${qrData.servicio || ""}`
      );
      toast.success("QR leído ✅ Tarea generada automáticamente");
      setShowQR(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error("Error al leer QR ❌");
  };

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);

  const tareasFiltradas = filtro === "pendientes"
    ? pendientes
    : filtro === "enProceso"
    ? enProceso
    : finalizadas;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Resto del JSX intacto */}
      {/* ... */}
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}

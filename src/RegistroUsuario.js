// RegistroUsuario.js
import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com";

export default function RegistroUsuario({ onRegistro }) {
  const [form, setForm] = useState({
    nombre: "",
    servicio: "",
    movil: "",
    mail: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error("El nombre es obligatorio");

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al registrar");
      const data = await res.json();
      toast.success("Registro exitoso ✅");
      onRegistro(data.nombre);
    } catch {
      toast.error("Error al registrar usuario ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input type="text" name="nombre" placeholder="Nombre completo" className="w-full p-2 border rounded"
          value={form.nombre} onChange={handleChange} required />
        <input type="text" name="servicio" placeholder="Servicio/Área" className="w-full p-2 border rounded"
          value={form.servicio} onChange={handleChange} />
        <input type="text" name="movil" placeholder="Número de móvil" className="w-full p-2 border rounded"
          value={form.movil} onChange={handleChange} />
        <input type="email" name="mail" placeholder="Correo electrónico" className="w-full p-2 border rounded"
          value={form.mail} onChange={handleChange} />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Registrar</button>
      </form>
    </div>
  );
}

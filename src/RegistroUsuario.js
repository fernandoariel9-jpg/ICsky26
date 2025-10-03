import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/usuarios";

export default function RegistroUsuario({ onRegistrado }) {
  const [form, setForm] = useState({
    nombre: "",
    servicio: "",
    movil: "",
    mail: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error en el registro");

      const data = await res.json();
      toast.success("Usuario registrado ✅");
      onRegistrado(data.nombre); // pasa el nombre al login
    } catch {
      toast.error("Error al registrar usuario ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input type="text" name="nombre" placeholder="Nombre" className="w-full p-2 border rounded" value={form.nombre} onChange={handleChange} required />
        <input type="text" name="servicio" placeholder="Servicio" className="w-full p-2 border rounded" value={form.servicio} onChange={handleChange} required />
        <input type="text" name="movil" placeholder="Móvil" className="w-full p-2 border rounded" value={form.movil} onChange={handleChange} />
        <input type="email" name="mail" placeholder="Email" className="w-full p-2 border rounded" value={form.mail} onChange={handleChange} required />

        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">
          Registrarse
        </button>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/usuarios";

export default function RegistroUsuario({ onRegister }) {
  const [form, setForm] = useState({
    nombre: "",
    servicio: "",
    movil: "",
    mail: "",
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

      if (!res.ok) throw new Error("Error al registrar usuario");

      const nuevoUsuario = await res.json();

      // 👉 Guardamos usuario en localStorage y activamos login automático
      localStorage.setItem("usuario", nuevoUsuario.nombre);
      toast.success("Registro exitoso ✅");

      // Pasamos el usuario al App.js
      onRegister(nuevoUsuario.nombre);

    } catch (err) {
      console.error("Error al registrar:", err);
      toast.error("No se pudo registrar el usuario ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="servicio"
          placeholder="Servicio"
          value={form.servicio}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="movil"
          placeholder="Móvil"
          value={form.movil}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="mail"
          placeholder="Correo electrónico"
          value={form.mail}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">
          Registrarse
        </button>
      </form>
    </div>
  );
}

// src/RegistroUsuario.js
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import jwt_decode from "jwt-decode";

export default function RegistroUsuario({ onRegister, switchToLogin }) {
  const [nombre, setNombre] = useState("");
  const [servicio, setServicio] = useState("");
  const [subservicio, setSubservicio] = useState("");
  const [area, setArea] = useState("");
  const [movil, setMovil] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // --- Cargar servicios ---
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await fetch("https://sky26.onrender.com/servicios");
        if (!res.ok) throw new Error("Error al obtener servicios");
        const data = await res.json();
        setServiciosDisponibles(data);
      } catch (err) {
        console.error(err);
        toast.error("❌ Error al cargar servicios");
      }
    };
    fetchServicios();
  }, []);

  // --- Subservicios dependientes ---
  const subserviciosDisponibles = serviciosDisponibles.filter(
    (s) => s.servicio === servicio
  );

  useEffect(() => {
    if (subservicio) {
      const seleccionado = serviciosDisponibles.find(
        (s) => s.servicio === servicio && s.subservicio === subservicio
      );
      setArea(seleccionado?.area || "");
    }
  }, [servicio, subservicio, serviciosDisponibles]);

  // --- Registro clásico ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error("❌ Las contraseñas no coinciden");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error("❌ Correo electrónico no válido");
      return;
    }
    if (!/^[0-9]{8,12}$/.test(movil)) {
      toast.error("❌ Número de móvil inválido");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("https://sky26.onrender.com/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          servicio,
          subservicio,
          area,
          movil,
          mail,
          password,
        }),
      });

      if (res.ok) {
        toast.success("Usuario registrado ✅\nRevisa tu correo para verificar tu cuenta.");
        onRegister(nombre);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Error al registrar ❌");
      }
    } catch {
      toast.error("Error de conexión ❌");
    } finally {
      setLoading(false);
    }
  };

  // --- Registro rápido con Google ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwt_decode(credentialResponse.credential);
      const { name, email, picture } = decoded;

      setLoading(true);
      const res = await fetch("https://sky26.onrender.com/usuarios/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: name, mail: email }),
      });

      if (res.ok) {
        toast.success(`Bienvenido ${name} 👋 (Google Login)`);
        onRegister(name);
      } else {
        toast.error("Error al registrar con Google ❌");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error en autenticación con Google ❌");
    } finally {
      setLoading(false);
    }
  };

  const contrasenasCoinciden =
    password2.length === 0 ? null : password === password2;

  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-4">
        📝 Registro de Usuario
      </h1>

      {/* --- Opción 1: Google Login --- */}
      <div className="flex flex-col items-center mb-6 space-y-2">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Error al iniciar con Google")}
        />
        <p className="text-gray-500 text-sm">o regístrate manualmente</p>
      </div>

      {/* --- Opción 2: Registro clásico --- */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.toUpperCase())}
          required
          className="w-full p-2 border rounded"
        />

        <select
          className="w-full p-2 border rounded"
          value={servicio}
          onChange={(e) => {
            setServicio(e.target.value);
            setSubservicio("");
            setArea("");
          }}
          required
        >
          <option value="">Seleccione un servicio</option>
          {[...new Set(serviciosDisponibles.map((s) => s.servicio))].map(
            (srv, i) => (
              <option key={i} value={srv}>
                {srv}
              </option>
            )
          )}
        </select>

        {servicio && (
          <select
            className="w-full p-2 border rounded"
            value={subservicio}
            onChange={(e) => setSubservicio(e.target.value)}
            required
          >
            <option value="">Seleccione un subservicio</option>
            {subserviciosDisponibles.map((s, i) => (
              <option key={i} value={s.subservicio}>
                {s.subservicio}
              </option>
            ))}
          </select>
        )}

        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Número de móvil"
          value={movil}
          onChange={(e) => setMovil(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
          autoComplete="email"
          className="w-full p-2 border rounded"
        />

        <div className="relative">
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute right-2 top-2 text-sm text-gray-500"
          >
            {mostrarPassword ? "🙈" : "👁"}
          </button>
        </div>

        <input
          type={mostrarPassword ? "text" : "password"}
          placeholder="Repetir la contraseña"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        {contrasenasCoinciden !== null && (
          <p
            className={`text-sm ${
              contrasenasCoinciden ? "text-green-600" : "text-red-600"
            }`}
          >
            {contrasenasCoinciden
              ? "✅ Las contraseñas coinciden"
              : "❌ Las contraseñas no coinciden"}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`bg-green-500 text-white p-2 rounded-xl ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p className="text-center mt-4 text-sm">
        ¿Ya tienes cuenta?{" "}
        <button className="text-blue-600 underline" onClick={switchToLogin}>
          Ingresar
        </button>
      </p>
    </div>
  );
}

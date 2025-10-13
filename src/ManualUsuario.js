import React, { useState } from "react";

export default function ManualUsuario() {
  const [tab, setTab] = useState("inicio");

  const tabs = [
    { id: "inicio", label: "Inicio" },
    { id: "registro", label: "Registrar Tarea" },
    { id: "verTareas", label: "Ver Mis Tareas" },
    { id: "estado", label: "Estados de Tarea" },
    { id: "logout", label: "Cerrar Sesión" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-6">
      {/* Encabezado */}
      <div className="flex items-center justify-center mb-6">
        <img
          src="/logosmall.png"
          alt="Logo Servicio de Ingeniería Clínica - HPDDGR"
          className="w-12 h-12 mr-3"
        />
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Manual del Usuario — <span className="text-blue-700">Servicio de Ingeniería Clínica - HPDDGR</span>
        </h1>
      </div>

      {/* Pestañas */}
      <div className="flex justify-center space-x-2 border-b pb-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded-t-lg font-semibold ${
              tab === t.id
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="text-gray-700 leading-relaxed">
        {tab === "inicio" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Ingreso al sistema</h2>
            <p>
              Para acceder a la plataforma, diríjase a{" "}
              <a
                href="https://icsky26.onrender.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                https://icsky26.onrender.com
              </a>.
            </p>
            <p className="mt-2">
              Ingrese con su correo electrónico y contraseña asignada.  
              Si aún no dispone de usuario, solicítelo al administrador.
            </p>
            <div className="border mt-4 p-4 text-center italic text-gray-500 rounded-md">
              📸 Espacio para captura de la pantalla de inicio de sesión.
            </div>
          </div>
        )}

        {tab === "registro" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">2. Registro de Tareas</h2>
            <p>
              Una vez dentro del sistema, seleccione la opción <strong>“Registrar Tarea”</strong>.
              Complete los campos obligatorios:
            </p>
            <ul className="list-disc list-inside mt-2">
              <li>Descripción de la tarea o pedido.</li>
              <li>Servicio y subservicio correspondientes.</li>
              <li>Adjunte una imagen si lo desea.</li>
            </ul>
            <p className="mt-2">
              Luego, presione <strong>“Enviar”</strong> para registrar la solicitud.  
              Recibirá una confirmación automática en pantalla.
            </p>
            <div className="border mt-4 p-4 text-center italic text-gray-500 rounded-md">
              📸 Espacio para captura del formulario de registro.
            </div>
          </div>
        )}

        {tab === "verTareas" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">3. Visualización de Tareas</h2>
            <p>
              En el panel principal podrá ver todas las tareas que usted haya solicitado.
            </p>
            <p className="mt-2">
              Cada tarea mostrará su estado: pendiente, en proceso o finalizada.  
              También puede actualizar la lista con el botón 🔄 <strong>“Actualizar lista”</strong>.
            </p>
            <div className="border mt-4 p-4 text-center italic text-gray-500 rounded-md">
              📸 Espacio para captura del listado de tareas.
            </div>
          </div>
        )}

        {tab === "estado" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">4. Estados de Tarea</h2>
            <ul className="list-disc list-inside">
              <li><strong>🕓 Pendiente:</strong> Tarea registrada, aún sin asignar.</li>
              <li><strong>🧩 En proceso:</strong> Personal técnico la está resolviendo.</li>
              <li><strong>✅ Finalizada:</strong> Tarea resuelta y cerrada.</li>
            </ul>
            <p className="mt-2">
              Puede utilizar los botones de filtro para visualizar solo las tareas en el estado que desee.
            </p>
            <div className="border mt-4 p-4 text-center italic text-gray-500 rounded-md">
              📸 Espacio para captura de los filtros de estado.
            </div>
          </div>
        )}

        {tab === "logout" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">5. Cerrar Sesión</h2>
            <p>
              Para salir de la plataforma, presione el botón rojo <strong>“Cerrar Sesión”</strong>.
              Esto lo llevará nuevamente al inicio.
            </p>
            <p className="mt-2 text-gray-600">
              Recuerde siempre cerrar sesión al finalizar sus actividades.
            </p>
            <div className="border mt-4 p-4 text-center italic text-gray-500 rounded-md">
              📸 Espacio para captura del botón de cierre de sesión.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

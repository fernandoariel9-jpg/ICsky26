import React from "react";
import { Link } from "react-router-dom";

export default function InformacionPublica() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-10">
        <div className="text-center mb-8">
          <img
            src="/logosmall_old.png"
            alt="IC-SkyApp"
            className="mx-auto mb-4 w-24 h-auto"
          />
          <h1 className="text-3xl font-bold text-gray-900">IC-SkyApp</h1>
          <p className="mt-2 text-gray-600">
            Sistema de gestión de tareas, mantenimiento y equipamiento de Ingeniería Clínica.
          </p>
        </div>

        <section className="space-y-4 text-base leading-relaxed">
          <p>
            IC-SkyApp es una aplicación destinada a facilitar el registro y seguimiento de
            solicitudes técnicas, tareas de mantenimiento y documentación asociada a equipos.
          </p>

          <p>
            El sistema permite organizar intervenciones técnicas, registrar mantenimientos,
            consultar información de equipos y generar informes en formato PDF.
          </p>

          <p>
            IC-SkyApp utiliza Google Drive únicamente para almacenar los informes PDF generados
            por el sistema en las carpetas autorizadas por el titular de la cuenta de Google.
          </p>
        </section>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <Link
            to="/privacidad"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Política de privacidad
          </Link>

          <a
            href="mailto:icsky26@gmail.com"
            className="text-gray-600 hover:text-gray-900"
          >
            Contacto: icsky26@gmail.com
          </a>
        </div>
      </div>
    </main>
  );
}

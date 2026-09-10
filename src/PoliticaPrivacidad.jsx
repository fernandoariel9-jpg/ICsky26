import React from "react";
import { Link } from "react-router-dom";

export default function PoliticaPrivacidad() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 px-4 py-10">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Política de privacidad de IC-SkyApp
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Última actualización: 10 de septiembre de 2026
        </p>

        <div className="space-y-7 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Finalidad de la aplicación</h2>
            <p>
              IC-SkyApp es un sistema de gestión de tareas, mantenimiento y equipamiento de
              Ingeniería Clínica. La aplicación permite registrar y administrar solicitudes
              técnicas, intervenciones de mantenimiento y documentación relacionada con equipos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Información utilizada</h2>
            <p>
              IC-SkyApp procesa la información necesaria para gestionar usuarios, tareas,
              equipos, mantenimientos e informes técnicos dentro de las funciones propias del
              sistema. Esta información no se vende ni se utiliza con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Uso de Google Drive</h2>
            <p>
              IC-SkyApp utiliza la API de Google Drive para almacenar informes PDF de
              mantenimiento generados por el sistema. El acceso a Google Drive se realiza con
              autorización del titular de la cuenta y se utiliza para localizar las carpetas
              correspondientes y guardar allí dichos documentos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Uso y divulgación de datos de Google</h2>
            <p>
              Los datos obtenidos mediante las APIs de Google se utilizan exclusivamente para
              proporcionar la funcionalidad de almacenamiento de informes descrita anteriormente.
              IC-SkyApp no vende, alquila ni utiliza esos datos para publicidad y no los comparte
              con terceros salvo cuando sea necesario para prestar la funcionalidad solicitada o
              cumplir una obligación legal aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Seguridad y conservación</h2>
            <p>
              Se aplican medidas razonables para proteger la información utilizada por la
              aplicación. Los documentos enviados a Google Drive permanecen sujetos a los
              permisos y políticas de la cuenta de Google y de las carpetas donde son almacenados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Revocación del acceso a Google</h2>
            <p>
              El titular de la cuenta de Google puede revocar el acceso concedido a IC-SkyApp
              desde la configuración de seguridad de su cuenta de Google. La revocación impedirá
              que la aplicación continúe utilizando Google Drive con esa autorización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Contacto</h2>
            <p>
              Para consultas relacionadas con esta política de privacidad o con el uso de la
              información por IC-SkyApp, puede escribir a
              {" "}
              <a
                href="mailto:icsky26@gmail.com"
                className="text-blue-600 hover:text-blue-800"
              >
                icsky26@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t pt-6">
          <Link
            to="/informacion"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Volver a la información de IC-SkyApp
          </Link>
        </div>
      </article>
    </main>
  );
}

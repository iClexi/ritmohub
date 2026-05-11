import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Política de Privacidad · RitmoHub",
  description:
    "Política de Privacidad de RitmoHub: qué datos recopilamos, cómo los usamos, cuánto los conservamos y cuáles son tus derechos.",
  alternates: { canonical: "/privacidad" },
  openGraph: {
    title: "Política de Privacidad · RitmoHub",
    description:
      "Cómo RitmoHub recopila, usa y protege tus datos personales.",
    url: "/privacidad",
    siteName: "RitmoHub",
    locale: "es_DO",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Política de Privacidad · RitmoHub",
    description: "Cómo RitmoHub recopila, usa y protege tus datos personales.",
  },
};

const lastUpdated = "10 de mayo de 2026";

const sections = [
  {
    id: "responsable",
    title: "1. Responsable del tratamiento",
    body: (
      <p>
        RitmoHub (en adelante, &quot;la Plataforma&quot;) es el responsable del
        tratamiento de los datos personales que recopila a través de su web,
        aplicación y APIs. Para ejercer cualquier derecho relacionado con tu
        información, puedes contactarnos a través de los canales oficiales
        publicados dentro del servicio.
      </p>
    ),
  },
  {
    id: "datos",
    title: "2. Datos que recopilamos",
    body: (
      <>
        <p>Tratamos las siguientes categorías de datos:</p>
        <ul>
          <li>
            <strong>Datos de cuenta:</strong> nombre, apellidos, nombre de
            usuario, correo electrónico, número telefónico, contraseña
            cifrada.
          </li>
          <li>
            <strong>Perfil artístico:</strong> biografía, instrumento
            principal, tipo de músico, estudios, orientación profesional,
            avatar.
          </li>
          <li>
            <strong>Contenido publicado:</strong> publicaciones, flyers,
            comentarios, mensajes y archivos cargados a la Plataforma.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, agente de usuario,
            país aproximado, fechas y horas de inicio de sesión, cookies de
            sesión.
          </li>
          <li>
            <strong>Datos de uso:</strong> páginas visitadas dentro del panel,
            interacciones con módulos, métricas anónimas de rendimiento.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "3. Finalidades del tratamiento",
    body: (
      <ul>
        <li>Prestar y mantener el Servicio (autenticación, sesiones, panel).</li>
        <li>Mostrar tu perfil artístico al resto de la comunidad cuando lo decides.</li>
        <li>Permitir la colaboración entre músicos, bandas y proyectos.</li>
        <li>Garantizar la seguridad, prevenir el fraude y aplicar los Términos.</li>
        <li>Mejorar la Plataforma con métricas agregadas y anónimas.</li>
        <li>Cumplir obligaciones legales aplicables.</li>
      </ul>
    ),
  },
  {
    id: "base",
    title: "4. Base legal",
    body: (
      <p>
        El tratamiento se apoya en la ejecución del contrato de servicio que
        aceptas con los Términos y Condiciones, en tu consentimiento explícito
        para finalidades opcionales (por ejemplo, comunicaciones promocionales)
        y en el interés legítimo de RitmoHub para mantener la seguridad de la
        Plataforma. Cuando exista una obligación legal específica, se aplicará
        dicha base.
      </p>
    ),
  },
  {
    id: "compartir",
    title: "5. Con quién compartimos tu información",
    body: (
      <>
        <p>
          RitmoHub no vende ni alquila datos personales. Compartimos
          información únicamente con:
        </p>
        <ul>
          <li>
            <strong>Proveedores tecnológicos:</strong> hosting, infraestructura
            cloud, envío de correo electrónico transaccional, mensajería SMS,
            analítica y métricas, todos contratados bajo acuerdos de
            confidencialidad.
          </li>
          <li>
            <strong>Autoridades competentes:</strong> cuando exista una orden
            judicial o un requerimiento legal válido.
          </li>
          <li>
            <strong>Otros usuarios:</strong> únicamente los datos que decides
            publicar en tu perfil o en colaboraciones.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retencion",
    title: "6. Conservación de los datos",
    body: (
      <p>
        Los datos asociados a tu cuenta se conservan mientras esta permanezca
        activa. Si solicitas la eliminación, procederemos a borrarlos o
        anonimizarlos en un plazo razonable, salvo aquellos registros que
        debamos retener por obligación legal, prevención de fraude o defensa
        ante reclamaciones.
      </p>
    ),
  },
  {
    id: "derechos",
    title: "7. Tus derechos",
    body: (
      <>
        <p>Como titular de los datos puedes ejercer en cualquier momento los derechos de:</p>
        <ul>
          <li>Acceso a la información que tenemos sobre ti.</li>
          <li>Rectificación de datos inexactos o incompletos.</li>
          <li>Supresión (&quot;derecho al olvido&quot;).</li>
          <li>Oposición al tratamiento basado en interés legítimo.</li>
          <li>Limitación del tratamiento.</li>
          <li>Portabilidad en un formato estructurado y legible.</li>
          <li>Retirar el consentimiento, sin afectar la licitud previa.</li>
        </ul>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "8. Seguridad",
    body: (
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas: cifrado TLS en
        tránsito, hashing de contraseñas, controles de acceso por rol,
        registros de auditoría, copias de seguridad y monitoreo activo. Pese a
        nuestros esfuerzos, ningún sistema es invulnerable; te recomendamos
        usar contraseñas fuertes y proteger tus credenciales.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies y tecnologías similares",
    body: (
      <p>
        Utilizamos cookies estrictamente necesarias para mantener tu sesión y
        recordar tus preferencias (por ejemplo, el tema visual). También
        podemos usar cookies analíticas anónimas para medir el rendimiento. No
        utilizamos cookies de seguimiento publicitario de terceros.
      </p>
    ),
  },
  {
    id: "menores",
    title: "10. Menores de edad",
    body: (
      <p>
        La Plataforma está pensada para mayores de 13 años. Si descubrimos que
        hemos recopilado datos de un menor sin el consentimiento adecuado,
        procederemos a eliminarlos. Si crees que esto ha ocurrido, contáctanos
        de inmediato.
      </p>
    ),
  },
  {
    id: "internacional",
    title: "11. Transferencias internacionales",
    body: (
      <p>
        Algunos proveedores tecnológicos pueden estar ubicados fuera de tu
        país. En esos casos nos aseguramos de que existan garantías adecuadas
        (cláusulas contractuales tipo o niveles de protección equivalentes)
        para preservar la confidencialidad de tu información.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "12. Cambios en esta política",
    body: (
      <p>
        Podemos actualizar esta Política para reflejar cambios legales o
        técnicos. Cuando los cambios sean materiales, lo notificaremos por
        correo electrónico o mediante un aviso destacado dentro de la
        Plataforma. La versión vigente siempre se encuentra publicada en{" "}
        <Link href="/privacidad" className="font-semibold text-[var(--ui-primary)] hover:underline">
          /privacidad
        </Link>
        .
      </p>
    ),
  },
  {
    id: "contacto",
    title: "13. Contacto",
    body: (
      <p>
        Para cualquier consulta relacionada con privacidad, ejercicio de
        derechos o incidentes de seguridad, escríbenos a través de los canales
        oficiales publicados dentro de RitmoHub. Procuraremos responder en un
        plazo razonable.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <div className="relative min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-[var(--ui-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ui-on-primary)]"
      >
        Saltar al contenido
      </a>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.18)] blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.18)] blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[var(--ui-text)]"
        >
          <Image
            src="/brand/logo.svg"
            alt="RitmoHub"
            width={32}
            height={32}
            className="h-7 w-7 rounded-lg sm:h-8 sm:w-8"
          />
          <span>RitmoHub</span>
        </Link>
        <div className="flex items-center gap-2 print:hidden">
          <ThemeToggle />
          <PrintButton />
          <Link
            href="/"
            className="landing-ghost-btn inline-flex items-center rounded-2xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] sm:px-4 sm:py-2 sm:text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main id="contenido-principal" className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
        <section className="rh-card rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/85 p-5 shadow-xl shadow-[color:rgb(var(--ui-glow-primary)/0.12)] backdrop-blur-xl sm:p-10">
          <span className="inline-flex rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-accent)] sm:text-xs">
            Privacidad
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-sm text-[var(--ui-muted)] sm:text-base">
            Última actualización: {lastUpdated}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ui-muted)] sm:text-base">
            En RitmoHub respetamos tu privacidad. Esta política explica qué
            datos recopilamos, cómo los usamos y qué derechos tienes sobre
            ellos. Para más información sobre el uso de la Plataforma consulta
            también los{" "}
            <Link href="/terminos" className="font-semibold text-[var(--ui-primary)] hover:underline">
              Términos y Condiciones
            </Link>
            .
          </p>
        </section>

        <nav
          aria-label="Índice de contenidos"
          className="mt-6 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/70 p-4 backdrop-blur-md sm:p-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ui-muted)]">
            Contenido
          </h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="landing-link inline-flex w-full rounded-xl px-2 py-1 text-[var(--ui-text)]/80 hover:text-[var(--ui-primary)]"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="mt-6 space-y-6 sm:mt-8">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/70 p-5 backdrop-blur-md sm:p-8"
            >
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-2xl">
                {s.title}
              </h2>
              <div className="terms-prose mt-3 space-y-3 text-sm leading-relaxed text-[var(--ui-muted)] sm:text-base">
                {s.body}
              </div>
            </section>
          ))}
        </article>

        <footer className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/70 p-5 text-center backdrop-blur-md sm:flex-row sm:p-6 sm:text-left">
          <p className="text-xs text-[var(--ui-muted)] sm:text-sm">
            © {new Date().getFullYear()} RitmoHub. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/terminos"
              className="landing-ghost-btn inline-flex items-center rounded-2xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] sm:px-4 sm:py-2 sm:text-sm"
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/register"
              className="rh-btn-primary inline-flex items-center rounded-2xl bg-[var(--ui-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-on-primary)] sm:px-4 sm:py-2 sm:text-sm"
            >
              Crear cuenta
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

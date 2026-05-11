import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Términos y Condiciones · RitmoHub",
  description:
    "Términos y condiciones de uso de RitmoHub: red de gestión para músicos con conciertos, ensayos y colaboraciones.",
  alternates: { canonical: "/terminos" },
  openGraph: {
    title: "Términos y Condiciones · RitmoHub",
    description:
      "Documento legal con los términos de uso de la plataforma RitmoHub.",
    url: "/terminos",
    siteName: "RitmoHub",
    locale: "es_DO",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Términos y Condiciones · RitmoHub",
    description: "Documento legal con los términos de uso de RitmoHub.",
  },
};

const lastUpdated = "10 de mayo de 2026";

const sections = [
  {
    id: "introduccion",
    title: "1. Introducción",
    body: (
      <>
        <p>
          Bienvenido/a a <strong>RitmoHub</strong> (en adelante, &quot;la
          Plataforma&quot;, &quot;nosotros&quot; o &quot;el Servicio&quot;). RitmoHub es una red
          de gestión y colaboración pensada para músicos, bandas, productores,
          academias y profesionales del ecosistema musical, que permite
          coordinar conciertos, ensayos, comunidades, chats privados y
          oportunidades laborales.
        </p>
        <p>
          Al acceder, registrarte o utilizar cualquier funcionalidad de la
          Plataforma, aceptas quedar vinculado por los presentes Términos y
          Condiciones (los &quot;Términos&quot;). Si no estás de acuerdo con alguno de
          los puntos descritos, por favor abstente de utilizar el Servicio.
        </p>
      </>
    ),
  },
  {
    id: "definiciones",
    title: "2. Definiciones",
    body: (
      <ul>
        <li>
          <strong>Usuario:</strong> persona física o jurídica que accede y
          utiliza la Plataforma, ya sea de forma anónima, registrada o como
          miembro de una banda u organización.
        </li>
        <li>
          <strong>Cuenta:</strong> registro personal creado mediante correo
          electrónico, número telefónico u otros métodos habilitados.
        </li>
        <li>
          <strong>Contenido:</strong> textos, imágenes, audios, vídeos, flyers,
          enlaces y cualquier otro material publicado o intercambiado dentro de
          la Plataforma.
        </li>
        <li>
          <strong>Servicios:</strong> conjunto de herramientas, módulos y
          funcionalidades ofrecidas por RitmoHub para la gestión de proyectos
          musicales.
        </li>
      </ul>
    ),
  },
  {
    id: "registro",
    title: "3. Registro y cuenta",
    body: (
      <>
        <p>
          Para acceder a la mayoría de las funcionalidades es necesario crear
          una cuenta proporcionando información veraz, exacta y actualizada. El
          Usuario es el único responsable de:
        </p>
        <ul>
          <li>Mantener la confidencialidad de sus credenciales.</li>
          <li>Toda actividad que ocurra bajo su cuenta.</li>
          <li>
            Notificarnos inmediatamente cualquier uso no autorizado o brecha de
            seguridad.
          </li>
        </ul>
        <p>
          RitmoHub se reserva el derecho de suspender, limitar o cancelar
          cuentas que violen estos Términos o que presenten actividad
          fraudulenta, abusiva o ilícita.
        </p>
      </>
    ),
  },
  {
    id: "uso",
    title: "4. Uso aceptable de la Plataforma",
    body: (
      <>
        <p>
          El Usuario se compromete a hacer un uso responsable del Servicio.
          Queda expresamente prohibido:
        </p>
        <ul>
          <li>Publicar contenido ilegal, ofensivo, discriminatorio o que infrinja derechos de terceros.</li>
          <li>Suplantar la identidad de otras personas, bandas u organizaciones.</li>
          <li>Distribuir spam, malware, phishing o cualquier código malicioso.</li>
          <li>Realizar ingeniería inversa, raspado masivo (scraping) o intentos de acceso no autorizado a la infraestructura.</li>
          <li>Utilizar la Plataforma para actividades comerciales no autorizadas o esquemas piramidales.</li>
        </ul>
      </>
    ),
  },
  {
    id: "contenido",
    title: "5. Contenido del Usuario y propiedad intelectual",
    body: (
      <>
        <p>
          Todo Contenido que el Usuario suba a la Plataforma sigue siendo de su
          propiedad. Sin embargo, al publicarlo concede a RitmoHub una licencia
          mundial, no exclusiva, gratuita y revocable para alojar, mostrar,
          reproducir y distribuir dicho Contenido con el único objetivo de
          operar y promocionar el Servicio.
        </p>
        <p>
          El Usuario declara que cuenta con todos los derechos necesarios sobre
          el Contenido que publica, incluyendo derechos de autor, derechos
          conexos, de imagen y de marca, y exime a RitmoHub de cualquier
          reclamación derivada de su publicación.
        </p>
        <p>
          Los nombres, logotipos, diseños y código fuente propios de RitmoHub
          están protegidos por las leyes de propiedad intelectual y no pueden
          ser utilizados sin autorización escrita.
        </p>
      </>
    ),
  },
  {
    id: "privacidad",
    title: "6. Privacidad y protección de datos",
    body: (
      <>
        <p>
          RitmoHub recopila y procesa datos personales necesarios para prestar
          el Servicio, incluyendo correo electrónico, número telefónico,
          información de perfil artístico, registros de inicio de sesión y
          métricas de uso. Estos datos se tratan bajo principios de
          minimización, finalidad y seguridad.
        </p>
        <p>
          El Usuario puede solicitar en cualquier momento el acceso,
          rectificación, portabilidad o eliminación de sus datos enviando una
          solicitud a través de los canales oficiales. La Plataforma podrá
          conservar registros mínimos cuando exista una obligación legal o un
          interés legítimo (por ejemplo, prevención de fraude).
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "7. Seguridad e infraestructura",
    body: (
      <>
        <p>
          RitmoHub aplica medidas técnicas y organizativas razonables para
          proteger la integridad y disponibilidad del Servicio, incluyendo
          conexiones cifradas TLS, copias de seguridad periódicas, separación
          de entornos y monitoreo activo.
        </p>
        <p>
          A pesar de estos esfuerzos, ningún sistema en internet es 100%
          seguro. El Usuario reconoce este riesgo y se compromete a utilizar
          contraseñas robustas y a habilitar la verificación adicional cuando
          esté disponible.
        </p>
      </>
    ),
  },
  {
    id: "pagos",
    title: "8. Planes, pagos y suscripciones",
    body: (
      <p>
        Algunas funcionalidades de RitmoHub pueden ofrecerse bajo planes de
        pago o suscripciones. Los precios, métodos de pago y condiciones se
        comunicarán claramente antes de cualquier cobro. Las suscripciones
        pueden cancelarse en cualquier momento desde el panel del Usuario; los
        importes ya facturados no son reembolsables salvo que la ley aplicable
        disponga lo contrario.
      </p>
    ),
  },
  {
    id: "disponibilidad",
    title: "9. Disponibilidad del servicio",
    body: (
      <p>
        RitmoHub realiza esfuerzos razonables para mantener el Servicio
        disponible las 24 horas. Sin embargo, podrán existir interrupciones
        programadas o no programadas debidas a mantenimiento, actualizaciones
        de seguridad, fallos de proveedores externos o causas de fuerza mayor.
        Estas interrupciones no generan, por sí mismas, derecho a compensación.
      </p>
    ),
  },
  {
    id: "responsabilidad",
    title: "10. Limitación de responsabilidad",
    body: (
      <p>
        En la máxima medida permitida por la ley, RitmoHub no será responsable
        por daños indirectos, incidentales, especiales o consecuentes derivados
        del uso o imposibilidad de uso del Servicio, incluyendo pérdida de
        datos, oportunidades comerciales o reputación. La responsabilidad
        total acumulada de RitmoHub no excederá, en ningún caso, el importe
        pagado por el Usuario durante los últimos doce (12) meses.
      </p>
    ),
  },
  {
    id: "terceros",
    title: "11. Servicios y enlaces de terceros",
    body: (
      <p>
        La Plataforma puede integrarse con servicios de terceros (por ejemplo,
        proveedores de autenticación, mensajería, pagos o analítica). RitmoHub
        no controla y no se hace responsable por las prácticas, términos o
        contenidos de dichos terceros. El Usuario deberá revisar y aceptar sus
        respectivas políticas de forma independiente.
      </p>
    ),
  },
  {
    id: "modificaciones",
    title: "12. Modificaciones de los Términos",
    body: (
      <p>
        RitmoHub puede actualizar estos Términos para reflejar cambios legales,
        técnicos o de negocio. Cuando los cambios sean materiales, notificará
        al Usuario por correo electrónico o mediante un aviso destacado dentro
        de la Plataforma con una antelación razonable. El uso continuado tras
        la entrada en vigor implica la aceptación de la versión actualizada.
      </p>
    ),
  },
  {
    id: "terminacion",
    title: "13. Terminación",
    body: (
      <p>
        El Usuario puede dar por terminada su relación con RitmoHub eliminando
        su cuenta en cualquier momento. RitmoHub puede suspender o cancelar el
        acceso cuando exista un incumplimiento grave de estos Términos, una
        orden judicial o una obligación legal. Tras la terminación, ciertas
        cláusulas (propiedad intelectual, limitación de responsabilidad, ley
        aplicable) seguirán vigentes.
      </p>
    ),
  },
  {
    id: "ley",
    title: "14. Ley aplicable y jurisdicción",
    body: (
      <p>
        Estos Términos se rigen por las leyes de la República Dominicana, sin
        perjuicio de las normas imperativas de protección al consumidor del
        país de residencia del Usuario. Cualquier controversia derivada de los
        presentes Términos se someterá a los tribunales competentes de Santo
        Domingo, salvo disposición legal en contrario.
      </p>
    ),
  },
  {
    id: "contacto",
    title: "15. Contacto",
    body: (
      <p>
        Para cualquier consulta relacionada con estos Términos, la privacidad o
        el funcionamiento del Servicio, el Usuario puede escribir al equipo de
        RitmoHub a través de los canales oficiales publicados en la
        Plataforma. Procuraremos responder en un plazo razonable.
      </p>
    ),
  },
];

export default function TerminosPage() {
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
          <span className="inline-flex rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-primary)] sm:text-xs">
            Documento legal
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Términos y Condiciones de Uso
          </h1>
          <p className="mt-3 text-sm text-[var(--ui-muted)] sm:text-base">
            Última actualización: {lastUpdated}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ui-muted)] sm:text-base">
            Por favor lee con atención este documento antes de utilizar
            RitmoHub. Al hacer clic en &quot;Crear cuenta&quot;, &quot;Iniciar sesión&quot; o al
            continuar navegando, declaras haber leído, comprendido y aceptado
            estos Términos y Condiciones en su totalidad.
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
              href="/login"
              className="landing-ghost-btn inline-flex items-center rounded-2xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] sm:px-4 sm:py-2 sm:text-sm"
            >
              Iniciar sesión
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

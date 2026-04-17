"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  avatarUploadSchema,
  applyJobFormDataSchema,
  applyJobSchema,
  confirmCourseCheckoutSchema,
  createBandSchema,
  createChatMessageSchema,
  createConcertSchema,
  createCourseCheckoutSchema,
  createDirectChatThreadSchema,
  createForumCommentSchema,
  createForumPostSchema,
  createGroupChatSchema,
  deleteBandSchema,
  forumUploadSchema,
  forumVoteSchema,
  respondBandInvitationSchema,
  sendBandInvitationSchema,
  updateConcertStatusSchema,
  updateSoloModeSchema,
} from "@/lib/validations/workspace";

type IndexWorkspaceProps = { user: CurrentUser | null };
type SectionId =
  | "band"
  | "profile"
  | "shows"
  | "communities"
  | "chats"
  | "jobs"
  | "courses";
type ConcertStatus = "lead" | "negotiation" | "confirmed" | "post_show";

type NavItem = { id: SectionId; label: string; description: string };
type SectionItem = { title: string; meta: string; detail: string; image: string };
type ConcertItem = {
  id: string;
  userId?: string | null;
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
  status: ConcertStatus;
};
type ConcertFormState = {
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
};
type ConcertFormField = keyof ConcertFormState;
type JobItem = {
  id: string;
  title: string;
  type: string;
  city: string;
  image: string;
  pay: string;
  summary: string;
  description?: string;
  requiresCv: boolean;
  requester?: string;
  requesterRole?: string;
  requirements?: string[];
  deadline?: string;
};
type ChatMessage = {
  id: string;
  sender: "me" | "them";
  text: string;
  at: string;
  unread?: boolean;
  status?: "sending" | "sent" | "error";
};
type ChatThread = {
  id: string;
  contact: string;
  role: string;
  avatar: string;
  contactUserId: string | null;
  isGroup: boolean;
  groupName: string;
  memberIds: string[];
  messages: ChatMessage[];
};

type ChatMessageApiRecord = {
  id: string;
  senderType: "me" | "them";
  text: string;
  isUnread: boolean;
  createdAt: string;
};

type ChatThreadApiRecord = {
  id: string;
  contactName: string;
  contactRole: string;
  contactAvatar: string;
  contactUserId: string | null;
  isGroup?: boolean;
  groupName?: string;
  memberIds?: string[];
  messages: ChatMessageApiRecord[];
};

type ForumCommentApiRecord = {
  id: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
};

type ForumPostApiRecord = {
  id: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  body: string;
  category: ForumCategory;
  mediaType: "none" | "image" | "video" | "audio";
  mediaUrl: string;
  linkUrl: string;
  upvotes: number;
  createdAt: string;
  comments: ForumCommentApiRecord[];
};

type WorkspaceNotificationItem = {
  id: string;
  kind: "chat" | "forum-comment";
  title: string;
  body: string;
  at: string;
  threadId?: string;
  postId?: string;
};


type CourseItem = {
  id: string;
  title: string;
  instructor: string;
  instructorUserId: string | null;
  level: string;
  imageUrl: string;
  summary: string;
  priceUsd: number;
  createdAt: string;
};

type CourseOwnershipFilter = "all" | "owned" | "not-owned";
type CourseCostFilter = "all" | "low" | "mid" | "high";
type CourseDurationFilter = "all" | "short" | "medium" | "long";
type CourseTopic = "General" | "Produccion" | "Performance" | "Instrumento" | "Negocio";

type CoursePurchaseItem = {
  id: string;
  courseId: string;
  provider: "paypal" | "stripe";
  status: "pending" | "paid" | "failed";
  amountUsd: number;
  currency: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt?: string;
};

type BandMember = {
  id: string;
  userId: string;
  role: string;
  memberName: string;
  memberAvatar: string;
  memberInstrument: string;
  memberMusicianType: string;
};

type BannerFitMode = "cover" | "contain";

type BandData = {
  id: string;
  name: string;
  creatorUserId: string;
  genre?: string;
  bio?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bannerFit?: BannerFitMode;
  members: BandMember[];
};

type BandInvitation = {
  id: string;
  bandId: string;
  bandName: string;
  inviterName: string;
  inviteeUserId: string;
  inviteeName: string;
  status: "pending" | "accepted" | "rejected";
};

type CourseModuleItem = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  lessonType: "video" | "reading" | "practice";
  durationMinutes: number;
  content: string;
  videoUrl: string;
  createdAt: string;
};
type CoursePreviewModule = {
  id: string;
  position: number;
  title: string;
  lessonType: "video" | "reading" | "practice";
  durationMinutes: number;
};
type CoursePreviewState = {
  course: CourseItem;
  whatYouLearn: string[];
  modules: CoursePreviewModule[];
  instructorUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};
type ForumCategory = "General" | "Produccion" | "Conciertos" | "Colaboraciones" | "Gear";
type ForumComment = {
  id: string;
  authorUserId?: string | null;
  author: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
};
type ForumPost = {
  id: string;
  authorUserId?: string | null;
  author: string;
  authorAvatarUrl?: string;
  title: string;
  body: string;
  category: ForumCategory;
  mediaType: "none" | "image" | "video" | "audio";
  mediaUrl: string;
  linkUrl: string;
  upvotes: number;
  comments: ForumComment[];
  createdAt: string;
};
type AdminDeleteTarget =
  | { kind: "forum-post"; postId: string }
  | { kind: "forum-comment"; postId: string; commentId: string }
  | { kind: "job"; jobId: string }
  | { kind: "course"; courseId: string };

type WorkspaceResponse = {
  isLoggedIn: boolean;
  concerts: Array<{
    id: string;
    userId: string;
    title: string;
    date: string;
    venue: string;
    city: string;
    flyerUrl: string;
    ticketUrl: string;
    capacity: string;
    status: ConcertStatus;
  }> | null;
  forumPosts: ForumPostApiRecord[] | null;
  jobs: Array<{
    id: string;
    title: string;
    type: string;
    city: string;
    imageUrl: string;
    pay: string;
    summary: string;
    description: string;
    requiresCv: boolean;
    requesterName: string;
    requesterRole: string;
    requirements: string[];
    deadline: string;
    posterUserId: string | null;
  }> | null;
  jobApplications: Array<{
    id: string;
    jobId: string;
    status: string;
  }> | null;
  chatThreads: ChatThreadApiRecord[] | null;

  courses: Array<{
    id: string;
    title: string;
    instructor: string;
    instructorUserId?: string | null;
    level: string;
    imageUrl: string;
    summary: string;
    priceUsd: number;
    createdAt: string;
  }> | null;
  coursePurchases: Array<{
    id: string;
    courseId: string;
    provider: "paypal" | "stripe";
    status: "pending" | "paid" | "failed";
    amountUsd: number;
    currency: string;
    checkoutUrl: string;
    createdAt: string;
    updatedAt: string;
  }> | null;
};
type SectionData = {
  heading: string;
  subtitle: string;
  hero: string;
  chips: string[];
  items: SectionItem[];
  stats: { label: string; value: string }[];
};

const pipelineLabels: Record<ConcertStatus, string> = {
  lead: "Lead",
  negotiation: "Negociacion",
  confirmed: "Confirmado",
  post_show: "Post-show",
};

const navItems: NavItem[] = [
  { id: "band", label: "Tu banda", description: "Equipo, roles y disponibilidad" },
  { id: "profile", label: "Tu perfil", description: "Identidad artistica y marca" },
  { id: "shows", label: "Conciertos proximos", description: "Shows, flyers y agenda" },
  { id: "communities", label: "Comunidades", description: "Networking musical activo" },
  { id: "chats", label: "Chats privados", description: "Mensajeria de produccion" },
  { id: "jobs", label: "Trabajos como musico", description: "Oportunidades y castings" },
  { id: "courses", label: "Cursos", description: "Venta de cursos y pagos" },
];

const statusOrder: ConcertStatus[] = ["lead", "negotiation", "confirmed", "post_show"];
const concertCardFallbackFlyers = [
  "/flyers/Flyer%201.jpg",
  "/flyers/Flyer%202.jpg",
  "/flyers/Flyer%203.jpg",
  "/flyers/Flyer%204.jpg",
  "/flyers/Flyer%205.jpg",
] as const;
const forumCategories: Array<ForumCategory | "Todas"> = [
  "Todas",
  "General",
  "Produccion",
  "Conciertos",
  "Colaboraciones",
  "Gear",
];

const sectionData: Record<SectionId, SectionData> = {
  band: {
    heading: "Direccion de la banda",
    subtitle: "Fotos de integrantes, avance de ensayo y cohesion del equipo.",
    hero: "https://source.unsplash.com/1600x900/?band,rehearsal,studio",
    chips: ["Setlist vivo", "Ensayo tecnico", "Asistencia"],
    items: [
      {
        title: "Ariel Gomez - Voz lider",
        meta: "Estado: Disponible",
        detail: "Asistencia 95%",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        title: "Nina Rosario - Guitarra",
        meta: "Estado: Disponible",
        detail: "Asistencia 92%",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        title: "Leo Martin - Bateria",
        meta: "Estado: Parcial",
        detail: "Asistencia 74%",
        image: "https://randomuser.me/api/portraits/men/41.jpg",
      },
    ],
    stats: [
      { label: "Ensayos esta semana", value: "3" },
      { label: "Promedio de asistencia", value: "88%" },
      { label: "Vacantes abiertas", value: "2" },
    ],
  },
  profile: {
    heading: "Perfil del artista",
    subtitle: "Imagen publica, posicionamiento y presencia escenica.",
    hero: "https://source.unsplash.com/1600x900/?musician,portrait,stage",
    chips: ["Marca", "Press kit", "Audiencia"],
    items: [
      {
        title: "Foto de portada",
        meta: "Uso: portada principal",
        detail: "Resolucion alta para booking",
        image: "https://source.unsplash.com/900x900/?singer,portrait,music",
      },
      {
        title: "Foto en vivo",
        meta: "Uso: redes y promo",
        detail: "Toma de escenario con audiencia",
        image: "https://source.unsplash.com/900x900/?artist,live,performance",
      },
      {
        title: "Foto en estudio",
        meta: "Uso: media kit",
        detail: "Sesion de grabacion",
        image: "https://source.unsplash.com/900x900/?music,studio,artist",
      },
    ],
    stats: [
      { label: "Seguidores activos", value: "21.4k" },
      { label: "Clicks en perfil", value: "3,190" },
      { label: "Crecimiento mensual", value: "+8.4%" },
    ],
  },
  shows: {
    heading: "Conciertos con flyers",
    subtitle: "Cada fecha incluye flyer visual, venue y estado operativo.",
    hero: "https://source.unsplash.com/1600x900/?concert,stage,lights",
    chips: ["Flyers", "Ticketing", "Rider"],
    items: [
      {
        title: "Noche Indie Caribe",
        meta: "Vie 18 Sep - 8:30 PM",
        detail: "Sala Aurora - Santo Domingo - Confirmado",
        image: "https://source.unsplash.com/700x1000/?concert,flyer,neon",
      },
      {
        title: "Acustico en Plaza Norte",
        meta: "Sab 26 Sep - 6:00 PM",
        detail: "Foro Plaza Norte - Santiago - En promocion",
        image: "https://source.unsplash.com/700x1000/?music,poster,stage",
      },
      {
        title: "Festival Ritmo Urbano",
        meta: "Dom 4 Oct - 9:00 PM",
        detail: "Anfiteatro Central - La Vega - Pendiente de flyer",
        image: "https://source.unsplash.com/700x1000/?festival,poster,music",
      },
    ],
    stats: [
      { label: "Flyers pendientes", value: "1" },
      { label: "Rider completado", value: "92%" },
      { label: "Tickets vendidos", value: "1,462" },
    ],
  },
  communities: {
    heading: "Comunidades musicales",
    subtitle: "Grupos con enfoque real para networking y crecimiento.",
    hero: "https://source.unsplash.com/1600x900/?music,festival,crowd",
    chips: ["Colaboraciones", "Foros", "Eventos"],
    items: [
      {
        title: "Productores Caribe",
        meta: "1,284 miembros",
        detail: "Produccion, mezcla y negocio",
        image: "https://source.unsplash.com/900x600/?music,studio,mixer",
      },
      {
        title: "Booking RD",
        meta: "892 miembros",
        detail: "Fechas, venues y alianzas",
        image: "https://source.unsplash.com/900x600/?concert,venue,lights",
      },
      {
        title: "Musicos Session LATAM",
        meta: "2,011 miembros",
        detail: "Colaboraciones remotas",
        image: "https://source.unsplash.com/900x600/?recording,musician,home",
      },
    ],
    stats: [
      { label: "Invitaciones semanales", value: "14" },
      { label: "Colaboraciones abiertas", value: "7" },
      { label: "Eventos activos", value: "3" },
    ],
  },
  chats: {
    heading: "Chats privados",
    subtitle: "Conversaciones con manager, productor y equipo visual.",
    hero: "https://source.unsplash.com/1600x900/?music,backstage,team",
    chips: ["Manager", "Productor", "Visuales"],
    items: [
      {
        title: "Manager - Laura",
        meta: "Nuevo mensaje",
        detail: "Contrato show octubre",
        image: "https://randomuser.me/api/portraits/women/12.jpg",
      },
      {
        title: "Productor - Santi",
        meta: "En revision",
        detail: "Version final del single",
        image: "https://randomuser.me/api/portraits/men/19.jpg",
      },
      {
        title: "Visuales - Diego",
        meta: "Esperando feedback",
        detail: "Loop para pantalla LED",
        image: "https://randomuser.me/api/portraits/men/56.jpg",
      },
    ],
    stats: [
      { label: "Sin leer", value: "9" },
      { label: "Resueltos hoy", value: "16" },
      { label: "Tiempo respuesta", value: "14 min" },
    ],
  },
  jobs: {
    heading: "Trabajos como musico",
    subtitle: "Vacantes y castings con presentacion visual de cada oportunidad.",
    hero: "https://source.unsplash.com/1600x900/?musician,work,performance",
    chips: ["Castings", "Sesiones", "Giras"],
    items: [
      {
        title: "Guitarrista para gira regional",
        meta: "Evento - Santiago",
        detail: "Contrato por temporada de shows",
        image: "https://source.unsplash.com/900x600/?guitar,concert,live",
      },
      {
        title: "Sesionista de bajo para estudio",
        meta: "Estudio - Santo Domingo",
        detail: "Grabacion EP de artista emergente",
        image: "https://source.unsplash.com/900x600/?bass,recording,music",
      },
      {
        title: "Director musical para showcase",
        meta: "Proyecto - La Vega",
        detail: "Direccion de banda y montaje en vivo",
        image: "https://source.unsplash.com/900x600/?music,director,stage",
      },
    ],
    stats: [
      { label: "Aplicaciones enviadas", value: "12" },
      { label: "Respuestas recibidas", value: "5" },
      { label: "Entrevistas", value: "2" },
    ],
  },
  courses: {
    heading: "Academia RitmoHub",
    subtitle: "Catalogo dinamico para vender cursos y validar pagos reales en segundos.",
    hero: "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=1600&q=80",
    chips: ["Checkout", "Cursos premium", "Acceso inmediato"],
    items: [
      {
        title: "Produccion Urbana desde Cero",
        meta: "Intermedio - USD 49",
        detail: "Beatmaking, arreglos y mezcla para artistas independientes.",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Voz en vivo y presencia escenica",
        meta: "Basico - USD 39",
        detail: "Tecnica vocal aplicada a escenarios y giras.",
        image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Booking y Negocio Musical para Bandas",
        meta: "Intermedio - USD 65",
        detail: "Negocia fechas, condiciones y estructura operativa profesional.",
        image: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
      },
    ],
    stats: [
      { label: "Cursos activos", value: "7" },
      { label: "Cursos premium", value: "7" },
      { label: "Checkout listo", value: "Stripe + PayPal" },
    ],
  },
};

const initialConcerts: ConcertItem[] = [];

const removedJobTitles = new Set([
  "Guitarrista para gira regional",
  "Sesionista de bajo para estudio",
  "Director musical para showcase de debut",
  "Tecladista para residencia en venue",
  "Cantante para orquesta de salsa moderna",
  "DJ para club nocturno - residencia mensual",
]);

const initialJobs: JobItem[] = [
  { id: "j-1", title: "Guitarrista para gira regional", type: "Evento", city: "Santiago", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80", pay: "USD 450 / show", summary: "Proyecto de 6 fechas con repertorio pop-rock.", description: "Buscamos guitarrista electrico con experiencia en pop-rock para una gira de 6 fechas por el Cibao. Repertorio de 90 min ya definido. Transporte y alojamiento incluidos.", requiresCv: true, requester: "Carlos Mendoza", requesterRole: "Manager artistico", requirements: ["Experiencia minima 2 anos en tarima", "Conocimiento de escala pentatonica y blues", "Disponibilidad fines de semana mayo-junio", "Equipo propio (guitarra + pedalera)"], deadline: "2026-05-10" },
  { id: "j-2", title: "Sesionista de bajo para estudio", type: "Estudio", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80", pay: "USD 320 / track pack", summary: "Grabacion de EP urbano alternativo.", description: "EP de 6 temas con influencias de trap, R&B y rock alternativo. Se graba en estudio propio en Piantini.", requiresCv: false, requester: "Brayan Perez", requesterRole: "Productor / Beatmaker", requirements: ["Dominio de slap y fingerstyle", "Lectura de cifrado Nashville", "Disponibilidad diurna (lunes a viernes)"], deadline: "2026-04-28" },
  { id: "j-3", title: "Director musical para showcase de debut", type: "Proyecto", city: "La Vega", image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80", pay: "USD 1,200 / proyecto", summary: "Direccion de banda y montaje de show debut.", description: "Artista nueva con lanzamiento de album debut en junio. Necesitamos director musical que coordine a 5 musicos y lidere los ensayos.", requiresCv: true, requester: "Lena Castillo", requesterRole: "Artista independiente", requirements: ["Experiencia dirigiendo bandas en vivo", "Conocimiento de in-ear monitors y click track", "Disponible para 4 ensayos presenciales"], deadline: "2026-05-20" },
  { id: "j-4", title: "Tecladista para residencia en venue", type: "Residencia", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80", pay: "USD 380 / show", summary: "Residencia mensual en venue de la Zona Colonial.", description: "Venue en la Zona Colonial busca tecladista para residencia fija los viernes y sabados. Set de 3 horas con merengue, salsa, bachata y pop.", requiresCv: false, requester: "Bar El Compas", requesterRole: "Venue / Productor de eventos", requirements: ["Dominio de generos caribeos", "Puntualidad y profesionalismo", "Referencias de trabajos anteriores"], deadline: "2026-04-30" },
  { id: "j-5", title: "Cantante para orquesta de salsa moderna", type: "Proyecto", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1501386761578-eaa54b9cb69d?auto=format&fit=crop&w=900&q=80", pay: "USD 600 / mes", summary: "Proyecto musical con contrato de 6 meses y grabacion incluida.", description: "Orquesta busca voz principal. Contrato, ensayos semanales y al menos 3 presentaciones mensuales. Grabacion de single incluida.", requiresCv: true, requester: "Orquesta La Nueva Ola", requesterRole: "Director de orquesta", requirements: ["Extension de al menos 2 octavas", "Experiencia en orquesta o banda en vivo", "Disponibilidad para ensayos domingos"], deadline: "2026-05-05" },
  { id: "j-6", title: "Baterista para banda de rock alternativo", type: "Proyecto", city: "Santiago", image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=80", pay: "USD 250 / show + % merch", summary: "Banda en formacion busca baterista con energia y creatividad.", description: "Proyecto de rock alternativo con influencias de Arctic Monkeys e Interpol. Tenemos 8 temas propios y buscamos baterista que aporte ideas al arreglo.", requiresCv: false, requester: "Banda Ruido Norte", requesterRole: "Proyecto musical", requirements: ["Dominio de ritmos en compas 4/4, 6/8 y 7/8", "Bateria propia o acceso a kit completo", "Disponibilidad para ensayar 2 veces por semana"], deadline: "2026-05-15" },
  { id: "j-7", title: "Productor para EP de musica urbana", type: "Estudio", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80", pay: "USD 800 / EP completo", summary: "Artista urbana con 50K seguidores busca productor para EP debut.", description: "EP de 5 temas con referencias Rosalia, Bad Gyal y Tokischa. Se requiere productor con manejo de FL Studio o Ableton y que aporte vision artistica.", requiresCv: true, requester: "Valentina M.", requesterRole: "Artista urbana independiente", requirements: ["Portfolio de producciones propias", "Manejo de FL Studio 20 o Ableton 11+", "Referencia de al menos un lanzamiento en plataformas digitales"], deadline: "2026-05-01" },
  { id: "j-8", title: "Violinista para cuarteto de bodas y eventos", type: "Evento", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=900&q=80", pay: "USD 200 / evento (3 hrs)", summary: "Cuarteto de cuerdas busca violinista para eventos sociales.", description: "Cuarteto establecido con agenda activa de bodas y eventos corporativos. Repertorio clasico, pop y crossover ya preparado.", requiresCv: false, requester: "Cuarteto Arco Iris", requesterRole: "Ensamble musical", requirements: ["Lectura de partitura fluida", "Vestuario formal propio", "Disponibilidad fines de semana"], deadline: "2026-04-25" },
  { id: "j-9", title: "DJ para club nocturno - residencia mensual", type: "Residencia", city: "Punta Cana", image: "https://images.unsplash.com/photo-1571266028243-d220c6a7f1e6?auto=format&fit=crop&w=900&q=80", pay: "USD 700 / noche", summary: "Club premium busca DJ residente con manejo de electronica.", description: "Club de lujo en Punta Cana busca DJ residente para dos noches al mes. Capacidad 400 personas. Se espera house, afrobeats y reggaeton premium.", requiresCv: false, requester: "Club Zenith PC", requesterRole: "Club / Booking manager", requirements: ["Minimo 3 anos de experiencia en clubes", "Equipo propio (controlador + laptop)", "Mix de prueba de 30 min antes de entrevista"], deadline: "2026-05-08" },
  { id: "j-10", title: "Trompetista para big band de jazz", type: "Proyecto", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80", pay: "USD 180 / ensayo + 300 / show", summary: "Big band de 18 musicos busca trompetista de seccion.", description: "Big band de jazz dominicana con 10 anos de trayectoria. Repertorio de Basie, Ellington y composiciones originales. Presentaciones en festivales 4 veces al ano.", requiresCv: true, requester: "Big Band Quisqueya Jazz", requesterRole: "Director artistico", requirements: ["Lectura de particella a primera vista", "Experiencia en seccion de metales", "Asistencia obligatoria a ensayos (miercoles 7pm)"], deadline: "2026-05-25" },
  { id: "j-11", title: "Musico de sesion - Guitarra acustica para album", type: "Estudio", city: "Santiago", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80", pay: "USD 150 / sesion (4 hrs)", summary: "Grabacion de guitarra acustica para album de folk dominicano.", description: "Album de folk y musica rural dominicana en proceso. Necesitamos guitarrista con conocimiento de palos, merengue tipico y musica campesina. Estimado 3-4 sesiones.", requiresCv: false, requester: "Rafael Duarte", requesterRole: "Compositor e investigador musical", requirements: ["Conocimiento de ritmos folkloricos dominicanos", "Guitarra de 12 cuerdas o clasica de nylon propia", "Disposicion para improvisar dentro de estructura"], deadline: "2026-05-12" },
  { id: "j-12", title: "Instructor de piano para academia de musica", type: "Docencia", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=900&q=80", pay: "USD 25 / hora clase", summary: "Academia busca instructor de piano para ninos y adolescentes.", description: "Academia en Bella Vista busca instructor de piano para clases individuales de ninos de 6 a 16 anos. Horario de tarde. Metodo Suzuki o similar.", requiresCv: true, requester: "Academia Notas y Solfeo", requesterRole: "Directora academica", requirements: ["Licenciatura o tecnico en musica", "Experiencia previa en docencia con menores", "Disponibilidad lunes a viernes 3pm-7pm"], deadline: "2026-04-30" },
  { id: "j-13", title: "Percusionista para proyecto afro-caribeño", type: "Proyecto", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?auto=format&fit=crop&w=900&q=80", pay: "USD 300 / show", summary: "Colectivo musical afro-caribeño busca percusionista con raices.", description: "Proyecto interdisciplinario que combina percusion afrodominicana, jazz y electronica. Buscamos percusionista con conocimiento de tambora, palo y conga.", requiresCv: false, requester: "Colectivo Raiz Viva", requesterRole: "Colectivo artistico", requirements: ["Dominio de tambora y/o palo dominicano", "Apertura a fusion e improvisacion", "Compromiso con identidad cultural afrodominicana"], deadline: "2026-05-18" },
  { id: "j-14", title: "Saxofonista para trio de jazz en restaurante", type: "Residencia", city: "Santo Domingo", image: "https://images.unsplash.com/photo-1619983081593-e2ba5b543168?auto=format&fit=crop&w=900&q=80", pay: "USD 120 / noche (3 sets)", summary: "Restaurante de cocina francesa busca trio de jazz con saxo.", description: "Restaurante Bon Appetit en Serralles busca saxofonista para trio los jueves y viernes de 7pm a 10pm. Ambiente intimo y sofisticado.", requiresCv: false, requester: "Restaurante Bon Appetit", requesterRole: "Gerente de entretenimiento", requirements: ["Saxo tenor o alto propio en buen estado", "Repertorio de jazz standards (Real Book)", "Presentacion impecable (traje formal)"], deadline: "2026-04-27" },
  { id: "j-15", title: "Tecnico de sonido para festival de musica", type: "Evento", city: "Puerto Plata", image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80", pay: "USD 900 / festival (3 dias)", summary: "Festival de musica independiente busca tecnico de sonido principal.", description: "Festival 'Sonar RD' en Puerto Plata (2-4 junio) busca tecnico de sonido principal para escenario de 2000 personas. Hospedaje, alimentacion y transporte incluidos.", requiresCv: true, requester: "Sonar RD Festival", requesterRole: "Produccion ejecutiva", requirements: ["Minimo 5 anos en sonido en vivo", "Manejo de consola digital (SSL, DiGiCo o Yamaha CL)", "Experiencia en festivales o eventos de gran formato"], deadline: "2026-05-15" },
].filter((job) => !removedJobTitles.has(job.title));

const initialThreads: ChatThread[] = [];

function mapChatThreadsToUi(threads: ChatThreadApiRecord[]): ChatThread[] {
  return threads.map((thread) => ({
    id: thread.id,
    contact: thread.contactName,
    role: thread.contactRole,
    avatar: thread.contactAvatar,
    contactUserId: thread.contactUserId ?? null,
    isGroup: thread.isGroup ?? false,
    groupName: thread.groupName ?? "",
    memberIds: thread.memberIds ?? [],
    messages: thread.messages.map((message) => ({
      id: message.id,
      sender: message.senderType,
      text: message.text,
      at: formatRelativeTime(message.createdAt),
      unread: message.isUnread,
    })),
  }));
}

function mergeChatThreadsKeepingOptimisticState(previous: ChatThread[], incoming: ChatThread[]) {
  const previousById = new Map(previous.map((thread) => [thread.id, thread]));

  return incoming.map((thread) => {
    const previousThread = previousById.get(thread.id);
    if (!previousThread) {
      return thread;
    }

    const pendingMessages = previousThread.messages.filter(
      (message) =>
        message.id.startsWith("temp-") && (message.status === "sending" || message.status === "error"),
    );

    if (pendingMessages.length === 0) {
      return thread;
    }

    const incomingMessageIds = new Set(thread.messages.map((message) => message.id));
    const unresolvedPending = pendingMessages.filter((message) => !incomingMessageIds.has(message.id));

    if (unresolvedPending.length === 0) {
      return thread;
    }

    return {
      ...thread,
      messages: [...thread.messages, ...unresolvedPending],
    };
  });
}

function mapForumPostsToUi(posts: ForumPostApiRecord[]): ForumPost[] {
  return posts.map((post) => ({
    id: post.id,
    authorUserId: post.authorUserId ?? null,
    author: post.authorName,
    authorAvatarUrl: post.authorAvatarUrl ?? "",
    title: post.title,
    body: post.body,
    category: post.category,
    mediaType: post.mediaType ?? "none",
    mediaUrl: post.mediaUrl ?? "",
    linkUrl: post.linkUrl ?? "",
    upvotes: post.upvotes,
    createdAt: formatRelativeTime(post.createdAt),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      authorUserId: comment.authorUserId ?? null,
      author: comment.authorName,
      authorAvatarUrl: comment.authorAvatarUrl ?? "",
      text: comment.text,
      createdAt: formatRelativeTime(comment.createdAt),
    })),
  }));
}

function toNotificationPreview(text: string, max = 84) {
  const normalized = text.trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3)}...`;
}



const initialCourses: CourseItem[] = [
  {
    id: "course-1",
    title: "Produccion Urbana desde Cero",
    instructor: "Santi Diaz",
    instructorUserId: "u-santi-diaz",
    level: "Intermedio",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
    summary: "Aprende beatmaking, arreglos y mezcla para tracks comerciales.",
    priceUsd: 49,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "course-2",
    title: "Voz en Vivo y Presencia Escenica",
    instructor: "Nina Rosario",
    instructorUserId: "u-nina-rosario",
    level: "Basico",
    imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    summary: "Tecnica, control y performance para elevar tu show.",
    priceUsd: 39,
    createdAt: "2026-04-03T10:00:00.000Z",
  },
  {
    id: "course-3",
    title: "Marketing para Artistas Independientes",
    instructor: "Laura Perez",
    instructorUserId: "u-laura-perez",
    level: "Todos",
    imageUrl: "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=900&q=80",
    summary: "Estrategias de contenido, branding y conversion para vender entradas y cursos.",
    priceUsd: 59,
    createdAt: "2026-04-04T10:00:00.000Z",
  },
  {
    id: "course-4",
    title: "Ableton Live: Produccion Rapida para Shows",
    instructor: "Diego Mora",
    instructorUserId: "u-diego-mora",
    level: "Intermedio",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
    summary: "Crea sesiones live, stems y transiciones listas para escenario.",
    priceUsd: 79,
    createdAt: "2026-04-05T10:00:00.000Z",
  },
  {
    id: "course-5",
    title: "Mix y Master para Streaming",
    instructor: "Ariel Gomez",
    instructorUserId: "u-ariel-gomez",
    level: "Avanzado",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80",
    summary: "Loudness, dinamica y exportes optimos para plataformas digitales.",
    priceUsd: 89,
    createdAt: "2026-04-06T10:00:00.000Z",
  },
  {
    id: "course-6",
    title: "Guitarra Ritmica Moderna",
    instructor: "Leo Martin",
    instructorUserId: "u-leo-martin",
    level: "Basico",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
    summary: "Patrones ritmicos y recursos practicos para tocar en banda con groove.",
    priceUsd: 29,
    createdAt: "2026-04-07T10:00:00.000Z",
  },
  {
    id: "course-10",
    title: "Booking y Negocio Musical para Bandas",
    instructor: "Laura Perez",
    instructorUserId: "u-laura-perez",
    level: "Intermedio",
    imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
    summary: "Negocia fechas, condiciones y estructura operativa profesional.",
    priceUsd: 65,
    createdAt: "2026-04-11T10:00:00.000Z",
  },
];

const initialForumPosts: ForumPost[] = [
  {
    id: "f-1",
    author: "Nina Rosario",
    title: "Que plugin recomiendan para voces indie limpias?",
    body: "Busco un chain rapido para voz principal en vivo, algo estable y con poco CPU.",
    category: "Produccion",
    mediaType: "none",
    mediaUrl: "",
    linkUrl: "",
    upvotes: 24,
    createdAt: "Hoy 09:18",
    comments: [
      {
        id: "fc-1",
        author: "Santi Diaz",
        text: "Prueba compresion suave + de-esser y un slapback corto.",
        createdAt: "Hoy 09:34",
      },
      {
        id: "fc-2",
        author: "Ariel Gomez",
        text: "Con presets de voz pop te puede funcionar rapido para show.",
        createdAt: "Hoy 09:40",
      },
    ],
  },
  {
    id: "f-2",
    author: "Laura Perez",
    title: "Venue nuevo en Santiago para 600 personas",
    body: "Abrieron un venue con buena iluminacion y buena politica para artistas locales.",
    category: "Conciertos",
    mediaType: "none",
    mediaUrl: "",
    linkUrl: "",
    upvotes: 31,
    createdAt: "Ayer 18:07",
    comments: [
      {
        id: "fc-3",
        author: "Diego Mora",
        text: "Ya lo vi, LED frontal decente para visuales.",
        createdAt: "Ayer 18:22",
      },
    ],
  },
  {
    id: "f-3",
    author: "Leo Martin",
    title: "Busco bajista para set de fusion",
    body: "Proyecto de 4 fechas, ensayo martes y jueves, referencias: funk/neo-soul.",
    category: "Colaboraciones",
    mediaType: "none",
    mediaUrl: "",
    linkUrl: "",
    upvotes: 19,
    createdAt: "Ayer 11:50",
    comments: [],
  },
];

const forumCategoryImages: Record<ForumCategory, string> = {
  General:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
  Produccion:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  Conciertos:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
  Colaboraciones:
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
  Gear:
    "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80",
};


const paypalMeCheckoutBaseUrl = "https://paypal.me/iClexiG";

function getForumPostImage(category: ForumCategory) {
  return forumCategoryImages[category] ?? forumCategoryImages.General;
}

function getForumPostCoverImage(post: Pick<ForumPost, "category" | "mediaType" | "mediaUrl">) {
  if (post.mediaType === "image" && post.mediaUrl) {
    return post.mediaUrl;
  }
  return getForumPostImage(post.category);
}

function getAuthorInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "RH";
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCourseTopic(course: Pick<CourseItem, "title" | "summary">): CourseTopic {
  const haystack = `${course.title} ${course.summary}`.toLowerCase();

  if (/(marketing|booking|negocia|negocio|branding|ventas)/.test(haystack)) {
    return "Negocio";
  }

  if (/(voz|escenic|show|performance|presencia)/.test(haystack)) {
    return "Performance";
  }

  if (/(guitarra|bajo|piano|bateria|instrument|ritmica)/.test(haystack)) {
    return "Instrumento";
  }

  if (/(ableton|mix|master|beat|produccion|mezcla|streaming)/.test(haystack)) {
    return "Produccion";
  }

  return "General";
}

function getCourseDurationHours(course: Pick<CourseItem, "id" | "title">) {
  const source = `${course.id}-${course.title}`;
  let seed = 0;

  for (const char of source) {
    seed += char.charCodeAt(0);
  }

  const minutes = 80 + (seed % 201);
  return minutes / 60;
}

function getCourseDurationFilter(hours: number): CourseDurationFilter {
  if (hours < 2.5) {
    return "short";
  }
  if (hours <= 3.8) {
    return "medium";
  }
  return "long";
}

function getCourseModuleCount(hours: number) {
  return Math.max(6, Math.round(hours * 4.5));
}

function matchesCourseCost(priceUsd: number, filter: CourseCostFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "low") {
    return priceUsd <= 40;
  }
  if (filter === "mid") {
    return priceUsd > 40 && priceUsd <= 70;
  }
  return priceUsd > 70;
}


export function IndexWorkspace({ user }: IndexWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("band");
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [netSearchQuery, setNetSearchQuery] = useState("");
  const [netSearchOpen, setNetSearchOpen] = useState(false);
  const [netSearchLoading, setNetSearchLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WorkspaceNotificationItem[]>([]);
  const [netSearchResults, setNetSearchResults] = useState<{
    users: Array<{ id: string; name: string; musicianType: string; primaryInstrument: string; avatarUrl: string }>;
    bands: Array<{ id: string; name: string; genre: string; memberCount: number }>;
    posts: Array<{ id: string; title: string; category: string; authorName: string; authorUserId: string | null }>;
  } | null>(null);
  const netSearchRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const seenChatMessageIdsRef = useRef<Set<string>>(new Set());
  const seenForumCommentIdsRef = useRef<Set<string>>(new Set());
  const seededChatNotificationsRef = useRef(false);
  const seededForumNotificationsRef = useRef(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  //  Chat new features state 
  const [chatSearch, setChatSearch] = useState("");
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; name: string; email: string; musicianType: string; primaryInstrument: string; avatarUrl: string }>>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [groupMemberQuery, setGroupMemberQuery] = useState("");
  const [groupMemberResults, setGroupMemberResults] = useState<Array<{ id: string; name: string; email: string; primaryInstrument: string; avatarUrl: string }>>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Array<{ id: string; name: string; avatarUrl: string }>>([]);
  const [groupCreating, setGroupCreating] = useState(false);
  const [band, setBand] = useState<BandData | null>(null);
  const [bandLoading, setBandLoading] = useState(false);
  const [incomingInvitations, setIncomingInvitations] = useState<BandInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<BandInvitation[]>([]);
  const [isSolo, setIsSolo] = useState(user?.isSolo ?? false);
  const [showCreateBand, setShowCreateBand] = useState(false);
  const [newBandName, setNewBandName] = useState("");
  const [bandError, setBandError] = useState<string | null>(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [bandInviteQuery, setBandInviteQuery] = useState("");
  const [bandInviteResults, setBandInviteResults] = useState<Array<{ id: string; name: string; primaryInstrument: string; musicianType: string; avatarUrl: string }>>([]);
  const [bandInviteLoading, setBandInviteLoading] = useState(false);
  const [showBandBrandingPanel, setShowBandBrandingPanel] = useState(false);
  const [bandBranding, setBandBranding] = useState<{
    name: string;
    genre: string;
    bio: string;
    logoUrl: string;
    bannerUrl: string;
    bannerFit: BannerFitMode;
  }>({ name: "", genre: "", bio: "", logoUrl: "", bannerUrl: "", bannerFit: "cover" });
  const [bandBrandingSaving, setBandBrandingSaving] = useState(false);
  const [bandBrandingMessage, setBandBrandingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [concerts, setConcerts] = useState<ConcertItem[]>(initialConcerts);
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [activeSectionLoading, setActiveSectionLoading] = useState(false);
  const [activeSectionError, setActiveSectionError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(initialForumPosts);
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [coursePurchases, setCoursePurchases] = useState<CoursePurchaseItem[]>([]);
  const [, setIsWorkspaceLoading] = useState(true);
  const [forumFilter, setForumFilter] = useState<ForumCategory | "Todas">("Todas");
  const [forumSort, setForumSort] = useState<"hot" | "new" | "top">("hot");
  const [showForumCompose, setShowForumCompose] = useState(false);
  const [forumSearch, setForumSearch] = useState("");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  // Network search: debounced API call
  useEffect(() => {
    const q = netSearchQuery.trim();
    if (q.length < 2) { setNetSearchResults(null); setNetSearchLoading(false); return; }
    setNetSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setNetSearchResults(data);
      } catch { setNetSearchResults(null); }
      finally { setNetSearchLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [netSearchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (netSearchRef.current && !netSearchRef.current.contains(e.target as Node)) {
        setNetSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handler = (e: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notificationsOpen]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (openPostId) {
      const scrollY = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.classList.add("modal-open");
      html.classList.add("modal-open");
      window.dispatchEvent(new CustomEvent("rh-stage-lock"));

      return () => {
        body.classList.remove("modal-open");
        html.classList.remove("modal-open");
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        window.scrollTo(0, scrollY);
        window.dispatchEvent(new CustomEvent("rh-stage-unlock"));
      };
    }

    body.classList.remove("modal-open");
    html.classList.remove("modal-open");
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    window.dispatchEvent(new CustomEvent("rh-stage-unlock"));

    return undefined;
  }, [openPostId]);
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});
  const [forumDraft, setForumDraft] = useState({
    title: "",
    body: "",
    category: "General" as ForumCategory,
    mediaType: "none" as "none" | "image" | "video" | "audio",
    mediaUrl: "",
    linkUrl: "",
  });
  const [forumFile, setForumFile] = useState<File | null>(null);
  const [forumPublishing, setForumPublishing] = useState(false);
  const [forumError, setForumError] = useState<string | null>(null);
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<AdminDeleteTarget | null>(null);
  const [adminDeletePending, setAdminDeletePending] = useState(false);
  const [adminDeleteError, setAdminDeleteError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmittingPostId] = useState<string | null>(null);
  const [commentErrorByPostId] = useState<Record<string, string>>({});
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0]?.id ?? "");
  const [pendingThreadToOpen, setPendingThreadToOpen] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobCity, setJobCity] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showJobCompose, setShowJobCompose] = useState(false);
  const [jobComposeForm, setJobComposeForm] = useState({ title: "", type: "Evento", city: "", pay: "", summary: "", description: "", requirements: "", deadline: "", requiresCv: false });
  const [concertSearch, setConcertSearch] = useState("");
  const [concertStatusFilter, setConcertStatusFilter] = useState<ConcertStatus | "all">("all");
  const [applications, setApplications] = useState<Record<string, "applied">>({});
  const [concertForm, setConcertForm] = useState<ConcertFormState>({
    title: "",
    date: "",
    venue: "",
    city: "",
    flyerUrl: "",
    ticketUrl: "",
    capacity: "",
  });
  const [concertFormFieldErrors, setConcertFormFieldErrors] = useState<Partial<Record<ConcertFormField, string>>>({});
  const [concertFormError, setConcertFormError] = useState<string | null>(null);
  const [concertPublishing, setConcertPublishing] = useState(false);
  const [concertFlyerUploading, setConcertFlyerUploading] = useState(false);
  const [showConcertCompose, setShowConcertCompose] = useState(false);
  const [deletingConcertId, setDeletingConcertId] = useState<string | null>(null);
  const [concertDeleteTargetId, setConcertDeleteTargetId] = useState<string | null>(null);
  const [concertDeleteError, setConcertDeleteError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "paypal">("stripe");
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [, setCourseError] = useState<string | null>(null);
  const [, setCourseSuccess] = useState<string | null>(null);
  const [, setCourseContentError] = useState<string | null>(null);
  const [, setCourseContentLoading] = useState<string | null>(null);
  const [, setSelectedCourseContent] = useState<{
    course: CourseItem;
    modules: CourseModuleItem[];
  } | null>(null);
  const [selectedCoursePreview] = useState<CoursePreviewState | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseOwnershipFilter, setCourseOwnershipFilter] = useState<CourseOwnershipFilter>("all");
  const [courseCostFilter, setCourseCostFilter] = useState<CourseCostFilter>("all");
  const [courseDurationFilter, setCourseDurationFilter] = useState<CourseDurationFilter>("all");
  const [courseTopicFilter, setCourseTopicFilter] = useState<CourseTopic | "Todos">("Todos");
  const [courseLevelFilter, setCourseLevelFilter] = useState("Todos");
  const [courseSort, setCourseSort] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";
  const active = sectionData[activeSection];
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads],
  );
  const adminDeleteModalCopy = useMemo(() => {
    if (!adminDeleteTarget) {
      return null;
    }

    if (adminDeleteTarget.kind === "forum-post") {
      return {
        title: "Eliminar post",
        message: "Esta accion eliminara el post de la comunidad de forma permanente.",
        confirmLabel: "Eliminar post",
      };
    }

    if (adminDeleteTarget.kind === "forum-comment") {
      return {
        title: "Eliminar comentario",
        message: "Esta accion eliminara el comentario de forma permanente.",
        confirmLabel: "Eliminar comentario",
      };
    }

    if (adminDeleteTarget.kind === "job") {
      return {
        title: "Eliminar oportunidad",
        message: "Esta accion eliminara la oportunidad publicada.",
        confirmLabel: "Eliminar oportunidad",
      };
    }

    return {
      title: "Eliminar curso",
      message: "Esta accion eliminara el curso del catalogo.",
      confirmLabel: "Eliminar curso",
    };
  }, [adminDeleteTarget]);

  const analytics = useMemo(() => {
    const uniqueConcerts = dedupeConcertItems(concerts);
    const totalConcerts = uniqueConcerts.length;
    const confirmedConcerts = uniqueConcerts.filter((concert) => concert.status === "confirmed").length;
    const pipelineOpen = uniqueConcerts.filter(
      (concert) => concert.status === "lead" || concert.status === "negotiation",
    ).length;
    const appliedJobs = Object.keys(applications).length;
    const unreadMessages = threads
      .flatMap((thread) => thread.messages)
      .filter((message) => message.sender === "them" && message.unread).length;

    return { totalConcerts, confirmedConcerts, pipelineOpen, appliedJobs, unreadMessages };
  }, [applications, concerts, threads]);
  const notificationCount = notifications.length;

  const uniqueCities = useMemo(() => Array.from(new Set(jobs.map((job) => job.city))), [jobs]);
  const uniqueTypes = useMemo(() => Array.from(new Set(jobs.map((job) => job.type))), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const query = jobSearch.trim().toLowerCase();
      const queryOk =
        query.length === 0 ||
        `${job.title} ${job.summary}`.toLowerCase().includes(query);
      const cityOk = jobCity === "all" || job.city === jobCity;
      const typeOk = jobType === "all" || job.type === jobType;

      return queryOk && cityOk && typeOk;
    });
  }, [jobCity, jobSearch, jobType, jobs]);
  const getConcertFormFieldErrors = useCallback((draft: ConcertFormState) => {
    const parsed = createConcertSchema.safeParse({
      ...draft,
      date: draft.date.trim(),
    });

    if (parsed.success) {
      return {} as Partial<Record<ConcertFormField, string>>;
    }

    const nextErrors: Partial<Record<ConcertFormField, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field !== "string") {
        continue;
      }

      const key = field as ConcertFormField;
      if (!nextErrors[key]) {
        nextErrors[key] = issue.message;
      }
    }

    return nextErrors;
  }, []);
  const updateConcertFormField = useCallback((field: ConcertFormField, value: string) => {
    setConcertForm((prev) => {
      const nextDraft: ConcertFormState = {
        ...prev,
        [field]: value,
      };
      setConcertFormFieldErrors(getConcertFormFieldErrors(nextDraft));
      return nextDraft;
    });
    setConcertFormError(null);
  }, [getConcertFormFieldErrors]);
  const filteredConcerts = useMemo(() => {
    return dedupeConcertItems(concerts).filter((concert) => {
      const query = concertSearch.trim().toLowerCase();
      const queryOk =
        query.length === 0 ||
        `${concert.title} ${concert.venue} ${concert.city}`.toLowerCase().includes(query);
      const statusOk = concertStatusFilter === "all" || concert.status === concertStatusFilter;

      return queryOk && statusOk;
    });
  }, [concertSearch, concertStatusFilter, concerts]);
  const visibleConcerts = useMemo(() => {
    return filteredConcerts;
  }, [filteredConcerts]);
  const concertDeleteTarget = useMemo(() => {
    if (!concertDeleteTargetId) {
      return null;
    }

    return concerts.find((concert) => concert.id === concertDeleteTargetId) ?? null;
  }, [concertDeleteTargetId, concerts]);
  const filteredForumPosts = useMemo(() => {
    let posts = forumPosts.filter((post) => forumFilter === "Todas" || post.category === forumFilter);
    const q = forumSearch.trim().toLowerCase();
    if (q) posts = posts.filter((post) => `${post.title} ${post.body} ${post.author}`.toLowerCase().includes(q));
    return posts;
  }, [forumFilter, forumPosts, forumSearch]);
  const visibleForumPosts = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    let posts = filteredForumPosts;

    if (query.length > 0) {
      posts = posts.filter((post) =>
        `${post.title} ${post.body} ${post.author}`.toLowerCase().includes(query),
      );
    }

    if (forumSort === "top") return [...posts].sort((a, b) => b.upvotes - a.upvotes);
    if (forumSort === "new") return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // hot: score = upvotes * 2 + comments count
    return [...posts].sort((a, b) => (b.upvotes * 2 + b.comments.length) - (a.upvotes * 2 + a.comments.length));
  }, [filteredForumPosts, globalSearch, forumSort]);

  const purchaseStatusByCourse = useMemo(() => {
    const map = new Map<string, CoursePurchaseItem["status"]>();
    const sortedPurchases = [...coursePurchases].sort((a, b) =>
      (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
    );
    for (const purchase of sortedPurchases) {
      if (!map.has(purchase.courseId)) {
        map.set(purchase.courseId, purchase.status);
      }
    }
    return map;
  }, [coursePurchases]);
  const courseLevels = useMemo(() => {
    const uniqueLevels = new Map<string, string>();
    for (const rawLevel of courses.map((course) => course.level.trim())) {
      if (!rawLevel) {
        continue;
      }
      const normalized = rawLevel.toLowerCase();
      if (normalized === "todos") {
        continue;
      }
      if (!uniqueLevels.has(normalized)) {
        uniqueLevels.set(normalized, rawLevel);
      }
    }
    return ["Todos", ...Array.from(uniqueLevels.values())];
  }, [courses]);
  const courseTopics = useMemo(() => {
    const uniqueTopics = new Set<CourseTopic>();
    for (const course of courses) {
      uniqueTopics.add(getCourseTopic(course));
    }
    return ["Todos", ...Array.from(uniqueTopics)];
  }, [courses]);
  const courseOwnershipStats = useMemo(() => {
    const owned = courses.filter((course) => purchaseStatusByCourse.get(course.id) === "paid").length;
    return {
      owned,
      unowned: Math.max(courses.length - owned, 0),
    };
  }, [courses, purchaseStatusByCourse]);
  const visibleCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    const byFilter = courses.filter((course) => {
      const levelOk = courseLevelFilter === "Todos" || course.level === courseLevelFilter;
      const topic = getCourseTopic(course);
      const topicOk = courseTopicFilter === "Todos" || topic === courseTopicFilter;
      const ownership = purchaseStatusByCourse.get(course.id);
      const isOwned = ownership === "paid";
      const ownershipOk =
        courseOwnershipFilter === "all" ||
        (courseOwnershipFilter === "owned" ? isOwned : !isOwned);
      const costOk = matchesCourseCost(course.priceUsd, courseCostFilter);
      const durationHours = getCourseDurationHours(course);
      const durationOk =
        courseDurationFilter === "all" || getCourseDurationFilter(durationHours) === courseDurationFilter;
      const queryOk =
        query.length === 0 ||
        `${course.title} ${course.instructor} ${course.summary}`.toLowerCase().includes(query);
      return levelOk && topicOk && ownershipOk && costOk && durationOk && queryOk;
    });

    const sorted = [...byFilter].sort((left, right) => {
      if (courseSort === "price-asc") {
        return left.priceUsd - right.priceUsd;
      }
      if (courseSort === "price-desc") {
        return right.priceUsd - left.priceUsd;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return sorted;
  }, [
    courseCostFilter,
    courseDurationFilter,
    courseLevelFilter,
    courseOwnershipFilter,
    courseSearch,
    courseSort,
    courseTopicFilter,
    courses,
    purchaseStatusByCourse,
  ]);
  const featuredCourse = visibleCourses[0] ?? null;
  const courseAnalytics = useMemo(() => {
    const total = courses.length;
    const premiumCourses = courses.filter((course) => course.priceUsd > 1).length;
    const averageTicket = total > 0 ? courses.reduce((acc, course) => acc + course.priceUsd, 0) / total : 0;
    const completedSales = coursePurchases.filter((purchase) => purchase.status === "paid").length;
    const pendingSales = coursePurchases.filter((purchase) => purchase.status === "pending").length;
    return { total, premiumCourses, averageTicket, completedSales, pendingSales };
  }, [coursePurchases, courses]);

  useEffect(() => {
    const section = searchParams.get("section");

    if (!section) {
      return;
    }

    const validSectionIds: SectionId[] = ["band", "profile", "shows", "communities", "chats", "jobs", "courses"];

    if (validSectionIds.includes(section as SectionId)) {
      setActiveSection(section as SectionId);
    }
  }, [searchParams]);

  const handleCreateBand = async () => {
    const parsed = createBandSchema.safeParse({ name: newBandName });
    if (!parsed.success) {
      setBandError(
        parsed.error.flatten().fieldErrors.name?.[0] ??
          "Nombre de banda inválido.",
      );
      return;
    }

    setBandError(null);
    try {
      const res = await fetch("/api/band", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) { setBandError(data.message); return; }
      setBand(data.band);
      setBandBranding({
        name: data.band?.name ?? "",
        genre: "",
        bio: "",
        logoUrl: "",
        bannerUrl: "",
        bannerFit: "cover",
      });
      setShowCreateBand(false);
      setNewBandName("");
    } catch { setBandError("Error al crear la banda."); }
  };

  const handleRespondInvitation = async (invitationId: string, accept: boolean) => {
    const parsed = respondBandInvitationSchema.safeParse({ accept });
    if (!parsed.success) {
      return;
    }

    try {
      const res = await fetch(`/api/band/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) return;
      setIncomingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      if (accept) {
        // reload band
        const bandRes = await fetch("/api/band", { cache: "no-store" });
        const data = await bandRes.json();
        setBand(data.band ?? null);
        setIsSolo(data.isSolo ?? false);
      }
    } catch {}
  };

  const handleLeaveBand = async (action: "leave" | "disband") => {
    if (!band) return;

    const parsed = deleteBandSchema.safeParse({ action, bandId: band.id });
    if (!parsed.success) {
      return;
    }

    try {
      await fetch("/api/band", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setBand(null);
    } catch {}
  };

  const handleToggleSolo = async (solo: boolean) => {
    setIsSolo(solo);

    const parsed = updateSoloModeSchema.safeParse({ isSolo: solo });
    if (!parsed.success) {
      setIsSolo(!solo);
      return;
    }

    try {
      await fetch("/api/band", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } catch { setIsSolo(!solo); }
  };

  const uploadBandImage = async (file: File, kind: "band-logo" | "band-banner"): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/uploads/avatar", { method: "POST", body: fd });
    if (!res.ok) throw new Error("No se pudo subir la imagen.");
    const data = (await res.json()) as { url: string };
    return data.url;
  };

  const uploadConcertFlyer = async (file: File): Promise<string> => {
    const parsedUpload = avatarUploadSchema.safeParse({ file, kind: "concert-flyer" });
    if (!parsedUpload.success) {
      throw new Error(parsedUpload.error.flatten().fieldErrors.file?.[0] ?? "Flyer invalido.");
    }

    const formData = new FormData();
    formData.append("file", parsedUpload.data.file);
    formData.append("kind", parsedUpload.data.kind);

    const response = await fetch("/api/uploads/avatar", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          message?: string;
          url?: string;
        }
      | null;

    if (!response.ok || !payload?.url) {
      throw new Error(payload?.message ?? "No se pudo subir el flyer del concierto.");
    }

    return payload.url;
  };

  const handleSaveBandBranding = async () => {
    if (!band) return;
    setBandBrandingSaving(true);
    setBandBrandingMessage(null);
    try {
      const res = await fetch("/api/band", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandId: band.id,
          name: bandBranding.name.trim() || undefined,
          genre: bandBranding.genre.trim(),
          bio: bandBranding.bio.trim(),
          logoUrl: bandBranding.logoUrl,
          bannerUrl: bandBranding.bannerUrl,
          bannerFit: bandBranding.bannerFit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBandBrandingMessage({ type: "error", text: data.message ?? "Error al guardar." });
      } else {
        setBand((prev) => prev ? {
          ...prev,
          name: bandBranding.name || prev.name,
          genre: bandBranding.genre,
          bio: bandBranding.bio,
          logoUrl: bandBranding.logoUrl,
          bannerUrl: bandBranding.bannerUrl,
          bannerFit: bandBranding.bannerFit,
        } : prev);
        setBandBrandingMessage({ type: "success", text: "Perfil de banda guardado." });
      }
    } catch {
      setBandBrandingMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setBandBrandingSaving(false);
    }
  };

  const handleBandInviteSearch = async (q: string) => {
    setBandInviteQuery(q);
    if (q.trim().length < 2) { setBandInviteResults([]); return; }
    setBandInviteLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setBandInviteResults((data.users ?? []).filter((u: { id: string }) => u.id !== user?.id && !band?.members.some((m) => m.userId === u.id)));
    } catch {} finally { setBandInviteLoading(false); }
  };

  const handleSendBandInvite = async (userId: string) => {
    const parsed = sendBandInvitationSchema.safeParse({ userId });
    if (!parsed.success) {
      setBandError(
        parsed.error.flatten().fieldErrors.userId?.[0] ??
          "No se pudo enviar la invitación.",
      );
      return;
    }

    try {
      const res = await fetch("/api/band/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) { setBandError(data.message); return; }
      setSentInvitations((prev) => [...prev, data.invitation]);
      setBandInviteResults((prev) => prev.filter((u) => u.id !== userId));
    } catch { setBandError("No se pudo enviar la invitación."); }
  };

  const shouldFetchSectionData = (section: SectionId) => {
    if (section === "profile") {
      return false;
    }

    if (section === "band") {
      return isLoggedIn;
    }

    if (section === "chats") {
      return isLoggedIn;
    }

    return true;
  };

  const handleSectionChange = (section: SectionId) => {
    setActiveSectionError(null);
    setActiveSectionLoading(shouldFetchSectionData(section));
    setActiveSection(section);
    setNotificationsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const pushNotifications = useCallback((incoming: WorkspaceNotificationItem[]) => {
    if (incoming.length === 0) {
      return;
    }

    setNotifications((prev) => {
      const existing = new Set(prev.map((item) => item.id));
      const dedupedIncoming = incoming.filter((item) => !existing.has(item.id));

      if (dedupedIncoming.length === 0) {
        return prev;
      }

      return [...dedupedIncoming, ...prev].slice(0, 40);
    });
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationSelect = (notification: WorkspaceNotificationItem) => {
    setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    setNotificationsOpen(false);

    if (notification.kind === "chat" && notification.threadId) {
      handleSectionChange("chats");
      setPendingThreadToOpen(notification.threadId);
      setActiveThreadId(notification.threadId);
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== notification.threadId) {
            return thread;
          }

          return {
            ...thread,
            messages: thread.messages.map((message) =>
              message.sender === "them" ? { ...message, unread: false } : message,
            ),
          };
        }),
      );
      return;
    }

    if (notification.kind === "forum-comment" && notification.postId) {
      handleSectionChange("communities");
      setOpenPostId(notification.postId);
    }
  };

  // Load band data whenever band section is active (always refresh)
  useEffect(() => {
    if (activeSection !== "band") return;
    if (!isLoggedIn) {
      setActiveSectionLoading(false);
      setActiveSectionError(null);
      return;
    }

    let cancelled = false;
    setBandLoading(true);
    setActiveSectionLoading(true);
    setActiveSectionError(null);
    setBand(null);
    setIncomingInvitations([]);
    setSentInvitations([]);
    fetch("/api/band", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const loadedBand = data.band ?? null;
        setBand(loadedBand);
        if (loadedBand) {
          setBandBranding({
            name: loadedBand.name ?? "",
            genre: loadedBand.genre ?? "",
            bio: loadedBand.bio ?? "",
            logoUrl: loadedBand.logoUrl ?? "",
            bannerUrl: loadedBand.bannerUrl ?? "",
            bannerFit: loadedBand.bannerFit === "contain" ? "contain" : "cover",
          });
        }
        setIncomingInvitations(data.incomingInvitations ?? []);
        setSentInvitations(data.sentInvitations ?? []);
        setIsSolo(data.isSolo ?? false);
      })
      .catch(() => {
        if (!cancelled) {
          setActiveSectionError("No se pudo cargar la información de tu banda. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBandLoading(false);
          setActiveSectionLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [activeSection, isLoggedIn]);

  // Refresh section data every time a section is opened.
  useEffect(() => {
    if (activeSection === "band") {
      return;
    }

    if (activeSection === "profile") {
      setActiveSectionLoading(false);
      setActiveSectionError(null);
      return;
    }

    if ((activeSection === "chats") && !isLoggedIn) {
      setActiveSectionLoading(false);
      setActiveSectionError(null);
      return;
    }

    let cancelled = false;
    setActiveSectionLoading(true);
    setActiveSectionError(null);

    if (activeSection === "shows") {
      setConcerts([]);
    } else if (activeSection === "communities") {
      setForumPosts([]);
    } else if (activeSection === "jobs") {
      setJobs([]);
      setApplications({});
    } else if (activeSection === "courses") {
      setCourses([]);
      setCoursePurchases([]);
    } else if (activeSection === "chats") {
      setThreads([]);
      setActiveThreadId("");
    }

    const fetchSection = async () => {
      try {
        const response = await fetch(`/api/workspace?sections=${activeSection}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("section fetch failed");
        }
        const payload = (await response.json()) as WorkspaceResponse;
        if (cancelled) {
          return;
        }

        if (activeSection === "shows" && payload.concerts !== null) {
          setConcerts(dedupeConcertItems(payload.concerts));
        }

        if (activeSection === "communities" && payload.forumPosts !== null) {
          setForumPosts(mapForumPostsToUi(payload.forumPosts));
        }

        if (activeSection === "jobs" && payload.jobs !== null) {
          setJobs(
            payload.jobs.map((job) => ({
              id: job.id,
              title: job.title,
              type: job.type,
              city: job.city,
              image: job.imageUrl,
              pay: job.pay,
              summary: job.summary,
              description: job.description,
              requiresCv: job.requiresCv,
              requester: job.requesterName || undefined,
              requesterRole: job.requesterRole || undefined,
              requirements: job.requirements.length > 0 ? job.requirements : undefined,
              deadline: job.deadline || undefined,
            })),
          );
        }
        if (activeSection === "jobs") {
          setApplications(
            Object.fromEntries(
              (payload.jobApplications ?? []).map((application) => [application.jobId, "applied"]),
            ),
          );
        }


        if (activeSection === "courses") {
          if (payload.courses !== null) {
            setCourses(
              payload.courses.length > 0
                ? payload.courses.map((course) => ({
                    id: course.id,
                    title: course.title,
                    instructor: course.instructor,
                    instructorUserId: course.instructorUserId ?? null,
                    level: course.level,
                    imageUrl: course.imageUrl,
                    summary: course.summary,
                    priceUsd: course.priceUsd,
                    createdAt: course.createdAt,
                  }))
                : initialCourses,
            );
          }
          if (payload.coursePurchases !== null) {
            setCoursePurchases(
              payload.coursePurchases.map((purchase) => ({
                id: purchase.id,
                courseId: purchase.courseId,
                provider: purchase.provider,
                status: purchase.status,
                amountUsd: purchase.amountUsd,
                currency: purchase.currency,
                checkoutUrl: purchase.checkoutUrl,
                createdAt: purchase.createdAt,
                updatedAt: purchase.updatedAt,
              })),
            );
          }
        }

        if (activeSection === "chats" && payload.chatThreads !== null) {
          const mappedThreads = mapChatThreadsToUi(payload.chatThreads);
          setThreads(mappedThreads);
          setActiveThreadId((prev) =>
            prev && mappedThreads.some((thread) => thread.id === prev) ? prev : mappedThreads[0]?.id ?? "",
          );
        }

      } catch {
        if (cancelled) {
          return;
        }
        setActiveSectionError("No se pudieron cargar los datos de esta sección. Intenta de nuevo.");
      } finally {
        if (!cancelled) {
          setActiveSectionLoading(false);
        }
      }
    };

    void fetchSection();

    return () => {
      cancelled = true;
    };
  }, [activeSection, isLoggedIn]);

  useEffect(() => {
    if (activeSection !== "chats" || !isLoggedIn) {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const syncThreads = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;
      try {
        const response = await fetch("/api/chats/threads", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { threads?: ChatThreadApiRecord[] }
          | null;

        if (!response.ok || !payload?.threads || cancelled) {
          return;
        }

        const mappedThreads = mapChatThreadsToUi(payload.threads);

        setThreads((prev) => mergeChatThreadsKeepingOptimisticState(prev, mappedThreads));
        setActiveThreadId((prev) => {
          if (prev && mappedThreads.some((thread) => thread.id === prev)) {
            return prev;
          }
          return mappedThreads[0]?.id ?? "";
        });
      } catch {
        // Keep local chat state if sync request fails.
      } finally {
        inFlight = false;
      }
    };

    void syncThreads();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncThreads();
      }
    }, 2500);

    const handleFocus = () => {
      void syncThreads();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncThreads();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeSection, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const syncNotifications = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;
      try {
        const [chatResponse, communitiesResponse] = await Promise.all([
          fetch("/api/chats/threads", { cache: "no-store" }),
          fetch("/api/workspace?sections=communities", { cache: "no-store" }),
        ]);

        if (cancelled) {
          return;
        }

        if (chatResponse.ok) {
          const chatPayload = (await chatResponse.json().catch(() => null)) as
            | { threads?: ChatThreadApiRecord[] }
            | null;

          if (chatPayload?.threads) {
            const mappedThreads = mapChatThreadsToUi(chatPayload.threads);

            if (activeSection !== "chats") {
              setThreads((prev) => mergeChatThreadsKeepingOptimisticState(prev, mappedThreads));
              setActiveThreadId((prev) => {
                if (prev && mappedThreads.some((thread) => thread.id === prev)) {
                  return prev;
                }
                return mappedThreads[0]?.id ?? "";
              });
            }

            const unseenChatNotifications: WorkspaceNotificationItem[] = [];
            for (const thread of mappedThreads) {
              const contactName = thread.isGroup
                ? thread.groupName || "Grupo"
                : thread.contact || "Chat";

              for (const message of thread.messages) {
                if (message.sender !== "them" || !message.unread) {
                  continue;
                }

                if (seenChatMessageIdsRef.current.has(message.id)) {
                  continue;
                }

                seenChatMessageIdsRef.current.add(message.id);

                if (!seededChatNotificationsRef.current || activeSection === "chats") {
                  continue;
                }

                unseenChatNotifications.push({
                  id: `chat-${message.id}`,
                  kind: "chat",
                  title: `Nuevo mensaje de ${contactName}`,
                  body: toNotificationPreview(message.text),
                  at: message.at,
                  threadId: thread.id,
                });
              }
            }

            if (!seededChatNotificationsRef.current) {
              seededChatNotificationsRef.current = true;
            } else {
              pushNotifications(unseenChatNotifications);
            }
          }
        }

        if (communitiesResponse.ok) {
          const communitiesPayload = (await communitiesResponse.json().catch(() => null)) as WorkspaceResponse | null;

          if (communitiesPayload && communitiesPayload.forumPosts !== null) {
            const mappedForumPosts = mapForumPostsToUi(communitiesPayload.forumPosts);

            if (activeSection !== "communities") {
              setForumPosts(mappedForumPosts);
            }

            const unseenForumNotifications: WorkspaceNotificationItem[] = [];

            for (const post of mappedForumPosts) {
              if (post.authorUserId !== user.id) {
                continue;
              }

              for (const comment of post.comments) {
                if (comment.authorUserId === user.id) {
                  seenForumCommentIdsRef.current.add(comment.id);
                  continue;
                }

                if (seenForumCommentIdsRef.current.has(comment.id)) {
                  continue;
                }

                seenForumCommentIdsRef.current.add(comment.id);

                if (!seededForumNotificationsRef.current || activeSection === "communities") {
                  continue;
                }

                unseenForumNotifications.push({
                  id: `forum-comment-${comment.id}`,
                  kind: "forum-comment",
                  title: `Nuevo comentario en: ${toNotificationPreview(post.title, 44)}`,
                  body: toNotificationPreview(`${comment.author}: ${comment.text}`),
                  at: comment.createdAt,
                  postId: post.id,
                });
              }
            }

            if (!seededForumNotificationsRef.current) {
              seededForumNotificationsRef.current = true;
            } else {
              pushNotifications(unseenForumNotifications);
            }
          }
        }
      } catch {
        // Keep local state if notification sync fails.
      } finally {
        inFlight = false;
      }
    };

    void syncNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncNotifications();
      }
    }, 3500);

    const handleFocus = () => {
      void syncNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeSection, isLoggedIn, pushNotifications, user?.id]);

  useEffect(() => {
    if (activeSection !== "chats" || !pendingThreadToOpen) {
      return;
    }

    const hasThread = threads.some((thread) => thread.id === pendingThreadToOpen);
    if (!hasThread) {
      return;
    }

    setActiveThreadId(pendingThreadToOpen);
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== pendingThreadToOpen) {
          return thread;
        }

        return {
          ...thread,
          messages: thread.messages.map((message) =>
            message.sender === "them" ? { ...message, unread: false } : message,
          ),
        };
      }),
    );

    if (isLoggedIn) {
      fetch(`/api/chats/threads/${pendingThreadToOpen}/read`, { method: "POST" }).catch(() => {
        // ignore mark read error
      });
    }

    setPendingThreadToOpen(null);
  }, [activeSection, isLoggedIn, pendingThreadToOpen, threads]);

  const upsertCoursePurchase = (purchase: CoursePurchaseItem) => {
    setCoursePurchases((prev) => [purchase, ...prev.filter((item) => item.id !== purchase.id)]);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const paymentResult = searchParams.get("payment");
    if (!paymentResult) {
      return;
    }

    const provider = searchParams.get("provider");
    const purchaseId = searchParams.get("purchase_id");
    const sessionId = searchParams.get("session_id");
    const normalizedProvider = provider === "paypal" ? "paypal" : "stripe";

    const clearPaymentQuery = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("payment");
      params.delete("provider");
      params.delete("purchase_id");
      params.delete("session_id");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    if (paymentResult === "cancel") {
      setCourseError("Pago cancelado. Puedes intentar nuevamente.");
      setCourseSuccess(null);
      clearPaymentQuery();
      return;
    }

    if (paymentResult !== "success" || !purchaseId) {
      clearPaymentQuery();
      return;
    }

    let cancelled = false;
    const providerLabel = normalizedProvider === "stripe" ? "Stripe" : "PayPal";

    const confirmCoursePayment = async () => {
      try {
        const parsed = confirmCourseCheckoutSchema.safeParse({
          purchaseId,
          provider: normalizedProvider,
          sessionId: normalizedProvider === "stripe" ? sessionId : undefined,
        });

        if (!parsed.success) {
          setCourseError("Parametros de confirmacion invalidos.");
          setCourseSuccess(null);
          clearPaymentQuery();
          return;
        }

        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              message?: string;
              purchase?: {
                id: string;
                courseId: string;
                provider: "paypal" | "stripe";
                status: "pending" | "paid" | "failed";
                amountUsd: number;
                currency: string;
                checkoutUrl: string;
                createdAt: string;
                updatedAt: string;
              };
            }
          | null;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload) {
          setCourseError(payload?.message ?? `No se pudo confirmar la compra en ${providerLabel}.`);
          setCourseSuccess(null);
          clearPaymentQuery();
          return;
        }

        if (payload.purchase) {
          upsertCoursePurchase({
            id: payload.purchase.id,
            courseId: payload.purchase.courseId,
            provider: payload.purchase.provider,
            status: payload.purchase.status,
            amountUsd: payload.purchase.amountUsd,
            currency: payload.purchase.currency,
            checkoutUrl: payload.purchase.checkoutUrl,
            createdAt: payload.purchase.createdAt,
            updatedAt: payload.purchase.updatedAt,
          });
        }

        if (payload.purchase?.status === "paid") {
          setCourseSuccess("Pago confirmado. Ya tienes acceso al curso comprado.");
          setCourseError(null);
        } else {
          setCourseError(payload.message ?? `El pago aun no se confirma en ${providerLabel}.`);
          setCourseSuccess(null);
        }
      } catch {
        if (!cancelled) {
          setCourseError(`No se pudo confirmar la compra en ${providerLabel}.`);
          setCourseSuccess(null);
        }
      } finally {
        if (!cancelled) {
          clearPaymentQuery();
        }
      }
    };

    void confirmCoursePayment();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, pathname, router, searchParams]);

  useEffect(() => {
    if (!selectedCoursePreview) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCoursePreview]);

  useEffect(() => {
    let isMounted = true;

    const applyPayload = (payload: WorkspaceResponse, sections: string[]) => {
      if (!isMounted) return;

      if ((sections.includes("band") || sections.includes("shows")) && payload.concerts !== null) {
        setConcerts(dedupeConcertItems(payload.concerts));
      }
      if (sections.includes("communities") && payload.forumPosts !== null) {
        setForumPosts(mapForumPostsToUi(payload.forumPosts));
      }
      if (sections.includes("jobs") && payload.jobs !== null) {
        setJobs(
          payload.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            type: job.type,
            city: job.city,
            image: job.imageUrl,
            pay: job.pay,
            summary: job.summary,
            description: job.description,
            requiresCv: job.requiresCv,
            requester: job.requesterName || undefined,
            requesterRole: job.requesterRole || undefined,
            requirements: job.requirements.length > 0 ? job.requirements : undefined,
            deadline: job.deadline || undefined,
          })),
        );
      }
      if (sections.includes("jobs") && payload.jobApplications !== null) {
        setApplications(
          Object.fromEntries(payload.jobApplications.map((application) => [application.jobId, "applied"])),
        );
      }
      if (sections.includes("courses") && payload.courses !== null) {
        setCourses(
          payload.courses.length > 0
            ? payload.courses.map((course) => ({
                id: course.id,
                title: course.title,
                instructor: course.instructor,
                instructorUserId: course.instructorUserId ?? null,
                level: course.level,
                imageUrl: course.imageUrl,
                summary: course.summary,
                priceUsd: course.priceUsd,
                createdAt: course.createdAt,
              }))
            : initialCourses,
        );
      }
      if (sections.includes("courses") && payload.coursePurchases !== null) {
        setCoursePurchases(
          payload.coursePurchases.map((purchase) => ({
            id: purchase.id,
            courseId: purchase.courseId,
            provider: purchase.provider,
            status: purchase.status,
            amountUsd: purchase.amountUsd,
            currency: purchase.currency,
            checkoutUrl: purchase.checkoutUrl,
            createdAt: purchase.createdAt,
            updatedAt: purchase.updatedAt,
          })),
        );
      }
      if (sections.includes("chats") && payload.chatThreads !== null) {
        const mappedThreads = mapChatThreadsToUi(payload.chatThreads);
        setThreads(mappedThreads);
        setActiveThreadId((prev) =>
          prev && mappedThreads.some((thread) => thread.id === prev) ? prev : mappedThreads[0]?.id ?? "",
        );
      }
    };

    const loadSection = async (sections: string[]) => {
      try {
        const response = await fetch(`/api/workspace?sections=${sections.join(",")}`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as WorkspaceResponse;
        applyPayload(payload, sections);
      } catch {
        // keep local fallback data
      }
    };

    // Load the initial section on mount
    loadSection(["band"]).finally(() => {
      if (isMounted) setIsWorkspaceLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePublishConcert = async () => {
    if (!isLoggedIn) {
      setConcertFormError("Debes iniciar sesion para publicar conciertos.");
      return;
    }

    if (concertPublishing || concertFlyerUploading) {
      return;
    }

    const draft: ConcertFormState = {
      ...concertForm,
      date: concertForm.date.trim(),
    };
    const fieldErrors = getConcertFormFieldErrors(draft);
    setConcertFormFieldErrors(fieldErrors);
    const parsed = createConcertSchema.safeParse(draft);

    if (!parsed.success) {
      const firstError = Object.values(fieldErrors)[0] ?? "Revisa los campos del concierto.";
      setConcertFormError(firstError);
      return;
    }

    setConcertPublishing(true);
    setConcertFormError(null);

    try {
      const response = await fetch("/api/concerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            concert?: ConcertItem;
            errors?: Record<string, string[]>;
          }
        | null;

      if (!response.ok || !payload?.concert) {
        setConcertFormError(payload?.message ?? "No se pudo publicar el concierto.");
        return;
      }

      try {
        const concertsResponse = await fetch("/api/concerts", { cache: "no-store" });
        const concertsPayload = (await concertsResponse.json().catch(() => null)) as
          | { concerts?: ConcertItem[] }
          | null;

        if (concertsResponse.ok && Array.isArray(concertsPayload?.concerts)) {
          setConcerts(dedupeConcertItems(concertsPayload.concerts));
        } else {
          setConcerts((prev) => dedupeConcertItems([payload.concert as ConcertItem, ...prev]));
        }
      } catch {
        setConcerts((prev) => dedupeConcertItems([payload.concert as ConcertItem, ...prev]));
      }

      setConcertForm({
        title: "",
        date: "",
        venue: "",
        city: "",
        flyerUrl: "",
        ticketUrl: "",
        capacity: "",
      });
      setConcertFormFieldErrors({});
      setShowConcertCompose(false);
      setConcertFormError(null);
    } catch {
      setConcertFormError("No se pudo publicar el concierto.");
      return;
    } finally {
      setConcertPublishing(false);
    }
  };

  const startCourseCheckout = async (courseId: string, provider: "stripe" | "paypal") => {
    if (!isLoggedIn) {
      setCourseError("Debes iniciar sesion para comprar cursos.");
      setCourseSuccess(null);
      return;
    }

    const parsed = createCourseCheckoutSchema.safeParse({ courseId, provider });
    if (!parsed.success) {
      setCourseError("Solicitud de pago invalida.");
      setCourseSuccess(null);
      return;
    }

    const purchaseStatus = purchaseStatusByCourse.get(courseId);
    if (purchaseStatus === "paid") {
      const paidCourse = courses.find((course) => course.id === courseId);
      if (paidCourse) {
        await openCourseContent(paidCourse);
      }
      return;
    }

    if (provider === "paypal") {
      const selectedCourse = courses.find((course) => course.id === courseId);
      const amountSuffix = selectedCourse ? `/${selectedCourse.priceUsd.toFixed(2)}` : "";
      const paypalUrl = `${paypalMeCheckoutBaseUrl}${amountSuffix}`;

      setCourseError(null);
      setCourseSuccess(
        selectedCourse
          ? `Abrimos PayPal para pagar USD ${selectedCourse.priceUsd.toFixed(2)}.`
          : "Abrimos PayPal para completar el pago.",
      );

      window.location.href = paypalUrl;
      return;
    }

    setPurchaseLoading(courseId);
    setCourseError(null);
    setCourseSuccess(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            checkoutUrl?: string;
            purchase?: CoursePurchaseItem;
          }
        | null;

      if (!response.ok || !payload?.checkoutUrl) {
        setCourseError(payload?.message ?? "No se pudo iniciar el checkout.");
        setCourseSuccess(null);
        setPurchaseLoading(null);
        return;
      }

      if (payload.purchase) {
        upsertCoursePurchase(payload.purchase as CoursePurchaseItem);
      }

      window.location.href = payload.checkoutUrl;
    } catch {
      setCourseError("No se pudo iniciar el checkout.");
      setPurchaseLoading(null);
    }
  };

  const openCourseContent = async (course: CourseItem) => {
    if (!isLoggedIn) {
      setCourseError("Debes iniciar sesion para acceder al contenido del curso.");
      setCourseSuccess(null);
      return;
    }

    const purchaseStatus = purchaseStatusByCourse.get(course.id);
    if (purchaseStatus !== "paid") {
      setCourseError("Este curso aun no esta desbloqueado para tu usuario.");
      setCourseSuccess(null);
      return;
    }

    setCourseContentLoading(course.id);
    setCourseContentError(null);
    setCourseError(null);

    try {
      const response = await fetch(`/api/courses/${course.id}/content`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            course?: CourseItem;
            modules?: CourseModuleItem[];
          }
        | null;

      if (!response.ok || !payload?.course || !payload.modules) {
        setCourseContentError(payload?.message ?? "No se pudo cargar el contenido del curso.");
        setSelectedCourseContent(null);
        return;
      }

      setSelectedCourseContent({
        course: payload.course,
        modules: payload.modules,
      });
    } catch {
      setCourseContentError("No se pudo cargar el contenido del curso.");
      setSelectedCourseContent(null);
    } finally {
      setCourseContentLoading(null);
    }
  };

  const moveConcertToNextStatus = async (concertId: string) => {
    const target = concerts.find((concert) => concert.id === concertId);

    if (!target) {
      return;
    }

    if (!isLoggedIn || !user || target.userId !== user.id) {
      return;
    }

    const index = statusOrder.indexOf(target.status);
    const nextStatus = statusOrder[(index + 1) % statusOrder.length];
    const parsed = updateConcertStatusSchema.safeParse({ status: nextStatus });

    if (!parsed.success) {
      return;
    }

    try {
      const response = await fetch(`/api/concerts/${concertId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { concert?: ConcertItem }
        | null;

      if (!response.ok || !payload?.concert) {
        return;
      }

      setConcerts((prev) =>
        dedupeConcertItems(
          prev.map((concert) => (concert.id === concertId ? (payload.concert as ConcertItem) : concert)),
        ),
      );
    } catch {
      // ignore status update error
    }
  };

  const deleteOwnedConcert = async (concertId: string) => {
    const target = concerts.find((concert) => concert.id === concertId);

    if (!target) {
      setConcertDeleteTargetId(null);
      return;
    }

    if (!isLoggedIn || !user || target.userId !== user.id || deletingConcertId !== null) {
      return;
    }

    setDeletingConcertId(concertId);
    setConcertDeleteError(null);

    try {
      const response = await fetch(`/api/concerts/${concertId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setConcertDeleteError(payload?.message ?? "No se pudo eliminar el concierto.");
        return;
      }

      setConcerts((prev) => prev.filter((concert) => concert.id !== concertId));
      setConcertDeleteTargetId(null);
      setConcertDeleteError(null);
    } catch {
      setConcertDeleteError("No se pudo eliminar el concierto.");
    } finally {
      setDeletingConcertId((prev) => (prev === concertId ? null : prev));
    }
  };

  const openConcertDeleteModal = (concertId: string) => {
    const target = concerts.find((concert) => concert.id === concertId);

    if (!target) {
      return;
    }

    if (!isLoggedIn || !user || target.userId !== user.id || deletingConcertId !== null) {
      return;
    }

    setConcertDeleteError(null);
    setConcertDeleteTargetId(concertId);
  };

  const closeConcertDeleteModal = () => {
    if (deletingConcertId !== null) {
      return;
    }

    setConcertDeleteTargetId(null);
    setConcertDeleteError(null);
  };

  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) {
          return thread;
        }

        return {
          ...thread,
          messages: thread.messages.map((message) =>
            message.sender === "them" ? { ...message, unread: false } : message,
          ),
        };
      }),
    );

    if (!isLoggedIn) {
      return;
    }

    try {
      await fetch(`/api/chats/threads/${threadId}/read`, {
        method: "POST",
      });
    } catch {
      // ignore mark read error
    }
  };

  const sendMessage = async () => {
    const parsedMessage = createChatMessageSchema.safeParse({ text: messageDraft });

    if (!isLoggedIn || !activeThread || !parsedMessage.success) {
      return;
    }

    const text = parsedMessage.data.text;

    // Optimistic update: show message immediately with "sending" status
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
    const threadId = activeThread.id;

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;
        return {
          ...thread,
          messages: [
            ...thread.messages,
            { id: tempId, sender: "me", text, at: now, status: "sending" },
          ],
        };
      }),
    );
    setMessageDraft("");

    try {
      const response = await fetch(`/api/chats/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedMessage.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { sent?: { id: string; senderType: "me" | "them"; text: string; createdAt: string } }
        | null;

      if (!response.ok || !payload?.sent) {
        // Mark as error
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.id !== threadId) return thread;
            return {
              ...thread,
              messages: thread.messages.map((m) =>
                m.id === tempId ? { ...m, status: "error" as const } : m,
              ),
            };
          }),
        );
        return;
      }

      // Replace temp message with confirmed one
      const sent = payload.sent;
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          return {
            ...thread,
            messages: thread.messages.map((m) =>
              m.id === tempId
                ? { id: sent.id, sender: sent.senderType, text: sent.text, at: formatRelativeTime(sent.createdAt), status: "sent" as const }
                : m,
            ),
          };
        }),
      );
    } catch {
      // Network error → mark as error
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          return {
            ...thread,
            messages: thread.messages.map((m) =>
              m.id === tempId ? { ...m, status: "error" as const } : m,
            ),
          };
        }),
      );
    }
  };

  const createGroupThread = async () => {
    const parsedGroup = createGroupChatSchema.safeParse({
      groupName: newGroupName,
      memberUserIds: selectedGroupMembers.map((m) => m.id),
    });
    if (!parsedGroup.success || groupCreating) return;

    const name = parsedGroup.data.groupName;

    setGroupCreating(true);
    try {
      if (isLoggedIn) {
        const response = await fetch("/api/chats/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedGroup.data),
        });
        const payload = (await response.json().catch(() => null)) as {
          thread?: {
            id: string; groupName: string; memberIds: string[];
            contactName: string; contactRole: string; contactAvatar: string;
            contactUserId: string | null; isGroup: boolean;
          };
        } | null;

        if (response.ok && payload?.thread) {
          const t = payload.thread;
          const newThread: ChatThread = {
            id: t.id,
            contact: t.contactName,
            role: t.contactRole,
            avatar: t.contactAvatar,
            contactUserId: t.contactUserId ?? null,
            isGroup: true,
            groupName: t.groupName,
            memberIds: t.memberIds,
            messages: [],
          };
          setThreads((prev) => [newThread, ...prev]);
          setActiveThreadId(newThread.id);
        }
      } else {
        // Offline fallback
        const newThread: ChatThread = {
          id: `group-${Date.now()}`,
          contact: "", role: "", avatar: "",
          contactUserId: null,
          isGroup: true,
          groupName: name,
          memberIds: parsedGroup.data.memberUserIds,
          messages: [],
        };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
      }
    } catch {
      // ignore
    } finally {
      setGroupCreating(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);
      setGroupMemberQuery("");
      setGroupMemberResults([]);
      setShowNewGroupForm(false);
    }
  };

  const searchUsersForChat = async (query: string, forGroup = false) => {
    if (query.trim().length < 1) {
      if (forGroup) setGroupMemberResults([]);
      else setUserSearchResults([]);
      return;
    }
    if (forGroup) {
      setGroupMemberResults([]);
    } else {
      setUserSearchLoading(true);
      setUserSearchResults([]);
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return;
      const data = (await res.json()) as { users?: Array<{ id: string; name: string; email: string; musicianType: string; primaryInstrument: string; avatarUrl: string }> };
      if (forGroup) {
        setGroupMemberResults((data.users ?? []).map((u) => ({ id: u.id, name: u.name, email: u.email, primaryInstrument: u.primaryInstrument, avatarUrl: u.avatarUrl ?? "" })));
      } else {
        setUserSearchResults(data.users ?? []);
      }
    } catch {
      // ignore
    } finally {
      if (!forGroup) setUserSearchLoading(false);
    }
  };

  const handleNewDirectChat = async (contactUserId: string) => {
    setShowNewChatPanel(false);
    setUserSearchQuery("");
    setUserSearchResults([]);

    const parsedDirect = createDirectChatThreadSchema.safeParse({ contactUserId });
    if (!parsedDirect.success) {
      return;
    }

    // Check if thread already exists locally
    const existing = threads.find((t) => !t.isGroup && t.contactUserId === contactUserId);
    if (existing) {
      setActiveThreadId(existing.id);
      return;
    }

    if (!isLoggedIn) return;

    try {
      const res = await fetch("/api/chats/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedDirect.data),
      });
      const payload = (await res.json().catch(() => null)) as {
        thread?: {
          id: string; contactName: string; contactRole: string;
          contactAvatar: string; contactUserId: string | null;
          isGroup: boolean; groupName: string; memberIds: string[];
          messages: Array<{ id: string; senderType: string; text: string; isUnread: boolean; createdAt: string }>;
        };
      } | null;

      if (res.ok && payload?.thread) {
        const t = payload.thread;
        const newThread: ChatThread = {
          id: t.id,
          contact: t.contactName,
          role: t.contactRole,
          avatar: t.contactAvatar,
          contactUserId: t.contactUserId ?? null,
          isGroup: false,
          groupName: "",
          memberIds: [],
          messages: t.messages.map((m) => ({
            id: m.id,
            sender: m.senderType as "me" | "them",
            text: m.text,
            at: formatRelativeTime(m.createdAt),
            unread: m.isUnread,
          })),
        };
        setThreads((prev) => {
          const alreadyExists = prev.some((p) => p.id === newThread.id);
          return alreadyExists ? prev : [newThread, ...prev];
        });
        setActiveThreadId(newThread.id);
      }
    } catch {
      // ignore
    }
  };

  const applyToJob = async (jobId: string, file?: File | null) => {
    if (!isLoggedIn) return;

    const parsedJob = applyJobSchema.safeParse({ jobId });
    if (!parsedJob.success) {
      setApplyError("Solicitud inválida.");
      return;
    }

    setIsApplying(true);
    setApplyError(null);

    try {
      let response: Response;
      if (file) {
        const parsedFormData = applyJobFormDataSchema.safeParse({
          jobId: parsedJob.data.jobId,
          cv: file,
        });

        if (!parsedFormData.success) {
          const fieldErrors = parsedFormData.error.flatten().fieldErrors;
          setApplyError(fieldErrors.cv?.[0] ?? fieldErrors.jobId?.[0] ?? "Solicitud inválida.");
          return;
        }

        const fd = new FormData();
        fd.append("jobId", parsedFormData.data.jobId);
        if (parsedFormData.data.cv) {
          fd.append("cv", parsedFormData.data.cv);
        }
        response = await fetch("/api/jobs/applications", { method: "POST", body: fd });
      } else {
        response = await fetch("/api/jobs/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedJob.data),
        });
      }

      if (!response.ok) {
        setApplyError("No se pudo enviar la postulacion. Intenta de nuevo.");
        return;
      }

      setApplications((prev) => ({ ...prev, [jobId]: "applied" }));
      setCvFile(null);
      setSelectedJob(null);
    } catch {
      setApplyError("Error de conexion. Intenta de nuevo.");
    } finally {
      setIsApplying(false);
    }
  };

  const uploadForumAsset = async (
    file: File,
  ): Promise<{ url: string; mediaType: "image" | "video" | "audio" }> => {
    const parsedUpload = forumUploadSchema.safeParse({ file });
    if (!parsedUpload.success) {
      throw new Error(parsedUpload.error.flatten().fieldErrors.file?.[0] ?? "Archivo invalido.");
    }

    const formData = new FormData();
    formData.append("file", parsedUpload.data.file);

    const response = await fetch("/api/uploads/forum", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          message?: string;
          url?: string;
          mediaType?: "image" | "video" | "audio";
        }
      | null;

    if (!response.ok || !payload?.url || !payload.mediaType) {
      throw new Error(payload?.message ?? "No se pudo subir el archivo del post.");
    }

    return { url: payload.url, mediaType: payload.mediaType };
  };

  const adminDeleteForumPost = (postId: string) => {
    if (!isAdmin) return;
    setAdminDeleteError(null);
    setAdminDeleteTarget({ kind: "forum-post", postId });
  };

  const adminDeleteForumComment = (postId: string, commentId: string) => {
    if (!isAdmin) return;
    setAdminDeleteError(null);
    setAdminDeleteTarget({ kind: "forum-comment", postId, commentId });
  };

  const adminDeleteJob = (jobId: string) => {
    if (!isAdmin) return;
    setAdminDeleteError(null);
    setAdminDeleteTarget({ kind: "job", jobId });
  };

  const adminDeleteCourse = (courseId: string) => {
    if (!isAdmin) return;
    setAdminDeleteError(null);
    setAdminDeleteTarget({ kind: "course", courseId });
  };

  const closeAdminDeleteModal = () => {
    if (adminDeletePending) {
      return;
    }
    setAdminDeleteTarget(null);
    setAdminDeleteError(null);
  };

  const confirmAdminDelete = async () => {
    if (!isAdmin || !adminDeleteTarget || adminDeletePending) {
      return;
    }

    setAdminDeletePending(true);
    setAdminDeleteError(null);
    try {
      if (adminDeleteTarget.kind === "forum-post") {
        const res = await fetch(`/api/forum/posts/${adminDeleteTarget.postId}`, { method: "DELETE" });
        if (!res.ok) {
          setAdminDeleteError("No se pudo eliminar el post.");
          return;
        }
        setForumPosts((prev) => prev.filter((p) => p.id !== adminDeleteTarget.postId));
        if (openPostId === adminDeleteTarget.postId) {
          setOpenPostId(null);
        }
        setAdminDeleteTarget(null);
        return;
      }

      if (adminDeleteTarget.kind === "forum-comment") {
        const res = await fetch(`/api/forum/comments/${adminDeleteTarget.commentId}`, { method: "DELETE" });
        if (!res.ok) {
          setAdminDeleteError("No se pudo eliminar el comentario.");
          return;
        }
        setForumPosts((prev) =>
          prev.map((p) =>
            p.id === adminDeleteTarget.postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== adminDeleteTarget.commentId) }
              : p,
          ),
        );
        setAdminDeleteTarget(null);
        return;
      }

      if (adminDeleteTarget.kind === "job") {
        const res = await fetch(`/api/jobs/${adminDeleteTarget.jobId}`, { method: "DELETE" });
        if (!res.ok) {
          setAdminDeleteError("No se pudo eliminar la oportunidad.");
          return;
        }
        setJobs((prev) => prev.filter((j) => j.id !== adminDeleteTarget.jobId));
        if (selectedJob?.id === adminDeleteTarget.jobId) {
          setSelectedJob(null);
        }
        setAdminDeleteTarget(null);
        return;
      }

      const res = await fetch(`/api/courses/${adminDeleteTarget.courseId}`, { method: "DELETE" });
      if (!res.ok) {
        setAdminDeleteError("No se pudo eliminar el curso.");
        return;
      }
      setCourses((prev) => prev.filter((c) => c.id !== adminDeleteTarget.courseId));
      setCourseError(null);
      setCourseSuccess("Curso eliminado");
      setAdminDeleteTarget(null);
    } catch {
      setAdminDeleteError("No se pudo completar la eliminacion. Intenta de nuevo.");
    } finally {
      setAdminDeletePending(false);
    }
  };

  const publishForumPost = async () => {
    if (forumPublishing) {
      return;
    }

    if (!isLoggedIn) {
      setForumError("Debes iniciar sesion para publicar en el foro.");
      return;
    }

    const title = forumDraft.title.trim();
    const body = forumDraft.body.trim();
    let mediaType = forumDraft.mediaType;
    let mediaUrl = forumDraft.mediaUrl.trim();
    const linkUrl = forumDraft.linkUrl.trim();

    setForumPublishing(true);

    try {
      if (forumFile) {
        const uploaded = await uploadForumAsset(forumFile);
        mediaType = uploaded.mediaType;
        mediaUrl = uploaded.url;
      }

      const parsedPost = createForumPostSchema.safeParse({
        title,
        body,
        category: forumDraft.category,
        mediaType,
        mediaUrl,
        linkUrl,
      });

      if (!parsedPost.success) {
        const fieldErrors = parsedPost.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors).flat()[0] ?? "Revisa los campos del post.";
        setForumError(firstError);
        return;
      }

      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPost.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            post?: {
              id: string;
              authorUserId: string | null;
              authorName: string;
              authorAvatarUrl?: string;
              title: string;
              body: string;
              category: ForumCategory;
              mediaType: "none" | "image" | "video" | "audio";
              mediaUrl: string;
              linkUrl: string;
              upvotes: number;
              createdAt: string;
              comments: Array<{
                id: string;
                authorUserId: string | null;
                authorName: string;
                authorAvatarUrl?: string;
                text: string;
                createdAt: string;
              }>;
            };
          }
        | null;

      if (!response.ok || !payload?.post) {
        setForumError(payload?.message ?? "No se pudo publicar el hilo.");
        return;
      }

      const post = payload.post;

      setForumPosts((prev) => [
        {
          id: post.id,
          authorUserId: post.authorUserId ?? null,
          author: post.authorName,
          authorAvatarUrl: post.authorAvatarUrl ?? "",
          title: post.title,
          body: post.body,
          category: post.category,
          mediaType: post.mediaType ?? "none",
          mediaUrl: post.mediaUrl ?? "",
          linkUrl: post.linkUrl ?? "",
          upvotes: post.upvotes,
          createdAt: formatRelativeTime(post.createdAt),
          comments: post.comments.map((comment) => ({
            id: comment.id,
            authorUserId: comment.authorUserId ?? null,
            author: comment.authorName,
            authorAvatarUrl: comment.authorAvatarUrl ?? "",
            text: comment.text,
            createdAt: formatRelativeTime(comment.createdAt),
          })),
        },
        ...prev,
      ]);
    } catch {
      setForumError("No se pudo publicar el hilo.");
      return;
    } finally {
      setForumPublishing(false);
    }
    setForumDraft({
      title: "",
      body: "",
      category: "General",
      mediaType: "none",
      mediaUrl: "",
      linkUrl: "",
    });
    setForumFile(null);
    setForumError(null);
  };

  const voteForumPost = (postId: string, direction: "up" | "down") => {
    const parsedVote = forumVoteSchema.safeParse({ direction });
    if (!parsedVote.success) {
      return;
    }

    const requestedDirection = parsedVote.data.direction;
    const current = userVotes[postId];
    // Determine api direction and optimistic delta
    let apiDirection: "up" | "down";
    let delta: number;

    if (current === requestedDirection) {
      // Same direction → unvote (cancel by sending opposite)
      apiDirection = requestedDirection === "up" ? "down" : "up";
      delta = requestedDirection === "up" ? -1 : 1;
      setUserVotes((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } else if (current !== undefined) {
      // Switch direction
      apiDirection = requestedDirection;
      delta = requestedDirection === "up" ? 2 : -2;
      setUserVotes((prev) => ({ ...prev, [postId]: requestedDirection }));
    } else {
      // New vote
      apiDirection = requestedDirection;
      delta = requestedDirection === "up" ? 1 : -1;
      setUserVotes((prev) => ({ ...prev, [postId]: requestedDirection }));
    }

    // Optimistic update
    setForumPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, upvotes: p.upvotes + delta } : p),
    );

    // Fire & forget — we already updated optimistically
    fetch(`/api/forum/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: apiDirection }),
    }).catch(() => {
      // Revert optimistic update on error
      setForumPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, upvotes: p.upvotes - delta } : p),
      );
    });
  };

  const addForumComment = async (postId: string) => {
    const parsedComment = createForumCommentSchema.safeParse({
      text: commentDrafts[postId] ?? "",
    });

    if (!isLoggedIn || !parsedComment.success) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedComment.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            comment?: {
              id: string;
              authorUserId: string | null;
              authorName: string;
              authorAvatarUrl?: string;
              text: string;
              createdAt: string;
            };
          }
        | null;

      if (!response.ok || !payload?.comment) {
        return;
      }

      const comment = payload.comment;

      setForumPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  {
                    id: comment.id,
                    authorUserId: comment.authorUserId ?? null,
                    author: comment.authorName,
                    authorAvatarUrl: comment.authorAvatarUrl ?? "",
                    text: comment.text,
                    createdAt: formatRelativeTime(comment.createdAt),
                  },
                ],
              }
            : post,
        ),
      );
    } catch {
      return;
    }

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <main className="rh-app-shell relative min-h-screen overflow-x-hidden bg-[var(--ui-bg)]" data-active-title={active.heading}>
      <header className="rh-nav-glass fixed top-0 z-50 w-full border-b border-[color:var(--ui-border)] bg-[var(--ui-surface)]/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4 py-3 sm:px-6">
          {/*  Hamburger menu  */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Abrir menú de navegación"
              className="rh-logo-button flex items-center gap-2 rounded-xl bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
              <span className="hidden sm:inline">RITMOHUB</span>
            </button>

            {menuOpen && (
              <>
                {/* Invisible backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Dropdown panel */}
                <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl backdrop-blur-xl">
                  <nav className="flex flex-col gap-0.5 p-2">
                    {navItems.map((item) => {
                      const isActive = item.id === activeSection;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { handleSectionChange(item.id); setMenuOpen(false); }}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                            isActive
                              ? "bg-[var(--ui-primary)] text-[var(--ui-on-primary)] shadow-[0_2px_12px_rgb(var(--ui-glow-primary)/0.35)]"
                              : "text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
                          }`}
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                            <SidebarIcon id={item.id} />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold leading-tight">{item.label}</span>
                            <span className={`mt-0.5 text-xs leading-tight ${isActive ? "opacity-70" : "text-[var(--ui-muted)]"}`}>
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {isAdmin ? (
                      <Link
                        href="/dashboard/admin/users"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left text-[var(--ui-text)] transition-all hover:bg-[var(--ui-surface-soft)]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--ui-primary)]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
                            <path d="M3 12l9 4.5 9-4.5" />
                            <path d="M3 16.5L12 21l9-4.5" />
                          </svg>
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">Panel de administracion</span>
                          <span className="mt-0.5 text-xs leading-tight text-[var(--ui-muted)]">
                            Gestion global de usuarios
                          </span>
                        </span>
                      </Link>
                    ) : null}
                  </nav>
                  <div className="border-t border-[color:var(--ui-border)] px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ui-muted)]">
                      RitmoHub Red Social
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div ref={netSearchRef} className="relative min-w-0 flex-1">
            <div className="relative flex items-center">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={netSearchQuery}
                onChange={(e) => { setNetSearchQuery(e.target.value); setGlobalSearch(e.target.value); setNetSearchOpen(true); }}
                onFocus={() => setNetSearchOpen(true)}
                placeholder="Buscar músicos, bandas, posts..."
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-bg)] py-2 pl-9 pr-8 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
              />
              {netSearchQuery && (
                <button type="button" onClick={() => { setNetSearchQuery(""); setGlobalSearch(""); setNetSearchResults(null); setNetSearchOpen(false); }} className="absolute right-2.5 text-[var(--ui-muted)] hover:text-[var(--ui-text)]">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {netSearchOpen && netSearchQuery.trim().length >= 2 && (
              <div className="absolute left-0 top-full z-[200] mt-1.5 w-full min-w-[320px] overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl">
                {netSearchLoading && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--ui-muted)]">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Buscando...
                  </div>
                )}

                {!netSearchLoading && netSearchResults && (() => {
                  const { users, bands, posts } = netSearchResults;
                  const hasAny = users.length > 0 || bands.length > 0 || posts.length > 0;
                  if (!hasAny) return (
                    <div className="px-4 py-6 text-center text-sm text-[var(--ui-muted)]">Sin resultados para &ldquo;{netSearchQuery}&rdquo;</div>
                  );
                  return (
                    <div className="max-h-[70vh] overflow-y-auto">
                      {/* Users */}
                      {users.length > 0 && (
                        <div>
                          <p className="border-b border-[color:var(--ui-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ui-muted)]">Músicos</p>
                          {users.map((u) => (
                            <a
                              key={u.id}
                              href={`/artist/${u.id}`}
                              onClick={() => setNetSearchOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[var(--ui-surface-soft)]"
                            >
                              <UserAvatar
                                name={u.name}
                                avatarUrl={u.avatarUrl}
                                className="h-8 w-8"
                                initialsClassName="bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{u.name}</p>
                                <p className="truncate text-xs text-[var(--ui-muted)]">{[u.musicianType, u.primaryInstrument].filter(Boolean).join(" · ") || "Músico"}</p>
                              </div>
                              <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Bands */}
                      {bands.length > 0 && (
                        <div>
                          <p className="border-b border-[color:var(--ui-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ui-muted)]">Bandas</p>
                          {bands.map((b) => (
                            <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color:rgb(var(--ui-glow-accent)/0.15)] text-xs font-bold text-[var(--ui-accent)]">
                                {b.name.slice(0, 1).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{b.name}</p>
                                <p className="truncate text-xs text-[var(--ui-muted)]">{[b.genre, `${b.memberCount} miembro${b.memberCount !== 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Posts */}
                      {posts.length > 0 && (
                        <div>
                          <p className="border-b border-[color:var(--ui-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ui-muted)]">Posts</p>
                          {posts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setNetSearchOpen(false);
                                handleSectionChange("communities");
                                setOpenPostId(p.id);
                              }}
                              className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--ui-surface-soft)]"
                            >
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-xs font-bold text-[var(--ui-primary)]">
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{p.title}</p>
                                <p className="truncate text-xs text-[var(--ui-muted)]">{p.category} · {p.authorName}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { handleSectionChange("communities"); setShowForumCompose(true); }}
            className="rh-btn-primary hidden rounded-xl bg-[var(--ui-primary)] px-3 py-2 text-sm font-semibold text-[var(--ui-on-primary)] sm:inline-flex"
          >
            Crear post
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("chats")}
            className="rh-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-text)]"
            title="Mensajes"
          >
            <SidebarIcon id="chats" />
          </button>
          <div ref={notificationPanelRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="rh-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-text)]"
              title="Notificaciones"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              aria-label="Abrir notificaciones"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path d="M6 9a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ui-primary)] px-1 text-[10px] font-bold leading-none text-[var(--ui-on-primary)]">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full z-[220] mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[color:var(--ui-border)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--ui-text)]">Notificaciones</p>
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="text-xs font-semibold text-[var(--ui-muted)] transition hover:text-[var(--ui-text)]"
                  >
                    Limpiar
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-[var(--ui-muted)]">No tienes notificaciones nuevas.</div>
                ) : (
                  <div className="max-h-[22rem] overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationSelect(notification)}
                        className="flex w-full items-start gap-3 border-b border-[color:var(--ui-border)] px-4 py-3 text-left transition hover:bg-[var(--ui-surface-soft)] last:border-b-0"
                      >
                        <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${notification.kind === "chat" ? "bg-[color:rgb(var(--ui-glow-primary)/0.14)] text-[var(--ui-primary)]" : "bg-[color:rgb(var(--ui-glow-accent)/0.14)] text-[var(--ui-accent)]"}`}>
                          {notification.kind === "chat" ? (
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--ui-text)]">{notification.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--ui-muted)]">{notification.body}</span>
                          <span className="mt-1 block text-[11px] text-[var(--ui-muted)]">{notification.at}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <ThemeToggle />
          {isLoggedIn && user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="rh-icon-button inline-flex h-10 items-center rounded-xl border border-[color:var(--ui-border)] px-3 text-sm font-semibold text-[var(--ui-text)]"
            >
              Iniciar sesion
            </Link>
          )}
        </div>
      </header>

      {/* ── Job detail modal ── outside the animated section so position:fixed works correctly ── */}
      {activeSection === "jobs" && selectedJob && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => { setSelectedJob(null); setCvFile(null); setApplyError(null); }}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header image */}
            <div className="relative h-40 w-full overflow-hidden">
              <MediaImage src={selectedJob.image} alt={selectedJob.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <button
                type="button"
                onClick={() => { setSelectedJob(null); setCvFile(null); setApplyError(null); }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="rounded-full bg-[var(--ui-primary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-on-primary)]">
                  {selectedJob.type}
                </span>
                <h2 className="mt-1 text-xl font-bold text-white">{selectedJob.title}</h2>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-sm text-[var(--ui-muted)]">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  {selectedJob.city}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                  {selectedJob.pay}
                </span>
                {selectedJob.deadline && (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    Cierre: {new Date(selectedJob.deadline).toLocaleDateString("es-DO")}
                  </span>
                )}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${selectedJob.requiresCv ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                  {selectedJob.requiresCv ? "CV requerido" : "Sin CV requerido"}
                </span>
              </div>

              {/* Requester card */}
              {selectedJob.requester && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ui-primary)] text-sm font-bold text-[var(--ui-on-primary)]">
                    {selectedJob.requester.trim().split(/\s+/).slice(0, 2).map((t) => t[0]?.toUpperCase()).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ui-text)]">{selectedJob.requester}</p>
                    {selectedJob.requesterRole && (
                      <p className="text-xs text-[var(--ui-muted)]">{selectedJob.requesterRole}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-[var(--ui-muted)]">Solicitante</span>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Descripcion</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ui-text)]">{selectedJob.description}</p>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Requisitos</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--ui-text)]">
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-center text-[10px] leading-4 text-[var(--ui-primary)]">✓</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply section */}
              {isLoggedIn && (
                <div className="mt-5 border-t border-[color:var(--ui-border)] pt-4">
                  {applications[selectedJob.id] ? (
                    <p className="rounded-2xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-4 py-3 text-sm font-semibold text-[var(--ui-accent)]">
                      Postulacion enviada correctamente ✓
                    </p>
                  ) : (
                    <>
                      {selectedJob.requiresCv && (
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                            Adjunta tu CV (PDF o Word)
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                            className="block w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ui-primary)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--ui-on-primary)]"
                          />
                          {cvFile && (
                            <p className="text-xs text-[var(--ui-muted)]">Archivo: {cvFile.name}</p>
                          )}
                        </label>
                      )}
                      {applyError && (
                        <p className="mt-2 rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">{applyError}</p>
                      )}
                      <button
                        type="button"
                        disabled={isApplying || (selectedJob.requiresCv && !cvFile)}
                        onClick={() => applyToJob(selectedJob.id, cvFile)}
                        className="mt-3 w-full rounded-2xl bg-[var(--ui-primary)] px-4 py-3 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isApplying ? "Enviando..." : selectedJob.requiresCv ? "Enviar postulacion con CV" : "Postular ahora"}
                      </button>
                      {selectedJob.requiresCv && !cvFile && (
                        <p className="mt-1.5 text-center text-xs text-[var(--ui-muted)]">Adjunta tu CV para habilitar la postulacion</p>
                      )}
                    </>
                  )}
                </div>
              )}
              {!isLoggedIn && (
                <p className="mt-4 text-center text-sm text-[var(--ui-muted)]">Inicia sesion para postularte.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Forum post modal ── outside the animated section so position:fixed works correctly ── */}
      {activeSection === "communities" && openPostId && (() => {
        const post = forumPosts.find((p) => p.id === openPostId);
        if (!post) return null;
        if (typeof document === "undefined") return null;
        const categoryColors: Record<ForumCategory, string> = {
          General:       "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",
          Produccion:    "bg-amber-500/15  text-amber-400  ring-amber-500/25",
          Conciertos:    "bg-red-500/15    text-red-400    ring-red-500/25",
          Colaboraciones:"bg-green-500/15  text-green-400  ring-green-500/25",
          Gear:          "bg-purple-500/15 text-purple-400 ring-purple-500/25",
        };
        const flairClass = categoryColors[post.category] ?? "bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-[var(--ui-text)] ring-[color:var(--ui-border)]";
        const coverSrc = post.mediaType === "image" && post.mediaUrl ? post.mediaUrl : getForumPostImage(post.category);
        const voteDir = userVotes[post.id];
        return createPortal(
          <div
            key={post.id}
            className="fixed inset-0 z-[140] flex items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8"
            onClick={() => setOpenPostId(null)}
          >
            {/* Backdrop */}
            <div className="modal-backdrop absolute inset-0 bg-black/78 backdrop-blur-md" />

            {/* ── Modal shell ── */}
            <div
              className="modal-card relative z-10 flex max-h-[92vh] w-full max-w-[960px] flex-col overflow-hidden rounded-3xl border border-[color:var(--ui-border)] shadow-[0_34px_70px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >

              {/* ══════════════════════════════════════════
                  SECTION A — IMAGE
                  bg negro, imagen centrada, sin texto encima
              ══════════════════════════════════════════ */}
              <div className="relative shrink-0 bg-[#0d0d0d]">
                {/* Close */}
                <button
                  type="button"
                  onClick={() => setOpenPostId(null)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/85"
                  aria-label="Cerrar"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                {/* Flair badge over image */}
                <span className={`absolute left-4 top-3 z-10 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset backdrop-blur-sm ${flairClass}`}>
                  r/{post.category}
                </span>
                {/* Image — object-contain, capped height, dark letterbox */}
                <MediaImage
                  src={coverSrc}
                  alt={post.title}
                  className="mx-auto block max-h-[440px] w-full object-contain object-center sm:max-h-[500px]"
                />
              </div>

              {/* ══════════════════════════════════════════
                  SECTION B — CONTENT
                  card con fondo diferente, padding amplio
              ══════════════════════════════════════════ */}
              <div
                className="flex flex-1 flex-col overflow-hidden bg-[var(--ui-surface)]"
                style={{ borderTop: "1px solid color-mix(in srgb, var(--ui-border) 60%, transparent)" }}
              >
                {/* Scrollable inner */}
                <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>

                  {/* ── B1: Meta row — autor + votes ── */}
                  <div className="flex items-center gap-3 px-6 pb-5 pt-6 sm:px-8">
                    {/* Avatar */}
                    <UserAvatar
                      name={post.author}
                      avatarUrl={post.authorAvatarUrl}
                      className="h-10 w-10"
                      initialsClassName="bg-[var(--ui-primary)] text-sm font-bold text-[var(--ui-on-primary)]"
                    />
                    {/* Author + date */}
                    <div className="min-w-0 flex-1">
                      {post.authorUserId ? (
                        <Link
                          href={`/artist/${post.authorUserId}`}
                          prefetch={false}
                          className="inline-block text-sm font-semibold text-[var(--ui-text)] transition hover:text-[var(--ui-primary)] hover:underline"
                        >
                          u/{post.author}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--ui-text)]">u/{post.author}</p>
                      )}
                      <p className="text-xs text-[var(--ui-muted)]">{post.createdAt}</p>
                    </div>
                    {/* Vote pill */}
                    <div className="flex items-center gap-0.5 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-1 py-1">
                      <button
                        type="button"
                        onClick={() => voteForumPost(post.id, "up")}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${voteDir === "up" ? "bg-orange-500/20 text-orange-400" : "text-[var(--ui-muted)] hover:bg-orange-500/10 hover:text-orange-400"}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={voteDir === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                      </button>
                      <span className={`min-w-[2rem] text-center text-sm font-bold tabular-nums ${voteDir === "up" ? "text-orange-400" : voteDir === "down" ? "text-blue-400" : "text-[var(--ui-text)]"}`}>
                        {post.upvotes}
                      </span>
                      <button
                        type="button"
                        onClick={() => voteForumPost(post.id, "down")}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${voteDir === "down" ? "bg-blue-500/20 text-blue-400" : "text-[var(--ui-muted)] hover:bg-blue-500/10 hover:text-blue-400"}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={voteDir === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* ── B2: Título (en sección inferior, no encima de imagen) ── */}
                  <div className="px-6 pb-5 sm:px-8">
                    <h2 className="text-[1.8rem] font-bold leading-[1.2] tracking-tight text-[var(--ui-text)] sm:text-[2rem]">
                      {post.title}
                    </h2>
                  </div>

                  {/* ── B3: Cuerpo del post ── */}
                  {(post.body || post.linkUrl || (post.mediaType === "video" && post.mediaUrl) || (post.mediaType === "audio" && post.mediaUrl)) && (
                    <div className="space-y-5 px-6 pb-6 sm:px-8">
                      {post.body && (
                        <p className="text-base leading-8 text-[var(--ui-text)]/92 sm:text-[1.03rem]">
                          {isLoggedIn ? post.body : "Inicia sesión para ver el contenido completo."}
                        </p>
                      )}
                      {post.linkUrl && (
                        <a href={post.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-2.5 text-sm text-[var(--ui-muted)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.4)] hover:text-[var(--ui-text)]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          <span className="truncate max-w-sm">{post.linkUrl}</span>
                        </a>
                      )}
                      {post.mediaType === "video" && post.mediaUrl && (
                        <div className="overflow-hidden rounded-xl border border-[color:var(--ui-border)]">
                          <video controls preload="metadata" className="max-h-[500px] w-full object-contain"><source src={post.mediaUrl} /></video>
                        </div>
                      )}
                      {post.mediaType === "audio" && post.mediaUrl && (
                        <div className="overflow-hidden rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-6">
                          <MediaImage src={getForumPostCoverImage(post)} alt={post.category} className="mb-4 h-48 w-full rounded-lg object-cover" />
                          <audio controls preload="metadata" className="w-full"><source src={post.mediaUrl} /></audio>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── B4: Action bar ── */}
                  <div className="flex items-center gap-1 border-t border-[color:var(--ui-border)] px-5 py-3 sm:px-7">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {post.comments.length} comentario{post.comments.length !== 1 ? "s" : ""}
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      Compartir
                    </button>
                  </div>

                  {/* ── B5: Comentarios ── */}
                  <div className="border-t border-[color:var(--ui-border)] bg-[var(--ui-bg)]/50 px-6 py-7 sm:px-8">
                    <p className="mb-5 text-xs font-bold uppercase tracking-wider text-[var(--ui-muted)]">
                      Comentarios
                    </p>

                    {commentErrorByPostId[post.id] && (
                      <p className="mb-4 rounded-lg bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-2.5 text-sm text-[var(--ui-danger)]">{commentErrorByPostId[post.id]}</p>
                    )}

                    {/* Input row */}
                    <div className="mb-6 flex gap-3">
                      <UserAvatar
                        name={user?.name ?? "RitmoHub"}
                        avatarUrl={user?.avatarUrl}
                        className="mt-0.5 h-9 w-9"
                        initialsClassName="bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]"
                      />
                      <div className="flex flex-1 flex-col gap-2">
                        <textarea
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void addForumComment(post.id); } }}
                          placeholder={isLoggedIn ? "Añade un comentario… (Enter para enviar)" : "Inicia sesión para comentar"}
                          disabled={!isLoggedIn}
                          rows={2}
                          className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] disabled:opacity-50"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={!isLoggedIn || commentSubmittingPostId === post.id}
                            onClick={() => addForumComment(post.id)}
                            className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-6 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90 disabled:opacity-40"
                          >
                            {commentSubmittingPostId === post.id ? "Enviando…" : "Comentar"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comment list */}
                    {post.comments.length === 0 ? (
                      <p className="py-3 text-center text-sm text-[var(--ui-muted)]">Sé el primero en comentar.</p>
                    ) : (
                      <div className="space-y-4">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <UserAvatar
                              name={comment.author}
                              avatarUrl={comment.authorAvatarUrl}
                              className="mt-0.5 h-8 w-8"
                              initialsClassName="bg-[var(--ui-primary)]/15 text-[11px] font-bold text-[var(--ui-primary)]"
                            />
                            <div className="flex-1 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {comment.authorUserId ? (
                                  <Link
                                    href={`/artist/${comment.authorUserId}`}
                                    prefetch={false}
                                    className="font-semibold text-[var(--ui-text)] transition hover:text-[var(--ui-primary)] hover:underline"
                                  >
                                    u/{comment.author}
                                  </Link>
                                ) : (
                                  <span className="font-semibold text-[var(--ui-text)]">u/{comment.author}</span>
                                )}
                                <span className="text-[var(--ui-muted)]">· {comment.createdAt}</span>
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => void adminDeleteForumComment(post.id, comment.id)}
                                    className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.12)]"
                                  >
                                    Delete Comment
                                  </button>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-[var(--ui-text)]/90">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>,
          document.body,
        );
      })()}

      {/*  Main content  */}
      <div className="px-4 pt-20 pb-6 sm:px-6">
        {!isLoggedIn ? (
          <div className="mt-2 rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.3)] bg-[color:rgb(var(--ui-glow-danger)/0.11)] px-4 py-3 text-sm text-[var(--ui-danger)]">
            Vista previa activa: navegacion completa con datos limitados hasta iniciar sesion.
          </div>
        ) : null}

        <div className="relative">
          <section
            key={activeSection}
            className={`rh-feed-grid animate-panel-enter mt-4 grid gap-4 lg:grid-cols-12 ${activeSectionLoading ? "pointer-events-none select-none opacity-60" : ""}`}
          >

            {activeSection === "band" ? (
              <div className="lg:col-span-12 space-y-4">
                {/*  Pending invitations banner  */}
                {incomingInvitations.length > 0 && (
                  <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.3)] bg-[color:rgb(var(--ui-glow-primary)/0.06)] p-4 space-y-3">
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Invitaciones pendientes</p>
                    {incomingInvitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--ui-surface)] border border-[color:var(--ui-border)] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--ui-text)]">{inv.bandName}</p>
                          <p className="text-xs text-[var(--ui-muted)]">Invitado por {inv.inviterName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleRespondInvitation(inv.id, true)} className="rounded-xl bg-[var(--ui-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90">Aceptar</button>
                          <button type="button" onClick={() => handleRespondInvitation(inv.id, false)} className="rounded-xl border border-[color:var(--ui-border)] px-4 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)]">Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/*  Loading state  */}
                {bandLoading && (
                  <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-10 text-center">
                    <p className="text-sm text-[var(--ui-muted)]">Cargando tu banda...</p>
                  </div>
                )}

                {/*  No band & not solo  */}
                {!bandLoading && !band && !isSolo && (
                  <div className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-8">
                    <div className="mx-auto max-w-md text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-surface-soft)] text-3xl">{"\ud83c\udfb8"}</div>
                      <h3 className="text-xl font-bold text-[var(--ui-text)]">¿Cómo describes tu proyecto?</h3>
                      <p className="mt-2 text-sm text-[var(--ui-muted)]">Puedes crear una banda e invitar a musicos, o continuar como artista solista.</p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button type="button" onClick={() => setShowCreateBand(true)} className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90">
                          Crear una banda
                        </button>
                        <button type="button" onClick={() => handleToggleSolo(true)} className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-6 py-2.5 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]">
                          Soy solista
                        </button>
                      </div>
                    </div>

                    {/* Create band form */}
                    {showCreateBand && (
                      <div className="mx-auto mt-6 max-w-sm space-y-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
                        {bandError && <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-xs text-[var(--ui-danger)]">{bandError}</p>}
                        <input
                          type="text"
                          placeholder="Nombre de la banda"
                          value={newBandName}
                          onChange={(e) => setNewBandName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateBand()}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCreateBand} disabled={!newBandName.trim()} className="flex-1 rounded-xl bg-[var(--ui-primary)] py-2 text-sm font-semibold text-[var(--ui-on-primary)] disabled:opacity-50">Crear</button>
                          <button type="button" onClick={() => { setShowCreateBand(false); setBandError(null); }} className="flex-1 rounded-xl border border-[color:var(--ui-border)] py-2 text-sm font-semibold text-[var(--ui-text)]">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/*  Solo mode  */}
                {!bandLoading && !band && isSolo && (
                  <div className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-[color:var(--ui-border)] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ui-surface-soft)] text-2xl">🎵</div>
                        <div>
                          <h3 className="text-xl font-bold text-[var(--ui-text)]">Artista solista</h3>
                          <p className="text-xs text-[var(--ui-muted)]">Personaliza tu branding de proyecto individual.</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleToggleSolo(false)} className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]">
                        Crear banda
                      </button>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                      <p className="text-sm text-[var(--ui-muted)]">
                        Ya estas en modo solista. Para editar tu nombre artistico, genero y redes usa la seccion &quot;Tu perfil&quot;.
                      </p>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveSection("profile")}
                          className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90"
                        >
                          Ir a tu perfil
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/*  Band view  */}
                {!bandLoading && band && (
                  <div className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] overflow-hidden">
                    {/* Banner */}
                    {band.bannerUrl && (
                      <div className="relative h-48 w-full overflow-hidden bg-black sm:h-56">
                        <img
                          src={band.bannerUrl}
                          alt="Banner"
                          className={`h-full w-full ${band.bannerFit === "contain" ? "object-contain" : "object-cover"}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-[color:var(--ui-border)] px-6 py-4">
                      <div className="flex items-center gap-3">
                        {band.logoUrl ? (
                          <img src={band.logoUrl} alt="Logo" className="h-12 w-12 rounded-2xl object-cover border border-[color:var(--ui-border)]" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ui-surface-soft)] text-xl font-bold text-[var(--ui-primary)]">
                            {band.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[var(--ui-text)]">{band.name}</h3>
                          <p className="mt-0.5 text-sm text-[var(--ui-muted)]">
                            {band.genre ? `${band.genre} · ` : ""}{band.members.length} {band.members.length === 1 ? "miembro" : "miembros"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {band.creatorUserId === user?.id && (
                          <button type="button" onClick={() => { setShowBandBrandingPanel((v) => !v); setBandBrandingMessage(null); }} className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)]">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                          </button>
                        )}
                        <button type="button" onClick={() => { setShowInvitePanel((v) => !v); setBandInviteQuery(""); setBandInviteResults([]); }} className="rh-btn-primary flex items-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                          Invitar
                        </button>
                        {band.creatorUserId === user?.id ? (
                          <button type="button" onClick={() => handleLeaveBand("disband")} className="rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.4)] px-4 py-2 text-sm font-semibold text-[var(--ui-danger)] transition hover:bg-[color:rgb(var(--ui-glow-danger)/0.08)]">Disolver</button>
                        ) : (
                          <button type="button" onClick={() => handleLeaveBand("leave")} className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)]">Salir</button>
                        )}
                      </div>
                    </div>

                    {/* Band bio */}
                    {band.bio && !showBandBrandingPanel && (
                      <div className="border-b border-[color:var(--ui-border)] px-6 py-3">
                        <p className="text-sm text-[var(--ui-muted)]">{band.bio}</p>
                      </div>
                    )}

                    {/* Branding edit panel */}
                    {showBandBrandingPanel && (
                      <div className="border-b border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-6 py-5 space-y-4">
                        <p className="text-sm font-semibold text-[var(--ui-text)]">Editar perfil de banda</p>

                        {bandBrandingMessage && (
                          <div className={`rounded-xl px-3 py-2 text-sm ${bandBrandingMessage.type === "success" ? "bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-[var(--ui-text)]" : "bg-[color:rgb(var(--ui-glow-danger)/0.12)] text-[var(--ui-danger)]"}`}>
                            {bandBrandingMessage.text}
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nombre de la banda</span>
                            <input
                              type="text"
                              value={bandBranding.name}
                              onChange={(e) => setBandBranding((p) => ({ ...p, name: e.target.value }))}
                              maxLength={80}
                              placeholder={band.name}
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Género musical</span>
                            <input
                              type="text"
                              value={bandBranding.genre}
                              onChange={(e) => setBandBranding((p) => ({ ...p, genre: e.target.value }))}
                              maxLength={80}
                              placeholder="Rock, jazz, indie..."
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                            />
                          </label>
                        </div>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Biografía</span>
                          <textarea
                            rows={3}
                            value={bandBranding.bio}
                            onChange={(e) => setBandBranding((p) => ({ ...p, bio: e.target.value }))}
                            maxLength={500}
                            placeholder="Cuéntanos sobre tu banda..."
                            className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                          />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Logo</span>
                            <div className="flex items-center gap-3">
                              {bandBranding.logoUrl && (
                                <img src={bandBranding.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover border border-[color:var(--ui-border)]" />
                              )}
                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                {bandBranding.logoUrl ? "Cambiar" : "Subir logo"}
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const url = await uploadBandImage(file, "band-logo");
                                    setBandBranding((p) => ({ ...p, logoUrl: url }));
                                  } catch { setBandBrandingMessage({ type: "error", text: "No se pudo subir el logo." }); }
                                }} />
                              </label>
                            </div>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Banner</span>
                            <div className="flex items-center gap-3">
                              {bandBranding.bannerUrl && (
                                <img
                                  src={bandBranding.bannerUrl}
                                  alt="Banner"
                                  className={`h-12 w-20 rounded-xl border border-[color:var(--ui-border)] ${bandBranding.bannerFit === "contain" ? "bg-black object-contain" : "object-cover"}`}
                                />
                              )}
                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                {bandBranding.bannerUrl ? "Cambiar" : "Subir banner"}
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const url = await uploadBandImage(file, "band-banner");
                                    setBandBranding((p) => ({ ...p, bannerUrl: url }));
                                  } catch { setBandBrandingMessage({ type: "error", text: "No se pudo subir el banner." }); }
                                }} />
                              </label>
                            </div>
                            <select
                              value={bandBranding.bannerFit}
                              onChange={(e) => setBandBranding((p) => ({ ...p, bannerFit: e.target.value as BannerFitMode }))}
                              className="rh-input mt-2 w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                            >
                              <option value="cover">Ajuste: Cubrir (puede recortar)</option>
                              <option value="contain">Ajuste: Completo (sin recorte)</option>
                            </select>
                            <p className="text-xs text-[var(--ui-muted)]">
                              Si el banner es muy grande, puedes mostrarlo completo o llenando el espacio.
                            </p>
                          </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setShowBandBrandingPanel(false)} className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface)]">
                            Cancelar
                          </button>
                          <button type="button" onClick={() => void handleSaveBandBranding()} disabled={bandBrandingSaving} className="rounded-xl bg-[var(--ui-primary)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90 disabled:opacity-50">
                            {bandBrandingSaving ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Invite panel */}
                    {showInvitePanel && (
                      <div className="border-b border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-6 py-4 space-y-3">
                        <p className="text-sm font-semibold text-[var(--ui-text)]">Buscar musicos para invitar</p>
                        {bandError && <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-xs text-[var(--ui-danger)]">{bandError}</p>}
                        <input
                          type="text"
                          placeholder="Nombre del musico..."
                          value={bandInviteQuery}
                          onChange={(e) => handleBandInviteSearch(e.target.value)}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                        />
                        {bandInviteLoading && <p className="text-xs text-[var(--ui-muted)]">Buscando...</p>}
                        {bandInviteResults.length > 0 && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {bandInviteResults.map((u) => (
                              <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <UserAvatar
                                    name={u.name}
                                    avatarUrl={u.avatarUrl}
                                    className="h-8 w-8"
                                    initialsClassName="bg-[var(--ui-primary)] text-[10px] font-bold text-[var(--ui-on-primary)]"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{u.name}</p>
                                    <p className="truncate text-xs text-[var(--ui-muted)]">{u.primaryInstrument || u.musicianType || "Músico"}</p>
                                  </div>
                                </div>
                                {sentInvitations.some((si) => si.inviteeUserId === u.id) ? (
                                  <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-muted)]">Invitado</span>
                                ) : (
                                  <button type="button" onClick={() => handleSendBandInvite(u.id)} className="rounded-xl bg-[var(--ui-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90">Invitar</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Sent invitations */}
                        {sentInvitations.length > 0 && (
                          <div className="pt-2">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Invitaciones enviadas</p>
                            <div className="space-y-1.5">
                              {sentInvitations.map((si) => (
                                <div key={si.id} className="flex items-center justify-between rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                                  <p className="text-sm text-[var(--ui-text)]">{si.inviteeName}</p>
                                  <span className="rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.12)] px-2 py-0.5 text-xs text-[var(--ui-text)]">Pendiente</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Members grid */}
                    <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                      {band.members.map((member) => {
                        const initials = member.memberName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                        return (
                          <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--ui-primary)] text-sm font-bold text-[var(--ui-on-primary)] overflow-hidden">
                              {member.memberAvatar ? (
                                <img src={member.memberAvatar} alt={member.memberName} className="h-full w-full object-cover" />
                              ) : initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--ui-text)]">{member.memberName}</p>
                              <p className="truncate text-xs text-[var(--ui-muted)]">{member.memberInstrument || member.memberMusicianType || "Músico"}</p>
                              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.role === "admin" ? "bg-[color:rgb(var(--ui-glow-primary)/0.15)] text-[var(--ui-text)]" : "bg-[var(--ui-surface)] text-[var(--ui-muted)]"}`}>
                                {member.role === "admin" ? "Admin" : "Miembro"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {activeSection === "communities" ? (
              <>
                {/* ══════════════════════════════════════════════════════
                    LEFT SIDEBAR — hidden on mobile/tablet
                ══════════════════════════════════════════════════════ */}
                <aside className="hidden lg:flex lg:col-span-2 flex-col gap-3 self-start sticky top-[4.5rem]">
                  {/* Create post */}
                  <button
                    type="button"
                    onClick={() => setShowForumCompose(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-2.5 text-sm font-bold text-[var(--ui-on-primary)] transition hover:opacity-90"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    Crear Post
                  </button>

                  {/* Communities nav */}
                  <div className="overflow-hidden rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
                    <p className="border-b border-[color:var(--ui-border)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--ui-muted)]">Comunidades</p>
                    {(["Todas", "General", "Produccion", "Conciertos", "Colaboraciones", "Gear"] as const).map((cat) => {
                      const icons: Record<string, React.ReactNode> = {
                        Todas:         <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
                        General:       <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                        Produccion:    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
                        Conciertos:    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
                        Colaboraciones:<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                        Gear:          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M20 12h-2M6 12H4M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41M12 18v2M12 4V2"/></svg>,
                      };
                      const isActive = forumFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForumFilter(cat)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${isActive ? "bg-[color:rgb(var(--ui-glow-primary)/0.12)] font-bold text-[var(--ui-text)]" : "text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"}`}
                        >
                          {icons[cat]}
                          <span>{cat === "Todas" ? "r/Todas" : `r/${cat}`}</span>
                          {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--ui-primary)]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rules */}
                  <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-3 text-xs text-[var(--ui-muted)] space-y-2">
                    <p className="font-bold text-[var(--ui-text)]">Reglas de la comunidad</p>
                    {["Sé respetuoso", "Solo contenido musical", "Sin spam ni auto-promo excesiva", "Cita tus fuentes"].map((r, i) => (
                      <p key={r}><span className="font-semibold text-[var(--ui-text)]">{i + 1}.</span> {r}</p>
                    ))}
                  </div>
                </aside>

                {/* ══════════════════════════════════════════════════════
                    CENTER FEED
                ══════════════════════════════════════════════════════ */}
                <div className="col-span-12 lg:col-span-7 space-y-2">

                  {/* Search bar */}
                  <div className="flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input
                      type="text"
                      value={forumSearch}
                      onChange={(e) => setForumSearch(e.target.value)}
                      placeholder="Buscar en la comunidad…"
                      className="flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                    />
                    {forumSearch && (
                      <button type="button" onClick={() => setForumSearch("")} className="text-[var(--ui-muted)] transition hover:text-[var(--ui-text)]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>

                  {/* Create post form — shown when triggered by "Crear post" buttons */}
                  {showForumCompose && (
                    <div className="overflow-hidden rounded-xl border border-[color:rgb(var(--ui-glow-primary)/0.35)] bg-[var(--ui-surface)]">
                      <div className="flex items-center justify-between border-b border-[color:var(--ui-border)] px-4 py-3">
                        <p className="text-sm font-semibold text-[var(--ui-text)]">Crear post</p>
                        <button type="button" onClick={() => setShowForumCompose(false)} className="text-[var(--ui-muted)] transition hover:text-[var(--ui-text)]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="space-y-3 p-4">
                        {forumError && <div className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-sm text-[var(--ui-danger)]">{forumError}</div>}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Título del post" value={forumDraft.title} onChange={(v) => setForumDraft((p) => ({ ...p, title: v }))} />
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Comunidad</span>
                            <select value={forumDraft.category} onChange={(e) => setForumDraft((p) => ({ ...p, category: e.target.value as ForumCategory }))} className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none">
                              {forumCategories.filter((c) => c !== "Todas").map((c) => <option key={c} value={c}>r/{c}</option>)}
                            </select>
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Contenido</span>
                          <textarea value={forumDraft.body} onChange={(e) => setForumDraft((p) => ({ ...p, body: e.target.value }))} rows={4} placeholder="Comparte algo con la comunidad..." className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]" />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Adjuntar</span>
                            <select value={forumDraft.mediaType} onChange={(e) => setForumDraft((p) => ({ ...p, mediaType: e.target.value as "none" | "image" | "video" | "audio" }))} className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none">
                              <option value="none">Sin media</option><option value="image">Imagen</option><option value="video">Video</option><option value="audio">Audio</option>
                            </select>
                          </label>
                          <InputField label="URL media" value={forumDraft.mediaUrl} onChange={(v) => setForumDraft((p) => ({ ...p, mediaUrl: v }))} />
                          <InputField label="Link externo" value={forumDraft.linkUrl} onChange={(v) => setForumDraft((p) => ({ ...p, linkUrl: v }))} />
                        </div>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Subir archivo</span>
                          <input type="file" accept="image/*,video/*,audio/mpeg,audio/wav,audio/x-wav,audio/wave,audio/ogg" onChange={(e) => setForumFile(e.target.files?.[0] ?? null)} className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ui-surface)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--ui-text)]" />
                          {forumFile && <p className="text-xs text-[var(--ui-muted)]">📎 {forumFile.name}</p>}
                        </label>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowForumCompose(false)} className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)]">Cancelar</button>
                          <button type="button" disabled={forumPublishing} onClick={publishForumPost} className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)] disabled:opacity-55">
                            {forumPublishing ? "Publicando…" : "Publicar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sort + filter bar */}
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                    {([{ key: "hot", label: "🔥 Popular" }, { key: "new", label: "✨ Nuevo" }, { key: "top", label: "⬆ Top" }] as const).map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setForumSort(key)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${forumSort === key ? "bg-[var(--ui-primary)] text-[var(--ui-on-primary)]" : "text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"}`}>
                        {label}
                      </button>
                    ))}
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {forumCategories.map((cat) => (
                        <button key={cat} type="button" onClick={() => setForumFilter(cat)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${forumFilter === cat ? "border-[color:rgb(var(--ui-glow-primary)/0.5)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-[var(--ui-text)]" : "border-[color:var(--ui-border)] text-[var(--ui-muted)] hover:border-[color:rgb(var(--ui-glow-primary)/0.3)] hover:text-[var(--ui-text)]"}`}>
                          {cat === "Todas" ? "Todas" : `r/${cat}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Empty state */}
                  {visibleForumPosts.length === 0 && (
                    <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-6 py-16 text-center">
                      <p className="text-4xl">💬</p>
                      <p className="mt-3 text-sm font-semibold text-[var(--ui-text)]">No hay posts aquí todavía</p>
                      <p className="mt-1 text-xs text-[var(--ui-muted)]">Sé el primero en publicar en esta comunidad.</p>
                    </div>
                  )}

                  {/* ── Posts ── */}
                  {visibleForumPosts.map((post) => {
                    const categoryColors: Record<ForumCategory, string> = {
                      General:       "text-indigo-400",
                      Produccion:    "text-amber-400",
                      Conciertos:    "text-red-400",
                      Colaboraciones:"text-green-400",
                      Gear:          "text-purple-400",
                    };
                    const categoryColor = categoryColors[post.category] ?? "text-[var(--ui-primary)]";
                    const hasImage = post.mediaType === "image" && post.mediaUrl;
                    const coverSrc = hasImage ? post.mediaUrl : getForumPostImage(post.category);
                    const voteDir = userVotes[post.id];

                    return (
                      <article
                        key={post.id}
                        className="overflow-hidden rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] transition-colors hover:border-[color:rgb(var(--ui-glow-primary)/0.4)]"
                      >
                        {/* ── Post header ── */}
                        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-[var(--ui-muted)]">
                          <UserAvatar
                            name={post.author}
                            avatarUrl={post.authorAvatarUrl}
                            className="h-6 w-6"
                            initialsClassName="bg-[var(--ui-primary)] text-[9px] font-bold text-[var(--ui-on-primary)]"
                          />
                          <span className={`font-bold ${categoryColor}`}>r/{post.category}</span>
                          <span>·</span>
                          <span>
                            Posted by{" "}
                            {post.authorUserId ? (
                              <Link
                                href={`/artist/${post.authorUserId}`}
                                prefetch={false}
                                className="font-semibold text-[var(--ui-text)] transition hover:text-[var(--ui-primary)] hover:underline"
                              >
                                u/{post.author}
                              </Link>
                            ) : (
                              <span className="font-semibold text-[var(--ui-text)]">u/{post.author}</span>
                            )}
                          </span>
                          <span>·</span>
                          <span>{post.createdAt}</span>
                        </div>

                        {/* ── Title ── */}
                        <div
                          className="cursor-pointer px-4 pb-2 pt-1"
                          onClick={() => setOpenPostId(post.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter") setOpenPostId(post.id); }}
                        >
                          <h3 className="text-base font-bold leading-snug text-[var(--ui-text)] hover:text-[var(--ui-primary)] transition-colors sm:text-lg">
                            {post.title}
                          </h3>
                          {post.body && (
                            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--ui-muted)]">
                              {isLoggedIn ? post.body : "Inicia sesión para ver el contenido completo."}
                            </p>
                          )}
                        </div>

                        {/* ── Image (object-contain, dark letterbox) ── */}
                        <div
                          className="mx-4 mb-3 cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => setOpenPostId(post.id)}
                          role="button"
                          tabIndex={-1}
                          onKeyDown={(e) => { if (e.key === "Enter") setOpenPostId(post.id); }}
                        >
                          <MediaImage
                            src={coverSrc}
                            alt={post.title}
                            className={`block w-full max-h-[500px] object-contain bg-[#0a0a0a] ${hasImage ? "" : "rh-forum-cover-fallback"}`}
                          />
                        </div>

                        {/* ── Action bar ── */}
                        <div className="flex items-center gap-0.5 border-t border-[color:var(--ui-border)] px-2 py-1.5">
                          {/* Vote pill */}
                          <div className="flex items-center rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]">
                            <button
                              type="button"
                              onClick={() => voteForumPost(post.id, "up")}
                              title="Upvote"
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${voteDir === "up" ? "text-orange-400" : "text-[var(--ui-muted)] hover:text-orange-400"}`}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill={voteDir === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                            </button>
                            <span className={`min-w-[2rem] text-center text-xs font-bold ${voteDir === "up" ? "text-orange-400" : voteDir === "down" ? "text-blue-400" : "text-[var(--ui-text)]"}`}>
                              {post.upvotes}
                            </span>
                            <button
                              type="button"
                              onClick={() => voteForumPost(post.id, "down")}
                              title="Downvote"
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${voteDir === "down" ? "text-blue-400" : "text-[var(--ui-muted)] hover:text-blue-400"}`}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill={voteDir === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                            </button>
                          </div>

                          {/* Comments */}
                          <button
                            type="button"
                            onClick={() => setOpenPostId(post.id)}
                            className="ml-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            {post.comments.length} comentario{post.comments.length !== 1 ? "s" : ""}
                          </button>

                          {/* Share */}
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)]"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                            Compartir
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void adminDeleteForumPost(post.id); }}
                              className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--ui-danger)] transition-colors hover:bg-[color:rgb(var(--ui-glow-danger)/0.12)]"
                            >
                              Delete Post
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* ══════════════════════════════════════════════════════
                    RIGHT SIDEBAR — hidden on mobile/tablet
                ══════════════════════════════════════════════════════ */}
                <aside className="hidden lg:flex lg:col-span-3 flex-col gap-3 self-start sticky top-[4.5rem]">
                  {/* Community info */}
                  <div className="overflow-hidden rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
                    <div className="h-12 bg-gradient-to-r from-[color:rgb(var(--ui-glow-primary)/0.5)] to-purple-600/40" />
                    <div className="px-4 pb-4 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ui-primary)] text-sm font-black text-[var(--ui-on-primary)]">M</span>
                        <div>
                          <p className="text-sm font-bold text-[var(--ui-text)]">r/MusiSec</p>
                          <p className="text-xs text-[var(--ui-muted)]">La red de músicos</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-[var(--ui-muted)]">
                        Espacio para músicos, productores y artistas. Comparte tus proyectos, busca colaboraciones y crece con la comunidad.
                      </p>
                      <div className="mt-3 flex gap-5 border-t border-[color:var(--ui-border)] pt-3">
                        <div className="text-center">
                          <p className="text-sm font-bold text-[var(--ui-text)]">{forumPosts.length}</p>
                          <p className="text-[10px] text-[var(--ui-muted)]">Posts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[var(--ui-text)]">5</p>
                          <p className="text-[10px] text-[var(--ui-muted)]">Categorías</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowForumCompose(true)}
                        className="mt-3 w-full rounded-lg bg-[var(--ui-primary)] py-2 text-xs font-bold text-[var(--ui-on-primary)] transition hover:opacity-90"
                      >
                        Crear Post
                      </button>
                    </div>
                  </div>

                  {/* Trending */}
                  <div className="overflow-hidden rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
                    <p className="border-b border-[color:var(--ui-border)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--ui-muted)]">
                      🔥 Trending
                    </p>
                    {forumPosts
                      .slice()
                      .sort((a, b) => b.upvotes - a.upvotes)
                      .slice(0, 5)
                      .map((post, i) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setOpenPostId(post.id)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ui-surface-soft)]"
                        >
                          <span className="mt-0.5 min-w-[1.25rem] text-sm font-black text-[var(--ui-muted)]">#{i + 1}</span>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--ui-text)]">{post.title}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--ui-muted)]">r/{post.category} · {post.upvotes} votos</p>
                          </div>
                        </button>
                      ))}
                  </div>

                  {/* Music resources */}
                  <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--ui-muted)]">Recursos</p>
                    {[
                      { icon: "🎓", label: "Cursos", action: () => {} },
                      { icon: "💼", label: "Empleos musicales", action: () => {} },
                      { icon: "🎤", label: "Shows y conciertos", action: () => {} },
                    ].map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-surface-soft)] hover:text-[var(--ui-text)] cursor-pointer">
                        <span className="text-base">{icon}</span>
                        <span className="font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </>
            ) : null}

            {activeSection === "profile" ? (
              <article className="rh-card rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6 lg:col-span-12">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--ui-text)]">Tu perfil</h3>
                    <p className="mt-1 text-sm text-[var(--ui-muted)]">
                      Personaliza tu identidad artstica en la red.
                    </p>
                  </div>
                  {isLoggedIn && user && (
                    <Link
                      href={`/artist/${user.id}`}
                      className="shrink-0 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
                    >
                      Ver perfil público
                    </Link>
                  )}
                </div>
                {isLoggedIn && user ? (
                  <ProfileEditor
                    userId={user.id}
                    userName={user.name}
                    userEmail={user.email}
                    userBio={user.bio ?? ""}
                    userMusicianType={user.musicianType ?? ""}
                    userPrimaryInstrument={user.primaryInstrument ?? ""}
                    userOrientation={user.orientation ?? ""}
                    userStudies={user.studies ?? ""}
                    userAvatarUrl={user.avatarUrl ?? ""}
                    userCoverUrl={user.coverUrl ?? ""}
                    userWebsiteUrl={user.websiteUrl ?? ""}
                    userLocation={user.location ?? ""}
                    userSocialInstagram={user.socialInstagram ?? ""}
                    userSocialSpotify={user.socialSpotify ?? ""}
                    userSocialYoutube={user.socialYoutube ?? ""}
                    userStageName={user.stageName ?? ""}
                    userGenre={user.genre ?? ""}
                    userTagline={user.tagline ?? ""}
                  />
                ) : (
                  <p className="text-sm text-[var(--ui-muted)]">Inicia sesion para editar tu perfil.</p>
                )}
              </article>
            ) : null}

            {activeSection === "shows" ? (
              <>
                <article className="rh-card rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6 lg:col-span-12">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--ui-text)]">Conciertos publicados</h3>
                      <p className="mt-1 text-sm text-[var(--ui-muted)]">
                        Explora toda la cartelera de shows ya publicados.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.12)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]">
                        {visibleConcerts.length} conciertos
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConcertFormFieldErrors({});
                          setConcertFormError(null);
                          setShowConcertCompose(true);
                        }}
                        disabled={!isLoggedIn}
                        className="rh-btn-primary inline-flex items-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] disabled:cursor-not-allowed disabled:opacity-55"
                        title={isLoggedIn ? "Publicar concierto" : "Inicia sesion para publicar conciertos"}
                      >
                        Publicar concierto
                      </button>
                    </div>
                  </div>

                  {!isLoggedIn ? (
                    <p className="mt-2 text-xs text-[var(--ui-muted)]">Inicia sesion para publicar un concierto nuevo.</p>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <input
                      value={concertSearch}
                      onChange={(event) => setConcertSearch(event.target.value)}
                      placeholder="Buscar por evento, venue o ciudad"
                      className="rh-input rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                    />
                    <select
                      value={concertStatusFilter}
                      onChange={(event) => setConcertStatusFilter(event.target.value as ConcertStatus | "all")}
                      className="rh-input rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                    >
                      <option value="all">Todos los estados</option>
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>
                          {pipelineLabels[status]}
                        </option>
                      ))}
                    </select>
                    <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-muted)]">
                      Confirmados:{" "}
                      <span className="font-semibold text-[var(--ui-text)]">{analytics.confirmedConcerts}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {visibleConcerts.map((concert) => {
                      const fallbackFlyer = pickConcertCardFallbackFlyer(`${concert.id}:fallback`);
                      const cardFlyerUrl = resolveConcertCardFlyerUrl(concert.flyerUrl, concert.id);

                      return (
                      <article
                        key={concert.id}
                        className="rh-media-card group overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-black">
                          <MediaImage
                            src={cardFlyerUrl}
                            alt={`Flyer ${concert.title}`}
                            className="block h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                            fallbackSrc={fallbackFlyer}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/12 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
                              {pipelineLabels[concert.status]}
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <p className="text-sm font-semibold text-white">{concert.title}</p>
                            <p className="text-xs text-white/85">{formatDate(concert.date)}</p>
                          </div>
                        </div>
                        <div className="space-y-3 p-3">
                          <p className="text-xs text-[var(--ui-muted)]">
                            {concert.venue} - {concert.city} - Cap. {concert.capacity}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={concert.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rh-btn-primary inline-flex items-center rounded-xl bg-[var(--ui-primary)] px-3 py-2 text-xs font-semibold text-[var(--ui-on-primary)]"
                            >
                              Ver ticket
                            </a>
                            {(() => {
                              const canAdvanceStage = isLoggedIn && Boolean(user?.id) && concert.userId === user?.id;
                              const isDeleting = deletingConcertId === concert.id;

                              return (
                                <>
                                  <button
                                    type="button"
                                    disabled={!canAdvanceStage}
                                    onClick={() => moveConcertToNextStatus(concert.id)}
                                    className="rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text)] disabled:cursor-not-allowed disabled:opacity-55"
                                    title={canAdvanceStage ? "Avanzar al siguiente estado" : "Solo la persona que creó el concierto puede avanzar etapa"}
                                  >
                                    {canAdvanceStage ? "Avanzar etapa" : "Solo creador"}
                                  </button>
                                  {canAdvanceStage ? (
                                    <button
                                      type="button"
                                      disabled={isDeleting}
                                      onClick={() => openConcertDeleteModal(concert.id)}
                                      className="rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] px-3 py-2 text-xs font-semibold text-[var(--ui-danger)] transition hover:bg-[color:rgb(var(--ui-glow-danger)/0.12)] disabled:cursor-not-allowed disabled:opacity-55"
                                      title="Eliminar concierto"
                                    >
                                      {isDeleting ? "Eliminando..." : "Borrar"}
                                    </button>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </article>
                      );
                    })}
                  </div>
                  {visibleConcerts.length === 0 ? (
                    <p className="mt-4 text-sm text-[var(--ui-muted)]">No hay conciertos publicados para ese filtro.</p>
                  ) : null}
                </article>

                {showConcertCompose && typeof document !== "undefined"
                  ? createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => {
                      if (concertPublishing || concertFlyerUploading) {
                        return;
                      }
                      setShowConcertCompose(false);
                    }}
                  >
                    <div
                      className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="border-b border-[color:var(--ui-border)] px-5 py-4">
                        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Publicar concierto</h2>
                        <p className="mt-1 text-sm text-[var(--ui-muted)]">
                          Completa los datos y sube el flyer para publicar tu show.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowConcertCompose(false)}
                          disabled={concertPublishing || concertFlyerUploading}
                          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-50"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>

                      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
                        {concertFormError ? (
                          <div className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-sm text-[var(--ui-danger)]">
                            {concertFormError}
                          </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Titulo" value={concertForm.title} onChange={(value) => updateConcertFormField("title", value)} error={concertFormFieldErrors.title} />
                          <InputField label="Fecha y hora" type="datetime-local" value={concertForm.date} onChange={(value) => updateConcertFormField("date", value)} error={concertFormFieldErrors.date} />
                          <InputField label="Venue" value={concertForm.venue} onChange={(value) => updateConcertFormField("venue", value)} error={concertFormFieldErrors.venue} />
                          <InputField label="Ciudad" value={concertForm.city} onChange={(value) => updateConcertFormField("city", value)} error={concertFormFieldErrors.city} />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Flyer del concierto</p>
                          <div className="overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]">
                            <div className="p-3">
                              <div className="relative mx-auto aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-xl bg-black">
                              {concertForm.flyerUrl ? (
                                <MediaImage
                                  src={concertForm.flyerUrl}
                                  alt="Preview flyer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-[var(--ui-muted)]">
                                  Aun no has subido un flyer
                                </div>
                              )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--ui-border)] p-3">
                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                {concertFlyerUploading ? "Subiendo..." : concertForm.flyerUrl ? "Cambiar flyer" : "Subir flyer"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={concertFlyerUploading || concertPublishing}
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    if (!file) return;

                                    setConcertFlyerUploading(true);
                                    setConcertFormError(null);
                                    try {
                                      const uploadedFlyerUrl = await uploadConcertFlyer(file);
                                      setConcertForm((prev) => ({ ...prev, flyerUrl: uploadedFlyerUrl }));
                                    } catch (error) {
                                      const message = error instanceof Error ? error.message : "No se pudo subir el flyer.";
                                      setConcertFormError(message);
                                    } finally {
                                      setConcertFlyerUploading(false);
                                    }
                                  }}
                                />
                              </label>
                              {concertForm.flyerUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setConcertForm((prev) => ({ ...prev, flyerUrl: "" }))}
                                  className="rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                                >
                                  Quitar flyer
                                </button>
                              ) : null}
                              <span className="text-xs text-[var(--ui-muted)]">PNG/JPG, max 5MB.</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="URL Ticket" value={concertForm.ticketUrl} onChange={(value) => updateConcertFormField("ticketUrl", value)} error={concertFormFieldErrors.ticketUrl} />
                          <InputField
                            label="Capacidad"
                            value={concertForm.capacity}
                            onChange={(value) =>
                              updateConcertFormField("capacity", value.replace(/[^\d]/g, ""))
                            }
                            error={concertFormFieldErrors.capacity}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-[color:var(--ui-border)] px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setShowConcertCompose(false)}
                          disabled={concertPublishing || concertFlyerUploading}
                          className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handlePublishConcert}
                          disabled={concertPublishing || concertFlyerUploading}
                          className="rh-btn-primary inline-flex items-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {concertPublishing ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                              Publicando...
                            </>
                          ) : (
                            "Publicar concierto"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                ) : null}
              </>
            ) : null}

            {activeSection === "chats" ? (
              <div className="lg:col-span-12 flex h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-[color:var(--ui-border)]">
                {/*  Thread list sidebar  */}
                <div className="flex w-72 shrink-0 flex-col border-r border-[color:var(--ui-border)] bg-[var(--ui-surface)]">

                  {/* Header */}
                  <div className="border-b border-[color:var(--ui-border)] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[var(--ui-text)]">Mensajes</h2>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Nuevo mensaje"
                          onClick={() => { setShowNewChatPanel((v) => !v); setShowNewGroupForm(false); setUserSearchQuery(""); setUserSearchResults([]); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[var(--ui-surface-soft)] ${showNewChatPanel ? "bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-[var(--ui-primary)]" : "text-[var(--ui-muted)]"}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v4M10 10h4"/></svg>
                        </button>
                        <button
                          type="button"
                          title="Nuevo grupo"
                          onClick={() => { setShowNewGroupForm((v) => !v); setShowNewChatPanel(false); setGroupMemberQuery(""); setGroupMemberResults([]); setSelectedGroupMembers([]); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[var(--ui-surface-soft)] ${showNewGroupForm ? "bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-[var(--ui-primary)]" : "text-[var(--ui-muted)]"}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 10v4M19 12h4"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Thread search */}
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1.5">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <input
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Buscar conversacion..."
                        className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                      />
                    </div>
                  </div>

                  {/*  New direct chat panel  */}
                  {showNewChatPanel && (
                    <div className="border-b border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-3">
                      <p className="mb-2 text-xs font-semibold text-[var(--ui-muted)] uppercase tracking-wide">Escribirle a alguien</p>
                      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                          autoFocus
                          value={userSearchQuery}
                          onChange={(e) => { setUserSearchQuery(e.target.value); void searchUsersForChat(e.target.value, false); }}
                          placeholder="Buscar por nombre o email..."
                          className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                        />
                        {userSearchLoading && <span className="text-[10px] text-[var(--ui-muted)]">...</span>}
                      </div>
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                        {userSearchResults.length === 0 && userSearchQuery.length > 0 && !userSearchLoading && (
                          <p className="py-2 text-center text-xs text-[var(--ui-muted)]">Sin resultados</p>
                        )}
                        {userSearchResults.length === 0 && userSearchQuery.length === 0 && (
                          <p className="py-2 text-center text-xs text-[var(--ui-muted)]">Escribe un nombre para buscar</p>
                        )}
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => void handleNewDirectChat(u.id)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--ui-surface)]"
                          >
                            <UserAvatar
                              name={u.name}
                              avatarUrl={u.avatarUrl}
                              className="h-8 w-8"
                              initialsClassName="bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[var(--ui-text)]">{u.name}</p>
                              <p className="truncate text-[10px] text-[var(--ui-muted)]">{u.email}</p>
                              {u.musicianType && <p className="truncate text-[10px] text-[var(--ui-muted)]">{u.musicianType}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/*  New group panel  */}
                  {showNewGroupForm && (
                    <div className="border-b border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-3 space-y-2">
                      <p className="text-xs font-semibold text-[var(--ui-muted)] uppercase tracking-wide">Crear grupo</p>
                      <input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Nombre del grupo"
                        className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-xs text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                      />
                      {/* Member search */}
                      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                          value={groupMemberQuery}
                          onChange={(e) => { setGroupMemberQuery(e.target.value); void searchUsersForChat(e.target.value, true); }}
                          placeholder="Agregar miembros..."
                          className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                        />
                      </div>
                      {/* Member search results */}
                      {groupMemberResults.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-0.5 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-1">
                          {groupMemberResults.filter((r) => !selectedGroupMembers.some((s) => s.id === r.id)).map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => { setSelectedGroupMembers((prev) => [...prev, { id: u.id, name: u.name, avatarUrl: u.avatarUrl }]); setGroupMemberQuery(""); setGroupMemberResults([]); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[var(--ui-surface-soft)]"
                            >
                              <UserAvatar
                                name={u.name}
                                avatarUrl={u.avatarUrl}
                                className="h-6 w-6"
                                initialsClassName="bg-[var(--ui-primary)] text-[10px] font-bold text-[var(--ui-on-primary)]"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[var(--ui-text)]">{u.name}</p>
                                <p className="truncate text-[10px] text-[var(--ui-muted)]">{u.email}</p>
                              </div>
                              {u.primaryInstrument && <span className="ml-auto shrink-0 text-[var(--ui-muted)]">{u.primaryInstrument}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Selected members chips */}
                      {selectedGroupMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedGroupMembers.map((m) => (
                            <span key={m.id} className="flex items-center gap-1 rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.18)] px-2 py-0.5 text-[11px] text-[var(--ui-primary)]">
                              <UserAvatar
                                name={m.name}
                                avatarUrl={m.avatarUrl}
                                className="h-4 w-4"
                                initialsClassName="bg-[var(--ui-primary)] text-[8px] font-bold text-[var(--ui-on-primary)]"
                              />
                              {m.name}
                              <button type="button" onClick={() => setSelectedGroupMembers((prev) => prev.filter((x) => x.id !== m.id))} className="ml-0.5 text-[var(--ui-primary)] hover:text-[var(--ui-danger)]">x</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void createGroupThread()}
                        disabled={!newGroupName.trim() || groupCreating}
                        className="w-full rounded-xl bg-[var(--ui-primary)] py-2 text-xs font-semibold text-[var(--ui-on-primary)] disabled:opacity-50"
                      >
                        {groupCreating ? "Creando..." : `Crear grupo${selectedGroupMembers.length > 0 ? ` (${selectedGroupMembers.length} miembro${selectedGroupMembers.length !== 1 ? "s" : ""})` : ""}`}
                      </button>
                    </div>
                  )}

                  {/* Thread list */}
                  <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
                    {threads.filter((t) => {
                      const q = chatSearch.trim().toLowerCase();
                      if (!q) return true;
                      const name = t.isGroup ? (t.groupName ?? "") : t.contact;
                      return name.toLowerCase().includes(q);
                    }).length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                        <span className="text-3xl">💬</span>
                        <p className="text-xs text-[var(--ui-muted)]">{chatSearch ? "Sin resultados" : "No tienes chats aún."}</p>
                        {!chatSearch && (
                          <button
                            type="button"
                            onClick={() => { setShowNewChatPanel(true); setShowNewGroupForm(false); }}
                            className="mt-1 rounded-xl bg-[var(--ui-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-on-primary)]"
                          >
                            Iniciar conversacion
                          </button>
                        )}
                      </div>
                    ) : threads.filter((t) => {
                      const q = chatSearch.trim().toLowerCase();
                      if (!q) return true;
                      const name = t.isGroup ? (t.groupName ?? "") : t.contact;
                      return name.toLowerCase().includes(q);
                    }).map((thread) => {
                      const unread = thread.messages.some((m) => m.sender === "them" && m.unread);
                      const isActive = thread.id === activeThread?.id;
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => openThread(thread.id)}
                          className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${isActive ? "bg-[color:rgb(var(--ui-glow-primary)/0.12)] ring-1 ring-[color:rgb(var(--ui-glow-primary)/0.4)]" : "hover:bg-[var(--ui-surface-soft)]"}`}
                        >
                          {thread.isGroup ? (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-base">
                              👥
                            </span>
                          ) : (
                            <UserAvatar
                              name={thread.contact}
                              avatarUrl={thread.avatar}
                              className="h-9 w-9"
                              initialsClassName="bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--ui-text)]">
                              {thread.isGroup ? thread.groupName : thread.contact}
                            </p>
                            <p className="truncate text-[10px] text-[var(--ui-muted)]">
                              {lastMsg ? (lastMsg.sender === "me" ? "Tú: " : "") + lastMsg.text : (thread.isGroup ? `Grupo  ${(thread.memberIds ?? []).length} miembro(s)` : thread.role)}
                            </p>
                          </div>
                          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ui-danger)]" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/*  Chat window  */}
                <div className="flex flex-1 flex-col overflow-hidden bg-[var(--ui-bg)]">
                  {activeThread ? (
                    <>
                      {/* Header */}
                      <div className="flex items-center gap-3 border-b border-[color:var(--ui-border)] px-5 py-3">
                        {activeThread.isGroup ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-sm">👥</span>
                        ) : (
                          <UserAvatar
                            name={activeThread.contact}
                            avatarUrl={activeThread.avatar}
                            className="h-8 w-8"
                            initialsClassName="bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--ui-text)]">
                            {activeThread.isGroup ? activeThread.groupName : activeThread.contact}
                          </p>
                          <p className="text-xs text-[var(--ui-muted)]">
                            {activeThread.isGroup
                              ? `Grupo  ${(activeThread.memberIds ?? []).length} miembro(s)`
                              : activeThread.role || "Musico"}
                          </p>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 space-y-2 overflow-y-auto p-4">
                        {activeThread.messages.length === 0 ? (
                          <p className="text-center text-sm text-[var(--ui-muted)]">
                            Aún no hay mensajes. ¡Di algo!
                          </p>
                        ) : activeThread.messages.map((message) => (
                          <div key={message.id} className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm transition-opacity ${message.sender === "me" ? "bg-[var(--ui-primary)] text-[var(--ui-on-primary)]" : "border border-[color:var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]"} ${message.status === "sending" ? "opacity-60" : "opacity-100"}`}>
                              <p>{isLoggedIn ? message.text : "Contenido visible al iniciar sesion."}</p>
                              <p className={`mt-1 text-[10px] ${message.sender === "me" ? "text-[var(--ui-on-primary)]/70" : "text-[var(--ui-muted)]"}`}>{message.at}</p>
                            </div>
                            {message.sender === "me" && (
                              <span className="mt-0.5 text-[10px] text-[var(--ui-muted)]">
                                {message.status === "sending" && "Enviando..."}
                                {message.status === "sent" && "Enviado ✓"}
                                {message.status === "error" && (
                                  <span className="text-[var(--ui-danger)]">Error al enviar</span>
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="border-t border-[color:var(--ui-border)] p-3">
                        <div className="flex gap-2">
                          <input
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void sendMessage();
                              }
                            }}
                            placeholder="Escribe un mensaje... (Enter para enviar)"
                            className="rh-input flex-1 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-2.5 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)]"
                          />
                          <button
                            type="button"
                            onClick={() => void sendMessage()}
                            className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                      <span className="text-5xl">💬</span>
                      <p className="text-sm font-semibold text-[var(--ui-text)]">Tus mensajes</p>
                      <p className="text-xs text-[var(--ui-muted)]">Selecciona un chat o escrbele a alguien nuevo</p>
                      <button
                        type="button"
                        onClick={() => { setShowNewChatPanel(true); setShowNewGroupForm(false); }}
                        className="mt-1 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90"
                      >
                        Nuevo mensaje
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === "jobs" ? (
              <>
                {/*  Publish opportunity modal  */}
                {showJobCompose && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setShowJobCompose(false)}
                  >
                    <div
                      className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="border-b border-[color:var(--ui-border)] px-5 py-4">
                        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Publicar oportunidad</h2>
                        <button
                          type="button"
                          onClick={() => setShowJobCompose(false)}
                          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)]"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="max-h-[75vh] overflow-y-auto p-5 space-y-3">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Titulo del puesto</span>
                          <input value={jobComposeForm.title} onChange={(e) => setJobComposeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej. Bajista para gira" className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Tipo</span>
                            <select value={jobComposeForm.type} onChange={(e) => setJobComposeForm((p) => ({ ...p, type: e.target.value }))} className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none">
                              {["Evento", "Estudio", "Proyecto", "Residencia", "Otro"].map((t) => <option key={t}>{t}</option>)}
                            </select>
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Ciudad</span>
                            <input value={jobComposeForm.city} onChange={(e) => setJobComposeForm((p) => ({ ...p, city: e.target.value }))} placeholder="Santo Domingo, Santiago..." className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                          </label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Pago / compensacion</span>
                            <input value={jobComposeForm.pay} onChange={(e) => setJobComposeForm((p) => ({ ...p, pay: e.target.value }))} placeholder="USD 300 / show" className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Fecha limite</span>
                            <input type="date" value={jobComposeForm.deadline} onChange={(e) => setJobComposeForm((p) => ({ ...p, deadline: e.target.value }))} className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Resumen (una linea)</span>
                          <input value={jobComposeForm.summary} onChange={(e) => setJobComposeForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Descripcion corta visible en el listado" className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Descripcion completa</span>
                          <textarea rows={3} value={jobComposeForm.description} onChange={(e) => setJobComposeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Contexto, detalles del proyecto, que esperas del musico..." className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Requisitos (uno por linea)</span>
                          <textarea rows={3} value={jobComposeForm.requirements} onChange={(e) => setJobComposeForm((p) => ({ ...p, requirements: e.target.value }))} placeholder={"Experiencia en tarima\nEquipo propio\nDisponibilidad fines de semana"} className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none" />
                        </label>
                        {/* CV toggle */}
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3">
                          <span className="flex-1 text-sm text-[var(--ui-text)]">
                            <span className="font-semibold">Solicitar CV</span>
                            <span className="ml-1 text-[var(--ui-muted)]">los postulantes deben adjuntar su curriculum</span>
                          </span>
                          <div
                            role="checkbox"
                            aria-checked={jobComposeForm.requiresCv}
                            tabIndex={0}
                            onClick={() => setJobComposeForm((p) => ({ ...p, requiresCv: !p.requiresCv }))}
                            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setJobComposeForm((p) => ({ ...p, requiresCv: !p.requiresCv })); } }}
                            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] ${jobComposeForm.requiresCv ? "bg-[var(--ui-primary)]" : "bg-[var(--ui-border)]"}`}
                          >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${jobComposeForm.requiresCv ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </label>

                        <button
                          type="button"
                          disabled={!jobComposeForm.title.trim() || !jobComposeForm.city.trim()}
                          onClick={async () => {
                            const requirementsArr = jobComposeForm.requirements.trim()
                              ? jobComposeForm.requirements.split("\n").map((r) => r.trim()).filter(Boolean)
                              : [];
                            if (isAdmin) {
                              const res = await fetch("/api/jobs", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  title: jobComposeForm.title.trim(),
                                  type: jobComposeForm.type,
                                  city: jobComposeForm.city.trim(),
                                  pay: jobComposeForm.pay.trim() || "A convenir",
                                  summary: jobComposeForm.summary.trim(),
                                  description: jobComposeForm.description.trim(),
                                  requirements: requirementsArr,
                                  deadline: jobComposeForm.deadline || "",
                                  requiresCv: jobComposeForm.requiresCv,
                                  requesterName: user?.name ?? "Admin",
                                  requesterRole: "Publicado por admin",
                                }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                const j = data.job;
                                setJobs((prev) => [{
                                  id: j.id,
                                  title: j.title,
                                  type: j.type,
                                  city: j.city,
                                  image: j.imageUrl,
                                  pay: j.pay,
                                  summary: j.summary,
                                  description: j.description,
                                  requiresCv: j.requiresCv,
                                  requester: j.requesterName,
                                  requesterRole: j.requesterRole,
                                  requirements: j.requirements,
                                  deadline: j.deadline,
                                } as JobItem, ...prev]);
                              } else {
                                window.alert("No se pudo publicar la oportunidad.");
                                return;
                              }
                            } else {
                              const newJob: JobItem = {
                                id: `j-${Date.now()}`,
                                title: jobComposeForm.title.trim(),
                                type: jobComposeForm.type,
                                city: jobComposeForm.city.trim(),
                                image: `https://source.unsplash.com/900x600/?music,musician`,
                                pay: jobComposeForm.pay.trim() || "A convenir",
                                summary: jobComposeForm.summary.trim(),
                                description: jobComposeForm.description.trim() || undefined,
                                requiresCv: jobComposeForm.requiresCv,
                                requester: user?.name ?? "Tu",
                                requesterRole: "Publicado por ti",
                                requirements: requirementsArr.length ? requirementsArr : undefined,
                                deadline: jobComposeForm.deadline || undefined,
                              };
                              setJobs((prev) => [newJob, ...prev]);
                            }
                            setJobComposeForm({ title: "", type: "Evento", city: "", pay: "", summary: "", description: "", requirements: "", deadline: "", requiresCv: false });
                            setShowJobCompose(false);
                          }}
                          className="w-full rounded-2xl bg-[var(--ui-primary)] px-4 py-3 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          Publicar oportunidad
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/*  Filter bar (compact, no big card)  */}
                <div className="lg:col-span-12">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                          value={jobSearch}
                          onChange={(event) => setJobSearch(event.target.value)}
                          placeholder="Buscar oportunidades..."
                          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                        />
                      </div>
                      <select
                        value={jobCity}
                        onChange={(event) => setJobCity(event.target.value)}
                        className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                      >
                        <option value="all">Todas las ciudades</option>
                        {uniqueCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <select
                        value={jobType}
                        onChange={(event) => setJobType(event.target.value)}
                        className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                      >
                        <option value="all">Todos los tipos</option>
                        {uniqueTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {isLoggedIn && (
                        <button
                          type="button"
                          onClick={() => setShowJobCompose(true)}
                          className="flex items-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)]"
                        >
                          <span>+</span> Publicar oportunidad
                        </button>
                      )}
                    </div>

                    {/*  Job listing rows  */}
                    <div className="space-y-2">
                      {filteredJobs.map((job) => {
                        const applied = applications[job.id] !== undefined;
                        return (
                          <div
                            key={job.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { setSelectedJob(job); setApplyError(null); setCvFile(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedJob(job); setApplyError(null); setCvFile(null); } }}
                            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-3 transition hover:border-[color:rgb(var(--ui-glow-primary)/0.35)] hover:bg-[var(--ui-surface-soft)]"
                          >
                            {/* Thumbnail */}
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                              <MediaImage src={job.image} alt={job.title} className="h-full w-full object-cover" />
                            </div>
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[var(--ui-text)]">{job.title}</p>
                                  <p className="mt-0.5 text-xs text-[var(--ui-muted)]">{job.requester ?? "Anonimo"}  {job.requesterRole ?? job.type}</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <span className="rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.15)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-text)]">
                                    {job.pay}
                                  </span>
                                  {applied && (
                                    <span className="rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.18)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-accent)]">Postulado ✓</span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--ui-muted)]">
                                <span className="rounded-full border border-[color:var(--ui-border)] px-2 py-0.5">{job.type}</span>
                                <span>{job.city}</span>
                                {job.requiresCv && (
                                  <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-amber-400">CV requerido</span>
                                )}
                                {job.deadline && (
                                  <span className="ml-auto">Cierre: {new Date(job.deadline).toLocaleDateString("es-DO")}</span>
                                )}
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); void adminDeleteJob(job.id); }}
                                    className="rounded-full border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-2 py-0.5 text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.18)]"
                                  >
                                    Delete Job
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredJobs.length === 0 && (
                        <p className="py-10 text-center text-sm text-[var(--ui-muted)]">No se encontraron oportunidades con esos filtros.</p>
                      )}
                    </div>
                </div>
              </>
            ) : null}

            {activeSection === "courses" ? (
              <>
                <article className="rh-card rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6 lg:col-span-12">
                  <div className="grid gap-5 xl:grid-cols-[1.28fr_0.72fr]">
                    <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.2)] bg-[linear-gradient(135deg,rgb(var(--ui-glow-primary)/0.16),rgb(var(--ui-glow-accent)/0.12))] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ui-muted)]">
                        Academia RitmoHub
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[var(--ui-text)]">
                        Vende cursos y gestiona pagos en vivo
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm text-[var(--ui-muted)]">
                        Este panel combina cursos premium con checkout en vivo para validar pagos,
                        redireccion y estados de compra en tiempo real.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[color:rgb(var(--ui-glow-primary)/0.34)] bg-[color:rgb(var(--ui-glow-primary)/0.16)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]">
                          {courseAnalytics.total} cursos activos
                        </span>
                        <span className="rounded-full border border-[color:rgb(var(--ui-glow-accent)/0.34)] bg-[color:rgb(var(--ui-glow-accent)/0.16)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]">
                          {courseAnalytics.premiumCourses} cursos premium
                        </span>
                        <span className="rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]">
                          Ticket promedio USD {courseAnalytics.averageTicket.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-muted)]">
                        Vista previa
                      </p>
                      {selectedCoursePreview ? (
                        <>
                          <h4 className="mt-2 text-lg font-semibold text-[var(--ui-text)]">
                            {selectedCoursePreview.course.title}
                          </h4>
                          <p className="mt-1 text-sm text-[var(--ui-muted)]">
                            {selectedCoursePreview.course.instructor}
                          </p>
                          <div className="mt-4 space-y-2">
                            {selectedCoursePreview.modules.slice(0, 4).map((module) => (
                              <div
                                key={module.id}
                                className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                                  Modulo {module.position} - {module.lessonType}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{module.title}</p>
                                <p className="mt-1 text-xs text-[var(--ui-muted)]">
                                  Duracion: {module.durationMinutes} min
                                </p>
                              </div>
                            ))}
                            {selectedCoursePreview.modules.length === 0 ? (
                              <p className="text-sm text-[var(--ui-muted)]">
                                Este curso no tiene modulos de vista previa.
                              </p>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--ui-muted)]">
                          Selecciona un curso para ver sus modulos principales.
                        </p>
                      )}
                    </div>
                  </div>
                  </article>

                <div className="grid gap-5 lg:col-span-12 lg:grid-cols-[17rem_1fr] xl:grid-cols-[18.5rem_1fr]">
                  <aside className="rh-card rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:sticky lg:top-24 lg:h-fit">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted)]">Filtros</p>
                    <h4 className="mt-2 text-lg font-semibold text-[var(--ui-text)]">Catalogo de cursos</h4>
                    <p className="mt-1 text-xs text-[var(--ui-muted)]">
                      {courseOwnershipStats.owned} desbloqueados  {courseOwnershipStats.unowned} por comprar
                    </p>

                    <div className="mt-4 space-y-5">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Buscar</span>
                        <input
                          type="search"
                          value={courseSearch}
                          onChange={(event) => setCourseSearch(event.target.value)}
                          placeholder="Titulo, instructor o tema"
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                        />
                      </label>

                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Disponibilidad</p>
                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => setCourseOwnershipFilter("all")}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              courseOwnershipFilter === "all"
                                ? "border-[color:rgb(var(--ui-glow-primary)/0.48)] bg-[color:rgb(var(--ui-glow-primary)/0.16)] text-[var(--ui-text)]"
                                : "border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                            }`}
                          >
                            Todos ({courseAnalytics.total})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseOwnershipFilter("owned")}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              courseOwnershipFilter === "owned"
                                ? "border-[color:rgb(var(--ui-glow-accent)/0.48)] bg-[color:rgb(var(--ui-glow-accent)/0.16)] text-[var(--ui-text)]"
                                : "border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                            }`}
                          >
                            Ya los poseo ({courseOwnershipStats.owned})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseOwnershipFilter("not-owned")}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              courseOwnershipFilter === "not-owned"
                                ? "border-[color:rgb(var(--ui-glow-primary)/0.48)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-[var(--ui-text)]"
                                : "border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                            }`}
                          >
                            No los tengo ({courseOwnershipStats.unowned})
                          </button>
                        </div>
                        {!isLoggedIn ? (
                          <p className="text-[11px] text-[var(--ui-muted)]">
                            Inicia sesion para detectar tus cursos comprados.
                          </p>
                        ) : null}
                      </div>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nivel</span>
                        <select
                          value={courseLevelFilter}
                          onChange={(event) => setCourseLevelFilter(event.target.value)}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          {courseLevels.map((level, index) => (
                            <option key={`${level}-${index}`} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Topico</span>
                        <select
                          value={courseTopicFilter}
                          onChange={(event) => setCourseTopicFilter(event.target.value as CourseTopic | "Todos")}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          {courseTopics.map((topic, index) => (
                            <option key={`${topic}-${index}`} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Costo</span>
                        <select
                          value={courseCostFilter}
                          onChange={(event) => setCourseCostFilter(event.target.value as CourseCostFilter)}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          <option value="all">Todos</option>
                          <option value="low">Economico (hasta USD 40)</option>
                          <option value="mid">Medio (USD 41 - 70)</option>
                          <option value="high">Premium (mas de USD 70)</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Duracion</span>
                        <select
                          value={courseDurationFilter}
                          onChange={(event) => setCourseDurationFilter(event.target.value as CourseDurationFilter)}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          <option value="all">Todas</option>
                          <option value="short">Corta (menos de 2.5h)</option>
                          <option value="medium">Media (2.5h a 3.8h)</option>
                          <option value="long">Larga (mas de 3.8h)</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Orden</span>
                        <select
                          value={courseSort}
                          onChange={(event) =>
                            setCourseSort(event.target.value as "newest" | "price-asc" | "price-desc")
                          }
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          <option value="newest">Mas reciente</option>
                          <option value="price-asc">Precio menor</option>
                          <option value="price-desc">Precio mayor</option>
                        </select>
                      </label>

                      <label className="space-y-1 pt-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Proveedor</span>
                        <select
                          value={paymentProvider}
                          onChange={(event) => setPaymentProvider(event.target.value as "stripe" | "paypal")}
                          className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] outline-none"
                        >
                          <option value="stripe">Stripe</option>
                          <option value="paypal">PayPal</option>
                        </select>
                        {paymentProvider === "paypal" ? (
                          <a
                            href={paypalMeCheckoutBaseUrl}
                            className="inline-flex text-[11px] font-semibold text-[var(--ui-primary)] hover:underline"
                          >
                            PayPal directo: paypal.me/iClexiG
                          </a>
                        ) : null}
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setCourseSearch("");
                          setCourseOwnershipFilter("all");
                          setCourseLevelFilter("Todos");
                          setCourseTopicFilter("Todos");
                          setCourseCostFilter("all");
                          setCourseDurationFilter("all");
                          setCourseSort("newest");
                        }}
                        className="mt-2 w-full rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </aside>

                  <div className="grid gap-5 lg:grid-cols-12">
                    {featuredCourse ? (
                      <article className="rh-card rh-media-card group overflow-hidden rounded-3xl border border-[color:rgb(var(--ui-glow-primary)/0.32)] bg-[var(--ui-surface)] lg:col-span-12">
                        <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
                          <div className="relative min-h-[16rem] overflow-hidden bg-black lg:min-h-[17rem]">
                            <MediaImage
                              src={featuredCourse.imageUrl}
                              alt={featuredCourse.title}
                              className="absolute inset-0 block h-full w-full object-cover transform-gpu"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/52 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.2)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]">
                                  Curso destacado
                                </span>
                              </div>
                              <h4 className="mt-2 text-2xl font-semibold text-[var(--ui-text)]">{featuredCourse.title}</h4>
                              <p className="mt-1 text-sm text-[var(--ui-muted)]">
                                {featuredCourse.instructor} - Nivel {featuredCourse.level}
                              </p>
                            </div>
                          </div>
                          <div className="p-5">
                            {(() => {
                              const featuredPurchaseState = purchaseStatusByCourse.get(featuredCourse.id);
                              const featuredIsPaid = featuredPurchaseState === "paid";
                              const featuredHours = getCourseDurationHours(featuredCourse);
                              const featuredModuleCount = getCourseModuleCount(featuredHours);
                              const featuredTopic = getCourseTopic(featuredCourse);
                              return (
                                <>
                            <p className="text-sm text-[var(--ui-muted)]">
                              {isLoggedIn
                                ? featuredCourse.summary
                                : "Inicia sesion para ver el detalle completo y desbloquear el checkout."}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                                {featuredModuleCount} lecciones
                              </span>
                              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                                {featuredHours.toFixed(1)}h de contenido
                              </span>
                              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                                Topico: {featuredTopic}
                              </span>
                            </div>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-3xl font-semibold text-[var(--ui-text)]">
                                USD {featuredCourse.priceUsd.toFixed(2)}
                              </p>
                              {featuredIsPaid ? (
                                <Link
                                  href={`/courses/${featuredCourse.id}/learn`}
                                  className="rh-btn-primary rounded-xl bg-[var(--ui-accent)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)]"
                                >
                                  Entrar al curso →
                                </Link>
                              ) : (
                                <Link
                                  href={`/academiax/courses/${featuredCourse.id}`}
                                  className="rh-btn-primary rounded-xl bg-[var(--ui-primary)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)]"
                                >
                                  Ver curso completo
                                </Link>
                              )}
                            </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </article>
                    ) : null}

                    {visibleCourses.map((course) => {
                      const purchaseState = purchaseStatusByCourse.get(course.id);
                      const isBuying = purchaseLoading === course.id;
                      const isPaid = purchaseState === "paid";
                      const courseHours = getCourseDurationHours(course);
                      const moduleCount = getCourseModuleCount(courseHours);
                      const hours = courseHours.toFixed(1);
                      const courseTopic = getCourseTopic(course);
                      return (
                        <article
                          key={course.id}
                          className="rh-card rh-media-card group flex h-full flex-col overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] lg:col-span-6 xl:col-span-4"
                        >
                          {/* Clickable image → course detail page */}
                          <Link href={`/academiax/courses/${course.id}`} className="relative block overflow-hidden bg-black">
                            <MediaImage src={course.imageUrl} alt={course.title} className="block h-48 w-full object-cover transition duration-500 ease-out transform-gpu" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/52 via-black/10 to-transparent" />
                            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ui-text)]">
                                {course.level}
                              </span>
                              <span className="rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.22)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ui-text)]">
                                {courseTopic}
                              </span>
                            </div>
                            {isPaid ? (
                              <span className="absolute right-3 top-3 rounded-full bg-[var(--ui-accent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ui-on-primary)]">
                                Desbloqueado
                              </span>
                            ) : null}
                          </Link>
                          <div className="flex h-full flex-col gap-3 p-4">
                            <div>
                              <Link href={`/academiax/courses/${course.id}`} className="hover:text-[var(--ui-primary)]">
                                <h4 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-[var(--ui-text)]">{course.title}</h4>
                              </Link>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ui-muted)]">
                                <span className="max-w-full truncate rounded-full bg-[var(--ui-surface-soft)] px-2 py-0.5">
                                  {course.instructor}
                                </span>
                                <span className="rounded-full bg-[var(--ui-surface-soft)] px-2 py-0.5">
                                  {moduleCount} modulos
                                </span>
                                <span className="rounded-full bg-[var(--ui-surface-soft)] px-2 py-0.5">
                                  {hours}h
                                </span>
                              </div>
                            </div>
                            <p className="line-clamp-2 min-h-[3.25rem] text-sm text-[var(--ui-muted)]">
                              {course.summary}
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              <p className="text-xl font-semibold text-[var(--ui-text)]">USD {course.priceUsd.toFixed(2)}</p>
                              {purchaseState && purchaseState !== "paid" ? (
                                <span className="rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-3 py-1 text-xs font-semibold text-[var(--ui-accent)]">
                                  {purchaseState === "pending" ? "Pendiente" : "Fallido"}
                                </span>
                              ) : null}
                            </div>
                            {isAdmin ? (
                              <div className="flex gap-2">
                                <Link
                                  href={`/academiax/courses/${course.id}/edit`}
                                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-center text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
                                >
                                  Editar curso
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => void adminDeleteCourse(course.id)}
                                  className="h-10 flex-1 rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-3 py-2 text-xs font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.15)]"
                                >
                                  Eliminar curso
                                </button>
                              </div>
                            ) : null}
                            {/* Primary CTA */}
                            {isPaid ? (
                              <Link
                                href={`/academiax/courses/${course.id}/learn`}
                                className="rh-btn-primary flex w-full items-center justify-center rounded-xl bg-[var(--ui-accent)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)]"
                              >
                                Entrar al curso →
                              </Link>
                            ) : (
                              <div className="flex gap-2">
                                <Link
                                  href={`/academiax/courses/${course.id}`}
                                  className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
                                >
                                  Ver detalle
                                </Link>
                                <button
                                  type="button"
                                  disabled={!isLoggedIn || isBuying}
                                  onClick={() => void startCourseCheckout(course.id, paymentProvider)}
                                  className="rh-btn-primary flex-1 rounded-xl bg-[var(--ui-primary)] px-3 py-2 text-xs font-semibold text-[var(--ui-on-primary)] disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                  {isBuying
                                    ? "Redirigiendo..."
                                    : `Comprar  ${paymentProvider === "stripe" ? "Stripe" : "PayPal"}`}
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {visibleCourses.length === 0 ? (
                      <article className="rh-card rounded-3xl border border-dashed border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-8 text-center lg:col-span-12">
                        <h4 className="text-lg font-semibold text-[var(--ui-text)]">No hay cursos para este filtro</h4>
                        <p className="mt-2 text-sm text-[var(--ui-muted)]">
                          Ajusta propiedad, costo, duracion o topico para ver mas resultados.
                        </p>
                      </article>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </section>

          {activeSectionLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/38 backdrop-blur-sm">
              <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/95 px-6 py-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--ui-text)]">Cargando</span>
                  <span className="rh-jobs-loading-dot-track" aria-hidden>
                    <span className="rh-jobs-loading-dot" />
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--ui-muted)]">Actualizando datos desde la base de datos…</p>
              </div>
            </div>
          )}
        </div>

        {activeSectionError && !activeSectionLoading ? (
          <p className="mt-3 rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-sm text-[var(--ui-danger)]">
            {activeSectionError}
          </p>
        ) : null}
      </div>

      {concertDeleteTarget && typeof document !== "undefined"
        ? createPortal(
          <div
            className="fixed inset-0 z-[161] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={closeConcertDeleteModal}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[color:var(--ui-border)] px-5 py-4">
                <h2 className="text-lg font-semibold text-[var(--ui-text)]">Eliminar concierto</h2>
              </div>
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm text-[var(--ui-muted)]">
                  Se eliminara de forma permanente el concierto
                  {" "}
                  <span className="font-semibold text-[var(--ui-text)]">{concertDeleteTarget.title}</span>.
                </p>
                {concertDeleteError ? (
                  <div className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-sm text-[var(--ui-danger)]">
                    {concertDeleteError}
                  </div>
                ) : null}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeConcertDeleteModal}
                    disabled={deletingConcertId !== null}
                    className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteOwnedConcert(concertDeleteTarget.id)}
                    disabled={deletingConcertId !== null}
                    className="rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-4 py-2 text-sm font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.15)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {deletingConcertId === concertDeleteTarget.id ? "Eliminando..." : "Eliminar concierto"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        ) : null}

      {adminDeleteTarget && adminDeleteModalCopy && typeof document !== "undefined"
        ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={closeAdminDeleteModal}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[color:var(--ui-border)] px-5 py-4">
                <h2 className="text-lg font-semibold text-[var(--ui-text)]">{adminDeleteModalCopy.title}</h2>
              </div>
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm text-[var(--ui-muted)]">{adminDeleteModalCopy.message}</p>
                {adminDeleteError ? (
                  <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-3 py-2 text-sm text-[var(--ui-danger)]">
                    {adminDeleteError}
                  </p>
                ) : null}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAdminDeleteModal}
                    disabled={adminDeletePending}
                    className="rounded-xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-55"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmAdminDelete()}
                    disabled={adminDeletePending}
                    className="rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-4 py-2 text-sm font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.16)] disabled:opacity-55"
                  >
                    {adminDeletePending ? "Eliminando..." : adminDeleteModalCopy.confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rh-input w-full rounded-xl border bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none ${error ? "border-[var(--ui-danger)]" : "border-[color:var(--ui-border)]"}`}
      />
      {error ? <span className="text-xs text-[var(--ui-danger)]">{error}</span> : null}
    </label>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-DO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = date.getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  return rtf.format(Math.round(diffMs / day), "day");
}

function dedupeConcertItems(items: ConcertItem[]) {
  const seen = new Set<string>();
  const unique: ConcertItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

function pickConcertCardFallbackFlyer(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return concertCardFallbackFlyers[hash % concertCardFallbackFlyers.length];
}

function resolveConcertCardFlyerUrl(rawFlyerUrl: string | null | undefined, concertId: string) {
  const flyerUrl = rawFlyerUrl?.trim() ?? "";
  const normalizedFlyerUrl = flyerUrl.toLowerCase();
  const isMissing =
    flyerUrl.length === 0 ||
    normalizedFlyerUrl === "undefined" ||
    normalizedFlyerUrl === "null";
  const isRitmoHubVisualFallback = normalizedFlyerUrl === "/placeholders/media-fallback.svg";
  const isLegacyFlyerSvg =
    normalizedFlyerUrl.startsWith("/flyers/") && normalizedFlyerUrl.endsWith(".svg");

  if (isMissing || isRitmoHubVisualFallback || isLegacyFlyerSvg) {
    return pickConcertCardFallbackFlyer(concertId);
  }

  return flyerUrl;
}

function UserAvatar({
  name,
  avatarUrl,
  className,
  initialsClassName,
}: {
  name: string;
  avatarUrl?: string | null;
  className: string;
  initialsClassName: string;
}) {
  const normalizedAvatarUrl = avatarUrl?.trim() ?? "";

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}>
      <span className={`absolute inset-0 flex items-center justify-center ${initialsClassName}`}>
        {getAuthorInitials(name)}
      </span>
      {normalizedAvatarUrl ? (
        <img
          src={normalizedAvatarUrl}
          alt={name}
          loading="lazy"
          className="relative z-10 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}

function MediaImage({
  src,
  alt,
  className,
  fallbackSrc = "/placeholders/media-fallback.svg",
}: {
  src: string;
  alt: string;
  className: string;
  fallbackSrc?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(event) => {
        const target = event.currentTarget;
        target.onerror = null;
        target.src = fallbackSrc;
      }}
    />
  );
}

function SidebarIcon({ id }: { id: SectionId }) {
  const className = "h-4 w-4";
  if (id === "band") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M8 7a4 4 0 1 0 0.001 8.001A4 4 0 0 0 8 7Z" /><path d="M16 9a3 3 0 1 0 0.001 6.001A3 3 0 0 0 16 9Z" /><path d="M2 21c0-3 2.5-5 6-5s6 2 6 5" /><path d="M13 21c0-2.2 1.8-3.8 4.5-3.8S22 18.8 22 21" /></svg>;
  if (id === "profile") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  if (id === "shows") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M3 7h18v13H3z" /><path d="M8 3v8M16 3v8M3 11h18" /></svg>;
  if (id === "communities") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M4 5h16v10H8l-4 4V5Z" /><path d="M8 9h8M8 12h6" /></svg>;
  if (id === "chats") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M3 5h18v11H8l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></svg>;
  if (id === "jobs") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>;
  if (id === "courses") return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="M4 5h8a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5Z" /><path d="M20 5h-8a3 3 0 0 0-3 3v11h8a3 3 0 0 1 3 3V5Z" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2"><path d="m14 2-7 8h5l-2 12 9-12h-5l2-8Z" /></svg>;
}



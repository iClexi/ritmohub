
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createUser } from "@/lib/db";

const SEED_USERS = [
  {
    name: "Laura Pérez",
    email: "laura.perez@musisec.app",
    musicianType: "Manager",
    primaryInstrument: "",
    bio: "Manager artística con 10 años de experiencia en la escena musical caribeña.",
    orientation: "Profesional",
    studies: "Administración de Empresas Artísticas",
  },
  {
    name: "Santi Díaz",
    email: "santi.diaz@musisec.app",
    musicianType: "Productor",
    primaryInstrument: "DAW",
    bio: "Beatmaker y productor urbano con créditos en más de 50 lanzamientos.",
    orientation: "Productor",
    studies: "Ingeniería de Sonido",
  },
  {
    name: "Diego Mora",
    email: "diego.mora@musisec.app",
    musicianType: "Visuales",
    primaryInstrument: "",
    bio: "Director creativo especializado en visuales para conciertos y videoclips.",
    orientation: "Creativo",
    studies: "Diseño Gráfico y Producción Audiovisual",
  },
  {
    name: "Nina Rosario",
    email: "nina.rosario@musisec.app",
    musicianType: "Instrumentista",
    primaryInstrument: "Guitarra",
    bio: "Guitarrista de sesión con experiencia en géneros pop, rock e indie.",
    orientation: "Sesionista",
    studies: "Berklee College of Music",
  },
  {
    name: "Ariel Gómez",
    email: "ariel.gomez@musisec.app",
    musicianType: "Vocalista",
    primaryInstrument: "Voz",
    bio: "Cantante y compositor con presencia en festivales de toda Latinoamérica.",
    orientation: "Artista",
    studies: "Conservatorio Nacional",
  },
  {
    name: "Leo Martín",
    email: "leo.martin@musisec.app",
    musicianType: "Instrumentista",
    primaryInstrument: "Batería",
    bio: "Baterista de agrupaciones urbanas y rock alternativo, parte de varias giras regionales.",
    orientation: "Sesionista",
    studies: "Autódidacta",
  },
  {
    name: "Valentina Medina",
    email: "valentina.medina@musisec.app",
    musicianType: "Artista",
    primaryInstrument: "Voz",
    bio: "Artista urbana independiente con más de 50K seguidores y un EP en proceso.",
    orientation: "Artista",
    studies: "Producción Musical",
  },
  {
    name: "Carlos Mendoza",
    email: "carlos.mendoza@musisec.app",
    musicianType: "Manager",
    primaryInstrument: "",
    bio: "Booking manager y agente artístico, especializado en giras de pop-rock.",
    orientation: "Profesional",
    studies: "Comunicación y Negocios del Entretenimiento",
  },
  {
    name: "Rafael Duarte",
    email: "rafael.duarte@musisec.app",
    musicianType: "Compositor",
    primaryInstrument: "Guitarra Acústica",
    bio: "Compositor e investigador musical enfocado en el folklore dominicano.",
    orientation: "Compositor",
    studies: "Etnomusicología, UASD",
  },
  {
    name: "Lena Castillo",
    email: "lena.castillo@musisec.app",
    musicianType: "Artista",
    primaryInstrument: "Voz",
    bio: "Artista independiente con debut en La Vega. Mezcla R&B, soul y latin pop.",
    orientation: "Artista",
    studies: "Canto Lírico y Performance",
  },
];

export async function GET() {
  if (process.env.ENABLE_SEED_ROUTES !== "true") {
    return NextResponse.json({ message: "Seed deshabilitado." }, { status: 404 });
  }

  const password = process.env.SEED_USERS_PASSWORD?.trim();
  if (!password) {
    return NextResponse.json(
      { message: "Define SEED_USERS_PASSWORD antes de crear usuarios seed." },
      { status: 500 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const results: Array<{ name: string; email: string; status: string }> = [];

  for (const userData of SEED_USERS) {
    try {
      await createUser({
        name: userData.name,
        email: userData.email,
        passwordHash,
        musicianType: userData.musicianType,
        bio: userData.bio,
        primaryInstrument: userData.primaryInstrument,
        orientation: userData.orientation,
        studies: userData.studies,
      });
      results.push({ name: userData.name, email: userData.email, status: "created" });
    } catch (err) {
      // Likely a unique constraint violation (user already exists)
      const message = err instanceof Error ? err.message : "unknown";
      results.push({ name: userData.name, email: userData.email, status: `skipped: ${message}` });
    }
  }

  return NextResponse.json({
    message: "Seed de usuarios completado.",
    results,
  });
}

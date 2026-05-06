import type { ReactNode, SVGProps } from "react";

export type AcademiaIconName =
  | "award"
  | "book"
  | "bolt"
  | "briefcase"
  | "check"
  | "clock"
  | "flame"
  | "grid"
  | "guitar"
  | "infinity"
  | "lesson"
  | "megaphone"
  | "mic"
  | "music"
  | "note"
  | "piano"
  | "sliders"
  | "spark"
  | "target"
  | "trophy"
  | "users";

type Props = SVGProps<SVGSVGElement> & {
  name: AcademiaIconName;
};

const paths: Record<AcademiaIconName, ReactNode> = {
  award: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12.2-1.3 7.1 4.8-2.7 4.8 2.7-1.3-7.1" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  briefcase: (
    <>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 12h18" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flame: <path d="M12 22c4 0 7-2.9 7-6.8 0-2.7-1.5-4.8-3.9-6.7.1 2.3-.7 3.7-2.1 4.8.3-3.1-1.2-5.6-4.4-8C9 8.7 5 10.8 5 15.1 5 19.1 8 22 12 22Z" />,
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </>
  ),
  guitar: (
    <>
      <path d="m15.5 8.5 4-4" />
      <path d="m17.5 2.5 4 4" />
      <path d="M14.5 9.5c1.6 1.6 1.5 4.4-.2 6.1-1.8 1.8-4.8 1.9-6.7 0s-1.8-4.9 0-6.7c1.7-1.7 4.4-1.8 6.1-.2Z" />
      <circle cx="11" cy="12.5" r="1.5" />
      <path d="M4.7 19.3 8 16" />
    </>
  ),
  infinity: <path d="M18.2 7.8c-2.4 0-4.4 2.5-6.2 4.2-1.8-1.7-3.8-4.2-6.2-4.2A4.2 4.2 0 0 0 1.6 12a4.2 4.2 0 0 0 4.2 4.2c2.4 0 4.4-2.5 6.2-4.2 1.8 1.7 3.8 4.2 6.2 4.2a4.2 4.2 0 0 0 0-8.4Z" />,
  lesson: (
    <>
      <path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5Z" />
      <path d="M8 9h7" />
      <path d="M8 13h5" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5L7 9H5a2 2 0 0 0-2 2Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
      <path d="m7 15 1 5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  note: (
    <>
      <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  piano: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14" />
      <path d="M11 5v14" />
      <path d="M15 5v14" />
      <path d="M7 5h2v7H7" />
      <path d="M15 5h2v7h-2" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
      <path d="M4 12h5" />
      <path d="M13 12h7" />
      <circle cx="11" cy="12" r="2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2 14.8 9.2 22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z" />
      <path d="M4 4l2 2" />
      <path d="m18 18 2 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a2 2 0 0 0 0 4h3" />
      <path d="M16 6h3a2 2 0 0 1 0 4h-3" />
      <path d="M12 12v5" />
      <path d="M8 21h8" />
      <path d="M10 17h4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
};

export function AcademiaIcon({ name, className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
      className={className ?? "h-4 w-4"}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

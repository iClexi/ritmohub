"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
};

type UserDraft = {
  name: string;
  email: string;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
  password: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hydrateDrafts = useCallback((items: AdminUser[]) => {
    const nextDrafts: Record<string, UserDraft> = {};
    for (const item of items) {
      nextDrafts[item.id] = {
        name: item.name,
        email: item.email,
        stageName: item.stageName,
        role: item.role,
        musicianType: item.musicianType,
        primaryInstrument: item.primaryInstrument,
        bio: item.bio,
        password: "",
      };
    }
    setDrafts(nextDrafts);
  }, []);

  const loadUsers = useCallback(async (query: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; users?: AdminUser[] }
        | null;

      if (!response.ok || !payload?.users) {
        setErrorMessage(payload?.message ?? "No pudimos cargar los usuarios.");
        setUsers([]);
        setDrafts({});
        return;
      }

      setUsers(payload.users);
      hydrateDrafts(payload.users);
    } catch {
      setErrorMessage("No pudimos cargar los usuarios.");
      setUsers([]);
      setDrafts({});
    } finally {
      setIsLoading(false);
    }
  }, [hydrateDrafts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(search.trim());
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [loadUsers, search]);

  const userCountLabel = useMemo(() => {
    if (isLoading) {
      return "Cargando...";
    }
    return `${users.length} usuario${users.length === 1 ? "" : "s"}`;
  }, [isLoading, users.length]);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (selectedUserId && !selectedUser) {
      setSelectedUserId(null);
    }
  }, [selectedUser, selectedUserId]);

  const updateDraftField = <K extends keyof UserDraft>(
    userId: string,
    key: K,
    value: UserDraft[K],
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? {
          name: "",
          email: "",
          stageName: "",
          role: "user",
          musicianType: "",
          primaryInstrument: "",
          bio: "",
          password: "",
        }),
        [key]: value,
      },
    }));
  };

  const saveUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveSaveId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; user?: AdminUser }
        | null;

      if (!response.ok || !payload?.user) {
        setErrorMessage(payload?.message ?? "No pudimos actualizar este usuario.");
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === userId ? payload.user! : item)));
      setDrafts((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          password: "",
        },
      }));
      setSuccessMessage(payload.message ?? "Usuario actualizado.");
    } catch {
      setErrorMessage("No pudimos actualizar este usuario.");
    } finally {
      setActiveSaveId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveDeleteId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "No pudimos eliminar este usuario.");
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== userId));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setSelectedUserId(null);
      setSuccessMessage(payload?.message ?? "Usuario eliminado.");
    } catch {
      setErrorMessage("No pudimos eliminar este usuario.");
    } finally {
      setActiveDeleteId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 pb-8 pt-24 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted)]">
                RitmoHub Admin
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--ui-text)]">Panel de administracion</h1>
              <p className="mt-1 text-sm text-[var(--ui-muted)]">
                Gestiona usuarios, correos, roles y contraseñas con cambios reales en la base de datos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
              >
                Volver a RitmoHub
              </Link>
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                {userCountLabel}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o nombre artistico"
              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
            />
          </div>
        </header>

        {errorMessage ? (
          <p className="rounded-2xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-4 py-3 text-sm text-[var(--ui-accent)]">
            {successMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
            {users.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--ui-muted)]">
                No encontramos usuarios para este filtro.
              </div>
            ) : (
              users.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedUserId(item.id)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--ui-surface-soft)] ${
                    index < users.length - 1 ? "border-b border-[color:var(--ui-border)]" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--ui-text)]">{item.name}</span>
                    <span className="block truncate text-xs text-[var(--ui-muted)]">{item.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-[color:var(--ui-border)] px-2 py-1 text-[11px] text-[var(--ui-muted)]">
                      {item.role}
                    </span>
                    <span className="text-xs text-[var(--ui-muted)]">{formatDate(item.updatedAt)}</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      {selectedUser ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedUserId(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Editar usuario</p>
                <h2 className="text-lg font-semibold text-[var(--ui-text)]">{selectedUser.name}</h2>
                <p className="text-xs text-[var(--ui-muted)]">ID: {selectedUser.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
              >
                Cerrar
              </button>
            </div>

            {drafts[selectedUser.id] ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nombre</span>
                  <input
                    value={drafts[selectedUser.id].name}
                    onChange={(event) => updateDraftField(selectedUser.id, "name", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Correo</span>
                  <input
                    value={drafts[selectedUser.id].email}
                    onChange={(event) => updateDraftField(selectedUser.id, "email", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nombre artistico</span>
                  <input
                    value={drafts[selectedUser.id].stageName}
                    onChange={(event) => updateDraftField(selectedUser.id, "stageName", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Rol</span>
                  <select
                    value={drafts[selectedUser.id].role}
                    onChange={(event) => updateDraftField(selectedUser.id, "role", event.target.value === "admin" ? "admin" : "user")}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Tipo de musico</span>
                  <input
                    value={drafts[selectedUser.id].musicianType}
                    onChange={(event) => updateDraftField(selectedUser.id, "musicianType", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Instrumento principal</span>
                  <input
                    value={drafts[selectedUser.id].primaryInstrument}
                    onChange={(event) => updateDraftField(selectedUser.id, "primaryInstrument", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Bio</span>
                  <textarea
                    rows={3}
                    value={drafts[selectedUser.id].bio}
                    onChange={(event) => updateDraftField(selectedUser.id, "bio", event.target.value)}
                    className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nueva contraseña (opcional)</span>
                  <input
                    type="password"
                    value={drafts[selectedUser.id].password}
                    onChange={(event) => updateDraftField(selectedUser.id, "password", event.target.value)}
                    placeholder="Dejar vacio para no cambiar"
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={activeDeleteId === selectedUser.id}
                onClick={() => void deleteUser(selectedUser.id)}
                className="rounded-xl border border-[var(--ui-danger)] px-4 py-2 text-sm font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.12)] disabled:opacity-60"
              >
                {activeDeleteId === selectedUser.id ? "Eliminando..." : "Eliminar usuario"}
              </button>
              <button
                type="button"
                disabled={activeSaveId === selectedUser.id}
                onClick={() => void saveUser(selectedUser.id)}
                className="rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] hover:opacity-90 disabled:opacity-60"
              >
                {activeSaveId === selectedUser.id ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

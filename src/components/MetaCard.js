"use client";

import { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import { dayKey, daysBetween, formatHours, currentWeekDates } from "../lib/metas";
import { PlayIcon, TrashIcon, UndoIcon, EditIcon, CheckIcon, LockIcon } from "./icons/Icons";

function getActiveSessionSnapshot() {
  try {
    return localStorage.getItem("pomodoro.timer.session.v1") ?? "";
  } catch {
    return "";
  }
}

function subscribeActiveSession(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function useActiveSessionGoalId() {
  const raw = useSyncExternalStore(subscribeActiveSession, getActiveSessionSnapshot, () => "");
  return useMemo(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.activeGoalId ? String(parsed.activeGoalId) : null;
    } catch {
      return null;
    }
  }, [raw]);
}

// Etiquetas de estado para las metas //
const STATE_LABEL = {
  activa: "En curso",
  completada: "¡Completada!",
  vencida: "Plazo vencido",
};

// Componente para mostrar la información de una meta individual //
export default function MetaCard({ goal, onLog, onUndoToday, onDelete, onUpdate }) {
  const [hours, setHours] = useState("");
  const [logError, setLogError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editHours, setEditHours] = useState(String(goal.goalHours));
  const [editDeadline, setEditDeadline] = useState(goal.deadline || "");
  const [editError, setEditError] = useState("");

  // Verificar si hay una sesión activa en curso para esta meta
  const activeSessionGoalId = useActiveSessionGoalId();
  const isGoalInActiveSession = activeSessionGoalId === String(goal.id);

  // Salir de edición o confirmación con la tecla Escape
  useEffect(() => {
    if (!isEditing && !confirmDelete && !confirmUndo) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsEditing(false);
        setConfirmDelete(false);
        setConfirmUndo(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, confirmDelete, confirmUndo]);

  const today = dayKey();
  const pct = Math.min(100, Math.round((goal.doneHours / goal.goalHours) * 100));
  const remaining = Math.max(0, goal.goalHours - goal.doneHours);
 
  // Ritmo sugerido si hay fecha límite //
  let paceText = null;
  if (goal.deadline && goal.state === "activa") {
    const daysLeft = Math.max(1, daysBetween(today, goal.deadline) + 1);
    const verb = daysLeft === 1 ? "Te queda" : "Te quedan";
    const dayWord = daysLeft === 1 ? "día" : "días";
    paceText = `${verb} ${daysLeft} ${dayWord}: ~${formatHours(remaining / daysLeft)} por día`;
  }

  // Días de la semana actual (Lunes a Domingo)
  const { days, rangeLabel } = currentWeekDates();
  const maxDay = Math.max(1, ...days.map((d) => goal.byDay[d.key] || 0));

  // Función para manejar el registro de horas manual //
  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(hours);
    if (!value || isNaN(value) || value <= 0) return;
    if (value < 0.25) {
      setLogError("Mínimo: 0.25 h (15 min).");
      return;
    }
    if (value > 24) {
      setLogError("Máximo 24h en un solo día.");
      return;
    }
    const currentToday = goal.todayHours || 0;
    if (currentToday + value > 24) {
      setLogError(`Supera 24h hoy (ya tienes ${formatHours(currentToday)}).`);
      return;
    }
    setLogError("");
    onLog(goal.id, value);
    setHours("");
  };

  // Función para guardar cambios de edición
  const handleSaveEdit = (e) => {
    e.preventDefault();
    const parsedHours = parseFloat(editHours);
    if (!editName.trim()) {
      setEditError("El nombre no puede estar vacío.");
      return;
    }
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setEditError("Las horas deben ser mayores a 0.");
      return;
    }
    if (parsedHours < 0.5) {
      setEditError("Las horas objetivo deben ser al menos 0.5 h (30 min).");
      return;
    }
    if (parsedHours > 1000) {
      setEditError("Las horas objetivo no pueden superar las 1.000 horas.");
      return;
    }
    if (editDeadline && editDeadline < dayKey()) {
      setEditError("La fecha límite no puede ser anterior a hoy.");
      return;
    }

    if (onUpdate) {
      onUpdate(goal.id, {
        name: editName,
        goalHours: parsedHours,
        deadline: editDeadline || null,
      });
    }
    setEditError("");
    setIsEditing(false);
  };

  return (
    <article className="border border-zinc-200 p-5 sm:p-6 flex flex-col gap-4 bg-white shadow-xs hover:border-zinc-300 transition-colors duration-75">
      {/* Modo Edición */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
            <h4 className="font-semibold text-sm text-zinc-900">Editar meta</h4>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border border-zinc-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-zinc-900 text-zinc-900 shadow-2xs"
              required
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                Horas objetivo <span className="text-zinc-400 font-normal lowercase">(0.5 a 1.000 h)</span>
              </label>
              <input
                type="number"
                min="0.5"
                max="1000"
                step="0.5"
                value={editHours}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setEditHours("");
                    if (editError === "No se permite ingresar más de 1.000 horas.") setEditError("");
                    return;
                  }
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 1000) {
                    setEditHours("1000");
                    setEditError("No se permite ingresar más de 1.000 horas.");
                    return;
                  }
                  if (editError === "No se permite ingresar más de 1.000 horas.") {
                    setEditError("");
                  }
                  setEditHours(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                    e.preventDefault();
                  }
                }}
                className="border border-zinc-200 px-3 py-1.5 text-sm font-mono bg-white focus:outline-none focus:border-zinc-900 text-zinc-900 shadow-2xs"
                required
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Fecha límite</label>
              <input
                type="date"
                min={dayKey()}
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="border border-zinc-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-zinc-900 text-zinc-900 shadow-2xs"
              />
            </div>
          </div>

          {editError && (
            <p className="text-xs text-red-600">{editError}</p>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-zinc-900 text-white px-4 py-1.5 text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="border border-zinc-200 text-zinc-600 px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Título y estado */}
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 break-words">{goal.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {goal.deadline
                  ? `Fecha límite: ${new Date(goal.deadline + "T00:00:00").toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "Sin fecha límite establecida"}
              </p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-0.5 text-xs font-mono font-medium ${
                goal.state === "completada"
                  ? "bg-zinc-900 text-white"
                  : goal.state === "vencida"
                  ? "border border-dashed border-zinc-300 text-zinc-500 bg-zinc-50"
                  : "border border-zinc-200 text-zinc-700 bg-zinc-50/70"
              }`}
            >
              {STATE_LABEL[goal.state]}
            </span>
          </div>

          {/* Barra de progreso general */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono text-zinc-600">
              <span>
                <strong className="text-zinc-900 font-semibold">{formatHours(goal.doneHours)}</strong> / {formatHours(goal.goalHours)}
              </span>
              <span className="font-semibold text-zinc-900">{pct}%</span>
            </div>
            <div
              className="h-2 bg-zinc-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${goal.name}`}
            >
              <div className="h-full bg-[#51a2ff] transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            {paceText && <p className="text-xs text-zinc-600">{paceText}</p>}
            {goal.state === "activa" && !paceText && (
              <p className="text-xs text-zinc-500">Faltan {formatHours(remaining)} para completar</p>
            )}
            {goal.state === "vencida" && (
              <p className="text-xs text-red-600 font-medium">Plazo finalizado. Faltaron {formatHours(remaining)}.</p>
            )}
          </div>

          {/* Gráfico de la Semana Actual (Lunes a Domingo) */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-100">
            <div className="flex justify-between items-baseline flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-zinc-700">Esta semana</span>
                <span className="text-[11px] text-zinc-400 font-mono">({rangeLabel})</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-600">
                <span>Semana: <strong className="text-zinc-900">{formatHours(goal.weekHours || 0)}</strong></span>
                <span className="text-zinc-300">|</span>
                <span>Hoy: <strong className="text-zinc-900">{formatHours(goal.todayHours)}</strong></span>
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-12 pt-2">
              {days.map((d) => {
                const h = goal.byDay[d.key] || 0;
                return (
                  <div
                    key={d.key}
                    className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                    title={`${d.label}: ${formatHours(h)}`}
                  >
                    <div
                      className={`w-full transition-[height] duration-200 ${
                        h > 0
                          ? "bg-[#51a2ff]"
                          : d.isFuture
                          ? "border border-dashed border-zinc-200 bg-zinc-50"
                          : "bg-zinc-100"
                      } ${d.isToday ? "ring-1 ring-[#51a2ff] ring-offset-1" : ""}`}
                      style={{
                        height: h > 0 ? `${Math.max(16, (h / maxDay) * 100)}%` : "3px",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Etiquetas de Lunes a Domingo */}
            <div className="flex gap-1.5 text-[10px] font-mono mt-0.5">
              {days.map((d) => (
                <span
                  key={d.key}
                  className={`flex-1 text-center whitespace-nowrap ${
                    d.isToday
                      ? "font-semibold text-zinc-900"
                      : d.isFuture
                      ? "text-zinc-300"
                      : "text-zinc-500"
                  }`}
                >
                  {d.shortDay}
                </span>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-zinc-100 pt-3">
            {goal.state === "activa" ? (
              <Link
                href={`/?meta=${goal.id}`}
                className="flex items-center gap-1.5 bg-zinc-900 text-white px-3.5 py-1.5 text-xs font-medium hover:bg-zinc-800 transition-colors duration-75 shadow-2xs"
              >
                <PlayIcon className="w-3.5 h-3.5 fill-current" />
                <span>Comenzar sesión</span>
              </Link>
            ) : goal.state === "completada" ? (
              <span className="flex items-center gap-1.5 border border-emerald-200 bg-emerald-50/70 text-emerald-800 px-3 py-1.5 text-xs font-medium shadow-2xs">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meta cumplida</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 border border-amber-300 bg-amber-50 text-amber-900 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="Extiende la fecha límite para reanudar el estudio"
              >
                <EditIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>Extender plazo para iniciar</span>
              </button>
            )}

            <form onSubmit={submit} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  value={hours}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setHours("");
                      if (logError) setLogError("");
                      return;
                    }
                    const num = parseFloat(val);
                    if (!isNaN(num) && num > 24) {
                      setHours("24");
                      setLogError("El máximo a registrar en un solo día es 24 horas.");
                      return;
                    }
                    if (logError) setLogError("");
                    setHours(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.5"
                  required
                  aria-label={`Horas estudiadas hoy para ${goal.name}`}
                  className="w-16 border border-zinc-200 px-2 py-1 font-mono text-xs text-center bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
                />
                <button
                  type="submit"
                  className="border border-zinc-200 text-zinc-700 hover:bg-zinc-50 px-3 py-1 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                >
                  + Registrar
                </button>
              </div>
              {logError && (
                <span className="text-[10px] text-red-600 font-medium leading-tight max-w-44">
                  {logError}
                </span>
              )}
            </form>

            <div className="ml-auto flex items-center gap-2.5 text-xs text-zinc-500 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Editar nombre, horas o plazo"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {goal.todayHours > 0 && (
                confirmUndo ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-600">¿Borrar {formatHours(goal.todayHours)}?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onUndoToday(goal.id);
                        setConfirmUndo(false);
                      }}
                      className="font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmUndo(false)}
                      className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmUndo(true)}
                    className="flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Deshacer registros de hoy"
                  >
                    <UndoIcon className="w-3.5 h-3.5" />
                    <span>Deshacer hoy</span>
                  </button>
                )
              )}

              {isGoalInActiveSession ? (
                <span
                  className="flex items-center gap-1 text-zinc-400 cursor-not-allowed text-xs"
                  title="No se puede eliminar: tiene una sesión en curso en el temporizador"
                >
                  <LockIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>En sesión</span>
                </span>
              ) : confirmDelete ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onDelete(goal.id)}
                    className="font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer"
                  title="Eliminar meta"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

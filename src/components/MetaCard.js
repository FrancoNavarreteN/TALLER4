"use client";

import { useState } from "react";
import Link from "next/link";
import { dayKey, daysBetween, formatHours, currentWeekDates } from "../lib/metas";
import { PlayIcon, TrashIcon, UndoIcon, EditIcon } from "./icons/Icons";

// Etiquetas de estado para las metas //
const STATE_LABEL = {
  activa: "En curso",
  completada: "¡Completada!",
  vencida: "Plazo vencido",
};

// Componente para mostrar la información de una meta individual //
export default function MetaCard({ goal, onLog, onUndoToday, onDelete, onUpdate }) {
  const [hours, setHours] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editHours, setEditHours] = useState(String(goal.goalHours));
  const [editDeadline, setEditDeadline] = useState(goal.deadline || "");
  const [editError, setEditError] = useState("");

  const today = dayKey();
  const pct = Math.min(100, Math.round((goal.doneHours / goal.goalHours) * 100));
  const remaining = Math.max(0, goal.goalHours - goal.doneHours);
 
  // Ritmo sugerido si hay fecha límite //
  let paceText = null;
  if (goal.deadline && goal.state === "activa") {
    const daysLeft = Math.max(1, daysBetween(today, goal.deadline) + 1);
    const verb = daysLeft === 1 ? "Te queda" : "Te quedan";
    const dayWord = daysLeft === 1 ? "día" : "días";
    paceText = `${verb} ${daysLeft} ${dayWord}: ~${formatHours(remaining / daysLeft)} h por día`;
  }

  // Días de la semana actual (Lunes a Domingo)
  const { days, rangeLabel } = currentWeekDates();
  const maxDay = Math.max(1, ...days.map((d) => goal.byDay[d.key] || 0));

  // Función para manejar el registro de horas manual //
  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(hours);
    if (!value || value <= 0) return;
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
    if (!parsedHours || parsedHours <= 0) {
      setEditError("Las horas deben ser mayores a 0.");
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
    <article className="border-2 border-black rounded-2xl p-5 flex flex-col gap-4 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Modo Edición */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-black pb-2">
            <h4 className="font-bold text-lg">Editar meta</h4>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="text-sm underline cursor-pointer hover:opacity-60"
            >
              Cancelar
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Nombre</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border-2 border-black rounded-xl px-3 py-1.5 text-sm bg-transparent focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Horas objetivo</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="border-2 border-black rounded-xl px-3 py-1.5 text-sm font-mono bg-transparent focus:outline-none"
                required
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Fecha límite</label>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="border-2 border-black rounded-xl px-3 py-1.5 text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {editError && (
            <p className="text-xs text-red-600 font-bold">{editError}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="border-2 border-black rounded-full px-5 py-1.5 text-sm font-bold bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="border-2 border-black rounded-full px-4 py-1.5 text-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Título y estado */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-bold break-words">{goal.name}</h3>
              <p className="text-sm text-gray-600">
                {goal.deadline
                  ? `Fecha límite: ${new Date(goal.deadline + "T00:00:00").toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "Sin fecha límite"}
              </p>
            </div>
            <span
              className={`shrink-0 border-2 border-black rounded-full px-3 py-0.5 text-sm font-semibold ${
                goal.state === "completada" ? "bg-black text-white" : ""
              } ${goal.state === "vencida" ? "border-dashed" : ""}`}
            >
              {STATE_LABEL[goal.state]}
            </span>
          </div>

          {/* Barra de progreso general */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm font-mono">
              <span>
                {formatHours(goal.doneHours)} / {formatHours(goal.goalHours)} h
              </span>
              <span>{pct}%</span>
            </div>
            <div
              className="h-4 border-2 border-black rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${goal.name}`}
            >
              <div className="h-full bg-black transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {paceText && <p className="text-sm text-gray-700">{paceText}</p>}
            {goal.state === "activa" && !paceText && (
              <p className="text-sm text-gray-700">Faltan {formatHours(remaining)} h</p>
            )}
            {goal.state === "vencida" && (
              <p className="text-sm text-red-600 font-semibold">Plazo finalizado. Faltaron {formatHours(remaining)} h.</p>
            )}
          </div>

          {/* Gráfico de la Semana Actual (Lunes a Domingo) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">Esta semana</span>
                <span className="text-xs text-gray-500 font-mono">({rangeLabel})</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-mono">
                <span>Semana: <strong>{formatHours(goal.weekHours || 0)} h</strong></span>
                <span className="text-gray-400">|</span>
                <span>Hoy: <strong>{formatHours(goal.todayHours)} h</strong></span>
              </div>
            </div>

            <div className="flex items-end gap-2 h-16 pt-2">
              {days.map((d) => {
                const h = goal.byDay[d.key] || 0;
                return (
                  <div
                    key={d.key}
                    className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                    title={`${d.label}: ${formatHours(h)} h`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        h > 0
                          ? "bg-black"
                          : d.isFuture
                          ? "border border-dashed border-gray-300 bg-gray-50"
                          : "bg-gray-200"
                      } ${d.isToday ? "outline outline-2 outline-offset-2 outline-black" : ""}`}
                      style={{
                        height: h > 0 ? `${Math.max(12, (h / maxDay) * 100)}%` : "4px",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Etiquetas de Lunes a Domingo */}
            <div className="flex gap-2 text-[10px] font-mono mt-1">
              {days.map((d) => (
                <span
                  key={d.key}
                  className={`flex-1 text-center whitespace-nowrap ${
                    d.isToday
                      ? "font-bold text-black underline"
                      : d.isFuture
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3 border-t border-black pt-4">
            <Link
              href={`/?meta=${goal.id}`}
              className="flex items-center gap-1.5 border-2 border-black rounded-full px-5 py-1.5 font-semibold hover:bg-black hover:text-white transition-colors"
            >
              <PlayIcon className="w-4 h-4 fill-current" />
              <span>Comenzar sesión</span>
            </Link>

            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Horas"
                required
                aria-label={`Horas estudiadas hoy para ${goal.name}`}
                className="w-24 border-2 border-black rounded-full px-3 py-1.5 font-mono text-center bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="border-2 border-black rounded-full px-4 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                Registrar
              </button>
            </form>

            <div className="ml-auto flex items-center gap-3 text-sm flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 underline cursor-pointer hover:opacity-60"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {goal.todayHours > 0 && (
                confirmUndo ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">¿Borrar {formatHours(goal.todayHours)}h de hoy?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onUndoToday(goal.id);
                        setConfirmUndo(false);
                      }}
                      className="font-bold underline text-red-600 hover:opacity-75 cursor-pointer"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmUndo(false)}
                      className="underline hover:opacity-75 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmUndo(true)}
                    className="flex items-center gap-1 underline cursor-pointer hover:opacity-60"
                  >
                    <UndoIcon className="w-3.5 h-3.5" />
                    <span>Deshacer hoy</span>
                  </button>
                )
              )}

              {confirmDelete ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(goal.id)}
                    className="underline font-bold text-red-600 cursor-pointer hover:opacity-60"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="underline cursor-pointer hover:opacity-60"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 underline cursor-pointer hover:opacity-60"
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

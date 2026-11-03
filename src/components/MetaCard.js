"use client";

import { useState } from "react";
import Link from "next/link";
import { dayKey, daysBetween, formatHours, lastDays } from "../lib/metas";


// Etiqyuetas de estado para las metas //
const STATE_LABEL = {
  activa: "En curso",
  completada: "¡Completada!",
  vencida: "Plazo vencido",
};

// Componente para mostrar la información de una meta individual //
export default function MetaCard({ goal, onLog, onUndoToday, onDelete }) {
  const [hours, setHours] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const today = dayKey();
  const pct = Math.min(100, Math.round((goal.doneHours / goal.goalHours) * 100));
  const remaining = Math.max(0, goal.goalHours - goal.doneHours);
 
  // Ritmo sugerido si hay fecha límite //
  let paceText = null;
  if (goal.deadline && goal.state === "activa") {
    const daysLeft = Math.max(1, daysBetween(today, goal.deadline) + 1);
    paceText = `Te quedan ${daysLeft} ${daysLeft === 1 ? "día" : "días"}: ~${formatHours(
      remaining / daysLeft
    )} h por día`;
  }

  // Avance de los últimos 7 días //
  const days = lastDays(7);
  const maxDay = Math.max(1, ...days.map((d) => goal.byDay[d.key] || 0));

  // Función para manejar el registro de horas //
  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(hours);
    if (!value || value <= 0) return;
    onLog(goal.id, value);
    setHours("");
  };

  return (
    <article className="border-2 border-black rounded-2xl p-5 flex flex-col gap-4">
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

      {/* Barra de progreso */}
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
      </div>

      {/* Avance de los últimos 7 días */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold">Últimos 7 días</span>
          <span className="text-sm font-mono">Hoy: {formatHours(goal.todayHours)} h</span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {days.map((d) => {
            const h = goal.byDay[d.key] || 0;
            const isToday = d.key === today;
            return (
              <div
                key={d.key}
                className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                title={`${d.key}: ${formatHours(h)} h`}
              >
                <div
                  className={`w-full ${h > 0 ? "bg-black" : "bg-gray-200"} ${
                    isToday ? "outline outline-2 outline-offset-2 outline-black" : ""
                  }`}
                  style={{ height: h > 0 ? `${Math.max(8, (h / maxDay) * 100)}%` : "4px" }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 text-[10px] text-gray-600 font-mono">
          {days.map((d) => (
            <span key={d.key} className="flex-1 text-center">
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-3 border-t border-black pt-4">
        <Link
          href={`/?meta=${goal.id}`}
          className="border-2 border-black rounded-full px-5 py-1.5 font-semibold hover:bg-black hover:text-white transition-colors"
        >
          Comenzar sesión
        </Link>

        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            type="number"
            min="0.25"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Horas"
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

        <div className="ml-auto flex items-center gap-3 text-sm">
          {goal.todayHours > 0 && (
            <button
              onClick={() => onUndoToday(goal.id)}
              className="underline cursor-pointer hover:opacity-60"
            >
              Deshacer hoy
            </button>
          )}
          {confirmDelete ? (
            <span className="flex items-center gap-2">
              <button
                onClick={() => onDelete(goal.id)}
                className="underline font-bold cursor-pointer hover:opacity-60"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="underline cursor-pointer hover:opacity-60"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="underline cursor-pointer hover:opacity-60"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
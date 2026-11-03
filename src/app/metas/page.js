"use client";

import { useState } from "react";
import Link from "next/link";
import MetaCard from "../../components/MetaCard";
import { dayKey, formatHours, useMetas } from "../../lib/metas";

export default function MetasPage() {
  const { goals, addGoal, deleteGoal, logHours, undoToday } = useMetas();

  const [name, setName] = useState("");
  const [goalHours, setGoalHours] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(goalHours);

    // Seccion de errores a la hora de hacer metas //
    if (!name.trim()) return setError("Debes de ponerle un nombre a tu meta.");
    if (!hours || hours <= 0) return setError("Las horas objetivo deben ser mayores a 0.");
    if (deadline && deadline < dayKey()) return setError("La fecha límite no puede ser anterior a hoy.");

    // Si todo está bien, se crea la meta y se resetean los campos del formulario //
    addGoal({ name, goalHours: hours, deadline });
    setName("");
    setGoalHours("");
    setDeadline("");
    setError("");
  };

  // Suma total de las horas registradas en todas las metas //
  const todayTotal = goals.reduce((sum, g) => sum + g.todayHours, 0);

  // Las metas en curso primero, luego las vencidas y al final las completadas
  const order = { activa: 0, vencida: 1, completada: 2 };
  const sorted = [...goals].sort((a, b) => order[a.state] - order[b.state]);

  return (
    <main className="min-h-screen bg-white text-black flex flex-col p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center w-full mb-8">
        <Link
          href="/"
          className="border-2 border-black rounded-full px-6 py-2 text-xl hover:bg-gray-100 transition-colors"
        >
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold">Metas</h1>
        <div className="border-2 border-black rounded-full px-6 py-2 text-xl font-mono" title="Horas registradas hoy">
          Hoy: {formatHours(todayTotal)} h
        </div>
      </header>

      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        {/* Formulario de nueva meta */}
        <form onSubmit={handleSubmit} className="border-2 border-black rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Nueva meta</h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="meta-name" className="text-sm font-semibold">
              ¿Qué quieres lograr?
            </label>
            <input
              id="meta-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Terminar proyecto de taller 4"
              className="border-2 border-black rounded-xl px-4 py-2 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label htmlFor="meta-hours" className="text-sm font-semibold">
                Horas totales
              </label>
              <input
                id="meta-hours"
                type="number"
                min="0.5"
                step="0.5"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                placeholder="Ej: 20"
                className="border-2 border-black rounded-xl px-4 py-2 font-mono bg-transparent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label htmlFor="meta-deadline" className="text-sm font-semibold">
                Fecha límite (opcional)
              </label>
              <input
                id="meta-deadline"
                type="date"
                min={dayKey()}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border-2 border-black rounded-xl px-4 py-2 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="self-start border-2 border-black rounded-full px-8 py-2 text-lg font-semibold hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Crear meta
          </button>
        </form>

        {/* Lista de metas */}
        {sorted.length === 0 ? (
          <p className="text-center text-gray-600 py-10">
            Aun no has puesto una meta. Especifica lo que buscas y dale a "Crear meta".
          </p>
        ) : (
          // Lista de metas
          <section className="flex flex-col gap-5" aria-label="Tus metas">
            {sorted.map((goal) => (
              <MetaCard
                key={goal.id}
                goal={goal}
                onLog={logHours}
                onUndoToday={undoToday}
                onDelete={deleteGoal}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
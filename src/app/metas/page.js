"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MetaCard from "../../components/MetaCard";
import { dayKey, formatHours, useMetas } from "../../lib/metas";
import { ArrowLeftIcon } from "../../components/icons/Icons";

export default function MetasPage() {
  const router = useRouter();
  const { goals, generalGoal, addGoal, updateGoal, deleteGoal, logHours, undoToday } = useMetas();

  // Regresar al temporizador principal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          document.activeElement.blur();
          return;
        }
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const [name, setName] = useState("");
  const [goalHours, setGoalHours] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  // Pestañas de filtro
  const [activeTab, setActiveTab] = useState("todas"); // "todas" | "activa" | "completada" | "vencida"

  const handleSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(goalHours);

    // Validación
    if (!name.trim()) return setError("Debes de ponerle un nombre a tu meta.");
    if (isNaN(hours) || hours <= 0) return setError("Las horas objetivo deben ser mayores a 0.");
    if (hours < 0.5) return setError("Las horas objetivo deben ser al menos 0.5 h (30 minutos).");
    if (hours > 1000) return setError("Las horas objetivo no pueden superar las 1.000 horas.");
    if (deadline && deadline < dayKey()) return setError("La fecha límite no puede ser anterior a hoy.");

    addGoal({ name, goalHours: hours, deadline });
    setName("");
    setGoalHours("");
    setDeadline("");
    setError("");
  };

  // Suma total de las horas registradas en todas las metas y estudio general hoy
  const todayTotal = goals.reduce((sum, g) => sum + g.todayHours, 0) + (generalGoal?.todayHours || 0);

  // Conteo por estado
  const countActivas = goals.filter((g) => g.state === "activa").length;
  const countCompletadas = goals.filter((g) => g.state === "completada").length;
  const countVencidas = goals.filter((g) => g.state === "vencida").length;

  // Filtrado y orden
  const filtered = goals.filter((g) => {
    if (activeTab === "todas") return true;
    return g.state === activeTab;
  });

  const order = { activa: 0, vencida: 1, completada: 2 };
  const sorted = [...filtered].sort((a, b) => order[a.state] - order[b.state]);

  return (
    <main className="min-h-screen bg-white text-zinc-900 flex flex-col p-5 sm:p-8 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="max-w-3xl mx-auto w-full flex justify-between items-center mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 shadow-xs"
        >
          <ArrowLeftIcon className="w-4 h-4 text-zinc-600" />
          <span>Volver al temporizador</span>
          <span className="text-[10px] text-zinc-400 font-mono ml-0.5 border border-zinc-200 px-1 py-0.5 bg-zinc-50 leading-none">[esc]</span>
        </Link>
        <div className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-mono text-zinc-700 shadow-xs" title="Horas registradas hoy">
          Hoy: <span className="font-semibold text-zinc-900">{formatHours(todayTotal)}</span>
        </div>
      </header>

      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        {/* Encabezado de página */}
        <div className="border-b border-zinc-100 pb-4">
          <h1 className="text-2xl font-semibold text-zinc-900">Metas de estudio</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Planifica tus objetivos de horas y lleva registro de tu progreso</p>
        </div>

        {/* Formulario de nueva meta */}
        <form onSubmit={handleSubmit} className="border border-zinc-200 p-5 sm:p-6 flex flex-col gap-4 bg-zinc-50/40 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900">Crear nueva meta</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="meta-name" className="text-xs font-medium text-zinc-600">
              ¿Qué materia o proyecto quieres avanzar?
            </label>
            <input
              id="meta-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Proyecto Taller 4, Álgebra Lineal..."
              className="border border-zinc-200 px-3.5 py-2 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-40">
              <label htmlFor="meta-hours" className="text-xs font-medium text-zinc-600">
                Horas totales objetivo <span className="text-zinc-400 font-normal">(0.5 a 1.000 h)</span>
              </label>
              <input
                id="meta-hours"
                type="number"
                min="0.5"
                max="1000"
                step="0.5"
                value={goalHours}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setGoalHours("");
                    if (error === "No se permite ingresar más de 1.000 horas.") setError("");
                    return;
                  }
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 1000) {
                    setGoalHours("1000");
                    setError("No se permite ingresar más de 1.000 horas.");
                    return;
                  }
                  if (error === "No se permite ingresar más de 1.000 horas.") {
                    setError("");
                  }
                  setGoalHours(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: 20"
                className="border border-zinc-200 px-3.5 py-2 font-mono text-sm bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-40">
              <label htmlFor="meta-deadline" className="text-xs font-medium text-zinc-600">
                Fecha límite <span className="text-zinc-400 font-normal">(opcional)</span>
              </label>
              <input
                id="meta-deadline"
                type="date"
                min={dayKey()}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border border-zinc-200 px-3.5 py-2 text-sm bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 p-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="self-start bg-zinc-900 text-white px-5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors duration-75 cursor-pointer shadow-xs"
          >
            Guardar meta
          </button>
        </form>

        {/* Pestañas de filtrado */}
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-2">
            <button
              onClick={() => setActiveTab("todas")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "todas" 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              Todas ({goals.length})
            </button>
            <button
              onClick={() => setActiveTab("activa")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "activa" 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              En curso ({countActivas})
            </button>
            <button
              onClick={() => setActiveTab("completada")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "completada" 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              Completadas ({countCompletadas})
            </button>
            {countVencidas > 0 && (
              <button
                onClick={() => setActiveTab("vencida")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "vencida" 
                    ? "bg-zinc-900 text-white" 
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                Vencidas ({countVencidas})
              </button>
            )}
          </div>
        )}

        {/* Lista de metas */}
        {goals.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-200">
            <p className="text-sm">Aún no has creado ninguna meta.</p>
            <p className="text-xs text-zinc-400 mt-1">Completa el formulario superior para comenzar.</p>
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-zinc-500 py-10 text-sm">
            No hay metas en esta categoría.
          </p>
        ) : (
          <section className="flex flex-col gap-4" aria-label="Tus metas">
            {sorted.map((goal) => (
              <MetaCard
                key={goal.id}
                goal={goal}
                onLog={logHours}
                onUndoToday={undoToday}
                onDelete={deleteGoal}
                onUpdate={updateGoal}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

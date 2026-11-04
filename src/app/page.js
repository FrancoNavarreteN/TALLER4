"use client";

import { useState, useCallback, useMemo, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PomodoroTimer from "../components/PomodoroTimer";
import ConfigSidebar from "../components/ConfigSidebar";
import MetricsSidebar from "../components/MetricsSidebar";
import { useMetas, formatHours } from "../lib/metas";
import { ChartIcon, TargetIcon, SettingsIcon, GoalIcon } from "../components/icons/Icons";

const CONFIG_KEY = "pomodoro.config.v1";
const configListeners = new Set();

function subscribeConfig(callback) {
  configListeners.add(callback);
  const onStorage = (e) => {
    if (e.key === CONFIG_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    configListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getConfigSnapshot() {
  try {
    return localStorage.getItem(CONFIG_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerConfigSnapshot() {
  return "";
}

function useConfig() {
  const raw = useSyncExternalStore(subscribeConfig, getConfigSnapshot, getServerConfigSnapshot);
  const config = useMemo(() => {
    if (!raw) return { studyTime: 25, breakTime: 5, cycles: 4 };
    try {
      const parsed = JSON.parse(raw);
      return {
        studyTime: parsed.studyTime ?? 25,
        breakTime: parsed.breakTime ?? 5,
        cycles: parsed.cycles ?? 4,
      };
    } catch {
      return { studyTime: 25, breakTime: 5, cycles: 4 };
    }
  }, [raw]);

  const updateConfig = useCallback((updated) => {
    try {
      const currentRaw = getConfigSnapshot();
      let base = { studyTime: 25, breakTime: 5, cycles: 4 };
      if (currentRaw) {
        try {
          base = JSON.parse(currentRaw);
        } catch {}
      }
      const next = { ...base, ...updated };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Error al guardar configuración:", err);
    }
    configListeners.forEach((l) => l());
  }, []);

  return { config, updateConfig };
}

function HomeContent() {
  const router = useRouter();
  const [showConfig, setShowConfig] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Configuración sincronizada y persistente
  const { config, updateConfig } = useConfig();
  const studyTime = config.studyTime;
  const breakTime = config.breakTime;
  const cycles = config.cycles;

  const handleSetStudyTime = useCallback((val) => {
    updateConfig({ studyTime: val });
  }, [updateConfig]);

  const handleSetBreakTime = useCallback((val) => {
    updateConfig({ breakTime: val });
  }, [updateConfig]);

  const handleSetCycles = useCallback((val) => {
    updateConfig({ cycles: val });
  }, [updateConfig]);

  const handleActiveChange = useCallback((active) => {
    setIsTimerActive(active);
  }, []);

  // Metas y vinculación de sesión
  const searchParams = useSearchParams();
  const metaId = searchParams.get("meta");
  const { goals, logHours } = useMetas();
  const activeGoal = goals.find((g) => String(g.id) === String(metaId));

  // Notificación de horas registradas
  const [loggedNotice, setLoggedNotice] = useState(null);

  const handleStudyCompleted = useCallback((minutes) => {
    const hours = minutes / 60;
    if (activeGoal) {
      logHours(activeGoal.id, hours);
      setLoggedNotice(`¡Genial! Se registraron ${formatHours(hours)} h en "${activeGoal.name}".`);
      setTimeout(() => setLoggedNotice(null), 6000);
    }
  }, [activeGoal, logHours]);

  return (
    <main className="min-h-screen bg-white text-black flex flex-col p-6 md:p-8 font-sans relative">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full">
        {/* Botones de navegación agrupados a la izquierda */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setShowMetrics(true)}
            className="flex items-center gap-2 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <ChartIcon className="w-5 h-5 shrink-0" />
            <span>Métricas</span>
          </button>

          <Link
            href="/metas"
            className="flex items-center gap-2 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-100 transition-colors"
          >
            <TargetIcon className="w-5 h-5 shrink-0" />
            <span>Metas</span>
          </Link>
        </div>

        <button 
          onClick={() => {
            if (!isTimerActive) setShowConfig(true);
          }}
          className={`flex items-center gap-2 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl transition-colors ${
            isTimerActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
          }`}
          title={isTimerActive ? "No puedes configurar mientras el pomodoro está activo" : ""}
        >
          <SettingsIcon className="w-5 h-5 shrink-0" />
          <span>Configuración</span>
        </button>
      </header>

      {/* Main Content Area */}
      <section className="flex-grow flex flex-col items-center justify-center w-full my-6">
        {/* Indicador de Meta Vinculada o Selector rápido con icono SVG */}
        {activeGoal ? (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 border-2 border-black rounded-full px-5 py-2 bg-gray-50 shadow-sm animate-fade-in">
            <GoalIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">Meta activa:</span>
            <span className="font-bold text-sm md:text-base">{activeGoal.name}</span>
            <span className="text-xs font-mono text-gray-600">
              ({formatHours(activeGoal.doneHours)} / {formatHours(activeGoal.goalHours)} h)
            </span>
            <Link
              href="/"
              className="text-xs font-bold underline hover:opacity-60 ml-1 text-gray-500 hover:text-black"
              title="Desvincular meta para esta sesión"
            >
              ✕ Desvincular
            </Link>
          </div>
        ) : (
          goals.filter((g) => g.state === "activa").length > 0 && (
            <div className="mb-6 flex items-center gap-2 border-2 border-black rounded-full px-4 py-1.5 bg-white shadow-sm hover:bg-gray-50 transition-colors">
              <GoalIcon className="w-4 h-4 text-black shrink-0" />
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/?meta=${e.target.value}`);
                  }
                }}
                className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer pr-2"
                aria-label="Asignar meta a esta sesión"
              >
                <option value="">Asignar una meta a esta sesión...</option>
                {goals
                  .filter((g) => g.state === "activa")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({formatHours(g.doneHours)} / {formatHours(g.goalHours)} h)
                    </option>
                  ))}
              </select>
            </div>
          )
        )}

        {/* Notificación flotante de tiempo registrado */}
        {loggedNotice && (
          <div className="mb-4 bg-emerald-100 border-2 border-emerald-800 text-emerald-950 px-4 py-2 rounded-full text-sm font-semibold shadow">
            {loggedNotice}
          </div>
        )}

        <PomodoroTimer 
          studyTime={studyTime} 
          breakTime={breakTime} 
          cycles={cycles} 
          onActiveChange={handleActiveChange}
          onStudyCompleted={handleStudyCompleted}
          activeGoal={activeGoal}
        />
      </section>

      {/* Configuration Sidebar */}
      {showConfig && (
        <ConfigSidebar 
          onClose={() => setShowConfig(false)}
          studyTime={studyTime}
          setStudyTime={handleSetStudyTime}
          breakTime={breakTime}
          setBreakTime={handleSetBreakTime}
          cycles={cycles}
          setCycles={handleSetCycles}
        />
      )}

      {/* Metrics Sidebar */}
      {showMetrics && (
        <MetricsSidebar 
          onClose={() => setShowMetrics(false)} 
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}

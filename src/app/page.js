"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore, Suspense } from "react";
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

  // Opción A: Ajuste inteligente de sesión si a la meta le queda menos tiempo que el bloque
  const remainingHours = activeGoal ? Math.max(0, activeGoal.goalHours - activeGoal.doneHours) : 0;
  const remainingMinutes = Math.ceil(remainingHours * 60);
  const isGoalShort = Boolean(activeGoal && remainingMinutes > 0 && remainingMinutes < studyTime);
  const [useAutoAdjust, setUseAutoAdjust] = useState(true);

  // Tiempo y ciclos efectivos pasados al temporizador
  const effectiveStudyTime = (isGoalShort && useAutoAdjust) ? remainingMinutes : studyTime;
  const effectiveCycles = (isGoalShort && useAutoAdjust) ? 1 : cycles;

  // Notificación de horas registradas
  const [loggedNotice, setLoggedNotice] = useState(null);

  const handleStudyCompleted = useCallback((minutes) => {
    const hours = minutes / 60;
    const currentActive = goals.find((g) => String(g.id) === String(metaId));
    if (currentActive) {
      logHours(currentActive.id, hours);
      setLoggedNotice(`¡Genial! Se registraron ${formatHours(hours)} en "${currentActive.name}".`);
      setTimeout(() => setLoggedNotice(null), 6000);
    } else {
      // Si no se asignó meta o la meta fue eliminada, se resguardan las horas en Estudio General
      logHours("general", hours);
      setLoggedNotice(`¡Genial! Se registraron ${formatHours(hours)} en Estudio general.`);
      setTimeout(() => setLoggedNotice(null), 6000);
    }
  }, [goals, metaId, logHours]);

  return (
    <main className="min-h-screen bg-white text-zinc-900 flex flex-col p-5 sm:p-8 font-sans relative selection:bg-zinc-900 selection:text-white">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center pb-2">
        {/* Botones de navegación agrupados a la izquierda (bloqueados durante sesión de pomodoro) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button 
            onClick={() => {
              if (!isTimerActive) setShowMetrics(true);
            }}
            disabled={isTimerActive}
            className={`flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-75 rounded-none ${
              isTimerActive 
                ? "opacity-40 cursor-not-allowed text-zinc-400 border-zinc-100" 
                : "cursor-pointer text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
            title={isTimerActive ? "Bloqueado mientras el bloque de pomodoro está en curso" : "Ver métricas de estudio"}
          >
            <ChartIcon className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>Métricas</span>
          </button>

          {isTimerActive ? (
            <button
              disabled
              className="flex items-center gap-2 border border-zinc-100 px-3.5 py-1.5 text-xs sm:text-sm font-medium opacity-40 cursor-not-allowed text-zinc-400 rounded-none"
              title="Bloqueado mientras el bloque de pomodoro está en curso"
            >
              <TargetIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>Metas</span>
            </button>
          ) : (
            <Link
              href="/metas"
              className="flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 shadow-none rounded-none cursor-pointer"
              title="Gestionar metas de estudio"
            >
              <TargetIcon className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>Metas</span>
            </Link>
          )}
        </div>

        <button 
          onClick={() => {
            if (!isTimerActive) setShowConfig(true);
          }}
          disabled={isTimerActive}
          className={`flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-75 rounded-none ${
            isTimerActive 
              ? "opacity-40 cursor-not-allowed text-zinc-400 border-zinc-100" 
              : "cursor-pointer text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
          title={isTimerActive ? "Bloqueado mientras el bloque de pomodoro está en curso" : "Configurar duraciones"}
        >
          <SettingsIcon className="w-4 h-4 text-zinc-600 shrink-0" />
          <span>Configuración</span>
        </button>
      </header>

      {/* Main Content Area */}
      <section className="flex-grow flex flex-col items-center justify-center w-full my-8 max-w-4xl mx-auto">
        {/* Indicador de Meta Vinculada o Selector rápido */}
        {activeGoal ? (
          <div className="mb-4 inline-flex flex-wrap items-center justify-center gap-2 border border-zinc-200 px-4 py-1.5 bg-zinc-50 text-xs text-zinc-700">
            <span className="w-1.5 h-1.5 bg-zinc-900 shrink-0" />
            <span className="font-medium text-zinc-500">Meta:</span>
            <span className="font-semibold text-zinc-900">{activeGoal.name}</span>
            <span className="font-mono text-zinc-500 text-[11px]">
              ({formatHours(activeGoal.doneHours)} / {formatHours(activeGoal.goalHours)})
            </span>
            {isTimerActive ? (
              <span 
                className="text-[11px] font-medium text-zinc-400 ml-1 cursor-not-allowed"
                title="No puedes desvincular la meta mientras el bloque está en curso"
              >
                (Fijada en sesión)
              </span>
            ) : (
              <Link
                href="/"
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 ml-1 transition-colors duration-75"
                title="Desvincular meta para esta sesión"
              >
                ✕ Desvincular
              </Link>
            )}
          </div>
        ) : (
          goals.filter((g) => g.state === "activa").length > 0 && (
            <div className={`mb-4 inline-flex items-center gap-2 border border-zinc-200 px-3.5 py-1 bg-white transition-colors duration-75 ${isTimerActive ? "opacity-60" : "hover:border-zinc-300"}`}>
              <GoalIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value=""
                disabled={isTimerActive}
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/?meta=${e.target.value}`);
                  }
                }}
                className={`bg-transparent text-xs font-medium text-zinc-600 focus:outline-none pr-1 ${
                  isTimerActive ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                title={isTimerActive ? "No puedes cambiar de meta con una sesión activa" : "Asignar meta a esta sesión"}
                aria-label="Asignar meta a esta sesión"
              >
                <option value="" className="text-zinc-500">Vincular una meta a esta sesión...</option>
                {goals
                  .filter((g) => g.state === "activa")
                  .map((g) => (
                    <option key={g.id} value={g.id} className="text-zinc-900">
                      {g.name} ({formatHours(g.doneHours)} / {formatHours(g.goalHours)})
                    </option>
                  ))}
              </select>
            </div>
          )
        )}

        {/* Banner de Opción A: Auto-ajuste para completar meta corta */}
        {isGoalShort && (
          <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-2 border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs text-blue-900 shadow-2xs max-w-xl text-center">
            <span className="font-semibold text-blue-800">⚡ Meta próxima a completarse:</span>
            <span>
              {useAutoAdjust ? (
                <>
                  Sesión ajustada a <strong>{remainingMinutes} min (1 ciclo)</strong> para completarla exactamente.
                  <button
                    type="button"
                    disabled={isTimerActive}
                    onClick={() => setUseAutoAdjust(false)}
                    className={`ml-2 underline font-medium text-blue-700 hover:text-blue-950 ${
                      isTimerActive ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                    }`}
                  >
                    Usar normal ({studyTime} min)
                  </button>
                </>
              ) : (
                <>
                  Usando tiempo normal configurado ({studyTime} min).
                  <button
                    type="button"
                    disabled={isTimerActive}
                    onClick={() => setUseAutoAdjust(true)}
                    className={`ml-2 underline font-medium text-blue-700 hover:text-blue-950 ${
                      isTimerActive ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                    }`}
                  >
                    Ajustar a {remainingMinutes} min
                  </button>
                </>
              )}
            </span>
          </div>
        )}

        {/* Notificación flotante de tiempo registrado */}
        {loggedNotice && (
          <div className="mb-6 bg-zinc-900 text-white px-4 py-2 text-xs font-medium flex items-center gap-2 border border-zinc-800">
            <span>✓</span>
            <span>{loggedNotice}</span>
          </div>
        )}

        <PomodoroTimer 
          studyTime={effectiveStudyTime} 
          breakTime={breakTime} 
          cycles={effectiveCycles} 
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

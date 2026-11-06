"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlayIcon, PauseIcon, RotateCcwIcon, TrophyIcon, SkipForwardIcon, GoalIcon, CloseIcon } from "./icons/Icons";

const SESSION_STORAGE_KEY = "pomodoro.timer.session.v1";

// Helper puro fuera del componente para evitar TDZ y re-declaraciones
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  if (h > 0) {
    return `${h}:${m}:${sec}`;
  }
  return `${m}:${sec}`;
}

// Singleton de AudioContext desbloqueado por interacción del usuario
let globalAudioCtx = null;

function unlockAudioContext() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume();
    }
    return globalAudioCtx;
  } catch (err) {
    console.error("Error al desbloquear AudioContext:", err);
    return null;
  }
}

// Alertas sonoras usando el AudioContext desbloqueado
const playSound = (type = "transition") => {
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return;

    if (type === "celebration") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.15 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.45);
      });
    } else {
      const notes = [659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.18 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.5);
      });
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

const requestNotificationPermission = () => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
};

const sendNotification = (title, body) => {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }
};

export default function PomodoroTimer({ 
  studyTime = 25, 
  breakTime = 5, 
  cycles = 4, 
  onActiveChange,
  onStudyCompleted,
  activeGoal 
}) {
  const safeStudyTime = Number(studyTime) > 0 ? Number(studyTime) : 25;
  const safeBreakTime = Number(breakTime) > 0 ? Number(breakTime) : 5;
  // Descanso largo estándar de 15 a 30 minutos según la duración del descanso corto
  const safeLongBreakTime = Math.min(30, Math.max(15, safeBreakTime * 2));
  const safeCycles = Number(cycles) > 0 ? Number(cycles) : 4;

  const [timeLeft, setTimeLeft] = useState(safeStudyTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Estudio"); // "Estudio" | "Descanso" | "Descanso Largo"
  const [currentCycle, setCurrentCycle] = useState(1);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPartialSaveModal, setShowPartialSaveModal] = useState(false);
  const [partialMinutesToSave, setPartialMinutesToSave] = useState(0);

  const endTimeRef = useRef(null);

  // Restaurar sesión activa de localStorage al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const data = JSON.parse(savedSession);
          if (data.mode) setMode(data.mode);
          if (data.currentCycle) setCurrentCycle(data.currentCycle);

          if (data.isRunning && data.endTime) {
            const remaining = Math.max(0, Math.ceil((data.endTime - Date.now()) / 1000));
            if (remaining > 0) {
              setTimeLeft(remaining);
              endTimeRef.current = data.endTime;
              setIsRunning(true);
            } else {
              setTimeLeft(0);
            }
          } else if (typeof data.timeLeft === "number") {
            setTimeLeft(data.timeLeft);
          }
        }
      } catch (e) {
        console.error("Error al restaurar sesión de temporizador:", e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Guardar estado en caliente en localStorage cada vez que cambian variables clave
  useEffect(() => {
    const isStandardFull = 
      (mode === "Estudio" && timeLeft === safeStudyTime * 60 && currentCycle === 1 && !isRunning);

    if (isStandardFull) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        timeLeft,
        isRunning,
        mode,
        currentCycle,
        endTime: endTimeRef.current,
        timestamp: Date.now(),
        activeGoalId: activeGoal ? String(activeGoal.id) : null,
      }));
    } catch {}
  }, [timeLeft, isRunning, mode, currentCycle, safeStudyTime, activeGoal]);

  const isSessionStarted = 
    (mode === "Estudio" && timeLeft < safeStudyTime * 60) || 
    (mode === "Descanso" && timeLeft < safeBreakTime * 60) || 
    (mode === "Descanso Largo" && timeLeft < safeLongBreakTime * 60) || 
    currentCycle > 1 || 
    mode !== "Estudio";

  const isActive = isRunning || isSessionStarted;

  // Actualización si cambian las configuraciones y no hay sesión activa
  const [prevConfig, setPrevConfig] = useState({ 
    studyTime: safeStudyTime, 
    breakTime: safeBreakTime, 
    mode 
  });

  if (!isActive && (prevConfig.studyTime !== safeStudyTime || prevConfig.breakTime !== safeBreakTime || prevConfig.mode !== mode)) {
    setPrevConfig({ studyTime: safeStudyTime, breakTime: safeBreakTime, mode });
    if (mode === "Estudio") setTimeLeft(safeStudyTime * 60);
    else if (mode === "Descanso") setTimeLeft(safeBreakTime * 60);
    else setTimeLeft(safeLongBreakTime * 60);
  }

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isActive);
    }
  }, [isActive, onActiveChange]);

  // Sincronizar título de la pestaña
  useEffect(() => {
    if (isActive) {
      document.title = `(${formatTime(timeLeft)}) ${mode} | Pomodoro Tracker`;
    } else {
      document.title = "Pomodoro Tracker";
    }
  }, [timeLeft, mode, isActive]);

  useEffect(() => {
    return () => {
      document.title = "Pomodoro Tracker";
    };
  }, []);

  // Pasar a la siguiente fase
  const handleNextPhase = useCallback(() => {
    endTimeRef.current = null;
    setIsRunning(false);

    if (mode === "Estudio") {
      if (onStudyCompleted) {
        onStudyCompleted(safeStudyTime);
      }

      if (currentCycle < safeCycles) {
        playSound("transition");
        sendNotification("¡Bloque de estudio terminado!", `Momento de tomar un descanso de ${safeBreakTime} min.`);
        setMode("Descanso");
        setTimeLeft(safeBreakTime * 60);
      } else {
        playSound("celebration");
        sendNotification("¡Felicitaciones!", `Completaste tus ${safeCycles} ciclos de estudio.`);
        setShowCompletionModal(true);
      }
    } else if (mode === "Descanso") {
      playSound("transition");
      sendNotification("¡Descanso terminado!", `Iniciando ciclo de estudio ${currentCycle + 1}/${safeCycles}.`);
      setMode("Estudio");
      setCurrentCycle((prev) => prev + 1);
      setTimeLeft(safeStudyTime * 60);
    } else {
      // Descanso largo completado
      playSound("celebration");
      sendNotification("¡Descanso largo terminado!", "Sesión completa finalizada con éxito.");
      setMode("Estudio");
      setCurrentCycle(1);
      setTimeLeft(safeStudyTime * 60);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [mode, currentCycle, safeCycles, safeStudyTime, safeBreakTime, onStudyCompleted]);

  // Bucle de temporizador
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft((prev) => (prev !== remaining ? remaining : prev));

        if (remaining === 0) {
          clearInterval(interval);
          handleNextPhase();
        }
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, handleNextPhase]);

  const startTimer = () => {
    unlockAudioContext();
    requestNotificationPermission();
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  };

  const toggleTimer = () => {
    unlockAudioContext();
    if (isRunning) {
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    }
  };

  // Reiniciar con verificación de tiempo parcial estudiado
  const handleResetRequest = () => {
    unlockAudioContext();
    if (mode === "Estudio") {
      const elapsedSeconds = (safeStudyTime * 60) - timeLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);

      // Si estudió al menos 2 minutos y hay una meta activa, ofrecer guardar antes de reiniciar
      if (elapsedMinutes >= 2 && activeGoal) {
        setPartialMinutesToSave(elapsedMinutes);
        setShowPartialSaveModal(true);
        setIsRunning(false);
        endTimeRef.current = null;
        return;
      }
    }

    executeFullReset();
  };

  const executeFullReset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode("Estudio");
    setCurrentCycle(1);
    setTimeLeft(safeStudyTime * 60);
    setShowPartialSaveModal(false);
    setShowCompletionModal(false); // Cierra completamente el modal de felicitaciones
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [safeStudyTime]);

  // Cerrar modales con la tecla Escape
  useEffect(() => {
    if (!showPartialSaveModal && !showCompletionModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showPartialSaveModal) {
          setShowPartialSaveModal(false);
        } else if (showCompletionModal) {
          executeFullReset();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPartialSaveModal, showCompletionModal, executeFullReset]);

  const handleSavePartialAndReset = () => {
    if (onStudyCompleted && partialMinutesToSave > 0) {
      onStudyCompleted(partialMinutesToSave);
    }
    executeFullReset();
  };

  // Saltar fase manualmente (Skip)
  const handleSkipPhase = () => {
    unlockAudioContext();
    if (mode === "Estudio") {
      const elapsedSeconds = (safeStudyTime * 60) - timeLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      if (elapsedMinutes >= 1 && onStudyCompleted) {
        onStudyCompleted(elapsedMinutes);
      }
    }
    handleNextPhase();
  };

  // Iniciar descanso largo desde modal de felicitación
  const startLongBreak = () => {
    setShowCompletionModal(false);
    setMode("Descanso Largo");
    setCurrentCycle(safeCycles);
    setTimeLeft(safeLongBreakTime * 60);
    startTimer();
  };

  const renderCycles = () => {
    const cycleBars = [];
    for (let i = 1; i <= safeCycles; i++) {
      let stateClass = "bg-zinc-200";
      if (i < currentCycle) {
        stateClass = "bg-zinc-900";
      } else if (i === currentCycle) {
        stateClass = mode === "Estudio" && isRunning ? "bg-zinc-900 animate-pulse" : "bg-zinc-700";
      }

      cycleBars.push(
        <div
          key={i}
          className={`h-1.5 w-6 sm:w-8 transition-colors duration-300 ${stateClass}`}
          title={`Ciclo ${i} de ${safeCycles}`}
        />
      );
    }
    return cycleBars;
  };

  const totalTimeForMode = 
    mode === "Estudio" 
      ? safeStudyTime * 60 
      : mode === "Descanso" 
      ? safeBreakTime * 60 
      : safeLongBreakTime * 60;

  const isFullTime = timeLeft === totalTimeForMode;

  // Anillo SVG
  const radius = 136;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTimeForMode > 0 ? timeLeft / totalTimeForMode : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="flex flex-col items-center relative w-full max-w-md mx-auto">
      {/* Indicadores de ciclo segmentados y minimalistas */}
      <div className="flex items-center gap-2 mb-8" aria-label="Progreso de ciclos">
        {renderCycles()}
      </div>

      {/* Círculo del Temporizador con Anillo Radial SVG */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-88 md:h-88 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 300 300"
        >
          {/* Pista de fondo */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-zinc-100"
          />
          {/* Anillo de progreso dinámico */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-zinc-900"
          />
        </svg>

        {/* Contenido centrado dentro del anillo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-zinc-600 mb-2">
            {mode === "Estudio" 
              ? `Estudio · ${currentCycle}/${safeCycles}` 
              : mode === "Descanso"
              ? `Descanso · ${currentCycle}/${safeCycles}`
              : `Descanso Largo`}
          </span>
          
          <span className="text-6xl sm:text-7xl md:text-8xl font-mono font-light tracking-tight text-zinc-900 tabular-nums">
            {formatTime(timeLeft)}
          </span>

          {activeGoal && (
            <span className="text-xs text-zinc-600 mt-2 max-w-[180px] truncate" title={activeGoal.name}>
              {activeGoal.name}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Controles Ergonómica */}
      <div className="flex items-center gap-2.5 mt-8 flex-wrap justify-center">
        {!isRunning && isFullTime ? (
          <>
            <button 
              onClick={startTimer}
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors duration-75 shadow-xs cursor-pointer border border-zinc-900"
            >
              <PlayIcon className="w-4 h-4 fill-current" />
              <span>
                {mode === "Descanso" 
                  ? "Comenzar descanso" 
                  : mode === "Descanso Largo"
                  ? "Iniciar descanso largo"
                  : currentCycle > 1 
                  ? "Continuar estudio" 
                  : "Comenzar"}
              </span>
            </button>
            {isSessionStarted && (
              <button 
                onClick={handleResetRequest} 
                className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 cursor-pointer"
                title="Reiniciar temporizador"
              >
                <RotateCcwIcon className="w-4 h-4" />
                <span>Reiniciar</span>
              </button>
            )}
          </>
        ) : isRunning ? (
          <>
            <button 
              onClick={toggleTimer} 
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors duration-75 shadow-xs cursor-pointer border border-zinc-900"
            >
              <PauseIcon className="w-4 h-4 fill-current" />
              <span>Pausar</span>
            </button>
            <button 
              onClick={handleSkipPhase} 
              className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 cursor-pointer"
              title="Avanzar a la siguiente fase"
            >
              <SkipForwardIcon className="w-4 h-4" />
              <span>Saltar</span>
            </button>
            <button 
              onClick={handleResetRequest} 
              className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCcwIcon className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={toggleTimer} 
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors duration-75 shadow-xs cursor-pointer border border-zinc-900"
            >
              <PlayIcon className="w-4 h-4 fill-current" />
              <span>Reanudar</span>
            </button>
            <button 
              onClick={handleSkipPhase} 
              className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 cursor-pointer"
              title="Avanzar a la siguiente fase"
            >
              <SkipForwardIcon className="w-4 h-4" />
              <span>Saltar</span>
            </button>
            <button 
              onClick={handleResetRequest} 
              className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-75 cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCcwIcon className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          </>
        )}
      </div>

      {/* Modal de confirmación para guardar tiempo parcial al reiniciar */}
      {showPartialSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-zinc-200 p-6 max-w-sm w-full text-center flex flex-col items-center shadow-lg">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">¿Guardar tiempo estudiado?</h3>
            <p className="text-sm text-zinc-600 mb-6">
              Estudiaste <strong className="text-zinc-900 font-semibold">{partialMinutesToSave} minutos</strong> en este bloque para tu meta <strong className="text-zinc-900 font-semibold">{activeGoal?.name}</strong>. ¿Deseas registrarlos antes de reiniciar?
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                onClick={handleSavePartialAndReset}
                className="flex-1 bg-zinc-900 text-white py-2 font-medium text-xs sm:text-sm hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-900"
              >
                Guardar y reiniciar
              </button>
              <button
                onClick={executeFullReset}
                className="flex-1 border border-zinc-200 text-zinc-600 py-2 font-medium text-xs sm:text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Felicitaciones al completar todos los ciclos */}
      {showCompletionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={executeFullReset}
        >
          <div 
            className="bg-white border border-zinc-200 p-6 sm:p-7 max-w-sm w-full text-center flex flex-col items-center shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={executeFullReset}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 cursor-pointer p-1 transition-colors"
              aria-label="Cerrar modal"
            >
              <CloseIcon className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-4">
              <TrophyIcon className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-semibold text-zinc-900 mb-1.5">¡Felicitaciones!</h3>
            <p className="text-zinc-600 text-sm mb-4">
              {safeCycles === 1 
                ? "Has completado tu ciclo de pomodoro con éxito." 
                : `Has completado tus ${safeCycles} ciclos de pomodoro con éxito.`}
            </p>

            {activeGoal && (
              <p className="flex items-center justify-center gap-1.5 text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 mb-5 text-center w-full">
                <GoalIcon className="w-4 h-4 shrink-0 text-zinc-600" />
                <span>
                  Tiempo registrado en <strong className="text-zinc-900">{activeGoal.name}</strong>.
                </span>
              </p>
            )}

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={startLongBreak}
                className="w-full bg-zinc-900 text-white py-2.5 font-medium text-sm hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-900"
              >
                Tomar descanso largo ({safeLongBreakTime} min)
              </button>
              <button
                onClick={executeFullReset}
                className="w-full border border-zinc-200 text-zinc-600 py-2.5 font-medium text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Finalizar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

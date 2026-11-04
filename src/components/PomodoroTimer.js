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
      }));
    } catch {}
  }, [timeLeft, isRunning, mode, currentCycle, safeStudyTime]);

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
        setTimeLeft(remaining);

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

  const executeFullReset = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode("Estudio");
    setCurrentCycle(1);
    setTimeLeft(safeStudyTime * 60);
    setShowPartialSaveModal(false);
    setShowCompletionModal(false); // Cierra completamente el modal de felicitaciones
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

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
    const cycleDots = [];
    for (let i = 1; i <= safeCycles; i++) {
      if (i < currentCycle) {
        cycleDots.push(<div key={i} className="w-4 h-4 rounded-full bg-black" title={`Ciclo ${i} completado`}></div>);
      } else if (i === currentCycle) {
        if (mode === "Estudio") {
          cycleDots.push(
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 border-black ${isRunning ? 'animate-pulse' : ''} bg-black/60`}
              title={`Ciclo ${i} en curso`}
            ></div>
          );
        } else {
          cycleDots.push(<div key={i} className="w-4 h-4 rounded-full border-2 border-black bg-black" title={`Ciclo ${i} completado`}></div>);
        }
      } else {
        cycleDots.push(<div key={i} className="w-4 h-4 rounded-full border-2 border-black" title={`Ciclo ${i}`}></div>);
      }
    }
    return cycleDots;
  };

  const totalTimeForMode = 
    mode === "Estudio" 
      ? safeStudyTime * 60 
      : mode === "Descanso" 
      ? safeBreakTime * 60 
      : safeLongBreakTime * 60;

  const isFullTime = timeLeft === totalTimeForMode;

  return (
    <div className="flex flex-col items-center relative">
      {/* Indicadores de ciclo */}
      <div className="flex items-center gap-3 mb-6">
        {renderCycles()}
      </div>

      {/* Círculo del Temporizador */}
      <div 
        className="w-80 h-80 md:w-[28rem] md:h-[28rem] border-2 border-black rounded-full flex flex-col items-center justify-center transition-colors duration-500" 
        style={{ 
          backgroundColor: mode === "Descanso" ? "#e0f2fe" : mode === "Descanso Largo" ? "#dcfce7" : "transparent" 
        }}
      >
        <span className="text-sm md:text-lg tracking-widest uppercase mb-4 font-semibold text-center px-4">
          {mode === "Estudio" 
            ? `Modo Estudio (Ciclo ${currentCycle}/${safeCycles})` 
            : mode === "Descanso"
            ? `Descanso Corto (Ciclo ${currentCycle}/${safeCycles})`
            : `Descanso Largo (${safeLongBreakTime} min)`}
        </span>
        
        <span className="text-6xl md:text-8xl mb-6 font-mono select-none">
          {formatTime(timeLeft)}
        </span>
        
        {/* Barra de botones unificada */}
        <div className="flex gap-3 md:gap-4 items-center flex-wrap justify-center px-4">
          {!isRunning && isFullTime ? (
            <>
              <button 
                onClick={startTimer}
                className="flex items-center gap-2 border-2 border-black rounded-full px-5 md:px-6 py-2 text-base md:text-xl font-semibold hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <PlayIcon className="w-5 h-5 fill-current" />
                <span>
                  {mode === "Descanso" 
                    ? "Comenzar Descanso" 
                    : mode === "Descanso Largo"
                    ? "Iniciar Descanso Largo"
                    : currentCycle > 1 
                    ? "Comenzar Estudio" 
                    : "Comenzar"}
                </span>
              </button>
              {isSessionStarted && (
                <button 
                  onClick={handleResetRequest} 
                  className="flex items-center gap-1.5 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <RotateCcwIcon className="w-5 h-5" />
                  <span>Reiniciar</span>
                </button>
              )}
            </>
          ) : isRunning ? (
            <>
              <button 
                onClick={toggleTimer} 
                className="flex items-center gap-2 border-2 border-black rounded-full px-5 md:px-6 py-2 text-base md:text-xl font-semibold hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <PauseIcon className="w-5 h-5 fill-current" />
                <span>Pausar</span>
              </button>
              <button 
                onClick={handleSkipPhase} 
                className="flex items-center gap-1.5 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
                title="Avanzar a la siguiente fase"
              >
                <SkipForwardIcon className="w-5 h-5" />
                <span>Saltar</span>
              </button>
              <button 
                onClick={handleResetRequest} 
                className="flex items-center gap-1.5 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <RotateCcwIcon className="w-5 h-5" />
                <span>Reiniciar</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleTimer} 
                className="flex items-center gap-2 border-2 border-black rounded-full px-5 md:px-6 py-2 text-base md:text-xl font-semibold hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <PlayIcon className="w-5 h-5 fill-current" />
                <span>Reanudar</span>
              </button>
              <button 
                onClick={handleSkipPhase} 
                className="flex items-center gap-1.5 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
                title="Avanzar a la siguiente fase"
              >
                <SkipForwardIcon className="w-5 h-5" />
                <span>Saltar</span>
              </button>
              <button 
                onClick={handleResetRequest} 
                className="flex items-center gap-1.5 border-2 border-black rounded-full px-4 md:px-5 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <RotateCcwIcon className="w-5 h-5" />
                <span>Reiniciar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación para guardar tiempo parcial al reiniciar */}
      {showPartialSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border-2 border-black rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold mb-2">¿Guardar tiempo estudiado?</h3>
            <p className="text-sm text-gray-700 mb-6">
              Estudiaste <strong>{partialMinutesToSave} minutos</strong> en este bloque para tu meta <strong>{activeGoal?.name}</strong>. ¿Deseas registrarlos antes de reiniciar?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleSavePartialAndReset}
                className="flex-1 border-2 border-black rounded-full py-2 font-bold bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer text-sm"
              >
                Sí, guardar y reiniciar
              </button>
              <button
                onClick={executeFullReset}
                className="flex-1 border-2 border-black rounded-full py-2 font-bold hover:bg-gray-100 transition-colors cursor-pointer text-sm"
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
            className="bg-white border-2 border-black rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón X de cerrar */}
            <button
              type="button"
              onClick={executeFullReset}
              className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer"
              aria-label="Cerrar modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center text-3xl mb-4 bg-amber-100 text-amber-800">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">¡Felicitaciones!</h3>
            <p className="text-gray-700 text-sm mb-4">
              {safeCycles === 1 
                ? "Has completado tu 1 ciclo de pomodoro con éxito." 
                : `Has completado tus ${safeCycles} ciclos de pomodoro con éxito.`}
            </p>
            {activeGoal && (
              <p className="flex items-center justify-center gap-1.5 text-xs bg-emerald-50 border border-emerald-500 text-emerald-900 rounded-lg p-2.5 mb-5 text-center">
                <GoalIcon className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>
                  Se ha registrado el tiempo de tus {safeCycles} {safeCycles === 1 ? "ciclo" : "ciclos"} en tu meta <strong>{activeGoal.name}</strong>.
                </span>
              </p>
            )}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={startLongBreak}
                className="w-full border-2 border-black rounded-full py-2.5 font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer text-sm"
              >
                Tomar descanso largo ({safeLongBreakTime} min)
              </button>
              <button
                onClick={executeFullReset}
                className="w-full border-2 border-black rounded-full py-2.5 font-bold hover:bg-gray-100 transition-colors cursor-pointer text-sm"
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

"use client";

import { useState, useEffect, useRef } from "react";

// Web Audio API para alertas sonoras suaves sin dependencias externas
const playSound = (type = "transition") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "celebration") {
      // Arpegio de triunfo: C5, E5, G5, C6
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
      // Campanada suave de transición entre estudio y descanso (E5 -> A5)
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

export default function PomodoroTimer({ studyTime, breakTime, cycles, onActiveChange }) {
  const [timeLeft, setTimeLeft] = useState(studyTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Estudio"); // "Estudio" o "Descanso"
  const [currentCycle, setCurrentCycle] = useState(1);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Referencia para la marca de tiempo de finalización exacta (evita drift y throttling)
  const endTimeRef = useRef(null);

  const isSessionStarted = 
    (mode === "Estudio" && timeLeft < studyTime * 60) || 
    (mode === "Descanso" && timeLeft < breakTime * 60) || 
    currentCycle > 1 || 
    mode === "Descanso";

  const isActive = isRunning || isSessionStarted;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    if (h > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isActive);
    }
  }, [isActive, onActiveChange]);

  // Actualizar el tiempo inicial cuando cambian las configuraciones y no hay sesión activa
  useEffect(() => {
    if (!isActive) {
      if (mode === "Estudio") setTimeLeft(studyTime * 60);
      else setTimeLeft(breakTime * 60);
    }
  }, [studyTime, breakTime, isActive, mode]);

  // Sincronizar el título de la pestaña del navegador dinámicamente
  useEffect(() => {
    if (isActive) {
      document.title = `(${formatTime(timeLeft)}) ${mode === "Estudio" ? "Estudio" : "Descanso"} | Pomodoro Tracker`;
    } else {
      document.title = "Pomodoro Tracker";
    }
    return () => {
      document.title = "Pomodoro Tracker";
    };
  }, [timeLeft, mode, isActive]);

  // Bucle de temporizador basado en timestamps (Date.now())
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          endTimeRef.current = null;

          if (mode === "Estudio") {
            if (currentCycle < cycles) {
              playSound("transition");
              setMode("Descanso");
              setTimeLeft(breakTime * 60);
              setIsRunning(false);
            } else {
              playSound("celebration");
              setIsRunning(false);
              setMode("Estudio");
              setCurrentCycle(1);
              setTimeLeft(studyTime * 60);
              setShowCompletionModal(true);
            }
          } else {
            // Descanso completado -> Siguiente ciclo de estudio
            playSound("transition");
            setMode("Estudio");
            setCurrentCycle((prev) => prev + 1);
            setTimeLeft(studyTime * 60);
            setIsRunning(false);
          }
        }
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, currentCycle, cycles, studyTime, breakTime]);

  const startTimer = () => {
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode("Estudio");
    setCurrentCycle(1);
    setTimeLeft(studyTime * 60);
  };

  // Helper para dibujar los circulitos de los ciclos
  const renderCycles = () => {
    const cycleDots = [];
    for (let i = 1; i <= cycles; i++) {
      if (i < currentCycle) {
        cycleDots.push(<div key={i} className="w-4 h-4 rounded-full bg-black"></div>);
      } else if (i === currentCycle) {
        if (mode === "Estudio") {
          cycleDots.push(
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 border-black ${isRunning ? 'animate-pulse' : ''} bg-black/50`}
            ></div>
          );
        } else {
          cycleDots.push(<div key={i} className="w-4 h-4 rounded-full border-2 border-black bg-black"></div>);
        }
      } else {
        cycleDots.push(<div key={i} className="w-4 h-4 rounded-full border-2 border-black"></div>);
      }
    }
    return cycleDots;
  };

  const isFullTime = timeLeft === (mode === "Estudio" ? studyTime * 60 : breakTime * 60);

  return (
    <div className="flex flex-col items-center relative">
      {/* Indicadores de ciclo */}
      <div className="flex items-center gap-3 mb-6">
        {renderCycles()}
      </div>

      {/* Círculo del Temporizador */}
      <div 
        className="w-80 h-80 md:w-[28rem] md:h-[28rem] border-2 border-black rounded-full flex flex-col items-center justify-center transition-colors duration-500" 
        style={{ backgroundColor: mode === "Descanso" ? "#e0f2fe" : "transparent" }}
      >
        <span className="text-sm md:text-lg tracking-widest uppercase mb-6 font-semibold">
          {mode === "Estudio" ? `Modo Estudio (Ciclo ${currentCycle}/${cycles})` : `Descanso (Ciclo ${currentCycle}/${cycles})`}
        </span>
        <span className="text-6xl md:text-8xl mb-2 font-mono">{formatTime(timeLeft)}</span>
        
        {isRunning ? (
          <div className="flex gap-4 mt-6">
            <button 
              onClick={toggleTimer} 
              className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              Pausar
            </button>
            <button 
              onClick={resetTimer} 
              className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Reiniciar
            </button>
          </div>
        ) : (
          <div className="flex gap-4 mt-6">
            {!isFullTime && (
              <>
                <button 
                  onClick={toggleTimer} 
                  className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Reanudar
                </button>
                <button 
                  onClick={resetTimer} 
                  className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Reiniciar
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Botón de inicio para cuando está en espera de comenzar una fase completa */}
      {!isRunning && isFullTime && (
        <div className="mt-8 flex gap-4">
          <button 
            onClick={startTimer}
            className="border-2 border-black rounded-full px-8 py-3 text-2xl hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            {mode === "Descanso" ? "Comenzar Descanso" : currentCycle > 1 ? "Comenzar Estudio" : "Comenzar"}
          </button>
          {isSessionStarted && (
            <button 
              onClick={resetTimer} 
              className="border-2 border-black rounded-full px-6 py-3 text-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Reiniciar
            </button>
          )}
        </div>
      )}

      {/* Modal de Felicitaciones al completar todos los ciclos */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border-2 border-black rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center text-3xl mb-4 bg-amber-100">
              🏆
            </div>
            <h3 className="text-2xl font-bold mb-2">¡Felicitaciones!</h3>
            <p className="text-gray-700 text-sm mb-6">
              Has completado con éxito tus <strong>{cycles} ciclos</strong> de estudio. Es un gran momento para tomar una pausa larga y despejar tu mente.
            </p>
            <button
              onClick={() => setShowCompletionModal(false)}
              className="w-full border-2 border-black rounded-full py-2.5 font-bold hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { CloseIcon, MinusIcon, PlusIcon } from "./icons/Icons";

export default function ConfigSidebar({ 
  onClose,
  studyTime,
  setStudyTime,
  breakTime,
  setBreakTime,
  cycles,
  setCycles
}) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  }, [isClosing, onClose]);

  // Cerrar el sidebar con la tecla Escape con animación de deslizamiento sutil
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-end bg-black/40 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`} 
      onClick={handleClose}
    >
      <div 
        className={`bg-white border-l border-zinc-200 w-full max-w-md h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto rounded-none font-mono ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5 font-mono">
                <span className="text-[#51a2ff]">#</span>
                <span>Configuración.</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Personaliza los intervalos de tu temporizador</p>
            </div>
            <button 
              onClick={handleClose}
              className="border border-zinc-200 p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors duration-75 cursor-pointer rounded-none"
              aria-label="Cerrar configuración"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Duración de Estudio */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-700 tracking-wide">Tiempo de estudio</label>
              <span className="text-xs font-mono text-zinc-500">{studyTime} min</span>
            </div>
            
            {/* Presets rápidos */}
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              {[15, 25, 45, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStudyTime(preset)}
                  className={`py-1.5 text-xs font-mono font-medium border rounded-none transition-colors duration-75 cursor-pointer ${
                    Number(studyTime) === preset
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            {/* Stepper numérico */}
            <div className="flex justify-between items-center border border-zinc-200 p-2.5 bg-zinc-50/50 rounded-none">
              <span className="text-xs font-medium text-zinc-600">Ajuste manual</span>
              <div className="flex items-center border border-zinc-200 bg-white px-2 py-1 rounded-none">
                <button 
                  onClick={() => setStudyTime(Math.max(1, (Number(studyTime) || 25) - 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Disminuir tiempo de estudio"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="number"
                  min="1"
                  max="180"
                  value={studyTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setStudyTime("");
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setStudyTime(Math.max(1, Math.min(180, num)));
                    }
                  }}
                  onBlur={() => {
                    if (!studyTime || Number(studyTime) < 1) setStudyTime(25);
                  }}
                  className="font-mono text-sm font-semibold w-10 text-center bg-transparent focus:outline-none text-zinc-900 rounded-none"
                />
                <button 
                  onClick={() => setStudyTime(Math.min(180, (Number(studyTime) || 25) + 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Aumentar tiempo de estudio"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Duración de Descanso */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-700 tracking-wide">Tiempo de descanso</label>
              <span className="text-xs font-mono text-zinc-500">{breakTime} min</span>
            </div>

            {/* Presets rápidos */}
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              {[5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBreakTime(preset)}
                  className={`py-1.5 text-xs font-mono font-medium border rounded-none transition-colors duration-75 cursor-pointer ${
                    Number(breakTime) === preset
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            {/* Stepper numérico */}
            <div className="flex justify-between items-center border border-zinc-200 p-2.5 bg-zinc-50/50 rounded-none">
              <span className="text-xs font-medium text-zinc-600">Ajuste manual</span>
              <div className="flex items-center border border-zinc-200 bg-white px-2 py-1 rounded-none">
                <button 
                  onClick={() => setBreakTime(Math.max(1, (Number(breakTime) || 5) - 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Disminuir tiempo de descanso"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="number"
                  min="1"
                  max="60"
                  value={breakTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setBreakTime("");
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setBreakTime(Math.max(1, Math.min(60, num)));
                    }
                  }}
                  onBlur={() => {
                    if (!breakTime || Number(breakTime) < 1) setBreakTime(5);
                  }}
                  className="font-mono text-sm font-semibold w-10 text-center bg-transparent focus:outline-none text-zinc-900 rounded-none"
                />
                <button 
                  onClick={() => setBreakTime(Math.min(60, (Number(breakTime) || 5) + 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Aumentar tiempo de descanso"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Número de Ciclos */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-700 tracking-wide">Ciclos por sesión</label>
              <span className="text-xs font-mono text-zinc-500">{cycles} ciclos</span>
            </div>

            {/* Presets rápidos */}
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              {[2, 4, 6, 8].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCycles(preset)}
                  className={`py-1.5 text-xs font-mono font-medium border rounded-none transition-colors duration-75 cursor-pointer ${
                    Number(cycles) === preset
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Stepper numérico */}
            <div className="flex justify-between items-center border border-zinc-200 p-2.5 bg-zinc-50/50 rounded-none">
              <span className="text-xs font-medium text-zinc-600">Ajuste manual</span>
              <div className="flex items-center border border-zinc-200 bg-white px-2 py-1 rounded-none">
                <button 
                  onClick={() => setCycles(Math.max(1, (Number(cycles) || 4) - 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Disminuir número de ciclos"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="number"
                  min="1"
                  max="12"
                  value={cycles}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setCycles("");
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setCycles(Math.max(1, Math.min(12, num)));
                    }
                  }}
                  onBlur={() => {
                    if (!cycles || Number(cycles) < 1) setCycles(4);
                  }}
                  className="font-mono text-sm font-semibold w-10 text-center bg-transparent focus:outline-none text-zinc-900 rounded-none"
                />
                <button 
                  onClick={() => setCycles(Math.min(12, (Number(cycles) || 4) + 1))} 
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer rounded-none"
                  type="button"
                  aria-label="Aumentar número de ciclos"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Integración de Música */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200">
            <h3 className="text-xs font-semibold text-zinc-700 tracking-wide font-mono">Música</h3>
            <div className="flex justify-between items-center border border-zinc-200 p-3 bg-zinc-50/50 rounded-none">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-800">Spotify / Apple Music</span>
                
              </div>
              <button 
                disabled 
                className="border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-400 cursor-not-allowed rounded-none"
              >
                Conectar
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-400">
          <span>Cambios guardados automáticamente</span>
          <button
            onClick={handleClose}
            className="border border-zinc-900 bg-zinc-900 text-white px-4 py-1.5 text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer rounded-none"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
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
  // Cerrar el sidebar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div 
        className="bg-white border-l-2 border-black w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4">
            <h2 className="text-2xl font-bold">Configuración</h2>
            <button 
              onClick={onClose}
              className="border-2 border-black rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
              aria-label="Cerrar configuración"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Duración de Estudio */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">1. Duración de Estudio</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span className="text-base font-medium">Tiempo (min)</span>
              <div className="flex items-center justify-between border border-black rounded-2xl px-3 py-1.5 w-36">
                <button 
                  onClick={() => setStudyTime(Math.max(1, (Number(studyTime) || 25) - 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Disminuir tiempo de estudio"
                >
                  <MinusIcon className="w-4 h-4" />
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
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button 
                  onClick={() => setStudyTime(Math.min(180, (Number(studyTime) || 25) + 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Aumentar tiempo de estudio"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Duración de Descanso */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">2. Duración de Descanso</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span className="text-base font-medium">Tiempo (min)</span>
              <div className="flex items-center justify-between border border-black rounded-2xl px-3 py-1.5 w-36">
                <button 
                  onClick={() => setBreakTime(Math.max(1, (Number(breakTime) || 5) - 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Disminuir tiempo de descanso"
                >
                  <MinusIcon className="w-4 h-4" />
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
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button 
                  onClick={() => setBreakTime(Math.min(60, (Number(breakTime) || 5) + 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Aumentar tiempo de descanso"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Número de Ciclos */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">3. Número de Ciclos</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span className="text-base font-medium">Repeticiones</span>
              <div className="flex items-center justify-between border border-black rounded-2xl px-3 py-1.5 w-36">
                <button 
                  onClick={() => setCycles(Math.max(1, (Number(cycles) || 4) - 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Disminuir número de ciclos"
                >
                  <MinusIcon className="w-4 h-4" />
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
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button 
                  onClick={() => setCycles(Math.min(12, (Number(cycles) || 4) + 1))} 
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
                  type="button"
                  aria-label="Aumentar número de ciclos"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Integración de Música */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">4. Integración de Música</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span>Spotify / Apple Music</span>
              <button className="border border-black rounded-full px-4 py-1 text-sm cursor-pointer hover:bg-gray-100">
                Conectar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

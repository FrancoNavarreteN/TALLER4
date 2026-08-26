"use client";

import { useState } from "react";

export default function Home() {
  const [showConfig, setShowConfig] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);

  // Mock data with muted, sophisticated grayscale/slate shades
  const metricsData = [
    { day: "13 AGO", subjects: [{ name: "Taller 4", hours: 1.5, color: "#1e293b" }, { name: "Cálculo", hours: 1.0, color: "#475569" }, { name: "Física", hours: 0.5, color: "#64748b" }, { name: "Otros", hours: 0.5, color: "#94a3b8" }] },
    { day: "14 AGO", subjects: [{ name: "Taller 4", hours: 2.0, color: "#1e293b" }, { name: "Cálculo", hours: 1.5, color: "#475569" }, { name: "Otros", hours: 1.0, color: "#94a3b8" }] },
    { day: "15 AGO", subjects: [{ name: "Cálculo", hours: 1.0, color: "#475569" }, { name: "Física", hours: 1.0, color: "#64748b" }] },
    { day: "16 AGO", subjects: [{ name: "Taller 4", hours: 3.0, color: "#1e293b" }, { name: "Programación", hours: 2.0, color: "#334155" }] },
    { day: "17 AGO", subjects: [{ name: "Física", hours: 1.5, color: "#64748b" }, { name: "Otros", hours: 0.5, color: "#94a3b8" }] },
    { day: "18 AGO", subjects: [{ name: "Taller 4", hours: 2.5, color: "#1e293b" }, { name: "Cálculo", hours: 2.0, color: "#475569" }, { name: "Programación", hours: 1.5, color: "#334155" }] },
    { day: "19 AGO", subjects: [{ name: "Cálculo", hours: 1.5, color: "#475569" }, { name: "Física", hours: 1.0, color: "#64748b" }] },
    { day: "20 AGO", subjects: [{ name: "Taller 4", hours: 2.0, color: "#1e293b" }, { name: "Programación", hours: 2.5, color: "#334155" }] },
    { day: "21 AGO", subjects: [{ name: "Física", hours: 2.0, color: "#64748b" }, { name: "Cálculo", hours: 1.0, color: "#475569" }] },
    { day: "22 AGO", subjects: [{ name: "Taller 4", hours: 4.0, color: "#1e293b" }, { name: "Programación", hours: 1.5, color: "#334155" }, { name: "Otros", hours: 1.0, color: "#94a3b8" }] },
    { day: "23 AGO", subjects: [{ name: "Cálculo", hours: 2.0, color: "#475569" }] },
    { day: "24 AGO", subjects: [{ name: "Taller 4", hours: 3.5, color: "#1e293b" }, { name: "Física", hours: 1.5, color: "#64748b" }] },
    { day: "25 AGO", subjects: [{ name: "Programación", hours: 3.0, color: "#334155" }, { name: "Cálculo", hours: 1.5, color: "#475569" }] },
    { day: "26 AGO", subjects: [{ name: "Taller 4", hours: 2.5, color: "#1e293b" }, { name: "Cálculo", hours: 2.0, color: "#475569" }, { name: "Física", hours: 1.0, color: "#64748b" }] },
  ];

  return (
    <main className="min-h-screen bg-white text-black flex flex-col p-8 font-sans relative">
      {/* Top Header */}
      <header className="flex justify-between w-full">
        <button 
          onClick={() => setShowMetrics(true)}
          className="border-2 border-black rounded-full px-6 py-2 text-xl cursor-pointer"
        >
          Métricas
        </button>
        <button 
          onClick={() => setShowConfig(true)}
          className="border-2 border-black rounded-full px-6 py-2 text-xl cursor-pointer"
        >
          Configuración
        </button>
      </header>

      {/* Main Content Area */}
      <section className="flex-grow flex items-center justify-center w-full">
        {/* Center Timer & Controls */}
        <div className="flex flex-col items-center">
          {/* Cycle Tracker Circles */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-4 h-4 rounded-full border-2 border-black"></div>
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-4 h-4 rounded-full border-2 border-black"></div>
          </div>

          <div className="w-80 h-80 md:w-[28rem] md:h-[28rem] border-2 border-black rounded-full flex flex-col items-center justify-center">
            <span className="text-sm md:text-lg tracking-widest uppercase mb-6 font-semibold">
              Modo Estudio
            </span>
            <span className="text-6xl md:text-8xl mb-2">00:00</span>
            <div className="flex gap-8 mt-6">
              <button className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl">
                Pausar
              </button>
              <button className="border-2 border-black rounded-full px-6 py-2 text-base md:text-xl">
                Reanudar
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="border-2 border-black rounded-full px-8 py-3 text-2xl">
              Comenzar
            </button>
          </div>
        </div>
      </section>

      {/* Configuration Sidebar */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setShowConfig(false)}>
          <div 
            className="bg-white border-l-2 border-black w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              {/* Sidebar Header */}
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <h2 className="text-2xl font-bold">Configuración</h2>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 1. Duración de Estudio */}
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg">1. Duración de Estudio</h3>
                <div className="flex justify-between items-center border border-black rounded-xl p-3">
                  <span className="text-base font-medium">Tiempo (min)</span>
                  <div className="flex items-center justify-between border border-black rounded-2xl px-4 py-2 w-36">
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                    <span className="font-mono text-xl font-semibold">25</span>
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
                  </div>
                </div>
              </div>

              {/* 2. Duración de Descanso */}
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg">2. Duración de Descanso</h3>
                <div className="flex justify-between items-center border border-black rounded-xl p-3">
                  <span className="text-base font-medium">Tiempo (min)</span>
                  <div className="flex items-center justify-between border border-black rounded-2xl px-4 py-2 w-36">
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                    <span className="font-mono text-xl font-semibold">5</span>
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
                  </div>
                </div>
              </div>

              {/* 3. Número de Ciclos */}
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-lg">3. Número de Ciclos</h3>
                <div className="flex justify-between items-center border border-black rounded-xl p-3">
                  <span className="text-base font-medium">Repeticiones</span>
                  <div className="flex items-center justify-between border border-black rounded-2xl px-4 py-2 w-36">
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                    <span className="font-mono text-xl font-semibold">4</span>
                    <button className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
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
      )}

      {/* Metrics Sidebar */}
      {showMetrics && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/20" onClick={() => setShowMetrics(false)}>
          <div 
            className="bg-white border-r-2 border-black w-full max-w-2xl h-full p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <div>
                  <h2 className="text-2xl font-bold">Métricas de Estudio</h2>
                  <p className="text-sm text-gray-600">Progreso diario diseccionado por tema</p>
                </div>
                <button 
                  onClick={() => setShowMetrics(false)}
                  className="border-2 border-black w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Stacked Bar Chart */}
              <div className="border border-black p-4 flex flex-col gap-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-base">Últimos 14 días</h3>
                </div>

                {/* Chart Graphic Area */}
                <div className="h-64 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-gray-400 relative">
                  {metricsData.map((item, idx) => {
                    const totalHours = item.subjects.reduce((sum, s) => sum + s.hours, 0);
                    const barHeightPct = Math.min((totalHours / 7) * 100, 100);

                    return (
                      <div 
                        key={idx}
                        className="flex-1 h-full flex flex-col justify-end items-center relative cursor-pointer"
                        onMouseEnter={() => setHoveredDay(item)}
                        onMouseLeave={() => {
                          setHoveredDay(null);
                          setHoveredSubject(null);
                        }}
                      >
                        {/* Stacked Bar Container */}
                        <div 
                          className="w-full flex flex-col-reverse"
                          style={{ height: `${barHeightPct}%` }}
                        >
                          {item.subjects.map((sub, sIdx) => {
                            const segmentHeightPct = (sub.hours / totalHours) * 100;
                            const isHovered = hoveredSubject === sub.name;
                            const isAnyHovered = hoveredSubject !== null;

                            // If a subbar is hovered, highlight matching subject, fade out others to light grey
                            let bgColor = sub.color;
                            if (isAnyHovered) {
                              bgColor = isHovered ? sub.color : "#e2e8f0";
                            }

                            return (
                              <div 
                                key={sIdx} 
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  setHoveredSubject(sub.name);
                                }}
                                style={{ 
                                  height: `${segmentHeightPct}%`, 
                                  backgroundColor: bgColor
                                }}
                                className="w-full border-b border-white transition-colors duration-100"
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Floating Tooltip Dissecting the Hovered Bar */}
                  {hoveredDay && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white p-3 shadow-xl z-20 text-xs w-60 border border-gray-700 pointer-events-none">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-1.5 mb-2 font-mono">
                        <span className="font-bold">{hoveredDay.day}</span>
                        <span className="text-gray-300">
                          {hoveredDay.subjects.reduce((sum, s) => sum + s.hours, 0).toFixed(1)}h total
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {hoveredDay.subjects.map((sub, sIdx) => {
                          const isHovered = hoveredSubject === sub.name;
                          return (
                            <div 
                              key={sIdx} 
                              className={`flex justify-between items-center ${isHovered ? "font-bold text-white underline" : "text-gray-300"}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5" style={{ backgroundColor: sub.color }}></span>
                                <span>{sub.name}</span>
                              </div>
                              <span className="font-mono">{sub.hours}h</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Day Labels */}
                <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                  <span>{metricsData[0].day}</span>
                  <span>{metricsData[6].day}</span>
                  <span>{metricsData[13].day}</span>
                </div>

                {/* Subject Color Legend */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  {[
                    { name: "Taller 4", color: "#1e293b" },
                    { name: "Programación", color: "#334155" },
                    { name: "Cálculo", color: "#475569" },
                    { name: "Física", color: "#64748b" },
                    { name: "Otros", color: "#94a3b8" },
                  ].map((sub) => (
                    <div 
                      key={sub.name}
                      onMouseEnter={() => setHoveredSubject(sub.name)}
                      onMouseLeave={() => setHoveredSubject(null)}
                      className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hoveredSubject && hoveredSubject !== sub.name ? "opacity-40" : "opacity-100"}`}
                    >
                      <span className="w-3 h-3" style={{ backgroundColor: sub.color }}></span>
                      <span>{sub.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

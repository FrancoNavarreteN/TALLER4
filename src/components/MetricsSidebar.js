"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatHours, lastDays, useMetas } from "../lib/metas";

const DAYS_SHOWN = 14;

// Tonos de gris/azul pizarra, se reutilizan en orden si hay muchas metas
const PALETTE = ["#1e293b", "#475569", "#64748b", "#334155", "#94a3b8", "#0f172a", "#7c8ba1"];

function dayLabel(key) {
  const d = new Date(key + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleDateString("es-CL", { month: "short" }).replace(".", "").toUpperCase();
  return `${day} ${month}`;
}

export default function MetricsSidebar({ onClose }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const { goals } = useMetas();

  // Color fijo por meta (según su posición en la lista)
  const colorOf = useMemo(() => {
    const map = {};
    goals.forEach((g, i) => {
      map[g.id] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [goals]);

  // Datos reales: horas registradas por día y por meta en los últimos 14 días
  const metricsData = useMemo(() => {
    return lastDays(DAYS_SHOWN).map(({ key }) => ({
      day: dayLabel(key),
      subjects: goals
        .filter((g) => (g.byDay[key] || 0) > 0)
        .map((g) => ({ name: g.name, hours: g.byDay[key], color: colorOf[g.id] })),
    }));
  }, [goals, colorOf]);

  const totalHours = metricsData.reduce(
    (sum, d) => sum + d.subjects.reduce((s, sub) => s + sub.hours, 0),
    0
  );
  const daysStudied = metricsData.filter((d) => d.subjects.length > 0).length;

  // La escala se ajusta al día con más horas (mínimo 4 h para que no se vea gigante con poco dato)
  const maxDayHours = Math.max(
    4,
    ...metricsData.map((d) => d.subjects.reduce((s, sub) => s + sub.hours, 0))
  );

  // Leyenda: solo metas con horas dentro del período
  const periodKeys = lastDays(DAYS_SHOWN).map((d) => d.key);
  const legend = goals
    .filter((g) => periodKeys.some((k) => (g.byDay[k] || 0) > 0))
    .map((g) => ({ name: g.name, color: colorOf[g.id] }));

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/20" onClick={onClose}>
      <div
        className="bg-white border-r-2 border-black w-full max-w-2xl h-full p-6 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4">
            <div>
              <h2 className="text-2xl font-bold">Métricas de Estudio</h2>
              <p className="text-sm text-gray-600">Horas registradas en tus metas, por día</p>
            </div>
            <button
              onClick={onClose}
              className="border-2 border-black w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {totalHours === 0 ? (
            <div className="border border-black p-6 flex flex-col items-center gap-4 text-center">
              <p className="text-gray-700">
                Todavía no hay horas registradas. Crea una meta y registra tu estudio para ver aquí tu progreso.
              </p>
              <Link
                href="/metas"
                className="border-2 border-black rounded-full px-6 py-2 font-semibold hover:bg-black hover:text-white transition-colors"
              >
                Ir a Metas
              </Link>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-black p-3">
                  <p className="text-xs text-gray-600">Total en {DAYS_SHOWN} días</p>
                  <p className="text-2xl font-mono font-semibold">{formatHours(totalHours)} h</p>
                </div>
                <div className="border border-black p-3">
                  <p className="text-xs text-gray-600">Días con estudio</p>
                  <p className="text-2xl font-mono font-semibold">
                    {daysStudied} / {DAYS_SHOWN}
                  </p>
                </div>
              </div>

              {/* Stacked Bar Chart */}
              <div className="border border-black p-4 flex flex-col gap-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-base">Últimos {DAYS_SHOWN} días</h3>
                </div>

                {/* Chart Graphic Area */}
                <div className="h-64 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-gray-400 relative">
                                
                  {metricsData.map((item, idx) => {
                    const dayTotal = item.subjects.reduce((sum, s) => sum + s.hours, 0);
                    const barHeightPct = Math.min((dayTotal / maxDayHours) * 100, 100);

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
                            const segmentHeightPct = (sub.hours / dayTotal) * 100;
                            const isHovered = hoveredSubject === sub.name;
                            const isAnyHovered = hoveredSubject !== null;

                            let bgColor = sub.color;
                            if (isAnyHovered) {
                              bgColor = isHovered ? sub.color : "#e2e8f0";
                            }
                            // Renderiza cada segmento de la barra apilada, con color según la meta
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

                  {hoveredDay && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white p-3 shadow-xl z-20 text-xs w-60 border border-gray-700 pointer-events-none">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-1.5 mb-2 font-mono">
                        <span className="font-bold">{hoveredDay.day}</span>
                        <span className="text-gray-300">
                          {formatHours(hoveredDay.subjects.reduce((sum, s) => sum + s.hours, 0))}h total
                        </span>
                      </div>
                      {hoveredDay.subjects.length === 0 ? (
                        <p className="text-gray-300">Sin estudio registrado</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {hoveredDay.subjects.map((sub, sIdx) => {
                            const isHovered = hoveredSubject === sub.name;
                            return (
                              <div
                                key={sIdx}
                                className={`flex justify-between items-center gap-2 ${isHovered ? "font-bold text-white underline" : "text-gray-300"}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: sub.color }}></span>
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                <span className="font-mono shrink-0">{formatHours(sub.hours)}h</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Day Labels */}
                <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                  <span>{metricsData[0].day}</span>
                  <span>{metricsData[Math.floor(DAYS_SHOWN / 2)].day}</span>
                  <span>{metricsData[DAYS_SHOWN - 1].day}</span>
                </div>

                {/* Goal Color Legend */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  {legend.map((sub) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
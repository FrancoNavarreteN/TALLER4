"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatHours, lastDays, dayKey, useMetas } from "../lib/metas";
import StudyHeatmap from "./StudyHeatmap";

// Paleta de colores oficial de OpenCode (opencode.ai/es/data)
const OPENCODE_PALETTE = [
  "#51a2ff", // Azul eléctrico
  "#7c86ff", // Índigo / Periwinkle
  "#a684ff", // Violeta suave
  "#ed6aff", // Magenta
  "#ff8904", // Naranja cálido
  "#ffb900", // Ámbar dorado
  "#9ae600", // Lima
  "#00bc7d", // Esmeralda
  "#00d5be", // Turquesa
  "#00d3f2", // Cian
  "#808080", // Gris neutral
];

export default function MetricsSidebar({ onClose }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const { goals, generalGoal } = useMetas();

  // Lista combinada de metas y estudio general para telemetría completa
  const allGoals = useMemo(() => {
    if (generalGoal && generalGoal.doneHours > 0) {
      return [...goals, generalGoal];
    }
    return goals;
  }, [goals, generalGoal]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  }, [isClosing, onClose]);

  // Cerrar la ventana con la tecla Escape con animación de deslizamiento sutil
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

  // Color fijo por meta usando la paleta de OpenCode + zinc-500 para estudio general
  const colorOf = useMemo(() => {
    const map = {};
    goals.forEach((g, i) => {
      map[g.id] = OPENCODE_PALETTE[i % OPENCODE_PALETTE.length];
    });
    map["general"] = "#71717a"; // zinc-500 para estudio general
    return map;
  }, [goals]);

  // Total acumulado histórico en todas las metas y estudio general
  const allTimeTotalHours = useMemo(() => {
    return allGoals.reduce((sum, g) => sum + (g.doneHours || 0), 0);
  }, [allGoals]);

  // Datos reales: 14 días (últimas dos semanas hasta hoy)
  const metricsData = useMemo(() => {
    const today = new Date();
    const todayStr = dayKey(today);

    return lastDays(14).map(({ key, date }) => {
      const dayNum = date.getDate();
      const shortDay = date.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "").slice(0, 3).toUpperCase();
      const fullLabel = date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
      const subjects = allGoals
        .filter((g) => (g.byDay[key] || 0) > 0)
        .map((g) => ({ name: g.name, hours: g.byDay[key], color: colorOf[g.id] || "#71717a" }));
      const dayTotal = subjects.reduce((sum, s) => sum + s.hours, 0);

      return {
        key,
        date,
        dayNum,
        shortDay,
        fullLabel,
        isToday: key === todayStr,
        dayTotal,
        subjects,
      };
    });
  }, [allGoals, colorOf]);

  const totalHours = metricsData.reduce((sum, d) => sum + d.dayTotal, 0);
  const daysStudied = metricsData.filter((d) => d.dayTotal > 0).length;

  const maxDayHours = Math.max(
    4,
    ...metricsData.map((d) => d.dayTotal)
  );

  const dateRangeLabel = useMemo(() => {
    if (metricsData.length === 0) return "";
    const start = metricsData[0].date.toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");
    const end = metricsData[metricsData.length - 1].date.toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");
    return `${start} - ${end}`;
  }, [metricsData]);

  // Leyenda: metas y estudio general en las últimas dos semanas
  const legend = useMemo(() => {
    const periodKeys = new Set(metricsData.map((d) => d.key));
    return allGoals
      .filter((g) => Array.from(periodKeys).some((k) => (g.byDay[k] || 0) > 0))
      .map((g) => {
        const goalTotalInPeriod = Array.from(periodKeys).reduce((sum, k) => sum + (g.byDay[k] || 0), 0);
        return {
          id: g.id,
          name: g.name,
          color: colorOf[g.id] || "#71717a",
          totalInPeriod: goalTotalInPeriod,
        };
      });
  }, [metricsData, allGoals, colorOf]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-start bg-black/40 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`} 
      onClick={handleClose}
    >
      <div
        className={`bg-white text-zinc-900 border-r border-zinc-200 w-full max-w-3xl lg:max-w-4xl h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto font-mono ${
          isClosing ? "animate-slide-out-left" : "animate-slide-in-left"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          {/* Header estilo OpenCode con ancla # sobre fondo blanco */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-[#51a2ff]">#</span>
                <span>Métricas de estudio.</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Telemetría de horas registradas por día</p>
            </div>
            <button
              onClick={handleClose}
              className="border border-zinc-200 bg-white hover:bg-zinc-50 p-1.5 text-zinc-600 hover:text-zinc-900 transition-colors duration-75 cursor-pointer text-xs"
              aria-label="Cerrar métricas"
            >
              [esc] ✕
            </button>
          </div>

          {/* Tarjetas de Resumen estilo OpenCode Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-zinc-200 bg-zinc-50/50 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total acumulado</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {formatHours(allTimeTotalHours)}
              </p>
            </div>
            <div className="border border-zinc-200 bg-zinc-50/50 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Últimas 2 semanas</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {formatHours(totalHours)} <span className="text-xs font-normal text-zinc-500">({daysStudied}/14 d)</span>
              </p>
            </div>
          </div>

          {/* Mapa de Calor de Actividad Anual (Estilo GitHub en Escala de Rojos) */}
          <StudyHeatmap goals={allGoals} colorOf={colorOf} />

          {/* Gráfico de Barras Apiladas estilo OpenCode (Últimas 2 semanas: 14 barras unidas) */}
          <div className="border border-zinc-200 bg-zinc-50/30 p-4 sm:p-5 flex flex-col gap-4 relative">
            {/* Cabecera del gráfico */}
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#51a2ff]"></span>
                <span className="text-xs font-semibold text-zinc-900">Horas por meta (Últimas 2 semanas)</span>
                <span className="text-[11px] text-zinc-400 font-mono">({dateRangeLabel})</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                <span>TOTAL: {formatHours(totalHours)}</span>
                <span className="text-zinc-300">|</span>
                <span>PICO: {formatHours(maxDayHours)}</span>
              </div>
            </div>

            {/* Contenedor con las 14 barras unidas por gap constante */}
            <div className="w-full overflow-x-auto pb-1">
              <div className="w-fit mx-auto flex flex-col items-center">
                {/* Área de las 14 barras */}
                <div className="h-56 flex items-end gap-2 sm:gap-2.5 md:gap-3 pt-6 pb-2 border-b border-zinc-200 relative">
                  {metricsData.map((item) => {
                    const barHeightPct = Math.min((item.dayTotal / maxDayHours) * 100, 100);

                    return (
                      <div
                        key={item.key}
                        className="w-6 sm:w-7 md:w-8 h-full flex flex-col justify-end items-center relative cursor-pointer group shrink-0"
                        onMouseEnter={() => setHoveredDay(item)}
                        onMouseLeave={() => {
                          setHoveredDay(null);
                          setHoveredSubject(null);
                        }}
                      >
                        {/* Pista de fondo de columna */}
                        <div className="w-full bg-zinc-100 flex flex-col-reverse h-full justify-start overflow-hidden">
                          {/* Contenedor de barras apiladas por color */}
                          <div
                            className="w-full flex flex-col-reverse overflow-hidden"
                            style={{ height: `${barHeightPct}%` }}
                          >
                            {item.subjects.map((sub, sIdx) => {
                              const segmentHeightPct = (sub.hours / item.dayTotal) * 100;
                              const isHovered = hoveredSubject === sub.name;
                              const isAnyHovered = hoveredSubject !== null;

                              let opacityStyle = 1;
                              if (isAnyHovered) {
                                opacityStyle = isHovered ? 1 : 0.25;
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
                                    backgroundColor: sub.color,
                                    opacity: opacityStyle,
                                  }}
                                  className="w-full border-b border-white transition-opacity duration-75"
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tooltip técnico de OpenCode Data */}
                  {hoveredDay && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white text-zinc-900 p-3 shadow-md z-20 text-xs w-60 border border-zinc-300 pointer-events-none">
                      <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5 mb-2 font-mono">
                        <span className="font-semibold text-[#51a2ff]">{hoveredDay.fullLabel}</span>
                        <span className="text-zinc-500">
                          {formatHours(hoveredDay.dayTotal)} total
                        </span>
                      </div>
                      {hoveredDay.subjects.length === 0 ? (
                        <p className="text-zinc-400 text-[11px]">0h registradas</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {hoveredDay.subjects.map((sub, sIdx) => {
                            const isHovered = hoveredSubject === sub.name;
                            return (
                              <div
                                key={sIdx}
                                className={`flex justify-between items-center gap-2 ${
                                  isHovered ? "font-bold text-zinc-950" : "text-zinc-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 shrink-0"
                                    style={{ backgroundColor: sub.color }}
                                  />
                                  <span className="truncate text-[11px]">{sub.name}</span>
                                </div>
                                <span className="font-mono text-[11px] shrink-0 text-zinc-900 font-medium">
                                  {formatHours(sub.hours)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Etiquetas de los 14 días directamente bajo cada barra */}
                <div className="flex gap-2 sm:gap-2.5 md:gap-3 pt-2 text-center font-mono">
                  {metricsData.map((d) => (
                    <div
                      key={d.key}
                      className={`w-6 sm:w-7 md:w-8 flex flex-col items-center leading-tight select-none ${
                        d.isToday ? "text-zinc-950 font-bold" : "text-zinc-600"
                      }`}
                    >
                      <span className={`text-[10px] ${d.isToday ? "text-zinc-950 font-bold" : "text-zinc-400"}`}>{d.shortDay}</span>
                      <span className={`text-[11px] ${d.isToday ? "text-zinc-950 font-bold" : "text-zinc-600"}`}>{d.dayNum}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda con colores de OpenCode para las 2 semanas */}
            {legend.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-200 text-xs">
                {legend.map((sub) => (
                  <div
                    key={sub.name}
                    onMouseEnter={() => setHoveredSubject(sub.name)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-1 border transition-colors duration-75 ${
                      hoveredSubject === sub.name
                        ? "bg-zinc-100 border-zinc-400 text-zinc-950 font-medium"
                        : hoveredSubject !== null
                        ? "border-zinc-200 text-zinc-400 opacity-40"
                        : "bg-white border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className="w-2 h-2 shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="text-[11px] font-medium">{sub.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatHours(sub.totalInPeriod)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500">
          <span>período: 14 días ({dateRangeLabel})</span>
          <button
            onClick={handleClose}
            className="text-[#51a2ff] hover:underline cursor-pointer font-medium"
          >
            [cerrar]
          </button>
        </div>
      </div>
    </div>
  );
}
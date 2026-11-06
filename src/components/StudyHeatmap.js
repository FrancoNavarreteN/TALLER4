"use client";

import { useState, useMemo } from "react";
import { formatHours, dayKey } from "../lib/metas";

// Escala de intensidad de rojos estilo GitHub
function getHeatmapColorClass(hours, isFuture) {
  if (isFuture) {
    return "border border-dashed border-zinc-200 bg-zinc-50/40 cursor-default";
  }
  if (!hours || hours <= 0) {
    return "bg-zinc-100 border border-zinc-200/80 hover:border-zinc-400";
  }
  if (hours <= 1.0) {
    return "bg-[#fecaca] border border-[#fca5a5] hover:border-[#f87171]"; // Nivel 1 (≤ 1h)
  }
  if (hours <= 2.5) {
    return "bg-[#f87171] border border-[#ef4444] hover:border-[#dc2626]"; // Nivel 2 (≤ 2.5h)
  }
  if (hours <= 4.0) {
    return "bg-[#dc2626] border border-[#b91c1c] hover:border-[#991b1b]"; // Nivel 3 (≤ 4h)
  }
  return "bg-[#991b1b] border border-[#7f1d1d] hover:border-[#450a0a]"; // Nivel 4 (> 4h)
}

function formatDateFull(date) {
  const formatted = date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function StudyHeatmap({ goals = [], colorOf = {} }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Mapeo de horas y materias registradas por día (clave YYYY-MM-DD)
  const activityByDay = useMemo(() => {
    const map = {};
    goals.forEach((g) => {
      Object.entries(g.byDay || {}).forEach(([date, hours]) => {
        if (hours > 0) {
          if (!map[date]) {
            map[date] = { total: 0, subjects: [] };
          }
          map[date].total += hours;
          map[date].subjects.push({
            name: g.name,
            hours,
            color: colorOf[g.id] || "#dc2626",
          });
        }
      });
    });
    return map;
  }, [goals, colorOf]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dayKey(today), [today]);

  // Generación de la matriz anual (52 semanas consecutivas tipo GitHub)
  const yearData = useMemo(() => {
    const dayOfWeek = (today.getDay() + 6) % 7; // Lunes = 0 ... Domingo = 6
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() + (6 - dayOfWeek));

    const startMonday = new Date(currentSunday);
    startMonday.setDate(currentSunday.getDate() - (52 * 7 - 1));

    const weeks = [];
    let current = new Date(startMonday);
    let yearTotalHours = 0;
    let yearActiveDays = 0;

    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const key = dayKey(current);
        const isFuture = key > todayKey;
        const dayActivity = activityByDay[key] || { total: 0, subjects: [] };

        if (!isFuture && dayActivity.total > 0) {
          yearTotalHours += dayActivity.total;
          yearActiveDays += 1;
        }

        days.push({
          date: new Date(current),
          key,
          dayOfMonth: current.getDate(),
          month: current.getMonth(),
          isToday: key === todayKey,
          isFuture,
          hours: dayActivity.total,
          subjects: dayActivity.subjects,
        });

        current.setDate(current.getDate() + 1);
      }
      weeks.push(days);
    }

    // Etiquetas de mes en el eje horizontal
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, wIdx) => {
      const m = week[0].month;
      if (m !== lastMonth) {
        const raw = week[0].date.toLocaleDateString("es-CL", { month: "short" }).replace(".", "").slice(0, 3);
        monthLabels.push({
          colIndex: wIdx,
          label: raw.charAt(0).toUpperCase() + raw.slice(1),
        });
        lastMonth = m;
      }
    });

    return {
      weeks,
      monthLabels,
      totalHours: yearTotalHours,
      activeDays: yearActiveDays,
    };
  }, [today, todayKey, activityByDay]);

  return (
    <div className="border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5 flex flex-col gap-4 font-mono relative">
      {/* Cabecera del Mapa de Calor Anual */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#dc2626]"></span>
            <span className="text-xs font-semibold text-zinc-900">
              {formatHours(yearData.totalHours)} de estudio en el último año
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5">
            {yearData.activeDays} días de actividad registrados (52 semanas)
          </span>
        </div>
      </div>

      {/* Matriz Anual de 52 semanas tipo GitHub */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-[690px]">
          {/* Eje de meses arriba */}
          <div className="flex text-[10px] text-zinc-500 h-4 pl-8 relative">
            {yearData.monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute select-none"
                style={{ left: `${m.colIndex * 13 + 32}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Matriz con etiquetas de día a la izquierda (Lun, Mié, Vie) */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-[2.5px] text-[10px] text-zinc-400 select-none pr-1">
              {["Lun", "", "Mié", "", "Vie", "", ""].map((dName, idx) => (
                <span key={idx} className="h-[11px] flex items-center justify-end leading-none">
                  {dName}
                </span>
              ))}
            </div>

            {/* 52 Columnas de semanas */}
            <div className="flex gap-[2.5px]">
              {yearData.weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2.5px]">
                  {week.map((day) => {
                    const colorClass = getHeatmapColorClass(day.hours, day.isFuture);
                    return (
                      <div
                        key={day.key}
                        onMouseEnter={() => !day.isFuture && setHoveredCell(day)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-[11px] h-[11px] transition-colors duration-75 cursor-pointer ${colorClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip flotante con detalles del día */}
      {hoveredCell && (
        <div className="border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 shadow-sm flex flex-col gap-1 pointer-events-none">
          <div className="flex justify-between items-baseline gap-4 border-b border-zinc-100 pb-1">
            <span className="font-semibold text-zinc-900">
              {formatDateFull(hoveredCell.date)}
            </span>
            <span className="font-mono text-[#dc2626] font-semibold">
              {formatHours(hoveredCell.hours)}
            </span>
          </div>

          {hoveredCell.subjects && hoveredCell.subjects.length > 0 ? (
            <div className="flex flex-col gap-1 pt-0.5">
              {hoveredCell.subjects.map((sub, sIdx) => (
                <div key={sIdx} className="flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="truncate text-zinc-600">{sub.name}</span>
                  </div>
                  <span className="font-mono text-zinc-900 font-medium shrink-0">
                    {formatHours(sub.hours)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400">Sin horas registradas este día</p>
          )}
        </div>
      )}

      {/* Leyenda en escala de rojos tipo GitHub */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 text-[11px] text-zinc-500 font-mono">
        <span>Constancia anual</span>
        <div className="flex items-center gap-1.5">
          <span>Menos</span>
          <span className="w-2.5 h-2.5 bg-zinc-100 border border-zinc-200/80" title="0 horas" />
          <span className="w-2.5 h-2.5 bg-[#fecaca] border border-[#fca5a5]" title="≤ 1 hora" />
          <span className="w-2.5 h-2.5 bg-[#f87171] border border-[#ef4444]" title="≤ 2.5 horas" />
          <span className="w-2.5 h-2.5 bg-[#dc2626] border border-[#b91c1c]" title="≤ 4 horas" />
          <span className="w-2.5 h-2.5 bg-[#991b1b] border border-[#7f1d1d]" title="> 4 horas" />
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}

"use client";

// Aclaracion: Codigo hecho en parte con ayuda de Claude, con el objetivo de probar el localStorage y el uso de metas //

import { useSyncExternalStore, useMemo, useCallback } from "react";

const KEY = "pomodoro.metas.v1";
const listeners = new Set();

// Suscripción a cambios en localStorage para mantener sincronizado el estado de las metas //
function subscribe(callback) {
  listeners.add(callback);
  const onStorage = (e) => {
    if (e.key === KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

// Funciones para obtener y parsear los datos de metas desde localStorage //
function getSnapshot() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

// Esta función es para el renderizado del lado del servidor, donde no hay acceso a localStorage //
function getServerSnapshot() {
  return "";
}

// Funciones para parsear y escribir los datos de metas en localStorage //
function parse(raw) {
  if (!raw) return { goals: [], logs: [] };
  try {
    const data = JSON.parse(raw);
    return {
      goals: Array.isArray(data.goals) ? data.goals : [],
      logs: Array.isArray(data.logs) ? data.logs : [],
    };
  } catch {
    return { goals: [], logs: [] };
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.error("No se pudo guardar en localStorage:", err);
  }
  listeners.forEach((l) => l());
}

// Funciones auxiliares para manejar fechas y horas en el contexto de metas //
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(fromKey, toKey) {
  return Math.round((keyToDate(toKey) - keyToDate(fromKey)) / 86400000);
}

// Función que calcula los 7 días de la semana actual (de Lunes a Domingo)
export function currentWeekDates(baseDate = new Date()) {
  const date = new Date(baseDate);
  // Domingo = 0, Lunes = 1 ... Sábado = 6.
  // Transformamos para que Lunes = 0 ... Domingo = 6.
  const dayOfWeek = (date.getDay() + 6) % 7;

  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek);

  const days = [];
  const todayKey = dayKey(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dayKey(d);
    const shortDay = d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "").slice(0, 2).toUpperCase();
    days.push({
      key,
      dayNumber: d.getDate(),
      label: `${shortDay} ${d.getDate()}`,
      shortDay,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      date: d,
    });
  }

  const startDay = days[0].date.getDate();
  const endDay = days[6].date.getDate();
  const startMonth = days[0].date.toLocaleDateString("es-CL", { month: "short" }).replace(".", "");
  const endMonth = days[6].date.toLocaleDateString("es-CL", { month: "short" }).replace(".", "");

  const rangeLabel = startMonth === endMonth
    ? `${startDay} - ${endDay} ${startMonth}`
    : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

  return { days, rangeLabel };
}

// Función para formatear horas a un string con hasta dos decimales, eliminando ceros innecesarios //
export function formatHours(h) {
  const rounded = Math.round(h * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

// Hook personalizado para manejar el estado de metas
export function useMetas() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const data = useMemo(() => parse(raw), [raw]);

  const addGoal = useCallback(({ name, goalHours, deadline }) => {
    const current = parse(getSnapshot());
    const goal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      goalHours: Number(goalHours),
      created: new Date().toISOString(),
      deadline: deadline || null,
    };
    write({ ...current, goals: [goal, ...current.goals] });
  }, []);

  const updateGoal = useCallback((goalId, updates) => {
    const current = parse(getSnapshot());
    write({
      ...current,
      goals: current.goals.map((g) => {
        if (String(g.id) !== String(goalId)) return g;
        return {
          ...g,
          name: updates.name ? updates.name.trim() : g.name,
          goalHours: updates.goalHours !== undefined ? Number(updates.goalHours) : g.goalHours,
          deadline: updates.deadline !== undefined ? (updates.deadline || null) : g.deadline,
        };
      }),
    });
  }, []);

  const deleteGoal = useCallback((goalId) => {
    const current = parse(getSnapshot());
    write({
      goals: current.goals.filter((g) => String(g.id) !== String(goalId)),
      logs: current.logs.filter((l) => String(l.goalId) !== String(goalId)),
    });
  }, []);

  const logHours = useCallback((goalId, hours, date = dayKey()) => {
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) return;
    const current = parse(getSnapshot());
    const existing = current.logs.find((l) => String(l.goalId) === String(goalId) && l.date === date);
    const logs = existing
      ? current.logs.map((l) => (l === existing ? { ...l, hours: l.hours + value } : l))
      : [...current.logs, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, goalId: String(goalId), date, hours: value }];
    write({ ...current, logs });
  }, []);

  const undoToday = useCallback((goalId) => {
    const current = parse(getSnapshot());
    const today = dayKey();
    write({
      ...current,
      logs: current.logs.filter((l) => !(String(l.goalId) === String(goalId) && l.date === today)),
    });
  }, []);

  // Metas con su progreso calculado (incluyendo la semana actual)
  const goals = useMemo(() => {
    const today = dayKey();
    const { days: weekDays } = currentWeekDates();
    const weekKeys = new Set(weekDays.map((d) => d.key));

    return data.goals.map((goal) => {
      const logs = data.logs.filter((l) => String(l.goalId) === String(goal.id));
      const doneHours = logs.reduce((sum, l) => sum + l.hours, 0);
      const byDay = {};
      logs.forEach((l) => {
        byDay[l.date] = (byDay[l.date] || 0) + l.hours;
      });
      const weekHours = logs
        .filter((l) => weekKeys.has(l.date))
        .reduce((sum, l) => sum + l.hours, 0);

      const completed = doneHours >= goal.goalHours;
      const overdue = !completed && goal.deadline && goal.deadline < today;
      return {
        ...goal,
        doneHours,
        byDay,
        todayHours: byDay[today] || 0,
        weekHours,
        state: completed ? "completada" : overdue ? "vencida" : "activa",
      };
    });
  }, [data]);

  return { goals, addGoal, updateGoal, deleteGoal, logHours, undoToday };
}

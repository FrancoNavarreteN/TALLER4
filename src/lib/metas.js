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

// Esta función es para el renderizado del lado del servidor, donde no hay acceso a localStorage. Devuelve un estado vacío. //
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

// Función para escribir los datos de metas en localStorage y notificar a los listeners //
function write(data) {
    // Guardar en localStorage y notificar a los listeners //
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

// Función para convertir una clave de fecha (YYYY-MM-DD) a un objeto Date //
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Función para calcular la diferencia en días entre dos claves de fecha //
export function daysBetween(fromKey, toKey) {
  return Math.round((keyToDate(toKey) - keyToDate(fromKey)) / 86400000);
}

export function lastDays(n = 7) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString("es-CL", { weekday: "narrow" }).toUpperCase(),
    });
  }
  return out;
}

// Función para formatear horas a un string con hasta dos decimales, eliminando ceros innecesarios //
export function formatHours(h) {
  const rounded = Math.round(h * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

// Hook personalizado para manejar el estado de metas, incluyendo agregar, 
// eliminar, registrar horas y deshacer registros del día actual //
export function useMetas() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const data = useMemo(() => parse(raw), [raw]);

  const addGoal = useCallback(({ name, goalHours, deadline }) => {
    const current = parse(getSnapshot());
    const goal = {
      id: Date.now(),
      name: name.trim(),
      goalHours: Number(goalHours),
      created: new Date().toISOString(),
      deadline: deadline || null,
    };
    write({ ...current, goals: [goal, ...current.goals] });
  }, []);

  const deleteGoal = useCallback((goalId) => {
    const current = parse(getSnapshot());
    write({
      goals: current.goals.filter((g) => g.id !== goalId),
      logs: current.logs.filter((l) => l.goalId !== goalId),
    });
  }, []);

  const logHours = useCallback((goalId, hours, date = dayKey()) => {
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) return;
    const current = parse(getSnapshot());
    const existing = current.logs.find((l) => l.goalId === goalId && l.date === date);
    const logs = existing
      ? current.logs.map((l) => (l === existing ? { ...l, hours: l.hours + value } : l))
      : [...current.logs, { id: Date.now(), goalId, date, hours: value }];
    write({ ...current, logs });
  }, []);

  const undoToday = useCallback((goalId) => {
    const current = parse(getSnapshot());
    const today = dayKey();
    write({
      ...current,
      logs: current.logs.filter((l) => !(l.goalId === goalId && l.date === today)),
    });
  }, []);

  // Metas con su progreso ya calculado
  const goals = useMemo(() => {
    const today = dayKey();
    return data.goals.map((goal) => {
      const logs = data.logs.filter((l) => l.goalId === goal.id);
      const doneHours = logs.reduce((sum, l) => sum + l.hours, 0);
      const byDay = {};
      logs.forEach((l) => {
        byDay[l.date] = (byDay[l.date] || 0) + l.hours;
      });
      const completed = doneHours >= goal.goalHours;
      const overdue = !completed && goal.deadline && goal.deadline < today;
      return {
        ...goal,
        doneHours,
        byDay,
        todayHours: byDay[today] || 0,
        state: completed ? "completada" : overdue ? "vencida" : "activa",
      };
    });
  }, [data]);

  return { goals, addGoal, deleteGoal, logHours, undoToday };
}
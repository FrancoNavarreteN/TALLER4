"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import PomodoroTimer from "../components/PomodoroTimer";
import ConfigSidebar from "../components/ConfigSidebar";
import MetricsSidebar from "../components/MetricsSidebar";

export default function Home() {
  const [showConfig, setShowConfig] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const handleActiveChange = useCallback((active) => {
    setIsTimerActive(active);
  }, []);
  
  // Estados de configuración global
  const [studyTime, setStudyTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [cycles, setCycles] = useState(4);

  return (
    <main className="min-h-screen bg-white text-black flex flex-col p-8 font-sans relative">
      {/* Top Header */}
      <header className="flex justify-between w-full">
        <button 
          onClick={() => setShowMetrics(true)}
          className="border-2 border-black rounded-full px-6 py-2 text-xl cursor-pointer hover:bg-gray-100 transition-colors">
          Métricas
        </button>

        {/* PARA MI GRUPO: mover el boton para la izquierda al lado de metricas */}
        
        <Link
          href="/metas"
          className="border-2 border-black rounded-full px-6 py-2 text-xl hover:bg-gray-100 transition-colors"
        >
          Metas
        </Link>

        <button 
          onClick={() => {
            if (!isTimerActive) setShowConfig(true);
          }}
          className={`border-2 border-black rounded-full px-6 py-2 text-xl transition-colors ${isTimerActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
          title={isTimerActive ? "No puedes configurar mientras el pomodoro está activo" : ""}
        >
          Configuración
        </button>
      </header>

      {/* Main Content Area */}
      <section className="flex-grow flex items-center justify-center w-full">
        <PomodoroTimer 
          studyTime={studyTime} 
          breakTime={breakTime} 
          cycles={cycles} 
          onActiveChange={handleActiveChange}
        />
      </section>

      {/* Configuration Sidebar */}
      {showConfig && (
        <ConfigSidebar 
          onClose={() => setShowConfig(false)}
          studyTime={studyTime}
          setStudyTime={setStudyTime}
          breakTime={breakTime}
          setBreakTime={setBreakTime}
          cycles={cycles}
          setCycles={setCycles}
        />
      )}

      {/* Metrics Sidebar */}
      {showMetrics && (
        <MetricsSidebar 
          onClose={() => setShowMetrics(false)} 
        />
      )}
    </main>
  );
}

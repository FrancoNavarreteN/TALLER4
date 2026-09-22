"use client";

export default function ConfigSidebar({ 
  onClose,
  studyTime,
  setStudyTime,
  breakTime,
  setBreakTime,
  cycles,
  setCycles
}) {
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
              className="border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-100"
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
                <button onClick={() => setStudyTime(Math.max(1, Number(studyTime) - 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                <input 
                  type="number"
                  min="1"
                  max="180"
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value === '' ? '' : Math.min(180, parseInt(e.target.value)))}
                  onBlur={() => (!studyTime || studyTime < 1) && setStudyTime(25)}
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button onClick={() => setStudyTime(Math.min(180, Number(studyTime) + 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
              </div>
            </div>
          </div>

          {/* 2. Duración de Descanso */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">2. Duración de Descanso</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span className="text-base font-medium">Tiempo (min)</span>
              <div className="flex items-center justify-between border border-black rounded-2xl px-4 py-2 w-36">
                <button onClick={() => setBreakTime(Math.max(1, Number(breakTime) - 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                <input 
                  type="number"
                  min="1"
                  max="60"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value === '' ? '' : Math.min(60, parseInt(e.target.value)))}
                  onBlur={() => (!breakTime || breakTime < 1) && setBreakTime(5)}
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button onClick={() => setBreakTime(Math.min(60, Number(breakTime) + 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
              </div>
            </div>
          </div>

          {/* 3. Número de Ciclos */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg">3. Número de Ciclos</h3>
            <div className="flex justify-between items-center border border-black rounded-xl p-3">
              <span className="text-base font-medium">Repeticiones</span>
              <div className="flex items-center justify-between border border-black rounded-2xl px-4 py-2 w-36">
                <button onClick={() => setCycles(Math.max(1, Number(cycles) - 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">-</button>
                <input 
                  type="number"
                  min="1"
                  max="5"
                  value={cycles}
                  onChange={(e) => setCycles(e.target.value === '' ? '' : Math.min(5, parseInt(e.target.value)))}
                  onBlur={() => (!cycles || cycles < 1) && setCycles(4)}
                  className="font-mono text-xl font-semibold w-12 text-center bg-transparent focus:outline-none"
                />
                <button onClick={() => setCycles(Math.min(5, Number(cycles) + 1))} className="text-xl font-bold cursor-pointer hover:opacity-60">+</button>
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

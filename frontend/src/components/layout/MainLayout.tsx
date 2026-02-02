import React from "react";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-text-main flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl rounded-3xl bg-white/80 shadow-soft border border-grid-deep/10 overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Sidebar - Title & Graphic */}
          <aside className="lg:w-2/5 bg-background/50 px-8 py-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-grid-deep/10 flex flex-col justify-center lg:justify-between">
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl lg:text-6xl tracking-[0.3em] text-text-main font-bold mb-2 leading-tight">
                  BATTLE
                  <br />
                  <span className="text-accent-primary">SHIP</span>
                </h1>
                <div className="h-1 w-16 bg-accent-primary/30 rounded-full mt-4" />
              </div>
              <p className="text-sm text-text-main/65 max-w-xs leading-relaxed">
                Minimalist online duel on a calm ocean grid. Real-time turns, clean feedback, and a subtle gamer touch.
              </p>
            </div>

            {/* Radar Grid with Ships */}
            <div className="mt-12 lg:mt-0 flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[320px] mx-auto">
                {/* Radar screen background */}
                <div className="absolute inset-0 rounded-3xl bg-grid-deep/10 border-2 border-grid-deep/30 shadow-inner" />
                
                {/* Concentric radar circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border border-grid-deep/20" />
                  <div className="absolute w-3/4 h-3/4 rounded-full border border-grid-deep/15" />
                  <div className="absolute w-1/2 h-1/2 rounded-full border border-grid-deep/10" />
                </div>
                
                {/* Grid lines (radar sweep lines) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Horizontal lines */}
                  <div className="absolute w-full h-px bg-grid-deep/20" />
                  <div className="absolute w-full h-px bg-grid-deep/20 top-1/4" />
                  <div className="absolute w-full h-px bg-grid-deep/20 top-3/4" />
                  {/* Vertical lines */}
                  <div className="absolute h-full w-px bg-grid-deep/20" />
                  <div className="absolute h-full w-px bg-grid-deep/20 left-1/4" />
                  <div className="absolute h-full w-px bg-grid-deep/20 left-3/4" />
                </div>
                
                {/* Ships positioned on grid */}
                {/* Ship 1 - Horizontal */}
                <div className="absolute top-[20%] left-[15%] flex gap-0.5">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="w-3 h-3 rounded-sm bg-accent-secondary/90 border border-accent-secondary" />
                  ))}
                </div>
                
                {/* Ship 2 - Vertical */}
                <div className="absolute top-[35%] right-[20%] flex flex-col gap-0.5">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="w-3 h-3 rounded-sm bg-accent-secondary/90 border border-accent-secondary" />
                  ))}
                </div>
                
                {/* Ship 3 - Horizontal */}
                <div className="absolute bottom-[25%] left-[25%] flex gap-0.5">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="w-3 h-3 rounded-sm bg-accent-secondary/90 border border-accent-secondary" />
                  ))}
                </div>
                
                {/* Radar sweep effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left bg-gradient-to-r from-accent-primary/30 via-accent-primary/10 to-transparent animate-radar-sweep" />
                </div>
                
                {/* Center point */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/60 ring-2 ring-accent-primary/20" />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:w-3/5 px-6 md:px-10 lg:px-12 py-10 lg:py-16 flex items-center justify-center">
            <div className="w-full max-w-lg mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

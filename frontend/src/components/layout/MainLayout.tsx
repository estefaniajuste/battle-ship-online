import React from "react";
import { useGame } from "../../state/GameContext";
import { useAuth } from "../../state/AuthContext";

const MENU_COLORS = {
  bg: "#F3E1D3",
  darkGreen: "#1E3D2F",
  radarDeep: "#0F241A",
  orange: "#D97A1F",
  brown: "#7C5C20",
  radarGlow: "#F1C40F",
  lightGreen: "#4a7c59",
  beige: "#E8D5C4"
};

export const MainLayout: React.FC<{ children: React.ReactNode; isHome?: boolean }> = ({ children, isHome = false }) => {
  const { setScreen } = useGame();
  const { user, logout } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: MENU_COLORS.bg, color: MENU_COLORS.darkGreen }}
    >
      <div className="w-full max-w-6xl flex flex-col lg:flex-row min-h-[580px] gap-0">
        {/* Left zone: title, radar, auth – no white container */}
        <aside
          className="lg:w-2/5 px-6 lg:px-10 py-10 lg:py-14 border-b lg:border-b-0 lg:border-r flex flex-col justify-center lg:justify-between"
          style={{ borderColor: "rgba(30,61,47,0.1)" }}
        >
          {/* Title – large, elegant display font */}
          <div>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none tracking-wide"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.08em"
              }}
            >
              <span style={{ color: MENU_COLORS.darkGreen }}>BATTLE</span>
              <br />
              <span style={{ color: MENU_COLORS.orange }}>SHIP</span>
            </h1>
          </div>

          {/* Radar – consola militar, fondo verde profundo, grid y objetivos activos */}
          <div className="mt-8 lg:mt-0 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-[320px] lg:max-w-[360px] mx-auto">
              <div
                className="absolute inset-0 rounded-[2rem] border-2 shadow-xl overflow-hidden"
                style={{
                  backgroundColor: MENU_COLORS.radarDeep,
                  borderColor: "rgba(8,20,14,0.9)",
                  // textura sutil de pantalla + efecto cristal oscuro
                  backgroundImage:
                    "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.03) 0, transparent 55%)," +
                    "radial-gradient(circle at 90% 100%, rgba(255,255,255,0.04) 0, transparent 55%)," +
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
                  boxShadow: "0 22px 40px rgba(0,0,0,0.55), inset 0 0 40px rgba(0,0,0,0.9)"
                }}
              />
              {/* Grid + círculos concéntricos – estilo consola */}
              <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] overflow-hidden">
                <div
                  className="w-full h-full rounded-full border"
                  style={{ borderColor: "rgba(120, 255, 191, 0.32)" }}
                />
                <div
                  className="absolute w-3/4 h-3/4 rounded-full border"
                  style={{ borderColor: "rgba(120, 255, 191, 0.26)" }}
                />
                <div
                  className="absolute w-1/2 h-1/2 rounded-full border"
                  style={{ borderColor: "rgba(120, 255, 191, 0.22)" }}
                />
                <div
                  className="absolute w-1/4 h-1/4 rounded-full border"
                  style={{ borderColor: "rgba(120, 255, 191, 0.2)" }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] overflow-hidden">
                <div className="absolute w-full h-px" style={{ backgroundColor: "rgba(120,255,191,0.3)" }} />
                <div className="absolute w-full h-px top-1/4" style={{ backgroundColor: "rgba(120,255,191,0.2)" }} />
                <div className="absolute w-full h-px top-3/4" style={{ backgroundColor: "rgba(120,255,191,0.2)" }} />
                <div className="absolute h-full w-px" style={{ backgroundColor: "rgba(120,255,191,0.3)" }} />
                <div className="absolute h-full w-px left-1/4" style={{ backgroundColor: "rgba(120,255,191,0.2)" }} />
                <div className="absolute h-full w-px left-3/4" style={{ backgroundColor: "rgba(120,255,191,0.2)" }} />
              </div>
              {/* Cardinales N S E W – brújula militar */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-[6%] text-[0.6rem] tracking-[0.25em]"
                  style={{ color: "rgba(120,255,191,0.9)" }}
                >
                  N
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-[6%] text-[0.6rem] tracking-[0.25em]"
                  style={{ color: "rgba(120,255,191,0.7)" }}
                >
                  S
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-[6%] text-[0.6rem] tracking-[0.25em]"
                  style={{ color: "rgba(120,255,191,0.8)" }}
                >
                  W
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 right-[6%] text-[0.6rem] tracking-[0.25em]"
                  style={{ color: "rgba(120,255,191,0.8)" }}
                >
                  E
                </div>
              </div>
              {/* Persistent luminous trail (yellow/green arc) */}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                <div className="radar-trail-arc" />
              </div>
              {/* Ship blips – objetivos detectados (ligeramente más suaves que la aguja) */}
              <div className="absolute top-[20%] left-[15%] flex gap-0.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="radar-ship-blip w-3 h-3 rounded-sm" />
                ))}
              </div>
              <div className="absolute top-[35%] right-[20%] flex flex-col gap-0.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="radar-ship-blip w-3 h-3 rounded-sm" />
                ))}
              </div>
              <div className="absolute bottom-[25%] left-[25%] flex gap-0.5">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="radar-ship-blip w-3 h-3 rounded-sm" />
                ))}
              </div>
              {/* Chispas de fondo – mini destellos irregulares tipo calor/fuego */}
              <div className="radar-spark" style={{ top: "22%", left: "32%", animationDelay: "0s" }} />
              <div className="radar-spark" style={{ top: "28%", left: "58%", animationDelay: "0.6s" }} />
              <div className="radar-spark" style={{ top: "40%", left: "20%", animationDelay: "1.1s" }} />
              <div className="radar-spark" style={{ top: "46%", left: "75%", animationDelay: "1.7s" }} />
              <div className="radar-spark" style={{ top: "60%", left: "30%", animationDelay: "0.9s" }} />
              <div className="radar-spark" style={{ top: "68%", left: "60%", animationDelay: "1.3s" }} />
              <div className="radar-spark" style={{ top: "32%", left: "45%", animationDelay: "0.3s" }} />
              <div className="radar-spark" style={{ top: "72%", left: "40%", animationDelay: "1.9s" }} />
              {/* Needle: fire/flame style – wrapper rotates, needle + trail particles inside */}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                <div className="radar-needle-wrapper">
                  {/* Estela fina: partículas sutiles detrás de la aguja */}
                  <div className="radar-flame-particle radar-flame-particle--yellow" style={{ left: "72%", animationDelay: "0s" }} />
                  <div className="radar-flame-particle radar-flame-particle--orange" style={{ left: "80%", animationDelay: "0.25s" }} />
                  <div className="radar-flame-particle radar-flame-particle--red" style={{ left: "88%", animationDelay: "0.5s" }} />
                  <div className="radar-flame-particle radar-flame-particle--orange" style={{ left: "94%", animationDelay: "0.15s" }} />
                  {/* Aguja fina – rayo incandescente con gradiente fuego */}
                  <div className="radar-needle-flame" />
                  {/* Un destello sutil en la punta */}
                  <div className="radar-needle-tip-spark" style={{ left: "98%", animationDelay: "0s" }} />
                </div>
              </div>
              {/* Center dot – fire core */}
              <div
                className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #FFD700, #FF4500 60%, #B22222)",
                  boxShadow: "0 0 0 3px rgba(255,215,0,0.8), 0 0 20px #FF8C00, 0 0 30px rgba(178,34,34,0.6)"
                }}
              />
            </div>
          </div>

          {/* Auth – Log in / Register with icons, soft typography */}
          <div className="mt-8 lg:mt-6 pt-6 border-t space-y-3" style={{ borderColor: "rgba(30,61,47,0.12)" }}>
            {user ? (
              <>
                <p className="text-sm font-medium opacity-90" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Signed in as <span className="font-semibold">{user.username}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {["history", "stats", "leaderboard", "profile"].map((screen, i) => (
                    <button
                      key={screen}
                      type="button"
                      onClick={() => setScreen(screen as "history" | "stats" | "leaderboard" | "profile")}
                      className="rounded-2xl px-4 py-2.5 text-xs font-medium transition-all shadow-sm hover:shadow hover:opacity-95"
                      style={{ backgroundColor: MENU_COLORS.brown, color: "#fff", fontFamily: "'Source Sans 3', sans-serif" }}
                    >
                      {["View History", "My Stats", "Global Ranking", "My Profile"][i]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-2xl px-4 py-2.5 text-xs font-medium transition-all shadow-sm hover:shadow hover:opacity-95"
                    style={{ backgroundColor: MENU_COLORS.brown, color: "#fff", fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="btn-orange-sparkle rounded-3xl px-6 py-3.5 text-sm font-medium transition-all shadow-md hover:shadow-lg hover:opacity-95 flex-1 flex items-center justify-center gap-2 relative"
                  style={{ backgroundColor: MENU_COLORS.orange, color: "#fff", fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  <span className="sparkle-dot" style={{ top: "18%", left: "12%", animationDelay: "0s" }} />
                  <span className="sparkle-dot" style={{ top: "72%", left: "85%", animationDelay: "1.4s" }} />
                  <span className="sparkle-dot" style={{ top: "38%", right: "18%", left: "auto", animationDelay: "2.2s" }} />
                  <span className="sparkle-dot" style={{ bottom: "22%", left: "20%", top: "auto", animationDelay: "0.6s" }} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("register")}
                  className="btn-dark-green-sparkle rounded-3xl px-6 py-3.5 text-sm font-medium transition-all shadow-md hover:shadow-lg hover:opacity-95 flex-1 flex items-center justify-center gap-2 relative"
                  style={{ backgroundColor: MENU_COLORS.darkGreen, color: "#fff", fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  <span className="sparkle-dot" style={{ top: "20%", left: "15%", animationDelay: "0s" }} />
                  <span className="sparkle-dot" style={{ top: "70%", left: "80%", animationDelay: "1.2s" }} />
                  <span className="sparkle-dot" style={{ top: "40%", right: "20%", left: "auto", animationDelay: "2.4s" }} />
                  <span className="sparkle-dot" style={{ bottom: "25%", left: "25%", top: "auto", animationDelay: "0.8s" }} />
                  <span className="sparkle-dot" style={{ top: "55%", left: "70%", animationDelay: "1.8s" }} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Register
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right zone: menu – no white container */}
        <main className="lg:w-3/5 px-6 md:px-10 lg:px-12 py-10 lg:py-16 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

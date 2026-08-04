import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import oneDataLogo from "../assets/one-data-logo.png";
import sdoLogo from "../assets/sdo-logo.png";
import loginImage from "../assets/login-image.png";


const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);



// ── Credentials table ─────────────────────────────────────────────────────────
// Each entry: { username, password, role, userSection }
// userSection must match the exact subfolder name used in FolderDetail.
const CREDENTIALS = [
  // ── Core roles ──────────────────────────────────────────────────────────────
  { username: "admin",        password: "1234", role: "admin",        userSection: "" },
  { username: "division",     password: "1234", role: "division",     userSection: "" },

  // ── Section Focal Officers (own their section — can verify, download, view,
  //    and see the File Requests bubble inside their own section) ──────────────
  { username: "focal.planning",    password: "1234", role: "sectionFocal", userSection: "PLANNING AND RESEARCH" },
  { username: "focal.drrm",        password: "1234", role: "sectionFocal", userSection: "DRRM" },
  { username: "focal.hrd",         password: "1234", role: "sectionFocal", userSection: "HRD" },
  { username: "focal.sime",        password: "1234", role: "sectionFocal", userSection: "SIME" },
  { username: "focal.sports",      password: "1234", role: "sectionFocal", userSection: "SPORTS" },

  // ── Section Personnel (can only access their own section's files;
  //    clicking download/view in a DIFFERENT section triggers the modal) ───────
  { username: "personnel.planning", password: "1234", role: "personnel", userSection: "PLANNING AND RESEARCH" },
  { username: "personnel.drrm",     password: "1234", role: "personnel", userSection: "DRRM" },
  { username: "personnel.hrd",      password: "1234", role: "personnel", userSection: "HRD" },
];

// Convenience: legacy "personnel" shorthand → same as personnel.drrm for quick testing
CREDENTIALS.push({ username: "personnel", password: "1234", role: "personnel", userSection: "DRRM" });
CREDENTIALS.push({ username: "sectionfocal", password: "1234", role: "sectionFocal", userSection: "DRRM" });


function ImagePanel({ activeDot, onDotClick }) {
  return (
    <div className="relative flex-none w-[44%] flex flex-col overflow-hidden rounded-l-[22px]">
      {/* Background image */}
      <img src={loginImage} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Bottom-only overlays to keep the top of the image clear */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,59,122,0) 0%, rgba(13,59,122,0) 52%, rgba(13,59,122,0.08) 74%, rgba(13,59,122,0.16) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,28,68,0) 0%, rgba(8,28,68,0) 58%, rgba(8,28,68,0.12) 80%, rgba(8,28,68,0.3) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full px-7 pt-9 pb-7">

        {/* Logo at top */}
        <div className="flex flex-col items-center gap-1">
          <img src={oneDataLogo} alt="OneData Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
          <span className="text-black text-[22px] font-bold tracking-wide"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.28)" }}>
            OneData
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom description + dots */}
        <div className="w-full">
          <p className="text-white text-[14px] font-semibold leading-relaxed mb-4"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.30)" }}>
            A Web-Based Centralized Data Repository and Dashboard System for
            DepEd Baliwag School Division Office
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                onClick={() => onDotClick(i)}
                className="h-2 rounded-full cursor-pointer transition-all duration-300"
                style={{
                  width: i === activeDot ? 22 : 8,
                  borderRadius: i === activeDot ? 4 : 9999,
                  background: i === activeDot ? "#fff" : "rgba(255,255,255,0.42)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [stayLogged, setStayLogged] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = () => {
    setError("");

    const match = CREDENTIALS.find(
      (c) => c.username === username.trim() && c.password === password
    );

    if (match) {
      localStorage.setItem("role", match.role);
      localStorage.setItem("userSection", match.userSection);
      navigate("/repository");
    } else {
      setError("Invalid username or password.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-14 pt-12 pb-8 bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center">

        {/* Heading */}
        <h1 className="text-center text-[33px] font-bold mb-1.5 tracking-tight"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1A73E8" }}>
          Welcome!
        </h1>
        <p className="text-center text-[14.5px] mb-7" style={{ color: "#4A5568" }}>
          Log in to access your account.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm text-red-600 bg-red-50 border border-red-200 text-center">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[13.5px] font-medium pl-1.5" style={{ color: "#1A2B4A" }} htmlFor="username">
            Username:
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-[46px] px-[18px] text-sm outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white"
            style={{ border: "1.8px solid #1A73E8", borderRadius: 50, color: "#1A2B4A" }}
            onFocus={e => { e.target.style.borderColor = "#1557B0"; e.target.style.boxShadow = "0 0 0 3.5px rgba(26,115,232,0.15)"; }}
            onBlur={e => { e.target.style.borderColor = "#1A73E8"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[13.5px] font-medium pl-1.5" style={{ color: "#1A2B4A" }} htmlFor="password">
            Password:
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-[46px] pl-[18px] pr-11 text-sm outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white"
              style={{ border: "1.8px solid #1A73E8", borderRadius: 50, color: "#1A2B4A" }}
              onFocus={e => { e.target.style.borderColor = "#1557B0"; e.target.style.boxShadow = "0 0 0 3.5px rgba(26,115,232,0.15)"; }}
              onBlur={e => { e.target.style.borderColor = "#1A73E8"; e.target.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3.5 bg-transparent border-none cursor-pointer flex items-center transition-all duration-150 hover:scale-110"
              style={{ color: "#718096" }}
              onMouseEnter={e => e.currentTarget.style.color = "#1A73E8"}
              onMouseLeave={e => e.currentTarget.style.color = "#718096"}
            >
              {showPwd ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
        </div>

        {/* Stay logged in */}
        <div className="flex items-center gap-2 mb-5 pl-1">
          <input
            id="stay"
            type="checkbox"
            checked={stayLogged}
            onChange={(e) => setStayLogged(e.target.checked)}
            className="w-[15px] h-[15px] cursor-pointer"
            style={{ accentColor: "#1A73E8" }}
          />
          <label htmlFor="stay" className="text-[13.5px] cursor-pointer select-none" style={{ color: "#4A5568" }}>
            Stay logged in
          </label>
        </div>

        {/* Log In button */}
        <button
          onClick={handleSubmit}
          className="block mx-auto mb-4 text-white text-[15px] font-semibold tracking-wide transition-all duration-200"
          style={{
            width: 195, height: 48,
            background: "#1A73E8",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(26,115,232,0.32)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1557B0"; e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,115,232,0.40)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#1A73E8"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(26,115,232,0.32)"; }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"}
        >
          Log In
        </button>

        <a href="#forgot" className="block text-center text-[13.5px] font-medium no-underline hover:underline"
          style={{ color: "#1A73E8" }}
          onMouseEnter={e => e.currentTarget.style.color = "#1557B0"}
          onMouseLeave={e => e.currentTarget.style.color = "#1A73E8"}
        >
          Forgot password?
        </a>
      </div>

      <p className="text-center text-xs pt-4" style={{ color: "#718096" }}>
        OneData © 2026
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [activeDot, setActiveDot] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6"
      style={{ background: "#D9E8F5" }}>
      <div
        className="flex w-full transition-all duration-[650ms]"
        style={{
          maxWidth: 960,
          minHeight: 570,
          borderRadius: 22,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 32px 80px rgba(13,59,122,0.18), 0 4px 20px rgba(13,59,122,0.10)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.97)",
        }}
      >
        <ImagePanel activeDot={activeDot} onDotClick={setActiveDot} />
        <LoginForm />
      </div>
    </div>
  );
}
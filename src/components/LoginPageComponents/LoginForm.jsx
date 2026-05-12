import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { LoginFormInput } from "./LoginFormInput";
import { LoginButton } from "./LoginButton";
import { LoginCheckbox } from "./LoginCheckbox";

/**
 * LoginForm — Right-side form panel containing welcome header,
 * username / password inputs, stay-logged-in checkbox,
 * login button, forgot-password link and copyright footer.
 */
export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: integrate with Supabase auth
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col justify-center px-10 py-10 lg:px-14">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1
          className="text-[1.9rem] font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #1a6fe0 0%, #2986e8 60%, #1daa74 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome!
        </h1>
        <p className="mt-2 text-[0.85rem] text-gray-400 font-medium">
          Log in to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Username */}
        <LoginFormInput
          id="login-username"
          label="Username:"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          autoComplete="username"
        />

        {/* Password */}
        <LoginFormInput
          id="login-password"
          label="Password:"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Stay logged in */}
        <LoginCheckbox
          id="login-stay-logged-in"
          label="Stay logged in"
          checked={stayLoggedIn}
          onChange={() => setStayLoggedIn((v) => !v)}
        />

        {/* Submit */}
        <div className="mt-1">
          <LoginButton loading={loading} />
        </div>

        {/* Forgot password link */}
        <p className="text-center">
          <a
            href="#"
            id="login-forgot-password"
            className="text-[0.82rem] font-semibold text-[#2986e8] hover:text-[#1565c0] transition-colors relative
                       after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[#2986e8] after:transition-all after:duration-300
                       hover:after:w-full"
          >
            Forgot password?
          </a>
        </p>
      </form>

      {/* Footer */}
      <p className="mt-auto pt-8 text-center text-xs text-gray-300 tracking-widest font-medium">
        OneData © {new Date().getFullYear()}
      </p>
    </div>
  );
}

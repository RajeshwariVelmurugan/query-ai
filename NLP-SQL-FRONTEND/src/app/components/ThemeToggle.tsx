import { useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-gradient-to-r from-[#4F46E5]/20 to-[#9333EA]/20 border border-white/20 rounded-full transition-all hover:shadow-lg"
    >
      <div
        className={`absolute top-0.5 w-6 h-6 bg-gradient-to-br from-[#4F46E5] to-[#9333EA] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isDark ? "left-0.5" : "left-7"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </div>
    </button>
  );
}

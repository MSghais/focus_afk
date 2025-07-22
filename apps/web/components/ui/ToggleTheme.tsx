import React from "react";

const ToggleTheme: React.FC = () => {
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        document.body.setAttribute("data-theme", savedTheme);
        setTheme(savedTheme);
      } else {
        // Default to dark if not set
        document.body.setAttribute("data-theme", "dark");
        setTheme("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window !== "undefined") {
      const body = document.body;
      const isDark = body.getAttribute("data-theme") === "dark";
      const newTheme = isDark ? "light" : "dark";
      body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      setTheme(newTheme);
    }
  };

  return (
    <button
      className="px-3 py-1 rounded"
    //   className="px-3 py-1 rounded bg-[var(--brand-primary)] dark:bg-[var(--brand-accent)] text-white"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
};
export default ToggleTheme; 
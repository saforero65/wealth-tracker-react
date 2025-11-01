import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 transition-all duration-200 hover:bg-accent hover:rotate-180 hover:scale-110"
      title={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-yellow-400 transition-all duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400 transition-all duration-200" />
      )}
      <span className="sr-only">
        Cambiar a tema {isDark ? "claro" : "oscuro"}
      </span>
    </Button>
  );
}

// Version simple del toggle (solo claro/oscuro)
export function SimpleThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 transition-colors hover:bg-accent"
      title={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
      <span className="sr-only">
        Cambiar a tema {isDark ? "claro" : "oscuro"}
      </span>
    </Button>
  );
}

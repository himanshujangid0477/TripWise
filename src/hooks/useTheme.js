import { useEffect } from "react";
import useLocalStorage from "./useLocalStorage";

function systemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function useTheme() {
  const [stored, setTheme] = useLocalStorage("tripwise-theme", systemTheme());
  const theme = stored === "dark" ? "dark" : "light";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  return [theme, toggleTheme];
}

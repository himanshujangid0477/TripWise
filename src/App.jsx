import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ShareView from "./pages/ShareView";
import useTheme from "./hooks/useTheme";

export default function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/share" element={<ShareView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

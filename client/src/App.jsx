import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { StudentProvider } from "./context/StudentContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Student from "./pages/Student";
import Services from "./pages/Services";
import Knowledge from "./pages/Knowledge";

function Protected({ children }) {
  const { auth, ready } = useAuth();
  if (!ready) {
    return <div style={{ display: "grid", placeItems: "center", height: "100%" }}>Loading…</div>;
  }
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

function PublicAuth() {
  const { auth, ready } = useAuth();
  if (!ready) return null;
  if (auth) return <Navigate to="/" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<PublicAuth />} />
              <Route path="/login/form" element={<Login />} />
              <Route
                element={
                  <Protected>
                    <Layout />
                  </Protected>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/student" element={<Student />} />
                <Route path="/services" element={<Services />} />
                <Route path="/knowledge" element={<Knowledge />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </StudentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { auth } = useAuth();
  const [studentId, setStudentId] = useState(auth?.user?.studentId || "S101");
  const [profile, setProfile] = useState(null);

  const value = {
    studentId,
    setStudentId,
    profile,
    setProfile,
  };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}

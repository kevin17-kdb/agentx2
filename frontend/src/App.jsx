import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";
import { THEMES, DEFAULT_STUDENT } from "./theme";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import ChatPanel from "./components/ChatPanel";
import TracePanel from "./components/TracePanel";
import HitlModal from "./components/HitlModal";
import Scene from "./components/Scene";

const SUGGESTIONS = [
  "Am I eligible for the Google internship? If yes, register me for the placement workshop, add it to my calendar, and remind me before it.",
  "Summarize the exam regulations, calculate my attendance, and draft a makeup-exam email.",
  "Show today's classes, AI workshops, and ML clubs.",
  "I'm overwhelmed with exams this week — any wellness resources?",
  "Where's the nearest ATM?",
  "Can I afford a ₹5,000 hackathon trip?",
];

export default function App() {
  const [themeId, setThemeId] = useState("aurora");
  const { auth, login, register, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  const handleAuthenticate = async (mode, username, password, studentId) =>
    mode === "login"
      ? login(username, password)
      : register(username, password, studentId);

  return (
    <div className="relative flex h-full flex-col" data-theme={themeId}>
      <Scene effect={(THEMES.find((t) => t.id === themeId) || THEMES[0]).effect} />
      {auth ? (
        <Shell auth={auth} themeId={themeId} setThemeId={setThemeId} onLogout={logout} />
      ) : (
        <AuthScreen onAuthenticate={handleAuthenticate} themeId={themeId} />
      )}
    </div>
  );
}

function Shell({ auth, themeId, setThemeId, onLogout }) {
  const [studentId, setStudentId] = useState(auth.studentId || DEFAULT_STUDENT);
  const chat = useChat({ token: auth.token });

  return (
    <>
      <Header
        status={chat.status}
        mode={chat.mode}
        themeId={themeId}
        onThemeChange={setThemeId}
        studentId={studentId}
        onStudentChange={setStudentId}
        username={auth.username}
        onLogout={onLogout}
      />

      <div className="flex flex-1 gap-4 overflow-hidden px-4 pb-4 min-h-0">
        <ChatPanel
          messages={chat.messages}
          thinking={chat.thinking}
          onSend={(q) => chat.sendMessage(q, studentId)}
          suggestions={SUGGESTIONS}
        />
        <TracePanel run={chat.run} thinking={chat.thinking} />
      </div>

      <AnimatePresence>
        {chat.hitl && (
          <HitlModal
            hitl={chat.hitl}
            onRespond={chat.respondToHitl}
            onClose={() => chat.respondToHitl("reject")}
          />
        )}
      </AnimatePresence>
    </>
  );
}

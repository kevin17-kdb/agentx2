import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AgentQuery from "../components/AgentQuery";
import { BarsChart } from "../components/Mforge";

/* ------------------------------------------------------------------ */
/* Full student mock data with multi-day timetable + semester marks    */
/* ------------------------------------------------------------------ */

const STUDENT_DATA = {
  S101: {
    name: "Kevin", branch: "CSE", year: "3rd Year", semester: "5th",
    cgpa: 8.72, attendance: 87, creditsEarned: 98, creditsTotal: 120,
    subjects: [
      { name: "Artificial Intelligence", code: "CS301", grade: "A", credits: 4 },
      { name: "Database Systems", code: "CS302", grade: "A+", credits: 4 },
      { name: "Computer Networks", code: "CS303", grade: "B+", credits: 3 },
      { name: "Operating Systems", code: "CS304", grade: "A", credits: 4 },
      { name: "Software Engineering", code: "CS305", grade: "A", credits: 3 },
    ],
    timetable: {
      Monday: [
        { time: "09:00", subject: "Artificial Intelligence", room: "LH-301", type: "Lecture" },
        { time: "10:00", subject: "Database Systems Lab", room: "Lab-204", type: "Lab" },
        { time: "11:30", subject: "Computer Networks", room: "LH-102", type: "Lecture" },
        { time: "14:00", subject: "Operating Systems", room: "LH-301", type: "Lecture" },
      ],
      Tuesday: [
        { time: "09:00", subject: "Software Engineering", room: "LH-105", type: "Lecture" },
        { time: "10:30", subject: "Operating Systems Lab", room: "Lab-301", type: "Lab" },
        { time: "13:00", subject: "Computer Networks", room: "LH-102", type: "Lecture" },
        { time: "15:00", subject: "Soft Skills", room: "LH-105", type: "Tutorial" },
      ],
      Wednesday: [
        { time: "09:00", subject: "Artificial Intelligence", room: "LH-301", type: "Lecture" },
        { time: "10:00", subject: "Database Systems", room: "LH-204", type: "Lecture" },
        { time: "11:30", subject: "Operating Systems", room: "LH-301", type: "Lecture" },
        { time: "14:00", subject: "AI Lab", room: "Lab-302", type: "Lab" },
      ],
      Thursday: [
        { time: "09:00", subject: "Computer Networks Lab", room: "Lab-102", type: "Lab" },
        { time: "11:00", subject: "Software Engineering", room: "LH-105", type: "Lecture" },
        { time: "13:00", subject: "Artificial Intelligence", room: "LH-301", type: "Lecture" },
        { time: "15:00", subject: "Library / Self Study", room: "Library", type: "Self" },
      ],
      Friday: [
        { time: "09:00", subject: "Database Systems", room: "LH-204", type: "Lecture" },
        { time: "10:30", subject: "Operating Systems", room: "LH-301", type: "Lecture" },
        { time: "12:00", subject: "Software Engineering Lab", room: "Lab-105", type: "Lab" },
        { time: "14:30", subject: "Mentoring Session", room: "Faculty Block", type: "Tutorial" },
      ],
      Saturday: [
        { time: "09:00", subject: "Remedial / Extra Classes", room: "LH-102", type: "Lecture" },
        { time: "11:00", subject: "Club Activities", room: "Student Center", type: "Activity" },
      ],
    },
    semesterMarks: [
      { sem: "Sem 1", sgpa: 8.2, subjects: [
        { name: "Engineering Mathematics I", grade: "A", credits: 4 },
        { name: "Engineering Physics", grade: "B+", credits: 4 },
        { name: "Programming in C", grade: "A+", credits: 3 },
        { name: "Engineering Drawing", grade: "A", credits: 3 },
        { name: "English Communication", grade: "A", credits: 2 },
      ]},
      { sem: "Sem 2", sgpa: 8.5, subjects: [
        { name: "Engineering Mathematics II", grade: "A", credits: 4 },
        { name: "Engineering Chemistry", grade: "A", credits: 4 },
        { name: "Data Structures", grade: "A+", credits: 4 },
        { name: "Digital Logic Design", grade: "B+", credits: 3 },
        { name: "Environmental Studies", grade: "A", credits: 2 },
      ]},
      { sem: "Sem 3", sgpa: 8.8, subjects: [
        { name: "Discrete Mathematics", grade: "A+", credits: 4 },
        { name: "OOP with Java", grade: "A", credits: 4 },
        { name: "Computer Architecture", grade: "A", credits: 3 },
        { name: "Probability & Statistics", grade: "B+", credits: 3 },
        { name: "Economics for Engineers", grade: "A", credits: 2 },
      ]},
      { sem: "Sem 4", sgpa: 9.0, subjects: [
        { name: "Design & Analysis of Algorithms", grade: "A+", credits: 4 },
        { name: "Theory of Computation", grade: "A", credits: 3 },
        { name: "Microprocessors", grade: "A", credits: 4 },
        { name: "Software Engineering", grade: "A+", credits: 3 },
        { name: "Data Communication", grade: "A", credits: 3 },
      ]},
    ],
    pending: ["Library book overdue (2 days)", "Semester fee installment due Aug 15"],
  },
  S102: {
    name: "Admin", branch: "Admin", year: "—", semester: "—",
    cgpa: 0, attendance: 100, creditsEarned: 0, creditsTotal: 0,
    subjects: [], timetable: {}, semesterMarks: [], pending: [],
  },
  S103: {
    name: "Emily", branch: "ECE", year: "4th Year", semester: "7th",
    cgpa: 9.14, attendance: 92, creditsEarned: 112, creditsTotal: 120,
    subjects: [
      { name: "VLSI Design", code: "EC401", grade: "A+", credits: 4 },
      { name: "Embedded Systems", code: "EC402", grade: "A", credits: 4 },
      { name: "Digital Signal Processing", code: "EC403", grade: "A+", credits: 3 },
    ],
    timetable: {
      Monday: [
        { time: "09:00", subject: "VLSI Design", room: "LH-401", type: "Lecture" },
        { time: "10:30", subject: "Embedded Systems Lab", room: "Lab-301", type: "Lab" },
        { time: "13:00", subject: "DSP", room: "LH-205", type: "Lecture" },
      ],
      Tuesday: [
        { time: "09:00", subject: "VLSI Lab", room: "Lab-401", type: "Lab" },
        { time: "11:00", subject: "Embedded Systems", room: "LH-301", type: "Lecture" },
        { time: "14:00", subject: "DSP Lab", room: "Lab-205", type: "Lab" },
      ],
      Wednesday: [
        { time: "09:00", subject: "VLSI Design", room: "LH-401", type: "Lecture" },
        { time: "10:30", subject: "Embedded Systems", room: "LH-301", type: "Lecture" },
        { time: "13:00", subject: "DSP", room: "LH-205", type: "Lecture" },
      ],
      Thursday: [
        { time: "09:00", subject: "Project Work", room: "Lab-401", type: "Lab" },
        { time: "11:30", subject: "DSP", room: "LH-205", type: "Lecture" },
      ],
      Friday: [
        { time: "09:00", subject: "VLSI Design", room: "LH-401", type: "Lecture" },
        { time: "11:00", subject: "Embedded Systems", room: "LH-301", type: "Lecture" },
        { time: "14:00", subject: "Seminar", room: "Seminar Hall", type: "Tutorial" },
      ],
    },
    semesterMarks: [
      { sem: "Sem 1", sgpa: 8.8, subjects: [
        { name: "Engineering Mathematics I", grade: "A", credits: 4 },
        { name: "Engineering Physics", grade: "A", credits: 4 },
        { name: "Basic Electronics", grade: "A+", credits: 3 },
      ]},
      { sem: "Sem 2", sgpa: 9.0, subjects: [
        { name: "Engineering Mathematics II", grade: "A+", credits: 4 },
        { name: "Engineering Chemistry", grade: "A", credits: 4 },
        { name: "Circuit Theory", grade: "A", credits: 4 },
      ]},
      { sem: "Sem 3", sgpa: 9.1, subjects: [
        { name: "Analog Electronics", grade: "A+", credits: 4 },
        { name: "Signals & Systems", grade: "A", credits: 4 },
        { name: "Digital Electronics", grade: "A+", credits: 3 },
      ]},
    ],
    pending: ["Project submission due Aug 20"],
  },
  S104: {
    name: "Messi", branch: "CSE", year: "3rd Year", semester: "5th",
    cgpa: 7.85, attendance: 78, creditsEarned: 96, creditsTotal: 120,
    subjects: [
      { name: "Artificial Intelligence", code: "CS301", grade: "B+", credits: 4 },
      { name: "Database Systems", code: "CS302", grade: "A", credits: 4 },
      { name: "Computer Networks", code: "CS303", grade: "B", credits: 3 },
    ],
    timetable: {
      Monday: [
        { time: "09:00", subject: "Artificial Intelligence", room: "LH-301", type: "Lecture" },
        { time: "10:00", subject: "Database Systems Lab", room: "Lab-204", type: "Lab" },
        { time: "11:30", subject: "Computer Networks", room: "LH-102", type: "Lecture" },
      ],
      Tuesday: [
        { time: "09:00", subject: "Software Engineering", room: "LH-105", type: "Lecture" },
        { time: "11:00", subject: "Computer Networks", room: "LH-102", type: "Lecture" },
      ],
      Wednesday: [
        { time: "09:00", subject: "Artificial Intelligence", room: "LH-301", type: "Lecture" },
        { time: "10:00", subject: "Database Systems", room: "LH-204", type: "Lecture" },
      ],
      Thursday: [
        { time: "09:00", subject: "Computer Networks Lab", room: "Lab-102", type: "Lab" },
        { time: "11:00", subject: "AI Lab", room: "Lab-302", type: "Lab" },
      ],
      Friday: [
        { time: "09:00", subject: "Database Systems", room: "LH-204", type: "Lecture" },
        { time: "11:00", subject: "Mentoring", room: "Faculty Block", type: "Tutorial" },
      ],
    },
    semesterMarks: [
      { sem: "Sem 1", sgpa: 7.2, subjects: [
        { name: "Engineering Mathematics I", grade: "B+", credits: 4 },
        { name: "Programming in C", grade: "A", credits: 3 },
      ]},
      { sem: "Sem 2", sgpa: 7.5, subjects: [
        { name: "Data Structures", grade: "A", credits: 4 },
        { name: "Digital Logic", grade: "B+", credits: 3 },
      ]},
    ],
    pending: ["Attendance warning: below 80%", "Hackathon registration pending"],
  },
};

const DEFAULT_DATA = STUDENT_DATA.S101;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timetable", label: "Timetable" },
  { id: "academics", label: "Academics" },
  { id: "marks", label: "Marks" },
  { id: "attendance", label: "Attendance" },
];

const GRADE_COLORS = {
  "A+": "var(--ok)", "A": "var(--accent)", "B+": "var(--warn)",
  "B": "var(--warn)", "C": "var(--bad)", "D": "var(--bad)", "F": "var(--bad)",
};

/* ------------------------------------------------------------------ */
/* Tab Components                                                      */
/* ------------------------------------------------------------------ */

function OverviewTab({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">CGPA</span>
          <span className="stat-value">{data.cgpa.toFixed(2)}</span>
          <span className="stat-sub">out of 10.0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Attendance</span>
          <span className="stat-value">{data.attendance}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.attendance}%` }} />
          </div>
          <span className="stat-sub">{data.attendance >= 75 ? "✓ Eligible" : "⚠ Below 75%"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Credits</span>
          <span className="stat-value">{data.creditsEarned}/{data.creditsTotal}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.creditsTotal ? (data.creditsEarned / data.creditsTotal) * 100 : 0}%` }} />
          </div>
          <span className="stat-sub">{data.creditsTotal - data.creditsEarned} remaining</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Semester</span>
          <span className="stat-value">{data.semester}</span>
          <span className="stat-sub">{data.branch} · {data.year}</span>
        </div>
      </div>

      {data.pending.length > 0 && (
        <div className="card" style={{ borderColor: "color-mix(in srgb, var(--warn) 35%, transparent)" }}>
          <h3 style={{ color: "var(--warn)", fontSize: 14, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠ Pending Items
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {data.pending.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SGPA Trend */}
      {data.semesterMarks.length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>SGPA Trend</h3>
          <span className="eyebrow-label">Semester performance</span>
          <div style={{ marginTop: 16 }}>
            <BarsChart
              bars={data.semesterMarks.map((sem) => (sem.sgpa / 10) * 100)}
              peaks={[0, data.semesterMarks.length - 1]}
              colors={["#c4f26e", "#a9d95c", "#7cb34f", "#4a7a3d", "#2c4a3e"]}
              height={120}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {data.semesterMarks.map((sem, i) => (
                <span key={i} className="mf-pill" style={{ fontSize: 9, color: "var(--text-1)" }}>
                  {sem.sem} · <b style={{ color: "#4a7a3d" }}>{sem.sgpa}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimetableTab({ data }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return DAYS.includes(today) ? today : "Monday";
  });

  const schedule = data.timetable?.[selectedDay] || [];

  return (
    <div>
      {/* Day selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {DAYS.map((day) => (
          <button
            key={day}
            className={`theme-badge${selectedDay === day ? " active" : ""}`}
            onClick={() => setSelectedDay(day)}
            style={{ padding: "6px 14px", fontSize: 13 }}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>{selectedDay}'s Schedule</h3>
      {schedule.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <p className="muted">No classes on {selectedDay}!</p>
        </div>
      ) : (
        schedule.map((cls, i) => (
          <div className="timetable-row" key={i}>
            <span className="timetable-time">{cls.time}</span>
            <span>
              <span className="timetable-subject">{cls.subject}</span>
              <span className="badge" style={{ marginLeft: 10, fontSize: 10, padding: "2px 8px",
                color: cls.type === "Lab" ? "var(--accent-2)" : cls.type === "Tutorial" ? "var(--accent-3)" : "var(--text-2)",
                borderColor: cls.type === "Lab" ? "color-mix(in srgb, var(--accent-2) 40%, transparent)" : undefined,
              }}>{cls.type}</span>
            </span>
            <span className="timetable-room">{cls.room}</span>
          </div>
        ))
      )}
    </div>
  );
}

function AcademicsTab({ data }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Current Semester Grades</h3>
      {data.subjects.length === 0 ? (
        <p className="muted">No academic data available.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.subjects.map((sub, i) => (
            <div className="card" key={i} style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</div>
                <div className="small muted">{sub.code} · {sub.credits} credits</div>
              </div>
              <span className="badge accent" style={{
                fontSize: 14, fontWeight: 700, padding: "6px 14px",
                color: GRADE_COLORS[sub.grade] || "var(--accent)",
                borderColor: `color-mix(in srgb, ${GRADE_COLORS[sub.grade] || "var(--accent)"} 40%, transparent)`,
              }}>
                {sub.grade}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <AgentQuery
          query="Recommend electives for my branch and level, and summarize the exam regulations."
          title="AI Recommendations"
          buttonLabel="Get AI recommendations"
        />
      </div>
    </div>
  );
}

function MarksTab({ data }) {
  const [expandedSem, setExpandedSem] = useState(null);

  if (!data.semesterMarks || data.semesterMarks.length === 0) {
    return <p className="muted">No previous semester marks available.</p>;
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Previous Semester Results</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.semesterMarks.map((sem, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setExpandedSem(expandedSem === i ? null : i)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "16px 18px", textAlign: "left",
                background: expandedSem === i ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center",
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  fontWeight: 800, fontSize: 13, color: "var(--accent)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {sem.sem.replace("Sem ", "S")}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{sem.sem}</div>
                  <div className="small muted">{sem.subjects.length} subjects</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontWeight: 800, fontSize: 20, letterSpacing: -0.5,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{sem.sgpa.toFixed(1)}</div>
                <div className="small muted">SGPA</div>
              </div>
            </button>

            {expandedSem === i && (
              <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {sem.subjects.map((sub, j) => (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 8,
                      background: "color-mix(in srgb, var(--surface-2) 60%, transparent)",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{sub.name}</div>
                        <div className="small muted">{sub.credits} credits</div>
                      </div>
                      <span style={{
                        fontWeight: 700, fontSize: 14, padding: "4px 12px",
                        borderRadius: 8, border: "1px solid var(--border)",
                        color: GRADE_COLORS[sub.grade] || "var(--text-1)",
                      }}>{sub.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceTab({ data }) {
  const isEligible = data.attendance >= 75;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        <div className="stat-card">
          <span className="stat-label">Overall Attendance</span>
          <span className="stat-value">{data.attendance}%</span>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{
              width: `${data.attendance}%`,
              background: isEligible
                ? "linear-gradient(90deg, var(--ok), var(--accent))"
                : "linear-gradient(90deg, var(--bad), var(--warn))",
            }} />
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Exam Eligibility</span>
          <span className="stat-value" style={{ fontSize: 22 }}>
            {isEligible ? "✓ Eligible" : "✗ At Risk"}
          </span>
          <span className="stat-sub">
            {isEligible ? `${data.attendance - 75}% above threshold` : `Need ${75 - data.attendance}% more`}
          </span>
        </div>
      </div>

      <AgentQuery
        query="Calculate my attendance percentage and tell me if I'm eligible for exams."
        title="Detailed Attendance Analysis"
        buttonLabel="Get AI analysis"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Student Component                                              */
/* ------------------------------------------------------------------ */

export default function Student() {
  const { auth } = useAuth();
  const [tab, setTab] = useState("overview");
  const studentId = auth?.user?.studentId || "S101";
  const data = STUDENT_DATA[studentId] || DEFAULT_DATA;
  const name = auth?.user?.name || auth?.user?.username || data.name;

  const renderTab = () => {
    switch (tab) {
      case "overview": return <OverviewTab data={data} />;
      case "timetable": return <TimetableTab data={data} />;
      case "academics": return <AcademicsTab data={data} />;
      case "marks": return <MarksTab data={data} />;
      case "attendance": return <AttendanceTab data={data} />;
      default: return <OverviewTab data={data} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section className="card" style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span className="avatar-lg">{name?.[0]}</span>
        <div>
          <h2 style={{ margin: 0 }}>{name}</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Student ID <span className="font-mono">{studentId}</span> · role{" "}
            <span className="badge accent">{auth?.user?.role || "student"}</span>
            {data.branch !== "Admin" && (
              <>{" · "}<span className="badge">{data.branch} · {data.year}</span></>
            )}
          </p>
        </div>
      </section>

      <section>
        <div className="tab-row" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {renderTab()}
      </section>
    </div>
  );
}

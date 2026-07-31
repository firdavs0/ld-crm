import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Target, ListTodo, GraduationCap, Users, Crown,
  CalendarDays, BookOpen, Plus, Trash2, TrendingUp, CheckCircle2,
  Clock, PauseCircle, XCircle, Menu, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

/* ---------------------------------- utils ---------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
};
const fmtMoney = (v) => num(v).toLocaleString("ru-RU");

// start date + 3 months, rolled forward to next working day if it lands on a weekend
function calcInternEnd(startISO) {
  if (!startISO) return "";
  const d = new Date(startISO + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + 3);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

/* ------------------------------- storage hook ------------------------------- */

// shared: true -> data is visible and editable by everyone who opens this artifact's link,
// not just the current user. That's what makes this a team CRM instead of a personal one.
function usePersisted(key, initial, shared = true) {
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(key, shared);
        if (!cancelled && res && res.value) {
          setValue(JSON.parse(res.value));
        }
      } catch (e) {
        // key doesn't exist yet - keep initial
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(key, JSON.stringify(value), shared);
      } catch (e) {
        // ignore
      }
    })();
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

/* -------------------------------- UI atoms -------------------------------- */

const STATUS_STYLES = {
  "Выполнена": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Выполнен": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Трудоустроен": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "В процессе": "bg-amber-50 text-amber-700 border-amber-200",
  "В процессе стажировки": "bg-amber-50 text-amber-700 border-amber-200",
  "Не начата": "bg-slate-100 text-slate-500 border-slate-200",
  "Не начат": "bg-slate-100 text-slate-500 border-slate-200",
  "Отложена": "bg-sky-50 text-sky-700 border-sky-200",
  "Не выполнена": "bg-rose-50 text-rose-700 border-rose-200",
  "Не выполнен": "bg-rose-50 text-rose-700 border-rose-200",
  "Не трудоустроен": "bg-rose-50 text-rose-700 border-rose-200",
};

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 tracking-wide">{label}</span>
        {Icon && <Icon size={16} className="text-slate-400" />}
      </div>
      <span className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500">
      {label}
      {children}
    </label>
  );
}

const inputCls =
  "bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400 w-full h-9 transition";

// used inside table cells: quiet by default, only looks like an input once focused/hovered
const cellInputCls =
  "bg-transparent border border-transparent rounded-md px-1.5 py-1 text-sm text-slate-700 outline-none w-full h-8 truncate transition hover:border-slate-200 hover:bg-slate-50 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

function TextInput(props) {
  return <input {...props} className={props.className || inputCls} />;
}
function SelectInput({ options, className, ...props }) {
  return (
    <select {...props} className={className || inputCls}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function IconButton({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
    >
      {children}
    </button>
  );
}

function AddButton({ onClick, label = "Добавить" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-700 transition h-9 whitespace-nowrap"
    >
      <Plus size={15} /> {label}
    </button>
  );
}

/* ---------- generic editable table: columns define type/options/width ---------- */
/*
columns: [{ key, label, type: 'text'|'number'|'date'|'select'|'readonly', options?, w?: px width }]
Fixed column widths keep every row aligned to the same grid, however long the content is -
long values truncate with a native tooltip instead of stretching the row.
*/
function EditableTable({ columns, rows, onUpdate, onDelete, emptyText = "Пока пусто" }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-400 py-8 text-center">{emptyText}</p>;
  }
  const defaultW = { text: 160, number: 90, date: 120, select: 140, readonly: 120 };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="text-sm border-collapse" style={{ tableLayout: "fixed", width: "100%" }}>
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.w || defaultW[c.type] || 140 }} />
          ))}
          <col style={{ width: 40 }} />
        </colgroup>
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left font-medium text-slate-500 text-xs px-2.5 py-2.5 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {c.label}
              </th>
            ))}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? "bg-slate-50/60" : "bg-white"} hover:bg-slate-100/70`}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-1.5 py-1 align-middle">
                  {c.type === "select" ? (
                    <SelectInput
                      value={row[c.key] ?? c.options[0]}
                      options={c.options}
                      className={cellInputCls}
                      onChange={(e) => onUpdate(row.id, c.key, e.target.value)}
                    />
                  ) : c.type === "readonly" ? (
                    <span
                      className="text-slate-600 px-1.5 block truncate"
                      title={c.render ? undefined : row[c.key]}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </span>
                  ) : (
                    <TextInput
                      type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
                      value={row[c.key] ?? ""}
                      title={row[c.key] || ""}
                      className={cellInputCls}
                      onChange={(e) => onUpdate(row.id, c.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="text-center">
                <IconButton title="Удалить" onClick={() => onDelete(row.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* generic quick-add form: fields definition -> renders a row of inputs + add button */
function QuickAddForm({ fields, onAdd }) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
  const [draft, setDraft] = useState(empty);

  const submit = () => {
    const hasContent = fields.some((f) => String(draft[f.key] ?? "").trim() !== "");
    if (!hasContent) return;
    onAdd(draft);
    setDraft(empty);
  };

  return (
    <div className="flex flex-wrap items-end gap-2.5 mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
      {fields.map((f) => (
        <div key={f.key} style={{ minWidth: f.w || 140, flex: f.flex ? 1 : "none" }}>
          <Field label={f.label}>
            {f.type === "select" ? (
              <SelectInput
                options={f.options}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            ) : (
              <TextInput
                type={f.type || "text"}
                placeholder={f.placeholder || ""}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            )}
          </Field>
        </div>
      ))}
      <AddButton onClick={submit} />
    </div>
  );
}

/* ------------------------------ sidebar nav ------------------------------ */

const NAV = [
  { id: "dashboard", label: "Дашборд обучения", icon: LayoutDashboard },
  { id: "plan", label: "План отдела 2026", icon: Target },
  { id: "tasks", label: "Задачи", icon: ListTodo },
  { id: "quota", label: "Квотники Авесто", icon: GraduationCap },
  { id: "interns", label: "Стажировка", icon: Users },
  { id: "top", label: "Обучение топ-менеджеров", icon: Crown },
  { id: "events", label: "Мероприятия", icon: CalendarDays },
  { id: "library", label: "Корп. библиотека", icon: BookOpen },
];

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#38bdf8"];
const CHART_GRID = "#e2e8f0";
const CHART_TICK = "#94a3b8";
const TOOLTIP_STYLE = { background: "#ffffff", border: "1px solid #e2e8f0", fontSize: 12, borderRadius: 8 };

/* ================================ APP ================================ */

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [trainings, setTrainings] = usePersisted("ld_trainings", []);
  const [planItems, setPlanItems] = usePersisted("ld_plan2026", []);
  const [tasks, setTasks] = usePersisted("ld_tasks", []);

  const [quotniki, setQuotniki] = usePersisted("ld_quotniki", []);
  const [quotAttendance, setQuotAttendance] = usePersisted("ld_quot_attendance", []);
  const [quotCandidates, setQuotCandidates] = usePersisted("ld_quot_candidates", []);

  const [interns, setInterns] = usePersisted("ld_interns", []);

  const [topManagers, setTopManagers] = usePersisted("ld_top_managers", []);
  const [assessment, setAssessment] = usePersisted("ld_assessment", []);

  const [events, setEvents] = usePersisted("ld_events", []);

  const [books, setBooks] = usePersisted("ld_books", []);
  const [audits, setAudits] = usePersisted("ld_audits", []);

  // generic helpers bound per-collection
  const makeHandlers = (setter) => ({
    add: (draft) => setter((prev) => [...prev, { id: uid(), createdAt: todayISO(), ...draft }]),
    update: (id, key, val) =>
      setter((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r))),
    remove: (id) => setter((prev) => prev.filter((r) => r.id !== id)),
  });

  const trainingH = makeHandlers(setTrainings);
  const planH = makeHandlers(setPlanItems);
  const taskH = makeHandlers(setTasks);
  const quotH = makeHandlers(setQuotniki);
  const attendH = makeHandlers(setQuotAttendance);
  const candH = makeHandlers(setQuotCandidates);
  const topH = makeHandlers(setTopManagers);
  const assessH = makeHandlers(setAssessment);
  const eventH = makeHandlers(setEvents);
  const bookH = makeHandlers(setBooks);
  const auditH = makeHandlers(setAudits);

  // interns: special update to auto-calc endDate when startDate changes
  const internH = {
    add: (draft) =>
      setInterns((prev) => [
        ...prev,
        {
          id: uid(),
          createdAt: todayISO(),
          ...draft,
          endDate: calcInternEnd(draft.startDate),
        },
      ]),
    update: (id, key, val) =>
      setInterns((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next = { ...r, [key]: val };
          if (key === "startDate") next.endDate = calcInternEnd(val);
          return next;
        })
      ),
    remove: (id) => setInterns((prev) => prev.filter((r) => r.id !== id)),
  };

  return (
    <div
      className="w-full min-h-screen bg-slate-50 text-slate-900 flex"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif" }}
    >
      {/* mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3">
        <span className="font-semibold tracking-tight">L&D CRM</span>
        <button onClick={() => setMobileNavOpen((v) => !v)} className="text-slate-500">
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* sidebar */}
      <aside
        className={`fixed md:static z-20 top-12 md:top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 flex-col p-4 gap-1 transition-transform md:translate-x-0 ${
          mobileNavOpen ? "flex translate-x-0" : "hidden md:flex"
        }`}
      >
        <div className="hidden md:block px-2 pb-6 pt-2">
          <p className="text-sm font-semibold tracking-tight text-slate-900">L&D CRM</p>
          <p className="text-xs text-slate-400 mt-0.5">Отдел обучения и развития</p>
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition ${
                active
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}

        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="px-3 py-2 rounded-xl bg-slate-50 flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 leading-snug">
              Общие данные — видят и редактируют все, у кого есть ссылка на эту CRM.
            </span>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 self-start"
            >
              Обновить данные
            </button>
          </div>
        </div>
      </aside>

      {/* main content */}
      <main className="flex-1 p-5 md:p-8 mt-12 md:mt-0 max-w-6xl">
        {activeTab === "dashboard" && (
          <DashboardSection trainings={trainings} h={trainingH} />
        )}
        {activeTab === "plan" && <PlanSection items={planItems} h={planH} />}
        {activeTab === "tasks" && <TasksSection tasks={tasks} h={taskH} />}
        {activeTab === "quota" && (
          <QuotaSection
            quotniki={quotniki} qH={quotH}
            attendance={quotAttendance} aH={attendH}
            candidates={quotCandidates} cH={candH}
          />
        )}
        {activeTab === "interns" && <InternsSection interns={interns} h={internH} />}
        {activeTab === "top" && (
          <TopManagersSection
            managers={topManagers} mH={topH}
            assessment={assessment} aH={assessH}
          />
        )}
        {activeTab === "events" && <EventsSection events={events} h={eventH} />}
        {activeTab === "library" && (
          <LibrarySection books={books} bH={bookH} audits={audits} auH={auditH} />
        )}
      </main>
    </div>
  );
}

/* ============================== 1. DASHBOARD ============================== */

function DashboardSection({ trainings, h }) {
  const stats = useMemo(() => {
    const companies = new Set(trainings.map((t) => t.company).filter(Boolean));
    const totalCourses = trainings.reduce((s, t) => s + num(t.completedCourses), 0);
    const totalPlanned = trainings.reduce((s, t) => s + num(t.plannedCourses), 0);
    const totalParticipants = trainings.reduce((s, t) => s + num(t.participants), 0);
    const totalCompleted = trainings.reduce((s, t) => s + num(t.completedParticipants), 0);
    const totalCost = trainings.reduce((s, t) => s + num(t.cost), 0);
    const planPct = totalPlanned > 0 ? Math.round((totalCourses / totalPlanned) * 100) : 0;
    return { companies: companies.size, totalCourses, totalPlanned, totalParticipants, totalCompleted, totalCost, planPct };
  }, [trainings]);

  const barData = trainings.map((t) => ({
    name: t.company || "—",
    План: num(t.plannedCourses),
    Выполнено: num(t.completedCourses),
  }));

  const formatCounts = useMemo(() => {
    const map = {};
    trainings.forEach((t) => {
      const f = t.format || "Не указан";
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trainings]);

  return (
    <div>
      <SectionHeader
        title="Дашборд обучения"
        description="Общая картина по компаниям, курсам, участникам и выполнению плана обучения."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Компаний" value={stats.companies} icon={Users} />
        <StatCard label="Курсов проведено" value={stats.totalCourses} sub={`план: ${stats.totalPlanned}`} icon={GraduationCap} />
        <StatCard label="Участников" value={stats.totalParticipants} sub={`прошли: ${stats.totalCompleted}`} icon={CheckCircle2} />
        <StatCard label="Сумма тренингов" value={`${fmtMoney(stats.totalCost)} c.`} icon={TrendingUp} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Выполнение годового плана</span>
          <span className="text-sm text-slate-500">{stats.planPct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(stats.planPct, 100)}%` }}
          />
        </div>
      </Card>

      {trainings.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <p className="text-sm font-medium text-slate-700 mb-3">План vs выполнено, по компаниям</p>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                  <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="План" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Выполнено" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-700 mb-3">Форматы тренингов</p>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={formatCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {formatCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Обучение по компаниям</p>
        <QuickAddForm
          fields={[
            { key: "company", label: "Компания", flex: true, placeholder: "Название компании" },
            { key: "format", label: "Формат", type: "select", options: ["Очный", "Онлайн", "Смешанный"] },
            { key: "plannedCourses", label: "План (курсов)", type: "number", w: 110 },
            { key: "completedCourses", label: "Выполнено (курсов)", type: "number", w: 130 },
            { key: "participants", label: "Участников", type: "number", w: 110 },
            { key: "completedParticipants", label: "Прошли", type: "number", w: 100 },
            { key: "cost", label: "Сумма, c.", type: "number", w: 110 },
          ]}
          onAdd={h.add}
        />
        <EditableTable
          columns={[
            { key: "company", label: "Компания", type: "text", w: 180 },
            { key: "format", label: "Формат", type: "select", options: ["Очный", "Онлайн", "Смешанный"], w: 120 },
            { key: "plannedCourses", label: "План курсов", type: "number", w: 100 },
            { key: "completedCourses", label: "Выполнено курсов", type: "number", w: 110 },
            { key: "participants", label: "Участников", type: "number", w: 100 },
            { key: "completedParticipants", label: "Прошли", type: "number", w: 90 },
            { key: "cost", label: "Сумма, c.", type: "number", w: 100 },
          ]}
          rows={trainings}
          onUpdate={h.update}
          onDelete={h.remove}
          emptyText="Добавьте первую компанию, чтобы увидеть дашборд"
        />
      </Card>
    </div>
  );
}

/* ============================== 2. PLAN 2026 ============================== */

function PlanSection({ items, h }) {
  const counts = useMemo(() => {
    const done = items.filter((i) => i.status === "Выполнен").length;
    const progress = items.filter((i) => i.status === "В процессе").length;
    const notStarted = items.filter((i) => !i.status || i.status === "Не начат").length;
    return { total: items.length, done, progress, notStarted };
  }, [items]);

  return (
    <div>
      <SectionHeader title="План отдела 2026" description="Ключевые направления и инициативы отдела на год." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Всего пунктов" value={counts.total} icon={Target} />
        <StatCard label="Выполнено" value={counts.done} icon={CheckCircle2} />
        <StatCard label="В процессе" value={counts.progress} icon={Clock} />
        <StatCard label="Не начато" value={counts.notStarted} icon={PauseCircle} />
      </div>
      <Card>
        <QuickAddForm
          fields={[
            { key: "title", label: "Пункт плана", flex: true, placeholder: "Например: запуск программы адаптации" },
            { key: "description", label: "Описание", flex: true, placeholder: "Кратко опишите план" },
            { key: "deadline", label: "Срок", type: "date", w: 150 },
            { key: "status", label: "Статус", type: "select", options: ["Не начат", "В процессе", "Выполнен"] },
          ]}
          onAdd={h.add}
        />
        <EditableTable
          columns={[
            { key: "title", label: "Пункт плана", type: "text", w: 220 },
            { key: "description", label: "Описание", type: "text", w: 260 },
            { key: "deadline", label: "Срок", type: "date", w: 120 },
            { key: "status", label: "Статус", type: "select", options: ["Не начат", "В процессе", "Выполнен"], w: 140 },
          ]}
          rows={items}
          onUpdate={h.update}
          onDelete={h.remove}
        />
      </Card>
    </div>
  );
}

/* ================================ 3. TASKS ================================ */

function TasksSection({ tasks, h }) {
  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "Выполнена").length;
    const notDone = tasks.filter((t) => t.status === "Не выполнена").length;
    const postponed = tasks.filter((t) => t.status === "Отложена").length;
    const inProgress = tasks.filter((t) => t.status === "В процессе").length;
    return { total: tasks.length, done, notDone, postponed, inProgress };
  }, [tasks]);

  return (
    <div>
      <SectionHeader title="Задачи" description="Еженедельные задачи отдела и статистика выполнения с начала года." />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Всего с начала года" value={stats.total} icon={ListTodo} />
        <StatCard label="Выполнено" value={stats.done} icon={CheckCircle2} />
        <StatCard label="В процессе" value={stats.inProgress} icon={Clock} />
        <StatCard label="Отложено" value={stats.postponed} icon={PauseCircle} />
        <StatCard label="Не выполнено" value={stats.notDone} icon={XCircle} />
      </div>
      <Card>
        <QuickAddForm
          fields={[
            { key: "week", label: "Неделя", w: 150, placeholder: "Неделя 32 (авг)" },
            { key: "text", label: "Задача", flex: true, placeholder: "Описание задачи" },
            { key: "status", label: "Статус", type: "select", options: ["Не начата", "В процессе", "Выполнена", "Отложена", "Не выполнена"] },
          ]}
          onAdd={h.add}
        />
        <EditableTable
          columns={[
            { key: "week", label: "Неделя", type: "text", w: 130 },
            { key: "text", label: "Задача", type: "text", w: 280 },
            { key: "status", label: "Статус", type: "select", options: ["Не начата", "В процессе", "Выполнена", "Отложена", "Не выполнена"], w: 150 },
            { key: "createdAt", label: "Добавлена", type: "readonly", render: (r) => fmtDate(r.createdAt), w: 100 },
          ]}
          rows={tasks}
          onUpdate={h.update}
          onDelete={h.remove}
        />
      </Card>
    </div>
  );
}

/* ================================ 4. QUOTA ================================ */

function QuotaSection({ quotniki, qH, attendance, aH, candidates, cH }) {
  return (
    <div>
      <SectionHeader
        title="Квотники Авесто (MDIS)"
        description="Список квотников, обучающихся в MDIS, посещаемость и кандидаты на квоту."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Квотников" value={quotniki.length} icon={GraduationCap} />
        <StatCard label="Записей посещения" value={attendance.length} icon={CalendarDays} />
        <StatCard label="Кандидатов" value={candidates.length} icon={Users} />
      </div>

      <Card className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Список квотников</p>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "contacts", label: "Контакты", w: 150 },
            { key: "place", label: "Место стажировки", w: 170 },
            { key: "specialty", label: "Специальность", w: 160 },
            { key: "course", label: "Курс", w: 90 },
          ]}
          onAdd={qH.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 190 },
            { key: "contacts", label: "Контакты", type: "text", w: 140 },
            { key: "place", label: "Место стажировки", type: "text", w: 170 },
            { key: "specialty", label: "Специальность", type: "text", w: 160 },
            { key: "course", label: "Курс", type: "text", w: 80 },
          ]}
          rows={quotniki}
          onUpdate={qH.update}
          onDelete={qH.remove}
        />
      </Card>

      <Card className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">График посещения</p>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "date", label: "Дата", type: "date", w: 150 },
            { key: "present", label: "Присутствие", type: "select", options: ["Да", "Нет"] },
            { key: "note", label: "Примечание", w: 160 },
          ]}
          onAdd={aH.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 190 },
            { key: "date", label: "Дата", type: "date", w: 120 },
            { key: "present", label: "Присутствие", type: "select", options: ["Да", "Нет"], w: 120 },
            { key: "note", label: "Примечание", type: "text", w: 200 },
          ]}
          rows={attendance}
          onUpdate={aH.update}
          onDelete={aH.remove}
        />
      </Card>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Кандидаты на квоту Авесто</p>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "contacts", label: "Контакты", w: 150 },
            { key: "place", label: "Место / отдел", w: 160 },
            { key: "specialty", label: "Специальность", w: 150 },
            { key: "status", label: "Статус", type: "select", options: ["На рассмотрении", "Одобрен", "Отклонён"] },
          ]}
          onAdd={cH.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 190 },
            { key: "contacts", label: "Контакты", type: "text", w: 140 },
            { key: "place", label: "Место / отдел", type: "text", w: 160 },
            { key: "specialty", label: "Специальность", type: "text", w: 160 },
            { key: "status", label: "Статус", type: "select", options: ["На рассмотрении", "Одобрен", "Отклонён"], w: 150 },
          ]}
          rows={candidates}
          onUpdate={cH.update}
          onDelete={cH.remove}
        />
      </Card>
    </div>
  );
}

/* =============================== 5. INTERNS =============================== */

function InternsSection({ interns, h }) {
  const stats = useMemo(() => {
    const employed = interns.filter((i) => i.employment === "Трудоустроен").length;
    const notEmployed = interns.filter((i) => i.employment === "Не трудоустроен").length;
    return { total: interns.length, employed, notEmployed };
  }, [interns]);

  return (
    <div>
      <SectionHeader
        title="Стажировка"
        description="Дата окончания стажировки рассчитывается автоматически: старт + 3 месяца, с переносом на ближайший рабочий день."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Всего стажёров" value={stats.total} icon={Users} />
        <StatCard label="Трудоустроено" value={stats.employed} icon={CheckCircle2} />
        <StatCard label="Не трудоустроено" value={stats.notEmployed} icon={XCircle} />
        <StatCard
          label="Конверсия"
          value={stats.total ? `${Math.round((stats.employed / stats.total) * 100)}%` : "—"}
          icon={TrendingUp}
        />
      </div>
      <Card>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "contacts", label: "Контакты", w: 140 },
            { key: "place", label: "Место стажировки", w: 150 },
            { key: "department", label: "Отдел", w: 130 },
            { key: "startDate", label: "Дата начала", type: "date", w: 150 },
            { key: "employment", label: "Статус", type: "select", options: ["В процессе стажировки", "Трудоустроен", "Не трудоустроен"] },
            { key: "hiredPosition", label: "Должность после", w: 150 },
          ]}
          onAdd={h.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 170 },
            { key: "contacts", label: "Контакты", type: "text", w: 130 },
            { key: "place", label: "Место стажировки", type: "text", w: 150 },
            { key: "department", label: "Отдел", type: "text", w: 110 },
            { key: "startDate", label: "Начало", type: "date", w: 115 },
            { key: "endDate", label: "Окончание (авто)", type: "readonly", render: (r) => fmtDate(r.endDate), w: 130 },
            { key: "employment", label: "Статус", type: "select", options: ["В процессе стажировки", "Трудоустроен", "Не трудоустроен"], w: 160 },
            { key: "hiredPosition", label: "Должность после", type: "text", w: 150 },
          ]}
          rows={interns}
          onUpdate={h.update}
          onDelete={h.remove}
        />
      </Card>
    </div>
  );
}

/* ============================ 6. TOP MANAGERS ============================ */

function TopManagersSection({ managers, mH, assessment, aH }) {
  return (
    <div>
      <SectionHeader
        title="Обучение топ-менеджеров"
        description="Список топ-менеджеров, участие в мероприятиях, и ассессмент-центр Meta HR (3 этап оценки)."
      />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Топ-менеджеров" value={managers.length} icon={Crown} />
        <StatCard label="Участников ассессмента" value={assessment.length} icon={GraduationCap} />
      </div>

      <Card className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Список топ-менеджеров</p>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "position", label: "Должность", w: 150 },
            { key: "company", label: "Компания", w: 150 },
            { key: "contacts", label: "Контакты", w: 140 },
            { key: "events", label: "Мероприятия / тренинги", flex: true, placeholder: "перечислите через запятую" },
          ]}
          onAdd={mH.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 180 },
            { key: "position", label: "Должность", type: "text", w: 150 },
            { key: "company", label: "Компания", type: "text", w: 150 },
            { key: "contacts", label: "Контакты", type: "text", w: 140 },
            { key: "events", label: "Мероприятия / тренинги", type: "text", w: 240 },
          ]}
          rows={managers}
          onUpdate={mH.update}
          onDelete={mH.remove}
        />
      </Card>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Ассессмент-центр Meta HR — 3 этап оценки</p>
        <QuickAddForm
          fields={[
            { key: "fio", label: "ФИО", flex: true },
            { key: "stage", label: "Этап", w: 130, default: "3 этап" },
            { key: "date", label: "Дата", type: "date", w: 150 },
            { key: "result", label: "Результат", flex: true, placeholder: "заполнить позже" },
          ]}
          onAdd={aH.add}
        />
        <EditableTable
          columns={[
            { key: "fio", label: "ФИО", type: "text", w: 190 },
            { key: "stage", label: "Этап", type: "text", w: 110 },
            { key: "date", label: "Дата", type: "date", w: 120 },
            { key: "result", label: "Результат", type: "text", w: 260 },
          ]}
          rows={assessment}
          onUpdate={aH.update}
          onDelete={aH.remove}
          emptyText="Результаты можно добавить позже"
        />
      </Card>
    </div>
  );
}

/* ================================ 7. EVENTS ================================ */

function EventsSection({ events, h }) {
  const stats = useMemo(() => {
    const totalParticipants = events.reduce((s, e) => s + num(e.participants), 0);
    const byType = {};
    events.forEach((e) => {
      const t = e.type || "Другое";
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total: events.length, totalParticipants, byType };
  }, [events]);

  const chartData = Object.entries(stats.byType).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <SectionHeader title="Мероприятия" description="Тимбилдинги, тренинги, конференции и другие мероприятия отдела." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Всего мероприятий" value={stats.total} icon={CalendarDays} />
        <StatCard label="Участников всего" value={stats.totalParticipants} icon={Users} />
        <StatCard
          label="Среднее участников"
          value={stats.total ? Math.round(stats.totalParticipants / stats.total) : 0}
          icon={TrendingUp}
        />
      </div>

      {events.length > 0 && (
        <Card className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Мероприятия по типу</p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: CHART_TICK, fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: CHART_TICK, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <QuickAddForm
          fields={[
            { key: "name", label: "Название", flex: true, placeholder: "Например: Тимбилдинг Q3" },
            { key: "type", label: "Тип", type: "select", options: ["Тимбилдинг", "Тренинг", "Конференция", "Другое"] },
            { key: "date", label: "Дата", type: "date", w: 150 },
            { key: "place", label: "Место", w: 150 },
            { key: "participants", label: "Участников", type: "number", w: 110 },
          ]}
          onAdd={h.add}
        />
        <EditableTable
          columns={[
            { key: "name", label: "Название", type: "text", w: 220 },
            { key: "type", label: "Тип", type: "select", options: ["Тимбилдинг", "Тренинг", "Конференция", "Другое"], w: 140 },
            { key: "date", label: "Дата", type: "date", w: 120 },
            { key: "place", label: "Место", type: "text", w: 150 },
            { key: "participants", label: "Участников", type: "number", w: 100 },
          ]}
          rows={events}
          onUpdate={h.update}
          onDelete={h.remove}
        />
      </Card>
    </div>
  );
}

/* =============================== 8. LIBRARY =============================== */

function LibrarySection({ books, bH, audits, auH }) {
  return (
    <div>
      <SectionHeader title="Корпоративная библиотека" description="Каталог книг и результаты аудита фонда." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Книг в каталоге" value={books.length} icon={BookOpen} />
        <StatCard label="Проведено аудитов" value={audits.length} icon={CheckCircle2} />
        <StatCard
          label="Последний аудит"
          value={audits.length ? fmtDate(audits[audits.length - 1].date) : "—"}
          icon={CalendarDays}
        />
      </div>

      <Card className="mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Каталог книг</p>
        <QuickAddForm
          fields={[
            { key: "title", label: "Название", flex: true },
            { key: "author", label: "Автор", w: 160 },
            { key: "block", label: "Блок / полка", w: 130 },
          ]}
          onAdd={bH.add}
        />
        <EditableTable
          columns={[
            { key: "title", label: "Название", type: "text", w: 260 },
            { key: "author", label: "Автор", type: "text", w: 180 },
            { key: "block", label: "Блок / полка", type: "text", w: 130 },
          ]}
          rows={books}
          onUpdate={bH.update}
          onDelete={bH.remove}
        />
      </Card>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Результаты аудита</p>
        <QuickAddForm
          fields={[
            { key: "date", label: "Дата аудита", type: "date", w: 150 },
            { key: "found", label: "Найдено книг", type: "number", w: 120 },
            { key: "missing", label: "Не найдено", type: "number", w: 120 },
            { key: "notes", label: "Комментарий", flex: true, placeholder: "какие книги отсутствуют и т.д." },
          ]}
          onAdd={auH.add}
        />
        <EditableTable
          columns={[
            { key: "date", label: "Дата аудита", type: "date", w: 120 },
            { key: "found", label: "Найдено книг", type: "number", w: 120 },
            { key: "missing", label: "Не найдено", type: "number", w: 110 },
            { key: "notes", label: "Комментарий", type: "text", w: 300 },
          ]}
          rows={audits}
          onUpdate={auH.update}
          onDelete={auH.remove}
          emptyText="Аудитов пока не было"
        />
      </Card>
    </div>
  );
}

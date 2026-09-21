import { useEffect, useState } from "react";
import { apiFetch, readJson } from "./api.js";
import { supabase } from "./supabase.js";

function Planner({ user, onSignOut }) {
  const [options, setOptions] = useState({ roles: [], skills: [] });
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [o, p] = await Promise.all([
          apiFetch("/api/options").then(readJson),
          apiFetch("/api/profile").then(readJson),
        ]);
        setOptions(o);
        setProfile(p);
        setEditing(!p);
      } catch {
        setError("Couldn't load your data. Is the backend running, and is Supabase set up?");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(form) {
    setSaving(true);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setProfile(await readJson(res));
      setEditing(false);
    } catch {
      setError("Couldn't save. Is the backend running?");
    }
    setSaving(false);
  }

  async function generatePlan() {
    setPlanning(true);
    try {
      const res = await apiFetch("/api/plan", { method: "POST" });
      setProfile(await readJson(res));
    } catch {
      setError("Couldn't build the roadmap. Is the backend running?");
    }
    setPlanning(false);
  }

  async function toggleTopic(id, done) {
    const res = await apiFetch(`/api/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    setProfile(await readJson(res));
  }

  // Returns null on success, or an error message for the form to show.
  async function adaptPlan(feedback, hours) {
    try {
      const res = await apiFetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, hours_per_week: hours }),
      });
      const body = await res.json();
      if (!res.ok) return body.detail || "Something went wrong.";
      setProfile(body);
      return null;
    } catch {
      return "Can't reach the backend. Is it running on port 8000?";
    }
  }

  async function loadResources(id) {
    try {
      const res = await apiFetch(`/api/topics/${id}/resources`, { method: "POST" });
      if (res.ok) setProfile(await readJson(res));
    } catch {
      /* the button just stops showing "Finding resources…" */
    }
  }

  return (
    <main className="page">
      <header className="top">
        <div className="userbar">
          <span>{user.email}</span>
          <button className="secondary small" onClick={onSignOut}>Sign out</button>
        </div>
        <h1>EduPath</h1>
        <p>Tell us where you are and where you want to be.</p>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && !error && <p>Loading…</p>}

      {!loading && !error && (editing ? (
        <ProfileForm options={options} initial={profile} onSave={save} saving={saving} />
      ) : (
        <Dashboard
          profile={profile}
          onEdit={() => setEditing(true)}
          onGenerate={generatePlan}
          planning={planning}
          onToggle={toggleTopic}
          onAdapt={adaptPlan}
          onResources={loadResources}
        />
      ))}
    </main>
  );
}

function ProfileForm({ options, initial, onSave, saving }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.target_role ?? "");
  const [hours, setHours] = useState(initial?.hours_per_week ?? 10);
  const [skills, setSkills] = useState(initial?.current_skills ?? []);
  const [custom, setCustom] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resumeMsg, setResumeMsg] = useState("");

  // Chips = suggested skills + anything you added yourself
  const allChips = [...new Set([...options.skills, ...skills])];

  function toggle(skill) {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }

  function addCustom() {
    const value = custom.trim();
    if (value && !skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkills([...skills, value]);
    }
    setCustom("");
  }

  async function handleResume(e) {
    const file = e.target.files[0];
    e.target.value = ""; // lets you pick the same file again later
    if (!file) return;

    setUploading(true);
    setResumeMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/resume", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setResumeMsg(body.detail || "Something went wrong.");
      } else {
        // add the found skills to the ones already selected (no duplicates)
        const have = new Set(skills.map((s) => s.toLowerCase()));
        const fresh = body.skills.filter((s) => !have.has(s.toLowerCase()));
        setSkills([...skills, ...fresh]);
        setResumeMsg(`Found ${body.skills.length} skills and added ${fresh.length} new ones. Untick any that aren't right.`);
      }
    } catch {
      setResumeMsg("Can't reach the backend. Is it running on port 8000?");
    }
    setUploading(false);
  }

  function submit(e) {
    e.preventDefault();
    onSave({
      name,
      target_role: role.trim(),
      current_skills: skills,
      hours_per_week: Number(hours),
    });
  }

  return (
    <form className="panel" onSubmit={submit}>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        Target role (type any role you want)
        <input
          list="role-suggestions"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Cybersecurity Analyst"
          required
        />
        <datalist id="role-suggestions">
          {options.roles.map((r) => <option key={r} value={r} />)}
        </datalist>
      </label>

      <label>
        Hours you can study per week
        <input type="number" min="1" max="60" value={hours} onChange={(e) => setHours(e.target.value)} />
      </label>

      <fieldset>
        <legend>Skills you already have</legend>
        <div className="resume">
          <label className="upload">
            <input type="file" accept="application/pdf,.pdf" onChange={handleResume} disabled={uploading} />
            <span className="secondary">{uploading ? "Reading your resume…" : "Upload resume (PDF)"}</span>
          </label>
          <p className="meta">We read it once to find your skills. The file isn't saved.</p>
          {resumeMsg && <p className="note">{resumeMsg}</p>}
        </div>
        <div className="chips">
          {allChips.map((s) => (
            <button
              type="button"
              key={s}
              className={skills.includes(s) ? "chip on" : "chip"}
              aria-pressed={skills.includes(s)}
              onClick={() => toggle(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="add-row">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Add another skill"
          />
          <button type="button" className="secondary" onClick={addCustom}>Add</button>
        </div>
      </fieldset>

      <button className="primary" type="submit" disabled={saving}>
        {saving ? "Analyzing your skills…" : "Save and find my gaps"}
      </button>
    </form>
  );
}

function Dashboard({ profile, onEdit, onGenerate, planning, onToggle, onAdapt, onResources }) {
  return (
    <>
    <section className="panel">
      <h2>{profile.name}, your path to {profile.target_role}</h2>
      <p className="meta">{profile.hours_per_week} hours per week</p>

      {profile.source === "fallback" && (
        <p className="error">
          The AI couldn't be reached, so this uses a built-in list
          {profile.required_skills.length === 0 && " (and there's none for this role)"}.
          Check your API key in backend/.env and the backend terminal for details.
        </p>
      )}

      <div className="cols">
        <div>
          <h3>You have</h3>
          <ul className="list have">
            {profile.current_skills.length === 0 && <li className="empty">Nothing selected yet</li>}
            {profile.current_skills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h3>Still to learn</h3>
          <ul className="list gap">
            {profile.gaps.length === 0 && <li className="empty">No gaps found.</li>}
            {profile.gaps.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>

      <button className="secondary" onClick={onEdit}>Edit profile</button>
    </section>

    <Roadmap profile={profile} onGenerate={onGenerate} planning={planning} onToggle={onToggle} onAdapt={onAdapt} onResources={onResources} />
    </>
  );
}

function Roadmap({ profile, onGenerate, planning, onToggle, onAdapt, onResources }) {
  const plan = profile.plan;

  if (!plan) {
    return (
      <section className="panel roadmap">
        <h2>Your weekly roadmap</h2>
        <p className="meta">
          We'll turn your gaps into weekly steps that fit your {profile.hours_per_week} hours.
        </p>
        <button
          className="primary"
          onClick={onGenerate}
          disabled={planning || profile.gaps.length === 0}
        >
          {planning ? "Building your roadmap…" : "Build my roadmap"}
        </button>
      </section>
    );
  }

  const completed = plan.completed ?? [];
  const upcoming = plan.weeks.flatMap((w) => w.topics);
  const total = completed.length + upcoming.length;
  const doneCount = completed.length + upcoming.filter((t) => t.done).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const update = plan.last_update;

  function rebuild() {
    if (window.confirm("This starts a fresh roadmap and clears your progress. Continue?")) {
      onGenerate();
    }
  }

  return (
    <section className="panel roadmap">
      <h2>Your weekly roadmap</h2>

      {plan.source === "fallback" && (
        <p className="error">
          The AI couldn't be reached, so this plan is simpler than usual. Try again in a moment.
        </p>
      )}

      <div>
        <p className="meta">{doneCount} of {total} topics done ({pct}%)</p>
        <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      {update && (
        <div className="changes">
          <h3>What changed in your last update</h3>
          <ul>
            {update.changes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {completed.length > 0 && (
        <details className="completed">
          <summary>Completed so far ({completed.length})</summary>
          <ul>
            {completed.map((t) => (
              <li key={t.id}>✓ <strong>{t.skill}</strong>: {t.title}</li>
            ))}
          </ul>
        </details>
      )}

      {plan.weeks.map((w) => (
        <div className="week" key={w.week}>
          <h3>
            Week {w.week}
            <span className="hours"> {w.topics.reduce((sum, t) => sum + t.hours, 0)} h</span>
          </h3>
          <ul className="topics">
            {w.topics.map((t) => (
              <TopicRow key={t.id} t={t} onToggle={onToggle} onResources={onResources} />
            ))}
          </ul>
        </div>
      ))}

      <AdaptForm hours={profile.hours_per_week} onAdapt={onAdapt} />

      <button className="secondary" onClick={rebuild} disabled={planning}>
        {planning ? "Rebuilding…" : "Start a fresh roadmap"}
      </button>
    </section>
  );
}

function AdaptForm({ hours, onAdapt }) {
  const [feedback, setFeedback] = useState("");
  const [newHours, setNewHours] = useState(hours);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const problem = await onAdapt(feedback, Number(newHours));
    setBusy(false);
    if (problem) setMessage(problem);
    else setFeedback("");
  }

  return (
    <form className="adapt" onSubmit={submit}>
      <h3>How is it going?</h3>
      <p className="meta">
        Tick what you finished, then tell us how it went. EduPath rewrites the rest of your plan.
      </p>
      <label>
        Your feedback
        <textarea
          rows="3"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g. I finished Python but found statistics hard."
          required
        />
      </label>
      <label>
        Hours you can study per week now
        <input type="number" min="1" max="60" value={newHours} onChange={(e) => setNewHours(e.target.value)} />
      </label>
      {message && <p className="error">{message}</p>}
      <button className="primary" type="submit" disabled={busy || !feedback.trim()}>
        {busy ? "Updating your roadmap…" : "Update my roadmap"}
      </button>
    </form>
  );
}

function TopicRow({ t, onToggle, onResources }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleResources() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!t.resources) {
      setLoading(true);
      await onResources(t.id);
      setLoading(false);
    }
  }

  return (
    <li>
      <label className={t.done ? "topic done" : "topic"}>
        <input
          type="checkbox"
          checked={t.done}
          onChange={(e) => onToggle(t.id, e.target.checked)}
        />
        <span>
          <strong>{t.skill}</strong>: {t.title}
          <span className="hours"> {t.hours} h</span>
        </span>
      </label>

      <button type="button" className="link-btn" onClick={toggleResources} aria-expanded={open}>
        {loading ? "Finding resources…" : open ? "Hide resources" : "Find resources"}
      </button>

      {open && t.resources && (
        <div className="resources">
          {t.resources.tip && <p><strong>Focus on:</strong> {t.resources.tip}</p>}
          {t.resources.practice && <p><strong>Practice:</strong> {t.resources.practice}</p>}
          <ul>
            {t.resources.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              </li>
            ))}
          </ul>
          {t.resources.source === "fallback" && (
            <p className="meta">AI tips weren't available, so these are plain search links.</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    // runs whenever someone signs in or out
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <main className="page">
        <p className="error">
          Supabase isn't set up yet. Create <code>frontend/.env</code> with your project URL and
          publishable key, then restart <code>npm run dev</code>.
        </p>
      </main>
    );
  }
  if (checking) return <main className="page"><p>Loading…</p></main>;
  if (!session) return <AuthScreen />;

  return (
    <Planner
      key={session.user.id}
      user={session.user}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) {
        setMessage("Account created. Check your email for a confirmation link, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setBusy(false);
  }

  return (
    <main className="page">
      <header className="top">
        <h1>EduPath</h1>
        <p>Your personal, adaptive learning path.</p>
      </header>

      <form className="panel" onSubmit={submit}>
        <h2>{mode === "signin" ? "Sign in" : "Create your account"}</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email" required />
        </label>
        <label>
          Password (at least 6 characters)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} required />
        </label>
        {message && <p className="error">{message}</p>}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" className="link-btn switch"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

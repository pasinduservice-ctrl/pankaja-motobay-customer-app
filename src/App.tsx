import { FormEvent, useEffect, useState } from "react";
import { supabase } from "./supabase";

type Tip = { id: string; title: string; body: string; language: string; is_published: boolean; created_at: string };
type Booking = { id: string; customer_id: string; service_type: string; vehicle_type: string; preferred_date: string; note: string | null; status: string; created_at: string };

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"bookings"|"tips">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [language, setLanguage] = useState("English");
  const [editingTip, setEditingTip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkAdmin() {
    if (!supabase) { setError("Missing Supabase settings. Copy .env.example to .env and set the URL/public key."); return false; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setLoggedIn(false); return false; }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoggedIn(false);
      setError("This account is not marked as admin in public.profiles. Assign the admin role in Supabase SQL Editor.");
      return false;
    }
    setLoggedIn(true); setError(""); return true;
  }
  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    if (!supabase) { setError("Missing Supabase settings. Configure .env first."); setBusy(false); return; }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) { setError(loginError.message); setBusy(false); return; }
    await checkAdmin(); setBusy(false);
  }
  async function logout() { await supabase?.auth.signOut(); setLoggedIn(false); setBookings([]); setTips([]); }
  async function loadBookings() {
    if (!supabase) return;
    const { data, error: e } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (e) setError(e.message); else setBookings((data ?? []) as Booking[]);
  }
  async function loadTips() {
    if (!supabase) return;
    const { data, error: e } = await supabase.from("tips").select("*").order("created_at", { ascending: false });
    if (e) setError(e.message); else setTips((data ?? []) as Tip[]);
  }
  useEffect(() => { if (loggedIn) { loadBookings(); loadTips(); } }, [loggedIn]);
  async function updateStatus(id: string, status: string) {
    if (!supabase) return;
    const { error: e } = await supabase.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (e) setError(e.message); else loadBookings();
  }
  async function saveTip(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !title.trim() || !body.trim()) return;
    setBusy(true); setError("");
    const payload = { title: title.trim(), body: body.trim(), language, updated_at: new Date().toISOString() };
    const result = editingTip
      ? await supabase.from("tips").update(payload).eq("id", editingTip)
      : await supabase.from("tips").insert({ ...payload, is_published: false });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    setTitle(""); setBody(""); setLanguage("English"); setEditingTip(null); loadTips();
  }
  async function publishTip(tip: Tip) {
    if (!supabase) return;
    const { error: e } = await supabase.from("tips").update({ is_published: !tip.is_published, updated_at: new Date().toISOString() }).eq("id", tip.id);
    if (e) setError(e.message); else loadTips();
  }
  async function deleteTip(id: string) {
    if (!supabase || !window.confirm("Delete this tip?")) return;
    const { error: e } = await supabase.from("tips").delete().eq("id", id);
    if (e) setError(e.message); else loadTips();
  }
  function editTip(t: Tip) { setEditingTip(t.id); setTitle(t.title); setBody(t.body); setLanguage(t.language); setTab("tips"); }

  if (!loggedIn) return <main className="login-wrap">
    <form className="login-card" onSubmit={login}>
      <img className="login-logo" src="/logo.jpg" alt="Pankaja Motobay logo" />
      <p className="eyebrow">PRIVATE MANAGEMENT</p>
      <h1>Pankaja Motobay</h1><p className="muted">Admin Panel</p>
      {!supabase && <p className="error">Supabase settings are missing. Configure your local .env file first.</p>}
      {error && <p className="error">{error}</p>}
      <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" /></label>
      <label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" /></label>
      <button disabled={busy} className="primary full">{busy ? "Please wait…" : "Sign in securely"}</button>
      <p className="small muted">Admin accounts are created in Supabase Authentication. Customer accounts cannot access admin features.</p>
    </form>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img className="sidebar-logo" src="/logo.jpg" alt="Pankaja Motobay logo" /><div><strong>PANKAJA</strong><small>MOTOBAY ADMIN</small></div></div>
      <button className={tab === "bookings" ? "nav active" : "nav"} onClick={() => setTab("bookings")}>Appointment Requests</button>
      <button className={tab === "tips" ? "nav active" : "nav"} onClick={() => setTab("tips")}>Vehicle Care Tips</button>
      <div className="sidebar-bottom"><span className="muted small">Private administrator access</span><button className="secondary full" onClick={logout}>Sign out</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">WORKSHOP MANAGEMENT</p><h1>{tab === "bookings" ? "Appointment Requests" : "Vehicle Care Tips"}</h1></div><button className="secondary" onClick={() => { loadBookings(); loadTips(); }}>Refresh data</button></header>
      {error && <p className="error banner">{error}</p>}
      {tab === "bookings" && <section className="panel">
        <div className="section-head"><div><h2>Customer bookings</h2><p className="muted">Review requests and update their status.</p></div><span className="count">{bookings.length} total</span></div>
        {bookings.length === 0 ? <p className="empty">No appointment requests yet.</p> : <div className="table-wrap"><table><thead><tr><th>Vehicle / Service</th><th>Preferred date</th><th>Details</th><th>Status</th><th>Update</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id}><td><strong>{b.vehicle_type}</strong><small>{b.service_type}</small><small className="id-text">{b.customer_id.slice(0, 8)}…</small></td><td>{b.preferred_date}</td><td>{b.note || "—"}</td><td><span className={`status ${b.status}`}>{b.status.replace("_"," ")}</span></td><td><select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div>}
      </section>}
      {tab === "tips" && <div className="tips-layout">
        <form className="panel tip-form" onSubmit={saveTip}><h2>{editingTip ? "Edit care tip" : "Create a care tip"}</h2><label>Title<input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Check tyre pressure" /></label><label>Language<select value={language} onChange={e => setLanguage(e.target.value)}><option>English</option><option>Sinhala</option><option>Sinhala + English</option></select></label><label>Tip content<textarea required rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write helpful vehicle maintenance advice…" /></label><button className="primary full" disabled={busy}>{busy ? "Saving…" : editingTip ? "Save changes" : "Save as draft"}</button>{editingTip && <button type="button" className="secondary full" onClick={() => { setEditingTip(null); setTitle(""); setBody(""); }}>Cancel edit</button>}</form>
        <section className="panel"><div className="section-head"><div><h2>Saved tips</h2><p className="muted">Publish or edit without rebuilding the app.</p></div><span className="count">{tips.length}</span></div>
          {tips.length === 0 ? <p className="empty">No tips created yet.</p> : tips.map(t => <article className="tip-item" key={t.id}><div className="tip-top"><div><h3>{t.title}</h3><span className="muted small">{t.language} · {t.is_published ? "Published" : "Draft"}</span></div><span className={`status ${t.is_published ? "completed" : "pending"}`}>{t.is_published ? "Published" : "Draft"}</span></div><p>{t.body}</p><div className="actions"><button className="secondary" onClick={() => editTip(t)}>Edit</button><button className="secondary" onClick={() => publishTip(t)}>{t.is_published ? "Unpublish" : "Publish"}</button><button className="danger" onClick={() => deleteTip(t.id)}>Delete</button></div></article>)}
        </section>
      </div>}
    </main>
  </div>;
}

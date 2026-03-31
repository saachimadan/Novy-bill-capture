"use client";
import { useState, useRef, useCallback, useEffect } from "react";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:         { minHeight:"100vh", background:"#F5F0E8", fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:"0 auto", position:"relative" },
  header:      { background:"#1A1A2E", padding:"20px 20px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100 },
  logoMark:    { width:36, height:36, background:"linear-gradient(135deg,#E8A87C,#E07B54)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 },
  headerTitle: { color:"#fff", fontSize:17, fontWeight:700, letterSpacing:"-0.3px" },
  headerSub:   { color:"#8888AA", fontSize:11, marginTop:1 },
  stepBar:     { display:"flex", padding:"14px 20px 18px", gap:6, background:"#1A1A2E" },
  stepDot:     (a,d) => ({ flex:1, height:3, borderRadius:2, background:d?"#E8A87C":a?"#fff":"rgba(255,255,255,.15)", transition:"all .3s" }),
  body:        { padding:"20px 16px 100px" },
  card:        { background:"#fff", borderRadius:16, padding:"16px", marginBottom:12, boxShadow:"0 2px 12px rgba(0,0,0,.06)" },
  cardLabel:   { fontSize:10, fontWeight:700, color:"#E07B54", letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 },
  metaKey:     { fontSize:10, color:"#AAA", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", marginBottom:3 },
  metaInput:   { width:"100%", background:"#F8F5F0", border:"1.5px solid #E8E0D4", borderRadius:8, padding:"8px 10px", fontSize:14, color:"#1A1A2E", fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  metaGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 16px" },
  itemCard:    (s,m) => ({ background:s?"#FEF2F2":m?"#FFFDE7":"#fff", borderRadius:12, border:`1.5px solid ${s?"#FECACA":m?"#FDE68A":"#EEE8DE"}`, padding:"12px", marginBottom:10, position:"relative" }),
  itemBadge:   (t) => ({ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:t==="scratched"?"#FEE2E2":"#FEF9C3", color:t==="scratched"?"#DC2626":"#92400E", marginBottom:6 }),
  itemNameIn:  { width:"100%", background:"transparent", border:"none", borderBottom:"1.5px solid #E8E0D4", padding:"4px 0 6px", fontSize:15, fontWeight:600, color:"#1A1A2E", fontFamily:"inherit", outline:"none", marginBottom:8, boxSizing:"border-box" },
  fieldRow:    { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1.2fr", gap:6, marginBottom:4 },
  fieldKey:    { fontSize:9, color:"#AAA", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:3 },
  fieldInput:  { width:"100%", background:"#F8F5F0", border:"1.5px solid #E8E0D4", borderRadius:6, padding:"6px 7px", fontSize:13, color:"#1A1A2E", fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  removeBtn:   { position:"absolute", top:10, right:10, background:"transparent", border:"none", color:"#CCC", cursor:"pointer", fontSize:18, lineHeight:1, padding:0 },
  addItemBtn:  { width:"100%", padding:"11px", background:"transparent", border:"1.5px dashed #C8BFB0", borderRadius:12, color:"#888", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:4 },
  noteBox:     (t) => ({ background:t==="warn"?"#FFFDE7":t==="err"?"#FEF2F2":"#F0FDF4", border:`1px solid ${t==="warn"?"#FDE68A":t==="err"?"#FECACA":"#BBF7D0"}`, borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:12, color:t==="warn"?"#92400E":t==="err"?"#DC2626":"#166534", lineHeight:1.6 }),
  bottomBar:   { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(245,240,232,.95)", backdropFilter:"blur(10px)", padding:"12px 16px 24px", borderTop:"1px solid #E8E0D4", display:"flex", gap:10, zIndex:200 },
  secondaryBtn:{ flex:1, padding:"14px", background:"#fff", color:"#1A1A2E", border:"1.5px solid #D4C8B8", borderRadius:14, fontSize:14, fontWeight:600, cursor:"pointer" },
  primaryBtn:  (d) => ({ flex:2, padding:"14px", background:d?"#D4C8B8":"linear-gradient(135deg,#E8A87C,#E07B54)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:d?"not-allowed":"pointer", boxShadow:d?"none":"0 4px 16px rgba(224,123,84,.4)", transition:"all .2s" }),
  warnBtn:     { flex:2, padding:"14px", background:"linear-gradient(135deg,#F59E0B,#D97706)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(217,119,6,.35)" },
  captureZone: { background:"#fff", borderRadius:20, border:"2px dashed #D4C8B8", padding:"40px 20px", textAlign:"center", cursor:"pointer", transition:"all .2s", marginBottom:16 },
  spinner:     { width:52, height:52, border:"3px solid #E0D8CC", borderTop:"3px solid #E8A87C", borderRadius:"50%", animation:"spin 0.9s linear infinite" },
  successCircle: { width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#6EE7B7,#34D399)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 8px 24px rgba(52,211,153,.35)" },
  updatedCircle: { width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#93C5FD,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 8px 24px rgba(59,130,246,.35)" },
  dupBanner:   { background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:14, padding:"14px 16px", marginBottom:14 },
  dupTitle:    { fontSize:13, fontWeight:700, color:"#C2410C", marginBottom:4, display:"flex", alignItems:"center", gap:6 },
  dupMeta:     { fontSize:12, color:"#7C3A1E", lineHeight:1.7, marginBottom:12 },
  dupSection:  { fontSize:10, fontWeight:700, color:"#9A3412", letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 },
  prevItemRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"#FEF3C7", borderRadius:8, marginBottom:5, fontSize:12 },
  prevItemName:{ color:"#78350F", fontWeight:600, flex:1, marginRight:8 },
  prevItemAmt: { color:"#92400E", fontWeight:700, flexShrink:0 },
  prevTotal:   { display:"flex", justifyContent:"space-between", padding:"8px 10px 0", borderTop:"1px solid #FDE68A", fontSize:13, fontWeight:700, color:"#92400E", marginTop:4 },
  dupActions:  { display:"flex", gap:8, marginTop:12 },
  dupActionBtn:(primary) => ({ flex:1, padding:"10px", background:primary?"#1A1A2E":"#fff", border:primary?"none":"1px solid #D1D5DB", borderRadius:10, color:primary?"#fff":"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }),

  // ── Login screen ──────────────────────────────────────────────────────────
  loginWrap:   { minHeight:"100vh", background:"#1A1A2E", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" },
  loginCard:   { background:"#fff", borderRadius:24, padding:"32px 24px", width:"100%", maxWidth:400, boxShadow:"0 24px 64px rgba(0,0,0,.3)" },
  loginLogo:   { width:56, height:56, background:"linear-gradient(135deg,#E8A87C,#E07B54)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 20px" },
  loginTitle:  { fontSize:22, fontWeight:800, color:"#1A1A2E", textAlign:"center", marginBottom:6 },
  loginSub:    { fontSize:13, color:"#888", textAlign:"center", lineHeight:1.6, marginBottom:28 },
  loginLabel:  { fontSize:11, fontWeight:700, color:"#555", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 },
  loginInput:  { width:"100%", padding:"13px 14px", background:"#F8F5F0", border:"1.5px solid #E8E0D4", borderRadius:12, fontSize:15, color:"#1A1A2E", fontFamily:"inherit", boxSizing:"border-box", outline:"none", marginBottom:10 },
  loginBtn:    (d) => ({ width:"100%", padding:"15px", background:d?"#D4C8B8":"linear-gradient(135deg,#E8A87C,#E07B54)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:d?"not-allowed":"pointer", boxShadow:d?"none":"0 4px 16px rgba(224,123,84,.4)" }),
  loginFooter: { fontSize:11, color:"#8888AA", textAlign:"center", marginTop:20, lineHeight:1.6 },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const toBase64 = (f) => new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(e.target.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
const calcTotal = (qty,rate,tax) => { const q=parseFloat(qty)||0,r=parseFloat(rate)||0,t=parseFloat(tax)||0; return q&&r?Math.round(q*r*(1+t)*100)/100:""; };
const newItem   = () => ({ id:Date.now()+Math.random(), item_name:"", manufacturer:"", qty:"", unit:"PCS", rate:"", tax_pct:"0.05", total:"", scratched_out:false, modified:false, modification_note:"" });
const fmt       = (n) => n!=null&&n!==""?`₹${parseFloat(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—";

function mapItems(items) {
  return (items||[]).map((item,i) => ({
    id: item.id || Date.now()+i,
    item_name: item.item_name||"", manufacturer: item.manufacturer||"",
    qty: item.qty??"", unit: item.unit||"PCS", rate: item.rate??"",
    tax_pct: item.tax_pct??0.05, total: item.total??"",
    scratched_out: item.scratched_out||false, modified: item.modified||false,
    modification_note: item.modification_note||"",
  }));
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("Kitchen");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Please enter your name"); return; }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters"); return; }
    const user = { name: trimmed, role, loginTime: new Date().toISOString() };
    localStorage.setItem("billcapture_user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div style={S.loginWrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} input:focus,select:focus{border-color:#E8A87C!important;box-shadow:0 0 0 3px rgba(232,168,124,.15);outline:none;}`}</style>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>🧾</div>
        <div style={S.loginTitle}>BillCapture</div>
        <div style={S.loginSub}>Enter your name to get started.<br/>This will be recorded with every bill you submit.</div>

        <div style={S.loginLabel}>Your Name</div>
        <input
          style={S.loginInput}
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          autoFocus
        />

        <div style={S.loginLabel}>Your Role</div>
        <select
          style={{...S.loginInput, marginBottom:16}}
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option>Kitchen</option>
          <option>Bar</option>
          <option>Purchase</option>
          <option>Admin</option>
          <option>Others</option>
        </select>

        {error && <div style={{fontSize:12, color:"#DC2626", marginBottom:12}}>⚠️ {error}</div>}

        <button style={S.loginBtn(!name.trim())} onClick={handleLogin} disabled={!name.trim()}>
          Get Started →
        </button>

        <div style={S.loginFooter}>
          Your name is saved on this device.<br/>
          You won't need to enter it again.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BillCaptureApp() {
  const [user, setUser]         = useState(null);
  const [userLoaded, setLoaded] = useState(false);
  const [step, setStep]         = useState("capture");
  const [image, setImage]       = useState(null);
  const [processingMsg, setMsg] = useState("");
  const [error, setError]       = useState("");
  const [submitting, setSub]    = useState(false);
  const [form, setForm]         = useState({ invoice_no:"", invoice_date:"", vendor:"", items:[], invoice_total:"", payment_type:"Credit" });
  const [existingBill, setExist]= useState(null);
  const [lastResult, setResult] = useState(null);
  const [history, setHistory]   = useState([]);
  const fileRef = useRef(); const cameraRef = useRef();

  // ── Load user from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("billcapture_user");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/submit")
      .then(r => r.json())
      .then(d => Array.isArray(d) && setHistory(d.slice(0, 5)))
      .catch(() => {});
  }, [user]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setImage({ file, preview: URL.createObjectURL(file) });
    setError("");
  }, []);

  // ── Extract ──────────────────────────────────────────────────────────────────
  const extractBill = async () => {
    if (!image) return;
    setStep("processing"); setError("");
    try {
      setMsg("Reading your bill…");
      const b64 = await toBase64(image.file);
      setMsg("Extracting invoice details…");
      const resp = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mediaType: image.file.type || "image/jpeg" }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || `HTTP ${resp.status}`); }
      setMsg("Organising fields…");
      const result = await resp.json();
      setForm({
        invoice_no: result.invoice_no || "", invoice_date: result.invoice_date || "",
        vendor: result.vendor || "", invoice_total: result.invoice_total || "", payment_type: "Credit",
        items: mapItems(result.items),
      });
      setStep("review");
    } catch(e) { setError(e.message); setStep("capture"); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSub(true); setError("");
    try {
      const grandTotal = form.items.filter(i => !i.scratched_out).reduce((s,i) => s + (parseFloat(i.total)||0), 0);
      const resp = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, grand_total: grandTotal, submitted_by: user?.name || "Unknown" }),
      });
      const result = await resp.json();
      if (resp.status === 409 && result.duplicate) { setExist(result.existing); setStep("duplicate"); return; }
      if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);
      setResult({ ...form, grand_total: grandTotal, invoice_id: result.invoice_id, updated: false });
      setHistory(h => [{ ...form, grand_total: grandTotal, submitted_at: new Date().toISOString(), submitted_by: user?.name }, ...h.slice(0,4)]);
      setStep("success");
    } catch(e) { setError(e.message); }
    finally { setSub(false); }
  };

  // ── Load existing for edit ────────────────────────────────────────────────────
  const loadExistingForEdit = () => {
    setForm({
      invoice_no: existingBill.invoice_no || "", invoice_date: existingBill.invoice_date || "",
      vendor: existingBill.vendor || "", invoice_total: existingBill.invoice_total || "", payment_type: existingBill.payment_type || "Credit",
      items: mapItems(existingBill.items), _editing_id: existingBill.invoice_id,
    });
    setStep("review");
  };

  // ── Update existing ───────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    setSub(true); setError("");
    try {
      const grandTotal = form.items.filter(i => !i.scratched_out).reduce((s,i) => s + (parseFloat(i.total)||0), 0);
      const resp = await fetch("/api/submit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, invoice_id: form._editing_id, grand_total: grandTotal, submitted_by: user?.name || "Unknown" }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);
      setResult({ ...form, grand_total: grandTotal, invoice_id: form._editing_id, updated: true });
      setHistory(h => [{ ...form, grand_total: grandTotal, submitted_at: new Date().toISOString(), submitted_by: user?.name }, ...h.slice(0,4)]);
      setStep("success");
    } catch(e) { setError(e.message); }
    finally { setSub(false); }
  };

  const updateItem = (id, field, value) => {
    setForm(f => ({ ...f, items: f.items.map(item => {
      if (item.id !== id) return item;
      const u = { ...item, [field]: value };
      if (["qty","rate","tax_pct"].includes(field)) u.total = calcTotal(field==="qty"?value:u.qty, field==="rate"?value:u.rate, field==="tax_pct"?value:u.tax_pct);
      return u;
    })}));
  };

  const resetAll = () => {
    setImage(null);
    setForm({ invoice_no:"", invoice_date:"", vendor:"", items:[], invoice_total:"", payment_type:"Credit" });
    setError(""); setExist(null); setStep("capture");
  };

  const handleLogout = () => {
    localStorage.removeItem("billcapture_user");
    setUser(null);
  };

  // ── Guard: show nothing until localStorage checked ────────────────────────────
  if (!userLoaded) return null;

  // ── Show login if no user ─────────────────────────────────────────────────────
  if (!user) return <LoginScreen onLogin={setUser} />;

  const stepNum    = { capture:0, processing:1, review:2, duplicate:2, success:3 };
  const cur        = stepNum[step] || 0;
  const isEditing  = !!form._editing_id;
  const activeItems= form.items.filter(i => !i.scratched_out);
  const grandTotal = activeItems.reduce((s,i) => s + (parseFloat(i.total)||0), 0);
  const existingTotal = existingBill
    ? (existingBill.items||[]).filter(i=>!i.scratched_out).reduce((s,i)=>s+(parseFloat(i.total)||0),0)
    : 0;

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input:focus,select:focus{border-color:#E8A87C!important;box-shadow:0 0 0 3px rgba(232,168,124,.15);}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .capture-zone:hover{border-color:#E8A87C!important;background:#FFFAF5!important;}
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.logoMark}>🧾</div>
        <div style={{ flex:1 }}>
          <div style={S.headerTitle}>BillCapture</div>
          <div style={S.headerSub}>
            {step==="capture"    && `Hi ${user.name} · ${user.role}`}
            {step==="processing" && "Extracting bill details…"}
            {step==="review"     && (isEditing ? `Editing — ${form.vendor||"Bill"}` : (form.vendor||"Review extracted data"))}
            {step==="duplicate"  && "Bill already exists"}
            {step==="success"    && (lastResult?.updated ? "Bill updated!" : "Bill submitted!")}
          </div>
        </div>
        {/* User avatar + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#E8A87C,#E07B54)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{ background:"none", border:"none", color:"#8888AA", cursor:"pointer", fontSize:11, padding:0 }}>
            Switch
          </button>
        </div>
      </div>

      {/* Step bar */}
      <div style={S.stepBar}>
        {[0,1,2,3].map(i => <div key={i} style={S.stepDot(i===cur, i<cur)} />)}
      </div>

      <div style={S.body}>

        {/* ── CAPTURE ── */}
        {step==="capture" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {error && <div style={S.noteBox("err")}>⚠️ {error}</div>}
            {!image ? (
              <>
                <div className="capture-zone" style={S.captureZone} onClick={() => cameraRef.current?.click()}>
                  <div style={{ fontSize:52, marginBottom:12 }}>📷</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#1A1A2E", marginBottom:6 }}>Take a Photo</div>
                  <div style={{ fontSize:13, color:"#888", lineHeight:1.5 }}>Point your camera at the bill.<br/>Works best in good lighting.</div>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFile(e.target.files[0])} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, color:"#AAA", fontSize:12, fontWeight:600, letterSpacing:".08em", marginBottom:16 }}>
                  <div style={{ flex:1, height:1, background:"#E0D8CC" }} /><span>OR</span><div style={{ flex:1, height:1, background:"#E0D8CC" }} />
                </div>
                <button style={{ width:"100%", padding:"14px", background:"#1A1A2E", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }} onClick={() => fileRef.current?.click()}>
                  📁 Upload Image or PDF
                  <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={e => handleFile(e.target.files[0])} />
                </button>

                {history.length > 0 && (
                  <div style={{ marginTop:28 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#AAA", letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Recent Submissions</div>
                    {history.map((s,i) => (
                      <div key={i} style={{ background:"#fff", borderRadius:12, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#1A1A2E" }}>{s.invoice_no||"—"}</div>
                          <div style={{ fontSize:11, color:"#888" }}>
                            {s.vendor} · {new Date(s.submitted_at).toLocaleDateString("en-IN")}
                            {s.submitted_by && <span style={{ color:"#E07B54" }}> · {s.submitted_by}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#E07B54" }}>{fmt(s.grand_total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ position:"relative", borderRadius:16, overflow:"hidden", marginBottom:16, background:"#000", maxHeight:320 }}>
                  <img src={image.preview} alt="Bill" style={{ width:"100%", maxHeight:320, objectFit:"contain", display:"block" }} />
                  <button style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.6)", color:"#fff", border:"none", borderRadius:8, padding:"4px 10px", fontSize:12, cursor:"pointer" }} onClick={() => setImage(null)}>✕ Remove</button>
                </div>
                <div style={{ fontSize:13, color:"#888", textAlign:"center", marginBottom:8 }}>{image.file.name} · {(image.file.size/1024).toFixed(0)} KB</div>
              </>
            )}
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step==="processing" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:16 }}>
            <div style={S.spinner} />
            <div style={{ fontSize:17, fontWeight:700, color:"#1A1A2E" }}>{processingMsg}</div>
            <div style={{ fontSize:13, color:"#888", textAlign:"center", maxWidth:240, lineHeight:1.6 }}>Gemini AI is reading the bill and extracting all fields automatically.</div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step==="review" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {error && <div style={S.noteBox("err")}>⚠️ {error}</div>}
            {isEditing && <div style={S.noteBox("warn")}>✏️ <strong>Editing existing bill</strong> — make your changes and tap Update Bill.</div>}

            {/* Submitted by badge */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"8px 12px", background:"#fff", borderRadius:10, boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#E8A87C,#E07B54)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#1A1A2E" }}>{user.name}</div>
                <div style={{ fontSize:10, color:"#AAA" }}>{user.role} · submitting now</div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardLabel}>Invoice Details</div>
              <div style={{ marginBottom:10 }}>
                <div style={S.metaKey}>Vendor / Supplier</div>
                <input style={{ ...S.metaInput, width:"100%" }} value={form.vendor} onChange={e => setForm(f => ({...f, vendor:e.target.value}))} placeholder="Vendor name" />
              </div>
              <div style={S.metaGrid}>
                <div><div style={S.metaKey}>Invoice No.</div><input style={S.metaInput} value={form.invoice_no} onChange={e => setForm(f => ({...f, invoice_no:e.target.value}))} placeholder="INV-001" /></div>
                <div><div style={S.metaKey}>Invoice Date</div><input style={S.metaInput} value={form.invoice_date} onChange={e => setForm(f => ({...f, invoice_date:e.target.value}))} placeholder="18-Oct-25" /></div>
              </div>
              <div style={{ marginTop:10 }}>
                <div style={S.metaKey}>Payment Type</div>
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  {["Credit","Cash"].map(type => (
                    <button key={type} onClick={() => setForm(f => ({...f, payment_type:type}))}
                      style={{ flex:1, padding:"9px", borderRadius:8, border:`1.5px solid ${form.payment_type===type?"#E07B54":"#E8E0D4"}`, background:form.payment_type===type?"#FFF5EE":"#F8F5F0", color:form.payment_type===type?"#E07B54":"#888", fontWeight:form.payment_type===type?700:400, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                      {type === "Credit" ? "💳 Credit" : "💵 Cash"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.items.some(i => i.scratched_out) && <div style={S.noteBox("warn")}>⚠️ {form.items.filter(i=>i.scratched_out).length} item(s) crossed out — excluded from total.</div>}
            {form.items.some(i => i.modified)      && <div style={S.noteBox("ok")}>✏️ {form.items.filter(i=>i.modified).length} item(s) with handwritten modifications.</div>}

            <div style={{ ...S.cardLabel, marginBottom:10 }}>Line Items ({activeItems.length} active)</div>

            {form.items.map(item => (
              <div key={item.id} style={S.itemCard(item.scratched_out, item.modified)}>
                {item.scratched_out && <div style={S.itemBadge("scratched")}>✂ Crossed Out</div>}
                {item.modified && !item.scratched_out && <div style={S.itemBadge("modified")}>✏ {item.modification_note||"Modified"}</div>}
                <button style={S.removeBtn} onClick={() => setForm(f => ({...f, items:f.items.filter(i=>i.id!==item.id)}))}>×</button>
                <input style={{ ...S.itemNameIn, textDecoration:item.scratched_out?"line-through":"none", opacity:item.scratched_out?.5:1 }} value={item.item_name} onChange={e => updateItem(item.id,"item_name",e.target.value)} placeholder="Item description" />
                {item.manufacturer && <div style={{ fontSize:11, color:"#AAA", marginBottom:8 }}>Brand: {item.manufacturer}</div>}
                <div style={S.fieldRow}>
                  <div><div style={S.fieldKey}>Qty</div><input style={S.fieldInput} type="number" value={item.qty} onChange={e => updateItem(item.id,"qty",e.target.value)} /></div>
                  <div><div style={S.fieldKey}>Unit</div><input style={S.fieldInput} value={item.unit} onChange={e => updateItem(item.id,"unit",e.target.value)} /></div>
                  <div><div style={S.fieldKey}>Rate ₹</div><input style={S.fieldInput} type="number" value={item.rate} onChange={e => updateItem(item.id,"rate",e.target.value)} /></div>
                  <div><div style={S.fieldKey}>GST %</div>
                    <select style={S.fieldInput} value={item.tax_pct} onChange={e => updateItem(item.id,"tax_pct",e.target.value)}>
                      <option value="0">0%</option><option value="0.05">5%</option><option value="0.12">12%</option><option value="0.18">18%</option><option value="0.28">28%</option><option value="0.40">40%</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                  <button onClick={() => setForm(f => ({...f, items:f.items.map(i => i.id===item.id?{...i,scratched_out:!i.scratched_out}:i)}))} style={{ background:"none", border:"none", color:"#AAA", fontSize:11, cursor:"pointer", padding:0 }}>
                    {item.scratched_out ? "↩ Restore" : "✂ Mark as crossed out"}
                  </button>
                  <div style={{ fontSize:14, fontWeight:700, color:item.scratched_out?"#CCC":"#1A1A2E" }}>{fmt(item.total)}</div>
                </div>
              </div>
            ))}

            <button style={S.addItemBtn} onClick={() => setForm(f => ({...f, items:[...f.items, newItem()]}))}>+ Add Line Item</button>

            <div style={{ ...S.card, marginTop:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#888" }}>Invoice total (printed)</span>
                <span style={{ fontSize:13, color:"#888" }}>{fmt(form.invoice_total)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:15, fontWeight:700, color:"#1A1A2E" }}>Our calculated total</span>
                <span style={{ fontSize:16, fontWeight:800, color:"#E07B54" }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── DUPLICATE ── */}
        {step==="duplicate" && existingBill && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={S.dupBanner}>
              <div style={S.dupTitle}>🚩 This bill has already been submitted</div>
              <div style={S.dupMeta}>
                <strong>Invoice {existingBill.invoice_no}</strong> from <strong>{existingBill.vendor}</strong><br/>
                submitted on <strong>{new Date(existingBill.submitted_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</strong>
                {existingBill.submitted_by && existingBill.submitted_by !== "app"
                  ? <span style={{ color:"#C2410C" }}> by <strong>{existingBill.submitted_by}</strong></span>
                  : ""}
              </div>
              <div style={S.dupSection}>Previously saved items</div>
              {(existingBill.items||[]).filter(i => !i.scratched_out).map((item,i) => (
                <div key={i} style={S.prevItemRow}>
                  <div style={S.prevItemName}>{item.item_name}</div>
                  <div style={{ fontSize:11, color:"#92400E", marginRight:8 }}>{item.qty} {item.unit}</div>
                  <div style={S.prevItemAmt}>{fmt(item.total)}</div>
                </div>
              ))}
              <div style={S.prevTotal}><span>Total</span><span>{fmt(existingTotal)}</span></div>
              <div style={S.dupActions}>
                <button style={S.dupActionBtn(true)} onClick={loadExistingForEdit}>✏️ Edit this bill</button>
                <button style={S.dupActionBtn(false)} onClick={resetAll}>Discard &amp; scan new</button>
              </div>
            </div>

            <div style={{ ...S.card, border:"1.5px solid #E8E0D4" }}>
              <div style={S.cardLabel}>Your new scan (not saved yet)</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Invoice {form.invoice_no} · {form.vendor}</div>
              {form.items.filter(i => !i.scratched_out).map((item,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F5F0E8", fontSize:12 }}>
                  <span style={{ color:"#555", flex:1, marginRight:8 }}>{item.item_name}</span>
                  <span style={{ color:"#888", marginRight:8 }}>{item.qty} {item.unit}</span>
                  <span style={{ fontWeight:600, color:"#1A1A2E" }}>{fmt(item.total)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, fontSize:13, fontWeight:700, color:"#1A1A2E", marginTop:4 }}>
                <span>New scan total</span><span style={{ color:"#E07B54" }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step==="success" && lastResult && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:60, gap:16, animation:"fadeUp .4s ease" }}>
            <div style={lastResult.updated ? S.updatedCircle : S.successCircle}>
              {lastResult.updated ? "✎" : "✓"}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#1A1A2E", textAlign:"center" }}>
              {lastResult.updated ? "Bill Updated!" : "Bill Submitted!"}
            </div>
            <div style={{ fontSize:14, color:"#888", textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
              Saved to database by <strong style={{ color:"#E07B54" }}>{user.name}</strong>
            </div>
            <div style={S.card}>
              <div style={{ ...S.cardLabel, marginBottom:12 }}>Summary</div>
              {[
                ["Invoice No.", lastResult.invoice_no||"—"],
                ["Date",        lastResult.invoice_date||"—"],
                ["Vendor",      lastResult.vendor||"—"],
                ["Submitted by",user.name],
                ["Role",        user.role],
                ["Payment Type", lastResult.payment_type||"Credit"],
                ["Line Items",  `${lastResult.items?.filter(i=>!i.scratched_out).length||0} items`],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F0EBE3", fontSize:13, color:"#555" }}>
                  <span>{k}</span><strong>{v}</strong>
                </div>
              ))}
              {lastResult.updated && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F0EBE3", fontSize:13, color:"#555" }}>
                  <span>Action</span><strong style={{ color:"#3B82F6" }}>Updated existing record</strong>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, fontSize:15, fontWeight:700, color:"#1A1A2E" }}>
                <span>Total (incl. GST)</span>
                <span style={{ color:"#E07B54" }}>{fmt(lastResult.grand_total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={S.bottomBar}>
        {step==="capture" && !image && <button style={{ ...S.primaryBtn(true), flex:1 }} disabled>Take or upload a photo first</button>}
        {step==="capture" &&  image && (<><button style={S.secondaryBtn} onClick={() => setImage(null)}>Retake</button><button style={S.primaryBtn(false)} onClick={extractBill}>Extract Bill →</button></>)}
        {step==="review" && !isEditing && (<><button style={S.secondaryBtn} onClick={resetAll}>← Back</button><button style={S.primaryBtn(submitting)} onClick={handleSubmit} disabled={submitting}>{submitting?"Saving…":"Submit Bill ✓"}</button></>)}
        {step==="review" &&  isEditing && (<><button style={S.secondaryBtn} onClick={() => { setForm(f => ({...f, _editing_id:undefined})); setStep("duplicate"); }}>← Back</button><button style={S.warnBtn} onClick={handleUpdate} disabled={submitting}>{submitting?"Updating…":"Update Bill ✎"}</button></>)}
        {step==="duplicate" && (<><button style={S.secondaryBtn} onClick={resetAll}>Discard</button><button style={S.warnBtn} onClick={loadExistingForEdit}>✏️ Edit Existing Bill</button></>)}
        {step==="success" && <button style={{ ...S.primaryBtn(false), flex:1 }} onClick={resetAll}>+ Capture Another Bill</button>}
      </div>
    </div>
  );
}

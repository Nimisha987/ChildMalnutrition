import { useState, useRef, useCallback, useEffect } from "react";

// ─── Tokens ───────────────────────────────────────────────
const navy    = "#0B1F3A";
const teal    = "#0C7C8C";
const tealBg  = "#E0F7FA";
const green   = "#1B7F4A";
const greenBg = "#E8F5EE";
const red     = "#C92A2A";
const redBg   = "#FFF0F0";
const border  = "#E5E7EB";
const bg      = "#F3F6FA";
const muted   = "#6B7280";
const slate   = "#374151";

// ─── Helpers ──────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${border}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(11,31,58,0.07)", ...style
    }}>{children}</div>
  );
}

function CardHead({ icon, iconBg, title, subtitle }) {
  return (
    <div style={{
      padding: "14px 20px", borderBottom: `1px solid ${border}`,
      display: "flex", alignItems: "center", gap: 10
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: navy }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: slate }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: muted }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputSt = {
  fontSize: 13, padding: "9px 12px",
  border: `1px solid ${border}`, borderRadius: 8,
  background: "#fff", color: navy, outline: "none",
  width: "100%", fontFamily: "inherit"
};

function Input(props) {
  return <input style={inputSt} {...props} />;
}

function Select({ children, ...props }) {
  return (
    <select style={{ ...inputSt, cursor: "pointer" }} {...props}>
      {children}
    </select>
  );
}

function Radio({ field, value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(o => {
        const active = value == o.value;
        return (
          <div key={o.value} onClick={() => onChange(field, o.value)} style={{
            flex: 1, padding: "8px 6px", cursor: "pointer",
            border: `1.5px solid ${active ? teal : border}`,
            borderRadius: 8, textAlign: "center", fontSize: 12,
            fontWeight: active ? 700 : 400,
            background: active ? tealBg : "#fff",
            color: active ? teal : muted,
            transition: "all 0.15s", userSelect: "none"
          }}>{o.label}</div>
        );
      })}
    </div>
  );
}

function Gauge({ value, color }) {
  return (
    <div style={{ height: 5, background: border, borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`, background: color,
        borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)"
      }} />
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────
function ResultPanel({ result, loading, error }) {
  if (loading) return (
    <Card style={{ minHeight: 280 }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 280, gap: 16
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: `3px solid ${border}`,
          borderTopColor: teal, animation: "spin 0.9s linear infinite"
        }} />
        <div style={{ fontSize: 13, color: muted }}>Analyzing...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </Card>
  );

  if (error) return (
    <Card style={{ minHeight: 200 }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 200, gap: 12, padding: 24, textAlign: "center"
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 13, color: red }}>{error}</div>
      </div>
    </Card>
  );

  if (!result) return (
    <Card style={{ minHeight: 280 }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 280, gap: 12, textAlign: "center", padding: 32
      }}>
        <div style={{ fontSize: 48, opacity: 0.2 }}>🩺</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: slate }}>No prediction yet</div>
        <div style={{ fontSize: 12, color: muted, maxWidth: 240, lineHeight: 1.7 }}>
          Use Quick Scan or Detailed Form to get a malnutrition risk assessment
        </div>
      </div>
    </Card>
  );

  const { results, any_risk } = result;
  const targets = [
    { key: "stunted",     label: "Stunted",     icon: "📏", desc: "Height-for-age" },
    { key: "wasted",      label: "Wasted",      icon: "⚖️",  desc: "Weight-for-height" },
    { key: "underweight", label: "Underweight", icon: "🩺", desc: "Weight-for-age" },
  ];

  const atRisk = targets.filter(t => results[t.key].at_risk).map(t => t.label);
  let interp = "";
  if (!any_risk) {
    interp = "All three indicators are within normal range. Continue regular growth monitoring.";
  } else if (results.stunted.at_risk && !results.wasted.at_risk) {
    interp = "Child shows risk of stunting (chronic malnutrition). Dietary counselling recommended.";
  } else if (results.wasted.at_risk) {
    interp = "Wasting detected — acute malnutrition requiring immediate medical attention.";
  } else {
    interp = `Risk detected for: ${atRisk.join(", ")}. Comprehensive nutritional assessment recommended.`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Banner */}
      <div style={{
        background: any_risk ? redBg : greenBg,
        border: `1.5px solid ${any_risk ? "#FCA5A5" : "#86EFAC"}`,
        borderRadius: 14, padding: "18px 22px",
        display: "flex", alignItems: "center", gap: 16
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: any_risk ? "#FFE4E4" : "#DCFCE7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, flexShrink: 0
        }}>
          {any_risk ? "⚠️" : "✅"}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: any_risk ? red : green, letterSpacing: "-0.3px" }}>
            {any_risk ? "Malnutrition Risk Detected" : "No Malnutrition Risk"}
          </div>
          <div style={{ fontSize: 12, color: slate, marginTop: 4, lineHeight: 1.6 }}>{interp}</div>
        </div>
      </div>

      {/* Three cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {targets.map(t => {
          const r = results[t.key];
          const clr = r.at_risk ? red : green;
          return (
            <Card key={t.key} style={{ border: `1.5px solid ${r.at_risk ? "#FCA5A5" : border}` }}>
              <div style={{ padding: "16px 14px" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: navy, marginBottom: 1 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: muted, marginBottom: 12 }}>{t.desc}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: clr, letterSpacing: "-0.5px", marginBottom: 2 }}>
                  {r.probability}%
                </div>
                <div style={{ fontSize: 10, color: muted, marginBottom: 8 }}>probability</div>
                <Gauge value={r.probability} color={clr} />
                <div style={{
                  display: "inline-block", marginTop: 10,
                  padding: "3px 10px", borderRadius: 20,
                  background: r.at_risk ? red : green,
                  color: "#fff", fontSize: 10, fontWeight: 700
                }}>
                  {r.at_risk ? "⚠ At Risk" : "✓ Normal"}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Privacy note */}
      <div style={{
        background: tealBg, border: `1px solid #99E9F2`,
        borderRadius: 8, padding: "9px 14px",
        fontSize: 11, color: teal, fontWeight: 600
      }}>
        🔐 AES-256 encrypted · SHA-256 anonymised · DP ε=1.0 · No data stored
      </div>
    </div>
  );
}

// ─── QUICK SCAN TAB ───────────────────────────────────────
function QuickScan({ onResult, setLoading, setError }) {
  const [image,   setImage]   = useState(null);
  const [camOn,   setCamOn]   = useState(false);
  const [camTab,  setCamTab]  = useState("upload");
  const [camErr,  setCamErr]  = useState(null);
  const [age,     setAge]     = useState(18);
  const [gender,  setGender]  = useState(1);
  const fileRef  = useRef();
  const videoRef = useRef();
  const streamRef = useRef();

  const startCam = useCallback(async () => {
    setCamErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamOn(true);
    } catch { setCamErr("Camera access denied."); }
  }, []);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => {
    if (camTab === "camera") startCam();
    else stopCam();
    return () => stopCam();
  }, [camTab]);

  const capture = () => {
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => {
      setImage({ file: new File([blob], "capture.jpg", { type: "image/jpeg" }), url: URL.createObjectURL(blob) });
      setCamTab("upload");
    }, "image/jpeg", 0.92);
  };

  const onFile = e => {
    const f = e.target.files?.[0];
    if (f) setImage({ file: f, url: URL.createObjectURL(f) });
  };

  const onDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) setImage({ file: f, url: URL.createObjectURL(f) });
  };

  const handleScan = async () => {
    if (!image) { setError("Please upload or capture a child photo first."); return; }
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("image", image.file);
      fd.append("age",    age);
      fd.append("gender", gender);
      // const res  = await fetch("/predict-image", { method: "POST", body: fd });
      const res = await fetch("http://localhost:5000/predict-image", {
  method: "POST",
  body: fd,
});
      if (!res.ok) throw new Error();
      onResult(await res.json());
    } catch {
      setError("Server error. Make sure Flask is running on port 5000.");
    } finally { setLoading(false); }
  };

  const tabBtn = (t, label) => (
    <button onClick={() => setCamTab(t)} style={{
      flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
      borderRadius: 8, fontSize: 12, fontWeight: camTab === t ? 700 : 400,
      background: camTab === t ? teal : "transparent",
      color: camTab === t ? "#fff" : muted, transition: "all 0.15s"
    }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Info banner */}
      <div style={{
        background: "#FFFBEB", border: `1px solid #FCD34D`,
        borderRadius: 10, padding: "10px 14px",
        fontSize: 12, color: "#92400E", lineHeight: 1.6
      }}>
        💡 <strong>Quick Scan:</strong> Upload or capture a child photo.
        Only age and gender are required — model uses visual features
        for malnutrition detection.
      </div>

      {/* Image panel */}
      <Card>
        <CardHead icon="📷" iconBg="#FFF3E0" title="Child Photo" subtitle="Required for Quick Scan" />

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, padding: "10px 14px",
          background: "#F9FAFB", borderBottom: `1px solid ${border}`
        }}>
          {tabBtn("upload", "⬆ Upload")}
          {tabBtn("camera", "📹 Camera")}
        </div>

        <div style={{ padding: 14 }}>
          {camTab === "upload" && (
            <>
              {image ? (
                <div style={{ position: "relative" }}>
                  <img src={image.url} alt="Child"
                    style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover" }} />
                  <button onClick={() => setImage(null)} style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(0,0,0,0.6)", color: "#fff",
                    border: "none", borderRadius: 6, padding: "4px 10px",
                    cursor: "pointer", fontSize: 11
                  }}>Remove</button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current.click()}
                  onDrop={onDrop} onDragOver={e => e.preventDefault()}
                  style={{
                    border: `2px dashed ${border}`, borderRadius: 10,
                    padding: "32px 20px", textAlign: "center", cursor: "pointer", background: "#FAFBFC"
                  }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: slate }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>JPG, PNG, JPEG</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
            </>
          )}

          {camTab === "camera" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {camErr ? (
                <div style={{ background: redBg, border: `1px solid #FCA5A5`, borderRadius: 8, padding: 12, fontSize: 12, color: red }}>{camErr}</div>
              ) : (
                <div style={{ position: "relative" }}>
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover", background: "#111", display: camOn ? "block" : "none" }} />
                  {!camOn && (
                    <div style={{ height: 160, background: "#1A1A2E", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                      Starting camera...
                    </div>
                  )}
                  {camOn && (
                    <button onClick={capture} style={{
                      position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                      background: "#fff", border: `2px solid ${teal}`, borderRadius: "50%",
                      width: 48, height: 48, cursor: "pointer", fontSize: 20,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>📸</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Minimal inputs */}
      <Card>
        <CardHead icon="🧒" iconBg="#E8F5E9" title="Basic Details" subtitle="Only 2 fields required" />
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Age (months)">
            <Input type="number" min="0" max="60" value={age}
              onChange={e => setAge(+e.target.value)} />
          </Field>
          <Field label="Gender">
            <Radio field="gender" value={gender}
              onChange={(_, v) => setGender(v)}
              options={[{ label: "Male", value: 1 }, { label: "Female", value: 2 }]} />
          </Field>
        </div>
      </Card>

      {/* Scan button */}
      <button onClick={handleScan} style={{
        padding: "13px", background: image ? navy : "#9CA3AF",
        color: "#fff", border: "none", borderRadius: 12,
        fontSize: 14, fontWeight: 700,
        cursor: image ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        {image ? "🔍 Scan for Malnutrition Risk" : "📷 Upload Photo First"}
      </button>

    </div>
  );
}

// ─── DETAILED FORM TAB ────────────────────────────────────
function DetailedForm({ onResult, setLoading, setError }) {
  const [form, setForm] = useState({
    child_age_months: 18, gender: 1,
    weight_kg: 9.5,       height_cm: 75,
    diarrhea: 0,          fever: 0,
    mother_age: 26,       mother_education: 1,
    mother_bmi: 21.5,     antenatal_visits: 4,
    wealth_index: 2,      urban_rural: 2,
    household_members: 5, birth_order: 2,
  });

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const bmi_raw = form.weight_kg / ((form.height_cm / 100) ** 2);
      const payload = {
        child_age_months:           form.child_age_months,
        gender:                     form.gender,
        weight_kg:                  form.weight_kg * 10,
        height_cm:                  form.height_cm * 10,
        child_bmi_raw:              bmi_raw,
        birth_weight:               3,
        breastfeeding:              24,
        diarrhea:                   form.diarrhea,
        fever:                      form.fever,
        cough:                      0,
        mother_age:                 form.mother_age,
        mother_education:           form.mother_education,
        mother_bmi:                 form.mother_bmi * 100,
        antenatal_visits:           form.antenatal_visits,
        wealth_index:               form.wealth_index,
        urban_rural:                form.urban_rural,
        household_members:          form.household_members,
        birth_order:                form.birth_order,
        children_ever_born:         form.birth_order,
        water_source:               12,
        time_to_water:              0,
        sanitation_toilet_facility: 44,
        handwashing_facility:       1,
      };
      const res = await fetch("http://localhost:5000/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

      // const res = await fetch("/predict", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      if (!res.ok) throw new Error();
      onResult(await res.json());
    } catch {
      setError("Server error. Make sure Flask is running on port 5000.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Info banner */}
      <div style={{
        background: tealBg, border: `1px solid #99E9F2`,
        borderRadius: 10, padding: "10px 14px",
        fontSize: 12, color: teal, lineHeight: 1.6
      }}>
        📋 <strong>Detailed Form:</strong> Fill in child, mother and household
        details for a comprehensive risk assessment. Photo is not required.
      </div>

      {/* Child */}
      <Card>
        <CardHead icon="🧒" iconBg="#E8F5E9" title="Child Details" />
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Age (months)">
            <Input type="number" min="0" max="60" value={form.child_age_months}
              onChange={e => set("child_age_months", +e.target.value)} />
          </Field>
          <Field label="Gender">
            <Radio field="gender" value={form.gender} onChange={set}
              options={[{ label: "Male", value: 1 }, { label: "Female", value: 2 }]} />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" step="0.1" value={form.weight_kg}
              onChange={e => set("weight_kg", +e.target.value)} />
          </Field>
          <Field label="Height (cm)">
            <Input type="number" step="0.1" value={form.height_cm}
              onChange={e => set("height_cm", +e.target.value)} />
          </Field>
          <Field label="Diarrhea (2 weeks)?">
            <Radio field="diarrhea" value={form.diarrhea} onChange={set}
              options={[{ label: "Yes", value: 1 }, { label: "No", value: 0 }]} />
          </Field>
          <Field label="Fever?">
            <Radio field="fever" value={form.fever} onChange={set}
              options={[{ label: "Yes", value: 1 }, { label: "No", value: 0 }]} />
          </Field>
        </div>
      </Card>

      {/* Mother */}
      <Card>
        <CardHead icon="👩" iconBg="#FFF3E0" title="Mother's Details" />
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Age (years)">
            <Input type="number" min="15" max="49" value={form.mother_age}
              onChange={e => set("mother_age", +e.target.value)} />
          </Field>
          <Field label="Education">
            <Select value={form.mother_education}
              onChange={e => set("mother_education", +e.target.value)}>
              <option value={0}>No education</option>
              <option value={1}>Primary</option>
              <option value={2}>Secondary</option>
              <option value={3}>Higher</option>
            </Select>
          </Field>
          <Field label="BMI">
            <Input type="number" step="0.1" value={form.mother_bmi}
              onChange={e => set("mother_bmi", +e.target.value)} />
          </Field>
          <Field label="Antenatal visits">
            <Input type="number" min="0" max="20" value={form.antenatal_visits}
              onChange={e => set("antenatal_visits", +e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Household */}
      <Card>
        <CardHead icon="🏠" iconBg="#EDE9FE" title="Household Details" />
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Wealth level">
            <Select value={form.wealth_index}
              onChange={e => set("wealth_index", +e.target.value)}>
              <option value={1}>Poorest</option>
              <option value={2}>Poor</option>
              <option value={3}>Middle</option>
              <option value={4}>Rich</option>
              <option value={5}>Richest</option>
            </Select>
          </Field>
          <Field label="Residence">
            <Radio field="urban_rural" value={form.urban_rural} onChange={set}
              options={[{ label: "Urban", value: 1 }, { label: "Rural", value: 2 }]} />
          </Field>
          <Field label="Household members">
            <Input type="number" min="1" max="20" value={form.household_members}
              onChange={e => set("household_members", +e.target.value)} />
          </Field>
          <Field label="Birth order">
            <Input type="number" min="1" max="15" value={form.birth_order}
              onChange={e => set("birth_order", +e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Submit */}
      <button onClick={handleSubmit} style={{
        padding: "13px", background: navy, color: "#fff",
        border: "none", borderRadius: 12, fontSize: 14,
        fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        🔍 Predict Malnutrition Risk
      </button>

    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [tab,     setTab]     = useState("quick");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleResult = (data) => { setResult(data); setError(null); };

  const tabStyle = (t) => ({
    flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
    borderRadius: "10px 10px 0 0", fontSize: 13,
    fontWeight: tab === t ? 700 : 500,
    background: tab === t ? "#fff" : "transparent",
    color: tab === t ? navy : muted,
    borderBottom: tab === t ? `2px solid ${teal}` : "none",
    transition: "all 0.15s"
  });

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Inter', system-ui, sans-serif", color: navy }}>

      {/* HEADER */}
      <header style={{
        background: navy, color: "#fff",
        padding: "0 32px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 16px rgba(11,31,58,0.22)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: teal,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>👶</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" }}>MalnutriScan</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>Child Malnutrition Risk Predictor</div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 600
        }}>🔐 Privacy-Protected · ε=1.0</div>
      </header>

      {/* MAIN LAYOUT */}
      <div style={{
        display: "grid", gridTemplateColumns: "420px 1fr",
        gap: 24, padding: "24px 32px",
        maxWidth: 1280, margin: "0 auto", alignItems: "start"
      }}>

        {/* LEFT — Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Tab headers */}
          <div style={{
            display: "flex", background: "#E5E7EB",
            borderRadius: "12px 12px 0 0", padding: "4px 4px 0",
            gap: 2
          }}>
            <button onClick={() => { setTab("quick"); setResult(null); setError(null); }}
              style={tabStyle("quick")}>
              📷 Quick Scan
            </button>
            <button onClick={() => { setTab("form"); setResult(null); setError(null); }}
              style={tabStyle("form")}>
              📋 Detailed Form
            </button>
          </div>

          {/* Tab content */}
          <div style={{
            background: "#F3F6FA", borderRadius: "0 0 14px 14px",
            padding: 16, border: `1px solid ${border}`, borderTop: "none"
          }}>
            {tab === "quick"
              ? <QuickScan onResult={handleResult} setLoading={setLoading} setError={setError} />
              : <DetailedForm onResult={handleResult} setLoading={setLoading} setError={setError} />
            }
          </div>

          {/* Mode indicator */}
          <div style={{
            marginTop: 10, padding: "8px 14px",
            background: "#fff", border: `1px solid ${border}`,
            borderRadius: 8, fontSize: 11, color: muted,
            display: "flex", alignItems: "center", gap: 6
          }}>
            {tab === "quick"
              ? "📷 Quick Scan mode — image required, minimal inputs"
              : "📋 Detailed mode — image optional, form required"}
          </div>

        </div>

        {/* RIGHT — Result */}
        <div>
          <ResultPanel result={result} loading={loading} error={error} />
        </div>

      </div>
    </div>
  );
}
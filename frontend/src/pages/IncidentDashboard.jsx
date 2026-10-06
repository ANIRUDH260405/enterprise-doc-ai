import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { ArrowLeft, FileText, History, Brain, GitBranch, HelpCircle, Loader2 } from "lucide-react";

const sectionVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.35 } }),
};

export default function IncidentDashboard() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/incidents/${incidentId}/dashboard`).then((res) => setData(res.data));
  }, [incidentId]);

  if (!data) {
    return (
      <Layout>
        <div className="empty-state">
          <Loader2 size={40} className="spin" color="#4f46e5" />
          <p style={{ marginTop: 12 }}>Running full incident analysis — evidence retrieval, historical matching, scenario simulation, and explanation generation. This may take up to a minute...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button className="btn-secondary hover-lift" onClick={() => navigate("/incidents")} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Incidents
      </button>

      <motion.div className="page-header" custom={0} initial="hidden" animate="show" variants={sectionVariant}>
        <div>
          <h1>{(data.incident.type || "incident").replace(/_/g, " ")}</h1>
          <p>{data.incident.location} · {data.incident.duration_minutes} min · {data.incident.affected_trains} trains affected</p>
        </div>
      </motion.div>

      <motion.div className="card hover-lift" style={{ padding: 20, marginBottom: 24 }} custom={1} initial="hidden" animate="show" variants={sectionVariant}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 600 }}>
          <Brain size={18} color="#4f46e5" /> AI Analysis
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>{data.analysis}</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <motion.div className="card hover-lift" style={{ padding: 20 }} custom={2} initial="hidden" animate="show" variants={sectionVariant}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 600 }}>
            <FileText size={18} color="#4f46e5" /> Relevant Evidence
          </div>
          {data.relevant_evidence.length === 0 && <p style={{ fontSize: 13, color: "#64748b" }}>No matching documents found.</p>}
          {data.relevant_evidence.map((e, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < data.relevant_evidence.length - 1 ? "1px solid #e2e8f0" : "none" }}>
              <div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600, marginBottom: 4 }}>Relevance: {(e.relevance * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{e.content.slice(0, 200)}...</div>
            </div>
          ))}
        </motion.div>

        <motion.div className="card hover-lift" style={{ padding: 20 }} custom={3} initial="hidden" animate="show" variants={sectionVariant}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 600 }}>
            <History size={18} color="#4f46e5" /> Similar Past Incidents
          </div>
          {data.similar_incidents.length === 0 && <p style={{ fontSize: 13, color: "#64748b" }}>No similar historical incidents found.</p>}
          {data.similar_incidents.map((s, i) => (
            <div key={i} style={{ marginBottom: 10, fontSize: 13 }}>
              <strong>{(s.incident_type || "").replace(/_/g, " ")}</strong> at {s.location || "unknown"}, {s.duration_minutes} min
              <span style={{ color: "#4f46e5", fontWeight: 600 }}> — {(s.similarity_score * 100).toFixed(0)}% match</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }} custom={4} initial="hidden" animate="show" variants={sectionVariant}>
        <GitBranch size={18} color="#4f46e5" /> Scenario Simulations
      </motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {data.scenarios.map((s, i) => (
          <motion.div className="card hover-lift" key={i} style={{ padding: 16 }} custom={5 + i} initial="hidden" animate="show" variants={sectionVariant}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{s.duration_minutes} minutes</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{s.description}</p>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Likely Consequences:</div>
            <ul style={{ fontSize: 12, paddingLeft: 18, lineHeight: 1.6, color: "#475569" }}>
              {s.consequences.consequence_chain.map((c, j) => <li key={j}>{c}</li>)}
            </ul>
            <span className={`badge ${s.consequences.supported_by_evidence ? "badge-processed" : "badge-uploaded"}`} style={{ marginTop: 10, display: "inline-block" }}>
              {s.consequences.supported_by_evidence ? "Evidence-backed" : "Inferred"}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div className="card hover-lift" style={{ padding: 20 }} custom={8} initial="hidden" animate="show" variants={sectionVariant}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 600 }}>
          <HelpCircle size={18} color="#4f46e5" /> Why This Result?
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{data.explanation.why_this_evidence}</p>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>{data.explanation.transparency_note}</p>
      </motion.div>
    </Layout>
  );
}

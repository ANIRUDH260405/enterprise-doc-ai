import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  Clock3,
  FileSearch,
  Gauge,
  MapPinned,
  Send,
  ShieldAlert,
  TrainFront,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TYPE_LABELS = {
  signal_failure: "Signal Failure",
  track_obstruction: "Track Obstruction",
  mechanical_failure: "Mechanical Failure",
  power_failure: "Power Failure",
  weather_delay: "Weather Delay",
  staff_shortage: "Staff Shortage",
  other: "Other",
};

const defaultForm = {
  incidentType: "signal_failure",
  incidentId: "INC-001",
  date: "2026-10-05",
  time: "08:20",
  location: "XYZ Junction",
  station: "XYZ Junction",
  division: "Hyderabad",
  description: "Signal for Platform 3 route remains red and cannot be cleared during peak hours. Four trains are approaching the affected route.",
  detectedBy: "Station Controller",
  currentStatus: "Ongoing",
  signalId: "S-23",
  signalType: "Station departure signal",
  signalAspect: "Red",
  expectedAspect: "Green",
  actualAspect: "Red",
  affectedRoute: "Platform 3 → Main Line",
  trainsAffected: "4",
  trainsDelayed: "4",
  delayMinutes: "30",
  platformsAffected: "3",
  tracksAffected: "1",
  otherServices: "No",
  equipment: "Electronic signalling equipment",
  knownFault: "Unknown",
  maintenanceNotified: "Yes",
  powerSupply: "Normal",
  previousSimilar: "Unknown",
  actionTaken: "Signal technician called to inspect equipment",
  actionBy: "Operations control centre",
  actionTime: "08:35",
  actionResult: "Fault not yet identified",
};

const formatIncidentText = (form) => {
  const lines = [
    `Incident ID: ${form.incidentId || "INC-001"}`,
    `Incident Type: ${TYPE_LABELS[form.incidentType] || form.incidentType}`,
    `Date: ${form.date || ""}`,
    `Time: ${form.time || ""}`,
    `Location: ${form.location || ""}`,
    `Station: ${form.station || ""}`,
    `Division: ${form.division || ""}`,
    `Description: ${form.description || ""}`,
    `Detected By: ${form.detectedBy || ""}`,
    `Current Status: ${form.currentStatus || ""}`,
    `Signal ID: ${form.signalId || ""}`,
    `Signal Type: ${form.signalType || ""}`,
    `Signal Aspect: ${form.signalAspect || ""}`,
    `Expected Aspect: ${form.expectedAspect || ""}`,
    `Actual Aspect: ${form.actualAspect || ""}`,
    `Affected Route: ${form.affectedRoute || ""}`,
    `Trains affected: ${form.trainsAffected || ""}`,
    `Trains delayed: ${form.trainsDelayed || ""}`,
    `Approximate delay: ${form.delayMinutes || ""} minutes`,
    `Platforms affected: ${form.platformsAffected || ""}`,
    `Tracks affected: ${form.tracksAffected || ""}`,
    `Other services affected: ${form.otherServices || ""}`,
    `Equipment involved: ${form.equipment || ""}`,
    `Known fault: ${form.knownFault || ""}`,
    `Maintenance team notified: ${form.maintenanceNotified || ""}`,
    `Power supply status: ${form.powerSupply || ""}`,
    `Previous similar failure: ${form.previousSimilar || ""}`,
    `Action taken: ${form.actionTaken || ""}`,
    `Who took the action: ${form.actionBy || ""}`,
    `Time: ${form.actionTime || ""}`,
    `Result: ${form.actionResult || ""}`,
  ];

  return lines.filter((line) => line.includes(": ") && !line.endsWith(": ")).join(". ");
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const navigate = useNavigate();

  const summaryStats = useMemo(() => {
    const analyzed = incidents.filter((incident) => incident.status === "analyzed").length;
    const pending = incidents.filter((incident) => incident.status !== "analyzed").length;
    return { analyzed, pending };
  }, [incidents]);

  const loadIncidents = async () => {
    const res = await api.get("/incidents/");
    setIncidents(res.data);
  };

  useEffect(() => {
    let active = true;

    const fetchIncidents = async () => {
      const res = await api.get("/incidents/");
      if (active) {
        setIncidents(res.data);
      }
    };

    fetchIncidents();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawText = formatIncidentText(formData).trim();
    if (!rawText) return;

    setSubmitting(true);
    setSubmitMessage("");

    try {
      const res = await api.post("/incidents/", { raw_text: rawText });
      setSubmitMessage(`Incident ${res.data.id.slice(0, 8)} created. Evidence review is now available.`);
      setFormData(defaultForm);
      await loadIncidents();
    } catch {
      setSubmitMessage("The incident could not be submitted. Please review the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Incident Intake</h1>
          <p>Capture a live signal failure and trigger evidence-backed railway analysis.</p>
        </div>
      </div>

      <div className="incident-shell">
        <div className="card incident-hero">
          <div className="incident-hero-copy">
            <span className="incident-kicker"><ShieldAlert size={14} /> Signal failure workflow</span>
            <h2>Railway intelligence begins with a precise incident snapshot.</h2>
            <p>
              Enter the critical facts first, then let the system pull the relevant operating rules, manuals,
              and prior evidence for analysis.
            </p>
          </div>
          <div className="incident-hero-metrics">
            <div className="mini-stat">
              <div className="mini-stat-icon"><FileSearch size={15} /></div>
              <div>
                <strong>{summaryStats.analyzed}</strong>
                <span>Evidence reviewed</span>
              </div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-icon"><Gauge size={15} /></div>
              <div>
                <strong>{summaryStats.pending}</strong>
                <span>Awaiting review</span>
              </div>
            </div>
          </div>
        </div>

        <div className="incident-layout">
          <div className="card incident-form-card">
            <form onSubmit={handleSubmit}>
              <div className="incident-section">
                <div className="section-title-inline"><AlertTriangle size={16} /> Basic incident information</div>
                <div className="incident-grid">
                  <label className="field">
                    <span>Incident type</span>
                    <select name="incidentType" value={formData.incidentType} onChange={handleChange}>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Incident ID</span>
                    <input name="incidentId" value={formData.incidentId} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Date</span>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Time</span>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Location</span>
                    <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. XYZ Junction" />
                  </label>
                  <label className="field">
                    <span>Station</span>
                    <input name="station" value={formData.station} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Division</span>
                    <input name="division" value={formData.division} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Current status</span>
                    <select name="currentStatus" value={formData.currentStatus} onChange={handleChange}>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Restored">Restored</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="incident-section">
                <div className="section-title-inline"><CalendarRange size={16} /> What happened?</div>
                <div className="incident-grid single">
                  <label className="field wide">
                    <span>Incident description</span>
                    <textarea name="description" rows={4} value={formData.description} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Detected by</span>
                    <input name="detectedBy" value={formData.detectedBy} onChange={handleChange} />
                  </label>
                </div>
              </div>

              <div className="incident-section">
                <div className="section-title-inline"><TrainFront size={16} /> Signal and route details</div>
                <div className="incident-grid">
                  <label className="field">
                    <span>Signal ID</span>
                    <input name="signalId" value={formData.signalId} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Signal type</span>
                    <input name="signalType" value={formData.signalType} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Signal aspect</span>
                    <input name="signalAspect" value={formData.signalAspect} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Expected aspect</span>
                    <input name="expectedAspect" value={formData.expectedAspect} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Actual aspect</span>
                    <input name="actualAspect" value={formData.actualAspect} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Affected route</span>
                    <input name="affectedRoute" value={formData.affectedRoute} onChange={handleChange} />
                  </label>
                </div>
              </div>

              <div className="incident-section">
                <div className="section-title-inline"><MapPinned size={16} /> Operational impact</div>
                <div className="incident-grid">
                  <label className="field">
                    <span>Trains affected</span>
                    <input name="trainsAffected" value={formData.trainsAffected} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Trains delayed</span>
                    <input name="trainsDelayed" value={formData.trainsDelayed} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Approx delay (mins)</span>
                    <input name="delayMinutes" value={formData.delayMinutes} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Platforms affected</span>
                    <input name="platformsAffected" value={formData.platformsAffected} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Tracks affected</span>
                    <input name="tracksAffected" value={formData.tracksAffected} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Other services affected</span>
                    <input name="otherServices" value={formData.otherServices} onChange={handleChange} />
                  </label>
                </div>
              </div>

              <div className="incident-section">
                <div className="section-title-inline"><Waves size={16} /> Technical and action details</div>
                <div className="incident-grid">
                  <label className="field">
                    <span>Equipment involved</span>
                    <input name="equipment" value={formData.equipment} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Known fault</span>
                    <input name="knownFault" value={formData.knownFault} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Maintenance team notified</span>
                    <select name="maintenanceNotified" value={formData.maintenanceNotified} onChange={handleChange}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Power supply status</span>
                    <input name="powerSupply" value={formData.powerSupply} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Previous similar failure</span>
                    <input name="previousSimilar" value={formData.previousSimilar} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Action taken</span>
                    <input name="actionTaken" value={formData.actionTaken} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Who took the action</span>
                    <input name="actionBy" value={formData.actionBy} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Action time</span>
                    <input type="time" name="actionTime" value={formData.actionTime} onChange={handleChange} />
                  </label>
                  <label className="field wide">
                    <span>Result</span>
                    <input name="actionResult" value={formData.actionResult} onChange={handleChange} />
                  </label>
                </div>
              </div>

              <div className="incident-actions">
                <button type="button" className="btn-secondary" onClick={() => setFormData(defaultForm)}>
                  Reset form
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Send size={15} />
                  {submitting ? "Submitting..." : "Submit for evidence review"}
                </button>
              </div>
              {submitMessage && <div className="intent-message">{submitMessage}</div>}
            </form>
          </div>

          <aside className="incident-sidebar">
            <div className="card insight-card">
              <div className="section-title-inline"><Clock3 size={15} /> System flow</div>
              <ol className="flow-list">
                <li>Capture the event and signal context.</li>
                <li>Match relevant railway documents and rules.</li>
                <li>Review evidence-backed analysis and impact.</li>
              </ol>
            </div>

            <div className="card insight-card">
              <div className="section-title-inline"><AlertTriangle size={15} /> Example scenario</div>
              <p className="example-copy">
                Signal S-23 remained red for 30 minutes during peak traffic. The system checks manual guidance,
                recent signalling incidents, and route constraints before presenting the likely consequences.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 26 }}>Recent incidents ({incidents.length})</div>
      <div className="doc-list">
        {incidents.length === 0 && (
          <div className="card empty-state">
            <AlertTriangle size={40} />
            <p>No incidents reported yet.</p>
          </div>
        )}
        {incidents.map((inc) => (
          <div className="card doc-row incident-row" key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}>
            <div className="doc-row-left">
              <div className="doc-icon"><AlertTriangle size={18} /></div>
              <div>
                <div className="doc-name">{TYPE_LABELS[inc.incident_type] || inc.incident_type || "Unanalyzed"}</div>
                <div className="doc-meta" style={{ display: "flex", gap: 14, marginTop: 4 }}>
                  {inc.location && <span><MapPinned size={11} style={{ verticalAlign: "middle" }} /> {inc.location}</span>}
                  {inc.duration_minutes != null && <span><Clock3 size={11} style={{ verticalAlign: "middle" }} /> {inc.duration_minutes} min</span>}
                  {inc.affected_trains != null && <span><TrainFront size={11} style={{ verticalAlign: "middle" }} /> {inc.affected_trains} trains</span>}
                </div>
              </div>
            </div>
            <div className="incident-row-actions">
              <span className={`badge badge-${inc.status === "analyzed" ? "processed" : inc.status}`}>{inc.status}</span>
              <ArrowRight size={15} />
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

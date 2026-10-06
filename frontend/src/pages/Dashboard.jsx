import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { SkeletonCard } from "../components/Skeleton";
import { useAuth } from "../context/useAuth";
import {
  FileText,
  CheckCircle2,
  CircleAlert,
  Layers3,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS = { Processed: "#3e67dc", Failed: "#e67d7d", Other: "#e9b85d" };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  const pieData = stats
    ? [
        { name: "Processed", value: stats.processed_documents },
        { name: "Failed", value: stats.failed_documents },
        {
          name: "Other",
          value: Math.max(stats.total_documents - stats.processed_documents - stats.failed_documents, 0),
        },
      ].filter((item) => item.value > 0)
    : [];

  const firstName = user?.full_name?.split(" ")[0];
  const metrics = stats
    ? [
        { label: "Total documents", value: stats.total_documents, note: "Files in your library", icon: FileText, color: "#486fe1", tint: "#eef2ff" },
        { label: "Processed", value: stats.processed_documents, note: "Ready to explore", icon: CheckCircle2, color: "#219a78", tint: "#eaf8f2" },
        { label: "Needs attention", value: stats.failed_documents, note: "Unsuccessful processing", icon: CircleAlert, color: "#dd8d3c", tint: "#fff4e7" },
        { label: "AI text chunks", value: stats.total_chunks, note: "Indexed for AI search", icon: Layers3, color: "#9068ce", tint: "#f3edfb" },
      ]
    : [];

  return (
    <Layout>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-eyebrow"><Sparkles size={12} /> Your intelligent workspace</div>
          <h1>{firstName ? `Welcome back, ${firstName}` : "Your knowledge, moving forward"}</h1>
          <p>Bring your documents together and get clearer answers for every railway operation.</p>
          <div className="hero-actions">
            <Link className="btn-primary" to="/documents"><FileText size={15} /> Add documents</Link>
            <Link className="hero-secondary" to="/ask">Ask your AI <ArrowUpRight size={14} /></Link>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Illustration of an intelligent railway document workspace" />
      </section>

      {!stats ? (
        <div className="stats-grid">
          <SkeletonCard height={126} /><SkeletonCard height={126} /><SkeletonCard height={126} /><SkeletonCard height={126} />
        </div>
      ) : (
        <motion.div
          className="stats-grid"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {metrics.map(({ label, value, note, icon: Icon, color, tint }) => (
            <motion.div
              key={label}
              className="card stat-card hover-lift"
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="stat-topline">
                <div className="stat-label">{label}</div>
                <div className="stat-icon" style={{ color, background: tint }}><Icon size={17} /></div>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-footnote">{note}</div>
              <div className="stat-accent" style={{ color }} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="dashboard-lower">
        <section className="card dashboard-panel">
          <div className="panel-heading">
            <h2>Document processing</h2>
            <span>Library overview</span>
          </div>
          {!stats ? (
            <div className="empty-state">Loading document status…</div>
          ) : pieData.length === 0 ? (
            <div className="empty-state">
              <FileText size={28} />
              <p>Your document status will appear here after you upload a file.</p>
            </div>
          ) : (
            <div className="status-chart">
              <div className="chart-graphic">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={43} outerRadius={62} paddingAngle={4} stroke="none">
                      {pieData.map((item) => <Cell key={item.name} fill={STATUS_COLORS[item.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                {pieData.map((item) => (
                  <div className="chart-legend-item" key={item.name}>
                    <span className="chart-dot" style={{ background: STATUS_COLORS[item.name] }} />
                    {item.name}
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card dashboard-panel recent-docs">
          <div className="panel-heading">
            <h2>Recently added</h2>
            <Link to="/documents" aria-label="View all documents"><ArrowUpRight size={16} color="#8290a3" /></Link>
          </div>
          {!stats ? (
            <div className="empty-state">Loading recent documents…</div>
          ) : stats.recent_documents?.length === 0 ? (
            <div className="empty-state">
              <FileText size={28} />
              <p>No documents yet. Add your first file to get started.</p>
            </div>
          ) : (
            stats.recent_documents?.map((doc) => (
              <div className="doc-row" key={doc.id}>
                <div className="doc-row-left">
                  <div className="doc-icon"><FileText size={15} /></div>
                  <div className="doc-name" title={doc.filename}>{doc.filename}</div>
                </div>
                <span className={`badge badge-${doc.status}`}>{doc.status}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
}

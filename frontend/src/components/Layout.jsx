import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import {
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Layers3,
} from "lucide-react";
import Brand from "./Brand";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/search", label: "Search library", icon: Search },
  { to: "/ask", label: "Ask AI", icon: MessageSquare },
  { to: "/incidents", label: "Incident reports", icon: AlertTriangle },
];

const pageLabels = {
  dashboard: "Overview",
  documents: "Documents",
  search: "Search library",
  ask: "Ask AI",
  incidents: "Incident reports",
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const pageKey = location.pathname.split("/")[1];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><Brand /></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-heading">Workspace</div>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <Icon size={17} strokeWidth={1.9} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="workspace-note">
            <div className="workspace-note-icon"><Sparkles size={15} /></div>
            <div>
              <strong>Knowledge, connected</strong>
              <span>One workspace for your documents and railway intelligence.</span>
            </div>
          </div>
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.full_name}</div>
              <div className="email"><span className="pulse-dot" style={{ marginRight: 6 }} />{user?.email}</div>
            </div>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-location">
            <Layers3 size={14} />
            <span>Enterprise Doc AI</span>
            <ChevronRight size={13} />
            <strong>{pageLabels[pageKey] || "Incident details"}</strong>
          </div>
          <div className="topbar-right">
            <div className="system-status"><span className="pulse-dot" /> AI workspace</div>
            <div className="topbar-avatar" title={user?.full_name || "Account"}>{initials}</div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

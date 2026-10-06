import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Brand from "../components/Brand";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <Brand />
        <div className="auth-visual-content">
          <div className="auth-kicker"><Sparkles size={13} /> Railway intelligence, made clear</div>
          <h2>Your documents.<br /><span>One smarter view.</span></h2>
          <p>Find the details that matter, connect the dots across your records, and keep your team moving with AI-powered insight.</p>
          <div className="auth-illustration" role="img" aria-label="Illustration of connected railway documents and insights" />
        </div>
        <div className="auth-trust"><span className="auth-trust-icon"><ShieldCheck size={16} /></span> A focused workspace for your organization</div>
      </section>
      <section className="auth-form-side">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="auth-form-brand"><Brand /></div>
          <h1>Welcome back</h1>
          <p className="subtitle">Log in to continue to your intelligence workspace.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Work email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />}
              {loading ? "Logging in..." : "Log in to workspace"}
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create an account</Link>
          </div>
          <div className="auth-secure-note"><ShieldCheck size={13} /> Your workspace, ready when you are</div>
        </motion.div>
      </section>
    </div>
  );
}

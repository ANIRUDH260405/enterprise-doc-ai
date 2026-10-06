import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Brand from "../components/Brand";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, fullName);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not create account.");
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
          <h2>Make every<br /><span>document count.</span></h2>
          <p>Build a connected view of your operational knowledge and turn scattered documents into answers your team can use.</p>
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
          <h1>Create your account</h1>
          <p className="subtitle">Set up your workspace and bring your documents together.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="register-name">Full name</label>
              <input id="register-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" autoComplete="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Work email</label>
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />}
              {loading ? "Creating account..." : "Create your account"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
          <div className="auth-secure-note"><ShieldCheck size={13} /> Your workspace, ready when you are</div>
        </motion.div>
      </section>
    </div>
  );
}

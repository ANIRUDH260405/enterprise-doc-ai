import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="modal-box"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 8, fontSize: 17 }}>{title}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>{message}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn-danger" style={{ background: "#dc2626", color: "white", padding: "10px 18px" }} onClick={onConfirm}>
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

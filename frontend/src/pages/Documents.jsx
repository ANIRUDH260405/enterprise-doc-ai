import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonRow } from "../components/Skeleton";
import { FileText, UploadCloud, Download, Trash2, Sparkles, ShieldCheck } from "lucide-react";

export default function Documents() {
  const [documents, setDocuments] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    const res = await api.get("/documents/");
    return res.data;
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/documents/")
      .then((res) => {
        if (!cancelled) setDocuments(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load documents.");
      });

    return () => { cancelled = true; };
  }, []);

  const uploadFile = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`"${file.name}" uploaded and processed`);
      setDocuments(await loadDocuments());
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => uploadFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const handleDownload = async (doc) => {
    const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", doc.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const confirmDelete = async () => {
    await api.delete(`/documents/${deleteTarget.id}`);
    toast.success("Document deleted");
    setDeleteTarget(null);
    setDocuments(await loadDocuments());
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>Your team's knowledge, all in one searchable place.</p>
        </div>
      </div>

      <div
        className={`upload-zone hover-lift${dragging ? " is-dragging" : ""}`}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <div className="upload-art" aria-hidden="true">
          <div className="upload-art-orbit upload-art-orbit-one" />
          <div className="upload-art-orbit upload-art-orbit-two" />
          <div className="upload-art-icon"><UploadCloud size={25} /></div>
          <span className="upload-art-sparkle"><Sparkles size={13} /></span>
        </div>
        <div className="upload-title">{uploading ? "Adding your document…" : "Drop a file to grow your library"}</div>
        <p>{uploading ? "We’re processing it and making it ready for AI search." : "Drag a file here, or choose one from your device."}</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.tiff"
          style={{ display: "none" }}
        />
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <UploadCloud size={15} /> {uploading ? "Uploading & processing" : "Choose a file"}
        </button>
        <div className="upload-formats">
          <span>PDF</span><span>Word</span><span>Text</span><span>Images</span>
          <span className="upload-private"><ShieldCheck size={12} /> Private to your workspace</span>
        </div>
      </div>

      <div className="section-title">
        <span>All documents <span className="document-count">{documents?.length ?? "…"}</span></span>
      </div>
      <div className="card">
        <div className="doc-list" style={{ padding: 8 }}>
          {!documents && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
          {documents?.length === 0 && (
            <div className="empty-state"><FileText size={40} /><p>No documents yet. Upload your first one above.</p></div>
          )}
          <AnimatePresence>
            {documents?.map((doc, i) => (
              <motion.div
                className="doc-row hover-lift"
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="doc-row-left">
                  <div className="doc-icon"><FileText size={18} /></div>
                  <div>
                    <div className="doc-name">{doc.filename}</div>
                    <div className="doc-meta">{(doc.size_bytes / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <div className="doc-actions">
                  <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                  <button className="btn-secondary" onClick={() => handleDownload(doc)} title="Download"><Download size={15} /></button>
                  <button className="btn-danger" onClick={() => setDeleteTarget(doc)} title="Delete"><Trash2 size={15} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete document?"
        message={`"${deleteTarget?.filename}" will be permanently deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}

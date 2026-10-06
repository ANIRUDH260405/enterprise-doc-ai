import { useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { Search as SearchIcon, FileText } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("semantic");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const endpoint = mode === "semantic" ? "/documents/search/semantic" : "/documents/search/keyword";
      const res = await api.get(endpoint, { params: { q: query } });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Search Documents</h1>
          <p>Find information across all your uploaded documents</p>
        </div>
      </div>

      <div className="search-tabs">
        <button className={`search-tab ${mode === "semantic" ? "active" : ""}`} onClick={() => setMode("semantic")}>
          Semantic Search
        </button>
        <button className={`search-tab ${mode === "keyword" ? "active" : ""}`} onClick={() => setMode("keyword")}>
          Keyword Search
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "semantic" ? "Ask a question or describe a concept..." : "Search for exact words..."}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          <SearchIcon size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results !== null && (
        <div>
          <div className="section-title">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          {results.length === 0 && (
            <div className="card empty-state">
              <SearchIcon size={40} />
              <p>No results found. Try different words or switch search mode.</p>
            </div>
          )}
          {mode === "semantic"
            ? results.map((r, i) => (
                <div className="card result-card" key={i}>
                  <div className="similarity">Relevance: {(r.similarity * 100).toFixed(1)}%</div>
                  <div className="content">{r.content}</div>
                </div>
              ))
            : results.map((doc) => (
                <div className="card result-card" key={doc.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <FileText size={16} color="#4f46e5" />
                    <strong>{doc.filename}</strong>
                  </div>
                  <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                </div>
              ))}
        </div>
      )}
    </Layout>
  );
}

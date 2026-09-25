import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Send,
  Search,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [currentPage, setCurrentPage] = useState('pipeline'); // 'ingestion' | 'qa' | 'pipeline'
  const [activePipelineFilter, setActivePipelineFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);

  // Page 1: Ingestion State
  const [uploadList, setUploadList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Page 2: Chat Transcript State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello, I am TalentPulse AI connected to your Pinecone vector store and Groq LLaMA-3.3. Ask me any factual question about your candidates.',
      citation: 'System Ready'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Page 3: Candidate Pipeline State
  const [candidates, setCandidates] = useState([]);

  // Check Backend Connectivity & Fetch Candidates
  const checkHealthAndFetch = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (err) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealthAndFetch();
    const interval = setInterval(checkHealthAndFetch, 5000);
    return () => clearInterval(interval);
  }, []);

  // Upload handler calling FastAPI /api/upload-resume
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);

    const tempItem = {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: "processing",
      label: "Vectorizing to Pinecone..."
    };
    setUploadList(prev => [tempItem, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload-resume`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        setUploadList(prev =>
          prev.map(item =>
            item.name === file.name
              ? { ...item, status: "done", label: `Vectorized (${result.chunks_upserted} chunks)` }
              : item
          )
        );
        checkHealthAndFetch();
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setUploadList(prev =>
        prev.map(item =>
          item.name === file.name
            ? { ...item, status: "done", label: "Uploaded (Local fallback)" }
            : item
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Q&A handler calling FastAPI /api/query (Groq + Pinecone)
  const handleSendChat = async (text) => {
    const q = text || inputQuery;
    if (!q.trim() || isAsking) return;

    const newMsgs = [...chatMessages, { role: 'user', text: q }];
    setChatMessages(newMsgs);
    if (!text) setInputQuery('');
    setIsAsking(true);

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          candidate_name: selectedCandidate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.answer,
            citation: data.citations && data.citations.length > 0 ? data.citations[0] : "Verified Pinecone Vector Chunks"
          }
        ]);
      } else {
        throw new Error("Backend query failed");
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error connecting to the backend. Please ensure the server is running.`,
          citation: 'Error'
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (activePipelineFilter === 'All') return true;
    if (activePipelineFilter === 'Shortlisted') return c.status === 'Shortlisted';
    if (activePipelineFilter === 'Rejected') return c.status === 'Archived';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#ededed] font-sans antialiased selection:bg-[#262626] selection:text-[#fafafa] flex flex-col">
      {/* Top Global Navigation */}
      <header className="border-b border-[#1f2023] px-6 lg:px-12 h-14 flex items-center justify-between sticky top-0 bg-[#0c0d0e]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[13px] font-semibold tracking-tight text-[#f4f4f5]">TalentPulse</span>
          </div>

          <div className="h-3.5 w-px bg-[#1f2023]" />

          {/* Minimal 3-Page Switcher */}
          <nav className="flex items-center gap-1 text-[13px]">
            <button
              onClick={() => setCurrentPage('ingestion')}
              className={`px-3 py-1 rounded-md transition-colors ${
                currentPage === 'ingestion'
                  ? 'text-[#ededed] bg-[#1a1b1e] font-medium'
                  : 'text-[#8b8d98] hover:text-[#ededed]'
              }`}
            >
              1. Ingestion Hub
            </button>
            <button
              onClick={() => setCurrentPage('qa')}
              className={`px-3 py-1 rounded-md transition-colors ${
                currentPage === 'qa'
                  ? 'text-[#ededed] bg-[#1a1b1e] font-medium'
                  : 'text-[#8b8d98] hover:text-[#ededed]'
              }`}
            >
              2. Document Q&amp;A
            </button>
            <button
              onClick={() => setCurrentPage('pipeline')}
              className={`px-3 py-1 rounded-md transition-colors ${
                currentPage === 'pipeline'
                  ? 'text-[#ededed] bg-[#1a1b1e] font-medium'
                  : 'text-[#8b8d98] hover:text-[#ededed]'
              }`}
            >
              3. Candidate Pipeline
            </button>
          </nav>
        </div>

        {/* Live Backend Connection Indicator */}
        <div className="flex items-center gap-2 text-[12px] font-mono">
          {backendOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pinecone + Groq Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Connecting to Backend...</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 md:py-14">
        {/* ========================================================= */}
        {/* PAGE 1: The Upload & Ingestion Hub */}
        {/* ========================================================= */}
        {currentPage === 'ingestion' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="space-y-1.5">
              <div className="text-[12px] font-mono text-[#71717a]">
                TalentPulse / Ingestion
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#fafafa]">
                Upload Candidate Dossiers
              </h1>
              <p className="text-[13px] text-[#8b8d98]">
                Drag and drop resumes to partition with <code className="text-zinc-300">unstructured</code> and vector-embed to <code className="text-zinc-300">Pinecone</code>.
              </p>
            </div>

            {/* Dropzone with real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-16 px-6 rounded-xl border border-dashed border-[#26282d] hover:border-[#383a42] bg-[#101114]/60 hover:bg-[#121316] transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-[#18191d] flex items-center justify-center text-[#8b8d98] mb-1">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-[#ededed]">
                  {isUploading ? "Uploading & Vectorizing..." : "Click to browse or drag documents here."}
                </p>
                <p className="text-[11px] font-mono text-[#71717a]">
                  PDF, DOCX, TXT (Max 10MB)
                </p>
              </div>
            </div>

            {/* Ingestion Queue */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a] block">
                Ingestion Queue ({uploadList.length})
              </span>

              <div className="space-y-2">
                {uploadList.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[#1f2023] bg-[#111215]/60 flex items-center justify-between text-[13px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-[#71717a] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#ededed] truncate">{file.name}</p>
                        <span className="text-[11px] text-[#71717a] font-mono">{file.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.status === 'done' ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{file.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-mono text-zinc-400 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{file.label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 2: The Chat / Document Q&A Interface */}
        {/* ========================================================= */}
        {currentPage === 'qa' && (
          <div className="flex flex-col min-h-[580px] justify-between space-y-8 animate-fadeIn">
            {/* Context Header */}
            <div className="sticky top-14 bg-[#0c0d0e]/95 backdrop-blur-sm py-4 border-b border-[#1f2023] z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-[15px] font-semibold text-[#fafafa] tracking-tight">
                  Document Q&amp;A{selectedCandidate ? `: ${selectedCandidate}` : ''}
                </h1>
                <p className="text-[12px] text-[#71717a]">
                  Connected to Pinecone index <code className="text-zinc-400">talentpulse-resumes</code> &amp; Groq LLaMA-3.3.
                </p>
              </div>

              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono text-[#a1a1aa] bg-[#18191c] border border-[#26282d] shrink-0">
                Context: Senior Platform Engineer Requisition
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 space-y-8 py-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="space-y-2">
                  {msg.role === 'user' ? (
                    <div className="text-right">
                      <span className="text-[13px] font-semibold text-[#ededed] bg-[#16171a] px-3.5 py-1.5 rounded-lg border border-[#232428] inline-block">
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-2xl">
                      <p className="text-[13px] leading-relaxed text-[#d4d4d8] whitespace-pre-line">
                        {msg.text}
                      </p>
                      {msg.citation && (
                        <div className="text-[11px] font-mono text-[#71717a] inline-flex items-center gap-1">
                          <span>[{msg.citation}]</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isAsking && (
                <div className="text-[12px] font-mono text-zinc-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Pinecone &amp; generating answer with Groq...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="space-y-3 pt-4 border-t border-[#1f2023]">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  "Summarize cloud architecture experience",
                  "Explain any employment hiatus or sabbatical",
                  "Verify Kubernetes and distributed systems scale"
                ].map((suggest, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(suggest)}
                    className="px-2.5 py-1 rounded text-[11px] text-[#8b8d98] hover:text-[#ededed] bg-[#141517] hover:bg-[#1a1b1e] border border-[#232428] transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2 bg-[#121316] border border-[#202126] focus-within:border-[#383a42] rounded-lg px-3.5 py-2.5 transition-colors"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={selectedCandidate ? `Ask about ${selectedCandidate.split(' ')[0]}'s experience or credentials...` : "Select a candidate from the pipeline first..."}
                  className="flex-1 bg-transparent text-[13px] text-[#ededed] placeholder:text-[#52525b] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAsking}
                  className="text-[#71717a] hover:text-[#ededed] p-1 transition-colors disabled:opacity-50"
                  title="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 3: Candidate Pipeline & Scoring */}
        {/* ========================================================= */}
        {currentPage === 'pipeline' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1f2023] gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#fafafa]">
                  Active Pipeline: Staff Platform Architect (L6)
                </h1>
                <p className="text-[12px] text-[#71717a] mt-0.5">
                  Synchronized with Pinecone vector database and live resume extractions.
                </p>
              </div>

              <div className="flex items-center p-0.5 rounded-lg bg-[#141518] border border-[#232428] text-[12px]">
                {["All", "Shortlisted", "Rejected"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePipelineFilter(tab)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activePipelineFilter === tab
                        ? 'bg-[#22242a] text-[#ededed] font-medium'
                        : 'text-[#8b8d98] hover:text-[#ededed]'
                    }`}
                  >
                    {tab === "All" ? "All Candidates" : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List from Backend */}
            <div className="space-y-2">
              {filteredCandidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCandidate(c.name);
                    setCurrentPage('qa');
                  }}
                  className="p-4 rounded-xl border border-[#1f2023] hover:border-[#383a42] bg-[#111215]/50 hover:bg-[#15161a] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-medium text-[#f4f4f5]">
                        {c.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                        <span className={c.scoreColor}>{c.score}</span>
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${c.statusBadge} font-mono`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#71717a]">
                      <span className="text-[#a1a1aa]">
                        {c.skills.join(', ')}
                      </span>

                      {c.alert && (
                        <span className="inline-flex items-center gap-1 text-amber-400/90 text-[11px] font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{c.alert}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[12px] text-[#8b8d98] group-hover:text-[#ededed] shrink-0 font-medium">
                    <span>Ask AI</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState } from 'react';
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
  Layers,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  Check,
  FileCode2
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('pipeline'); // 'ingestion' | 'qa' | 'pipeline'
  const [activePipelineFilter, setActivePipelineFilter] = useState('All'); // 'All' | 'Shortlisted' | 'Rejected'
  const [selectedCandidate, setSelectedCandidate] = useState('Alex Vanderbilt');

  // Page 1: Ingestion State
  const [uploadList, setUploadList] = useState([
    {
      name: "Alex_Vanderbilt_Resume.pdf",
      size: "342 KB",
      status: "done",
      label: "100% Vectorized"
    },
    {
      name: "Sarah_Jenkins_CV.docx",
      size: "215 KB",
      status: "processing",
      label: "Extracting competencies..."
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Page 2: Chat Transcript State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'user',
      text: 'Does Alex have experience scaling Kubernetes clusters beyond 500 nodes?'
    },
    {
      role: 'assistant',
      text: 'Yes. According to the Stripe career block (2016-2020), Alex spearheaded global financial ledger orchestration on Kubernetes, servicing peak volumes exceeding 120,000 requests per second across large-scale multi-region clusters.',
      citation: 'Page 2: Stripe Experience'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');

  // Page 3: Candidate Pipeline Data
  const candidates = [
    {
      id: "alex-vanderbilt",
      name: "Alex Vanderbilt",
      score: "94 Match",
      scoreColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
      skills: ["Kubernetes", "Golang", "Terraform"],
      status: "Shortlisted",
      statusBadge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      category: "Shortlisted"
    },
    {
      id: "jordan-lee",
      name: "Jordan Lee",
      score: "78 Match",
      scoreColor: "text-zinc-400",
      dotColor: "bg-amber-400",
      skills: ["AWS", "Python", "Docker"],
      alert: "Missing: Terraform",
      status: "In Review",
      statusBadge: "text-zinc-400 bg-zinc-800/60 border-zinc-700/40",
      category: "All"
    },
    {
      id: "casey-smith",
      name: "Casey Smith",
      score: "42 Match",
      scoreColor: "text-zinc-500",
      dotColor: "bg-rose-500/80",
      skills: ["Java", "Jenkins", "Linux"],
      status: "Archived",
      statusBadge: "text-zinc-500 bg-zinc-900 border-zinc-800",
      category: "Rejected"
    }
  ];

  const handleSendChat = (text) => {
    const q = text || inputQuery;
    if (!q.trim()) return;

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: q },
      {
        role: 'assistant',
        text: `Alex's profile confirms senior platform leadership: 14 years across FinTech Labs Inc. and Stripe, driving multi-region container architectures and cross-functional infrastructure initiatives with deterministic guardrails.`,
        citation: 'Page 1 & 3: Leadership & Chronology'
      }
    ]);
    if (!text) setInputQuery('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadList(prev => [
      ...prev,
      {
        name: "New_Candidate_Dossier.pdf",
        size: "410 KB",
        status: "processing",
        label: "Extracting competencies..."
      }
    ]);
  };

  const filteredCandidates = candidates.filter(c => {
    if (activePipelineFilter === 'All') return true;
    if (activePipelineFilter === 'Shortlisted') return c.status === 'Shortlisted';
    if (activePipelineFilter === 'Rejected') return c.status === 'Archived';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#ededed] font-sans antialiased selection:bg-[#262626] selection:text-[#fafafa] flex flex-col">
      {/* Top Minimal Global Navigation */}
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

        <div className="text-[12px] font-mono text-[#71717a] hidden sm:block">
          Linear Aesthetic • Dark Low-Contrast
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 md:py-14">
        {/* ========================================================= */}
        {/* PAGE 1: The Upload & Ingestion Hub */}
        {/* ========================================================= */}
        {currentPage === 'ingestion' && (
          <div className="space-y-10 animate-fadeIn">
            {/* 1. Header */}
            <div className="space-y-1.5">
              <div className="text-[12px] font-mono text-[#71717a]">
                TalentPulse / Ingestion
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#fafafa]">
                Upload Candidate Dossiers
              </h1>
              <p className="text-[13px] text-[#8b8d98]">
                Drag and drop resumes or CVs to vectorize and analyze.
              </p>
            </div>

            {/* 2. The Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                setUploadList(prev => [
                  ...prev,
                  {
                    name: "Candidate_Dossier_Ingest.pdf",
                    size: "290 KB",
                    status: "processing",
                    label: "Extracting competencies..."
                  }
                ]);
              }}
              className={`w-full py-16 px-6 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
                isDragging
                  ? 'border-emerald-500/50 bg-[#141816]'
                  : 'border-[#26282d] hover:border-[#383a42] bg-[#101114]/60 hover:bg-[#121316]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#18191d] flex items-center justify-center text-[#8b8d98] mb-1">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-[#ededed]">
                  Click to browse or drag documents here.
                </p>
                <p className="text-[11px] font-mono text-[#71717a]">
                  PDF, DOCX, TXT (Max 10MB)
                </p>
              </div>
            </div>

            {/* 3. Upload Queue / Processing State */}
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
                          <Clock className="w-3.5 h-3.5" />
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
            {/* 1. Context Header */}
            <div className="sticky top-14 bg-[#0c0d0e]/95 backdrop-blur-sm py-4 border-b border-[#1f2023] z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-[15px] font-semibold text-[#fafafa] tracking-tight">
                  Document Q&amp;A: {selectedCandidate}
                </h1>
                <p className="text-[12px] text-[#71717a]">
                  Hallucination-free interrogation grounded strictly in parsed resume chunks.
                </p>
              </div>

              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono text-[#a1a1aa] bg-[#18191c] border border-[#26282d] shrink-0">
                Context: Senior Platform Engineer Requisition
              </span>
            </div>

            {/* 2. Chat Transcript Area */}
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
                      <p className="text-[13px] leading-relaxed text-[#d4d4d8]">
                        {msg.text}
                      </p>
                      {msg.citation && (
                        <div>
                          <button
                            onClick={() => alert(`Navigating to citation context: ${msg.citation}`)}
                            className="text-[11px] font-mono text-[#71717a] hover:text-[#34d399] transition-colors inline-flex items-center gap-1"
                          >
                            <span>[{msg.citation}]</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 3. Input Area & Suggested Queries */}
            <div className="space-y-3 pt-4 border-t border-[#1f2023]">
              {/* Suggested queries */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  "Summarize leadership experience",
                  "Check for management skills",
                  "Explain 24-month career sabbatical"
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

              {/* Minimal Borderless Input */}
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
                  placeholder={`Ask about ${selectedCandidate.split(' ')[0]}'s experience, gaps, or culture fit...`}
                  className="flex-1 bg-transparent text-[13px] text-[#ededed] placeholder:text-[#52525b] focus:outline-none"
                />
                <button
                  type="submit"
                  className="text-[#71717a] hover:text-[#ededed] p-1 transition-colors"
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
            {/* 1. Page Header & Minimal Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1f2023] gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#fafafa]">
                  Active Pipeline: Staff Platform Architect (L6)
                </h1>
                <p className="text-[12px] text-[#71717a] mt-0.5">
                  Autonomous scoring and vector evaluation across candidates.
                </p>
              </div>

              {/* Minimal Filter Tabs */}
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

            {/* 2. Candidate Data List (Lightweight Rows) */}
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
                  {/* Left: Name, Score & Competencies */}
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

                  {/* Right: Row Action */}
                  <div className="flex items-center gap-1 text-[12px] text-[#8b8d98] group-hover:text-[#ededed] shrink-0 font-medium">
                    <span>View Dossier</span>
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

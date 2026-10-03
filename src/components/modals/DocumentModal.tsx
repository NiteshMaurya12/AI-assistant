import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem } from '../../types';
import { Api } from '../../services/api';
import { FileText, UploadCloud, Trash2, X, Search, Sparkles, BookOpen, Layers } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContextForChat?: (contextText: string, docName: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSelectContextForChat,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [query, setQuery] = useState('');
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);
  const [usedChunks, setUsedChunks] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      const docs = await Api.getDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          await Api.uploadDocument({
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content,
          });
          await loadDocuments();
        } catch (err) {
          console.error('Upload error:', err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    setQueryAnswer(null);
    try {
      const res = await Api.queryDocument(query, selectedDoc?.id);
      setQueryAnswer(res.answer);
      setUsedChunks(res.usedChunks || []);
    } catch (err: any) {
      setQueryAnswer(`Error querying document: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedDoc) return;
    setIsQuerying(true);
    setSummary(null);
    try {
      const res = await Api.summarizeDocument(selectedDoc.id);
      setSummary(res.summary);
    } catch (err: any) {
      setSummary(`Error: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await Api.deleteDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      if (selectedDoc?.id === id) {
        setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Document Intelligence &amp; RAG</h2>
              <p className="text-xs text-neutral-400">
                Semantic retrieval, chunking, question answering, and automated executive summaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Left Column: Document Ingestion & List */}
          <div className="border-r border-neutral-800 p-4 flex flex-col justify-between bg-neutral-950/40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase text-neutral-400">Knowledge Base</span>
                <span className="text-xs text-neutral-500">{documents.length} docs</span>
              </div>

              {/* Upload Drop Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".txt,.csv,.json,.md,.docx,.pdf,.py,.ts"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full mb-3 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-neutral-700 hover:border-teal-500/50 bg-neutral-900/50 hover:bg-neutral-900 text-xs text-neutral-300 transition"
              >
                <UploadCloud className="w-4 h-4 text-teal-400" />
                <span>{isUploading ? 'Ingesting document...' : 'Upload Document / Dataset'}</span>
              </button>

              {/* Document List */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 italic">
                    No documents ingested yet. Upload CSV, TXT, PDF or code files to enable RAG.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setQueryAnswer(null);
                        setSummary(null);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition ${
                        selectedDoc?.id === doc.id
                          ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{doc.name}</div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>{doc.chunks.length} chunks</span>
                          <span>·</span>
                          <span>{Math.round(doc.size / 1024)} KB</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedDoc && onSelectContextForChat && (
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <button
                  onClick={() => {
                    const sample = selectedDoc.chunks.map((c) => c.text).join('\n\n').slice(0, 4000);
                    onSelectContextForChat(sample, selectedDoc.name);
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 border border-teal-500/30 text-xs font-medium transition"
                >
                  Send to Chat Context
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Q&A and Document Intelligence */}
          <div className="md:col-span-2 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {selectedDoc ? (
                <>
                  {/* Document Header & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{selectedDoc.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {selectedDoc.chunks.length} passages indexed for RAG vector retrieval
                      </p>
                    </div>

                    <button
                      onClick={handleSummarize}
                      disabled={isQuerying}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium flex items-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>Executive Summary</span>
                    </button>
                  </div>

                  {/* Summary Box if generated */}
                  {summary && (
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-teal-800/40 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                      <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Document Synthesis</span>
                      </div>
                      {summary}
                    </div>
                  )}

                  {/* Q&A Input */}
                  <form onSubmit={handleQuery} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Ask a question about ${selectedDoc.name}...`}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!query.trim() || isQuerying}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-medium transition"
                    >
                      {isQuerying ? 'Searching...' : 'Ask RAG'}
                    </button>
                  </form>

                  {/* Q&A Answer Display */}
                  {queryAnswer && (
                    <div className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800 text-xs text-neutral-200 space-y-3">
                      <div className="font-semibold text-teal-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Retrieved Answer</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{queryAnswer}</p>

                      {/* Attributed Chunks */}
                      {usedChunks.length > 0 && (
                        <div className="pt-2 border-t border-neutral-800/60">
                          <div className="text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-neutral-500" />
                            <span>Retrieved Context Passages:</span>
                          </div>
                          <div className="space-y-1">
                            {usedChunks.map((c, i) => (
                              <div
                                key={i}
                                className="text-[10px] text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800/40"
                              >
                                <span className="text-teal-400 font-mono">[{c.docName} #Sec {c.index + 1}]</span>: {c.preview}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document preview snippet */}
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      First Indexed Passage
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 font-mono text-[11px] text-neutral-400 max-h-36 overflow-y-auto">
                      {selectedDoc.chunks[0]?.text || 'No text content extracted.'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-neutral-500">
                  Select or upload a document to begin RAG question answering.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

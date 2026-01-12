import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode, Files, Search, GitBranch, Play, Layout, Send, ChevronRight,
  Terminal as TerminalIcon, Globe, Download, Save, RotateCcw, Loader2,
  Check, AlertCircle, RefreshCw
} from 'lucide-react';

const SaveStatusIndicator = ({ status }) => {
  if (status === 'idle') return null;
  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
      status === 'saving' ? 'bg-yellow-600/20 text-yellow-400' :
      status === 'saved' ? 'bg-green-600/20 text-green-400' :
      status === 'error' ? 'bg-red-600/20 text-red-400' : ''
    }`}>
      {status === 'saving' && (<><RefreshCw size={12} className="animate-spin" /><span>Syncing...</span></>)}
      {status === 'saved' && (<><Check size={12} /><span>Synced</span></>)}
      {status === 'error' && (<><AlertCircle size={12} /><span>Sync failed</span></>)}
    </div>
  );
};

const CursorMockup = () => {
  const initialCode = localStorage.getItem('streamlit-code') || `import streamlit as st\n\nst.title("Welcome to AI Studio")\nst.write("Generate your Streamlit app using AI!")\n\n# Your code here\n`;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [streamlitRunning, setStreamlitRunning] = useState(false);
  const [streamlitUrl, setStreamlitUrl] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isStreamlitLoading, setIsStreamlitLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const editorRef = useRef(null);
  const lastSavedCodeRef = useRef(initialCode);

  const extractCode = (text) => {
    const codeBlockRegex = /```(?:python|py)?\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    return matches.length > 0 ? matches[0][1].trim() : text;
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    const userPrompt = prompt;
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', content: userPrompt }]);
    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a Streamlit expert. Generate only Streamlit Python code. Always wrap code in ```python blocks.' },
            { role: 'user', content: userPrompt }
          ],
          model: 'claude-3-haiku-20240307', provider: 'anthropic', temperature: 0.7, max_tokens: 2000
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
      const extractedCode = extractCode(data.message);
      if (extractedCode) setCode(extractedCode);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { role: 'error', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPrompt(); } };

  const handleRunStreamlit = async () => {
    if (!code.trim()) { alert('No code to run!'); return; }
    setIsStreamlitLoading(true);
    setIsPreviewOpen(true);
    try {
      const response = await fetch('/api/streamlit/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setStreamlitUrl(data.url);
      setStreamlitRunning(true);
      lastSavedCodeRef.current = code;
    } catch (error) {
      console.error('Error:', error);
      setIsStreamlitLoading(false);
      alert(`Failed: ${error.message}`);
    }
  };

  const handleStopStreamlit = async () => {
    try {
      await fetch('/api/streamlit/stop', { method: 'POST' });
      setStreamlitRunning(false);
      setStreamlitUrl('');
      setIsStreamlitLoading(false);
      setSaveStatus('idle');
    } catch (error) { console.error('Error:', error); }
  };

  const handleEditorDidMount = (editor) => { editorRef.current = editor; };
  const handleEditorChange = (value) => { setCode(value || ''); setHasUnsavedChanges(true); };

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'app.py';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDrive = () => { handleExport(); localStorage.setItem('streamlit-code', code); setHasUnsavedChanges(false); setShowSaveModal(false); };

  const handleReset = () => {
    if (confirm('Reset code?')) {
      const defaultCode = `import streamlit as st\n\nst.title("Welcome")\nst.write("Hello!")`;
      setCode(defaultCode);
      localStorage.setItem('streamlit-code', defaultCode);
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem('streamlit-code', code), 1000);
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!streamlitRunning || code === lastSavedCodeRef.current) return;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const response = await fetch('/api/streamlit/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
        });
        if (!response.ok) throw new Error(`Failed: ${response.status}`);
        lastSavedCodeRef.current = code;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code, streamlitRunning]);

  useEffect(() => {
    const handleBeforeUnload = (e) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      <div className="w-12 flex flex-col items-center py-4 border-r border-zinc-800 space-y-4 text-zinc-500">
        <Files size={24} className="text-zinc-200 cursor-pointer" />
        <Search size={24} className="hover:text-zinc-200 cursor-pointer" />
        <GitBranch size={24} className="hover:text-zinc-200 cursor-pointer" />
        <div className="flex-grow" />
        <Layout size={24} className="hover:text-zinc-200 cursor-pointer" />
      </div>

      <div className="w-60 border-r border-zinc-800 flex flex-col bg-[#09090b]">
        <div className="p-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Explorer</div>
        <div className="flex flex-col text-sm">
          <div className="flex items-center px-4 py-1 bg-zinc-800/50 text-zinc-200">
            <ChevronRight size={16} /><span className="ml-1">src</span>
          </div>
          <div className="flex items-center px-8 py-1 text-zinc-400 hover:bg-zinc-800/30 cursor-pointer">
            <FileCode size={16} className="mr-2 text-yellow-400" />app.py
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col min-w-0">
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b]">
          <div className="flex items-center space-x-2 text-sm text-zinc-400">
            <span className="border-b border-zinc-400 text-zinc-100 px-2 pt-1">app.py</span>
            {streamlitRunning && <SaveStatusIndicator status={saveStatus} />}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleExport} className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"><Download size={14} /><span>Export</span></button>
            <button onClick={handleSaveToDrive} className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-purple-600 text-white hover:bg-purple-700"><Save size={14} /><span>Save</span></button>
            <button onClick={handleReset} className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-zinc-700 text-white hover:bg-zinc-600"><RotateCcw size={14} /><span>Reset</span></button>
            <div className="border-l border-zinc-700 h-6 mx-2"></div>
            {streamlitRunning ? (
              <button onClick={handleStopStreamlit} className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"><span>■</span><span>Stop</span></button>
            ) : (
              <button onClick={handleRunStreamlit} className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"><Play size={14} /><span>Run</span></button>
            )}
            <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${isPreviewOpen ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'}`}>
              <Globe size={14} /><span>{isPreviewOpen ? 'Close' : 'Preview'}</span>
            </button>
          </div>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className={`flex-grow ${isPreviewOpen ? 'w-1/2' : 'w-full'}`}>
            <Editor height="100%" defaultLanguage="python" value={code} onChange={handleEditorChange} onMount={handleEditorDidMount} theme="vs-dark"
              options={{ minimap: { enabled: true }, fontSize: 14, lineNumbers: 'on', wordWrap: 'on', automaticLayout: true, tabSize: 4 }} />
          </div>
          {isPreviewOpen && (
            <div className="w-1/2 border-l border-zinc-800 bg-white flex flex-col">
              <div className="h-8 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 space-x-2">
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${streamlitRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="bg-white px-2 py-0.5 rounded text-[10px] text-zinc-500 border border-zinc-200 flex-grow mx-4">{streamlitUrl || 'localhost:8501'}</div>
                {streamlitRunning && saveStatus !== 'idle' && (
                  <div className={`text-[10px] px-2 py-0.5 rounded ${saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-700' : saveStatus === 'saved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {saveStatus === 'saving' && 'Reloading...'}{saveStatus === 'saved' && 'Reloaded'}{saveStatus === 'error' && 'Failed'}
                  </div>
                )}
              </div>
              <div className="flex-grow overflow-auto bg-zinc-50">
                {streamlitRunning ? (
                  <iframe src={streamlitUrl} className="w-full h-full border-0" title="Streamlit" onLoad={() => setIsStreamlitLoading(false)} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <Play size={48} className="mx-auto mb-4 text-zinc-400" />
                      <h3 className="text-lg font-semibold text-zinc-700 mb-2">Preview</h3>
                      <button onClick={handleRunStreamlit} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Run</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-32 border-t border-zinc-800 bg-[#09090b] p-2">
          <div className="flex items-center space-x-4 px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase">
            <span className="text-zinc-200 border-b border-zinc-200">Terminal</span>
          </div>
          <div className="font-mono text-xs p-2 text-zinc-400">
            <div className="text-green-500 font-bold mb-1">✓ Ready</div>
            {streamlitRunning ? <div className="text-cyan-400">[hot-reload] Watching for changes...</div> : <div>Compiled successfully</div>}
          </div>
        </div>
      </div>

      <div className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <span className="text-sm font-medium">Streamlit Studio</span>
          <p className="text-[10px] text-yellow-500 mt-1">⚡ Python 3.12 Only</p>
        </div>
        <div className="flex-grow overflow-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm">
              <p className="text-zinc-500 italic">Streamlit 앱을 만들어드립니다...</p>
            </div>
          ) : chatHistory.map((msg, idx) => (
            <div key={idx} className={`border rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-900/20 border-blue-800' : msg.role === 'error' ? 'bg-red-900/20 border-red-800' : 'bg-zinc-900 border-zinc-800'}`}>
              <p className="text-zinc-400 text-xs mb-1">{msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'AI'}</p>
              <p className={`whitespace-pre-wrap ${msg.role === 'error' ? 'text-red-400' : 'text-zinc-200'}`}>{msg.content}</p>
            </div>
          ))}
          {isLoading && <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3"><p className="text-zinc-500 animate-pulse">Generating...</p></div>}
        </div>
        <div className="p-4 border-t border-zinc-800 bg-[#0c0c0e]">
          <div className="relative">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter prompt..." disabled={isLoading}
              className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 focus:outline-none resize-none disabled:opacity-50" />
            <button onClick={handleSendPrompt} disabled={isLoading || !prompt.trim()} className="absolute bottom-2 right-2 p-1.5 bg-zinc-200 text-zinc-900 rounded-md hover:bg-white disabled:opacity-50">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {isStreamlitLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8">
            <Loader2 size={48} className="text-green-500 animate-spin mx-auto" />
            <p className="text-zinc-100 mt-4">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursorMockup;

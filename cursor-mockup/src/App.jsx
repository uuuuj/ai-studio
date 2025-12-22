import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  Files,
  Search,
  GitBranch,
  Play,
  Layout,
  Send,
  ChevronRight,
  Terminal as TerminalIcon,
  Globe,
  Download,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';

const CursorMockup = () => {
  // Load code from localStorage or use default
  const initialCode = localStorage.getItem('streamlit-code') || `import streamlit as st

st.title("Welcome to AI Studio")
st.write("Generate your Streamlit app using AI!")

# Your code here
`;

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
  const editorRef = useRef(null);

  // Extract code from LLM response (Python/Streamlit only)
  const extractCode = (text) => {
    const codeBlockRegex = /```(?:python|py)?\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
      return matches[0][1].trim();
    }
    return text;
  };

  // Send prompt to backend
  const handleSendPrompt = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    const userPrompt = prompt;
    setPrompt('');

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: userPrompt }]);

    try {
      const response = await fetch('http://localhost:8000/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a senior software engineer specializing in Streamlit applications.

CRITICAL REQUIREMENTS:
1. You can ONLY generate Streamlit Python code. No other frameworks allowed.
2. All code must be Python 3.12 compatible and production-ready.
3. Always wrap code in markdown code blocks with \`\`\`python tag.

IMPLEMENTATION RULES:
- Output real, runnable code (no pseudocode or comments only)
- Include proper error handling where appropriate
- Use Streamlit best practices (st.cache_data, st.session_state, etc.)
- Create complete, working applications
- Keep code clean and well-structured

EXAMPLE CODE STRUCTURE:
\`\`\`python
import streamlit as st

st.title("Your App Title")

# Your application code here
# Use st.sidebar for controls
# Use st.columns for layout
# Add interactivity with st.button, st.slider, etc.
\`\`\`

If user requests non-Streamlit frameworks (React, Vue, HTML, etc.), politely inform them that you can only create Streamlit applications.`
            },
            { role: 'user', content: userPrompt }
          ],
          model: 'claude-3-haiku-20240307',
          provider: 'anthropic',
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.message;

      // Add AI response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Extract and update code
      const extractedCode = extractCode(aiResponse);
      if (extractedCode) {
        setCode(extractedCode);
      }
    } catch (error) {
      console.error('Error calling LLM API:', error);
      setChatHistory(prev => [...prev, {
        role: 'error',
        content: `Error: ${error.message}. Make sure the backend server is running on http://localhost:8000`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  // Run Streamlit app
  const handleRunStreamlit = async () => {
    if (!code.trim()) {
      alert('No code to run! Please generate some code first.');
      return;
    }

    // Show loading modal immediately
    setIsStreamlitLoading(true);
    setIsPreviewOpen(true);

    try {
      // Save code and run Streamlit via backend
      const response = await fetch('http://localhost:8000/api/streamlit/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`Failed to start Streamlit: ${response.status}`);
      }

      const data = await response.json();
      setStreamlitUrl(data.url);
      setStreamlitRunning(true);
      // Loading modal will close when iframe loads
    } catch (error) {
      console.error('Error running Streamlit:', error);
      setIsStreamlitLoading(false);
      alert(`Failed to run Streamlit: ${error.message}`);
    }
  };

  // Stop Streamlit app
  const handleStopStreamlit = async () => {
    try {
      await fetch('http://localhost:8000/api/streamlit/stop', {
        method: 'POST'
      });
      setStreamlitRunning(false);
      setStreamlitUrl('');
      setIsStreamlitLoading(false);
    } catch (error) {
      console.error('Error stopping Streamlit:', error);
    }
  };

  // Monaco Editor functions
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
    setHasUnsavedChanges(true);
  };

  // Export code as app.py
  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save to Drive (local download)
  const handleSaveToDrive = () => {
    handleExport();
    localStorage.setItem('streamlit-code', code);
    setHasUnsavedChanges(false);
    setShowSaveModal(false);
  };

  // Reset code to default
  const handleReset = () => {
    if (confirm('Are you sure you want to reset the code? This will clear all your changes.')) {
      const defaultCode = `import streamlit as st

st.title("Welcome to AI Studio")
st.write("Generate your Streamlit app using AI!")

# Your code here
`;
      setCode(defaultCode);
      localStorage.setItem('streamlit-code', defaultCode);
      setHasUnsavedChanges(false);
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('streamlit-code', code);
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [code]);

  // Handle before unload - show browser's native confirmation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Shows browser's native "Leave site?" dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 font-sans overflow-hidden">

      {/* 1. Activity Bar (최좌측 아이콘 바) */}
      <div className="w-12 flex flex-col items-center py-4 border-r border-zinc-800 space-y-4 text-zinc-500">
        <Files size={24} className="text-zinc-200 cursor-pointer" />
        <Search size={24} className="hover:text-zinc-200 cursor-pointer" />
        <GitBranch size={24} className="hover:text-zinc-200 cursor-pointer" />
        <div className="flex-grow" />
        <Layout size={24} className="hover:text-zinc-200 cursor-pointer" />
      </div>

      {/* 2. Side Bar (파일 탐색기) */}
      <div className="w-60 border-r border-zinc-800 flex flex-col bg-[#09090b]">
        <div className="p-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Explorer
        </div>
        <div className="flex flex-col text-sm">
          <div className="flex items-center px-4 py-1 bg-zinc-800/50 text-zinc-200">
            <ChevronRight size={16} />
            <span className="ml-1">src</span>
          </div>
          <div className="flex items-center px-8 py-1 text-zinc-400 hover:bg-zinc-800/30 cursor-pointer">
            <FileCode size={16} className="mr-2 text-yellow-400" />
            app.py
          </div>
          <div className="flex items-center px-8 py-1 text-zinc-400 hover:bg-zinc-800/30 cursor-pointer">
            <FileCode size={16} className="mr-2 text-yellow-400" />
            components.py
          </div>
        </div>
      </div>

      {/* 3. Main Editor Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Editor Toolbar */}
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b]">
          <div className="flex items-center space-x-2 text-sm text-zinc-400">
            <span className="border-b border-zinc-400 text-zinc-100 h-full flex items-center px-2 pt-1">app.py</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Download app.py"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button
              onClick={handleSaveToDrive}
              className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              title="Save to Drive (Download)"
            >
              <Save size={14} />
              <span>Save to Drive</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
              title="Reset to default code"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <div className="border-l border-zinc-700 h-6 mx-2"></div>

            {streamlitRunning ? (
              <button
                onClick={handleStopStreamlit}
                className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <span>■</span>
                <span>Stop App</span>
              </button>
            ) : (
              <button
                onClick={handleRunStreamlit}
                className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Play size={14} />
                <span>Run Streamlit</span>
              </button>
            )}

            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                isPreviewOpen ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
              }`}
            >
              <Globe size={14} />
              <span>{isPreviewOpen ? "Close Preview" : "Preview"}</span>
            </button>
          </div>
        </div>

        {/* Editor & Preview Split View */}
        <div className="flex-grow flex overflow-hidden">
          {/* Monaco Code Editor */}
          <div className={`flex-grow ${isPreviewOpen ? 'w-1/2' : 'w-full'}`}>
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                rulers: [],
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* 4. Preview Window (Streamlit App) */}
          {isPreviewOpen && (
            <div className="w-1/2 border-l border-zinc-800 bg-white flex flex-col">
              <div className="h-8 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 space-x-2">
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${streamlitRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="bg-white px-2 py-0.5 rounded text-[10px] text-zinc-500 border border-zinc-200 flex-grow mx-4">
                  {streamlitUrl || 'localhost:8501'}
                </div>
              </div>
              <div className="flex-grow overflow-auto bg-zinc-50">
                {streamlitRunning ? (
                  <iframe
                    src={streamlitUrl}
                    className="w-full h-full border-0"
                    title="Streamlit App"
                    onLoad={() => setIsStreamlitLoading(false)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <Play size={48} className="mx-auto mb-4 text-zinc-400" />
                      <h3 className="text-lg font-semibold text-zinc-700 mb-2">Streamlit App Preview</h3>
                      <p className="text-zinc-500 mb-4">Click "Run Streamlit" to see your app in action</p>
                      <button
                        onClick={handleRunStreamlit}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Run App
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Terminal Section */}
        <div className="h-32 border-t border-zinc-800 bg-[#09090b] p-2">
          <div className="flex items-center space-x-4 px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase">
            <span className="text-zinc-200 border-b border-zinc-200">Terminal</span>
            <span>Output</span>
            <span>Debug Console</span>
          </div>
          <div className="font-mono text-xs p-2 text-zinc-400">
            <div className="text-green-500 font-bold mb-1">✓ Ready in 452ms</div>
            <div>[next] Compiled successfully</div>
            <div className="animate-pulse underline text-zinc-600">_</div>
          </div>
        </div>
      </div>

      {/* 5. Right Sidebar (AI Composer / Chat) */}
      <div className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Streamlit Studio</span>
            <TerminalIcon size={16} className="text-zinc-500" />
          </div>
          <p className="text-[10px] text-yellow-500 mt-1">⚡ Streamlit Python 3.12 Only</p>
        </div>

        <div className="flex-grow overflow-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm">
              <p className="text-zinc-400 text-xs mb-1">Streamlit Assistant</p>
              <p className="text-zinc-500 italic">Streamlit 앱을 만들어드립니다. 프롬프트를 입력하세요...</p>
              <p className="text-zinc-600 text-xs mt-2">예: "사용자 이름을 입력받아 인사하는 앱 만들어줘"</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`border rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-900/20 border-blue-800'
                  : msg.role === 'error'
                  ? 'bg-red-900/20 border-red-800'
                  : 'bg-zinc-900 border-zinc-800'
              }`}>
                <p className="text-zinc-400 text-xs mb-1">
                  {msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'AI Assistant'}
                </p>
                <p className={`whitespace-pre-wrap ${
                  msg.role === 'error' ? 'text-red-400' : 'text-zinc-200'
                }`}>
                  {msg.content}
                </p>
                {msg.role === 'assistant' && (
                  <div className="mt-2 text-[10px] text-yellow-400 font-mono italic">Applied to app.py</div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm">
              <p className="text-zinc-400 text-xs mb-1">AI Assistant</p>
              <p className="text-zinc-500 italic animate-pulse">Generating code...</p>
            </div>
          )}
        </div>

        {/* AI Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-[#0c0c0e]">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="무엇을 만들어드릴까요? (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none placeholder:text-zinc-600 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendPrompt}
              disabled={isLoading || !prompt.trim()}
              className="absolute bottom-2 right-2 p-1.5 bg-zinc-200 text-zinc-900 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-200"
            >
              <Send size={14} />
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] text-zinc-500 flex items-center leading-none">
              <span className="px-1 border border-zinc-700 rounded mr-1 text-yellow-400">🐍</span> app.py
            </span>
            <span className={`text-[10px] uppercase tracking-tighter ${isLoading ? 'text-green-500 animate-pulse' : 'text-yellow-500'}`}>
              {isLoading ? 'Generating...' : 'Streamlit + Claude'}
            </span>
          </div>
        </div>
      </div>

      {/* Streamlit Loading Modal */}
      {isStreamlitLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 size={48} className="text-green-500 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Preparing the preview</h3>
                <p className="text-zinc-400 text-sm">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save to Drive Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <Save size={24} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-zinc-100">Save Your Work?</h3>
            </div>
            <p className="text-zinc-300 mb-6">
              Would you like to save your code to Drive before leaving? This will download your work as app.py.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDrive}
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Save to Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursorMockup;

---
paths: cursor-mockup/src/**/*.{js,jsx,ts,tsx}
---

# React Frontend Rules

## Technology Stack
- React 18 with hooks
- Vite for dev server and build
- Tailwind CSS for styling
- Monaco Editor for code editing
- Lucide React for icons

## Component Structure
- Main component: `cursor-mockup/src/App.jsx`
- Use functional components with hooks
- Keep component in single file (no component splitting unless needed)

## State Management
- Use `useState` for component state
- Use `useRef` for DOM references (e.g., Monaco Editor)
- Use `useEffect` for side effects (auto-save, event listeners)

## Monaco Editor Integration
- Package: `@monaco-editor/react`
- Language: Python
- Theme: vs-dark
- Features: minimap, line numbers, syntax highlighting, auto-formatting

## Best Practices

### Code Persistence
- Auto-save to localStorage with 1-second debounce
- Load initial code from localStorage on mount
- Track unsaved changes state

### User Feedback
- Show loading modals for async operations
- Use visual indicators (spinners, status dots)
- Provide immediate feedback on user actions

### API Communication
```javascript
// Always use try-catch for API calls
try {
  const response = await fetch('http://localhost:8000/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, provider })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Show error to user
}
```

### Styling
- Use Tailwind utility classes
- Dark theme colors: bg-[#09090b], text-zinc-300
- Consistent spacing and borders
- Responsive design not required (desktop-focused IDE)

## File Organization
- Components: Keep in App.jsx unless too large
- Utilities: Extract code helpers (e.g., extractCode function)
- Constants: Keep in component file for now

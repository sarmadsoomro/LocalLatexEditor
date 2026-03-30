import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Local LaTeX Editor</h1>
      <p className="text-lg text-gray-600 mb-8">
        A lightweight LaTeX editor that runs entirely on your machine
      </p>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <p className="text-gray-700 mb-4">
          Frontend is running! This is the foundation for Phase 1.
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Count is {count}
        </button>
      </div>
      <p className="mt-8 text-sm text-gray-500">
        Edit src/App.tsx to start building the editor
      </p>
    </div>
  );
}

export default App;

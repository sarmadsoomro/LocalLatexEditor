import { useState, useEffect } from 'react';

export function AboutSection() {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    // Try to get version from package.json
    fetch('/package.json')
      .then(res => res.json())
      .then(data => setVersion(data.version || '1.0.0'))
      .catch(() => setVersion('1.0.0'));
  }, []);

  return (
    <div className="space-y-6 p-2">
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-md">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-heading">TexCraft</h2>
          <p className="text-muted">Local LaTeX Editor</p>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-surface rounded-lg p-4 border border-border">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Version</dt>
            <dd className="text-heading font-medium">{version}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">License</dt>
            <dd className="text-heading font-medium">MIT</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Author</dt>
            <dd className="text-heading font-medium">Sarmad Soomro</dd>
          </div>
        </dl>
      </div>

      {/* Description */}
      <p className="text-sm text-secondary leading-relaxed">
        TexCraft is a lightweight, browser-based LaTeX editing environment that runs entirely on your local machine. 
        Edit LaTeX documents with a professional editor, compile locally to PDF, and preview results instantly.
      </p>

      {/* Copyright */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-sm text-muted">
          Copyright (c) 2026 Sarmad Soomro. All rights reserved.
        </p>
      </div>

      {/* Links */}
      <div className="flex justify-center gap-4">
        <a
          href="https://github.com/sarmadsoomro/LocalLatexEditor"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
        </a>
        <span className="text-border">|</span>
        <a
          href="#"
          className="text-primary hover:text-primary-dark text-sm transition-colors"
        >
          Documentation
        </a>
      </div>
    </div>
  );
}

export default AboutSection;

/**
 * Bundle Monaco with the app instead of downloading it at runtime.
 *
 * @monaco-editor/react loads Monaco from cdn.jsdelivr.net unless it is given
 * a local copy, so without internet the editor never left "Loading editor…".
 * TexCraft must work offline, so we hand it the bundled monaco-editor.
 *
 * edcore.main is the editor with all its features (find/replace, folding,
 * multi-cursor, command palette, ...) but none of Monaco's ~80 built-in
 * languages. TexCraft only uses its own LaTeX and BibTeX tokenizers and
 * plain text, so this keeps the bundle much smaller than the full build.
 */
import { loader } from '@monaco-editor/react';
import 'monaco-editor/esm/vs/editor/edcore.main';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Only the generic editor worker is needed: no JSON/CSS/HTML/TS language services.
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco });

export { monaco };

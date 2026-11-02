import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const file = path.join(os.homedir(), '.latex-editor', '.session-token');
fs.rmSync(file, { force: true });

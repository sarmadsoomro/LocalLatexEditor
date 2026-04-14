const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/frontend/src/components/FileTree.tsx');
let content = fs.readFileSync(file, 'utf8');

// I will just read it entirely and then write a replacement script.

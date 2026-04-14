const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/frontend/src/pages/ProjectDetail.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the FileTree usage
content = content.replace(
  '<FileTree',
  '<FileTree\n              projectId={projectId}\n              onRefresh={() => loadProject(projectId)}'
);

fs.writeFileSync(file, content);

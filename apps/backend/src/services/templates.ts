export const templates: Record<string, string> = {
  article: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{Document Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
Your content here.

\\end{document}
`,

  report: `\\documentclass{report}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{Report Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\chapter{Introduction}
Your content here.

\\end{document}
`,

  book: `\\documentclass{book}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{Book Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\frontmatter
\\maketitle
\\tableofcontents

\\mainmatter
\\chapter{Introduction}
Your content here.

\\end{document}
`,

  beamer: `\\documentclass{beamer}
\\usetheme{Madrid}

\\title{Presentation Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\frame{\\titlepage}

\\begin{frame}
\\frametitle{First Slide}
Content here.
\\end{frame}

\\end{document}
`,

  letter: `\\documentclass{letter}
\\usepackage[utf8]{inputenc}

\\signature{Author Name}
\\address{Author Address}

\\begin{document}

\\begin{letter}{Recipient Address}
\\opening{Dear Recipient,}

Your letter content here.

\\closing{Sincerely,}

\\end{letter}

\\end{document}
`,

  empty: ``,
};

export function getTemplate(name: string): string {
  return templates[name] || templates.article;
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}

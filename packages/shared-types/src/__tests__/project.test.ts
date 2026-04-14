import { describe, it, expect } from 'vitest';
import type { Template, ProjectMetadata, ProjectSettings, ProjectWithMetadata } from '../project';
import type { Project } from '../index';

describe('Template type', () => {
  it('should accept valid template values', () => {
    const templates: Template[] = ['article', 'report', 'book', 'beamer', 'letter', 'empty'];
    expect(templates).toHaveLength(6);
  });
});

describe('ProjectMetadata interface', () => {
  it('should create metadata with required fields', () => {
    const metadata: ProjectMetadata = {
      mainFile: 'main.tex',
      template: 'article',
      fileCount: 1,
      totalSize: 1024,
    };

    expect(metadata.mainFile).toBe('main.tex');
    expect(metadata.template).toBe('article');
    expect(metadata.fileCount).toBe(1);
    expect(metadata.totalSize).toBe(1024);
    expect(metadata.lastOpened).toBeUndefined();
  });

  it('should accept optional lastOpened', () => {
    const metadata: ProjectMetadata = {
      mainFile: 'main.tex',
      template: 'report',
      lastOpened: new Date('2024-01-15'),
      fileCount: 5,
      totalSize: 5120,
    };

    expect(metadata.lastOpened).toBeInstanceOf(Date);
  });
});

describe('ProjectSettings interface', () => {
  it('should create settings with required fields', () => {
    const settings: ProjectSettings = {
      compiler: 'pdflatex',
      outputDirectory: './output',
    };

    expect(settings.compiler).toBe('pdflatex');
    expect(settings.outputDirectory).toBe('./output');
    expect(settings.bibliographyTool).toBeUndefined();
  });

  it('should accept all compiler types', () => {
    const compilers: ProjectSettings['compiler'][] = ['pdflatex', 'xelatex', 'lualatex'];
    expect(compilers).toHaveLength(3);
  });

  it('should accept optional bibliographyTool', () => {
    const settings: ProjectSettings = {
      compiler: 'xelatex',
      outputDirectory: './build',
      bibliographyTool: 'biber',
    };

    expect(settings.bibliographyTool).toBe('biber');
  });
});

describe('ProjectWithMetadata interface', () => {
  it('should extend Project with metadata and settings', () => {
    const baseProject: Project = {
      id: 'proj_123',
      name: 'Test Project',
      path: '/projects/test',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    const projectWithMetadata: ProjectWithMetadata = {
      ...baseProject,
      metadata: {
        mainFile: 'main.tex',
        template: 'article',
        fileCount: 1,
        totalSize: 1024,
      },
      settings: {
        compiler: 'pdflatex',
        outputDirectory: './output',
      },
    };

    expect(projectWithMetadata.id).toBe('proj_123');
    expect(projectWithMetadata.metadata.template).toBe('article');
    expect(projectWithMetadata.settings.compiler).toBe('pdflatex');
  });
});

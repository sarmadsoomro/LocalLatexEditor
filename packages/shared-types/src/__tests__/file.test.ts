import { describe, it, expect } from 'vitest';
import {
  type FileNode,
  type FileType,
  getFileTypeFromExtension,
  isEditableFile,
} from '../file';

describe('FileNode interface', () => {
  it('should create file node with required fields', () => {
    const node: FileNode = {
      id: 'file_1',
      name: 'main.tex',
      path: 'main.tex',
      type: 'file',
      modifiedAt: '2024-01-15T10:00:00Z',
    };

    expect(node.name).toBe('main.tex');
    expect(node.type).toBe('file');
  });

  it('should create directory node with children', () => {
    const node: FileNode = {
      id: 'dir_1',
      name: 'src',
      path: 'src',
      type: 'directory',
      modifiedAt: '2024-01-15T10:00:00Z',
      children: [
        {
          id: 'file_1',
          name: 'main.tex',
          path: 'src/main.tex',
          type: 'file',
          modifiedAt: '2024-01-15T10:00:00Z',
        },
      ],
    };

    expect(node.type).toBe('directory');
    expect(node.children).toHaveLength(1);
  });
});

describe('getFileTypeFromExtension', () => {
  it('should identify tex files', () => {
    expect(getFileTypeFromExtension('main.tex')).toBe('tex');
    expect(getFileTypeFromExtension('chapter.TEX')).toBe('tex');
  });

  it('should identify bib files', () => {
    expect(getFileTypeFromExtension('references.bib')).toBe('bib');
  });

  it('should identify cls files', () => {
    expect(getFileTypeFromExtension('thesis.cls')).toBe('cls');
  });

  it('should identify sty files', () => {
    expect(getFileTypeFromExtension('mystyle.sty')).toBe('sty');
  });

  it('should identify pdf files', () => {
    expect(getFileTypeFromExtension('output.pdf')).toBe('pdf');
  });

  it('should identify image files', () => {
    expect(getFileTypeFromExtension('figure.png')).toBe('image');
    expect(getFileTypeFromExtension('photo.jpg')).toBe('image');
    expect(getFileTypeFromExtension('image.jpeg')).toBe('image');
    expect(getFileTypeFromExtension('graph.svg')).toBe('image');
    expect(getFileTypeFromExtension('pic.gif')).toBe('image');
    expect(getFileTypeFromExtension('icon.bmp')).toBe('image');
    expect(getFileTypeFromExtension('modern.webp')).toBe('image');
  });

  it('should identify other files', () => {
    expect(getFileTypeFromExtension('readme.txt')).toBe('other');
    expect(getFileTypeFromExtension('data.json')).toBe('other');
    expect(getFileTypeFromExtension('noextension')).toBe('other');
  });
});

describe('isEditableFile', () => {
  it('should return true for editable file types', () => {
    expect(isEditableFile('tex')).toBe(true);
    expect(isEditableFile('bib')).toBe(true);
    expect(isEditableFile('cls')).toBe(true);
    expect(isEditableFile('sty')).toBe(true);
    expect(isEditableFile('other')).toBe(true);
  });

  it('should return false for non-editable file types', () => {
    expect(isEditableFile('pdf')).toBe(false);
    expect(isEditableFile('image')).toBe(false);
  });
});

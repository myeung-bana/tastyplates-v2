import fs from 'fs';
import path from 'path';

export interface MarkdownContent {
  title: string;
  content: string;
  lastUpdated: string;
}

/**
 * Converts markdown to HTML using marked library
 * Falls back to a simple markdown parser if marked is not available
 */
function markdownToHtml(markdown: string): string {
  try {
    // Try to use marked if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { marked } = require('marked');
    
    // Handle both marked v3 and v4+ APIs
    let html: string;
    
    if (typeof marked.parse === 'function') {
      // Marked v4+ API
      const renderer = {
        heading(text: string, level: number) {
          return `<h${level}>${text}</h${level}>`;
        },
      };
      
      html = marked.parse(markdown, {
        breaks: true,
        gfm: true,
        renderer: renderer as any,
      });
    } else {
      // Marked v3 API
      const renderer = new marked.Renderer();
      
      // Ensure headings render with proper hierarchy
      renderer.heading = function(text: string, level: number) {
        return `<h${level}>${text}</h${level}>`;
      };
      
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false, // Don't add IDs to headers
        mangle: false,
        renderer: renderer,
      });
      
      html = marked(markdown);
    }
    
    // Ensure we have proper HTML structure
    return html;
  } catch (error) {
    // Fallback: Simple markdown parser that handles basic hierarchy
    console.warn('marked library not found or error using it, using fallback parser. Install with: yarn add marked');
    return simpleMarkdownToHtml(markdown);
  }
}

/**
 * Simple markdown to HTML converter (fallback)
 * Handles headings, paragraphs, lists, bold, italic, and links with proper hierarchy
 */
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Remove the first h1 (title) since we extract it separately
  html = html.replace(/^#\s+(.+)$/m, '');
  
  // Convert links first (before other formatting)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert bold (**text** or __text__) - handle nested formatting
  // Do bold first, then italic to avoid conflicts
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Convert italic (*text* or _text_) - but not if it's part of bold
  // Process italic after bold to avoid conflicts, using a simple pattern
  html = html.replace(/([^*]|^)\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
  html = html.replace(/([^_]|^)_([^_\n]+)_([^_]|$)/g, '$1<em>$2</em>$3');
  
  // Process line by line to handle hierarchy properly
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inParagraph = false;
  let paragraphContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      // Close any open structures
      if (inList && listItems.length > 0) {
        processedLines.push('<ul>' + listItems.join('') + '</ul>');
        listItems = [];
        inList = false;
      }
      if (inParagraph && paragraphContent.length > 0) {
        processedLines.push('<p>' + paragraphContent.join(' ') + '</p>');
        paragraphContent = [];
        inParagraph = false;
      }
      continue;
    }
    
    // Check for headings (must be at start of line)
    if (trimmed.startsWith('#')) {
      // Close any open structures
      if (inList && listItems.length > 0) {
        processedLines.push('<ul>' + listItems.join('') + '</ul>');
        listItems = [];
        inList = false;
      }
      if (inParagraph && paragraphContent.length > 0) {
        processedLines.push('<p>' + paragraphContent.join(' ') + '</p>');
        paragraphContent = [];
        inParagraph = false;
      }
      
      // Convert headings
      if (trimmed.startsWith('###### ')) {
        processedLines.push('<h6>' + trimmed.substring(7) + '</h6>');
      } else if (trimmed.startsWith('##### ')) {
        processedLines.push('<h5>' + trimmed.substring(6) + '</h5>');
      } else if (trimmed.startsWith('#### ')) {
        processedLines.push('<h4>' + trimmed.substring(5) + '</h4>');
      } else if (trimmed.startsWith('### ')) {
        processedLines.push('<h3>' + trimmed.substring(4) + '</h3>');
      } else if (trimmed.startsWith('## ')) {
        processedLines.push('<h2>' + trimmed.substring(3) + '</h2>');
      } else if (trimmed.startsWith('# ')) {
        processedLines.push('<h1>' + trimmed.substring(2) + '</h1>');
      }
      continue;
    }
    
    // Check for list items (unordered: - or *, ordered: 1. 2. etc.)
    const unorderedListMatch = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    
    if (unorderedListMatch || orderedListMatch) {
      // Close paragraph if open
      if (inParagraph && paragraphContent.length > 0) {
        processedLines.push('<p>' + paragraphContent.join(' ') + '</p>');
        paragraphContent = [];
        inParagraph = false;
      }
      
      inList = true;
      const content = unorderedListMatch ? unorderedListMatch[1] : orderedListMatch![1];
      listItems.push('<li>' + content + '</li>');
      continue;
    }
    
    // Regular paragraph content
    if (inList && listItems.length > 0) {
      // Close list before starting paragraph
      processedLines.push('<ul>' + listItems.join('') + '</ul>');
      listItems = [];
      inList = false;
    }
    
    inParagraph = true;
    paragraphContent.push(trimmed);
  }
  
  // Close any remaining structures
  if (inList && listItems.length > 0) {
    processedLines.push('<ul>' + listItems.join('') + '</ul>');
  }
  if (inParagraph && paragraphContent.length > 0) {
    processedLines.push('<p>' + paragraphContent.join(' ') + '</p>');
  }
  
  html = processedLines.join('\n');
  
  // Clean up extra whitespace but preserve structure
  html = html.replace(/\n{3,}/g, '\n\n');
  
  return html.trim();
}

/**
 * Loads and parses markdown content from the content/legal directory
 * @param filename The markdown filename without extension (e.g., 'terms-of-service')
 * @returns Parsed markdown content with HTML conversion
 */
export async function loadMarkdownContent(filename: string): Promise<MarkdownContent> {
  try {
    // Construct the file path
    const filePath = path.join(process.cwd(), 'content', 'legal', `${filename}.md`);
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract title (first # heading) before converting to HTML
    const titleMatch = fileContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filename.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Extract last updated date
    const dateMatch = fileContent.match(/\*\*Last Updated:\*\*\s+(.+)/);
    const lastUpdated = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Convert markdown to HTML
    const htmlContent = markdownToHtml(fileContent);
    
    return {
      title,
      content: htmlContent,
      lastUpdated
    };
  } catch (error) {
    console.error(`Error loading markdown file: ${filename}`, error);
    throw new Error(`Failed to load content: ${filename}`);
  }
}

/**
 * Gets a list of available legal documents
 * @returns Array of available document filenames (without .md extension)
 */
export function getAvailableLegalDocuments(): string[] {
  try {
    const legalDir = path.join(process.cwd(), 'content', 'legal');
    const files = fs.readdirSync(legalDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    console.error('Error reading legal documents directory:', error);
    return [];
  }
}

/**
 * Server-side markdown loader for API routes
 * @param type The type of content ('terms', 'privacy', 'guidelines')
 * @returns Markdown content
 */
export async function getStaticContent(type: 'terms' | 'privacy' | 'guidelines'): Promise<MarkdownContent> {
  const filenameMap = {
    'terms': 'terms-of-service',
    'privacy': 'privacy-policy',
    'guidelines': 'content-guidelines'
  };
  
  const filename = filenameMap[type];
  if (!filename) {
    throw new Error(`Invalid content type: ${type}`);
  }
  
  return loadMarkdownContent(filename);
}


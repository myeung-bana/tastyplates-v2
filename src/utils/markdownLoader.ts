import fs from 'fs';
import path from 'path';

export interface MarkdownContent {
  title: string;
  content: string;
  lastUpdated: string;
}

/**
 * Loads and parses markdown content from the content/legal directory
 * @param filename The markdown filename without extension (e.g., 'terms-of-service')
 * @returns Parsed markdown content
 */
export async function loadMarkdownContent(filename: string): Promise<MarkdownContent> {
  try {
    // Construct the file path
    const filePath = path.join(process.cwd(), 'content', 'legal', `${filename}.md`);
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract title (first # heading)
    const titleMatch = fileContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filename.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Extract last updated date
    const dateMatch = fileContent.match(/\*\*Last Updated:\*\*\s+(.+)/);
    const lastUpdated = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return {
      title,
      content: fileContent,
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


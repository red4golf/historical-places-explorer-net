import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORIES_DIR = path.join(__dirname, '..', '..', 'content', 'stories');

export async function getStory(filename) {
    try {
        console.log('StoryService: Loading story:', filename);
        console.log('StoryService: Stories directory:', STORIES_DIR);
        
        const storyPath = path.join(STORIES_DIR, filename);
        console.log('StoryService: Full story path:', storyPath);
        
        const content = await fs.readFile(storyPath, 'utf8');
        console.log('StoryService: Successfully loaded story');
        
        // Parse frontmatter and content
        const { content: mainContent } = matter(content);
        return mainContent;
    } catch (error) {
        console.error('StoryService: Error loading story:', error);
        throw error;
    }
}
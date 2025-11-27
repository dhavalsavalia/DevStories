import matter from 'gray-matter';
import { Epic, EpicStatus } from '../types/epic';
import { Story, StorySize, StoryStatus, StoryType } from '../types/story';

export class Parser {
  static parseStory(content: string, filePath?: string): Story {
    const parsed = matter(content);
    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      throw new Error('Invalid frontmatter: No frontmatter found');
    }

    // Required fields
    if (!data.id || !data.title || !data.type || !data.epic || !data.status || !data.size || !data.created) {
      throw new Error('Missing required fields: id, title, type, epic, status, size, created');
    }

    return {
      id: data.id,
      title: data.title,
      type: data.type as StoryType,
      epic: data.epic,
      status: data.status as StoryStatus,
      sprint: data.sprint,
      size: data.size as StorySize,
      assignee: data.assignee,
      dependencies: data.dependencies || [],
      created: new Date(data.created),
      updated: data.updated ? new Date(data.updated) : undefined,
      content: parsed.content,
      filePath: filePath
    };
  }

  static parseEpic(content: string, filePath?: string): Epic {
    const parsed = matter(content);
    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      throw new Error('Invalid frontmatter: No frontmatter found');
    }

    if (!data.id || !data.title || !data.status || !data.created) {
      throw new Error('Missing required fields: id, title, status, created');
    }

    return {
      id: data.id,
      title: data.title,
      status: data.status as EpicStatus,
      sprint: data.sprint,
      created: new Date(data.created),
      updated: data.updated ? new Date(data.updated) : undefined,
      content: parsed.content,
      filePath: filePath
    };
  }
}

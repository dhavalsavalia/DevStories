import { LINK_PATTERN, resolveLinkPath } from '../utils/linkResolver';

/**
 * Represents a link match with position info
 */
export interface LinkMatch {
  id: string;
  start: number;
  end: number;
}

/**
 * Represents a resolved document link with target path
 */
export interface ResolvedLink {
  id: string;
  start: number;
  end: number;
  targetPath: string;
}

/**
 * Find all [[ID]] links in document text
 * Returns array of matches with position info
 */
export function findLinksInDocument(text: string): LinkMatch[] {
  const matches: LinkMatch[] = [];
  // Create new regex instance to reset lastIndex
  const regex = new RegExp(LINK_PATTERN.source, 'g');

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      id: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

/**
 * Create a resolved document link from a match
 * Returns null if the ID is not in knownIds (broken link)
 */
export function createDocumentLink(
  match: LinkMatch,
  basePath: string,
  knownIds: Set<string>
): ResolvedLink | null {
  if (!knownIds.has(match.id)) {
    return null;
  }

  const targetPath = resolveLinkPath(match.id, basePath);

  return {
    id: match.id,
    start: match.start,
    end: match.end,
    targetPath,
  };
}

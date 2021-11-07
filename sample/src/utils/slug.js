import { join } from 'path';
import postsDirectory from './postsDirectory';

const indexMdx = '/index.mdx';

export function splitSlug(slug = '') {
  return slug.split('/').filter((str) => str !== '');
}

export function joinSplitSlug(splitSlug = []) {
  return `/${splitSlug.join('/')}`;
}

export function filePathToSlug(filePath, postsDir = postsDirectory) {
  return filePath.substring(postsDir.length, filePath.length - indexMdx.length);
}

export function slugToFilePath(slug, postsDir = postsDirectory) {
  return join(postsDir, slug, indexMdx);
}

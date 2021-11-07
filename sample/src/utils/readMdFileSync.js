import { readFileSync } from 'fs';
import matter from 'gray-matter';

export const readMdFileSync = (filePath) => {
  const txt = readFileSync(filePath, 'utf8');
  return matter(txt);
};

export default readMdFileSync;

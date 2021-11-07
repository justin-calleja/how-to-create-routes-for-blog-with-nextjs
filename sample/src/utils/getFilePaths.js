import { readdirSync } from 'fs';
import { join, extname } from 'path';

/**
 * Reads given path and any directory in that path recursively.
 * Returns an array of absolute paths.
 * Only includes files whose extension matches one given in `extensions` arg,
 * or all files if `extensions` is undefined.
 *
 * @param {string} path
 * @param {string[]} [extensions]
 * @returns string[]
 */
export const getFilePaths = (path, extensions) => {
  const entries = readdirSync(path, { withFileTypes: true });

  return entries.reduce((acc, entry) => {
    if (entry.isDirectory()) {
      const moreFilePaths = getFilePaths(join(path, entry.name), extensions);
      acc.push(...moreFilePaths);
      return acc;
    }

    if (extensions === undefined || extensions.includes(extname(entry.name))) {
      acc.push(join(path, entry.name));
    }

    return acc;
  }, []);
};

export default getFilePaths;

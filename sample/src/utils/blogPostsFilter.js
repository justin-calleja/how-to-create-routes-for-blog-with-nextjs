export function blogPostsFilter({ draft, archive }) {
  if (process.env.NODE_ENV === 'production' && draft) return false;
  if (archive) return false;

  return true;
}

export default blogPostsFilter;

# how-to-create-routes-for-blog-with-nextjs
## What's this?

This is just me writing down notes while re-implementing this site in Next.js. I've put the sample covered in this post up on [github](https://github.com/justin-calleja/how-to-create-routes-for-blog-with-nextjs).

## Setup

`npx create-next-app@latest`

next version `11.1.2`

Create a dir to house posts and put some mdx files inside.

`mkdir -p src/mdx/posts`

Move `pages` dir under `src`.

## Desired structure of site

### `/` or "home page"

Should have info that can include things like:

- Self intro.
- About site.
  - Instructions on how to contribute / amend mistakes on this site via Github PRs.
- Links to "filter" page to link to what I'm currently working on e.g. `/filter?tags=game-dev,blog`

### `/blog/archive`, `/blog/archive/[pageNum]`, `/blog/archive/filter`

This is similar to `/blog` below but for posts I feel are outdated. The structure will be:

`/blog/archive` "home" page for archive section of site. It describes what's included here e.g. states that these posts are ones I feel are no longer worth including as part of my main blog under `/blog`. Some might even not make it under archive and e.g. I'd just have a link to the github `.mdx` file instead on the site.
Note that this "root archive page" will probably start the listing e.g. first 3 items.

`/blog/archive/1` begin first 10 posts in archive by reverse chronological order (newest first).
`/blog/archive/2` next 10 posts.
etc...

`/blog/archive/filter` is a dedicated page to filter posts under `/blog/archive` by `tags`. Each post will have one or more `tags` in its meta data. This page will provide some UI to be able to select / deselect tags and the listing of post titles should change based on this.
This page can also be directly accessed with pre-selected filters using query params.

### `/blog`, `/blog/[pageNum]`, `/blog/filter`

Similar to `/blog/archive` but for posts I think are not outdate / might have some value.

Again, I'd like `/blog` to have some general info and to start the listing with e.g. 3 items. `/blog/1` can list the e.g. next 10. These values can be made dyanmic via config later.

### `/blog/posts/[slug]`

This is the view for the post itself. All posts end up with this kind of URL regardless of whether they're under `/blog/archive` or `/blog`.

### Unsure strucutre for `series`

Later, if certain posts can be combined into something larger, it might be nice to have a "series" section in the site.

## Mdx files to rendered pages

The first problem I'd like to tackle is that of going from `mdx` file to rendering an actual page. I'm not planning on writing posts sprinkled too heavily with HTML, so this is critical.

I'll need to read the file system (FS) for the following 2 routes:

- `/blog/[pageNum]` The listing of posts. I'll need to know the meta data for the various posts and how many to include for a given page under this route (i.e. for a given value of `pageNum`).
- `/blog/posts/[published-year]/[title]` An actual post and it's content.

And similarly for the `archive` one.

### Some background knowledge

Before proceeding, note that I do not intend to have a server running for this project i.e. anything in Next.js that deals with server-side rendering (SSR) is out. Also, lets briefly go over the following 2 functions from Next.js:

[getStaticProps](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) - (Static Generation): Fetch data at build time. e.g. when rendering an `mdx` file as a page of this site, I'll need to read the file system to get the content and meta-data for the page (post) in question. `getStaticProps` is where I'll need to do that in.

[getStaticPaths](https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation) - (Static Generation): Specify dynamic routes to pre-render pages based on data. i.e. since the site has no server and no dynamic content; I'm going to have to specify, up-front, the pages Next.js needs to render to static HTML files in it's build step so I can take these files and deploy them somewhere. For a given **dynamic route**, this function is where I can sepcify which routes (pages) to render for that dynaic route.

In my case, the **dynamic route** I'm interested in implementing is an [optional catch all route](https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes). This is because I want to have a `Page` that will render for routes `/blog`, `/blog/1`, `/blog/2` etc???

### `/blog/[[...pageNum]]` part 1

UI (styles etc...) aside; to start implementing the listing of blog posts, I'll create the following 2 file `pages/blog/[[...pageNum]].js` and `src/api.js`.

`pages/blog/[[...pageNum]].js` is a Page file - i.e. it returns the React component to render for a specific route (URL). Moreover, it's a Page with a dynamic route (optional catch all), which means the `pageNum` will need to be supplied somehow.

`src/api.js` is where I intend to keep the FS reading functions I'll need to use in the special Next.js functions that can be defined when defining Page components.

#### Structure of posts in file system

The way I'd like to namespace posts is by year in which they were written. I don't expect to have any duplicate post titles; so they could all be under one directory really; but I don't want to have one directory with a massive number of sub-directories in it (one for each post). Splitting it up by year seems like a good idea.

Each post will have its own directory in which the post's `index.mdx` and associated image files or SVGs etc... can be grouped.

I've added some dummy posts to the `sample` repo under `sample/src/posts/mdx`.

### `/blog/[[...pageNum]]` part 2

With the following in `pages/blog/[[...pageNum]].js`:

```jsx
const PostsList = (props) => {
  console.log(">> PostsList props:", props)
  return <div>this is PostsList</div>
}

export async function getStaticProps(context) {
  console.log(">> PostsList getStaticProps context:", context)
  return {
    props: { dummyData: 1 },
  }
}

export async function getStaticPaths() {
  // TODO: need the total number of posts in blog

  return {
    paths: [
      { params: { pageNum: [] } },
      { params: { pageNum: ["1"] } },
      { params: { pageNum: ["2"] } },
    ],
    fallback: false,
  }
}

export default PostsList
```

I'm able to load `/blog`, `/blog/1` and `/blog/2`. Inspecting the browser's console I can see `PostsList`'s props, and inspecting the server's console, I can also see the `context` supplied to `getStaticProps`.

#### getAllPosts

As mentioned in the `TODO` comment in `getStaticPaths` above; I need a way to get the total number of posts in the blog.

Building this up piecemeal will take a while, so I'm just pasting the final version `api.js`:

```js
export function getPost(fields = [], filePath) {
  const { content, data } = readMdFileSync(filePath)

  const post = fields.reduce((acc, field) => {
    if (typeof data[field] !== "undefined") {
      acc[field] = data[field]
    }
    return acc
  }, {})

  if (fields.includes("content")) {
    post.content = content
  }

  return post
}

export function getIndexMdxFilePaths(postsDir = postsDirectory) {
  return getFilePaths(postsDir, [".mdx"]).filter((path) =>
    path.endsWith("index.mdx"),
  )
}

/**
 * Reads all the index.mdx files under the given `postsDir` directory,
 * and for each such file found, returns an Object with that file's meta data
 * (frontmatter), and content.
 *
 * At a bare minimum, each Object will have a `slug` property.
 * The file system path from given `postsDir` up to, but not including, index.mdx will be
 * used as the slug.
 *
 * e.g. <path-to-project>/src/mdx/posts/2021/some-post/index.mdx
 * will get a slug property of '/2021/some-post'.
 *
 * Any meta-data matching entries in the given fields (optional: string[]) will
 * be picked up and returned in the given Object corresponding to each post.
 *
 * NOTE: including 'content' in `fields` param returns each post's content.
 *
 * Returns and array of Objects.
 *
 * @param {string[]} fields
 * @param {string[]} [postsDir]
 * @returns Object[]
 */
export function getAllPosts(fields = [], postsDir = postsDirectory) {
  const mdxFilePaths = getIndexMdxFilePaths(postsDir)

  return mdxFilePaths.map((filePath) => {
    const post = getPost(fields, filePath)
    post.slug = filePathToSlug(filePath, postsDir)
    return post
  })
}
```

The gist is that `getAllPosts` is retrieving an Object for every post in the `postsDir`, and that Object will have at least the `slug` property, plus any proprety whose name is present in both the post's meta-data (YAML frontmatter) and `getAllPosts`'s `fields` argument (where `'content'` in `fields` arg means the blog post's actual content - as per the `'gray-matter'` node module being used).

So for e.g., I can call `getAllPosts(['draft', 'archive'])` to get the slugs for each post, as well as the additional meta data of `draft` and `archive` if present in the frontmatter. `draft`, together with `process.env.NODE_ENV`, can be used to know whether to include a post (it should be included when in `'development'`). Since we're dealing with `/blog/[[...pageNum]]` here, `archive` can be use to straight out ignore the entry.

Take a look at `sample/__tests__/getAllPosts.test.js` to get an idea of what is returned by this function.

### `/blog/[[...pageNum]]` part 3

With the `api.js` file done; it can now be used in `src/pages//blog/[[...pageNum]].js`.

To generate the correct number of pages, I'll need the total pages, the number of posts to list on the first page (`/blog`), and the number of posts to list per page:

```js
export async function getStaticPaths() {
  const allPosts = getAllPosts(["draft", "archive"])
  const blogPosts = allPosts.filter(blogPostsFilter)

  // TODO: get from config:
  const maxPostsOnBlogHomePage = 2
  const maxPostsPerPage = 4

  return {
    paths: getBlogPostPagesPathParams({
      numOfBlogPosts: blogPosts.length,
      maxPostsOnBlogHomePage,
      maxPostsPerPage,
    }),
    fallback: false,
  }
}

// src/utils/blogPostsFilter.js
export function blogPostsFilter({ draft, archive }) {
  if (process.env.NODE_ENV === "production" && draft) return false
  if (archive) return false

  return true
}

// src/utils/getBlogPostPagesPathParams.js
export function getBlogPostPagesPathParams({
  numOfBlogPosts,
  maxPostsOnBlogHomePage,
  maxPostsPerPage,
}) {
  const result = [{ params: { pageNum: [] } }]
  let postsLeft = numOfBlogPosts - maxPostsOnBlogHomePage

  if (postsLeft <= 0) return result

  let pageNum = 0

  do {
    pageNum++
    postsLeft -= maxPostsPerPage
    result.push({ params: { pageNum: [pageNum.toString()] } })
  } while (postsLeft > 0)

  return result
}
```

### `/blog/[[...pageNum]]` part 4

With the correct number of pages being generated, it's now time to pass in the data to each individual page via `getStaticProps`.

1. Given `pageNum`, which posts should be passed in as props for a given page?
1. For each post, what data is needed e.g. `title`, `creationDate`

For pt number 2, I'll just pick some sensible data like the `excerpt` (if there is), whether it's a `draft` to maybe add some styles, and `title`.

Pt 1 is going to require some logic:

```jsx
export async function getStaticProps(context) {
  const {
    params: { pageNum },
  } = context

  const pageIndex = toNumber(pageNum)
  if (pageIndex < 0) {
    throw new Error("Cannot work with a negative pageIndex.")
  }

  const blogPosts = getAllPosts([
    "draft",
    "archive",
    "excerpt",
    "title",
    // if 'excerpt' is missing, 'content' can be used instead:
    "content",
  ]).filter(blogPostsFilter)

  const { maxPostsOnBlogHomePage, maxPostsPerPage } = config
  const numOfPages = getNumOfPages({
    postsOnFirstPage: maxPostsOnBlogHomePage,
    postsPerPage: maxPostsPerPage,
    total: blogPosts.length,
  })

  if (pageIndex === 0) {
    return {
      props: {
        numOfPages,
        pageIndex,
        posts: blogPosts.slice(0, maxPostsOnBlogHomePage),
      },
    }
  }

  const remainingBlogPosts = blogPosts.slice(maxPostsOnBlogHomePage)

  return {
    props: {
      numOfPages,
      pageIndex,
      posts: remainingBlogPosts.slice(
        (pageIndex - 1) * maxPostsPerPage,
        pageIndex * maxPostsPerPage,
      ),
    },
  }
}

// src/utils/toNumber.js
export function toNumber(x) {
  if (Array.isArray(x)) return parseInt(x[0])
  if (x === undefined) return 0
  if (typeof x === "string") return parseInt(x)

  return 0
}

// src/utils/getNumOfPages.js
export function getNumOfPages({ total, postsOnFirstPage, postsPerPage }) {
  let remainingNumOfPosts = total - postsOnFirstPage

  return remainingNumOfPosts <= 0
    ? 1
    : Math.ceil(remainingNumOfPosts / postsPerPage) + 1
}
```

The code should be straightforward enough. Though I don't expect a `string`, `toNumber` caters for that too. `toNumber` is first used to get a number for the page index (`pageNum`) returned by `getStaticPaths` for this path (which should be a string representation of a number >= to 0).

The posts with the relevant data are retrieved, and then, depending on the page being rendered, different props are returned, namely, the `posts` to render on that page, and the current `pageIndex` (from which links to previous and next pages can be created).

### `/blog/[[...pageNum]]` part 5 - rendering

This post isn't about the UI, but here's something to put in the component to have something to render:

```jsx
const PostsList = (props) => {
  const { numOfPages, pageIndex, posts } = props

  const postEls = posts.map(({ title, excerpt, content, draft, slug }, i) => (
    <Link key={i} href={`/blog/posts${slug}`}>
      <a className="post-item">
        <h3>{title}</h3>
        {draft && <p style={{ color: "red" }}>This is still a draft.</p>}
        <p>{excerpt ? excerpt : `${content.substring(0, 55)}...`}</p>
      </a>
    </Link>
  ))

  const prevHref = pageIndex === 1 ? "/blog" : `/blog/${pageIndex - 1}`
  const nextHref = pageIndex + 1 < numOfPages ? `/blog/${pageIndex + 1}` : null

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {postEls}
      <div style={{ marginTop: "16px" }}>
        {pageIndex > 0 && (
          <Link href={prevHref}>
            <a style={{ color: "blue", textDecoration: "underline" }}>
              Previous
            </a>
          </Link>
        )}
        <span style={{ margin: "0 16px", fontSize: "1.2rem" }}>
          Page {pageIndex}
        </span>
        {nextHref && (
          <Link href={nextHref}>
            <a style={{ color: "blue", textDecoration: "underline" }}>Next</a>
          </Link>
        )}
      </div>
    </div>
  )
}
```

### Sorting

Actually, there's one thing I forgot, and that's to sort the posts in reverse chronological order (and keep drafts first). To do this, I'll implement a sorting function:

```js
/**
 * > 0 means sort b before a
 * < 0 means sort a before b
 * 0 means keep original order
 *
 * @param {string} [dateStrA]
 * @param {string} [dateStrB]
 * @returns number
 */

export const sortStringDates = (dateStrA, dateStrB) => {
  if (!dateStrA) {
    // If B is defined but A isn't; A before B to keep drafts first
    return !dateStrB ? 0 : -1
  }

  // at this point, A is defined, so if B isn't, then B before A to keep drafts first
  if (!dateStrB) {
    return 1
  }

  return new Date(dateStrA) < new Date(dateStrB) ? 1 : -1
}
```

??? which can now be used in `getStaticProps` to sort the filtered posts before deciding which to choose for the page in question:

```jsx
export async function getStaticProps(context) {
  // ...

  const blogPosts = getAllPosts([
    "dateCreated", // NOTE: also need to pick 'dateCreated'
    "draft",
    "archive",
    "excerpt",
    "title",
    // if 'excerpt' is missing, 'content' can be used instead:
    "content",
  ])
    .filter(blogPostsFilter)
    .sort((postA, postB) =>
      sortStringDates(postA.dateCreated, postB.dateCreated),
    )

  // if pageIndex is 0, take first maxPostsONBlogHomePage
  // ...

  // if pageIndex > 0, slice blogPosts appropriately
  // ...
}
```

## Rendering the blog post itself

So far so good. What's left is handling the page to render the blog post itself (or rather; the definition of the dynamic route file to handle static site generation (SSG) of **all** blog posts ahead of time before deployment).

A link to each page has already been set up via use of the `slug` when rendering the `PostsList` component:

```jsx
<Link key={i} href={`/blog/posts${slug}`}>
  {/* ... */}
</Link>
```

What's left is a new dynamic route at: `pages/blog/posts/[...slug].js`. The `slug` needs to be an array of strings??? which means a little hacking around to go from "the slug of `getAllPosts`" to "the dynamic, catch-all, route slug param":

```jsx
export async function getStaticPaths() {
  const posts = getAllPosts()

  return {
    paths: posts.map((post) => ({
      params: {
        slug: splitSlug(post.slug),
      },
    })),
    fallback: false,
  }
}

// sample/src/utils/slug.js
export function splitSlug(slug = "") {
  return slug.split("/").filter((str) => str !== "")
}
```

i.e. basically changing a string like `/2020/post-a` into `["2020", "post-a"]`.

With that out of the way, the props (content) for each post can finally be generated in `getStaticProps` using `next-mdx-remote`'s `serialize`:

`npm i next-mdx-remote`

```jsx
import { serialize } from "next-mdx-remote/serialize"

export async function getStaticProps({ params }) {
  const slug = joinSplitSlug(params.slug)
  const filePath = slugToFilePath(slug)

  const post = getPost(["title", "dateCreated", "content", "draft"], filePath)

  // Overwrite the content:
  const mdxSource = await serialize(post.content)
  post.content = mdxSource

  return {
    props: { post },
  }
}

// sample/src/utils/slug.js
export function joinSplitSlug(splitSlug = []) {
  return `/${splitSlug.join("/")}`
}
```

So we go back from `["2020", "post-a"]` (required to generate all posts), to `/2020/post-a` (required to actually read the file on our file system) - and pass the post's `content` to `serialize` to go from `mdx` to `html`.

Then we can render the blog posts with something like:

```jsx
import { MDXRemote } from "next-mdx-remote"

const components = {
  CurrentYear: () => {
    return <span>{new Date().getFullYear()}</span>
  },
}

const Post = (props) => {
  const {
    post: { title, content, dateCreated },
  } = props

  return (
    <div>
      <div>
        Title is:<span style={{ marginLeft: "4px" }}>{title}</span>
      </div>
      <div>
        Created on:<span style={{ marginLeft: "4px" }}>{dateCreated}</span>
      </div>
      <MDXRemote {...content} components={components} />
    </div>
  )
}
```

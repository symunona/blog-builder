### What is this?

Create multiple statically generated blogs with 11ty with an opinionated structure,
being able to abstract away the parts that are similar/same on all, but leaving it
up for customization.

### The problem

I have multiple blogs. The content is coming directly from my obsidian vault
with [my exporter plugin](https://github.com/symunona/obsidian-bulk-exporter).

I realized that I am using the same templates over and over again, so
instead of copy-pasting the same eleventy blog-base repo, I create my own defaults,
here, under the `cpy` folder.

When a blog wants to overwrite one of the defaults, just have that file, the builder will ignore.

### Solution

In order to generate blogs, we need:
- content (from Obsidian, with the Bulk Exporter)
- templates defaults that are the same in all of them.
- templates and config per blog

1. Scrape through the data folders
2. Find the indexes (blog.md)
3. Build the blogs around them:

4. MERGE content and templates into the same structure
5. COMPILE the output blogs
6. COMMIT & PUSH as a manual approval gate (?)

### Usage

`ts-node index.ts /path/to/blog/root`

It will find all the `blog.md` files and based on
their front-matter will merge into it.

### Expected Folder Structure

11ty comes with a structure you want to consider following. I use this:
```
posts/     <- default post dir
  - entry1
  - entry2
  - ...
_includes/
  - base.njk   <- the main HTML structure
```



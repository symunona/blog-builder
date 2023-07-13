### 11ty

It looked like a good idea at the time to create multiple
blogs with an opinionated structure, how I'd like to see my texts
organized.

Still thinking about a better abstraction, but probably 11ty got it right after being at it a couple of hours.

---

### The problem
I have multiple blogs, whose content is coming from my obsidian vault with my exporter plugin.
I want to create separate blogs of these topics using 11ty.

In order to generate blogs, we need:
- content (from Obsidian, with the Bulk Exporter)
- templates and config per blog

Step 1: MERGE content and templates
Step 2: COMPILE the output blogs
Step 3: COMMIT & PUSH manual approval gate (?)

First, I need a simple script that copies over the config and template files, merges the content together

Then just run a compile, maybe even use github actions to do so.

### Solution

1.- Scrape through the data folders
2.- Find the indexes
3.- Build the blogs around them

I realized that I am using the same templates over and over again, so instead of copy-pasting the same eleventy blog-base repo, I create my own defaults.

This repo contains that.
When a blog wants to overwrite one of the defaults, just have that file, the builder will ignore.


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



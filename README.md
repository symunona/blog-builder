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



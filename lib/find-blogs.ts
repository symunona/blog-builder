/**
 * Finds blogs in a given folder.
 * Looks in folders that are no further down than `depth`.
 * When it finds a .blogrc file, it stops, adds it to the list
 * and stops scanning the subtree.
 * No nested blogs are supported.
 */

const fs = require('fs')
const path = require('path')

export const BLOG_CONFIG_FILE = 'blog.md'

/**
 * Returns a list of blogs.
 * @param {*} dir
 * @param {*} depth
 * @returns Array of Paths
 */
export function findBlogs(dir: string, depth?: Number): Array<string> {
    let foldersOnThisLevel: Array<string> = []

    // If depth is -1, that's the no limit value, just keep going.
    // If we had higher value, let's juts keep going.
    // If we have zero, only then stop, as we reached the bottom.
    if (depth === 0) { return []; }

    // Iterate through the folder. Break if the .blogrc file is found
    let isThisFolderABlog = fs.readdirSync(dir).find((file: string) => {

        // builds full path of file
        const fPath: string = path.resolve(dir, file)
        if (fPath.endsWith(BLOG_CONFIG_FILE)) {
            return true
        }

        try {
            // Filter folders that start with a dot (.)
            if (file[0] === '.') { return false; }

            // is the file a directory ?
            if (fs.statSync(fPath).isDirectory()) {
                foldersOnThisLevel.push(fPath);
            }
        }
        catch (e) {
            // This may happen on permission errors.
        }
    });

    if (isThisFolderABlog) {
        return [dir]
    }

    let blogsFound: Array<string> = []

    foldersOnThisLevel.forEach((subDir) => {
        blogsFound = blogsFound.concat(findBlogs(subDir, typeof depth === 'number' ? depth - 1 : -1))
    })
    return blogsFound
};

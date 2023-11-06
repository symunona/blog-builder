"use strict";
/**
 * Finds blogs in a given folder.
 * Looks in folders that are no further down than `depth`.
 * When it finds a .blogrc file, it stops, adds it to the list
 * and stops scanning the subtree.
 * No nested blogs are supported.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBlogs = exports.BLOG_CONFIG_FILE = void 0;
var fs = require('fs');
var path = require('path');
exports.BLOG_CONFIG_FILE = 'blog.md';
/**
 * Returns a list of blogs.
 * @param {*} dir
 * @param {*} depth
 * @returns Array of Paths
 */
function findBlogs(dir, depth) {
    var foldersOnThisLevel = [];
    // If depth is -1, that's the no limit value, just keep going.
    // If we had higher value, let's juts keep going.
    // If we have zero, only then stop, as we reached the bottom.
    if (depth === 0) {
        return [];
    }
    // Iterate through the folder. Break if the .blogrc file is found
    var isThisFolderABlog = fs.readdirSync(dir).find(function (file) {
        // builds full path of file
        var fPath = path.resolve(dir, file);
        if (fPath.endsWith(exports.BLOG_CONFIG_FILE)) {
            return true;
        }
        try {
            // Filter folders that start with a dot (.)
            if (file[0] === '.') {
                return false;
            }
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
        return [dir];
    }
    var blogsFound = [];
    foldersOnThisLevel.forEach(function (subDir) {
        blogsFound = blogsFound.concat(findBlogs(subDir, typeof depth === 'number' ? depth - 1 : -1));
    });
    return blogsFound;
}
exports.findBlogs = findBlogs;
;

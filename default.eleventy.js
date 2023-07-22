/**
 * Default config file to be extended per blog basis.
 * @param {eleventyConfig} config
 */

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");
const { IMAGE_IN_HTML_LINK } = require("./lib/regex-urls");
const { default: replaceAll } = require("./lib/replace-all");


module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(pluginSyntaxHighlight);
    eleventyConfig.addPlugin(pluginNavigation);
    eleventyConfig.addPlugin(pluginRss);

    eleventyConfig.ignores.add('**/node_modules/**')
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd'); ``
    });
    eleventyConfig.addFilter("readableDate", dateObj => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat("dd LLL yyyy");
    });
    function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
    }

    /**
     * Separate folders are being created for every post. As the
     * exporter puts the attachments into the posts/assets, we need to
     * map them to the absolute URL.
     * This is not an ideal solution.
     */
    eleventyConfig.addFilter('urlAbsolute', function (value) {
        const found = value.val.match(IMAGE_IN_HTML_LINK)
        let ret = value.val
        let root = this.ctx.page.filePathStem.substring(0, this.ctx.page.filePathStem.lastIndexOf('/'))
        if (!root.endsWith('/')) {
            root += '/'
        }
        if (found) {
            // Convert relative path to absolute URL
            found.forEach((link) => {
                const withoutApostrophes = link.substring(1, link.length - 1)
                let abs = withoutApostrophes.startsWith('http') ? withoutApostrophes : root + withoutApostrophes;
                console.warn('link:', withoutApostrophes, '->', abs)
                ret = replaceAll(link, ret, abs)
            })

            value.val = ret;
        }

        return value;
    });

    eleventyConfig.addFilter("filterTagList", filterTagList)

    return eleventyConfig

}

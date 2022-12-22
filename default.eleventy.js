/**
 * Default config file to be extended per blog basis.
 * @param {eleventyConfig} config
 */

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");


module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(pluginSyntaxHighlight);
    eleventyConfig.addPlugin(pluginNavigation);
    eleventyConfig.addPlugin(pluginRss);

    eleventyConfig.ignores.add('**/node_modules/**')
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
    });
    eleventyConfig.addFilter("readableDate", dateObj => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat("dd LLL yyyy");
    });
    function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
    }

    eleventyConfig.addFilter("filterTagList", filterTagList)

    return eleventyConfig

}

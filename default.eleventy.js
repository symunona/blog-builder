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
const { existsSync } = require("fs");
const { join } = require("path");
const cheerio = require('cheerio');


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
        let ret = value.val
        const root = this.ctx.blogRoot
        let rootOfFile = root +
            this.ctx.page.filePathStem.substring(0,
                this.ctx.page.filePathStem.lastIndexOf('/'))
        if (!rootOfFile.endsWith('/')) { rootOfFile += '/' }

        // Replace Local Relative links!
        const $ = cheerio.load(value.val)
        const hrefValues = $('a').map((index, element) => {return {
            href: $(element).attr('href'),
            element
        }}).get();

        console.log(' [ROOT]', hrefValues.length, root, rootOfFile)

        for(let i = 0; i < hrefValues.length; i++){
            const link = hrefValues[i]

            if (link.href && link.href !== '/' && !link.href.startsWith('http')){
                let relativeLink = removeOverlap(root, link.href)
                if (!relativeLink.startsWith('/')){
                    relativeLink = '/' + relativeLink
                }
                $(link.element).attr('href', relativeLink);
                console.log('   [LINK] local: ', relativeLink)
            }
        }
        ret = $.html()

        const foundImages = value.val.match(IMAGE_IN_HTML_LINK)
        if (foundImages) {
            // Convert relative path to absolute URL
            foundImages.forEach((link) => {
                const withoutApostrophes = link.substring(1, link.length - 1)
                if (withoutApostrophes.startsWith('http')) {
                    // console.log('[LINK0] absolute', withoutApostrophes)
                    return;
                }

                const guessAbsoluteForImageResource = join(root, withoutApostrophes)
                const guessRelativeForImageResource = join(rootOfFile, withoutApostrophes)
                const guessPostForImageResource = join(root, 'posts', withoutApostrophes)

                if (existsSync(guessAbsoluteForImageResource)) {
                    ret = replaceAll(link, ret, relativeToRoot(guessAbsoluteForImageResource, root))
                    // console.log('[LINK1] ', guessAbsoluteForImageResource)
                } else if (existsSync(guessRelativeForImageResource)) {
                    ret = replaceAll(link, ret, relativeToRoot(guessRelativeForImageResource, root))
                    // console.log('[LINK2] ', guessAbsoluteForImageResource)
                } else if (existsSync(guessPostForImageResource)) {
                    ret = replaceAll(link, ret, relativeToRoot(guessPostForImageResource, root))
                    // console.log('[LINK3] ', relativeToRoot(guessPostForImageResource, root))
                } else {
                    console.error(`File not found in any locations: ${withoutApostrophes.substring(0, 30)}`)
                    // console.log('guessAbsoluteForImageResource:',guessAbsoluteForImageResource.substring(0, 30))
                    // console.log('guessRelativeForImageResource:',guessRelativeForImageResource.substring(0, 30))
                    // console.log('guessPostForImageResource:',guessPostForImageResource.substring(0, 30))
                }
            })

            value.val = ret;
        }

        return value;
    });

    eleventyConfig.addFilter("filterTagList", filterTagList)

    return eleventyConfig

}


function findCommonStartingPart(str1, str2) {
    let commonPart = '';
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) {
            commonPart += str1[i];
        } else {
            break;
        }
    }

    return commonPart;
}

function relativeToRoot(fullPath, root) {
    return fullPath.substring(root.length)
}

/**
 * @param {String} firstString
 * @param {String} secondString
 * @returns {String}
 */
function removeOverlap(firstString, secondString) {
    // Find the overlapping part
    let i = firstString.length;
    while(!secondString.startsWith(firstString.substring(firstString.length - i)) && i > 0){ i-- }
    return secondString.substring(i)
}

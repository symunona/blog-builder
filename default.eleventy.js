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

    eleventyConfig.addShortcode('logFile', function(file) {
        console.log('logFile', file);
        return ""; // Return an empty string so nothing is added to the template
    });

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

        for(let i = 0; i < hrefValues.length; i++){
            const link = hrefValues[i]

            if (link.href && link.href !== '/' && !link.href.startsWith('http') && !link.href.startsWith('//')){
                let relativeLink = makeAbs(link.href)
                $(link.element).attr('href', relativeLink);
                console.log('   [LINK] local: ', relativeLink)
            }
        }

        // From Markdown, by default eleventy renders img tags. Instead
        // of images, we need to check what to do with the embed if it's
        // a certain streaming provider. As everything is on youtube,
        // this just works for youtube now, matching the link, using
        // a dummy method to replace the actual image to a youtube embed.

        const imgHrefs = $('img').map((index, element) => {return {
            src: $(element).attr('src'),
            element
        }}).get();

        for(let i = 0; i < imgHrefs.length; i++) {
            const img = imgHrefs[i]
            // Replace all youtube
            if (img.src.indexOf('youtube.com') > -1){
                // This is a video embed, replace!
                const videoId = img.src.split('watch?v=')[1]
                // console.warn('   [YouTube Embed] ', img.src, videoId)
                $(img.element).after(`<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}"></iframe>`)
                $(img.element).remove()
            }
        }

        ret = $.html()


        // Replace all local images
        const foundImages = value.val.match(IMAGE_IN_HTML_LINK)
        if (foundImages) {
            // Convert relative path to absolute URL
            foundImages.forEach((link) => {

                let withoutApostrophes = link.substring(1, link.length - 1)
                withoutApostrophes = withoutApostrophes.substring(withoutApostrophes.lastIndexOf('"') + 1);

                if (withoutApostrophes.startsWith('http') || withoutApostrophes.startsWith('data:')) {
                    // console.log('[LINK0] absolute', withoutApostrophes)
                    return;
                }

                const guessAbsoluteForImageResource = join(root, withoutApostrophes)
                const guessRelativeForImageResource = join(rootOfFile, withoutApostrophes)
                const guessPostForImageResource = join(root, 'posts', withoutApostrophes)

                if (existsSync(guessAbsoluteForImageResource)) {
                    ret = replaceAll(withoutApostrophes, ret, makeAbs(relativeToRoot(guessAbsoluteForImageResource, root)))
                    console.log('   [IMG1] ', guessAbsoluteForImageResource)
                } else if (existsSync(guessRelativeForImageResource)) {
                    ret = replaceAll(withoutApostrophes, ret, makeAbs(relativeToRoot(guessRelativeForImageResource, root)))
                    console.log('   [IMG2] ', guessAbsoluteForImageResource)
                } else if (existsSync(guessPostForImageResource)) {
                    ret = replaceAll(withoutApostrophes, ret, makeAbs(relativeToRoot(guessPostForImageResource, root)))
                    console.log('   [IMG3] ', relativeToRoot(guessPostForImageResource, root))
                } else {
                    console.error(`  [IMG LINK ERROR] File not found in any locations: ${withoutApostrophes.substring(0, 30)}`)
                    console.log('IMG LINK', link)
                    // console.log('guessAbsoluteForImageResource:',guessAbsoluteForImageResource.substring(0, 30))
                    // console.log('guessRelativeForImageResource:',guessRelativeForImageResource.substring(0, 30))
                    // console.log('guessPostForImageResource:',guessPostForImageResource.substring(0, 30))
                }
            })
        }
        value.val = ret;

        return value;
    });

    eleventyConfig.addFilter("filterTagList", filterTagList)

    return eleventyConfig

}

function makeAbs(relativeLink){
    if (!relativeLink.startsWith('/')){
        relativeLink = '/' + relativeLink
    }
    return relativeLink
}

function relativeToRoot(fullPath, root) {
    return fullPath.substring(root.length)
}

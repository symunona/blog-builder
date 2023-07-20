const path = require('node:path')
const Eleventy = require('@11ty/eleventy')
const glob = require('glob')
const fm = require('front-matter')

const CREATED_FILE_LIST_RESTORE = '.fileToDelete'

import { readFileSync, existsSync, copyFileSync, unlinkSync, mkdirSync, rmdirSync, writeFileSync } from 'fs'

// Find blogs in tree given
// Iterate through a folder structure recursively
import { findBlogs, BLOG_CONFIG_FILE } from './lib/find-blogs'

import { generateApacheConfig } from './lib/config-writer'
import { join } from 'path'

const defaultConfigGenerator = require('./default.eleventy.js')

// Use this for resolving default templates.
const builderRootPath = process.cwd()

class GenericConfig {
	watch: boolean = true
	generateApacheConfig: boolean = true
	// urlRoot = '.tmpx.space'
	urlRoot = '.blog.localhost'
}

class OutputDirConfig {
	input: string
	includes: string
	data: string
	output: string
}

class SiteConfig {
	inputDir: string = '.'
	outDir: string = '_site'
	configPath?: string
	pathPrefix?: string
	templateFormats?: string[]
	debug: boolean

	staticPassThrough?: Array<String>

	config?: Function

	ignoreGlobal?: boolean
	passthroughCopy?: string | string[] | { [key: string]: string }

	dir: OutputDirConfig

	publicAddress?: string
	constructor(options?: any) {
		Object.assign(this, options)
	}
}


export type SiteSpec = string | [string, SiteConfig]

// TODO parse this from the input!
const envSettings: GenericConfig = new GenericConfig();

function makeBlogs() {
	let pathToFindBlogs: string = process.argv[2]
	if (!pathToFindBlogs) {
		pathToFindBlogs = process.cwd()
		console.warn('No path is provided, using cwd: ', process.cwd())
	} else {
		console.log(`Scanning ${pathToFindBlogs} for blogs...`)
	}
	let blogs: Array<string> = findBlogs(pathToFindBlogs)
	if (!blogs.length) {
		console.log('No blogs found. Bailing.')
	}
	console.log('Found the following:', blogs)
	blogs.map(makeBlog)
}



async function makeBlog(blogRoot: string) {
	let name: string = path.dirname(blogRoot)
	name = blogRoot.substring(blogRoot.lastIndexOf(path.sep) + 1)

	// If a build has failed/got paused by the debugger, we store
	// a file which has all the list of files to be deleted after
	// the build. This is needed, because we want to be able to
	// differentiate between files copied over or files already there.

	const restoreFilePath = join(blogRoot, CREATED_FILE_LIST_RESTORE);
	if (existsSync(restoreFilePath)) {
		try {
			console.warn('[Cleanup] Last build did remove the copied files. Doing that now.')
			const filesAndFoldersToDelete = JSON.parse(readFileSync(restoreFilePath, 'utf-8'))
			cleanup(filesAndFoldersToDelete)
			unlinkSync(restoreFilePath)
		} catch (e) {
			console.error('Cleanup unsuccessful.')
			console.error(e);
		}
	}

	console.log(`Generating ${name}`)

	let configFileRaw = readFileSync(join(blogRoot, BLOG_CONFIG_FILE), 'utf8')
	let config: SiteConfig = new SiteConfig()

	// By default

	// Do not bail on empty or unparseable file, just fall back to defaults.
	try {
		config = new SiteConfig(fm(configFileRaw).attributes)
		console.warn('Config: ', config)
		// config = new SiteConfig(JSON.parse(configFileRaw))
	} catch (e) {

	}
	config.inputDir = path.join(blogRoot, config.inputDir)
	config.outDir = path.join(blogRoot, config.outDir)
	config.dir = {
		input: blogRoot,
		includes: "_includes",
		data: "_data",
		output: "_site"
	}
	config.debug = true

	// Simple fallback for auto-deploy.
	config.publicAddress = config.publicAddress || name + envSettings.urlRoot

	let filesAndFoldersToDelete

	try {
		config.config = (eleventyConfig) => {
			let eleventyConfigToWrite = defaultConfigGenerator(eleventyConfig)

			eleventyConfigToWrite.addFilter("debug", (...args) => {
				console.warn(...args)
				return Object.keys(args[0])
			})

			eleventyConfigToWrite.addPassthroughCopy(path.join(blogRoot, 'css'))

			if (config.staticPassThrough && config.staticPassThrough.length) {
				config.staticPassThrough.forEach((passthroughCopy) => {
					console.log('[Config] adding pass through copy', passthroughCopy)
					let assetFolder = path.join(blogRoot, passthroughCopy)
					eleventyConfigToWrite.addPassthroughCopy(assetFolder, {
						debug: true, // log debug information
					})
				})
			}

			// TODO is there a config function in the actual sub
			return eleventyConfigToWrite
		}
		// console.log('Params:')
		// console.log(config)

		// Copy over the default templates if they are not present
		filesAndFoldersToDelete = copyBaseBuilderFiles(blogRoot)

		writeFileSync(restoreFilePath, JSON.stringify(filesAndFoldersToDelete))

		let blog = new Eleventy(config.inputDir, config.outDir, config)
		let out = await blog.write()

		console.log('Generated blog:')
		console.log(out)
		if (envSettings.generateApacheConfig) {
			generateApacheConfig(config.publicAddress, path.join(blogRoot, config.dir.output))
		}
	}
	catch (e) {
		console.error('Blog generation error.')
		console.error(e)
	}

	cleanup(filesAndFoldersToDelete);
	unlinkSync(restoreFilePath)

	console.log('Done!')
}

function cleanup(filesAndFoldersToDelete) {
	console.log('[DEL] Removing files and folders used for generation.')
	console.log('[DEL]', filesAndFoldersToDelete.files)
	console.log('[DEL]', filesAndFoldersToDelete.folders)
	filesAndFoldersToDelete.files.forEach(unlinkSync)
	filesAndFoldersToDelete.folders.forEach(folderPath => {
		try { rmdirSync(folderPath) } catch (e) {
			console.warn('[DEL] failed to remove ', folderPath)
		}
	})

}

makeBlogs()



/**
 * A minimalistic blog only uses templates already there.
 * If a blog is to be customized, first I'd spawn the templates of
 * the builder, then extend it.
 * If the base templates are extended use the extended version.
 * 11ty takes an input folder by default.
 * If there are missing templates in there, compared to the ones in the
 * blog generator folder, create aliases.
 * @param blogRoot
 * @returns
 */
function copyBaseBuilderFiles(blogRoot) {
	// Get all the templates from the blog's _includes folder
	// (dug out from the config already). They take priority.

	let blogBuilderBasicCpyDir = path.join(__dirname, 'cpy');
	let basicFilesToCopyFromBuilderIfTheyDoNotExist = glob.sync(blogBuilderBasicCpyDir + '/**/*.*')

	let _baseFilesCopied = [], pathCreated = []

	basicFilesToCopyFromBuilderIfTheyDoNotExist.forEach((key) => {
		let relativePath = key.substring(blogBuilderBasicCpyDir.length + 1)
		let fileToLookFor = path.join(blogRoot, relativePath)
		// See if this file exists. If it does not, copy it there...
		if (!existsSync(fileToLookFor)) {
			let baseTemplatePath = path.join(blogBuilderBasicCpyDir, relativePath);
			console.log('[CPY] copy basic blog files', relativePath, baseTemplatePath)

			let folder = fileToLookFor.substring(0, fileToLookFor.lastIndexOf(path.sep))
			// console.log('[CPY] checking if target folder exists', folder)
			let foldersCreatedThisPass = recursivelyCreatePath(folder)
			pathCreated = pathCreated.concat(foldersCreatedThisPass)
			if (foldersCreatedThisPass.length) {
				console.log('[MKDIR] folders created: ', foldersCreatedThisPass)
			}
			copyFileSync(baseTemplatePath, fileToLookFor)
			_baseFilesCopied.push(fileToLookFor)
		} else {
			console.log('[CPY] Found OVERWRITE, skipping', relativePath)
		}
	})

	return {
		files: _baseFilesCopied,
		folders: pathCreated
	}
}


/**
 * @param {String} pathToCreate
 * @returns {Array} of paths that got created
 */
function recursivelyCreatePath(pathToCreate) {
	let created = []
	let pathElements = pathToCreate.split('/')
	let i = 1
	let currentPath = ''
	while (i < pathElements.length) {
		currentPath += '/' + pathElements[i++]
		if (!existsSync(currentPath)) {
			mkdirSync(currentPath);
			created.push(currentPath)
		}
	}
	return created
}

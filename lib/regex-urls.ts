export const ATTACHMENT_URL_REGEXP = /!\[\[((.*?)\.(\w+))\]\]/g;
export const MARKDOWN_ATTACHMENT_URL_REGEXP = /!\[(.*?)\]\(((.*?)\.(\w+))\)/g;

// Finds all [title](url) formatted expressions, ignores the ones that are embedded with !
export const LINK_URL_REGEXP = /[^!]\[(.*?)\]\(((.*?))\)/g;
export const EMBED_URL_REGEXP = /!\[\[(.*?)\]\]/g;

export const IMAGE_IN_HTML_LINK = /"(\S+(?:png|jpe?g|gif|webp)\S*)"/ig
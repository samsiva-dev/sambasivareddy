import sanitizeHtml from "sanitize-html";

/**
 * Sanitize HTML content from the rich text editor before storing.
 * Allows safe HTML tags used by Tiptap while stripping potentially dangerous content.
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      // Block elements
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "blockquote", "pre",
      "ul", "ol", "li",
      "div", "figure", "figcaption",
      // Inline elements
      "a", "strong", "b", "em", "i", "u", "s", "del",
      "code", "span", "sub", "sup", "mark",
      // Media
      "img",
      // Table
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "width", "height", "loading", "class"],
      code: ["class"],
      pre: ["class"],
      span: ["class"],
      div: ["class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Force safe link attributes
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          // Don't allow javascript: URLs even with allowedSchemes
          href: attribs.href?.startsWith("javascript:") ? "" : attribs.href,
        },
      }),
    },
  });
}

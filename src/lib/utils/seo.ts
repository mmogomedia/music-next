/**
 * Serializes a JSON-LD object to a string safe for injection into a
 * <script type="application/ld+json"> tag.
 *
 * JSON.stringify() does NOT escape HTML-special characters.  A value
 * containing `</script>` would cause the browser's HTML parser to close
 * the script tag prematurely, allowing the remainder to be interpreted as
 * executable HTML — a classic script-injection (XSS) vector.
 *
 * We replace the three problematic characters with their Unicode escape
 * sequences, which are valid JSON and understood by all JSON-LD processors
 * and search-engine crawlers, but invisible to the HTML parser.
 *
 *   <  →  \u003c
 *   >  →  \u003e
 *   &  →  \u0026
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

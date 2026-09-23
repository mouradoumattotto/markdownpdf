/**
 * `<` is escaped as \u003c (still valid JSON): text that mentions a tag — an
 * FAQ answer about "<h1>", or anything containing "</script>" — can then
 * neither close the script element nor be mistaken for markup.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

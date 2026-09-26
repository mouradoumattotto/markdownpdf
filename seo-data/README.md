# SEO data — markdownpdf.app

Measurements and tooling for the site's SEO. Everything here is re-runnable.

| Command | What it does | Cost |
|---|---|---|
| `npm run seo:rank` | Live Google US top-100 for the tracked keywords, appended to `rank-history.json` | ~$0.27 |
| `npm run seo:report` | Search Console opportunities + URL Inspection of every sitemap URL | free |
| `npm run seo:check -- <base>` | Technical QA of a build (titles, canonicals, H1, JSON-LD, links) | free |
| `npm run seo:dataforseo -- balance` | DataForSEO account balance | free |
| `npm run seo:dataforseo -- post <endpoint> <name> --data='[…]'` | Any DataForSEO call, archived in `dataforseo/<date>/<name>.json.gz` | varies |

Credentials: `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` in `.env.local` (git-ignored).

## Audit of 2026-09-26 (DataForSEO + Search Console)

**Technical:** DataForSEO On-Page crawl of 63 pages scored 100/100 with no 4xx, redirects,
duplicate titles, missing descriptions, or canonical problems. Nothing technical is holding
the site back.

**Visibility:** there are 40 ranked keywords, all at positions 51–100, and 64% of them land on
`/blog/what-is-markdown-complete-guide`. They are informational queries owned by
markdownguide.org, which cannot be won. Search Console over 28 days shows 16 clicks and
1,132 impressions.

**Indexing:** new tool pages launched on 2026-09-23 were indexed within a day
(`/markdown-to-docx` already ranks #15 for "markdown to docx"). `/markdown-to-pdf` was the
exception: "Discovered – not indexed" for 3 months and never fetched. It was moved to
`/md-to-pdf` with a 308 redirect.

**Backlinks:** the site has 11 referring domains, and all 11 are an automated PBN spam
network. There are no real backlinks. This is the #1 blocker. See `disavow.txt`.

**Keyword targets:** these keywords have low difficulty, and the SERP for each is weak
(Reddit, YouTube, small sites):

| Keyword | US vol./mo | KD | Page |
|---|---:|---:|---|
| markdown to pdf / md to pdf | 14,800 each | 26 / 17 | `/md-to-pdf` |
| pdf to markdown (converter) | 3,600 each | 9 / 8 | `/` |
| compare pdf files | 2,400 | 15 | `/text-diff` |
| markdown table generator | 1,900 | 5 | `/markdown-table-generator` |
| markdown to word | 1,900 | 13 | `/markdown-to-docx` |
| markdown to html | 1,900 | 6 | `/markdown-to-html` |
| pdf to md | 1,900 | 8 | `/` |
| remove / delete metadata from pdf | 1,600 | 11–26 | `/pdf-metadata` |
| token counter | 5,400 | 19 | `/token-counter` |
| text to pdf *(no page yet)* | 5,400 | 0 | — candidate new tool |

## Off-site actions (manual, in order of return)

1. **Search Console, after each deploy**
   - Inspect `https://markdownpdf.app/md-to-pdf`, then click *Request indexing*. Do the same
     for `/text-diff`.
   - Upload `disavow.txt` at <https://search.google.com/search-console/disavow-links>.
2. **Make `github.com/mouradoumattotto/markdownpdf` public.** Add the site URL to the repo
   and a short README. GitHub is the #1 shared linking domain across all 5 competitors analysed.
3. **Curated lists that already link to competitors** (from the DataForSEO link-gap report):
   - `github.com/AnanthaRajuC/Useful-Softwares-Tools-list` links markdowntohtml.com. Open a PR.
   - FMHY's DEVTools / text tools list (fmhy.net, mirrored on git.toad.city) links word2md.
     Suggest markdownpdf.app there.
   - `codeberg.org/extratone/psalms/wiki/Blessed-Web-Utilities.md` links pdf2md.morethan.io.
   - `github.com/mundimark/awesome-markdown` covers the Markdown tools category.
4. **Directories:** AlternativeTo (as an alternative to pdf2md, CloudConvert and iLovePDF),
   SaaSHub, Product Hunt, There's An AI For That (for the AI document tools), and stacklist.
5. **Answer the threads where competitors are cited.** Give a genuinely useful answer and
   disclose that it is your tool.
   - superuser.com/questions/1568738 (md → pdf with images)
   - stackoverflow.com/questions/18759738 (GitHub wiki export)
   - community.openai.com/t/807919 (the Assistant API can't read a PDF)
   - forum.obsidian.md threads on PDF → notes
   - meta.discourse.org/t/158575 (Word → Markdown)
6. **One launch post** on dev.to and Show HN: "OCR and PDF→Markdown 100% in the browser, no
   upload". dev.to, lobste.rs and habr link 4 of the 5 competitors.

Re-measure around **2026-10-17** with `npm run seo:rank` and `npm run seo:report`, and compare
against the 2026-09-26 baseline in `rank-history.json`.

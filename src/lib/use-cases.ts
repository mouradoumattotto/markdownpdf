/**
 * Use-case pages (/use-cases/<slug>). Each one is written for a profession's
 * real constraints — what they convert, why, and what can go wrong — not a
 * template with the job title swapped in. Claims must stay true of the tools.
 */

export interface UseCase {
  slug: string;
  /** Short name for menus and cards. */
  name: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  /** Tile glyph in menus. */
  glyph: string;
  sections: { heading: string; paragraphs: string[] }[];
  steps: { title: string; text: string; tool?: { name: string; href: string } }[];
  faq: { question: string; answer: string }[];
  tools: string[];
  updated: string;
}

export const USE_CASES: UseCase[] = [
  {
    slug: "lawyers",
    name: "Lawyers & legal teams",
    glyph: "§",
    title: "PDF to Markdown for Lawyers — Privileged Files Stay Local",
    description:
      "Convert contracts, briefs and discovery PDFs to text or Markdown without uploading them. Runs in the browser, so privileged documents never reach a third-party server.",
    h1: "PDF conversion for lawyers, without uploading a single file",
    lead:
      "Contracts, pleadings and productions arrive as PDFs. Getting their text out usually means sending them to someone else's server — a problem when the document is privileged. Here, the conversion runs on your own computer.",
    sections: [
      {
        heading: "Why “no upload” matters for legal work",
        paragraphs: [
          "Most online converters upload the file, process it on their servers and keep it for a while. For a client's contract or a production set, that is a disclosure to a third party you have not vetted — something protective orders, client agreements and professional guidance on cloud services often ask you to think about first.",
          "This site works differently: the page loads the conversion code into your browser, and your PDF is read there, on your device. It is never sent anywhere. You can check it yourself: open the browser's developer tools on the Network tab while converting — the document never appears in an outgoing request.",
        ],
      },
      {
        heading: "What lawyers actually convert",
        paragraphs: [
          "Contracts to Markdown, to compare two versions word by word or to paste clauses into a drafting assistant without the formatting debris. Scanned exhibits and old agreements, which need OCR before anything can be searched. Long productions, to search or summarise them in bulk. And court forms, whose tables of fees or deadlines are easier to work with as a spreadsheet.",
        ],
      },
    ],
    steps: [
      {
        title: "Convert the document",
        text: "Text PDFs convert in seconds; scanned pages go through OCR, and every scanned page is flagged so you know which lines to proof-read against the original.",
        tool: { name: "PDF to Markdown", href: "/" },
      },
      {
        title: "Compare two versions",
        text: "Paste the old and new contract, or drop both PDFs, to see every changed word — useful when the other side sends a “clean” draft.",
        tool: { name: "Compare PDF & Text", href: "/text-diff" },
      },
      {
        title: "Make scans searchable",
        text: "Add an invisible text layer to scanned exhibits so they can be searched and quoted, without changing how they look.",
        tool: { name: "OCR a PDF", href: "/ocr-pdf" },
      },
      {
        title: "Strip metadata before sending",
        text: "See the author, software and dates a PDF carries, and remove them before it leaves the firm.",
        tool: { name: "PDF Metadata Viewer & Editor", href: "/pdf-metadata" },
      },
    ],
    faq: [
      {
        question: "Is anything sent to your servers during conversion?",
        answer:
          "No. The PDF is processed by your browser. The site serves the code and, for OCR, the language data — never your document. Analytics record that a conversion happened and its rough size bucket, not the file name or content.",
      },
      {
        question: "Can I use the Markdown with an AI assistant?",
        answer:
          "Yes — “Copy for AI” wraps the text in a tagged block with the file name, which assistants handle well. Whether a given AI service is appropriate for privileged material is your firm's call: the conversion step itself stays local.",
      },
      {
        question: "How accurate is OCR on old scanned agreements?",
        answer:
          "Good on clean typed pages, weaker on faint copies, stamps and handwriting. Scanned pages are flagged in the result so you can check them against the original side by side before relying on the text.",
      },
    ],
    tools: ["pdf-to-markdown", "text-diff", "ocr-pdf", "pdf-metadata", "pdf-tables-to-csv"],
    updated: "2026-10-01",
  },
  {
    slug: "researchers",
    name: "Researchers & academics",
    glyph: "R",
    title: "PDF to Markdown for Researchers — Papers, Notes and AI",
    description:
      "Convert research papers to Markdown with two-column layouts read in order, tables rebuilt and figures extracted. For notes, literature reviews and AI tools. Free, no upload.",
    h1: "Research papers to Markdown, columns and tables included",
    lead:
      "A paper is laid out for print: two columns, floating tables, figures, footnotes. Copying its text gives you sentences in the wrong order. Converted properly, it becomes notes you can search, quote and feed to the tools you use.",
    sections: [
      {
        heading: "The two-column problem",
        paragraphs: [
          "A PDF stores text by position, not by reading order. In a two-column paper, a naive extraction reads straight across the page and interleaves the columns line by line. The converter finds the gutter between columns and reads each column top to bottom; titles, wide figures and tables that span both columns are kept in place.",
          "Tables are rebuilt as Markdown tables when their cells line up — results tables usually do. Figures can be extracted as image files and linked where they appeared. Equations stay as the characters the PDF contains: readable, but not LaTeX.",
        ],
      },
      {
        heading: "Where the Markdown goes next",
        paragraphs: [
          "Into Obsidian or Logseq for a literature review, with properties recording the source and page markers for citations. Into ChatGPT, Claude or NotebookLM, where clean structure means better answers and fewer tokens than raw PDF text. Into a chunker, for a retrieval pipeline over a corpus of papers.",
        ],
      },
    ],
    steps: [
      {
        title: "Convert the paper",
        text: "Check the result against the original side by side — click any line to find it in the PDF.",
        tool: { name: "PDF to Markdown", href: "/" },
      },
      {
        title: "File it in your vault",
        text: "A note with title, source and page count as properties, figures as attachments, and hidden page markers for citing.",
        tool: { name: "PDF to Obsidian", href: "/pdf-to-obsidian" },
      },
      {
        title: "Do a whole reading list",
        text: "Drop every PDF of the literature review at once and get one ZIP of Markdown files.",
        tool: { name: "Batch PDF to Markdown", href: "/batch-pdf-to-markdown" },
      },
      {
        title: "Pull out the results tables",
        text: "Export the tables of a paper to CSV to re-plot or compare them.",
        tool: { name: "PDF Tables to CSV", href: "/pdf-tables-to-csv" },
      },
    ],
    faq: [
      {
        question: "Does it handle equations?",
        answer:
          "Inline symbols and simple formulas come through as text (α, β, R + 1). Display equations built from positioned glyphs often lose their layout. If equations matter most, a dedicated math-OCR tool will do better; the comparison page lists the honest alternatives.",
      },
      {
        question: "What about references and footnotes?",
        answer:
          "They are converted as text in reading order. Footnote markers stay as plain numbers next to the word they annotate — they are not turned into Markdown footnote links.",
      },
      {
        question: "Can I convert a scanned old article?",
        answer: "Yes. Scanned pages go through OCR in your browser and are flagged for review in the result.",
      },
    ],
    tools: ["pdf-to-markdown", "pdf-to-obsidian", "batch-pdf-to-markdown", "pdf-tables-to-csv", "markdown-chunker"],
    updated: "2026-10-01",
  },
  {
    slug: "finance",
    name: "Finance & accounting",
    glyph: "$",
    title: "PDF Tables to Excel/CSV for Finance — Statements, Reports, Filings",
    description:
      "Get the tables out of financial PDFs — statements, annual reports, filings — as CSV for Excel or Sheets. Detected in your browser, nothing uploaded.",
    h1: "Financial PDFs to spreadsheets, without retyping a number",
    lead:
      "Statements, annual reports and regulatory filings are full of tables published as PDF. Retyping them is slow and error-prone; uploading confidential statements to a converter is not an option. Extract them on your own machine instead.",
    sections: [
      {
        heading: "Tables, found from the layout",
        paragraphs: [
          "Financial tables are rarely drawn with full borders. The table detector works from the position of the text: rows whose cells line up under the same columns, numbers right-aligned or not, empty cells left empty. Each table is shown with its page number before you export it, so you can see exactly what you are getting.",
          "The CSV is UTF-8 with a byte-order mark, so Excel opens currency symbols and accents correctly, and values containing commas are quoted. Thousands separators are kept as printed — let the spreadsheet parse them.",
        ],
      },
      {
        heading: "Confidential by construction",
        paragraphs: [
          "Client statements and internal reports should not transit through a free online converter's servers. Here the PDF never leaves the browser tab — there is no server-side processing to trust, log or breach.",
        ],
      },
    ],
    steps: [
      {
        title: "Extract the tables",
        text: "Every table with its page number and a preview; download one CSV or all of them as a ZIP.",
        tool: { name: "PDF Tables to CSV", href: "/pdf-tables-to-csv" },
      },
      {
        title: "Keep the narrative too",
        text: "Convert the whole report to Markdown — tables stay in place as Markdown tables, between the paragraphs that explain them.",
        tool: { name: "PDF to Markdown", href: "/" },
      },
      {
        title: "Process a quarter of reports at once",
        text: "Drop all the PDFs and get one ZIP of Markdown files to search or summarise.",
        tool: { name: "Batch PDF to Markdown", href: "/batch-pdf-to-markdown" },
      },
    ],
    faq: [
      {
        question: "Does it work on scanned bank statements?",
        answer:
          "Tables are read from the text layer. For a scanned statement, first make it searchable with “OCR a PDF”, then extract the tables — check the figures, as OCR can misread digits on poor scans.",
      },
      {
        question: "A table spans two pages — what happens?",
        answer: "It is exported as two tables, one per page. Paste the second under the first in your spreadsheet.",
      },
      {
        question: "Are the numbers converted to numeric values?",
        answer:
          "No, they are written exactly as printed (“1,200”, “(45)”, “—”). Spreadsheets parse those on import with the right locale, and nothing is silently changed.",
      },
    ],
    tools: ["pdf-tables-to-csv", "pdf-to-markdown", "batch-pdf-to-markdown", "ocr-pdf", "merge-pdf"],
    updated: "2026-10-01",
  },
  {
    slug: "students",
    name: "Students",
    glyph: "S",
    title: "PDF to Markdown for Students — Notes, Flashcards and AI Study",
    description:
      "Turn course PDFs, slides and readings into Markdown notes you can edit, search, turn into flashcards or study with an AI. Free, no account, works on your phone.",
    h1: "Course PDFs into notes you can actually study from",
    lead:
      "Readings, slide decks exported to PDF, past papers: you can highlight them, but you cannot reorganise them. As Markdown they become notes — editable, searchable, and easy to turn into flashcards or quiz yourself on with an AI.",
    sections: [
      {
        heading: "From reading to revision",
        paragraphs: [
          "Convert a reading and keep its structure: headings become an outline you can fold, lists stay lists, tables stay tables. Paste it into Obsidian, Notion or any notes app, cut what you do not need, and add your own words in between. A scanned handout works too — OCR runs in the browser.",
          "For AI study, Markdown beats a raw PDF upload: the model sees the headings and lists, and a long reading costs fewer tokens. “Copy for AI” wraps the text so you can paste it straight into ChatGPT or Claude with a question.",
        ],
      },
      {
        heading: "Free, and fine on a phone",
        paragraphs: [
          "No account, no watermark, no page limit — and it works in a phone browser, with the result in a tab you can switch to the original PDF to check a passage.",
        ],
      },
    ],
    steps: [
      {
        title: "Convert the reading",
        text: "Drop the PDF and copy the Markdown, or download it as a .md file.",
        tool: { name: "PDF to Markdown", href: "/" },
      },
      {
        title: "Make it a note",
        text: "A ready-to-use Obsidian note with the source and page markers, for citing in essays.",
        tool: { name: "PDF to Obsidian", href: "/pdf-to-obsidian" },
      },
      {
        title: "Split a big textbook for an AI",
        text: "Cut a long PDF into parts the AI tool accepts.",
        tool: { name: "Split PDF for AI", href: "/split-pdf-for-ai" },
      },
      {
        title: "Write and export your own notes",
        text: "Write in Markdown with a live preview, then export a clean PDF to print or hand in.",
        tool: { name: "Markdown Editor", href: "/markdown-editor" },
      },
    ],
    faq: [
      {
        question: "Can I make flashcards from a PDF?",
        answer:
          "Convert it to Markdown first, then use the headings and lists as question/answer pairs — the guide on PDF to Anki flashcards walks through it.",
      },
      {
        question: "Is it really free?",
        answer: "Yes. No account, no watermark, no page limit. The site is supported by ads, not by your files.",
      },
      {
        question: "Does it work with slides exported to PDF?",
        answer:
          "Yes. Each slide's title usually becomes a heading and its bullets a list. Text inside images or diagrams is not extracted unless the page is scanned.",
      },
    ],
    tools: ["pdf-to-markdown", "pdf-to-obsidian", "split-pdf-for-ai", "markdown-editor", "token-counter"],
    updated: "2026-10-01",
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}

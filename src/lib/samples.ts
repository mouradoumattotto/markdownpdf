/**
 * Real sample documents, shown on /examples and under the converter.
 *
 * Every file is redistributable: works of the US federal government are in the
 * public domain, and PLOS articles are CC BY 4.0 (credit given below). The PDFs
 * are built by scripts/build-samples.mjs — long documents are cut to a few
 * representative pages. Keep the page selections here and there in sync.
 *
 * "roughEdges" is written from the converter's actual output on each file and
 * must stay true: the point of the examples is that nothing is cherry-picked.
 */

export interface Sample {
  slug: string;
  file: string;
  /** Short chip label. */
  kind: string;
  title: string;
  pages: number;
  /** Which tool shows the file off best. */
  tool: { name: string; href: string };
  whatToLookFor: string;
  roughEdges: string;
  source: { org: string; url: string; license: string; credit?: string };
  /** Shown as a chip under the PDF → Markdown drop zone. */
  chip?: boolean;
  /** Run with "Extract images" ticked. */
  images?: boolean;
}

export const SAMPLES: Sample[] = [
  {
    slug: "research-paper",
    file: "research-paper-ioannidis-2005.pdf",
    kind: "Research paper",
    title: "Why Most Published Research Findings Are False",
    pages: 6,
    tool: { name: "PDF to Markdown", href: "/" },
    whatToLookFor:
      "A two- and three-column journal layout read column by column, the abstract and section headings rebuilt as Markdown headings, and the 2 × 2 tables of the model.",
    roughEdges:
      "The decorative drop cap splits off the first word of the essay, the pull quote lands in the middle of the text as a heading, and the tables full of formulas are partly broken across rows.",
    source: {
      org: "PLOS Medicine (2005)",
      url: "https://doi.org/10.1371/journal.pmed.0020124",
      license: "CC BY 4.0",
      credit: "John P. A. Ioannidis",
    },
    chip: true,
  },
  {
    slug: "scanned-report",
    file: "scanned-naca-report-460.pdf",
    kind: "Scanned · OCR",
    title: "NACA Report No. 460 — 78 related airfoil sections (1933)",
    pages: 3,
    tool: { name: "PDF to Markdown", href: "/" },
    whatToLookFor:
      "Pages that are only pictures of paper, typeset in 1933: every page goes through OCR, and each one is flagged for review in the result.",
    roughEdges:
      "The title page reads cleanly, but on the two-column pages OCR mixes the columns and misreads faded words, equations are lost, and specks in the margins come out as stray characters. Exactly why those pages are flagged.",
    source: {
      org: "NASA Technical Reports Server",
      url: "https://ntrs.nasa.gov/citations/19930091108",
      license: "Public domain (US government work)",
    },
    chip: true,
  },
  {
    slug: "census-tables",
    file: "census-income-2023-excerpt.pdf",
    kind: "Dense tables",
    title: "Income in the United States: 2023 (excerpt)",
    pages: 4,
    tool: { name: "PDF tables to CSV", href: "/pdf-tables-to-csv" },
    whatToLookFor:
      "Table A-1 on the last page: nine columns of estimates and margins of error rebuilt as a Markdown table, ready to export as CSV. The three-column introduction is read in order.",
    roughEdges:
      "The chart labels on page 3 use a symbol font: they come out as garbage characters. The big table's two-line column headers are split over several rows.",
    source: {
      org: "U.S. Census Bureau, report P60-282",
      url: "https://www.census.gov/library/publications/2024/demo/p60-282.html",
      license: "Public domain (US government work)",
    },
    chip: true,
  },
  {
    slug: "energy-tables",
    file: "eia-energy-outlook-tables.pdf",
    kind: "Wide tables",
    title: "Short-Term Energy Outlook — Tables 2 and 3d (September 2026)",
    pages: 2,
    tool: { name: "PDF tables to CSV", href: "/pdf-tables-to-csv" },
    whatToLookFor: "Quarterly data tables with 15 numeric columns, kept row by row and column by column.",
    roughEdges:
      "The dotted leaders after each row label are kept, and the two header rows (years and quarters) end up as a bold line above the table instead of inside it.",
    source: {
      org: "U.S. Energy Information Administration",
      url: "https://www.eia.gov/outlooks/steo/",
      license: "Public domain (US government work)",
    },
  },
  {
    slug: "tax-form",
    file: "irs-form-w9.pdf",
    kind: "Government form",
    title: "IRS Form W-9 and its instructions",
    pages: 6,
    tool: { name: "PDF to Markdown", href: "/" },
    whatToLookFor:
      "A dense form page followed by five pages of two-column instructions, with the “IF the payment is for… THEN…” tables rebuilt as Markdown.",
    roughEdges:
      "Form boxes and check boxes have no Markdown equivalent: the form page comes out as labels, some of them grouped into small tables.",
    source: {
      org: "Internal Revenue Service",
      url: "https://www.irs.gov/forms-pubs/about-form-w-9",
      license: "Public domain (US government work)",
    },
    chip: true,
  },
  {
    slug: "long-report",
    file: "nist-cybersecurity-framework-2.pdf",
    kind: "Long report",
    title: "The NIST Cybersecurity Framework (CSF) 2.0",
    pages: 32,
    tool: { name: "PDF to Obsidian", href: "/pdf-to-obsidian" },
    whatToLookFor:
      "A 32-page standard with lists, a table of contents and the Functions/Categories table — the kind of document people turn into notes or feed to an AI.",
    roughEdges:
      "Numbered section titles set in the body font size are not recognised as headings, and an introductory sentence in Appendix B is mistaken for one.",
    source: {
      org: "National Institute of Standards and Technology, CSWP 29",
      url: "https://doi.org/10.6028/NIST.CSWP.29",
      license: "Public domain (US government work)",
    },
  },
];

export function getSample(slug: string): Sample | undefined {
  return SAMPLES.find((s) => s.slug === slug);
}

export const sampleUrl = (s: Sample) => `/samples/${s.file}`;
export const sampleThumb = (s: Sample) => `/samples/thumbs/${s.file.replace(/\.pdf$/, ".webp")}`;

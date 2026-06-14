---
title: Markdown Resume to PDF — Write Once, Export Clean
description: Write your resume in Markdown and export it to PDF. Benefits, a complete example resume, ATS-friendly formatting tips, and a free browser-based workflow.
date: 2026-06-06
---

Most people fight their resume in a word processor: a bullet point jumps to the next page, the spacing breaks when you add a job, and the file that looked fine on your machine renders differently on the recruiter's. Writing your resume in Markdown sidesteps almost all of that. You maintain one plain-text file, focus entirely on content, and export a clean PDF whenever you need one.

This guide covers why Markdown works so well for resumes, gives you a complete example you can copy, and walks through exporting it to PDF in your browser.

## Why write a resume in Markdown?

### One source, many outputs

A Markdown resume is a single text file. From that one source you can generate a PDF for applications, paste the raw text into online forms that strip formatting anyway, publish it on a personal site, or keep it in a README-style portfolio. You never end up with `resume_final_v3_REAL.docx` because there is only one file to maintain.

### Version control that actually works

Plain text diffs cleanly. Keep your resume in a Git repository and every edit is tracked: which bullet you rewrote, when you added a role, what you cut to fit one page. Tailoring your resume for a specific job becomes a branch instead of another copied file. If you have never versioned documents this way, the comparison in [Markdown vs PDF](/blog/markdown-vs-pdf) explains why plain text wins for anything you edit repeatedly.

### Content over formatting

Markdown gives you headings, bold text, and bullet lists — and very little else, as a quick glance at any [Markdown cheat sheet](/blog/markdown-cheat-sheet) confirms. That constraint is a feature for resumes. You cannot burn an evening nudging margins, because there are no margins to nudge while you write. The formatting questions get answered once, at export time, and the writing stays about your experience.

### No lock-in

Word processors, design tools, and resume builders all store your resume in their own format. Markdown opens in any text editor on any operating system, today and in twenty years. If you are new to the syntax, our [complete guide to Markdown](/blog/what-is-markdown-complete-guide) covers everything a resume needs in about ten minutes of reading.

## A complete example resume in Markdown

Here is a full, realistic resume you can copy and adapt. It uses nothing beyond standard Markdown: headings, bold, italics, and lists.

```markdown
# Jane Doe

**Software Engineer** — Amsterdam, NL
jane.doe@example.com · +31 6 12 34 56 78 · github.com/janedoe

Backend engineer with 6 years of experience building payment and
logistics systems. Comfortable owning services end to end, from
design through on-call.

## Experience

### Senior Software Engineer — FreightFlow (2023–present)

- Led migration of the billing service from a monolith to three
  services, cutting deploy time from 40 minutes to 6
- Designed an idempotent payment-retry pipeline that reduced
  failed-charge support tickets by roughly a third
- Mentored two junior engineers; both promoted within 18 months

### Software Engineer — Paylane (2020–2023)

- Built and maintained PSD2-compliant bank integrations in Go
- Introduced contract testing between teams, catching breaking
  API changes before production
- Ran the on-call rotation revamp that halved pages per week

## Education

**BSc Computer Science** — University of Utrecht, 2020

## Skills

**Languages:** Go, Python, SQL, TypeScript
**Infrastructure:** PostgreSQL, Kafka, Kubernetes, Terraform
**Other:** API design, incident response, technical writing
```

A few structural choices worth copying:

- **One `#` heading** for your name, `##` for sections, `###` for each role. The hierarchy maps directly to the visual hierarchy in the PDF.
- **Bold for job titles and labels**, italics sparingly. Resumes need very little emphasis.
- **Bullets that lead with a verb and end with an outcome.** Markdown will not save weak bullets — that part is still on you.
- **Plain contact details on one line** under your name, separated by a middle dot or pipe.

## Exporting your Markdown resume to PDF

When the content is ready, open our free [Markdown to PDF converter](/markdown-to-pdf), paste or drop in your file, and download the PDF. The conversion runs entirely in your browser — your resume, with your phone number and work history, never gets uploaded to a server. For a resume that matters: many free converters quietly send your document to their backend.

The workflow end to end:

1. Edit the `.md` file in any editor (VS Code, Obsidian, even Notepad).
2. Open the [Markdown to PDF tool](/markdown-to-pdf) and load your file.
3. Check the preview — headings, bullets, and bold should look exactly as structured.
4. Download the PDF and attach it to your application.

Because the source never changes format, updating your resume next year means editing a text file and repeating steps 2–4. The general process, including how lists, links, and code render, is covered in more depth in [how to convert Markdown to PDF](/blog/convert-markdown-to-pdf).

## Are Markdown-generated PDFs ATS-friendly?

Applicant tracking systems parse PDFs by extracting their text. The PDFs that trip them up are the heavily designed ones: two-column layouts, text inside graphics, icons standing in for words, headers and footers holding contact details. A PDF exported from Markdown is the opposite of that — a single column of real, selectable text with a clear heading structure. That is close to the ideal input for a parser.

Sensible precautions still apply:

- **Use standard section names** — "Experience", "Education", "Skills" — because parsers look for them.
- **Keep contact details as plain text** near the top, not in an image or table.
- **Avoid tables for layout.** Markdown tables export fine visually, but multi-column resume layouts parse unpredictably.
- **Test it yourself:** open the exported PDF, select all, copy, and paste into a plain-text editor. If the text comes out in the right order, an ATS will read it the same way.

## Tips for a sharper Markdown resume

- **Keep it to one page** until you have ten or more years of experience. In Markdown terms, that is roughly 400–550 words — easy to check with a word counter.
- **Use a horizontal rule (`---`)** between major sections if you want extra visual separation in the PDF. Just remember the first `---` lines in a file may be interpreted as frontmatter by some tools, so keep rules out of the very top.
- **Write links as visible text** (`github.com/janedoe`) rather than hidden behind link syntax. Recruiters print resumes; a hyperlinked word is useless on paper.
- **Tailor with comments removed.** Some people keep an extended "master" resume with every bullet they have ever written, then delete down to one page per application. Git branches make this painless.
- **Proofread the PDF, not just the Markdown.** Line breaks and page breaks only exist in the export, so the final check should happen there.

## The bottom line

A resume is a document you will edit dozens of times over a career, which is exactly the kind of document plain text is built for. Write it in Markdown, version it like code, and export a clean, parser-friendly PDF with the [Markdown to PDF converter](/markdown-to-pdf) whenever an application calls for one. The formatting takes care of itself — your job is the content.

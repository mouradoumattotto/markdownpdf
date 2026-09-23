---
title: How to Remove Metadata from a PDF (and Check It Is Really Gone)
seoTitle: How to Remove PDF Metadata
description: What a PDF reveals about you, why many "remove metadata" methods leave a copy behind, and how to strip it for good and check it worked.
date: 2026-09-23
updated: 2026-09-23
author: Mourad Oumita
---

You export a CV, a quote or a legal letter to PDF and send it. The recipient opens *File → Properties* and sees your full name, the name of your employer's Windows account, the template the document was built from, the software and its version, and the date and time you created it — sometimes down to the second, with your time zone. None of it is on the page. All of it is in the file.

This guide covers what PDF metadata actually contains, why the usual ways of removing it often leave a copy behind, and how to remove it properly and check that it worked.

## What a PDF stores about you

A PDF can carry metadata in two separate places, and most tools only show — or clean — the first.

**The Info dictionary.** The classic set of fields: *Title, Author, Subject, Keywords, Creator* (the application that made the original document, such as Microsoft Word), *Producer* (the library that wrote the PDF) and the *creation* and *modification* dates. This is what your PDF reader shows under Properties.

**The XMP packet.** A block of XML embedded in the file, introduced by Adobe and used by most modern software. It usually repeats the Info fields — and then adds more: document and instance IDs that link every version of a file to the same original, the creator tool, sometimes an edit history listing the applications the document passed through, and custom fields written by document-management systems.

Some fields are worth a second look before you send anything:

- **Author** is often your operating-system account name, not the name you would choose to sign with — or the name of whoever created the template years ago.
- **Title** frequently holds the original file name: `Draft v3 - DO NOT SEND.docx`.
- **Dates** reveal when a document was really written, which matters for backdated letters and for "fresh" quotes that were copied from last year's.
- **Custom fields** from company systems can include client codes, internal paths or matter numbers.

## Why "removing" metadata often does not remove it

A PDF can be saved in two ways. A *full save* rewrites the file from scratch. An *incremental update* appends the changes to the end of the file and leaves the original bytes where they were — so a reader shows the new values, while the old ones are still in the file for anyone who opens it in a text editor.

Many tools save metadata changes incrementally because it is fast and safe. ExifTool, the reference tool for metadata, is explicit about it: its PDF edits are designed to be reversible, and its documentation recommends rewriting the file afterwards (for example with `qpdf`) if the old metadata must actually disappear.

The second trap is the XMP packet. A tool that blanks the Info dictionary but leaves the XMP untouched gives you a clean *Properties* dialog and a file that still names you.

## How to remove it properly

### In your browser, without uploading the file

The [PDF metadata viewer and remover](/pdf-metadata) on this site shows both the Info dictionary and the XMP packet, including custom fields, then writes a new file with a full save: the Info fields you choose to remove are gone and the XMP stream is deleted from the file, not just unlinked. You can also edit fields instead of clearing them — keeping a proper title, for example — and choose whether to keep the dates.

Because it runs in your browser, the document you are cleaning is not sent to a server, which would rather defeat the purpose.

### With Adobe Acrobat Pro

Acrobat Pro's *Remove Hidden Information* and *Sanitize Document* features remove metadata along with other hidden content such as comments, attachments and hidden layers. They are the most thorough option if you have Acrobat Pro; the free Acrobat Reader cannot do it.

### On the command line

```bash
exiftool -all:all= document.pdf
qpdf --linearize document.pdf cleaned.pdf
```

The first line clears the metadata (incrementally); the second rewrites the file so that the old revision is actually dropped. Run the check below on `cleaned.pdf`, not on the original.

## How to check that it worked

Do not trust the Properties dialog — it only reads the latest Info dictionary. Instead:

1. **Reopen the cleaned file in the metadata viewer.** It reads the XMP packet as well as the Info dictionary.
2. **Search the raw bytes.** Open the PDF in a plain text editor (or run `strings cleaned.pdf | grep -i yourname` on macOS or Linux) and search for your name, your company and the original file name. If they appear, something is still there.

One caveat for the byte search: some PDF writers compress parts of the file, and some store text as hexadecimal or UTF-16. A search that finds nothing is good evidence, not proof. The viewer, which decodes the file, is the more reliable of the two checks.

## What metadata removal does not remove

Metadata is only one kind of hidden information. Removing it does **not** remove:

- **Text under a black box.** Drawing a black rectangle over text in an editor hides it visually; the text is still in the file and can be selected and copied. Real redaction deletes the text itself.
- **Comments, annotations and form-field values.** They live in the pages, not in the metadata.
- **Attachments** embedded in the PDF.
- **Content outside the visible area** of a page, and hidden layers.
- **What the pages say.** A letterhead, a signature or a footer with a file path is content, not metadata.

If a document has been through several people's hands, look at those too before sending it outside.

## A short checklist before you send a PDF

1. Open it in the [metadata viewer](/pdf-metadata) and read every field, including the XMP section.
2. Remove what should not be there, or replace it — a clean title is better than an empty one.
3. Reopen the cleaned copy and check again.
4. If you extracted part of a larger document with [Split PDF](/split-pdf), check the part too: it keeps the original document's title.
5. For anything sensitive, make sure redactions are real redactions, not boxes.

It takes a minute, and it is the minute that stops a recipient from learning more than you meant to tell them.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAdSense from "@/components/GoogleAdSense";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MarkdownPDF — Free PDF to Markdown & Markdown to PDF Converter",
    template: "%s | MarkdownPDF",
  },
  description: SITE.description,
  keywords: [
    "pdf to markdown",
    "markdown to pdf",
    "convert pdf to markdown",
    "markdown converter",
    "free pdf converter",
    "ocr pdf",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-white text-neutral-900">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE.url}/#organization`,
                name: SITE.name,
                url: SITE.url,
                email: "contact@markdownpdf.app",
              },
              {
                "@type": "WebSite",
                "@id": `${SITE.url}/#website`,
                name: SITE.name,
                url: SITE.url,
                publisher: { "@id": `${SITE.url}/#organization` },
              },
            ],
          }}
        />
        <GoogleAdSense />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

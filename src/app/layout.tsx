import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import ConsentMode from "@/components/ConsentMode";
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

export const viewport: Viewport = {
  themeColor: "#4f46e5",
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
                // The brand is written as one word but searched several ways;
                // spell the variants out so Google ties them to this entity.
                alternateName: ["Markdown PDF", "markdownpdf.app"],
                url: SITE.url,
                email: "contact@markdownpdf.app",
                description: SITE.description,
                logo: {
                  "@type": "ImageObject",
                  "@id": `${SITE.url}/#logo`,
                  url: `${SITE.url}/icon.svg`,
                  contentUrl: `${SITE.url}/icon.svg`,
                },
                // No `sameAs`: it must only list profiles that actually exist.
                // x.com/markdownpdf is unregistered — claiming it is a broken
                // entity signal. Add the array back once a real profile exists.
              },
              {
                "@type": "WebSite",
                "@id": `${SITE.url}/#website`,
                name: SITE.name,
                alternateName: ["Markdown PDF", "markdownpdf.app"],
                url: SITE.url,
                description: SITE.description,
                inLanguage: "en",
                publisher: { "@id": `${SITE.url}/#organization` },
              },
            ],
          }}
        />
        <ConsentMode />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <DeferredAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <GoogleAdSense />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

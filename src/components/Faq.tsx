import Link from "next/link";
import JsonLd from "./JsonLd";

export interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_2fr] md:gap-12">
      <div>
        <h2 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-3xl">{title}</h2>
        <p className="mt-2 text-[15px] text-neutral-600">Still stuck? <Link href="/contact" className="font-semibold text-brand-700 hover:underline">Ask us</Link>.</p>
      </div>
      <div className="border-t border-line">
        {items.map((item) => (
          <details key={item.question} className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden className="text-xl font-normal leading-none text-neutral-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 pr-8 leading-relaxed text-neutral-600">{item.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </section>
  );
}

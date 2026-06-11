import JsonLd from "./JsonLd";

export interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-neutral-200 bg-white transition-colors open:border-indigo-200 open:shadow-sm hover:border-neutral-300"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <p className="px-5 pb-5 leading-relaxed text-neutral-600">{item.answer}</p>
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

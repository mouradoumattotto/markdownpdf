import JsonLd from "./JsonLd";

export interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h2>
      <dl className="mt-6 divide-y divide-neutral-200">
        {items.map((item) => (
          <div key={item.question} className="py-5">
            <dt className="font-semibold text-neutral-900">{item.question}</dt>
            <dd className="mt-2 text-neutral-600">{item.answer}</dd>
          </div>
        ))}
      </dl>
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

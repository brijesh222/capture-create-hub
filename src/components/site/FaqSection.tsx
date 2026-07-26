import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./parts";

const FaqSection = () => {
  const { config } = useSiteConfig();
  const { faq } = config;

  if (!faq.enabled || !faq.items.length) return null;

  return (
    <section className="shell py-12 md:py-14">
      <SectionHeading heading={faq.heading} highlight={faq.headingHighlight} />

      <Accordion type="single" collapsible defaultValue={faq.items[0]?.id}>
        {faq.items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-border">
            <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="max-w-[44rem] text-[0.94rem] text-[hsl(var(--ink-soft))]">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FaqSection;

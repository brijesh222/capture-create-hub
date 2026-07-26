import { useSiteConfig } from "@/context/SiteConfigContext";

const HowItWorksSection = () => {
  const { config } = useSiteConfig();
  const { howItWorks } = config;

  if (!howItWorks.enabled || !howItWorks.steps.length) return null;

  return (
    <section className="shell py-12 md:py-14">
      <div className="rounded-[20px] bg-primary px-6 py-10 text-primary-foreground md:px-10 md:py-12">
        <h2 className="heading-lg mb-8">
          {howItWorks.heading}
          {howItWorks.headingHighlight ? (
            <strong>{howItWorks.headingHighlight}</strong>
          ) : null}
        </h2>

        <ol className="grid gap-7 md:grid-cols-3 md:gap-8">
          {howItWorks.steps.map((step, i) => (
            <li key={step.id} className="flex flex-col gap-1.5">
              <span
                aria-hidden="true"
                className="mb-1 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/15 text-[0.8rem] font-semibold"
              >
                {i + 1}
              </span>
              <h3 className="text-[1.03rem] font-semibold">{step.title}</h3>
              <p className="text-[0.9rem] text-primary-foreground/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;

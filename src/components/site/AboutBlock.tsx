import { useSiteConfig } from "@/context/SiteConfigContext";
import { categoryFallbackImage } from "@/lib/category-images";

const AboutBlock = () => {
  const { config } = useSiteConfig();
  const { about } = config;

  if (!about.enabled) return null;

  const photo = about.photoUrl || categoryFallbackImage("pre-wedding");

  return (
    <section id="about" className="shell py-12 md:py-14">
      <div className="grid items-center gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div
          className="aspect-square rounded-[20px] bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${photo})` }}
          role="img"
          aria-label={`${about.heading}${about.headingHighlight}`}
        />

        <div className="flex flex-col gap-4">
          <h2 className="heading-lg">
            {about.heading}
            {about.headingHighlight ? <strong>{about.headingHighlight}</strong> : null}
          </h2>

          {about.paragraphs.map((p, i) => (
            <p key={i} className="text-[0.97rem] text-[hsl(var(--ink-soft))]">
              {p}
            </p>
          ))}

          {about.stats.length ? (
            <dl className="flex flex-wrap gap-x-10 gap-y-6 pt-2">
              {about.stats.map((s) => (
                <div key={s.id}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-[1.6rem] font-light tabular-nums tracking-[-0.03em]">
                    {s.value}
                  </dd>
                  <dd className="text-[0.8rem] text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default AboutBlock;

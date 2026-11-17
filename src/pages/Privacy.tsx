import { useEffect } from "react";

// Edit these three values before publishing.
const BRAND = "Dusk Angle";
const CONTACT_EMAIL = "brijeshparjapat52@gmail.com";
const LAST_UPDATED = "17 November 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <p>
        {BRAND} is a photography and videography studio. This website
        showcases our work and lets you get in touch to book shoots such as
        weddings, events and portraits. This policy explains what personal
        information we collect through the site and how we use it.
      </p>
    ),
  },
  {
    title: "Information we collect",
    body: (
      <>
        <p>We only collect what we need to respond to you and run the site:</p>
        <ul>
          <li>
            <strong>Details you give us:</strong> your name, email address,
            phone number, event date, location and message when you send an
            enquiry or booking request.
          </li>
          <li>
            <strong>Technical data:</strong> basic information such as browser
            type, device, pages visited and approximate location, collected
            automatically through standard hosting and analytics tools.
          </li>
          <li>
            <strong>Local storage:</strong> small items saved in your browser,
            for example site settings or your preferences.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How we use your information",
    body: (
      <ul>
        <li>To reply to your enquiries and manage bookings.</li>
        <li>To deliver photos, videos and related services you request.</li>
        <li>To keep the website secure, working and improving.</li>
        <li>To meet legal or accounting obligations.</li>
      </ul>
    ),
  },
  {
    title: "Photos and videos",
    body: (
      <p>
        Images and films we create for clients remain private unless the
        client agrees to their use. We only display client work in our
        portfolio or on social media with permission. If you appear in
        published work and want it removed, contact us and we will take it
        down.
      </p>
    ),
  },
  {
    title: "Sharing your information",
    body: (
      <>
        <p>
          We do not sell your personal information. We share it only with
          service providers that help us run the site, such as website
          hosting and database providers, and only as needed for them to do
          so. We may also disclose information if the law requires it.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and analytics",
    body: (
      <p>
        We may use cookies or similar technologies to keep the site working
        and to understand how visitors use it. You can block or delete
        cookies in your browser settings, though parts of the site may not
        work as expected.
      </p>
    ),
  },
  {
    title: "Third-party links",
    body: (
      <p>
        The site may link to services such as Instagram, YouTube or
        WhatsApp. Those services have their own privacy policies, and we are
        not responsible for how they handle your data.
      </p>
    ),
  },
  {
    title: "How long we keep your data",
    body: (
      <p>
        We keep enquiry and booking details for as long as needed to provide
        our services and meet legal requirements, then delete or anonymise
        them.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <p>
        You can ask us to access, correct or delete the personal information
        we hold about you, or withdraw consent where we rely on it. Email us
        at the address below and we will respond within a reasonable time.
      </p>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        We take reasonable steps to protect your information, but no website
        or storage system is completely secure, so we cannot guarantee
        absolute security.
      </p>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        This site is not directed at children under 13, and we do not
        knowingly collect their personal information. Bookings involving
        minors should be made by a parent or guardian.
      </p>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The date at the top of
        this page shows when it last changed.
      </p>
    ),
  },
  {
    title: "Contact us",
    body: (
      <p>
        Questions or requests about your privacy? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

const Privacy = () => {
  useEffect(() => {
    document.title = `Privacy Policy | ${BRAND}`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <a
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to home
        </a>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated {LAST_UPDATED}
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Privacy;

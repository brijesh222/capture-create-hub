import { categories, WHATSAPP_LINK, EMAIL } from "@/data/categories";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-3 font-display text-xl font-bold text-gradient-gold">
              BP Productions
            </h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Premium photography & videography services. Capturing moments that
              last forever.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider text-foreground">
              Services
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="font-body text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  +91 70234 33374
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="transition-colors hover:text-primary"
                >
                  {EMAIL}
                </a>
              </li>
              <li>Rajasthan, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} BP Productions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

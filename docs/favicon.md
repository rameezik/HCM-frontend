# HCM Lite application icon

`app/icon.svg` is the scalable source for the HCM Lite monogram: a cyan H with a light connector, rose accent and dark charcoal rounded background. Its simple geometry stays legible at browser-tab sizes.

`app/favicon.ico` contains matching 16, 32, 48 and 64 pixel variants. It replaces the original Next.js favicon. The two App Router file conventions automatically create the appropriate icon links, so no duplicate manual icon metadata or legacy `/public` favicon reference is necessary.

The root metadata defines the default browser title as **HCM Lite | People & Payroll**, with **%s | HCM Lite** available for page-specific titles, and identifies the application as HCM Lite.

The ICO was decoded and its four embedded sizes verified with Pillow; the SVG was parsed as XML and checked for the expected 32 by 32 view box. The actual development/production route and generated head tags are checked as part of the integration browser run.

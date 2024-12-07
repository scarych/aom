const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: "aom",
    tagline: "API Over Models",
    url: "https://scarych.github.io",
    baseUrl: "/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.ico",
    organizationName: "scarych", // Usually your GitHub org/user name.
    projectName: "aom", // Usually your repo name.

    i18n: {
      // path: "../docs/i18n",
      defaultLocale: "en",
      locales: ["en", "ru"],
    },

    // plugins: ["@docusaurus/plugin-google-gtag"],

    presets: [
      [
        "@docusaurus/preset-classic",
        /** @type {import('@docusaurus/preset-classic').Options} */
        ({
          docs: {
            sidebarPath: require.resolve("./sidebars.js"),
            // Please change this to your repo.
            // editUrl: "https://github.com/scarych/aom/edit/main/website/",
          },
          /*
          blog: {
            showReadingTime: true,
            // Please change this to your repo.
            editUrl: "https://github.com/scarych/aom/edit/main/website/blog/",
          },
          */
          theme: {
            customCss: require.resolve("./src/css/custom.css"),
          },
        }),
      ],
    ],

    themeConfig:
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        navbar: {
          title: "aom",

          logo: {
            alt: "AOM Logo",
            src: "img/aom-logo.svg",
          },

          items: [
            {
              to: "docs/api/intro",
              activeBasePath: "api",
              position: "left",
              label: "Tutorial",
            },
            /*
            {
              to: "docs/guides/intro",
              activeBasePath: "guides",
              position: "left",
              label: "Guides",
            },
            */
            // { to: "/blog", label: "Blog", position: "left" },
            {
              type: "localeDropdown",
              position: "right",
            },
            {
              href: "https://github.com/scarych/aom",
              label: "GitHub",
              position: "right",
            },
          ],
        },
        footer: {
          style: "dark",
          links: [
            {
              title: "Docs",
              items: [
                {
                  label: "Tutorial",
                  to: "/docs/api/intro",
                },
                /*
                {
                  label: "Guides",
                  to: "/docs/guides/intro",
                },
                */
              ],
            },
            /*
            {
              title: "Community",
              items: [
                {
                  label: "Stack Overflow",
                  href: "https://stackoverflow.com/questions/tagged/docusaurus",
                },
                {
                  label: "Discord",
                  href: "https://discordapp.com/invite/docusaurus",
                },
                {
                  label: "Twitter",
                  href: "https://twitter.com/docusaurus",
                },
              ],
            },
            */
            {
              title: "More",
              items: [
                /*
                {
                  label: "Blog",
                  to: "/blog",
                },
                */
                {
                  label: "GitHub",
                  href: "https://github.com/aom-js",
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} Grigory B. Kholstinnikov. Built with Docusaurus.`,
        },
        prism: {
          theme: lightCodeTheme,
          darkTheme: darkCodeTheme,
        },
        gtag: {
          // You can also use your "G-" Measurement ID here.
          trackingID: "G-YJGS9P570Z",
          // Optional fields.
          // anonymizeIP: true, // Should IPs be anonymized?
        },
      }),
  }
);

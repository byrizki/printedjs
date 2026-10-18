# Printedjs Documentation Site

> Official documentation site for [Printedjs](https://github.com/byrizki/printedjs) — modern, high-performance browser-native paginated document rendering engine.

Built with [Nuxt](https://nuxt.com), [Docus](https://docus.dev), and [Nuxt Content](https://content.nuxt.com/), deployed to [GitHub Pages](https://byrizki.github.io/printedjs/).

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The documentation site will be running at `http://localhost:3000`.

## 📁 Project Structure

```text
docs/
├── content/
│   ├── en/                     # English documentation
│   │   ├── index.md            # Landing hero page
│   │   ├── 01.getting-started/ # Getting started & installation
│   │   ├── 02.how-to/          # Implementation & migration guides
│   │   ├── 03.architecture/    # System design, contracts & roadmap
│   │   ├── 04.paged-media/     # CSS Paged Media specifications
│   │   └── 05.demos/           # Interactive Live Demo & Minimal Demo
│   └── id/                     # Bahasa Indonesia documentation
├── components/                 # Custom Vue & Docus components
├── public/                     # Static assets & mounted demos
├── nuxt.config.ts              # Nuxt configuration
├── app.config.ts               # Docus theme configuration
└── package.json
```

## ⚡ Built With

- [Nuxt 4](https://nuxt.com) — Modern Vue framework
- [Docus](https://docus.dev) — Documentation theme
- [Nuxt Content](https://content.nuxt.com/) — Markdown CMS
- [Nuxt i18n](https://i18n.nuxt.com/) — English & Bahasa Indonesia localization

## 📄 License

[MIT License](https://opensource.org/licenses/MIT)

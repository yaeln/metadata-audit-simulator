# Metadata Audit Simulator

**Created by Yael Netzer — built with Google Gemini & Claude (Anthropic).**

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21132215.svg)](https://doi.org/10.5281/zenodo.21132215)

A single-file, in-browser teaching tool for exploring how the quality and
completeness of cultural-heritage **metadata** shapes what an AI image model
produces. Give a machine a catalogue record with gaps — a missing year, a vague
type — and watch it *hallucinate* the rest, confidently. It is designed for
digital-humanities teaching (originally for the ESU 2026 *Digital Archives*
workshop).

🔗 **Live app:** https://audit.yaeln.org

---

## What it does

1. **Load a dataset** — upload a CSV of records (e.g. a Europeana export).
2. **Choose the prompt schema** — tick exactly which columns the AI may see;
   empty fields are shown to the model as `NULL`.
3. **Generate** — the selected metadata becomes a prompt for an AI image model,
   and the result appears alongside the record.
4. **Audit** — students note what the AI invented to fill the gaps (materials,
   period, style, bias).
5. **Export** — a ZIP with every generated image plus an `audit_results.csv`
   (one row per run: prompt, model, timestamp, collection context, and the
   original metadata) and a re-importable `session.json`.

## Try it with no key and no cost

Open the app, tick **Demo mode (no API)**, load a CSV, and generate. Demo mode
draws a local placeholder showing the exact prompt the AI *would* receive — the
whole workflow, no key, no network calls.

## Generate real images

Real image generation needs paid Google *Gemini API* access (image generation
is blocked on free keys). Two ways:

- **Shared class proxy (recommended for a class):** deploy
  [`class_proxy_worker.js`](class_proxy_worker.js) — a tiny Cloudflare Worker
  that holds one billed key plus a class code. Students paste the proxy URL +
  code and need no key of their own. Setup steps are at the top of that file.
- **Your own key:** paste a Gemini API key (with prepaid credit; keep
  auto-reload off as a hard spending cap) into the instructor field, click
  **Detect** to list the image models your key supports, and generate.

## Features

- Model dropdown (Imagen + Gemini image models) with endpoint-aware handling and
  a **Detect** button that lists the image models a key can actually use.
- **Demo mode** — keyless local placeholder.
- **Collection Context** — optional background prepended to every prompt, so you
  can compare generations *with* and *without* human framing.
- **Multiple runs per record** with a thumbnail history to compare outputs.
- **Find / Random** — filter by a column value (e.g. `type = IMAGE`) or search
  any column, then step through or jump to a random matching record.
- **Session autosave** (in-browser) and **ZIP export/import** for resumable,
  archivable sessions. Export filenames include the dataset name and a timestamp.

## Privacy

- The uploaded CSV is parsed locally in the browser and never uploaded.
- An API key, if used, stays in the browser (and on the proxy server, if used)
  and is not written to disk.
- Demo mode makes no network calls at all.

## Credits

- **Yael Netzer** — concept, design, and development (Center for Digital
  Humanities, The Hebrew University; ESU 2026 *Digital Archives*).
- **Google Gemini** — initial prototype generation.
- **Claude (Anthropic)** — development, extension, and packaging.

## License

MIT — see [LICENSE](LICENSE).

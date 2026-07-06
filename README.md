# Czas po Polsku &middot; Polish Time Listening Practice

A premium, interactive web application to help Polish learners practice listening to and understanding spoken times. This application supports both the **24-hour formal clock** and the **12-hour informal clock**, which uses relative expressions (e.g. *wpół do*, *po*, *za*).

Live Demo: [https://ippikin.github.io/polish-times-practice/](https://ippikin.github.io/polish-times-practice/)

## Features

- **High-Quality Speech Synthesis**: Speaks Polish times using the browser's native Web Speech API (`SpeechSynthesis`).
- **Two Time Telling Formats**:
  - **24h (Formal)**: Speaks numbers directly using ordinal hours and cardinal minutes (e.g., `14:15` &rarr; *"czternasta piętnaście"*).
  - **12h (Informal)**: Speaks times relative to the hours:
    - Minutes 1–29: *"po"* (e.g., `14:10` &rarr; *"dziesięć po drugiej"*)
    - Minute 30: *"wpół do"* (e.g., `14:30` &rarr; *"wpół do trzeciej"*)
    - Minutes 31–59: *"za"* (e.g., `14:45` &rarr; *"za piętnaście trzecia"*)
- **Adjustable Playback Speed**: Normal speed (1.0x) and slow speed (0.55x) play options.
- **Smart Grading Parser**: Normalizes input. Correctly grades informal times by comparing hours modulo 12 (e.g., if you hear *"za dziesięć trzecia"* and type `2:50` or `14:50`, both are accepted as correct!).
- **Customizable Practice Options**:
  - **Time Format**: 24h, 12h, or Mixed.
  - **Minute Intervals**: 5-minute steps (recommended for informal learning) or precise 1-minute steps.
  - **Time of Day**: All day (24h), Morning (00:00 - 11:59), or Evening (12:00 - 23:59).
- **Session Progress Tracking**: Tracks correct rounds, total attempts, percentage accuracy, and streaks (current & max). Saved in `localStorage`.
- **Collapsible Grammar Guide**: Quick reference cheat sheet for standard Polish clock grammar.
- **Bilingual Interface**: Primary UI elements are in Polish with English in brackets. Auto-translation triggers are disabled on the page to prevent browsers from overwriting the practice.
- **Premium Glassmorphic Design**: Sleek layout with dark-mode background, Polish flag crimson accents, smooth animations, and responsive grids.

## Technical Details

Built as a lightweight static site utilizing:
- Native HTML5 semantic structure.
- Vanilla CSS with custom properties, variables, flexbox/grid layouts, and cubic-bezier animations.
- Pure JavaScript (no external frameworks or dependencies) for the grammar generation engine, speech synthesis, parser, and state manager.

## Local Development

Simply open `index.html` in any web browser or serve it locally using a development server:

```bash
# Using python
python3 -m http.server 8000

# Using Node.js
npx http-server
```

## License

MIT License. Feel free to use and improve it!

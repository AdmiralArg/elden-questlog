# Elden Ring Quest Tracker

A web-based quest tracker for **Elden Ring**. Track your progress through all 28 NPC questlines in the Lands Between — never miss a step again.

## Features

- **28 Complete Questlines** — All major and side NPC quests, including Ranni, Fia, Alexander, Sellen, and more
- **178 Quest Steps** — Detailed step-by-step guidance for each questline
- **Progress Tracking** — Check off steps as you complete them. Progress saves automatically
- **Dashboard** — See your overall completion percentage and quest stats at a glance
- **Dark Theme** — Elden Ring-inspired dark interface with gold accents
- **Responsive Design** — Works on desktop, tablet, and mobile

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm (comes with Node.js)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/AdmiralArg/elden-questlog.git
   cd elden-questlog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Go to `http://localhost:5173`
   - Start tracking your quests!

## How to Use

- **Browse Quests** — The quest grid shows all 28 NPC questlines with progress bars
- **Click a Quest** — Open the detailed view to see all steps for that quest
- **Check Off Steps** — Click the checkbox next to each step as you complete it
- **Progress Persists** — Your progress is saved in your browser (localStorage) and survives even if you close the app
- **Go Back** — Use the "All Quests" button to return to the quest list

## Build for Production

To create a production-ready build:

```bash
npm run build
```

This generates optimized files in the `dist/` folder.

## Tech Stack

- **HTML/CSS/JavaScript** — Vanilla, no frameworks
- **Vite** — Fast build tool and dev server
- **localStorage** — Browser-based data persistence
- **JSON** — Quest data format

## Project Structure

```
elden-questlog/
├── index.html              # Main HTML file
├── src/
│   ├── main.js            # JavaScript logic
│   └── style.css          # Styling
├── data/
│   └── quests.json        # Quest data (28 questlines, 178 steps)
├── COMMANDS.txt           # Git/terminal command reference
└── README.md              # This file
```

## Questlines Included

**Major Quests** (related to endings):
- Ranni the Witch
- Fia, the Deathbed Companion
- Brother Corhyn & Goldmask

**Side Quests** (25 NPC storylines):
Alexander, Blaidd, Hyetta, White Mask Varre, Patches, Dung Eater, Sellen, Rogier, Nepheli, Roderika, Boc, Latenna, Kenneth Haight, Diallos, Jar-Bairn, Thops, Gowry, Rya, Volcano Manor, Irina & Edgar, Boggart, D Hunter of the Dead, Seluvis, and Bernahl.

## Tips

- **No Spoilers** — All quest descriptions are vague enough to not spoil major twists
- **Custom Data** — Want to add more quests? Edit `data/quests.json`

## Future Ideas

- Search and filter quests
- Spoiler-hide mode (blur quest descriptions until you're ready)
- Quest categories (main story vs. side quests)
- Export progress to JSON
- Dark/light mode toggle
- Backend sync (for cross-device persistence)

## License

This project is open source. Feel free to fork, modify, and learn from it.

---

**Tracking your journey through the Lands Between.** Good luck, Tarnished.

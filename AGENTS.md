# Name Wheel Picker - AI Guidelines

## 🎯 Overview
This is a React-based web application providing a dynamic spinning wheel to randomly select winners from a customizable list of names.

## 🛠️ Technology Stack
- **Framework**: React + Vite
- **Styling**: Vanilla CSS
- **Visuals/Effects**: `canvas-confetti` (for winner celebrations)
- **Persistence**: `localStorage` (key: `wheelEntries`)

## 🏗️ Architecture & Component Philosophy
- `App.jsx` serves as the top-level container, handling all state management, ticket reconciliation, local storage, and high-level interaction logic.
- `Wheel.jsx` (typically abstracting the `<Wheel>` canvas logic) focuses purely on rendering the active segment array and performing visual spin sequencing based on the supplied `prizeNumber`. The Wheel should avoid orchestrating its own state context out-of-band.
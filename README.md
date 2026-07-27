# 🐍 Neon Snake — Premium Edition

A modern, feature-rich implementation of the classic Snake Game built using **HTML, CSS, and Vanilla JavaScript**. Designed with a premium glassmorphism interface, smooth animations, responsive layout, and engaging gameplay — without any external libraries or frameworks.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Responsive](https://img.shields.io/badge/Responsive-Yes-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📸 Preview

> Add a screenshot here.

```
assets/preview.png
```

---

## ✨ Features

### 🎮 Gameplay

- Classic Snake gameplay
- Smooth movement
- Keyboard controls (Arrow Keys + WASD)
- Mobile swipe support
- Pause / Resume functionality
- Restart game
- Prevents 180° instant turns
- Collision detection (walls & self)
- Random food generation
- Food never spawns inside the snake
- Animated Game Over screen

---

### ⭐ Power-Ups

Collect special power-ups to gain temporary abilities.

| Power-Up | Effect |
|----------|--------|
| ⭐ Double Score | Doubles earned points for a limited time |
| ⚡ Speed Boost | Increases snake speed temporarily |
| 🛡 Shield | Protects against one collision |

Each power-up includes:

- Unique color & animated icon
- Spawn timer
- Expiration timer

---

### 📊 Score System

- Live Score
- High Score (saved via `localStorage`)
- Level Counter
- Difficulty Indicator

---

### 🎨 Modern UI

- Premium Glassmorphism Design
- Neon Glow Effects
- Dark Theme
- Smooth CSS Animations & Keyframes
- Responsive Layout (Desktop, Tablet, Mobile)
- Animated Background with floating gradient orbs
- Soft glowing shadows
- Rounded glassmorphic components

---

### 🎵 Sound Effects

Built entirely using the **Web Audio API** — no external audio files.

| Sound | Trigger |
|-------|---------|
| 🍎 Eat | Snake eats food |
| 🖱️ Click | Button interactions |
| 💀 Game Over | Snake collides |
| ⭐ Power-Up | Collecting a power-up |
| 🎉 Level Up | Reaching a new level |

---

### ⚙️ Settings

Fully customizable experience — saved automatically via `localStorage`.

- 🔊 Toggle Sound Effects
- ⊞ Toggle Grid Overlay
- 🎮 Difficulty Selection (Easy / Medium / Hard)
- 🎨 Theme Selection (Neon Green / Electric Blue / Cyber Purple)

---

### 🎯 Difficulty System

Speed increases automatically as you level up.

| Level | Speed |
|-------|-------|
| 1 | 180ms |
| 2 | 160ms |
| 3 | 140ms |
| 4 | 120ms |
| 5+ | 100ms+ |

---

## 📱 Responsive Design

Works seamlessly across all screen sizes:

- 💻 Desktop
- 📱 Mobile
- 📟 Tablet

Touch swipe controls are fully supported on mobile devices.

---

## 🛠 Tech Stack

| Technology | Usage |
|-----------|-------|
| HTML5 | Game structure & UI layout |
| CSS3 | Glassmorphism, animations, themes |
| Vanilla JavaScript (ES6+) | Game engine, audio, logic |

No frameworks. No libraries. No dependencies.

---

## 📂 Project Structure

```text
Neon-Snake/
│
├── index.html      ← Game structure and overlay modals
├── style.css       ← Glassmorphism UI, animations, themes
├── script.js       ← Full game engine and logic
└── README.md       ← Project documentation
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/yourusername/Neon-Snake.git
```

### Open the project

Simply open `index.html` in any modern browser.

```text
No installation required.
No build tools required.
Works entirely offline.
```

---

## 🎮 Controls

| Key / Input | Action |
|-------------|--------|
| `↑ ↓ ← →` | Move Snake |
| `W A S D` | Move Snake |
| `P` | Pause / Resume |
| `R` | Restart |
| `Space` / `Enter` | Start Game |
| Swipe | Move Snake (Mobile) |

---

## 🎨 Themes

| Theme | Color |
|-------|-------|
| 🟢 Neon Green | `#00ff88` |
| 🔵 Electric Blue | `#00c6ff` |
| 🟣 Cyber Purple | `#b967ff` |

---

## 🧠 Game Logic Highlights

- **Grid-based movement** — 25×25 canvas grid
- **Collision detection** — walls and self-intersection
- **Snake growth** — body expands on eating food
- **Level progression** — score-based leveling
- **Dynamic speed scaling** — per difficulty preset
- **Power-up system** — random spawn & lifetime timers
- **Particle engine** — canvas-based burst effects
- **`localStorage` management** — persists high score & settings
- **Web Audio engine** — fully synthesized sounds, no audio files

---

## ⚡ Performance

- Lightweight (~70 KB total, no dependencies)
- Canvas-based rendering with `requestAnimationFrame`
- Efficient particle pooling
- No unnecessary DOM updates during gameplay
- Smooth 60 FPS experience

---

## 🌟 Highlights

- Modern UI inspired by premium browser games
- Glassmorphism interface with neon glow aesthetics
- CSS keyframe animations throughout
- Dynamic power-ups with expiry arc indicators
- Animated snake eyes that follow movement direction
- Floating score notifications (`+10`, `Shield!`, `Level 2!`)
- New high score badge with pulsing animation
- Fully playable offline — zero network dependency

---

## 🎯 Future Improvements

- 🏆 Global Leaderboard
- 🕹️ Multiple Game Modes (Timed, Endless, Maze)
- 🧱 Obstacle Levels
- 📅 Daily Challenges
- 🏅 Achievements System
- 👥 Multiplayer Mode
- 🐍 Custom Snake Skins
- 🎶 Background Music
- 🤖 AI Opponent Mode

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. Create a **feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. **Push** the branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request**

---

## 📜 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and distribute it freely.

---

## 👨‍💻 Author

**Harshit Kumar**

[![GitHub](https://img.shields.io/badge/GitHub-yourusername-181717?style=for-the-badge&logo=github)](https://github.com/yourusername)

---

> ⭐ If you enjoyed this project, consider giving it a **Star** on GitHub — it means a lot!

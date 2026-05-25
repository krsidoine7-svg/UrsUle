const quotes = [
  { text: "Chaque petite étape te rapproche de ton grand rêve ! 🚀", author: "UrsUle" },
  { text: "Tu es le capitaine de ton propre navire. Garde le cap ! ⛵", author: "UrsUle" },
  { text: "L'échec n'est qu'une leçon déguisée. Rebondis plus haut ! 🏀", author: "UrsUle" },
  { text: "Même le plus grand chêne a commencé par être un petit gland. 🌱", author: "UrsUle" },
  { text: "Ta créativité est ta super-force. Utilise-la bien ! 🎨", author: "UrsUle" },
  { text: "Aujourd'hui est une page blanche, écris une belle aventure ! 📖", author: "UrsUle" },
  { text: "Le travail d'équipe transforme les rêves en réalité. 🤝", author: "UrsUle" },
  { text: "N'aie pas peur de poser des questions, c'est comme ça qu'on grandit ! 🧠", author: "UrsUle" },
  { text: "Sois fier de ce que tu as accompli aujourd'hui, même le plus petit succès compte. 🌟", author: "UrsUle" },
  { text: "Le secret pour avancer, c'est de commencer ! 🏁", author: "UrsUle" }
]

export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

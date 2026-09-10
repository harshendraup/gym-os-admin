const PAGE_BACKGROUNDS = [
  '/images/Gym-creative-4.webp',
  '/images/gym-creative-2.webp',
  '/images/gym-creative-5.webp',
  '/images/diet-nutrition.jpeg',
  '/images/hero-ai.jpeg',
  '/images/hero-gym.jpeg',
  '/images/hero-kitchen-scan.webp',
  '/images/zym-creative-6.png',
] as const

export function getRandomPageBackground() {
  return PAGE_BACKGROUNDS[Math.floor(Math.random() * PAGE_BACKGROUNDS.length)]
}

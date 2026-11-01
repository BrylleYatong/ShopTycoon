# Kevin's Cookie Shop Tycoon

Open `index.html` in any modern web browser. No install, build, account, or server is required. An internet connection is only used for optional Google Fonts; system fonts work offline.

## How to play

Start with $100 and manage up to 30 days. Choose a batch size, cookie price, and ad budget, then open the shop. Ingredients cost $0.50 per cookie baked, plus advertising and $5 daily overhead. Your cash must cover these costs before opening. Unsold cookies expire at the end of the day. The challenge ends after day 30 or if you cannot cover the next day's overhead. Try to finish with the most cash.

## Technical implementation

- `index.html` provides semantic forms, shop totals, daily results, and the journal.
- `style.css` provides the responsive cream-and-cocoa layout, typography, focus states, and mobile styling.
- `game.js` manages the simulation and renders results using plain JavaScript. No framework or dependencies are needed.
- Demand starts at 85 potential customers, multiplied by a visible daily market factor, price elasticity `(1.5 / price)^1.35`, diminishing advertising returns `1 + log(1 + ad / 10) * 0.55`, and a random 0.9–1.1 factor. Sales cannot exceed inventory.
- Revenue is sold cookies × price. Expenses include every cookie baked, advertising, and overhead. Profit is revenue minus expenses; cash changes by profit. Currency is rounded to cents.
- Input validation blocks invalid or unaffordable plans. The game checks the 30-day limit and insufficient cash after every day.
- Browser `localStorage` preserves cash, market conditions, and the daily journal across reloads. A new game resets progress; a confirmation protects an ongoing run. If storage is unavailable, the game still works for the current session.

Saved progress belongs to the current browser and file location. There is no backend or data sent to a server.

## Customer animations

Opening a day plays a CSS storefront animation in the daily results. Up to 24 emoji customers arrive, collect cookies, and leave; larger sales are grouped across visitors, with purchase quantities shown beside their cookies. The scene is decorative and uses the actual sales result without changing the simulation. Zero sales show a quiet shop. Reloading a saved game does not replay the animation. Reduced-motion preferences disable movement.

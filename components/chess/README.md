# Chess board

The chess board of the [Meridian page](../../app/meridian/page.tsx), as a React component. It has its own
rules engine for move validation, and it sends its requests to the engine, which runs as a
separate service (see the [engine repository](https://github.com/syedtaha22/meridian)).

```bash
components/chess
├── scripts
│   └── build-piece-sprite.mjs      # builds the piece sprite from the drawings
├── assets
│   ├── audio                       # the five move sounds
│   └── pieces                      # one SVG per black piece: bking, bpawn, ...
├── components
│   ├── board
│   │   ├── ChessBoard.tsx          # the board and everything around it
│   │   ├── Square.tsx
│   │   ├── Arrow.tsx               # the hint arrow
│   │   └── PromotionPicker.tsx
│   ├── game
│   │   ├── MoveList.tsx            # the moves, with a button to copy them
│   │   ├── GameSettings.tsx
│   │   ├── GameStatusBar.tsx
│   │   └── EngineCard.tsx
│   ├── charts
│   │   └── LineChart.tsx           # the timing and evaluation charts
│   └── controls                    # dropdown, number field, toggle, icons
├── hooks
│   ├── useChessGame.ts             # game state and the engine's replies
│   └── useBestMove.ts              # the move shown by the hint arrow
├── lib
│   ├── chess-rules.ts              # legal moves, check, mate, draws, perft
│   ├── api-client.ts               # requests to the engine
│   └── piece-sprite.ts             # generated, do not edit
├── tests                           # rules, notation, scores, the board in jsdom
├── chess.css                       # every style, each class prefixed chess-
└── index.ts                        # exports ChessBoard
```

## Usage

```tsx
import { ChessBoard } from '@/components/chess'

<ChessBoard apiBaseUrl="https://engine.example.com" />
```

`apiBaseUrl` is the address of the engine service. The component imports its own
[stylesheet](chess.css).

## Theme

The board reads its colors and fonts from CSS custom properties of the site. Every use has a
fallback value. The properties are `--paper`, `--card`, `--ink`, `--ink-soft`, `--muted`,
`--rule`, `--rule-soft`, `--accent`, `--accent-ink`, `--on-ink`, `--on-accent`,
`--glass-border`, `--sans` and `--mono`.

The dark theme is selected with `data-theme="dark"` on the `html` element. The glass effect of
the board uses the custom properties `--chess-*` on `.chess-board`.

## Development

From the root of the site:

```bash
npm test          # rules, notation, scores, the board in jsdom
npm run lint
npx tsc --noEmit
```

The tests in [backend.integration.test.ts](tests/backend.integration.test.ts) run against a
running engine service and are skipped without one.

After changing a piece drawing, run `npm run build:pieces`. It regenerates
[piece-sprite.ts](lib/piece-sprite.ts). The white pieces are the black drawings with lighter
shading colors, so there are six drawings and not twelve.

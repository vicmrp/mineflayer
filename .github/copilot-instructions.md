# Copilot / AI agent instructions for this repo

This repository hosts a small Mineflayer-based Minecraft bot. Below are focused, actionable notes to help an AI coding agent be immediately productive.

Quick start
- Install deps: `npm install` (see [package.json](package.json)).
- Run the bot (recommended entry): `node bot.js` — `bot.js` loads `.env` via `dotenv` and starts the bot.
- Environment vars: `MC_HOST`, `MC_PORT`, `MC_USERNAME`, `MC_AUTH`, `MC_VERSION` (see [src/config.js](src/config.js)).

Big-picture architecture
- Primary (legacy) entry: [bot.js](bot.js) — monolithic script that demonstrates behavior and loads `.env`.
- Refactored implementation lives under `src/` and is modular:
  - `src/createBot.js` — constructs the `mineflayer` bot and wires plugins.
  - `src/handlers.js` — registers chat and lifecycle handlers (chat commands, spawn, end, error).
  - `src/farm.js`, `src/follow.js` — feature modules that implement farming and following loops.
  - `src/reconnect.js` — factory that returns a `startReconnectLoop` function.
  - `src/state.js` — single shared mutable state object (holds `bot`, `followTarget`, flags, timers).
  - `src/helpers.js` and `src/watchdog.js` — small utilities; note: `startPlayerWatchdog()` is defined but not invoked by `createBot`.

Core patterns & conventions (project-specific)
- Single shared state: modules read/write the exported `state` object from [src/state.js](src/state.js) rather than passing `bot` through every call. Prefer updating `state` for flags and timers.
- Feature loops: long-running behaviors (farmLoop, followLoop) are implemented as functions that loop with `await` + `sleep` and guard flags like `state.farmLoopRunning`/`state.farmingEnabled` (see [src/farm.js](src/farm.js)). Do not spawn duplicate loops — check flag guards.
- Handler wiring: `registerHandlers(bot, { startReconnectLoop })` is used to connect bot lifecycle events and chat commands; reconnect logic is injected via the factory returned from `createStartReconnectLoop` (see [src/reconnect.js](src/reconnect.js) and [src/createBot.js](src/createBot.js)).
- Minimal error handling: modules typically `catch` errors and `console.error` with a short prefix (e.g. `[FARM]`, `[FOLLOW]`) — follow that style for new modules.
- Movement & tools: uses `mineflayer-pathfinder`, `mineflayer-collectblock`, and `mineflayer-tool`. Use `Movements` + `pathfinder.setMovements` and `bot.tool.equipForBlock` when interacting with blocks (see [src/handlers.js](src/handlers.js) and [src/farm.js](src/farm.js)).

Developer workflows & run/debug notes
- No `npm start` script: run `node bot.js` to start and ensure `.env` present in project root.
- To test changes in modular code under `src/`, either run `node bot.js` (which bootstraps everything) or invoke the `createBot` exported function from `src/createBot.js` while ensuring `dotenv` has been loaded in the caller.
- Logs are plain `console.log`/`console.error`; prefix new logs with a concise tag in square brackets (matching existing style).

Integration points & external dependencies
- External services: Minecraft server connection configured by env vars above; RCON dependency is present in `package.json` but not used in the refactor — search before modifying.
- Key npm deps: `mineflayer`, `mineflayer-pathfinder`, `mineflayer-collectblock`, `mineflayer-tool` (see [package.json](package.json)).

Examples to reference when editing or adding code
- Add a new loop-based feature: copy pattern from [src/farm.js](src/farm.js) — guard with `state.<feature>Enabled` and `<feature>LoopRunning` flags.
- Add a new chat command: extend [src/handlers.js](src/handlers.js) and call appropriate exported functions (e.g., `followLoop()` in [src/follow.js](src/follow.js)).
- To modify reconnect behavior: update the factory in [src/reconnect.js](src/reconnect.js) and ensure `createBot` supplies itself to the factory as `createStartReconnectLoop(createBot)` in [src/createBot.js](src/createBot.js).

What to watch for / discovered inconsistencies
- `bot.js` and `src/` show two styles: `bot.js` is a runnable monolith that uses `dotenv`, while `src/` holds a modular refactor. If you run modules directly, ensure `.env` is loaded.
- `src/watchdog.js` exports `startPlayerWatchdog()` but it is not invoked in `createBot`/`handlers` — consider whether the watchdog should be started on spawn.

If unclear or incomplete
- Tell me which area you want more detail on (run/debug, a specific module, or wiring patterns), and I will expand examples or adjust wording.

-- End of file

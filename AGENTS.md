# AGENTS.md — Ma Sói 3D Architecture Guide

## Project Overview

**Ma Sói 3D** is an AI-powered Werewolf (Mafia) game where all players are LLM agents. Each agent has a unique personality, role, and private memory. They discuss in Vietnamese, deceive, vote, and kill each other — all driven by LLM calls with carefully crafted prompts.

The game is a monorepo with 3 packages:

```
packages/
├── shared/    # Types, enums, role distribution, game state interfaces
├── server/    # Game engine, AI agents, LLM providers, Socket.IO server
└── client/    # React + Three.js 3D viewer (spectator UI)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React)                       │
│  Lobby → GameView → VillageScene (3D) + HUD (chat/log)  │
│  Connects via Socket.IO, receives GameEvents + GameState │
└──────────────────────────┬──────────────────────────────┘
                           │ Socket.IO
┌──────────────────────────▼──────────────────────────────┐
│                   SERVER (Express + Socket.IO)           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   GameMaster                      │   │
│  │  - Owns GameState (single source of truth)        │   │
│  │  - Runs the game loop: Day→Dusk→Judgement→Night→Dawn │
│  │  - Emits GameEvents                              │   │
│  │  - Delegates decisions via ActionResolver interface│   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ implements ActionResolver         │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │                AgentManager                       │   │
│  │  - Creates AgentBrain per player                  │   │
│  │  - Listens to GameEvents → converts to            │   │
│  │    Vietnamese observations per agent (memory)     │   │
│  │  - Routes ActionResolver calls to correct brain   │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ per player                       │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │                 AgentBrain                        │   │
│  │  - Holds AgentMemory (observations, suspicions)   │   │
│  │  - Uses role-specific PromptBuilder               │   │
│  │  - Calls LLMProvider.chat() with:                 │   │
│  │    system = PromptBuilder.systemPrompt()          │   │
│  │    user   = role-specific action prompt            │   │
│  │  - Parses JSON response → validated action        │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │              LLM Providers                        │   │
│  │  OpenAI / Anthropic / Ollama / OpenAI-compatible  │   │
│  │  Each player can use a different provider/model   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Game Loop (GameMaster)

**File:** `packages/server/src/game/GameMaster.ts`

GameMaster is the core engine. It owns `GameState` and runs the main loop:

```
startGame()
  ├── cupidPhase()          # First game only: Cupid pairs two players
  └── while (!winner):
        ├── dayPhase()       # Reactive discussion (time-limited, subset speakers)
        ├── duskPhase()      # Nomination vote (pick 1 for trial)
        ├── judgementPhase() # Defense speech → kill/spare vote (>50% to execute)
        ├── nightPhase()     # Guard→Wolves→Witch→Seer (sequential)
        └── dawnPhase()      # Announce night deaths, resolve kills
```

### Phase Details

| Phase         | What Happens                                                                                                                                                                                                       | Resolver Methods Called                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Day**       | Hybrid reactive discussion: each tick picks 2-3 candidates (prioritizing least-spoken), asks in parallel. Agents return `wantToSpeak: true/false`. Stops on time limit, max rounds, or 2 consecutive silent ticks. | `discuss(player, state, messages, round)` → `{message, wantToSpeak}`                                    |
| **Dusk**      | Each alive player votes to nominate someone for trial. Most votes = accused (ties = no one).                                                                                                                       | `vote(player, state, messages)`                                                                         |
| **Judgement** | Accused gives defense speech. Others vote kill/spare. >50% kill = executed. Fool wins if executed here.                                                                                                            | `defend(accused, state, messages)` then `judgeVote(voter, state, accusedName, defenseSpeech, messages)` |
| **Night**     | Sequential: Guard protects → Wolves attack → Witch heals/poisons → Seer investigates. Actions stored as `NightAction[]`.                                                                                           | `guardProtect`, `wolfKill`/`wolfDoubleKill`/`alphaInfect`, `witchAction`, `seerInvestigate`             |
| **Dawn**      | Resolve night: check guard/heal blocks, apply deaths. Deaths trigger cascades (Hunter shot, Lover death, Wolf Cub revenge).                                                                                        | `hunterShot(hunter, state)` if Hunter dies                                                              |

### Key Mechanics

- **Kill cascades:** `killPlayer()` is recursive — Hunter death triggers shot, Lover death triggers partner death, each can trigger further cascades.
- **Win conditions:** Checked after every death. Wolves ≥ Villagers = Wolf win. All wolves dead = Village win. Cross-team couple as last 2 alive = Lovers win. Fool executed = Fool wins.
- **Pacing:** `autoPlay: true` uses `phaseDelay` timers. `autoPlay: false` waits for manual `step()` calls.
- **Events:** Every action emits a `GameEvent` with `isPublic` flag. Public events go to all clients; private events only in god-view mode.

---

## Roles System

**File:** `packages/shared/src/index.ts`

### All Roles

| Role             | Team      | Special Ability                                                                                  |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `Werewolf`       | Wolf      | Votes to kill 1 villager each night                                                              |
| `AlphaWolf`      | Wolf      | Can infect 1 player (convert to wolf) instead of killing, once per game                          |
| `WolfCub`        | Wolf      | On death, wolves kill 2 next night (revenge)                                                     |
| `Villager`       | Village   | No ability, uses logic and social deduction                                                      |
| `Seer`           | Village   | Investigates 1 player per night: "Wolf" or "Not Wolf"                                            |
| `ApprenticeSeer` | Village   | Inherits Seer power when original Seer dies                                                      |
| `Witch`          | Village   | 1 heal potion (save wolf victim) + 1 kill potion (poison anyone). Each once per game             |
| `Hunter`         | Village   | On death (except witch poison): shoots 1 player                                                  |
| `Guard`          | Village   | Protects 1 player per night from wolf kill. Can't protect same person twice in a row             |
| `Cupid`          | Village   | Pairs 2 players on first night. If one dies, the other dies too. Cross-team couple = Lovers team |
| `Fool`           | Village\* | Wins instantly if executed by village vote. Dies normally to wolves                              |

### Role Distribution

`getRoleDistribution(playerCount, enabledRoles)` balances wolves vs village:

- 6-8 players: 2 wolves
- 9-12 players: 3 wolves
- 13-16 players: 4 wolves
- Seer is always included. Other special roles are toggleable with `minPlayers` thresholds.

### Night Action Order

1. **Guard** protects (blocks wolf kill only, not witch poison)
2. **Wolves** attack (normal kill, double kill if WolfCub revenge, or Alpha infect)
3. **Witch** acts (knows who was bitten; can heal and/or poison)
4. **Seer** investigates (or Apprentice Seer if activated)
5. **Resolve:** Apply guard/heal blocks, then execute remaining kills

---

## Agent AI System

### AgentManager

**File:** `packages/server/src/game/AgentManager.ts`

Bridges GameMaster ↔ AgentBrains. Responsibilities:

- **Setup:** Creates `Player[]` with shuffled roles, random personalities, and an `AgentBrain` per player.
- **Memory feed:** Listens to `gameEvent` emissions → converts each event to a Vietnamese observation string via `eventToObservation()`, filtered by what each player should know (role-gated visibility).
- **Action routing:** Implements `ActionResolver` interface — each method delegates to the correct `AgentBrain`.

### Observation Visibility Rules

Not all agents see all events. `eventToObservation()` filters:

| Event                                      | Who Sees                 |
| ------------------------------------------ | ------------------------ |
| Phase changes, deaths, day messages, votes | Everyone                 |
| Seer result                                | Only the Seer            |
| Guard protect                              | Only the Guard           |
| Witch action                               | Only the Witch           |
| Wolf kill target                           | Only wolves              |
| Alpha infect                               | Wolves + infected target |
| Wolf Cub revenge                           | Only wolves              |
| Cupid pair                                 | Only Cupid               |
| Apprentice activation                      | Only the Apprentice      |

### AgentBrain

**File:** `packages/server/src/agents/brain.ts`

One per player. Core loop for every decision:

```
1. Get role-specific PromptBuilder
2. Build system prompt: gameRules + speechRules + playerContext + roleIdentity + personality
3. Build user prompt: memory/observations + task-specific action prompt
4. Call LLMProvider.chat(system, user) with temperature=0.85, maxTokens=300, jsonMode=true
5. Parse JSON response — discuss() returns {message, wantToSpeak}; other actions use parseActionResponse() with fuzzy name matching + random fallback
```

### AgentMemory

```typescript
interface AgentMemory {
  observations: string[]; // Vietnamese log of everything this agent knows
  reflections: string[]; // (reserved, not yet used)
  knownRoles: Record<string, Role>; // (reserved, not yet used)
  suspicions: Record<string, number>; // (reserved, not yet used)
}
```

Currently only `observations` is actively used. Memory is compressed before inclusion in prompts (see Memory Compression below).

### Memory Compression

**File:** `packages/server/src/agents/memory-compression.ts`

In long games, raw observations can grow to 50-100+ entries. Naively slicing to the last N entries causes agents to forget critical early-game facts (deaths, seer results, vote outcomes). Memory compression solves this by preserving key facts from older rounds while keeping recent observations raw.

**How it works:**

```
All observations (e.g., 80 entries)
  ├── OLD (first 60) → Rule-based extraction → Compact summary
  └── RECENT (last 20) → Kept raw, verbatim
```

1. If ≤20 observations → no compression, all passed raw
2. If >20 → split at `length - 20`:
   - **Old observations** are scanned and categorized by importance:
     - Deaths + role reveals (always kept)
     - Seer investigation results (always kept)
     - Execution/judgement outcomes (always kept)
     - Key events: infect, cupid pair, hunter shot, potions, guard protect, wolf cub revenge
     - Vote patterns: condensed to `"A,B → C; D → E"` format
     - Chat messages from old rounds: dropped (noise by that point)
   - **Recent observations** are included verbatim

**Prompt output example:**

```
TÓM TẮT CÁC VÒNG TRƯỚC:
Chết: Minh đã chết (bị sói cắn). Vai: Dân. | Lan đã chết (bị treo cổ). Vai: Sói.
Soi: Mày soi Hùng: LÀ SÓI! | Mày soi Tú: Không phải sói.
Phán xét: Lan bị treo cổ sau phán xét.
Vote cũ: Hùng,Minh → Lan; Tú → Hùng

NHẬT KÝ GẦN ĐÂY:
- --- Vòng 3, Ban ngày ---
- Hùng nói: "Tao thấy thằng Tú im quá..."
- ...
```

**Key design choices:**

- Rule-based, not LLM-based — no extra API calls, no latency, deterministic
- Importance detection via regex patterns matching Vietnamese observation format
- Integrated transparently: `memoryPrompt()` delegates to `compressedMemoryPrompt()`, so all prompt builders benefit automatically

### Role Deduction Tracker

**File:** `packages/server/src/agents/role-deduction.ts`

Agents need structured knowledge about other players' roles — not just raw text. The tracker extracts facts from observations using an **extractor pattern** and builds a `PHÂN TÍCH ROLE` block injected into every LLM call.

**What it tracks:**

| Category        | Source                                    | Example                                                       |
| --------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Confirmed roles | Death events (`"X đã chết. Vai: Y"`)      | `Lan = Sói (chết lộ role)`                                    |
| Seer results    | Seer observations (`"Mày soi X: LÀ SÓI"`) | `Hùng = SÓI`                                                  |
| Role claims     | Chat/defense (`"tao là Thợ Săn"`)         | `Hùng tự nhận Thợ Săn (vòng 3)`                               |
| Accusations     | Chat (`"thằng Y sói chắc luôn"`)          | `Hùng (3 người tố)`                                           |
| ⚠ Conflicts     | Claim matches agent's own role            | `Hùng claim Thợ Săn nhưng MÀY mới là Thợ Săn thật → NÓI LÁO!` |

**Extractor pattern:** Each extractor is a function `(obs, round) → Fact | null`. Adding new extractors = appending to an array, no core logic changes.

**Integration:** The deduction block is injected at the `AgentBrain.ask()` level — prepended to the user prompt before every LLM call. Zero changes needed in prompt builders or the PromptBuilder interface.

**Prompt output example:**

```
PHÂN TÍCH ROLE:
Xác nhận: Lan = Sói | Minh = Dân
Soi: Hùng = SÓI | Tú = Không sói
Claim: Hùng tự nhận Thợ Săn (vòng 3)
⚠ Hùng claim Thợ Săn nhưng MÀY mới là Thợ Săn thật → Hùng NÓI LÁO!
Bị tố sói: Hùng (3 người tố) | Tú (1 người tố)
```

---

## Prompt Architecture

### Two-Layer Design

Every LLM call uses exactly 2 messages:

1. **System message** (heavy, reused per player): Built by `PromptBuilder.systemPrompt()`:
   - `gameRules()` — Full game rules in Vietnamese
   - `speechRules()` — Strict anti-AI-speak rules ("no robot talk, speak like real Vietnamese friends playing a game")
   - `playerContext()` — Current player name, role, team, round, alive/dead lists, couple info
   - `roleIdentity()` — Role-specific strategy and secrets (e.g., wolf teammates, potion status)
   - `personalityPrompt()` — Personality trait + speech style to maintain

2. **User message** (lightweight, changes per action): Built by action-specific methods:
   - `taskContext()` — Compressed memory: structured summary of old observations + last 20 raw (via `compressedMemoryPrompt()`)
   - Action-specific instructions + valid target list
   - Required JSON response format

### PromptBuilder Hierarchy

```
BasePromptBuilder (abstract)
├── VillagerPromptBuilder
├── SeerPromptBuilder
│   └── ApprenticeSeerPromptBuilder
├── WitchPromptBuilder
├── GuardPromptBuilder
├── HunterPromptBuilder
├── CupidPromptBuilder
├── FoolPromptBuilder
└── WolfPromptBuilder
    ├── AlphaWolfPromptBuilder
    └── WolfCubPromptBuilder
```

**File:** `packages/server/src/agents/prompt-builders/`

Each builder overrides:

- `roleIdentity()` — Who you are, your secrets, your strategy
- `discussionHint()` — How to behave during day discussion
- `voteHint()` — How to vote (optional override)
- `defenseHint()` — How to defend when on trial (optional override)
- `judgementHint()` — How to judge others on trial (optional override)
- Night action methods (role-specific): `wolfKill()`, `seerInvestigate()`, `witchAction()`, etc.

### Response Parsing

**File:** `packages/server/src/agents/prompts.ts`

`parseActionResponse(response, validNames)`:

- Extracts first JSON object from LLM response via regex
- Fuzzy-matches `target`, `target1`, `target2`, `player1`, `player2`, `killTarget` against valid player names (case-insensitive)
- Falls back to random valid target if no match found
- Extracts `message`, `heal`, `infect`, `verdict`, `reasoning` fields

All LLM responses are expected as JSON: `{"target":"Name","reasoning":"..."}` (varies by action).

---

## Personality System

**File:** `packages/server/src/agents/personalities.ts`

16 predefined personalities, each with:

| Field         | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `id`          | Unique key (e.g., `aggressive`, `analyst`)               |
| `name`        | Display name (e.g., `Blaze`, `Sage`)                     |
| `trait`       | Vietnamese trait description injected into system prompt |
| `speechStyle` | Vietnamese speech pattern instructions                   |
| `emoji`       | Visual identifier                                        |

Examples: aggressive accuser 🔥, calm analyst 🧠, suspicious detective 🔍, silent ghost 👻, trickster fox 🦊.

Personalities are randomly assigned (shuffled) unless explicitly set in `PlayerSetup.personalityId`.

---

## LLM Provider System

**File:** `packages/server/src/providers/`

```typescript
interface LLMProvider {
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  test(): Promise<boolean>;
}
```

Supported types:

- `openai` / `openai-compatible` — OpenAI SDK (works with any OpenAI-compatible API)
- `anthropic` — Anthropic SDK
- `ollama` — Local Ollama instance

Each player can use a different provider/model. Providers are registered at game setup from `GameConfig.providers[]`.

Default provider can be configured via env vars: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.

---

## Server & Communication

**File:** `packages/server/src/index.ts`

Express + Socket.IO server. Communication flow:

### Socket Events (Client → Server)

| Event                | Payload          | Action                                             |
| -------------------- | ---------------- | -------------------------------------------------- |
| `create_game`        | `GameConfig`     | Creates GameMaster + AgentManager, sets up players |
| `start_game`         | —                | Starts the game loop (async, runs in background)   |
| `pause_game`         | —                | Pauses auto-play                                   |
| `resume_game`        | —                | Resumes auto-play                                  |
| `step_game`          | —                | Advances one step in manual mode                   |
| `set_spectator_mode` | `'god' \| 'fog'` | God = see all events; Fog = public events only     |

### Socket Events (Server → Client)

| Event        | When                                                          |
| ------------ | ------------------------------------------------------------- |
| `game_event` | Every GameEvent (filtered by god/fog view)                    |
| `game_state` | On phase changes, game start, game over (full state snapshot) |
| `error`      | On any error                                                  |

### REST Endpoints

| Endpoint                    | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `GET /api/health`           | Health check                            |
| `GET /api/personalities`    | List all 16 personalities               |
| `GET /api/default-provider` | Get env-configured default provider     |
| `GET /api/roles/:count`     | Preview role distribution for N players |
| `POST /api/providers/test`  | Test an LLM provider connection         |

---

## GameState Shape

```typescript
interface GameState {
  id: string;
  config: GameConfig; // includes discussionRounds, discussionTimeLimitMs, phaseDelay
  phase: Phase; // Lobby|Night|Dawn|Day|Dusk|Judgement|GameOver
  round: number;
  players: Player[]; // All players with role, alive status, personality
  events: GameEvent[]; // Full event log
  nightActions: NightAction[]; // Current night's actions
  votes: Vote[]; // Current dusk nomination votes
  witchPotions: WitchPotions; // {healUsed, killUsed}
  lastGuardedId: string | null; // Guard can't protect same person twice
  winner: Team | 'Fool' | null;
  isPaused: boolean;
  discussionMessages: DayMessage[];
  accusedId: string | null; // Who's on trial in Judgement
  defenseSpeech: DefenseMessage | null;
  judgementVotes: JudgementVote[];
  pendingDeaths: { playerId; playerName; cause }[]; // Night deaths awaiting Dawn
  couple: CoupleState | null; // Cupid pair
  alphaInfectUsed: boolean;
  wolfCubDead: boolean;
  wolfCubRevengeActive: boolean; // Wolves kill 2 this night
  originalSeerDead: boolean;
  apprenticeSeerActivated: boolean;
}
```

---

## Client Architecture

**File:** `packages/client/src/`

React + Zustand store + Three.js (React Three Fiber) for 3D rendering.

- **Lobby** (`components/lobby/Lobby.tsx`): Configure game — player count, names, providers, personalities, enabled roles, discussion time limit.
- **GameView** (`components/game/GameView.tsx`): Main game screen wrapper.
- **VillageScene** (`components/scene/VillageScene.tsx`): 3D village with characters, campfire, trees, ground.
- **Character** (`components/scene/Character.tsx`): 3D player model with visual effects — vote lines, seer glow, shield bubble, wolf slash, potion burst, death particles, Zzz sleep.
- **HUD** (`components/hud/HUD.tsx`): Overlay with chat log, player roster, game controls (play/pause/step).
- **gameStore** (`store/gameStore.ts`): Zustand store managing Socket.IO connection, game state, spectator mode.

---

## Key Design Decisions

1. **All-AI game:** No human players. Every decision is an LLM call. The human is a spectator.
2. **Vietnamese prompts:** All agent communication is in Vietnamese slang/casual speech. Anti-AI-speak rules are strict.
3. **Role-gated memory:** Agents only know what their role allows. Wolves see wolf kills, Seer sees investigation results, etc.
4. **JSON-only responses:** All LLM outputs are parsed as JSON with fuzzy name matching and random fallbacks for robustness.
5. **Personality-driven:** Each agent has a distinct personality that affects speech style, making games feel varied and entertaining.
6. **Provider-agnostic:** Any OpenAI-compatible, Anthropic, or Ollama model works. Mix models in the same game.
7. **Separation of concerns:** GameMaster knows nothing about AI — it only calls `ActionResolver` methods. AgentManager/AgentBrain handle all LLM logic.
8. **Memory compression:** Old observations are rule-based compressed (deaths, seer results, votes preserved; chat dropped) while recent 20 stay raw — no extra LLM calls, deterministic, agents never forget critical facts.

---

## File Map

```
packages/shared/src/
  index.ts                    # All types, enums, interfaces, role distribution

packages/server/src/
  index.ts                    # Express + Socket.IO server, REST endpoints
  game/
    GameMaster.ts             # Game loop engine, phase management, kill resolution
    AgentManager.ts           # ActionResolver impl, brain management, event→observation
  agents/
    brain.ts                  # AgentBrain: memory + LLM calls + response parsing
    prompts.ts                # parseActionResponse() — JSON extraction + name matching
    personalities.ts          # 16 predefined Vietnamese personalities
    memory-compression.ts     # Rule-based observation compression for long games
    role-deduction.ts         # Extracts role claims, accusations, seer results into structured analysis
    prompt-builders/
      base.ts                 # BasePromptBuilder + shared helpers (gameRules, speechRules, etc.)
      index.ts                # PromptBuilder registry by Role
      wolf.ts                 # Wolf, AlphaWolf, WolfCub builders
      seer.ts                 # Seer, ApprenticeSeer builders
      witch.ts                # Witch builder
      guard.ts                # Guard builder
      hunter.ts               # Hunter builder
      cupid.ts                # Cupid builder
      fool.ts                 # Fool builder
      villager.ts             # Villager builder
  providers/
    types.ts                  # LLMProvider, LLMMessage, LLMOptions interfaces
    index.ts                  # Provider registry + factory
    openai.ts                 # OpenAI/compatible provider
    anthropic.ts              # Anthropic provider
    ollama.ts                 # Ollama provider

packages/client/src/
  main.tsx                    # React entry point
  App.tsx                     # Router: Lobby vs GameView
  store/gameStore.ts          # Zustand store + Socket.IO connection
  components/
    lobby/Lobby.tsx           # Game configuration UI
    game/GameView.tsx         # Game screen wrapper
    hud/HUD.tsx               # Chat log, roster, controls overlay
    scene/
      VillageScene.tsx        # 3D scene composition
      Character.tsx           # 3D player with visual effects
      Campfire.tsx            # Animated campfire
      Trees.tsx               # Trees + house decorations
      Ground.tsx              # Ground plane
```

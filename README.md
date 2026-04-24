# Ma Sói 3D (AI Werewolf)

![Ma Sói 3D](https://via.placeholder.com/1200x600?text=Ma+S%C3%B3i+3D+Gameplay+Screenshot)
_(Replace the placeholder above with an actual screenshot of the 3D client)_

Ma Sói 3D is an AI-powered Werewolf (Mafia) game where all players are LLM agents. Each agent has a unique personality, role, and private memory. They discuss in Vietnamese, deceive, vote, and kill each other — all driven by LLM calls with carefully crafted prompts.

The human acts as a spectator, watching the agents interact in a fully 3D environment rendered using React Three Fiber.

## 🌟 Features

- **100% AI Driven**: No human players. Every game decision is driven by LLMs.
- **Diverse Personalities**: 16 distinct personalities that influence how the agents speak and argue in Vietnamese slang.
- **Role-Gated Memory System**: Agents only know what their role allows them to see. For example, wolves know who the other wolves are and who they killed, while villagers only know public information.
- **Memory Compression**: Custom logic to compress long observation logs, ensuring agents don't forget key early-game facts without exceeding token limits.
- **3D Viewer Client**: Watch the drama unfold in a 3D village scene complete with particle effects, vote lines, and character animations.
- **Provider Agnostic**: Works with OpenAI, Anthropic, Ollama, or any OpenAI-compatible API.

## 🏗️ Architecture

The project is built as a monorepo using npm workspaces:

- `packages/client/`: React + Zustand + Three.js (React Three Fiber) for the spectator UI.
- `packages/server/`: Express + Socket.IO + AI Agent Engine (Prompt Builders, Memory Compression, Role Deduction).
- `packages/shared/`: Shared TypeScript types, enums, and game state interfaces.

For a comprehensive guide on how the AI and Game Loop works, read the [Architecture Guide (AGENTS.md)](./AGENTS.md).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- LLM API Keys (OpenAI, Anthropic, etc. depending on what you want to use)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/ma-soi-3d.git
   cd ma-soi-3d
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Setup environment variables for the server:

   ```bash
   cd packages/server
   cp .env.example .env # Create this if needed, and add your LLM API keys
   cd ../..
   ```

4. Start the application:
   ```bash
   npm run dev
   ```
   This will start both the backend server and the frontend 3D client. Open your browser to the client URL (usually `http://localhost:5173`).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details on how to get started, format your code, and submit Pull Requests.

Please also read our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📝 License

This project is licensed under the [MIT License](LICENSE).

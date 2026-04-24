# Contributing to Ma Sói 3D

First off, thank you for considering contributing to Ma Sói 3D! It's people like you that make open-source a great community.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

## Project Architecture

Ma Sói 3D is a monorepo consisting of:

- `packages/client`: React + Three.js (React Three Fiber) 3D viewer.
- `packages/server`: Express + Socket.IO server, GameMaster engine, and AI Agents logic.
- `packages/shared`: Shared types and logic.

For a deep dive into the architecture, especially the AI Agent System and the GameMaster engine, please read [AGENTS.md](AGENTS.md).

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/ma-soi-3d.git
   cd ma-soi-3d
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```
   This will start both the server and the client concurrently.

## Making Changes

1. **Create a branch**: Branch off of `main`. Use a descriptive name like `feat/add-new-role` or `fix/client-crash`.

   ```bash
   git checkout -b your-branch-name
   ```

2. **Make your changes**: Write your code.
   - We use Prettier and ESLint for code formatting and linting. They will automatically run on pre-commit (via Husky).
   - Ensure your code follows the existing style and architecture (especially the `PromptBuilder` pattern for agents if you are adding AI logic).

3. **Commit your changes**: Write clear, concise commit messages.

   ```bash
   git commit -m "feat(server): add new role Logic"
   ```

4. **Push to your fork**:

   ```bash
   git push origin your-branch-name
   ```

5. **Open a Pull Request**: Submit a Pull Request to the `main` branch of this repository. Please use the provided PR template and link any relevant issues.

## Reporting Bugs and Requesting Features

Please use the [GitHub Issues](https://github.com/YOUR-USERNAME/ma-soi-3d/issues) tab to report bugs or request features. We have provided templates to help you structure your requests.

We look forward to your contributions!

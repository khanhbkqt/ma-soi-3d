import { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Phase, Role, GameEventType, GameEvent, isWolfRole } from '@ma-soi/shared';

const ROLE_COLORS: Record<Role, string> = {
  [Role.Werewolf]: '#ef4444', [Role.AlphaWolf]: '#dc2626', [Role.WolfCub]: '#f87171',
  [Role.Villager]: '#4ade80', [Role.Seer]: '#a855f7', [Role.ApprenticeSeer]: '#c084fc',
  [Role.Witch]: '#34d399', [Role.Hunter]: '#f97316', [Role.Guard]: '#3b82f6',
  [Role.Cupid]: '#f472b6', [Role.Fool]: '#fbbf24',
};
const ROLE_NAMES_VI: Record<Role, string> = {
  [Role.Werewolf]: 'Sói', [Role.AlphaWolf]: 'Sói Đầu Đàn', [Role.WolfCub]: 'Sói Con',
  [Role.Villager]: 'Dân', [Role.Seer]: 'Tiên Tri', [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự',
  [Role.Witch]: 'Phù Thủy', [Role.Hunter]: 'Thợ Săn', [Role.Guard]: 'Bảo Vệ',
  [Role.Cupid]: 'Thần Tình Yêu', [Role.Fool]: 'Kẻ Ngốc',
};
const PHASE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  [Phase.Night]: { label: 'Đêm', icon: '🌙', color: 'text-blue-300' },
  [Phase.Dawn]: { label: 'Rạng Sáng', icon: '🌅', color: 'text-orange-300' },
  [Phase.Day]: { label: 'Thảo Luận', icon: '☀️', color: 'text-yellow-300' },
  [Phase.Dusk]: { label: 'Hoàng Hôn', icon: '🌇', color: 'text-amber-300' },
  [Phase.Judgement]: { label: 'Phán Xét', icon: '⚖️', color: 'text-red-300' },
  [Phase.GameOver]: { label: 'Kết Thúc', icon: '🏆', color: 'text-red-300' },
  [Phase.Lobby]: { label: 'Sảnh Chờ', icon: '⏳', color: 'text-gray-300' },
};

function ChatLog() {
  const events = useGameStore(s => s.events);
  const spectatorMode = useGameStore(s => s.spectatorMode);
  const gameState = useGameStore(s => s.gameState);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [events.length]);

  const filtered = spectatorMode === 'god' ? events : events.filter(e => e.isPublic);

  const renderEvent = (e: GameEvent, i: number) => {
    const d = e.data;
    switch (e.type) {
      case GameEventType.DayMessage: {
        const player = gameState?.players.find(p => p.id === d.playerId);
        const color = spectatorMode === 'god' && player ? ROLE_COLORS[player.role] : '#e0e0e0';
        return (
          <div key={i} className="mb-2 animate-fadeIn">
            <span className="font-bold text-sm" style={{ color }}>{player?.personality.emoji} {d.playerName}</span>
            <p className="text-sm text-gray-200 ml-5 mt-0.5">{d.message}</p>
          </div>
        );
      }
      case GameEventType.VoteCast:
        return (
          <div key={i} className="vote-cast-entry flex items-center gap-2 mb-1.5 px-2 py-1 rounded-lg bg-amber-900/20 border border-amber-700/30">
            <span className="vote-icon text-base">🗳️</span>
            <span className="text-xs text-amber-200 font-medium">{d.voterName}</span>
            <span className="text-xs text-amber-500">→</span>
            <span className="text-xs text-red-300 font-semibold">{d.targetName}</span>
          </div>
        );
      case GameEventType.DuskNomination:
        return (
          <div key={i} className="defense-card rounded-xl p-3 mb-3 border border-red-600/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-amber-900/20 to-transparent" />
            <div className="relative z-10 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-red-400 font-bold text-sm">{d.accusedName} bị đưa lên giàn!</span>
            </div>
          </div>
        );
      case GameEventType.DefenseSpeech: {
        const player = gameState?.players.find(p => p.id === d.playerId);
        return (
          <div key={i} className="defense-card rounded-xl p-4 mb-3 border border-amber-500/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-red-900/15 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚖️</span>
                <span className="text-amber-300 font-bold text-sm">Biện hộ — {d.playerName}</span>
                {spectatorMode === 'god' && player && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: ROLE_COLORS[player.role], backgroundColor: ROLE_COLORS[player.role] + '20' }}>
                    {ROLE_NAMES_VI[player.role]}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-100 italic ml-6">"{d.message}"</p>
            </div>
          </div>
        );
      }
      case GameEventType.JudgementVoteCast: {
        const isKill = d.verdict === 'kill';
        return (
          <div key={i} className={`flex items-center gap-2 mb-1.5 px-2 py-1 rounded-lg ${isKill ? 'judgement-verdict-kill bg-red-900/20' : 'judgement-verdict-spare bg-green-900/20'}`}>
            <span className="text-base">{isKill ? '🔴' : '🟢'}</span>
            <span className="text-xs text-gray-300 font-medium">{d.voterName}</span>
            <span className={`text-xs font-bold ${isKill ? 'text-red-400' : 'text-green-400'}`}>
              {isKill ? 'GIẾT' : 'THA'}
            </span>
          </div>
        );
      }
      case GameEventType.JudgementResult: {
        const totalVotes = d.killVotes + d.spareVotes;
        return (
          <div key={i} className="vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{d.executed ? '⚰️' : '✋'}</span>
                <span className={`font-bold text-sm ${d.executed ? 'text-red-400' : 'text-green-400'}`}>
                  {d.executed ? `${d.accusedName} bị xử tử!` : `${d.accusedName} được tha!`}
                </span>
                {d.executed && spectatorMode === 'god' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-300">
                    {ROLE_NAMES_VI[d.accusedRole as Role] || d.accusedRole}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-red-400">🔴 Giết:</span>
                  <span className="font-bold text-red-300">{d.killVotes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-400">🟢 Tha:</span>
                  <span className="font-bold text-green-300">{d.spareVotes}</span>
                </div>
                <span className="text-gray-500">({totalVotes} phiếu, cần &gt;{Math.floor(totalVotes / 2)} để giết)</span>
              </div>
            </div>
          </div>
        );
      }
      case GameEventType.VoteResult: {
        if (d.exiled) {
          return (
            <div key={i} className="vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚰️</span>
                  <span className="text-red-400 font-bold text-sm">{d.exiled.name} bị trục xuất!</span>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="flex items-center gap-2 mb-2 px-2 py-1">
            <span className="text-lg">✋</span>
            <span className="text-gray-400 text-sm font-medium">Không ai bị chỉ định.</span>
          </div>
        );
      }
      case GameEventType.PlayerDied: {
        const roleName = ROLE_NAMES_VI[d.role as Role] || d.role;
        const causes: Record<string, string> = {
          wolf_kill: 'bị sói cắn', witch_kill: 'bị đầu độc', judged: 'bị xử tử',
          hunter_shot: 'bị thợ săn bắn', lover_death: 'chết vì tình',
          voted_out: 'bị trục xuất',
        };
        return <div key={i} className="text-red-400 text-sm mb-1">💀 {d.playerName} đã chết ({causes[d.cause] || d.cause}) — là {roleName}</div>;
      }
      case GameEventType.HunterShot:
        return <div key={i} className="text-orange-400 text-sm mb-1">🏹 Thợ Săn bắn hạ {d.targetName}!</div>;
      case GameEventType.LoverDeath:
        return <div key={i} className="text-pink-400 text-sm mb-1">💔 {d.loverName} chết vì tình sau cái chết của {d.deadName}!</div>;
      case GameEventType.PhaseChanged:
        return <div key={i} className="text-center text-xs text-gray-500 my-2 border-t border-gray-700 pt-2">{PHASE_INFO[d.phase]?.icon} {PHASE_INFO[d.phase]?.label} — Vòng {d.round}</div>;
      case GameEventType.DawnAnnouncement:
        if (d.peaceful) return <div key={i} className="text-green-400 text-sm mb-1">🌅 Đêm yên bình — không ai chết.</div>;
        return <div key={i} className="text-red-400 text-sm mb-1">🌅 Nạn nhân trong đêm: {d.deaths.map((x: any) => x.name).join(', ')}</div>;
      case GameEventType.NightActionPerformed:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-red-300/60 text-xs mb-1">🐺 Sói nhắm vào: {d.targetName || d.targetNames?.join(', ')}</div>;
      case GameEventType.AlphaInfect:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-red-300/60 text-xs mb-1">🦠 Sói Đầu Đàn lây nhiễm: {d.targetName} (cũ: {ROLE_NAMES_VI[d.oldRole as Role]})</div>;
      case GameEventType.WolfCubRevenge:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-red-300/60 text-xs mb-1">🐺💢 Sói Con chết! Đêm sau sói cắn 2 người!</div>;
      case GameEventType.CupidPair:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-pink-300/60 text-xs mb-1">💘 Thần Tình Yêu ghép đôi: {d.player1Name} ❤️ {d.player2Name}</div>;
      case GameEventType.ApprenticeSeerActivated:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-purple-300/60 text-xs mb-1">🔮 Tiên Tri Tập Sự {d.apprenticeName} đã kế thừa!</div>;
      case GameEventType.SeerResult:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-purple-300/60 text-xs mb-1">🔮 Tiên Tri: {d.targetName} {d.isWolf ? 'là 🐺 SÓI' : '✅ không phải sói'}</div>;
      case GameEventType.GuardProtect:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-blue-300/60 text-xs mb-1">🛡️ Bảo Vệ bảo vệ: {d.targetName}</div>;
      case GameEventType.WitchAction:
        if (spectatorMode !== 'god') return null;
        return <div key={i} className="text-emerald-300/60 text-xs mb-1">🧪 Phù Thủy {d.action === 'heal' ? 'cứu' : 'giết'}: {d.targetName}</div>;
      case GameEventType.FoolVictory:
        return (
          <div key={i} className="game-over-card rounded-xl p-5 my-3 text-center border border-yellow-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/50 via-amber-900/30 to-purple-900/30" />
            <div className="relative z-10">
              <div className="text-3xl mb-2">🃏</div>
              <div className="text-xl font-bold text-yellow-300">Kẻ Ngốc {d.foolName} Chiến Thắng!</div>
              <p className="text-xs text-gray-400 mt-1">Dân làng đã treo cổ nhầm người!</p>
            </div>
          </div>
        );
      case GameEventType.GameOver:
        return (
          <div key={i} className="game-over-card rounded-xl p-5 my-3 text-center border border-amber-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/50 via-red-900/30 to-purple-900/30" />
            <div className="relative z-10">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-xl font-bold text-amber-300">
                {d.winner === 'Wolf' ? '🐺 Phe Sói Chiến Thắng!' : d.winner === 'Lovers' ? '💕 Phe Cặp Đôi Chiến Thắng!' : d.winner === 'Fool' ? '🃏 Kẻ Ngốc Chiến Thắng!' : '🏘️ Dân Làng Chiến Thắng!'}
              </div>
              <div className="text-xs text-gray-400 mt-3 space-y-0.5">
                {d.players?.map((p: any) => (
                  <div key={p.id}><span style={{ color: ROLE_COLORS[p.role as Role] }}>{ROLE_NAMES_VI[p.role as Role] || p.role}</span> — {p.name} {p.alive ? '✅' : '💀'}</div>
                ))}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
      {filtered.map(renderEvent)}
    </div>
  );
}

function PlayerRoster() {
  const gameState = useGameStore(s => s.gameState);
  const spectatorMode = useGameStore(s => s.spectatorMode);
  if (!gameState) return null;

  const voteCounts: Record<string, number> = {};
  if (gameState.phase === Phase.Dusk) {
    gameState.votes.forEach(v => {
      voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
    });
  }

  const isAccused = (id: string) => gameState.phase === Phase.Judgement && gameState.accusedId === id;

  return (
    <div className="space-y-1">
      {gameState.players.map(p => {
        const voteCount = voteCounts[p.id] || 0;
        const isVoteTarget = voteCount > 0;
        const accused = isAccused(p.id);
        return (
          <div key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-300 ${
            accused
              ? 'bg-red-900/50 border border-red-500/50 judgement-phase-pulse'
              : p.alive
                ? isVoteTarget
                  ? 'bg-amber-900/40 border border-amber-600/40'
                  : 'bg-gray-800/50'
                : 'bg-gray-900/30 opacity-50'
          }`}>
            <span className="text-sm">{p.personality.emoji}</span>
            <span className={`flex-1 font-medium ${p.alive ? (accused ? 'text-red-300' : 'text-white') : 'text-gray-500 line-through'}`}>{p.name}</span>
            {accused && <span className="text-red-400 text-[10px] font-bold">⚖️</span>}
            {isVoteTarget && (
              <span className="vote-count-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/80 text-white min-w-[20px] text-center">
                {voteCount}
              </span>
            )}
            {(spectatorMode === 'god' || !p.alive) && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ color: ROLE_COLORS[p.role], backgroundColor: ROLE_COLORS[p.role] + '20' }}>
                {ROLE_NAMES_VI[p.role]}
              </span>
            )}
            {!p.alive && <span>💀</span>}
          </div>
        );
      })}
    </div>
  );
}

function GameControls() {
  const { gameState, pauseGame, resumeGame, stepGame, setSpectatorMode, spectatorMode, setView } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {gameState.config.autoPlay ? (
        <button onClick={gameState.isPaused ? resumeGame : pauseGame}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          {gameState.isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
        </button>
      ) : (
        <button onClick={stepGame} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          ⏭ Bước tiếp
        </button>
      )}
      <div className="flex bg-gray-800 rounded overflow-hidden">
        <button onClick={() => setSpectatorMode('god')}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'god' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          👁 Toàn Cảnh
        </button>
        <button onClick={() => setSpectatorMode('fog')}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'fog' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🌫 Sương Mù
        </button>
      </div>
      {gameState.phase === Phase.GameOver && (
        <button onClick={() => setView('lobby')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          🔄 Ván Mới
        </button>
      )}
    </div>
  );
}

export default function HUD() {
  const gameState = useGameStore(s => s.gameState);
  if (!gameState) return null;

  const phase = PHASE_INFO[gameState.phase] || PHASE_INFO[Phase.Lobby];
  const alive = gameState.players.filter(p => p.alive).length;
  const wolves = gameState.players.filter(p => p.alive && isWolfRole(p.role)).length;
  const isDusk = gameState.phase === Phase.Dusk;
  const isJudgement = gameState.phase === Phase.Judgement;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      {/* Top bar */}
      <div className={`pointer-events-auto backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between transition-all duration-500 ${
        isJudgement
          ? 'bg-red-950/70 border-red-700/50'
          : isDusk
            ? 'bg-amber-950/70 border-amber-700/50'
            : 'bg-black/60 border-gray-700/50'
      }`}>
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold text-sm">🐺 Ma Sói 3D</span>
          <span className={`text-sm font-medium ${phase.color} ${isDusk ? 'voting-phase-pulse' : ''} ${isJudgement ? 'judgement-phase-pulse' : ''}`}>{phase.icon} {phase.label}</span>
          <span className="text-gray-400 text-xs">Vòng {gameState.round}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400 text-xs">👥 {alive} sống sót</span>
          <span className="text-red-400 text-xs">🐺 {wolves} sói</span>
          <GameControls />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Player roster */}
        <div className="pointer-events-auto w-48 bg-black/40 backdrop-blur-sm border-r border-gray-700/30 p-2 overflow-y-auto">
          <div className="text-xs text-gray-500 font-medium mb-2 px-1">NGƯỜI CHƠI</div>
          <PlayerRoster />
        </div>

        {/* Center: 3D scene (transparent) */}
        <div className="flex-1" />

        {/* Right: Chat log */}
        <div className="pointer-events-auto w-80 bg-black/50 backdrop-blur-sm border-l border-gray-700/30 flex flex-col min-h-0">
          <div className="text-xs text-gray-500 font-medium p-2 px-3 border-b border-gray-700/30">NHẬT KÝ</div>
          <ChatLog />
        </div>
      </div>

      {/* Phase overlay glows */}
      {isDusk && (
        <div className="absolute inset-0 pointer-events-none voting-overlay-glow" />
      )}
      {isJudgement && (
        <div className="absolute inset-0 pointer-events-none judgement-overlay-glow" />
      )}
    </div>
  );
}

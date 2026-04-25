import { useRef, useEffect, useMemo, useState, memo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GameEventType, GameEvent, Role, Player, Phase } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI, PHASE_INFO } from './constants';
import { isEventVisibleToPlayer } from './eventVisibility';

/* ── Helpers ── */

function eventKey(e: GameEvent, i: number): string {
  return `${e.timestamp}_${e.type}_${i}`;
}

function ReasoningToggle({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 ml-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] text-purple-400/70 hover:text-purple-300 transition-colors"
      >
        💭 {open ? 'Ẩn suy luận' : 'Suy luận'}
      </button>
      {open && (
        <p className="text-[11px] text-purple-200/60 italic mt-0.5 leading-relaxed border-l border-purple-700/40 pl-2">
          {reasoning}
        </p>
      )}
    </div>
  );
}

/* ── Memoized EventEntry ── */

interface EventEntryProps {
  event: GameEvent;
  showRole: boolean;
  playersMap: Map<string, Player>;
}

const EventEntry = memo(function EventEntry({ event, showRole, playersMap }: EventEntryProps) {
  const e = event;
  const d = e.data;

  switch (e.type) {
    case GameEventType.DayMessage: {
      const player = playersMap.get(d.playerId);
      const color = showRole && player ? ROLE_COLORS[player.role] : '#e0e0e0';
      return (
        <div className="mb-2 animate-fadeIn">
          <span className="font-bold text-sm" style={{ color }}>
            {player?.personality.emoji} {d.playerName}
          </span>
          <p className="text-sm text-gray-200 ml-5 mt-0.5">{d.message}</p>
          {showRole && d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    }
    case GameEventType.VoteCast:
      return (
        <div className="mb-1.5">
          <div className="vote-cast-entry flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-900/20 border border-amber-700/30">
            <span className="vote-icon text-base">🗳️</span>
            <span className="text-xs text-amber-200 font-medium">{d.voterName}</span>
            <span className="text-xs text-amber-500">→</span>
            <span className="text-xs text-red-300 font-semibold">{d.targetName}</span>
          </div>
          {showRole && d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.DuskNomination:
      return (
        <div className="defense-card rounded-xl p-3 mb-3 border border-red-600/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-amber-900/20 to-transparent" />
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-red-400 font-bold text-sm">{d.accusedName} bị đưa lên giàn!</span>
          </div>
        </div>
      );
    case GameEventType.DefenseSpeech: {
      const player = playersMap.get(d.playerId);
      return (
        <div className="defense-card rounded-xl p-4 mb-3 border border-amber-500/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-red-900/15 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚖️</span>
              <span className="text-amber-300 font-bold text-sm">Biện hộ — {d.playerName}</span>
              {showRole && player && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    color: ROLE_COLORS[player.role],
                    backgroundColor: ROLE_COLORS[player.role] + '20',
                  }}
                >
                  {ROLE_NAMES_VI[player.role]}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-100 italic ml-6">"{d.message}"</p>
            {showRole && d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
          </div>
        </div>
      );
    }
    case GameEventType.JudgementVoteCast: {
      const isKill = d.verdict === 'kill';
      return (
        <div className="mb-1.5">
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isKill ? 'judgement-verdict-kill bg-red-900/20' : 'judgement-verdict-spare bg-green-900/20'}`}
          >
            <span className="text-base">{isKill ? '🔴' : '🟢'}</span>
            <span className="text-xs text-gray-300 font-medium">{d.voterName}</span>
            <span className={`text-xs font-bold ${isKill ? 'text-red-400' : 'text-green-400'}`}>
              {isKill ? 'GIẾT' : 'THA'}
            </span>
          </div>
          {showRole && d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    }
    case GameEventType.JudgementResult: {
      const totalVotes = d.killVotes + d.spareVotes;
      return (
        <div className="vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{d.executed ? '⚰️' : '✋'}</span>
              <span
                className={`font-bold text-sm ${d.executed ? 'text-red-400' : 'text-green-400'}`}
              >
                {d.executed ? `${d.accusedName} bị xử tử!` : `${d.accusedName} được tha!`}
              </span>
              {d.executed && showRole && (
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
              <span className="text-gray-500">
                ({totalVotes} phiếu, cần &gt;{Math.floor(totalVotes / 2)} để giết)
              </span>
            </div>
          </div>
        </div>
      );
    }
    case GameEventType.VoteResult: {
      if (d.exiled) {
        return (
          <div className="vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚰️</span>
                <span className="text-red-400 font-bold text-sm">
                  {d.exiled.name} bị trục xuất!
                </span>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 mb-2 px-2 py-1">
          <span className="text-lg">✋</span>
          <span className="text-gray-400 text-sm font-medium">Không ai bị chỉ định.</span>
        </div>
      );
    }
    case GameEventType.PlayerDied: {
      const roleName = ROLE_NAMES_VI[d.role as Role] || d.role;
      const causes: Record<string, string> = {
        wolf_kill: 'bị sói cắn',
        witch_kill: 'bị đầu độc',
        judged: 'bị xử tử',
        hunter_shot: 'bị thợ săn bắn',
        lover_death: 'chết vì tình',
        voted_out: 'bị trục xuất',
      };
      return (
        <div className="text-red-400 text-sm mb-1">
          💀 {d.playerName} đã chết ({causes[d.cause] || d.cause}) — là {roleName}
        </div>
      );
    }
    case GameEventType.HunterShot:
      return <div className="text-orange-400 text-sm mb-1">🏹 Thợ Săn bắn hạ {d.targetName}!</div>;
    case GameEventType.LoverDeath:
      return (
        <div className="text-pink-400 text-sm mb-1">
          💔 {d.loverName} chết vì tình sau cái chết của {d.deadName}!
        </div>
      );
    case GameEventType.PhaseChanged:
      return (
        <div className="text-center text-xs text-gray-500 my-2 border-t border-gray-700 pt-2">
          {PHASE_INFO[d.phase]?.icon} {PHASE_INFO[d.phase]?.label} — Vòng {d.round}
        </div>
      );
    case GameEventType.DawnAnnouncement:
      if (d.peaceful)
        return <div className="text-green-400 text-sm mb-1">🌅 Đêm yên bình — không ai chết.</div>;
      return (
        <div className="text-red-400 text-sm mb-1">
          🌅 Nạn nhân trong đêm: {d.deaths.map((x: any) => x.name).join(', ')}
        </div>
      );
    case GameEventType.NightActionPerformed:
      if (!showRole) return null;
      return (
        <div className="mb-1">
          <div className="text-red-300/60 text-xs">
            🐺 Sói nhắm vào: {d.targetName || d.targetNames?.join(', ')}
          </div>
          {d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.AlphaInfect:
      if (!showRole) return null;
      return (
        <div className="mb-1">
          <div className="text-red-300/60 text-xs">
            🦠 Sói Đầu Đàn lây nhiễm: {d.targetName} (cũ: {ROLE_NAMES_VI[d.oldRole as Role]})
          </div>
          {d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.WolfCubRevenge:
      if (!showRole) return null;
      return (
        <div className="text-red-300/60 text-xs mb-1">
          🐺💢 Sói Con chết! Đêm sau sói cắn 2 người!
        </div>
      );
    case GameEventType.CupidPair:
      if (!showRole) return null;
      return (
        <div className="text-pink-300/60 text-xs mb-1">
          💘 Thần Tình Yêu ghép đôi: {d.player1Name} ❤️ {d.player2Name}
        </div>
      );
    case GameEventType.ApprenticeSeerActivated:
      if (!showRole) return null;
      return (
        <div className="text-purple-300/60 text-xs mb-1">
          🔮 Tiên Tri Tập Sự {d.apprenticeName} đã kế thừa!
        </div>
      );
    case GameEventType.SeerResult:
      if (!showRole) return null;
      return (
        <div className="mb-1">
          <div className="text-purple-300/60 text-xs">
            🔮 Tiên Tri: {d.targetName} {d.isWolf ? 'là 🐺 SÓI' : '✅ không phải sói'}
          </div>
          {d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.GuardProtect:
      if (!showRole) return null;
      return (
        <div className="mb-1">
          <div className="text-blue-300/60 text-xs">🛡️ Bảo Vệ bảo vệ: {d.targetName}</div>
          {d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.WitchAction:
      if (!showRole) return null;
      return (
        <div className="mb-1">
          <div className="text-emerald-300/60 text-xs">
            🧪 Phù Thủy {d.action === 'heal' ? 'cứu' : 'giết'}: {d.targetName}
          </div>
          {d.reasoning && <ReasoningToggle reasoning={d.reasoning} />}
        </div>
      );
    case GameEventType.FoolVictory:
      return (
        <div className="game-over-card rounded-xl p-5 my-3 text-center border border-yellow-500/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/50 via-amber-900/30 to-purple-900/30" />
          <div className="relative z-10">
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-xl font-bold text-yellow-300">
              Kẻ Ngốc {d.foolName} Chiến Thắng!
            </div>
            <p className="text-xs text-gray-400 mt-1">Dân làng đã treo cổ nhầm người!</p>
          </div>
        </div>
      );
    case GameEventType.GameOver:
      return (
        <div className="game-over-card rounded-xl p-5 my-3 text-center border border-amber-500/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/50 via-red-900/30 to-purple-900/30" />
          <div className="relative z-10">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-xl font-bold text-amber-300">
              {d.winner === 'Wolf'
                ? '🐺 Phe Sói Chiến Thắng!'
                : d.winner === 'Lovers'
                  ? '💕 Phe Cặp Đôi Chiến Thắng!'
                  : d.winner === 'Fool'
                    ? '🃏 Kẻ Ngốc Chiến Thắng!'
                    : '🏘️ Dân Làng Chiến Thắng!'}
            </div>
            <div className="text-xs text-gray-400 mt-3 space-y-0.5">
              {d.players?.map((p: any) => (
                <div key={p.id}>
                  <span style={{ color: ROLE_COLORS[p.role as Role] }}>
                    {ROLE_NAMES_VI[p.role as Role] || p.role}
                  </span>{' '}
                  — {p.name} {p.alive ? '✅' : '💀'}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
});

/* ── Round grouping helpers ── */

interface RoundGroup {
  round: number;
  label: string;
  events: { event: GameEvent; index: number }[];
}

function groupEventsByRound(events: GameEvent[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  let currentRound = 0;
  let currentGroup: RoundGroup = { round: 0, label: 'Khởi đầu', events: [] };
  groups.push(currentGroup);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.type === GameEventType.PhaseChanged && e.data.round > currentRound) {
      currentRound = e.data.round;
      currentGroup = { round: currentRound, label: `Vòng ${currentRound}`, events: [] };
      groups.push(currentGroup);
    }
    currentGroup.events.push({ event: e, index: i });
  }

  return groups.filter((g) => g.events.length > 0);
}

/* ── RoundSection ── */

interface RoundSectionProps {
  group: RoundGroup;
  collapsed: boolean;
  onToggle: () => void;
  showRole: boolean;
  playersMap: Map<string, Player>;
}

const RoundSection = memo(function RoundSection({
  group,
  collapsed,
  onToggle,
  showRole,
  playersMap,
}: RoundSectionProps) {
  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-white/5 transition-colors bg-black/70 backdrop-blur-sm border-b border-gray-700/30"
        onClick={onToggle}
      >
        <span className="text-[10px] text-gray-500">{collapsed ? '▶' : '▼'}</span>
        <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
        <span className="text-[10px] text-gray-600">({group.events.length})</span>
      </div>
      {!collapsed && (
        <div className="space-y-0.5">
          {group.events.map(({ event, index }) => (
            <EventEntry
              key={eventKey(event, index)}
              event={event}
              showRole={showRole}
              playersMap={playersMap}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* ── ChatLog ── */

export default function ChatLog() {
  const events = useGameStore((s) => s.events);
  const spectatorMode = useGameStore((s) => s.spectatorMode);
  const playerViewState = useGameStore((s) => s.playerViewState);
  const playersMap = useGameStore((s) => s.playersMap);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set());
  const prevMaxRoundRef = useRef(0);

  const showRole = spectatorMode === 'god';

  const filtered = useMemo(() => {
    if (spectatorMode === 'god') return events;
    if (spectatorMode === 'player' && playerViewState) {
      return events.filter((e) =>
        isEventVisibleToPlayer(e, playerViewState.playerId, playerViewState.role),
      );
    }
    return events.filter((e) => e.isPublic);
  }, [events, spectatorMode, playerViewState]);

  const groups = useMemo(() => groupEventsByRound(filtered), [filtered]);

  // Auto-collapse old rounds when a new round starts
  const maxRound = groups.length > 0 ? groups[groups.length - 1].round : 0;
  useEffect(() => {
    if (maxRound > prevMaxRoundRef.current && prevMaxRoundRef.current > 0) {
      setCollapsedRounds((prev) => {
        const next = new Set(prev);
        // Collapse all rounds except the new current one
        for (const g of groups) {
          if (g.round < maxRound) next.add(g.round);
        }
        return next;
      });
    }
    prevMaxRoundRef.current = maxRound;
  }, [maxRound, groups]);

  // Auto-scroll on new events
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [events.length]);

  const toggleRound = useCallback((round: number) => {
    setCollapsedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
      {groups.map((group) => (
        <RoundSection
          key={group.round}
          group={group}
          collapsed={collapsedRounds.has(group.round)}
          onToggle={() => toggleRound(group.round)}
          showRole={showRole}
          playersMap={playersMap}
        />
      ))}
    </div>
  );
}

import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { useRef, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GameEventType } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI, PHASE_INFO } from './constants';
import { isEventVisibleToPlayer } from './eventVisibility';
function ReasoningToggle({ reasoning }) {
  const [open, setOpen] = useState(false);
  return _jsxs('div', {
    className: 'mt-1 ml-5',
    children: [
      _jsxs('button', {
        onClick: () => setOpen((o) => !o),
        className: 'text-[10px] text-purple-400/70 hover:text-purple-300 transition-colors',
        children: ['\uD83D\uDCAD ', open ? 'Ẩn suy luận' : 'Suy luận'],
      }),
      open &&
        _jsx('p', {
          className:
            'text-[11px] text-purple-200/60 italic mt-0.5 leading-relaxed border-l border-purple-700/40 pl-2',
          children: reasoning,
        }),
    ],
  });
}
export default function ChatLog() {
  const events = useGameStore((s) => s.events);
  const spectatorMode = useGameStore((s) => s.spectatorMode);
  const gameState = useGameStore((s) => s.gameState);
  const playerViewState = useGameStore((s) => s.playerViewState);
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [events.length]);
  const filtered = useMemo(() => {
    if (spectatorMode === 'god') return events;
    if (spectatorMode === 'player' && playerViewState) {
      return events.filter((e) =>
        isEventVisibleToPlayer(e, playerViewState.playerId, playerViewState.role),
      );
    }
    return events.filter((e) => e.isPublic);
  }, [events, spectatorMode, playerViewState]);
  const renderEvent = (e, i) => {
    const d = e.data;
    const showRole = spectatorMode === 'god';
    switch (e.type) {
      case GameEventType.DayMessage: {
        const player = gameState?.players.find((p) => p.id === d.playerId);
        const color = showRole && player ? ROLE_COLORS[player.role] : '#e0e0e0';
        return _jsxs(
          'div',
          {
            className: 'mb-2 animate-fadeIn',
            children: [
              _jsxs('span', {
                className: 'font-bold text-sm',
                style: { color },
                children: [player?.personality.emoji, ' ', d.playerName],
              }),
              _jsx('p', { className: 'text-sm text-gray-200 ml-5 mt-0.5', children: d.message }),
              showRole && d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      }
      case GameEventType.VoteCast:
        return _jsxs(
          'div',
          {
            className: 'mb-1.5',
            children: [
              _jsxs('div', {
                className:
                  'vote-cast-entry flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-900/20 border border-amber-700/30',
                children: [
                  _jsx('span', {
                    className: 'vote-icon text-base',
                    children: '\uD83D\uDDF3\uFE0F',
                  }),
                  _jsx('span', {
                    className: 'text-xs text-amber-200 font-medium',
                    children: d.voterName,
                  }),
                  _jsx('span', { className: 'text-xs text-amber-500', children: '\u2192' }),
                  _jsx('span', {
                    className: 'text-xs text-red-300 font-semibold',
                    children: d.targetName,
                  }),
                ],
              }),
              showRole && d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.DuskNomination:
        return _jsxs(
          'div',
          {
            className:
              'defense-card rounded-xl p-3 mb-3 border border-red-600/40 overflow-hidden relative',
            children: [
              _jsx('div', {
                className:
                  'absolute inset-0 bg-gradient-to-br from-red-900/40 via-amber-900/20 to-transparent',
              }),
              _jsxs('div', {
                className: 'relative z-10 flex items-center gap-2',
                children: [
                  _jsx('span', { className: 'text-xl', children: '\u26A1' }),
                  _jsxs('span', {
                    className: 'text-red-400 font-bold text-sm',
                    children: [d.accusedName, ' b\u1ECB \u0111\u01B0a l\u00EAn gi\u00E0n!'],
                  }),
                ],
              }),
            ],
          },
          i,
        );
      case GameEventType.DefenseSpeech: {
        const player = gameState?.players.find((p) => p.id === d.playerId);
        return _jsxs(
          'div',
          {
            className:
              'defense-card rounded-xl p-4 mb-3 border border-amber-500/40 overflow-hidden relative',
            children: [
              _jsx('div', {
                className:
                  'absolute inset-0 bg-gradient-to-br from-amber-900/30 via-red-900/15 to-transparent',
              }),
              _jsxs('div', {
                className: 'relative z-10',
                children: [
                  _jsxs('div', {
                    className: 'flex items-center gap-2 mb-2',
                    children: [
                      _jsx('span', { className: 'text-xl', children: '\u2696\uFE0F' }),
                      _jsxs('span', {
                        className: 'text-amber-300 font-bold text-sm',
                        children: ['Bi\u1EC7n h\u1ED9 \u2014 ', d.playerName],
                      }),
                      showRole &&
                        player &&
                        _jsx('span', {
                          className: 'text-[10px] px-1.5 py-0.5 rounded-full',
                          style: {
                            color: ROLE_COLORS[player.role],
                            backgroundColor: ROLE_COLORS[player.role] + '20',
                          },
                          children: ROLE_NAMES_VI[player.role],
                        }),
                    ],
                  }),
                  _jsxs('p', {
                    className: 'text-sm text-gray-100 italic ml-6',
                    children: ['"', d.message, '"'],
                  }),
                  showRole && d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
                ],
              }),
            ],
          },
          i,
        );
      }
      case GameEventType.JudgementVoteCast: {
        const isKill = d.verdict === 'kill';
        return _jsxs(
          'div',
          {
            className: 'mb-1.5',
            children: [
              _jsxs('div', {
                className: `flex items-center gap-2 px-2 py-1 rounded-lg ${isKill ? 'judgement-verdict-kill bg-red-900/20' : 'judgement-verdict-spare bg-green-900/20'}`,
                children: [
                  _jsx('span', { className: 'text-base', children: isKill ? '🔴' : '🟢' }),
                  _jsx('span', {
                    className: 'text-xs text-gray-300 font-medium',
                    children: d.voterName,
                  }),
                  _jsx('span', {
                    className: `text-xs font-bold ${isKill ? 'text-red-400' : 'text-green-400'}`,
                    children: isKill ? 'GIẾT' : 'THA',
                  }),
                ],
              }),
              showRole && d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      }
      case GameEventType.JudgementResult: {
        const totalVotes = d.killVotes + d.spareVotes;
        return _jsxs(
          'div',
          {
            className:
              'vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative',
            children: [
              _jsx('div', {
                className:
                  'absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent',
              }),
              _jsxs('div', {
                className: 'relative z-10',
                children: [
                  _jsxs('div', {
                    className: 'flex items-center gap-2 mb-2',
                    children: [
                      _jsx('span', { className: 'text-xl', children: d.executed ? '⚰️' : '✋' }),
                      _jsx('span', {
                        className: `font-bold text-sm ${d.executed ? 'text-red-400' : 'text-green-400'}`,
                        children: d.executed
                          ? `${d.accusedName} bị xử tử!`
                          : `${d.accusedName} được tha!`,
                      }),
                      d.executed &&
                        showRole &&
                        _jsx('span', {
                          className:
                            'text-xs px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-300',
                          children: ROLE_NAMES_VI[d.accusedRole] || d.accusedRole,
                        }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'flex gap-4 mt-2 text-xs',
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-1',
                        children: [
                          _jsx('span', {
                            className: 'text-red-400',
                            children: '\uD83D\uDD34 Gi\u1EBFt:',
                          }),
                          _jsx('span', {
                            className: 'font-bold text-red-300',
                            children: d.killVotes,
                          }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'flex items-center gap-1',
                        children: [
                          _jsx('span', {
                            className: 'text-green-400',
                            children: '\uD83D\uDFE2 Tha:',
                          }),
                          _jsx('span', {
                            className: 'font-bold text-green-300',
                            children: d.spareVotes,
                          }),
                        ],
                      }),
                      _jsxs('span', {
                        className: 'text-gray-500',
                        children: [
                          '(',
                          totalVotes,
                          ' phi\u1EBFu, c\u1EA7n >',
                          Math.floor(totalVotes / 2),
                          ' \u0111\u1EC3 gi\u1EBFt)',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
          i,
        );
      }
      case GameEventType.VoteResult: {
        if (d.exiled) {
          return _jsxs(
            'div',
            {
              className:
                'vote-result-card rounded-xl p-3 mb-3 border border-amber-600/30 overflow-hidden relative',
              children: [
                _jsx('div', {
                  className:
                    'absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/20 to-transparent',
                }),
                _jsx('div', {
                  className: 'relative z-10',
                  children: _jsxs('div', {
                    className: 'flex items-center gap-2 mb-2',
                    children: [
                      _jsx('span', { className: 'text-xl', children: '\u26B0\uFE0F' }),
                      _jsxs('span', {
                        className: 'text-red-400 font-bold text-sm',
                        children: [d.exiled.name, ' b\u1ECB tr\u1EE5c xu\u1EA5t!'],
                      }),
                    ],
                  }),
                }),
              ],
            },
            i,
          );
        }
        return _jsxs(
          'div',
          {
            className: 'flex items-center gap-2 mb-2 px-2 py-1',
            children: [
              _jsx('span', { className: 'text-lg', children: '\u270B' }),
              _jsx('span', {
                className: 'text-gray-400 text-sm font-medium',
                children: 'Kh\u00F4ng ai b\u1ECB ch\u1EC9 \u0111\u1ECBnh.',
              }),
            ],
          },
          i,
        );
      }
      case GameEventType.PlayerDied: {
        const roleName = ROLE_NAMES_VI[d.role] || d.role;
        const causes = {
          wolf_kill: 'bị sói cắn',
          witch_kill: 'bị đầu độc',
          judged: 'bị xử tử',
          hunter_shot: 'bị thợ săn bắn',
          lover_death: 'chết vì tình',
          voted_out: 'bị trục xuất',
        };
        return _jsxs(
          'div',
          {
            className: 'text-red-400 text-sm mb-1',
            children: [
              '\uD83D\uDC80 ',
              d.playerName,
              ' \u0111\u00E3 ch\u1EBFt (',
              causes[d.cause] || d.cause,
              ') \u2014 l\u00E0 ',
              roleName,
            ],
          },
          i,
        );
      }
      case GameEventType.HunterShot:
        return _jsxs(
          'div',
          {
            className: 'text-orange-400 text-sm mb-1',
            children: ['\uD83C\uDFF9 Th\u1EE3 S\u0103n b\u1EAFn h\u1EA1 ', d.targetName, '!'],
          },
          i,
        );
      case GameEventType.LoverDeath:
        return _jsxs(
          'div',
          {
            className: 'text-pink-400 text-sm mb-1',
            children: [
              '\uD83D\uDC94 ',
              d.loverName,
              ' ch\u1EBFt v\u00EC t\u00ECnh sau c\u00E1i ch\u1EBFt c\u1EE7a ',
              d.deadName,
              '!',
            ],
          },
          i,
        );
      case GameEventType.PhaseChanged:
        return _jsxs(
          'div',
          {
            className: 'text-center text-xs text-gray-500 my-2 border-t border-gray-700 pt-2',
            children: [
              PHASE_INFO[d.phase]?.icon,
              ' ',
              PHASE_INFO[d.phase]?.label,
              ' \u2014 V\u00F2ng ',
              d.round,
            ],
          },
          i,
        );
      case GameEventType.DawnAnnouncement:
        if (d.peaceful)
          return _jsx(
            'div',
            {
              className: 'text-green-400 text-sm mb-1',
              children:
                '\uD83C\uDF05 \u0110\u00EAm y\u00EAn b\u00ECnh \u2014 kh\u00F4ng ai ch\u1EBFt.',
            },
            i,
          );
        return _jsxs(
          'div',
          {
            className: 'text-red-400 text-sm mb-1',
            children: [
              '\uD83C\uDF05 N\u1EA1n nh\u00E2n trong \u0111\u00EAm: ',
              d.deaths.map((x) => x.name).join(', '),
            ],
          },
          i,
        );
      case GameEventType.NightActionPerformed:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'mb-1',
            children: [
              _jsxs('div', {
                className: 'text-red-300/60 text-xs',
                children: [
                  '\uD83D\uDC3A S\u00F3i nh\u1EAFm v\u00E0o: ',
                  d.targetName || d.targetNames?.join(', '),
                ],
              }),
              d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.AlphaInfect:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'mb-1',
            children: [
              _jsxs('div', {
                className: 'text-red-300/60 text-xs',
                children: [
                  '\uD83E\uDDA0 S\u00F3i \u0110\u1EA7u \u0110\u00E0n l\u00E2y nhi\u1EC5m: ',
                  d.targetName,
                  ' (c\u0169: ',
                  ROLE_NAMES_VI[d.oldRole],
                  ')',
                ],
              }),
              d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.WolfCubRevenge:
        if (spectatorMode === 'fog') return null;
        return _jsx(
          'div',
          {
            className: 'text-red-300/60 text-xs mb-1',
            children:
              '\uD83D\uDC3A\uD83D\uDCA2 S\u00F3i Con ch\u1EBFt! \u0110\u00EAm sau s\u00F3i c\u1EAFn 2 ng\u01B0\u1EDDi!',
          },
          i,
        );
      case GameEventType.CupidPair:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'text-pink-300/60 text-xs mb-1',
            children: [
              '\uD83D\uDC98 Th\u1EA7n T\u00ECnh Y\u00EAu gh\u00E9p \u0111\u00F4i: ',
              d.player1Name,
              ' \u2764\uFE0F ',
              d.player2Name,
            ],
          },
          i,
        );
      case GameEventType.ApprenticeSeerActivated:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'text-purple-300/60 text-xs mb-1',
            children: [
              '\uD83D\uDD2E Ti\u00EAn Tri T\u1EADp S\u1EF1 ',
              d.apprenticeName,
              ' \u0111\u00E3 k\u1EBF th\u1EEBa!',
            ],
          },
          i,
        );
      case GameEventType.SeerResult:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'mb-1',
            children: [
              _jsxs('div', {
                className: 'text-purple-300/60 text-xs',
                children: [
                  '\uD83D\uDD2E Ti\u00EAn Tri: ',
                  d.targetName,
                  ' ',
                  d.isWolf ? 'là 🐺 SÓI' : '✅ không phải sói',
                ],
              }),
              d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.GuardProtect:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'mb-1',
            children: [
              _jsxs('div', {
                className: 'text-blue-300/60 text-xs',
                children: ['\uD83D\uDEE1\uFE0F B\u1EA3o V\u1EC7 b\u1EA3o v\u1EC7: ', d.targetName],
              }),
              d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.WitchAction:
        if (spectatorMode === 'fog') return null;
        return _jsxs(
          'div',
          {
            className: 'mb-1',
            children: [
              _jsxs('div', {
                className: 'text-emerald-300/60 text-xs',
                children: [
                  '\uD83E\uDDEA Ph\u00F9 Th\u1EE7y ',
                  d.action === 'heal' ? 'cứu' : 'giết',
                  ': ',
                  d.targetName,
                ],
              }),
              d.reasoning && _jsx(ReasoningToggle, { reasoning: d.reasoning }),
            ],
          },
          i,
        );
      case GameEventType.FoolVictory:
        return _jsxs(
          'div',
          {
            className:
              'game-over-card rounded-xl p-5 my-3 text-center border border-yellow-500/30 overflow-hidden relative',
            children: [
              _jsx('div', {
                className:
                  'absolute inset-0 bg-gradient-to-br from-yellow-900/50 via-amber-900/30 to-purple-900/30',
              }),
              _jsxs('div', {
                className: 'relative z-10',
                children: [
                  _jsx('div', { className: 'text-3xl mb-2', children: '\uD83C\uDCCF' }),
                  _jsxs('div', {
                    className: 'text-xl font-bold text-yellow-300',
                    children: ['K\u1EBB Ng\u1ED1c ', d.foolName, ' Chi\u1EBFn Th\u1EAFng!'],
                  }),
                  _jsx('p', {
                    className: 'text-xs text-gray-400 mt-1',
                    children:
                      'D\u00E2n l\u00E0ng \u0111\u00E3 treo c\u1ED5 nh\u1EA7m ng\u01B0\u1EDDi!',
                  }),
                ],
              }),
            ],
          },
          i,
        );
      case GameEventType.GameOver:
        return _jsxs(
          'div',
          {
            className:
              'game-over-card rounded-xl p-5 my-3 text-center border border-amber-500/30 overflow-hidden relative',
            children: [
              _jsx('div', {
                className:
                  'absolute inset-0 bg-gradient-to-br from-amber-900/50 via-red-900/30 to-purple-900/30',
              }),
              _jsxs('div', {
                className: 'relative z-10',
                children: [
                  _jsx('div', { className: 'text-3xl mb-2', children: '\uD83C\uDFC6' }),
                  _jsx('div', {
                    className: 'text-xl font-bold text-amber-300',
                    children:
                      d.winner === 'Wolf'
                        ? '🐺 Phe Sói Chiến Thắng!'
                        : d.winner === 'Lovers'
                          ? '💕 Phe Cặp Đôi Chiến Thắng!'
                          : d.winner === 'Fool'
                            ? '🃏 Kẻ Ngốc Chiến Thắng!'
                            : '🏘️ Dân Làng Chiến Thắng!',
                  }),
                  _jsx('div', {
                    className: 'text-xs text-gray-400 mt-3 space-y-0.5',
                    children: d.players?.map((p) =>
                      _jsxs(
                        'div',
                        {
                          children: [
                            _jsx('span', {
                              style: { color: ROLE_COLORS[p.role] },
                              children: ROLE_NAMES_VI[p.role] || p.role,
                            }),
                            ' ',
                            '\u2014 ',
                            p.name,
                            ' ',
                            p.alive ? '✅' : '💀',
                          ],
                        },
                        p.id,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          },
          i,
        );
      default:
        return null;
    }
  };
  return _jsx('div', {
    ref: scrollRef,
    className: 'flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin',
    children: filtered.map(renderEvent),
  });
}

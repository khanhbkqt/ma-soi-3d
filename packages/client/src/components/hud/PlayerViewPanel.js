import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { isWolfRole } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI } from './constants';
export default function PlayerViewPanel() {
  const pvs = useGameStore((s) => s.playerViewState);
  const obsRef = useRef(null);
  useEffect(() => {
    obsRef.current?.scrollTo(0, obsRef.current.scrollHeight);
  }, [pvs?.observations.length]);
  if (!pvs)
    return _jsx('div', {
      className: 'flex-1 flex items-center justify-center text-gray-500 text-xs p-4 text-center',
      children: _jsxs('p', {
        children: [
          'Ch\u1ECDn 1 ng\u01B0\u1EDDi ch\u01A1i t\u1EEB',
          _jsx('br', {}),
          'danh s\u00E1ch b\u00EAn d\u01B0\u1EDBi',
        ],
      }),
    });
  const roleColor = ROLE_COLORS[pvs.role];
  const roleName = ROLE_NAMES_VI[pvs.role];
  const teamLabel = isWolfRole(pvs.role) ? 'Phe Sói' : 'Phe Dân';
  const teamColor = isWolfRole(pvs.role) ? 'text-red-400' : 'text-green-400';
  return _jsxs('div', {
    className: 'flex-1 flex flex-col min-h-0 overflow-hidden',
    children: [
      _jsx('div', {
        className: 'px-3 py-2 border-b border-cyan-800/30 bg-cyan-950/30',
        children: _jsxs('div', {
          className: 'flex items-center gap-2',
          children: [
            _jsx('span', { className: 'text-lg', children: pvs.personality.emoji }),
            _jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                _jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    _jsx('span', {
                      className: 'text-sm font-bold text-cyan-200 truncate',
                      children: pvs.playerName,
                    }),
                    !pvs.alive &&
                      _jsx('span', {
                        className: 'text-[10px] px-1 py-0.5 rounded bg-red-900/50 text-red-400',
                        children: '\u0110\u00C3 CH\u1EBET',
                      }),
                  ],
                }),
                _jsxs('div', {
                  className: 'flex items-center gap-2 mt-0.5',
                  children: [
                    _jsx('span', {
                      className: 'text-[10px] px-1.5 py-0.5 rounded font-bold',
                      style: { color: roleColor, backgroundColor: roleColor + '20' },
                      children: roleName,
                    }),
                    _jsx('span', { className: `text-[10px] ${teamColor}`, children: teamLabel }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx(RoleContextSection, { pvs: pvs }),
      pvs.deduction.deductionPrompt &&
        _jsxs('div', {
          className: 'border-t border-gray-700/30',
          children: [
            _jsx('div', {
              className: 'text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30',
              children: '\uD83D\uDD0D PH\u00C2N T\u00CDCH ROLE',
            }),
            _jsx('div', {
              className:
                'px-3 py-1.5 text-[11px] text-gray-300 whitespace-pre-line leading-relaxed max-h-[120px] overflow-y-auto scrollbar-thin',
              children: pvs.deduction.deductionPrompt,
            }),
          ],
        }),
      _jsxs('div', {
        className: 'border-t border-gray-700/30 flex-1 flex flex-col min-h-0',
        children: [
          _jsx('div', {
            className:
              'text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30 flex items-center justify-between',
            children: _jsxs('span', {
              children: ['\uD83D\uDCDC NH\u1EACT K\u00DD (', pvs.observations.length, ')'],
            }),
          }),
          _jsx('div', {
            ref: obsRef,
            className: 'flex-1 overflow-y-auto px-3 py-1 scrollbar-thin',
            children: pvs.observations.map((obs, i) => {
              const isPhase = obs.startsWith('---');
              const isDeath = obs.includes('đã chết');
              const isSeer = obs.includes('soi') || obs.includes('LÀ SÓI');
              const isWolf = obs.includes('Sói cắn') || obs.includes('LÂY NHIỄM');
              return _jsx(
                'div',
                {
                  className: `text-[11px] py-0.5 leading-snug ${
                    isPhase
                      ? 'text-gray-500 font-medium mt-1.5'
                      : isDeath
                        ? 'text-red-400'
                        : isSeer
                          ? 'text-purple-400'
                          : isWolf
                            ? 'text-red-300/70'
                            : 'text-gray-400'
                  }`,
                  children: isPhase ? obs : `• ${obs}`,
                },
                i,
              );
            }),
          }),
        ],
      }),
    ],
  });
}
function RoleContextSection({ pvs }) {
  const ctx = pvs.roleContext;
  const hasContext =
    ctx.wolfTeammates ||
    ctx.witchPotions ||
    ctx.lastGuardedName !== undefined ||
    ctx.coupleNames ||
    ctx.loverName ||
    ctx.isApprenticeSeerActivated !== undefined;
  if (!hasContext) return null;
  return _jsxs('div', {
    className: 'border-t border-gray-700/30',
    children: [
      _jsx('div', {
        className: 'text-[10px] text-gray-500 font-medium px-3 py-1.5 bg-gray-900/30',
        children: '\uD83C\uDFAF TH\u00D4NG TIN RI\u00CANG',
      }),
      _jsxs('div', {
        className: 'px-3 py-1.5 space-y-1',
        children: [
          ctx.wolfTeammates &&
            _jsxs('div', {
              className: 'text-[11px]',
              children: [
                _jsx('span', {
                  className: 'text-red-400 font-medium',
                  children: '\uD83D\uDC3A \u0110\u1ED3ng b\u1ECDn: ',
                }),
                ctx.wolfTeammates.length === 0
                  ? _jsx('span', { className: 'text-gray-500', children: 'Kh\u00F4ng c\u00F2n ai' })
                  : ctx.wolfTeammates.map((w, i) =>
                      _jsxs(
                        'span',
                        {
                          className: `${w.alive ? 'text-red-300' : 'text-gray-500 line-through'}`,
                          children: [
                            w.name,
                            '(',
                            w.role,
                            ')',
                            i < ctx.wolfTeammates.length - 1 ? ', ' : '',
                          ],
                        },
                        i,
                      ),
                    ),
                ctx.alphaInfectUsed !== undefined &&
                  _jsxs('div', {
                    className: 'text-[10px] text-gray-500 mt-0.5',
                    children: [
                      'L\u00E2y nhi\u1EC5m: ',
                      ctx.alphaInfectUsed ? '❌ Đã dùng' : '✅ Còn',
                    ],
                  }),
              ],
            }),
          ctx.witchPotions &&
            _jsxs('div', {
              className: 'text-[11px] flex gap-3',
              children: [
                _jsxs('span', {
                  className: ctx.witchPotions.healUsed ? 'text-gray-500' : 'text-emerald-400',
                  children: [
                    '\uD83D\uDC9A C\u1EE9u: ',
                    ctx.witchPotions.healUsed ? 'Đã dùng' : 'Còn',
                  ],
                }),
                _jsxs('span', {
                  className: ctx.witchPotions.killUsed ? 'text-gray-500' : 'text-red-400',
                  children: [
                    '\uD83D\uDC80 \u0110\u1ED9c: ',
                    ctx.witchPotions.killUsed ? 'Đã dùng' : 'Còn',
                  ],
                }),
              ],
            }),
          ctx.lastGuardedName !== undefined &&
            _jsxs('div', {
              className: 'text-[11px] text-blue-300',
              children: [
                '\uD83D\uDEE1\uFE0F B\u1EA3o v\u1EC7 tr\u01B0\u1EDBc: ',
                ctx.lastGuardedName || 'Chưa bảo vệ ai',
              ],
            }),
          ctx.coupleNames &&
            _jsxs('div', {
              className: 'text-[11px] text-pink-300',
              children: [
                '\uD83D\uDC98 Gh\u00E9p \u0111\u00F4i: ',
                ctx.coupleNames[0],
                ' \u2764\uFE0F ',
                ctx.coupleNames[1],
              ],
            }),
          ctx.loverName &&
            _jsxs('div', {
              className: 'text-[11px] text-pink-300',
              children: ['\uD83D\uDC95 Ng\u01B0\u1EDDi y\u00EAu: ', ctx.loverName],
            }),
          ctx.isApprenticeSeerActivated !== undefined &&
            _jsxs('div', {
              className: 'text-[11px] text-purple-300',
              children: [
                '\uD83D\uDD2E ',
                ctx.isApprenticeSeerActivated ? 'Đã kế thừa Tiên Tri!' : 'Chờ kế thừa...',
              ],
            }),
        ],
      }),
    ],
  });
}

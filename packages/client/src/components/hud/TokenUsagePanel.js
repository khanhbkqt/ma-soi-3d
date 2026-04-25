import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
function fmt(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function pct(part, whole) {
  if (whole === 0) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}
export default function TokenUsagePanel() {
  const [expanded, setExpanded] = useState(false);
  const tokenUsage = useGameStore((s) => s.tokenUsage);
  if (!tokenUsage) return null;
  const { total, perPlayer } = tokenUsage;
  const hasCached = total.cachedTokens > 0;
  return _jsxs('div', {
    className: 'pointer-events-auto',
    children: [
      _jsxs('div', {
        className:
          'flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors border-t border-gray-700/30',
        onClick: () => setExpanded(!expanded),
        children: [
          _jsxs('div', {
            className: 'text-[10px] text-gray-500 font-medium flex items-center gap-2',
            children: [
              _jsxs('span', { children: ['\uD83D\uDD22 ', fmt(total.totalTokens)] }),
              _jsx('span', { className: 'text-gray-600', children: '\u00B7' }),
              _jsxs('span', {
                className: 'text-blue-400/70',
                children: ['\u2191', fmt(total.promptTokens)],
              }),
              _jsxs('span', {
                className: 'text-emerald-400/70',
                children: ['\u2193', fmt(total.completionTokens)],
              }),
              hasCached &&
                _jsxs('span', {
                  className: 'text-amber-400/70',
                  children: ['\u26A1', fmt(total.cachedTokens)],
                }),
              _jsxs('span', {
                className: 'text-gray-600',
                children: ['\u00B7 ', total.callCount, ' calls'],
              }),
            ],
          }),
          _jsx('div', { className: 'text-[10px] text-gray-500', children: expanded ? '▼' : '▲' }),
        ],
      }),
      expanded &&
        _jsxs('div', {
          className: 'px-3 pb-2 space-y-1.5 max-h-[250px] overflow-y-auto',
          children: [
            _jsxs('div', {
              className: 'text-[10px] text-gray-400 flex justify-between gap-3',
              children: [
                _jsxs('span', {
                  children: [
                    'Input: ',
                    _jsx('span', { className: 'text-blue-300', children: fmt(total.promptTokens) }),
                  ],
                }),
                _jsxs('span', {
                  children: [
                    'Output: ',
                    _jsx('span', {
                      className: 'text-emerald-300',
                      children: fmt(total.completionTokens),
                    }),
                  ],
                }),
                hasCached &&
                  _jsxs('span', {
                    children: [
                      'Cached: ',
                      _jsx('span', {
                        className: 'text-amber-300',
                        children: fmt(total.cachedTokens),
                      }),
                      _jsxs('span', {
                        className: 'text-amber-400/60 ml-0.5',
                        children: ['(', pct(total.cachedTokens, total.promptTokens), ')'],
                      }),
                    ],
                  }),
              ],
            }),
            perPlayer
              .filter((p) => p.callCount > 0)
              .sort((a, b) => b.usage.totalTokens - a.usage.totalTokens)
              .map((p) =>
                _jsxs(
                  'div',
                  {
                    className: 'text-[10px] flex justify-between text-gray-500',
                    children: [
                      _jsx('span', {
                        className: 'text-gray-300 truncate mr-2',
                        children: p.playerName,
                      }),
                      _jsxs('span', {
                        className: 'whitespace-nowrap flex items-center gap-1.5',
                        children: [
                          _jsxs('span', {
                            className: 'text-blue-400/60',
                            children: ['\u2191', fmt(p.usage.promptTokens)],
                          }),
                          _jsxs('span', {
                            className: 'text-emerald-400/60',
                            children: ['\u2193', fmt(p.usage.completionTokens)],
                          }),
                          (p.usage.cachedTokens || 0) > 0 &&
                            _jsxs('span', {
                              className: 'text-amber-400/60',
                              children: ['\u26A1', fmt(p.usage.cachedTokens)],
                            }),
                          _jsxs('span', {
                            className: 'text-gray-600',
                            children: ['\u00B7 ', p.callCount, 'c'],
                          }),
                        ],
                      }),
                    ],
                  },
                  p.playerId,
                ),
              ),
          ],
        }),
    ],
  });
}

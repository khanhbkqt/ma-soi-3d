import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import {
  getRoleDistribution,
  Role,
  TOGGLEABLE_ROLES,
  getDefaultEnabledRoles,
  VIETNAMESE_NAMES,
} from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';
const ROLE_COLORS = {
  [Role.Werewolf]: 'text-red-400',
  [Role.AlphaWolf]: 'text-red-500',
  [Role.WolfCub]: 'text-red-300',
  [Role.Villager]: 'text-green-400',
  [Role.Seer]: 'text-purple-400',
  [Role.ApprenticeSeer]: 'text-purple-300',
  [Role.Witch]: 'text-emerald-400',
  [Role.Hunter]: 'text-orange-400',
  [Role.Guard]: 'text-blue-400',
  [Role.Cupid]: 'text-pink-400',
  [Role.Fool]: 'text-yellow-400',
};
const ROLE_NAMES_VI = {
  [Role.Werewolf]: 'Sói',
  [Role.AlphaWolf]: 'Sói Đầu Đàn',
  [Role.WolfCub]: 'Sói Con',
  [Role.Villager]: 'Dân',
  [Role.Seer]: 'Tiên Tri',
  [Role.ApprenticeSeer]: 'TT Tập Sự',
  [Role.Witch]: 'Phù Thủy',
  [Role.Hunter]: 'Thợ Săn',
  [Role.Guard]: 'Bảo Vệ',
  [Role.Cupid]: 'Cupid',
  [Role.Fool]: 'Kẻ Ngốc',
};
const ROLE_EMOJI = {
  [Role.Werewolf]: '🐺',
  [Role.AlphaWolf]: '🐺👑',
  [Role.WolfCub]: '🐺🍼',
  [Role.Villager]: '👤',
  [Role.Seer]: '🔮',
  [Role.ApprenticeSeer]: '🔮📚',
  [Role.Witch]: '🧪',
  [Role.Hunter]: '🏹',
  [Role.Guard]: '🛡️',
  [Role.Cupid]: '💘',
  [Role.Fool]: '🃏',
};
const DEFAULT_NAMES = VIETNAMESE_NAMES;
const PROVIDER_DEFAULTS = {
  'openai-compatible': { name: 'My Provider', model: '', baseUrl: '', apiKey: '' },
  openai: {
    name: 'OpenAI',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
  },
  anthropic: { name: 'Anthropic', model: 'claude-sonnet-4-20250514', baseUrl: '', apiKey: '' },
  ollama: {
    name: 'Ollama Local',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
  },
};
const MODEL_SUGGESTIONS = {
  'openai-compatible': [],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o4-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-3-5-haiku-20241022'],
  ollama: ['llama3.2', 'llama3.1', 'gemma2', 'mistral', 'qwen2.5', 'phi3'],
};
const MODEL_PLACEHOLDERS = {
  'openai-compatible': 'model-name',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  ollama: 'llama3.2',
};
const URL_PLACEHOLDERS = {
  'openai-compatible': 'http://localhost:1234/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: '',
  ollama: 'http://localhost:11434',
};
function ProviderForm({ initial, onSave, onCancel, saveLabel }) {
  const [form, setForm] = useState(initial);
  const type = form.type || 'openai-compatible';
  return _jsxs('div', {
    className: 'bg-gray-900 rounded-lg p-4 mb-4 border border-gray-600 space-y-3',
    children: [
      _jsxs('div', {
        className: 'grid grid-cols-2 gap-3',
        children: [
          _jsxs('div', {
            children: [
              _jsx('label', {
                className: 'block text-xs text-gray-400 mb-1',
                children: 'Lo\u1EA1i',
              }),
              _jsxs('select', {
                value: type,
                onChange: (e) => {
                  const t = e.target.value;
                  setForm({ ...PROVIDER_DEFAULTS[t], type: t, id: form.id });
                },
                className:
                  'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm',
                children: [
                  _jsx('option', { value: 'openai-compatible', children: 'OpenAI Compatible' }),
                  _jsx('option', { value: 'openai', children: 'OpenAI' }),
                  _jsx('option', { value: 'anthropic', children: 'Anthropic' }),
                  _jsx('option', { value: 'ollama', children: 'Ollama (C\u1EE5c b\u1ED9)' }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            children: [
              _jsx('label', {
                className: 'block text-xs text-gray-400 mb-1',
                children: 'T\u00EAn',
              }),
              _jsx('input', {
                value: form.name || '',
                onChange: (e) => setForm({ ...form, name: e.target.value }),
                className:
                  'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm',
              }),
            ],
          }),
          _jsxs('div', {
            children: [
              _jsxs('label', {
                className: 'block text-xs text-gray-400 mb-1',
                children: ['Base URL ', type === 'openai-compatible' ? '(bắt buộc)' : ''],
              }),
              _jsx('input', {
                value: form.baseUrl || '',
                onChange: (e) => setForm({ ...form, baseUrl: e.target.value }),
                placeholder: URL_PLACEHOLDERS[type],
                className:
                  'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm',
              }),
              type === 'openai-compatible' &&
                _jsx('p', {
                  className: 'text-[10px] text-gray-500 mt-1',
                  children: 'LM Studio, vLLM, Groq, Together, Fireworks, v.v.',
                }),
            ],
          }),
          _jsxs('div', {
            children: [
              _jsx('label', { className: 'block text-xs text-gray-400 mb-1', children: 'Model' }),
              _jsx('input', {
                value: form.model || '',
                onChange: (e) => setForm({ ...form, model: e.target.value }),
                list: `models-${type}`,
                placeholder: MODEL_PLACEHOLDERS[type],
                className:
                  'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm',
              }),
              _jsx('datalist', {
                id: `models-${type}`,
                children: (MODEL_SUGGESTIONS[type] || []).map((m) =>
                  _jsx('option', { value: m }, m),
                ),
              }),
            ],
          }),
          type !== 'ollama' &&
            _jsxs('div', {
              className: 'col-span-2',
              children: [
                _jsxs('label', {
                  className: 'block text-xs text-gray-400 mb-1',
                  children: ['API Key ', type === 'openai-compatible' ? '(nếu cần)' : ''],
                }),
                _jsx('input', {
                  type: 'password',
                  value: form.apiKey || '',
                  onChange: (e) => setForm({ ...form, apiKey: e.target.value }),
                  placeholder: type === 'openai-compatible' ? 'Bỏ trống nếu không cần' : '',
                  className:
                    'w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm',
                }),
              ],
            }),
        ],
      }),
      _jsxs('div', {
        className: 'flex gap-2',
        children: [
          _jsx('button', {
            onClick: () => onSave(form),
            className:
              'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition',
            children: saveLabel,
          }),
          _jsx('button', {
            onClick: onCancel,
            className:
              'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition',
            children: 'H\u1EE7y',
          }),
        ],
      }),
    ],
  });
}
export default function Lobby() {
  const { createGame, startGame, connected } = useGameStore();
  const [playerCount, setPlayerCount] = useState(8);
  const [gameName, setGameName] = useState('Ma Sói Night');
  const [autoPlay, setAutoPlay] = useState(true);
  const [phaseDelay, setPhaseDelay] = useState(3000);
  const [discussionRounds, setDiscussionRounds] = useState(4);
  const [discussionTimeLimitMs, setDiscussionTimeLimitMs] = useState(90000);
  const [providers, setProviders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('masoi-providers') || '[]');
    } catch {
      return [];
    }
  });
  const [players, setPlayers] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [enabledRoles, setEnabledRoles] = useState(() => getDefaultEnabledRoles(8));
  const [providerModels, setProviderModels] = useState({});
  const [showViewPicker, setShowViewPicker] = useState(false);
  useEffect(() => {
    providers.forEach((p) => {
      if (!providerModels[p.id]) {
        // Mark as fetching to avoid duplicate calls
        setProviderModels((prev) => ({ ...prev, [p.id]: [] }));
        fetch('/api/providers/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.models?.length > 0) {
              setProviderModels((prev) => ({ ...prev, [p.id]: data.models }));
            }
          })
          .catch((err) => console.error('Failed to fetch models for', p.name, err));
      }
    });
  }, [providers]); // eslint-disable-line react-hooks/exhaustive-deps
  // Update enabled roles when player count changes (add newly available roles)
  useEffect(() => {
    setEnabledRoles((prev) => {
      const defaults = getDefaultEnabledRoles(playerCount);
      // Keep existing toggles, but add newly available roles
      const newRoles = defaults.filter(
        (r) => !TOGGLEABLE_ROLES.some((t) => t.role === r && t.minPlayers > playerCount),
      );
      // Remove roles that are no longer available at this player count
      const filtered = prev.filter(
        (r) => (TOGGLEABLE_ROLES.find((t) => t.role === r)?.minPlayers ?? 0) <= playerCount,
      );
      // Add any new defaults that weren't in previous state
      const added = newRoles.filter((r) => !prev.includes(r));
      return [...filtered, ...added];
    });
  }, [playerCount]);
  const toggleRole = (role) => {
    setEnabledRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };
  const roles = getRoleDistribution(playerCount, enabledRoles);
  const roleCounts = roles.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  // Fetch default provider from server env on first mount
  useEffect(() => {
    if (providers.length > 0) return; // already have providers
    fetch('/api/default-provider')
      .then((res) => res.json())
      .then((data) => {
        if (data.available && data.provider) {
          const p = { ...data.provider, id: crypto.randomUUID() };
          setProviders([p]);
        }
      })
      .catch(() => {}); // silently ignore if server not ready
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    localStorage.setItem('masoi-providers', JSON.stringify(providers));
  }, [providers]);
  useEffect(() => {
    setPlayers((prev) => {
      const next = DEFAULT_NAMES.slice(0, playerCount).map((name, i) => {
        if (prev[i]) return prev[i];
        const randomProvider =
          providers.length > 0 ? providers[Math.floor(Math.random() * providers.length)] : null;
        let randomModel = '';
        if (randomProvider) {
          const providerType = randomProvider.type || 'openai';
          const models = providerModels[randomProvider.id] || MODEL_SUGGESTIONS[providerType] || [];
          if (models.length > 0) randomModel = models[Math.floor(Math.random() * models.length)];
        }
        return { name, providerId: randomProvider?.id || '', modelName: randomModel };
      });
      return next.slice(0, playerCount);
    });
  }, [playerCount]); // eslint-disable-line react-hooks/exhaustive-deps
  // When providers change, ensure all players have a valid providerId
  useEffect(() => {
    if (!providers.length) return;
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        providerId: providers.find((pr) => pr.id === p.providerId)
          ? p.providerId
          : providers[Math.floor(Math.random() * providers.length)].id,
      })),
    );
  }, [providers]);
  const addProvider = (form) => {
    const p = { ...form, id: crypto.randomUUID() };
    setProviders((prev) => [...prev, p]);
    setShowAddForm(false);
  };
  const updateProvider = (form) => {
    setProviders((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...form } : p)));
    setEditingId(null);
  };
  const testProvider = async (p) => {
    setTestResults((r) => ({ ...r, [p.id]: null }));
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [p.id]: data.success }));
    } catch {
      setTestResults((r) => ({ ...r, [p.id]: false }));
    }
  };
  const handleStart = () => {
    if (!providers.length) return alert('Hãy thêm ít nhất một nhà cung cấp AI!');
    const config = {
      gameName,
      playerCount,
      discussionRounds,
      discussionTimeLimitMs,
      autoPlay,
      phaseDelay,
      providers,
      playerSetup: players.map((p) => ({ ...p, providerId: p.providerId || providers[0].id })),
      enabledSpecialRoles: enabledRoles,
    };
    createGame(config);
    setShowViewPicker(true);
  };
  const confirmStart = (mode) => {
    setShowViewPicker(false);
    useGameStore.getState().setSpectatorMode(mode);
    setTimeout(() => startGame(), 400);
  };
  return _jsxs('div', {
    className:
      'w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#111827] to-[#0a0e1a]',
    children: [
      _jsxs('div', {
        className: 'max-w-4xl mx-auto p-6 space-y-6',
        children: [
          _jsxs('div', {
            className: 'text-center py-8',
            children: [
              _jsx('h1', {
                className:
                  'text-5xl font-bold bg-gradient-to-r from-amber-400 via-red-500 to-purple-500 bg-clip-text text-transparent',
                children: '\uD83D\uDC3A Ma S\u00F3i 3D',
              }),
              _jsx('p', {
                className: 'text-gray-400 mt-2',
                children:
                  'AI \u0110\u1EA5u Tr\u00ED Ma S\u00F3i \u2014 Xem tr\u00ED tu\u1EC7 nh\u00E2n t\u1EA1o ch\u01A1i tr\u00F2 l\u1EEBa d\u1ED1i',
              }),
              _jsx('div', {
                className: `mt-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`,
                children: connected ? '● Đã kết nối' : '○ Mất kết nối',
              }),
            ],
          }),
          _jsxs('section', {
            className: 'bg-gray-800/50 rounded-xl p-6 border border-gray-700',
            children: [
              _jsx('h2', {
                className: 'text-xl font-semibold text-amber-400 mb-4',
                children: '\u2699\uFE0F C\u00E0i \u0110\u1EB7t',
              }),
              _jsxs('div', {
                className: 'grid grid-cols-2 gap-4',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm text-gray-400 mb-1',
                        children: 'T\u00EAn Tr\u1EADn',
                      }),
                      _jsx('input', {
                        value: gameName,
                        onChange: (e) => setGameName(e.target.value),
                        className:
                          'w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsxs('label', {
                        className: 'block text-sm text-gray-400 mb-1',
                        children: ['S\u1ED1 Ng\u01B0\u1EDDi Ch\u01A1i: ', playerCount],
                      }),
                      _jsx('input', {
                        type: 'range',
                        min: 6,
                        max: 16,
                        value: playerCount,
                        onChange: (e) => setPlayerCount(+e.target.value),
                        className: 'w-full accent-amber-400',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsxs('label', {
                        className: 'block text-sm text-gray-400 mb-1',
                        children: ['S\u1ED1 V\u00F2ng Th\u1EA3o Lu\u1EADn: ', discussionRounds],
                      }),
                      _jsx('input', {
                        type: 'range',
                        min: 1,
                        max: 3,
                        value: discussionRounds,
                        onChange: (e) => setDiscussionRounds(+e.target.value),
                        className: 'w-full accent-amber-400',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsxs('label', {
                        className: 'block text-sm text-gray-400 mb-1',
                        children: [
                          'Gi\u1EDBi H\u1EA1n Th\u1EA3o Lu\u1EADn: ',
                          discussionTimeLimitMs / 1000,
                          's',
                        ],
                      }),
                      _jsx('input', {
                        type: 'range',
                        min: 30000,
                        max: 180000,
                        step: 15000,
                        value: discussionTimeLimitMs,
                        onChange: (e) => setDiscussionTimeLimitMs(+e.target.value),
                        className: 'w-full accent-amber-400',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsxs('label', {
                        className: 'block text-sm text-gray-400 mb-1',
                        children: [
                          '\u0110\u1ED9 Tr\u1EC5 Giai \u0110o\u1EA1n: ',
                          (phaseDelay / 1000).toFixed(1),
                          's',
                        ],
                      }),
                      _jsx('input', {
                        type: 'range',
                        min: 1000,
                        max: 10000,
                        step: 500,
                        value: phaseDelay,
                        onChange: (e) => setPhaseDelay(+e.target.value),
                        className: 'w-full accent-amber-400',
                      }),
                    ],
                  }),
                ],
              }),
              _jsx('div', {
                className: 'mt-4 flex items-center gap-3',
                children: _jsxs('label', {
                  className: 'flex items-center gap-2 cursor-pointer',
                  children: [
                    _jsx('input', {
                      type: 'checkbox',
                      checked: autoPlay,
                      onChange: (e) => setAutoPlay(e.target.checked),
                      className: 'accent-amber-400 w-4 h-4',
                    }),
                    _jsx('span', {
                      className: 'text-sm text-gray-300',
                      children:
                        'T\u1EF1 \u0111\u1ED9ng ch\u01A1i (b\u1ECF tick \u0111\u1EC3 \u0111i\u1EC1u khi\u1EC3n t\u1EEBng b\u01B0\u1EDBc)',
                    }),
                  ],
                }),
              }),
            ],
          }),
          _jsxs('section', {
            className: 'bg-gray-800/50 rounded-xl p-6 border border-gray-700',
            children: [
              _jsx('h2', {
                className: 'text-xl font-semibold text-amber-400 mb-2',
                children: '\uD83C\uDFAD Vai Tr\u00F2 \u0110\u1EB7c Bi\u1EC7t',
              }),
              _jsx('p', {
                className: 'text-xs text-gray-500 mb-4',
                children:
                  'B\u1EADt/t\u1EAFt vai tr\u00F2 \u0111\u1EB7c bi\u1EC7t. S\u00F3i Th\u01B0\u1EDDng, D\u00E2n, v\u00E0 Ti\u00EAn Tri lu\u00F4n c\u00F3 m\u1EB7t.',
              }),
              _jsx('div', {
                className: 'grid grid-cols-2 gap-2 mb-4',
                children: TOGGLEABLE_ROLES.map((tr) => {
                  const available = tr.minPlayers <= playerCount;
                  const enabled = enabledRoles.includes(tr.role) && available;
                  return _jsxs(
                    'button',
                    {
                      onClick: () => available && toggleRole(tr.role),
                      disabled: !available,
                      className: `flex items-center gap-3 rounded-lg px-4 py-3 border text-left transition-all duration-200 ${
                        !available
                          ? 'bg-gray-900/30 border-gray-800 opacity-40 cursor-not-allowed'
                          : enabled
                            ? 'bg-gray-900 border-amber-600/50 hover:border-amber-500'
                            : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'
                      }`,
                      children: [
                        _jsx('div', {
                          className: `w-9 h-5 rounded-full flex items-center shrink-0 transition-colors duration-200 ${enabled ? 'bg-amber-500' : 'bg-gray-700'}`,
                          children: _jsx('div', {
                            className: `w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`,
                          }),
                        }),
                        _jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            _jsxs('div', {
                              className: 'flex items-center gap-2',
                              children: [
                                _jsx('span', { className: 'text-sm', children: tr.emoji }),
                                _jsx('span', {
                                  className: `text-sm font-medium ${enabled ? 'text-white' : 'text-gray-500'}`,
                                  children: tr.label,
                                }),
                                !available &&
                                  _jsxs('span', {
                                    className: 'text-[10px] text-gray-600',
                                    children: ['(', tr.minPlayers, '+ ng\u01B0\u1EDDi)'],
                                  }),
                              ],
                            }),
                            _jsx('p', {
                              className: 'text-[11px] text-gray-500 mt-0.5 truncate',
                              children: tr.description,
                            }),
                          ],
                        }),
                      ],
                    },
                    tr.role,
                  );
                }),
              }),
              _jsxs('div', {
                className: 'border-t border-gray-700 pt-3',
                children: [
                  _jsx('div', {
                    className: 'text-xs text-gray-500 mb-2',
                    children: 'Danh s\u00E1ch vai tr\u00F2 cho v\u00E1n n\u00E0y:',
                  }),
                  _jsx('div', {
                    className: 'flex flex-wrap gap-2',
                    children: Object.entries(roleCounts).map(([role, count]) =>
                      _jsxs(
                        'div',
                        {
                          className: `flex items-center gap-1.5 bg-gray-900 rounded-lg px-3 py-1.5 border border-gray-700 ${ROLE_COLORS[role] || 'text-gray-400'}`,
                          children: [
                            _jsx('span', {
                              className: 'text-sm',
                              children: ROLE_EMOJI[role] || '❓',
                            }),
                            _jsx('span', {
                              className: 'text-xs font-medium',
                              children: ROLE_NAMES_VI[role] || role,
                            }),
                            _jsxs('span', {
                              className: 'bg-gray-700 rounded-full px-1.5 py-0.5 text-[10px]',
                              children: ['\u00D7', count],
                            }),
                          ],
                        },
                        role,
                      ),
                    ),
                  }),
                ],
              }),
              _jsx('p', {
                className: 'text-xs text-gray-600 mt-3',
                children:
                  '\uD83D\uDD04 Game loop: \u0110\u00EAm \u2192 R\u1EA1ng S\u00E1ng \u2192 Th\u1EA3o Lu\u1EADn \u2192 Ho\u00E0ng H\u00F4n (vote) \u2192 Ph\u00E1n X\u00E9t (bi\u1EC7n h\u1ED9 + gi\u1EBFt/tha)',
              }),
            ],
          }),
          _jsxs('section', {
            className: 'bg-gray-800/50 rounded-xl p-6 border border-gray-700',
            children: [
              _jsxs('div', {
                className: 'flex justify-between items-center mb-4',
                children: [
                  _jsx('h2', {
                    className: 'text-xl font-semibold text-amber-400',
                    children: '\uD83E\uDD16 Nh\u00E0 Cung C\u1EA5p AI',
                  }),
                  _jsx('button', {
                    onClick: () => {
                      setShowAddForm(!showAddForm);
                      setEditingId(null);
                    },
                    className:
                      'bg-amber-500 hover:bg-amber-600 text-black font-medium px-4 py-2 rounded-lg text-sm transition',
                    children: '+ Th\u00EAm',
                  }),
                ],
              }),
              showAddForm &&
                _jsx(ProviderForm, {
                  initial: { type: 'openai-compatible', ...PROVIDER_DEFAULTS['openai-compatible'] },
                  onSave: addProvider,
                  onCancel: () => setShowAddForm(false),
                  saveLabel: 'Th\u00EAm',
                }),
              providers.length === 0 &&
                !showAddForm &&
                _jsx('p', {
                  className: 'text-gray-500 text-sm',
                  children:
                    'Ch\u01B0a c\u00F3 nh\u00E0 cung c\u1EA5p n\u00E0o. Th\u00EAm m\u1ED9t c\u00E1i \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.',
                }),
              providers.map((p) =>
                _jsx(
                  'div',
                  {
                    className: 'mb-2',
                    children:
                      editingId === p.id
                        ? _jsx(ProviderForm, {
                            initial: p,
                            onSave: updateProvider,
                            onCancel: () => setEditingId(null),
                            saveLabel: 'L\u01B0u',
                          })
                        : _jsxs('div', {
                            className:
                              'flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-600',
                            children: [
                              _jsxs('div', {
                                className: 'min-w-0',
                                children: [
                                  _jsx('span', {
                                    className: 'font-medium text-white',
                                    children: p.name,
                                  }),
                                  _jsxs('span', {
                                    className: 'text-gray-400 text-sm ml-2',
                                    children: ['(', p.type, ' / ', p.model, ')'],
                                  }),
                                  p.baseUrl &&
                                    _jsx('span', {
                                      className: 'text-gray-500 text-xs ml-2 truncate',
                                      children: p.baseUrl,
                                    }),
                                ],
                              }),
                              _jsxs('div', {
                                className: 'flex items-center gap-2 shrink-0',
                                children: [
                                  testResults[p.id] === true &&
                                    _jsx('span', {
                                      className: 'text-green-400 text-sm',
                                      children: '\u2713 Ho\u1EA1t \u0111\u1ED9ng',
                                    }),
                                  testResults[p.id] === false &&
                                    _jsx('span', {
                                      className: 'text-red-400 text-sm',
                                      children: '\u2717 L\u1ED7i',
                                    }),
                                  testResults[p.id] === null &&
                                    _jsx('span', {
                                      className: 'text-yellow-400 text-sm animate-pulse',
                                      children: '\u0110ang test...',
                                    }),
                                  _jsx('button', {
                                    onClick: () => testProvider(p),
                                    className:
                                      'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition',
                                    children: 'Test',
                                  }),
                                  _jsx('button', {
                                    onClick: () => {
                                      setEditingId(p.id);
                                      setShowAddForm(false);
                                    },
                                    className:
                                      'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition',
                                    children: '\u270E S\u1EEDa',
                                  }),
                                  _jsx('button', {
                                    onClick: () =>
                                      setProviders(providers.filter((x) => x.id !== p.id)),
                                    className:
                                      'bg-red-900/50 hover:bg-red-800 text-red-300 px-3 py-1 rounded text-sm transition',
                                    children: '\u2715',
                                  }),
                                ],
                              }),
                            ],
                          }),
                  },
                  p.id,
                ),
              ),
            ],
          }),
          _jsxs('section', {
            className: 'bg-gray-800/50 rounded-xl p-6 border border-gray-700',
            children: [
              _jsxs('div', {
                className: 'flex justify-between items-center mb-4',
                children: [
                  _jsx('h2', {
                    className: 'text-xl font-semibold text-amber-400',
                    children: '\uD83D\uDC65 Ng\u01B0\u1EDDi Ch\u01A1i',
                  }),
                  _jsxs('button', {
                    type: 'button',
                    onClick: () => {
                      if (!providers.length) return;
                      setPlayers((prev) =>
                        prev.map((p) => {
                          const pr = providers[Math.floor(Math.random() * providers.length)];
                          const providerType = pr.type || 'openai';
                          const models =
                            providerModels[pr.id] || MODEL_SUGGESTIONS[providerType] || [];
                          const randomModel =
                            models.length > 0
                              ? models[Math.floor(Math.random() * models.length)]
                              : '';
                          return { ...p, providerId: pr.id, modelName: randomModel };
                        }),
                      );
                    },
                    className:
                      'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2',
                    title:
                      'Ph\u00E2n chia ng\u1EABu nhi\u00EAn AI cho t\u1EEBng ng\u01B0\u1EDDi ch\u01A1i',
                    children: [
                      _jsx('span', { children: '\uD83C\uDFB2' }),
                      ' Random Provider/Model',
                    ],
                  }),
                ],
              }),
              _jsx('div', {
                className: 'grid grid-cols-2 gap-2',
                children: players.map((p, i) => {
                  const providerId = p.providerId || providers[0]?.id;
                  const selectedProvider = providers.find((pr) => pr.id === providerId);
                  const providerType = selectedProvider?.type || 'openai';
                  const models =
                    providerModels[providerId] || MODEL_SUGGESTIONS[providerType] || [];
                  return _jsxs(
                    'div',
                    {
                      className:
                        'flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-600',
                      children: [
                        _jsxs('span', {
                          className: 'text-gray-500 text-sm w-6',
                          children: ['#', i + 1],
                        }),
                        _jsx('input', {
                          value: p.name,
                          onChange: (e) => {
                            const np = [...players];
                            np[i] = { ...np[i], name: e.target.value };
                            setPlayers(np);
                          },
                          className:
                            'flex-1 bg-transparent border-none text-white text-sm outline-none min-w-0',
                        }),
                        _jsxs('select', {
                          value: p.providerId || providers[0]?.id || '',
                          onChange: (e) => {
                            const np = [...players];
                            np[i] = { ...np[i], providerId: e.target.value, modelName: '' };
                            setPlayers(np);
                          },
                          className:
                            'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 max-w-[120px]',
                          disabled: !providers.length,
                          title: 'Nh\u00E0 cung c\u1EA5p',
                          children: [
                            !providers.length &&
                              _jsx('option', { value: '', children: 'Ch\u01B0a c\u00F3' }),
                            providers.map((pr) =>
                              _jsx('option', { value: pr.id, children: pr.name }, pr.id),
                            ),
                          ],
                        }),
                        _jsxs('select', {
                          value: p.modelName || '',
                          onChange: (e) => {
                            const np = [...players];
                            np[i] = { ...np[i], modelName: e.target.value };
                            setPlayers(np);
                          },
                          className:
                            'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 w-28 outline-none',
                          disabled: !providers.length,
                          title:
                            'T\u00EAn model (\u0111\u1EC3 tr\u1ED1ng s\u1EBD d\u00F9ng m\u1EB7c \u0111\u1ECBnh c\u1EE7a Provider)',
                          children: [
                            _jsx('option', {
                              value: '',
                              children: selectedProvider?.model || 'Mặc định',
                            }),
                            models.map((m) =>
                              _jsx(
                                'option',
                                {
                                  value: m,
                                  title: m,
                                  children: m.length > 15 ? m.substring(0, 13) + '...' : m,
                                },
                                m,
                              ),
                            ),
                          ],
                        }),
                      ],
                    },
                    i,
                  );
                }),
              }),
            ],
          }),
          _jsxs('div', {
            className: 'text-center pb-8',
            children: [
              _jsx('button', {
                onClick: handleStart,
                disabled: !connected || !providers.length,
                className:
                  'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105',
                children: '\uD83D\uDC3A B\u1EAFt \u0110\u1EA7u',
              }),
              !providers.length &&
                _jsx('p', {
                  className: 'text-gray-500 text-sm mt-2',
                  children:
                    'Th\u00EAm nh\u00E0 cung c\u1EA5p AI \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u',
                }),
            ],
          }),
        ],
      }),
      showViewPicker &&
        _jsx('div', {
          className:
            'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm',
          children: _jsxs('div', {
            className:
              'bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl',
            children: [
              _jsx('h3', {
                className: 'text-2xl font-bold text-center text-white mb-2',
                children: '\uD83D\uDC41 Ch\u1ECDn Ch\u1EBF \u0110\u1ED9 Xem',
              }),
              _jsx('p', {
                className: 'text-gray-400 text-sm text-center mb-6',
                children:
                  'B\u1EA1n mu\u1ED1n xem tr\u1EADn \u0111\u1EA5u nh\u01B0 th\u1EBF n\u00E0o?',
              }),
              _jsxs('div', {
                className: 'space-y-3',
                children: [
                  _jsxs('button', {
                    onClick: () => confirmStart('god'),
                    className:
                      'w-full flex items-center gap-4 bg-gray-800 hover:bg-amber-900/40 border border-gray-700 hover:border-amber-500/50 rounded-xl px-5 py-4 transition-all group',
                    children: [
                      _jsx('span', { className: 'text-3xl', children: '\uD83D\uDC41' }),
                      _jsxs('div', {
                        className: 'text-left',
                        children: [
                          _jsx('div', {
                            className:
                              'text-white font-semibold group-hover:text-amber-300 transition-colors',
                            children: 'To\u00E0n C\u1EA3nh (God Mode)',
                          }),
                          _jsx('div', {
                            className: 'text-gray-500 text-xs mt-0.5',
                            children:
                              'Xem t\u1EA5t c\u1EA3 \u2014 vai tr\u00F2, h\u00E0nh \u0111\u1ED9ng \u0111\u00EAm, b\u00E0n b\u1EA1c s\u00F3i',
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs('button', {
                    onClick: () => confirmStart('fog'),
                    className:
                      'w-full flex items-center gap-4 bg-gray-800 hover:bg-blue-900/40 border border-gray-700 hover:border-blue-500/50 rounded-xl px-5 py-4 transition-all group',
                    children: [
                      _jsx('span', { className: 'text-3xl', children: '\uD83C\uDF2B' }),
                      _jsxs('div', {
                        className: 'text-left',
                        children: [
                          _jsx('div', {
                            className:
                              'text-white font-semibold group-hover:text-blue-300 transition-colors',
                            children: 'S\u01B0\u01A1ng M\u00F9 (Fog of War)',
                          }),
                          _jsx('div', {
                            className: 'text-gray-500 text-xs mt-0.5',
                            children:
                              'Ch\u1EC9 th\u1EA5y th\u00F4ng tin c\u00F4ng khai \u2014 nh\u01B0 d\u00E2n l\u00E0ng th\u1EADt',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsx('button', {
                onClick: () => setShowViewPicker(false),
                className:
                  'w-full mt-4 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors',
                children: '\u2190 Quay l\u1EA1i',
              }),
            ],
          }),
        }),
    ],
  });
}

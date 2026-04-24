import { useState, useEffect } from 'react';
import {
  GameConfig,
  ProviderConfig,
  PlayerSetup,
  getRoleDistribution,
  Role,
  TOGGLEABLE_ROLES,
  getDefaultEnabledRoles,
  VIETNAMESE_NAMES,
} from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

const ROLE_COLORS: Record<Role, string> = {
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
const ROLE_NAMES_VI: Record<Role, string> = {
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
const ROLE_EMOJI: Record<Role, string> = {
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

const PROVIDER_DEFAULTS: Record<string, Partial<ProviderConfig>> = {
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

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  'openai-compatible': [],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o4-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-3-5-haiku-20241022'],
  ollama: ['llama3.2', 'llama3.1', 'gemma2', 'mistral', 'qwen2.5', 'phi3'],
};

const MODEL_PLACEHOLDERS: Record<string, string> = {
  'openai-compatible': 'model-name',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  ollama: 'llama3.2',
};

const URL_PLACEHOLDERS: Record<string, string> = {
  'openai-compatible': 'http://localhost:1234/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: '',
  ollama: 'http://localhost:11434',
};

function ProviderForm({
  initial,
  onSave,
  onCancel,
  saveLabel,
}: {
  initial: Partial<ProviderConfig>;
  onSave: (p: Partial<ProviderConfig>) => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const type = form.type || 'openai-compatible';

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-600 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Loại</label>
          <select
            value={type}
            onChange={(e) => {
              const t = e.target.value as any;
              setForm({ ...PROVIDER_DEFAULTS[t], type: t, id: form.id });
            }}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="openai-compatible">OpenAI Compatible</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama (Cục bộ)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tên</label>
          <input
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Base URL {type === 'openai-compatible' ? '(bắt buộc)' : ''}
          </label>
          <input
            value={form.baseUrl || ''}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder={URL_PLACEHOLDERS[type]}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
          {type === 'openai-compatible' && (
            <p className="text-[10px] text-gray-500 mt-1">
              LM Studio, vLLM, Groq, Together, Fireworks, v.v.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Model</label>
          <input
            value={form.model || ''}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            list={`models-${type}`}
            placeholder={MODEL_PLACEHOLDERS[type]}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
          <datalist id={`models-${type}`}>
            {(MODEL_SUGGESTIONS[type] || []).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        {type !== 'ollama' && (
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">
              API Key {type === 'openai-compatible' ? '(nếu cần)' : ''}
            </label>
            <input
              type="password"
              value={form.apiKey || ''}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={type === 'openai-compatible' ? 'Bỏ trống nếu không cần' : ''}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition"
        >
          {saveLabel}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

export default function Lobby() {
  const { createGame, startGame, connected } = useGameStore();
  const [playerCount, setPlayerCount] = useState(8);
  const [gameName, setGameName] = useState('Ma Sói Night');
  const [autoPlay, setAutoPlay] = useState(true);
  const [phaseDelay, setPhaseDelay] = useState(3000);
  const [discussionRounds, setDiscussionRounds] = useState(4);
  const [discussionTimeLimitMs, setDiscussionTimeLimitMs] = useState(90000);
  const [providers, setProviders] = useState<ProviderConfig[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('masoi-providers') || '[]');
    } catch {
      return [];
    }
  });
  const [players, setPlayers] = useState<PlayerSetup[]>([]);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enabledRoles, setEnabledRoles] = useState<Role[]>(() => getDefaultEnabledRoles(8));
  const [providerModels, setProviderModels] = useState<Record<string, string[]>>({});
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

  const toggleRole = (role: Role) => {
    setEnabledRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const roles = getRoleDistribution(playerCount, enabledRoles);
  const roleCounts = roles.reduce(
    (acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Fetch default provider from server env on first mount
  useEffect(() => {
    if (providers.length > 0) return; // already have providers
    fetch('/api/default-provider')
      .then((res) => res.json())
      .then((data) => {
        if (data.available && data.provider) {
          const p: ProviderConfig = { ...data.provider, id: crypto.randomUUID() };
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

  const addProvider = (form: Partial<ProviderConfig>) => {
    const p: ProviderConfig = { ...form, id: crypto.randomUUID() } as ProviderConfig;
    setProviders((prev) => [...prev, p]);
    setShowAddForm(false);
  };

  const updateProvider = (form: Partial<ProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === form.id ? ({ ...p, ...form } as ProviderConfig) : p)),
    );
    setEditingId(null);
  };

  const testProvider = async (p: ProviderConfig) => {
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
    const config: GameConfig = {
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

  const confirmStart = (mode: 'god' | 'fog') => {
    setShowViewPicker(false);
    useGameStore.getState().setSpectatorMode(mode);
    setTimeout(() => startGame(), 400);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#111827] to-[#0a0e1a]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            🐺 Ma Sói 3D
          </h1>
          <p className="text-gray-400 mt-2">
            AI Đấu Trí Ma Sói — Xem trí tuệ nhân tạo chơi trò lừa dối
          </p>
          <div className={`mt-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? '● Đã kết nối' : '○ Mất kết nối'}
          </div>
        </div>

        {/* Game Settings */}
        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">⚙️ Cài Đặt</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tên Trận</label>
              <input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Số Người Chơi: {playerCount}
              </label>
              <input
                type="range"
                min={6}
                max={16}
                value={playerCount}
                onChange={(e) => setPlayerCount(+e.target.value)}
                className="w-full accent-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Số Vòng Thảo Luận: {discussionRounds}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                value={discussionRounds}
                onChange={(e) => setDiscussionRounds(+e.target.value)}
                className="w-full accent-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Giới Hạn Thảo Luận: {discussionTimeLimitMs / 1000}s
              </label>
              <input
                type="range"
                min={30000}
                max={180000}
                step={15000}
                value={discussionTimeLimitMs}
                onChange={(e) => setDiscussionTimeLimitMs(+e.target.value)}
                className="w-full accent-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Độ Trễ Giai Đoạn: {(phaseDelay / 1000).toFixed(1)}s
              </label>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={phaseDelay}
                onChange={(e) => setPhaseDelay(+e.target.value)}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="accent-amber-400 w-4 h-4"
              />
              <span className="text-sm text-gray-300">
                Tự động chơi (bỏ tick để điều khiển từng bước)
              </span>
            </label>
          </div>
        </section>

        {/* Role Toggles */}
        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-amber-400 mb-2">🎭 Vai Trò Đặc Biệt</h2>
          <p className="text-xs text-gray-500 mb-4">
            Bật/tắt vai trò đặc biệt. Sói Thường, Dân, và Tiên Tri luôn có mặt.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {TOGGLEABLE_ROLES.map((tr) => {
              const available = tr.minPlayers <= playerCount;
              const enabled = enabledRoles.includes(tr.role) && available;
              return (
                <button
                  key={tr.role}
                  onClick={() => available && toggleRole(tr.role)}
                  disabled={!available}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 border text-left transition-all duration-200 ${
                    !available
                      ? 'bg-gray-900/30 border-gray-800 opacity-40 cursor-not-allowed'
                      : enabled
                        ? 'bg-gray-900 border-amber-600/50 hover:border-amber-500'
                        : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {/* Toggle indicator */}
                  <div
                    className={`w-9 h-5 rounded-full flex items-center shrink-0 transition-colors duration-200 ${
                      enabled ? 'bg-amber-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{tr.emoji}</span>
                      <span
                        className={`text-sm font-medium ${enabled ? 'text-white' : 'text-gray-500'}`}
                      >
                        {tr.label}
                      </span>
                      {!available && (
                        <span className="text-[10px] text-gray-600">({tr.minPlayers}+ người)</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{tr.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live role preview */}
          <div className="border-t border-gray-700 pt-3">
            <div className="text-xs text-gray-500 mb-2">Danh sách vai trò cho ván này:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div
                  key={role}
                  className={`flex items-center gap-1.5 bg-gray-900 rounded-lg px-3 py-1.5 border border-gray-700 ${ROLE_COLORS[role as Role] || 'text-gray-400'}`}
                >
                  <span className="text-sm">{ROLE_EMOJI[role as Role] || '❓'}</span>
                  <span className="text-xs font-medium">{ROLE_NAMES_VI[role as Role] || role}</span>
                  <span className="bg-gray-700 rounded-full px-1.5 py-0.5 text-[10px]">
                    ×{count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-3">
            🔄 Game loop: Đêm → Rạng Sáng → Thảo Luận → Hoàng Hôn (vote) → Phán Xét (biện hộ +
            giết/tha)
          </p>
        </section>

        {/* AI Providers */}
        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-400">🤖 Nhà Cung Cấp AI</h2>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingId(null);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-4 py-2 rounded-lg text-sm transition"
            >
              + Thêm
            </button>
          </div>

          {showAddForm && (
            <ProviderForm
              initial={{ type: 'openai-compatible', ...PROVIDER_DEFAULTS['openai-compatible'] }}
              onSave={addProvider}
              onCancel={() => setShowAddForm(false)}
              saveLabel="Thêm"
            />
          )}

          {providers.length === 0 && !showAddForm && (
            <p className="text-gray-500 text-sm">
              Chưa có nhà cung cấp nào. Thêm một cái để bắt đầu.
            </p>
          )}
          {providers.map((p) => (
            <div key={p.id} className="mb-2">
              {editingId === p.id ? (
                <ProviderForm
                  initial={p}
                  onSave={updateProvider}
                  onCancel={() => setEditingId(null)}
                  saveLabel="Lưu"
                />
              ) : (
                <div className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-600">
                  <div className="min-w-0">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      ({p.type} / {p.model})
                    </span>
                    {p.baseUrl && (
                      <span className="text-gray-500 text-xs ml-2 truncate">{p.baseUrl}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {testResults[p.id] === true && (
                      <span className="text-green-400 text-sm">✓ Hoạt động</span>
                    )}
                    {testResults[p.id] === false && (
                      <span className="text-red-400 text-sm">✗ Lỗi</span>
                    )}
                    {testResults[p.id] === null && (
                      <span className="text-yellow-400 text-sm animate-pulse">Đang test...</span>
                    )}
                    <button
                      onClick={() => testProvider(p)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setShowAddForm(false);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                      ✎ Sửa
                    </button>
                    <button
                      onClick={() => setProviders(providers.filter((x) => x.id !== p.id))}
                      className="bg-red-900/50 hover:bg-red-800 text-red-300 px-3 py-1 rounded text-sm transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Player Setup */}
        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-400">👥 Người Chơi</h2>
            <button
              type="button"
              onClick={() => {
                if (!providers.length) return;
                setPlayers((prev) =>
                  prev.map((p) => {
                    const pr = providers[Math.floor(Math.random() * providers.length)];
                    const providerType = pr.type || 'openai';
                    const models = providerModels[pr.id] || MODEL_SUGGESTIONS[providerType] || [];
                    const randomModel =
                      models.length > 0 ? models[Math.floor(Math.random() * models.length)] : '';
                    return { ...p, providerId: pr.id, modelName: randomModel };
                  }),
                );
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2"
              title="Phân chia ngẫu nhiên AI cho từng người chơi"
            >
              <span>🎲</span> Random Provider/Model
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p, i) => {
              const providerId = p.providerId || providers[0]?.id;
              const selectedProvider = providers.find((pr) => pr.id === providerId);
              const providerType = selectedProvider?.type || 'openai';
              const models = providerModels[providerId] || MODEL_SUGGESTIONS[providerType] || [];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-600"
                >
                  <span className="text-gray-500 text-sm w-6">#{i + 1}</span>
                  <input
                    value={p.name}
                    onChange={(e) => {
                      const np = [...players];
                      np[i] = { ...np[i], name: e.target.value };
                      setPlayers(np);
                    }}
                    className="flex-1 bg-transparent border-none text-white text-sm outline-none min-w-0"
                  />
                  <select
                    value={p.providerId || providers[0]?.id || ''}
                    onChange={(e) => {
                      const np = [...players];
                      np[i] = { ...np[i], providerId: e.target.value, modelName: '' };
                      setPlayers(np);
                    }}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 max-w-[120px]"
                    disabled={!providers.length}
                    title="Nhà cung cấp"
                  >
                    {!providers.length && <option value="">Chưa có</option>}
                    {providers.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={p.modelName || ''}
                    onChange={(e) => {
                      const np = [...players];
                      np[i] = { ...np[i], modelName: e.target.value };
                      setPlayers(np);
                    }}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 w-28 outline-none"
                    disabled={!providers.length}
                    title="Tên model (để trống sẽ dùng mặc định của Provider)"
                  >
                    <option value="">{selectedProvider?.model || 'Mặc định'}</option>
                    {models.map((m) => (
                      <option key={m} value={m} title={m}>
                        {m.length > 15 ? m.substring(0, 13) + '...' : m}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </section>

        {/* Start Button */}
        <div className="text-center pb-8">
          <button
            onClick={handleStart}
            disabled={!connected || !providers.length}
            className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105"
          >
            🐺 Bắt Đầu
          </button>
          {!providers.length && (
            <p className="text-gray-500 text-sm mt-2">Thêm nhà cung cấp AI để bắt đầu</p>
          )}
        </div>
      </div>

      {/* View Mode Picker Modal */}
      {showViewPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-center text-white mb-2">👁 Chọn Chế Độ Xem</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Bạn muốn xem trận đấu như thế nào?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => confirmStart('god')}
                className="w-full flex items-center gap-4 bg-gray-800 hover:bg-amber-900/40 border border-gray-700 hover:border-amber-500/50 rounded-xl px-5 py-4 transition-all group"
              >
                <span className="text-3xl">👁</span>
                <div className="text-left">
                  <div className="text-white font-semibold group-hover:text-amber-300 transition-colors">
                    Toàn Cảnh (God Mode)
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Xem tất cả — vai trò, hành động đêm, bàn bạc sói
                  </div>
                </div>
              </button>
              <button
                onClick={() => confirmStart('fog')}
                className="w-full flex items-center gap-4 bg-gray-800 hover:bg-blue-900/40 border border-gray-700 hover:border-blue-500/50 rounded-xl px-5 py-4 transition-all group"
              >
                <span className="text-3xl">🌫</span>
                <div className="text-left">
                  <div className="text-white font-semibold group-hover:text-blue-300 transition-colors">
                    Sương Mù (Fog of War)
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Chỉ thấy thông tin công khai — như dân làng thật
                  </div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowViewPicker(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Role, Phase } from '@ma-soi/shared';
export const ROLE_COLORS = {
  [Role.Werewolf]: '#ef4444',
  [Role.AlphaWolf]: '#dc2626',
  [Role.WolfCub]: '#f87171',
  [Role.Villager]: '#4ade80',
  [Role.Seer]: '#a855f7',
  [Role.ApprenticeSeer]: '#c084fc',
  [Role.Witch]: '#34d399',
  [Role.Hunter]: '#f97316',
  [Role.Guard]: '#3b82f6',
  [Role.Cupid]: '#f472b6',
  [Role.Fool]: '#fbbf24',
};
export const ROLE_NAMES_VI = {
  [Role.Werewolf]: 'Sói',
  [Role.AlphaWolf]: 'Sói Đầu Đàn',
  [Role.WolfCub]: 'Sói Con',
  [Role.Villager]: 'Dân',
  [Role.Seer]: 'Tiên Tri',
  [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự',
  [Role.Witch]: 'Phù Thủy',
  [Role.Hunter]: 'Thợ Săn',
  [Role.Guard]: 'Bảo Vệ',
  [Role.Cupid]: 'Thần Tình Yêu',
  [Role.Fool]: 'Kẻ Ngốc',
};
export const PHASE_INFO = {
  [Phase.Night]: { label: 'Đêm', icon: '🌙', color: 'text-blue-300' },
  [Phase.Dawn]: { label: 'Rạng Sáng', icon: '🌅', color: 'text-orange-300' },
  [Phase.Day]: { label: 'Thảo Luận', icon: '☀️', color: 'text-yellow-300' },
  [Phase.Dusk]: { label: 'Hoàng Hôn', icon: '🌇', color: 'text-amber-300' },
  [Phase.Judgement]: { label: 'Phán Xét', icon: '⚖️', color: 'text-red-300' },
  [Phase.GameOver]: { label: 'Kết Thúc', icon: '🏆', color: 'text-red-300' },
  [Phase.Lobby]: { label: 'Sảnh Chờ', icon: '⏳', color: 'text-gray-300' },
};

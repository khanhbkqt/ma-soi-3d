import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class VillagerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ DÂN — không có skill gì, phải dùng não.
CHIẾN LƯỢC:
- Hỏi han, chất vấn, bắt bẻ logic để tìm sói
- Đừng ngồi im — dân im là dân chết
- Quan sát ai nói lấp liếm, ai bảo vệ ai, ai vote lạ
- Liên minh với người mày tin, cùng vote sói`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ DÂN. Không có skill, phải dùng não.
- Hỏi han, chất vấn, bắt bẻ logic
- Đừng ngồi im — dân im là dân chết`;
  }
}

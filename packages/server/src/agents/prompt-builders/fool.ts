import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class FoolPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ KẺ NGỐC — mày THẮNG khi bị dân vote treo cổ!
QUY TẮC:
- Bị treo cổ (vote ban ngày) = MÀY THẮNG ngay lập tức, game kết thúc
- Bị sói cắn ban đêm = mày chết bình thường, KHÔNG thắng
CHIẾN LƯỢC:
- Diễn như sói vụng để mọi người đòi treo cổ mày
- Nói lấp liếm, mâu thuẫn, đáng ngờ — nhưng đừng lộ liễu quá
- Đừng tự nhận là Kẻ Ngốc — mất hết fun`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày THẮNG khi bị treo cổ! Diễn đáng ngờ nhưng đừng lộ liễu quá.`;
  }

  voteHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày MUỐN bị treo cổ. Vote ai cũng được, miễn làm mình đáng ngờ.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC đang bị đưa lên giàn — ĐÂY LÀ CƠ HỘI THẮNG!
Biện hộ yếu yếu cho tự nhiên, nhưng ĐỪNG thuyết phục quá. Mày MUỐN bị giết.`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày muốn MÌN bị treo cổ, không phải người khác.
Nếu người khác bị đưa lên giàn → vote THA (để mày vẫn là target chính sau này).`;
  }
}

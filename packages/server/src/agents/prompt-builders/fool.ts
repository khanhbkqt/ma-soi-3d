import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class FoolPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ KẺ NGỐC — mày THẮNG ngay lập tức khi bị dân vote treo cổ. Bị sói cắn = chết bình thường, không thắng.
MỤC TIÊU: Khiến dân nghĩ mày là SÓI → vote treo cổ mày → mày thắng.
THẾ KHÓ: Phải đáng ngờ đủ để bị vote, nhưng không lộ liễu đến mức dân nhận ra mày là Kẻ Ngốc (lúc đó họ sẽ không vote).
CÁCH TẠO NGHI NGỜ TINH VI:
- Mâu thuẫn nhẹ giữa lời nói và vote — nhưng trông như "vô tình", không cố ý.
- Bênh người bị nghi sói → dân nghĩ mày cùng phe sói.
- Lấp liếm, né câu hỏi, đổi chủ đề — nhưng vẫn có vẻ đang cố giấu gì đó.
- Vote lạ: vote người ít bị nghi, hoặc skip khi đám đông đang dồn.
Tuyệt đối KHÔNG tự nhận là Kẻ Ngốc — mất hết.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mục tiêu: bị treo cổ.
Diễn đáng ngờ tinh vi — mâu thuẫn nhẹ, lấp liếm, bênh người bị nghi sói. Đừng quá lố — dân thông minh sẽ nhận ra.`;
  }

  voteHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Vote lạ để tạo nghi ngờ — vote người ít bị nghi, hoặc vote lệch khỏi đám đông.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC đang bị đưa lên giàn — CƠ HỘI THẮNG!
Biện hộ yếu nhưng tự nhiên — đừng thuyết phục quá, nhưng cũng đừng nói "giết tao đi". Mục tiêu: dân vote GIẾT.`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Người khác bị xử → vote THA (để mày vẫn là target sau). Đưa lý do tha hợp lý.`;
  }
}

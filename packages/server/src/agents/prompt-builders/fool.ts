import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class FoolPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ KẺ NGỐC — mày THẮNG khi bị dân vote treo cổ!
QUY TẮC:
- Bị treo cổ (vote ban ngày) = MÀY THẮNG ngay lập tức, game kết thúc
- Bị sói cắn ban đêm = mày chết bình thường, KHÔNG thắng
KỸ THUẬT DIỄN XUẤT — làm mình đáng ngờ TINH VI:
- Nói lấp liếm nhẹ — trả lời vòng vo, né câu hỏi, đổi chủ đề. Nhưng ĐỪNG quá lộ liễu.
- Mâu thuẫn nhẹ — nói 1 đằng vote 1 nẻo, đổi ý không lý do. Nhưng vẫn có vẻ "vô tình".
- Bảo vệ người bị nghi là sói — dân sẽ nghĩ mày là sói đang bênh đồng đội
- Vote lạ — vote người ít bị nghi, hoặc skip khi mọi người đang vote mạnh
- ĐỪNG tự nhận là Kẻ Ngốc — mất hết fun
- ĐỪNG diễn quá lố — nếu quá rõ ràng, dân sẽ nghi mày là Kẻ Ngốc và KHÔNG vote
- Mục tiêu: dân nghĩ mày là SÓI (không phải Kẻ Ngốc) → vote treo cổ → mày thắng`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày THẮNG khi bị treo cổ!
- Diễn đáng ngờ TINH VI — lấp liếm nhẹ, mâu thuẫn nhẹ, bênh người bị nghi sói
- React lại người khác nhưng hơi "lạ" — đồng ý rồi lại phản bác, né câu hỏi
- ĐỪNG quá lộ liễu — dân thông minh sẽ nhận ra mày là Kẻ Ngốc
- Mục tiêu: dân nghĩ mày là SÓI → vote treo cổ mày`;
  }

  voteHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày MUỐN bị treo cổ.
- Vote lạ để tạo nghi ngờ: vote người ít bị nghi, hoặc skip khi mọi người vote mạnh
- Hoặc vote giống sói (nếu biết ai là sói) → dân nghĩ mày cùng phe sói`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC đang bị đưa lên giàn — ĐÂY LÀ CƠ HỘI THẮNG!
- Biện hộ YẾU nhưng TỰ NHIÊN — đừng thuyết phục quá, nhưng cũng đừng lộ liễu
- Nói kiểu "tao... tao không biết nói sao" hoặc biện hộ mâu thuẫn
- ĐỪNG nói "tao là Kẻ Ngốc" hoặc "giết tao đi"
- Mục tiêu: dân vote GIẾT mày → mày thắng`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mày muốn MÌNH bị treo cổ, không phải người khác.
- Nếu người khác bị đưa lên giàn → vote THA (để mày vẫn là target sau này)
- Đưa lý do tha hợp lý: "chưa đủ bằng chứng", "tao thấy nó không phải sói"`;
  }
}

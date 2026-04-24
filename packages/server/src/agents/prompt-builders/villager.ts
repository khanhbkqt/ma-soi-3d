import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class VillagerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ DÂN — không có skill, não là vũ khí duy nhất.
MỤC TIÊU: Tìm và treo cổ sói trước khi sói giết hết dân.
CÁCH ĐẠT MỤC TIÊU:
Mày có 3 nguồn thông tin — khai thác hết:
1. Ai chết đêm qua, tại sao? Ai hưởng lợi? Ai đang bênh/tố người chết trước đó?
2. Vote pattern: ai vote giống nhau liên tục? Ai đổi vote phút cuối? Ai vote lệch khỏi đám đông?
3. Hành vi: ai nói nhiều nhưng rỗng? Ai im khi đồng minh bị tố? Ai đổi ý không lý do?
Mày không có skill bảo vệ — nên giá trị của mày nằm ở việc đọc người và dẫn dắt vote đúng.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ DÂN. Não là vũ khí duy nhất — dùng nó:
- React lại lời người khác — đồng ý, phản bác, hỏi dồn. Đặt câu hỏi cụ thể dựa trên vote/hành vi.
- So sánh lời nói với hành động: nói 1 đằng vote 1 nẻo = đáng ngờ.
- Phân tích cái chết đêm qua: ai hưởng lợi? Ai đang beef với người chết?
- Tố khi có cớ, im khi chưa chắc — tố bừa chỉ giúp sói.`;
  }
}

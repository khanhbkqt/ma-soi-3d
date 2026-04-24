import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class VillagerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ DÂN — không có skill gì, phải dùng não. Mày là xương sống của phe dân.
CÁCH TÌM SÓI:
- PHÂN TÍCH CÁI CHẾT: Sói cắn ai đêm qua? Tại sao? Ai hưởng lợi khi người đó chết? Ai hôm qua bảo vệ người chết → có thể dân thật. Ai tố người chết → đáng ngờ (sói diệt người tố mình?).
- PHÂN TÍCH VOTE: Ai vote giống nhau nhiều vòng? (cùng phe sói). Ai đổi vote phút cuối? Ai vote dân thay vì nghi phạm chính?
- PHÂN TÍCH HÀNH VI: Ai im khi đồng minh bị tố? Ai nói nhiều nhưng rỗng? Ai luôn hùa theo mà không có ý kiến riêng? Ai đổi ý đột ngột?
- PHÂN TÍCH LIÊN MINH: Ai luôn bênh ai? Ai không bao giờ tố ai? → có thể cùng phe sói.
CHIẾN LƯỢC:
- Hỏi han, chất vấn, bắt bẻ logic — đặt câu hỏi CỤ THỂ, không hỏi chung chung
- Đừng ngồi im — dân im là dân chết
- Liên minh với người mày tin, cùng vote sói
- Cross-reference: so sánh lời nói với hành động. Nói 1 đằng vote 1 nẻo = đáng ngờ.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ DÂN. Không có skill, phải dùng não.
- React lại lời người khác — đồng ý, phản bác, hỏi dồn. KHÔNG nói như đang độc thoại.
- Đặt câu hỏi CỤ THỂ: "Ê vòng trước mày vote thằng A, giờ mày lại bênh nó, sao vậy?"
- Chỉ ra mâu thuẫn nếu thấy: "Mày nói nghi thằng B nhưng lại vote thằng C?"
- Phân tích cái chết: "Thằng X chết đêm qua — ai hưởng lợi? Ai hôm qua đang beef với X?"
- Đừng tố bừa — phải có lý do cụ thể dựa trên vote, lời nói, hoặc hành vi.`;
  }
}

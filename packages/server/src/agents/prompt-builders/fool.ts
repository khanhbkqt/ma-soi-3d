import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class FoolPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ KẺ NGỐC — mày THẮNG ngay lập tức khi bị dân vote treo cổ. Bị sói cắn = chết bình thường, không thắng.
MỤC TIÊU: Khiến dân nghĩ mày là SÓI → vote treo cổ mày → mày thắng.
THẾ KHÓ: Ai cố tình diễn "đáng ngờ" (nói ngắc ngứ, vote ngược bầy) sẽ bị Làng nhận ra ngay là Kẻ Ngốc và BƠ ĐI.
TƯ DUY ĐỈNH CAO — TINH TẾ, KHÔNG LỘ LIỄU:
- Tạo nghi ngờ DẦN DẦN: Nói mâu thuẫn nhẹ giữa các vòng (vòng trước bênh A, vòng sau tố A). Bênh sai người một cách "tự nhiên". Vote lệch có chủ đích nhưng luôn có lý do nghe được.
- Giả Sói khéo: Chơi như 1 con Sói đang CỐ GẮNG LÀM NGƯỜI nhưng thất bại — bảo vệ đồng minh sói (giả) quá lộ, redirect khi bị hỏi, đổi target phút cuối.
- Fake Claim THÔNG MINH: Nếu claim role, phải có chuẩn bị — đừng claim rồi bị bóc ngay lập tức. Tốt nhất là claim vào thời điểm hỗn loạn khi nhiều người đang cãi nhau.
- Tuyệt đối KHÔNG tự nhận là Kẻ Ngốc và KHÔNG lấp liếm vụng về.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mục tiêu: bị treo cổ.
TƯ DUY TINH TẾ: Tạo nghi ngờ VỪA ĐỦ — nói mâu thuẫn nhẹ, bênh sai người, vote lệch có chủ đích. Đừng fake claim quá lộ liễu khiến dân nhận ra mày là Ngốc và bơ đi. Chơi như Sói đang cố giấu chứ không phải Ngốc đang cố chết.`;
  }

  voteHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Đừng vote lạ một cách vô lý. Hãy vote hùa theo những mũi tấn công sai lầm, hoặc kiên quyết vote một người vô tội đến cùng để chứng tỏ mày là Sói đang khát máu.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC đang bị đưa lên giàn — CƠ HỘI THẮNG!
Biện hộ yếu nhưng tự nhiên — đừng thuyết phục quá, nhưng cũng đừng nói "giết tao đi". Mục tiêu: dân vote GIẾT.`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Người khác bị xử → vote THA (để mày vẫn là target sau). Đưa lý do tha hợp lý.`;
  }
}

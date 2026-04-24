import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class FoolPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ KẺ NGỐC — mày THẮNG ngay lập tức khi bị dân vote treo cổ. Bị sói cắn = chết bình thường, không thắng.
MỤC TIÊU: Khiến dân nghĩ mày là SÓI → vote treo cổ mày → mày thắng.
THẾ KHÓ: Ai cố tình diễn "đáng ngờ" (nói ngắc ngứ, vote ngược bầy) sẽ bị Làng nhận ra ngay là Kẻ Ngốc và BƠ ĐI.
TƯ DUY ĐỈNH CAO: Để được Làng vote treo cổ, mày phải chơi như 1 con Sói đang CỐ GẮNG LÀM NGƯỜI nhưng thất bại, HOẶC làm 1 Dân Làng cực kỳ XẠO LÁO.
- Tấn công sai: Cố tình tấn công gắt gao 1 người chắc chắn là Dân, để khi Làng nhận ra, họ sẽ ghét và treo cổ mày.
- Fake Claim (Nhận vơ vai trò): Sáng ra tự nhận là Tiên Tri, chỉ đại 1 người là Sói. Nếu trật, Làng sẽ nghĩ mày là Sói đóng giả Tiên Tri và treo cổ mày ngay lập tức!
- Tuyệt đối KHÔNG tự nhận là Kẻ Ngốc và KHÔNG lấp liếm vụng về. Hãy diễn một cách hung hăng.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ KẺ NGỐC. Mục tiêu: bị treo cổ.
TƯ DUY PHẢN BẮT BÀI: Đừng cố tình ăn nói ngập ngừng hay lấp liếm, dân khôn sẽ biết mày là Ngốc và không vote. Hãy chơi HUNG HĂNG: tấn công sai người hoặc nhận vơ là Tiên Tri soi bậy để dân phẫn nộ nghĩ mày là Sói xạo láo.`;
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

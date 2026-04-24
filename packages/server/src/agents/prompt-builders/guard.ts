import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class GuardPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ BẢO VỆ — mỗi đêm chọn 1 người bảo vệ khỏi sói cắn.
Ràng buộc: không bảo vệ cùng 1 người 2 đêm liên tiếp. Có thể bảo vệ chính mình. Chỉ chặn sói, không chặn thuốc độc.
MỤC TIÊU: Đoán đúng target sói → chặn kill → phe dân lợi lớn.
THẾ KHÓ CỦA BẢO VỆ:
- Tiên Tri come out → sói muốn cắn Tiên Tri → mày muốn đỡ Tiên Tri. Nhưng sói biết mày sẽ đỡ → có thể cắn người khác. Mind game nhiều lớp.
- Không ai come out → phải đoán sói nhắm ai dựa trên: ai đang dẫn dắt dân, ai vừa tố sói đúng, ai nguy hiểm cho sói.
- Đừng predictable — sói sẽ đọc pattern bảo vệ.
BAN NGÀY: Giấu thân, chơi như dân. Come out khi bị đưa lên giàn.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ BẢO VỆ. Giấu thân, nói như dân. Tham gia thảo luận tự nhiên.
Đừng hint gì về bảo vệ. Nếu ai come out Tiên Tri → đừng nói "tao sẽ đỡ" (lộ cho sói).`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là BẢO VỆ bị đưa lên giàn! Come out — giết mày thì đêm không ai đỡ, sói cắn thoải mái.
Nếu đã đỡ thành công trước đó → nói ra làm bằng chứng.`;
  }

  guardProtect(player: Player, state: GameState, observations: string[], lastGuardedId: string | null): string {
    const targets = state.players.filter(p => p.alive && p.id !== lastGuardedId);
    const lastGuardedName = lastGuardedId ? state.players.find(p => p.id === lastGuardedId)?.name : null;
    return `${taskContext(observations)}
Chọn 1 người để bảo vệ đêm nay (có thể bảo vệ chính mình).
${lastGuardedName ? `Không được bảo vệ ${lastGuardedName} (đêm trước đã bảo vệ).` : ''}
Đoán xem sói sẽ cắn ai → bảo vệ người đó. Nghĩ nhiều lớp: sói biết mày sẽ đỡ ai → có thể cắn người khác.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do chọn target"}`;
  }
}

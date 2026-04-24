import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class GuardPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ BẢO VỆ — mỗi đêm chọn 1 người để bảo vệ khỏi sói cắn.
QUY TẮC:
- Không được bảo vệ cùng 1 người 2 đêm liên tiếp
- Mày CÓ THỂ bảo vệ chính mình
- Bảo vệ chỉ chặn sói cắn, KHÔNG chặn thuốc độc Phù Thủy
CHIẾN LƯỢC BẢO VỆ:
- Tiên Tri đã come out → bảo vệ Tiên Tri (sói sẽ cắn). Nhưng sói biết mày sẽ đỡ → có thể cắn người khác → mind game!
- Không ai come out → đoán sói nhắm ai: người đang dẫn dắt dân, người phân tích giỏi, người vừa tố sói đúng
- Đừng predictable — nếu sói đoán được pattern bảo vệ → cắn người khác
- Tự bảo vệ khi: mày bị nghi, hoặc cảm thấy sói biết mày là Bảo Vệ
CHIẾN LƯỢC BAN NGÀY:
- Giấu thân TUYỆT ĐỐI — chơi như dân bình thường
- Come out khi bị đưa lên giàn: "giết tao thì đêm không ai đỡ"
- Nếu Tiên Tri come out → ĐỪNG nói "tao sẽ đỡ Tiên Tri" (lộ role cho sói)`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ BẢO VỆ. Giấu thân, nói chuyện như dân bình thường.
- Tham gia thảo luận tích cực — phân tích, hỏi han, tố nghi phạm
- ĐỪNG lộ role. ĐỪNG nói "tao đỡ ai đêm qua" hay hint gì về bảo vệ.
- Nếu ai come out Tiên Tri → ĐỪNG nói "tao sẽ đỡ" (lộ cho sói)`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là BẢO VỆ bị đưa lên giàn! COME OUT:
- "Tao là Bảo Vệ, giết tao thì đêm không ai đỡ — sói cắn thoải mái!"
- Nếu đã đỡ thành công trước đó → nói ra làm bằng chứng
- Chỉ ra ai đáng nghi hơn mày`;
  }

  guardProtect(player: Player, state: GameState, observations: string[], lastGuardedId: string | null): string {
    const targets = state.players.filter(p => p.alive && p.id !== lastGuardedId);
    const lastGuardedName = lastGuardedId ? state.players.find(p => p.id === lastGuardedId)?.name : null;
    return `${taskContext(observations)}
Chọn 1 người để bảo vệ đêm nay. Mày CÓ THỂ bảo vệ chính mình.
${lastGuardedName ? `KHÔNG được bảo vệ ${lastGuardedName} (đêm trước đã bảo vệ rồi).` : ''}
Suy nghĩ trong reasoning:
- Ai sói sẽ cắn đêm nay? (Tiên Tri come out → cắn Tiên Tri. Nhưng sói biết mày đỡ → có thể cắn người khác)
- Ai đang nguy hiểm? (người vừa tố sói, người dẫn dắt dân)
- Đừng predictable — sói sẽ đoán pattern bảo vệ
- Tự bảo vệ nếu cảm thấy sói biết mày là Bảo Vệ
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"phân tích ai cần bảo vệ + mind game với sói"}`;
  }
}

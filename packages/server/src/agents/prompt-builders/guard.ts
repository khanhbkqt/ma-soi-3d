import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class GuardPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ BẢO VỆ — mỗi đêm chọn 1 người để bảo vệ khỏi sói cắn.
QUY TẮC:
- Không được bảo vệ cùng 1 người 2 đêm liên tiếp
- Mày CÓ THỂ bảo vệ chính mình
- Bảo vệ chỉ chặn sói cắn, KHÔNG chặn thuốc độc Phù Thủy
CHIẾN LƯỢC:
- Giấu thân, chơi như dân bình thường ban ngày
- Ưu tiên bảo vệ: Tiên Tri (nếu đã come out), người quan trọng
- Come out khi bị đưa lên giàn: "giết tao thì đêm không ai đỡ"`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ BẢO VỆ. Giấu thân, nói chuyện như dân bình thường. Đừng lộ role.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là BẢO VỆ bị đưa lên giàn! Cân nhắc come out:
- Come out: "tao là Bảo Vệ, giết tao thì đêm không ai đỡ"
- Không come out: biện hộ bằng logic`;
  }

  guardProtect(player: Player, state: GameState, observations: string[], lastGuardedId: string | null): string {
    const targets = state.players.filter(p => p.alive && p.id !== lastGuardedId);
    const lastGuardedName = lastGuardedId ? state.players.find(p => p.id === lastGuardedId)?.name : null;
    return `${taskContext(observations)}
Chọn 1 người để bảo vệ đêm nay. Mày CÓ THỂ bảo vệ chính mình.
${lastGuardedName ? `KHÔNG được bảo vệ ${lastGuardedName} (đêm trước đã bảo vệ rồi).` : ''}
Ưu tiên: Tiên Tri (nếu đã come out), người bị sói nhắm, hoặc chính mình nếu nguy.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
  }
}

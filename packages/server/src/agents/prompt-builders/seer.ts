import { Player, GameState, Role } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class SeerPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ TIÊN TRI — mắt thần của phe dân.
Mỗi đêm soi 1 người → biết "Sói" hay "Không phải Sói".
CHIẾN LƯỢC:
- Giấu thân sớm, dẫn dắt dân bằng hint nhẹ
- Come out khi: bị đưa lên giàn, hoặc đã soi đủ info chắc chắn
- Come out sớm quá → sói cắn đêm sau. Come out muộn quá → dân chết oan.
- Khi come out: đưa bằng chứng soi được, chỉ đích danh sói`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ TIÊN TRI. Có info từ đêm qua (xem nhật ký).
- Dẫn dắt dân tìm sói nhưng đừng lộ thân sớm quá
- Có thể hint nhẹ hoặc come out nếu nguy cấp`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là TIÊN TRI bị đưa lên giàn! Cân nhắc come out:
- Come out: đưa bằng chứng soi được, chỉ đích danh sói
- Không come out: biện hộ bằng logic, chỉ ra ai đáng nghi hơn`;
  }

  seerInvestigate(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
Chọn 1 người để soi đêm nay. Kết quả sẽ là "Sói" hoặc "Không phải Sói".
Ưu tiên soi người đáng nghi nhất hoặc người chưa rõ phe.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
  }
}

export class ApprenticeSeerPromptBuilder extends SeerPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — đã kế thừa năng lực Tiên Tri!
Tiên Tri gốc đã chết. Mày giờ soi được mỗi đêm: "Sói" hay "Không phải Sói".
CHIẾN LƯỢC:
- Giấu thân, dẫn dắt dân bằng hint nhẹ
- Come out khi cần thiết, đưa bằng chứng soi được
- Sói có thể không biết mày đã kế thừa → lợi thế bất ngờ`;
    }
    return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — chưa có skill, chơi như dân bình thường.
Khi Tiên Tri chết → mày kế thừa năng lực soi.
CHIẾN LƯỢC:
- Chơi như dân: hỏi han, chất vấn, bắt bẻ logic
- Giấu thân, đừng để sói biết mày là TT Tập Sự
- Chờ kế thừa, đừng chết trước Tiên Tri`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `MÀY LÀ TIÊN TRI TẬP SỰ (đã kế thừa). Có info từ đêm qua (xem nhật ký).
- Dẫn dắt dân tìm sói nhưng đừng lộ thân sớm quá
- Sói có thể không biết mày đã kế thừa → lợi thế`;
    }
    return `MÀY LÀ TIÊN TRI TẬP SỰ. Chưa có skill, chơi như dân.
- Hỏi han, chất vấn, bắt bẻ logic
- Giấu thân, đừng để sói biết role mày`;
  }
}

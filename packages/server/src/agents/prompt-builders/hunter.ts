import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class HunterPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ THỢ SĂN — chết thì kéo theo 1 thằng (bắn phát cuối).
QUY TẮC:
- Bị sói cắn hoặc bị treo cổ → được bắn 1 người trước khi chết
- Bị Phù Thủy đầu độc → KHÔNG được bắn (chết im)
CHIẾN LƯỢC BAN NGÀY:
- Chơi tự tin, dám nói dám làm — mày không sợ chết vì chết còn bắn được
- Doạ khi bị nghi: "giết tao thì tao bắn lại, nghĩ kỹ đi" → sói sẽ ngại cắn mày
- Tham gia thảo luận tích cực — phân tích, tố sói, dẫn dắt vote
- Come out Thợ Săn khi bị dồn → sói ngại cắn, dân ngại vote
CHIẾN LƯỢC BẮN:
- Luôn theo dõi ai đáng nghi nhất → nếu chết thì bắn ngay
- Ưu tiên bắn: người mày chắc chắn nhất là sói (dựa trên vote pattern, hành vi, Tiên Tri tố)
- ĐỪNG bắn bừa — bắn nhầm dân = thảm họa cho phe dân`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ THỢ SĂN. Chết thì kéo theo 1 thằng.
- Chơi tự tin, dám nói — mày có "bảo hiểm" khi chết
- Tham gia thảo luận tích cực, phân tích vote/death pattern
- Doạ khi cần: "giết tao thì tao bắn lại"
- Luôn theo dõi ai đáng nghi nhất để sẵn sàng bắn nếu chết`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là THỢ SĂN bị đưa lên giàn! COME OUT + DOẠ:
- "Tao là Thợ Săn — giết tao thì tao bắn thằng [tên] ngay!"
- Chỉ đích danh thằng mày sẽ bắn nếu chết (thằng nghi sói nhất)
- Sói sẽ ngại vote giết mày vì sợ bị bắn → lợi thế`;
  }

  hunterShot(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
MÀY ĐANG CHẾT! Mày là Thợ Săn — được bắn 1 phát cuối.
Suy nghĩ kỹ trong reasoning — bắn nhầm dân = thảm họa:
- Ai mày chắc chắn nhất là sói? Bằng chứng gì? (Tiên Tri tố, vote pattern, hành vi)
- Ai hưởng lợi nhiều nhất khi mày chết?
- Nếu không chắc ai là sói → bắn người bị tố nhiều nhất hoặc người đáng nghi nhất
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"phân tích chi tiết ai là sói + bằng chứng"}`;
  }
}

import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class HunterPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ THỢ SĂN — chết thì kéo theo 1 thằng (bắn phát cuối).
QUY TẮC:
- Bị sói cắn hoặc bị treo cổ → được bắn 1 người trước khi chết
- Bị Phù Thủy đầu độc → KHÔNG được bắn (chết im)
CHIẾN LƯỢC:
- Chơi hung hãn, dám nói dám làm, không sợ chết
- Doạ thẳng khi bị nghi: "giết tao thì tao bắn lại"
- Luôn sẵn sàng bắn thằng nghi sói nhất nếu chết`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ THỢ SĂN. Chết thì kéo theo 1 thằng. Chơi hung hãn, dám nói dám làm.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là THỢ SĂN bị đưa lên giàn! Doạ thẳng:
- "Giết tao thì tao bắn lại, nghĩ kỹ đi"
- Chỉ đích danh thằng mày sẽ bắn nếu chết`;
  }

  hunterShot(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
MÀY ĐANG CHẾT! Mày là Thợ Săn — được bắn 1 phát cuối. Chọn thằng mày nghi sói nhất.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
  }
}

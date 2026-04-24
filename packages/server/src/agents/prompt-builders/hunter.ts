import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class HunterPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ THỢ SĂN — chết thì bắn 1 phát cuối kéo theo 1 người.
Bị sói cắn hoặc treo cổ → được bắn. Bị Phù Thủy đầu độc → chết im, không bắn.
MỤC TIÊU: Sống thì dẫn dắt dân tìm sói. Chết thì bắn đúng sói → swing game.
LỢI THẾ ĐỘC NHẤT: Mày không sợ chết — chết còn bắn được. Dùng lợi thế này:
- Chơi tự tin, dám nói dám tố — sói ngại cắn mày vì sợ bị bắn.
- Doạ khi bị dồn: "giết tao thì tao bắn lại" → sói ngại, dân ngại.
- Luôn theo dõi ai đáng nghi nhất → sẵn sàng bắn nếu chết bất ngờ.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ THỢ SĂN. Chết thì kéo theo 1 thằng — mày có "bảo hiểm".
Chơi tự tin, tham gia tích cực. Luôn theo dõi ai đáng nghi nhất để sẵn sàng bắn.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là THỢ SĂN bị đưa lên giàn! Come out + doạ: "giết tao thì tao bắn thằng [tên nghi nhất] ngay!"
Sói sẽ ngại vote giết mày vì sợ bị bắn.`;
  }

  hunterShot(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
MÀY ĐANG CHẾT! Bắn 1 phát cuối — bắn nhầm dân = thảm họa, bắn đúng sói = swing game.
Ai mày chắc nhất là sói? Dựa trên: Tiên Tri tố, vote pattern, hành vi, ai hưởng lợi khi mày chết.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do bắn"}`;
  }
}

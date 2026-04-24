import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class CupidPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const paired = state.couple ? 'Đã ghép đôi xong.' : 'Chưa ghép đôi (ghép đêm đầu tiên).';
    return `VAI TRÒ: MÀY LÀ THẦN TÌNH YÊU — ghép đôi 2 người, 1 chết thì kia chết theo.
${paired}
QUY TẮC:
- Ghép đôi 1 lần duy nhất (đêm đầu tiên)
- Mày CÓ THỂ ghép chính mình với 1 người khác
- Nếu cặp đôi gồm 1 Sói + 1 Dân → họ thành Phe Cặp Đôi, thắng khi là 2 người cuối
CHIẾN LƯỢC:
- Giấu thân, chơi bình thường
- Bảo vệ cặp đôi mày ghép (đừng để họ bị vote/cắn)
- Nếu ghép mình: bảo vệ người yêu bằng mọi giá`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.couple) {
      const names = [
        state.players.find(p => p.id === state.couple!.player1Id)?.name,
        state.players.find(p => p.id === state.couple!.player2Id)?.name,
      ].filter(Boolean);
      return `MÀY LÀ THẦN TÌNH YÊU. Đã ghép: ${names.join(' ❤️ ')}. Bảo vệ họ, đừng để bị vote.`;
    }
    return `MÀY LÀ THẦN TÌNH YÊU. Giấu thân, chơi bình thường.`;
  }

  cupidPair(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive);
    return `${taskContext(observations)}
MÀY LÀ THẦN TÌNH YÊU. Chọn 2 người để ghép đôi. Nếu 1 chết → người kia chết theo.
Mày CÓ THỂ ghép chính mình ("${player.name}") với 1 người khác.
Nếu cặp đôi gồm 1 Sói + 1 Dân → họ thành Phe Cặp Đôi, thắng khi là 2 người cuối.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"player1":"Tên1","player2":"Tên2","reasoning":"lý do ngắn"}`;
  }
}

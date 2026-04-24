import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class CupidPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const paired = state.couple ? 'Đã ghép đôi xong.' : 'Chưa ghép đôi (ghép đêm đầu tiên).';
    return `VAI TRÒ: MÀY LÀ THẦN TÌNH YÊU — ghép đôi 2 người (đêm đầu), 1 chết thì kia chết theo.
${paired}
Có thể ghép chính mình. Nếu cặp gồm 1 Sói + 1 Dân → thành Phe Cặp Đôi, thắng khi là 2 người cuối.
MỤC TIÊU: Ghép đôi tạo lợi thế lớn nhất → bảo vệ cặp đôi sống sót.
SAU KHI GHÉP: Bảo vệ cặp đôi — bênh họ khi bị tố, redirect sang người khác. Nhưng đừng lộ liễu — sói biết ai là cặp đôi → cắn 1 chết 2.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.couple) {
      const names = [
        state.players.find(p => p.id === state.couple!.player1Id)?.name,
        state.players.find(p => p.id === state.couple!.player2Id)?.name,
      ].filter(Boolean);
      return `MÀY LÀ THẦN TÌNH YÊU. Đã ghép: ${names.join(' ❤️ ')}.
Bảo vệ cặp đôi tinh tế — bênh khi bị tố nhưng đừng lộ pattern. Sói biết = cắn 1 chết 2.`;
    }
    return `MÀY LÀ THẦN TÌNH YÊU. Giấu thân, chơi bình thường.`;
  }

  cupidPair(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive);
    return `${taskContext(observations)}
Chọn 2 người để ghép đôi. 1 chết → người kia chết theo. Có thể ghép chính mình ("${player.name}").
Nếu cặp gồm 1 Sói + 1 Dân → Phe Cặp Đôi, thắng khi là 2 người cuối.
Cân nhắc: ghép mình (kiểm soát được, nhưng rủi ro chết đôi) hay ghép 2 người khác (tự do hơn)?
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"player1":"Tên1","player2":"Tên2","reasoning":"lý do ghép đôi"}`;
  }
}

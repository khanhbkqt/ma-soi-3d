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
CHIẾN LƯỢC GHÉP ĐÔI:
- Ghép mình + 1 người mạnh (Tiên Tri, Bảo Vệ) → bảo vệ nhau, cùng thắng
- Hoặc ghép 2 người khác → mày an toàn hơn nhưng ít kiểm soát
- Cross-team couple (Sói + Dân) = win condition riêng → rủi ro cao nhưng thú vị
SAU KHI GHÉP:
- Bảo vệ cặp đôi bằng mọi giá — đừng để họ bị vote/cắn
- Nếu ghép mình: bảo vệ người yêu, bênh họ trong thảo luận (nhưng đừng lộ liễu)
- Giấu thân — đừng để ai biết mày là Cupid hoặc ai là cặp đôi`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.couple) {
      const names = [
        state.players.find(p => p.id === state.couple!.player1Id)?.name,
        state.players.find(p => p.id === state.couple!.player2Id)?.name,
      ].filter(Boolean);
      return `MÀY LÀ THẦN TÌNH YÊU. Đã ghép: ${names.join(' ❤️ ')}.
- Bảo vệ cặp đôi — bênh họ khi bị tố, redirect sang người khác
- ĐỪNG lộ liễu quá — nếu sói biết ai là cặp đôi → cắn 1 chết 2
- Tham gia thảo luận bình thường, phân tích vote/death pattern`;
    }
    return `MÀY LÀ THẦN TÌNH YÊU. Giấu thân, chơi bình thường. Tham gia thảo luận tích cực.`;
  }

  cupidPair(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive);
    return `${taskContext(observations)}
MÀY LÀ THẦN TÌNH YÊU. Chọn 2 người để ghép đôi. Nếu 1 chết → người kia chết theo.
Mày CÓ THỂ ghép chính mình ("${player.name}") với 1 người khác.
Nếu cặp đôi gồm 1 Sói + 1 Dân → họ thành Phe Cặp Đôi, thắng khi là 2 người cuối.
Suy nghĩ trong reasoning:
- Ghép mình + ai? (an toàn hơn, kiểm soát được) hay ghép 2 người khác? (mày tự do hơn)
- Ghép với người mạnh (Tiên Tri, Bảo Vệ) → cùng bảo vệ nhau
- Cross-team couple rủi ro cao nhưng win condition riêng
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"player1":"Tên1","player2":"Tên2","reasoning":"phân tích chiến thuật ghép đôi"}`;
  }
}

import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class CupidPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    if (player.infected) {
      return `VAI TRÒ: MÀY LÀ THẦN TÌNH YÊU ĐÃ BỊ LÂY NHIỄM (GIÁN ĐIỆP SÓI)!
MỤC TIÊU: Giúp phe Sói thắng.
CHIẾN THUẬT:
- Mày đã ghép đôi xong từ đêm đầu tiên nên giờ chỉ chơi như một dân thường phe Sói.
- Hãy dùng thông tin về cặp đôi (nếu mày biết cặp đôi đó là phe nào) để tạo lợi thế cho Sói.
- Đóng giả dân, dẫn dắt vote sai, bảo vệ đồng bọn Sói.`;
    }
    const paired = state.couple ? 'Đã ghép đôi xong.' : 'Chưa ghép đôi (ghép đêm đầu tiên).';
    return `VAI TRÒ: MÀY LÀ THẦN TÌNH YÊU — ghép đôi 2 người (đêm đầu), 1 chết thì kia chết theo.
${paired}
Có thể ghép chính mình. Nếu cặp gồm 1 Sói + 1 Dân → thành Phe Cặp Đôi, thắng khi là 2 người cuối.
MỤC TIÊU: Ghép đôi tạo lợi thế lớn nhất → bảo vệ cặp đôi sống sót.
TƯ DUY ĐỈNH CAO: Sau khi ghép đôi, tuyệt đối KHÔNG ĐƯỢC BÊNH VỰC CẶP ĐÔI.
Nếu mày cứ lẽo đẽo bảo vệ họ, Sói sẽ nhận ra ngay mày là Cupid và 2 kẻ kia là Cặp Đôi → Sói cắn 1 chết 2 dễ dàng.
Thậm chí hãy chủ động "chửi nhẹ" hoặc nghi ngờ giả vờ 1 trong 2 người để tạo chứng cứ ngoại phạm (Distancing). Mày phải coi họ như người xa lạ.`;
  }

  discussionHint(player: Player, state: GameState): string {
    if (player.infected) {
      return `MÀY LÀ GIÁN ĐIỆP SÓI.
MỤC TIÊU: Phá hoại phe dân từ bên trong.
CHIẾN THUẬT: Đóng giả dân, hùa theo Sói vote chết dân.`;
    }
    if (state.round === 1) {
      if (state.couple) {
        const names = [
          state.players.find((p) => p.id === state.couple!.player1Id)?.name,
          state.players.find((p) => p.id === state.couple!.player2Id)?.name,
        ].filter(Boolean);
        return `MÀY LÀ THẦN TÌNH YÊU. Đã ghép: ${names.join(' ❤️ ')}. Vòng đầu — DISTANCING:
- Nói tự nhiên, ĐỪNG bênh cặp đôi. Thậm chí có thể chọc nhẹ 1 trong 2.
- Tạo ấn tượng mày không liên quan gì đến họ.`;
      }
      return `MÀY LÀ THẦN TÌNH YÊU. Vòng đầu — hòa nhập:
Nói chuyện tự nhiên, thoải mái. Chưa cần chiến thuật gì đặc biệt.`;
    }
    if (state.couple) {
      const names = [
        state.players.find((p) => p.id === state.couple!.player1Id)?.name,
        state.players.find((p) => p.id === state.couple!.player2Id)?.name,
      ].filter(Boolean);
      return `MÀY LÀ THẦN TÌNH YÊU. Đã ghép: ${names.join(' ❤️ ')}.
TƯ DUY CHỐNG BẮT BÀI: Mày phải bơ cặp đôi này đi! Tuyệt đối không bênh vực lộ liễu. Thậm chí có thể nghi ngờ vờ vĩnh họ để Sói không nhận ra mối quan hệ 3 người của tụi mày.`;
    }
    return `MÀY LÀ THẦN TÌNH YÊU. Giấu thân, chơi bình thường.`;
  }

  cupidPair(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter((p) => p.alive);
    return `${taskContext(observations)}

<task>
Chọn 2 người để ghép đôi. 1 chết → người kia chết theo. Có thể ghép chính mình ("${player.name}").
Nếu cặp gồm 1 Sói + 1 Dân → Phe Cặp Đôi, thắng khi là 2 người cuối.
Cân nhắc: ghép mình (kiểm soát được, nhưng rủi ro chết đôi) hay ghép 2 người khác (tự do hơn)?
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","player1":"Tên1","player2":"Tên2"}
</task>`;
  }
}

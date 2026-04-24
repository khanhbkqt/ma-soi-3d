import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class WitchPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `VAI TRÒ: MÀY LÀ PHÙ THỦY — 2 bình thuốc dùng 1 lần: cứu (${heal}) + độc (${kill}).
MỤC TIÊU: Dùng thuốc đúng thời điểm để tạo impact lớn nhất cho phe dân.
THẾ KHÓ CỦA PHÙ THỦY:
- Thuốc cứu: cứu sớm → hết thuốc khi cần. Cứu muộn → người quan trọng chết oan. Tự cân nhắc: target có quan trọng không? Còn bao nhiêu sói? Bảo Vệ có thể đã đỡ rồi?
- Thuốc độc: độc đúng sói = swing game. Độc nhầm dân = thảm họa. Chỉ độc khi có bằng chứng mạnh. Lưu ý: độc Thợ Săn → Thợ Săn chết mà không được bắn.
- Có thể dùng cả 2 thuốc cùng 1 đêm.
BAN NGÀY: Giấu thân, chơi như dân. Come out khi bị đưa lên giàn — "giết tao thì mất thuốc".`;
  }

  discussionHint(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}). Giấu thân, nói như dân.
Theo dõi ai đáng nghi để chuẩn bị dùng thuốc độc. Tham gia thảo luận tự nhiên.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là PHÙ THỦY bị đưa lên giàn! Come out — nói rõ còn thuốc gì để dân thấy giá trị giữ mày sống.
Chỉ ra ai đáng nghi hơn mày + kêu gọi vote người đó.`;
  }

  witchAction(player: Player, state: GameState, observations: string[], killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    const healInfo = killedName && !potions.healUsed
      ? `Sói vừa cắn ${killedName}. Cứu không? Cân nhắc: người này quan trọng cỡ nào? Giữ thuốc cho sau có lợi hơn không? Bảo Vệ có thể đã đỡ rồi.`
      : potions.healUsed ? 'Thuốc cứu đã dùng.' : 'Đêm nay không ai bị cắn.';
    const killInfo = !potions.killUsed
      ? `Đầu độc ai không? Chỉ độc khi có bằng chứng mạnh — độc nhầm dân = thảm họa. Độc Thợ Săn → không được bắn phát cuối.\nDanh sách: ${targets.map(t => t.name).join(', ')}`
      : 'Thuốc độc đã dùng.';
    return `${taskContext(observations)}
${healInfo}
${killInfo}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
Mày KHÔNG biết Bảo Vệ đã bảo vệ ai đêm nay.
JSON: {"heal":true/false,"killTarget":"Tên"|null,"reasoning":"lý do quyết định"}`;
  }
}

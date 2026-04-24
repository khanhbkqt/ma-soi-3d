import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class WitchPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `VAI TRÒ: MÀY LÀ PHÙ THỦY — có 2 bình thuốc dùng 1 lần:
- Thuốc cứu (${heal}): cứu người bị sói cắn đêm nay
- Thuốc độc (${kill}): giết 1 người bất kỳ đêm nay
CHIẾN LƯỢC DÙNG THUỐC:
- THUỐC CỨU: Cứu khi người chết quan trọng (Tiên Tri đã come out, người đang dẫn dắt dân). ĐỪNG cứu vòng 1 trừ khi chắc chắn target quan trọng — giữ thuốc cho lúc cần. Mày KHÔNG biết Bảo Vệ đã đỡ chưa → có thể cứu thừa.
- THUỐC ĐỘC: Chỉ độc khi CHẮC CHẮN >80% là sói (Tiên Tri tố, bị bắt quả tang, vote pattern rõ ràng). Độc nhầm dân = thảm họa. Nếu độc Thợ Săn → Thợ Săn chết mà KHÔNG được bắn phát cuối.
- CÓ THỂ vừa cứu vừa độc cùng 1 đêm (nếu còn cả 2 thuốc).
CHIẾN LƯỢC BAN NGÀY:
- Giấu thân TUYỆT ĐỐI — chơi như dân bình thường
- Come out khi bị đưa lên giàn: "giết tao thì mất thuốc"
- Nếu đã dùng hết thuốc → come out ít giá trị hơn, cân nhắc kỹ`;
  }

  discussionHint(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `MÀY LÀ PHÙ THỦY. Thuốc cứu: ${heal} | Thuốc độc: ${kill}.
- Giấu thân, nói chuyện như dân bình thường. ĐỪNG lộ role.
- Phân tích ai là sói để chuẩn bị dùng thuốc độc đêm nay
- React lại người khác, tham gia thảo luận tích cực — đừng im quá (bị nghi)`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là PHÙ THỦY bị đưa lên giàn! COME OUT:
- "Tao là Phù Thủy, giết tao thì mất thuốc — sói lợi!"
- Nói rõ còn thuốc gì (cứu/độc) để dân thấy giá trị giữ mày sống
- Chỉ ra ai đáng nghi hơn mày + kêu gọi vote người đó`;
  }

  witchAction(player: Player, state: GameState, observations: string[], killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    const healInfo = killedName && !potions.healUsed
      ? `Sói vừa cắn ${killedName}. Cân nhắc cứu: ${killedName} có quan trọng không? (Tiên Tri, người dẫn dắt dân → cứu. Dân thường → giữ thuốc cho sau)`
      : potions.healUsed ? 'Thuốc cứu đã dùng rồi.' : 'Đêm nay không ai bị cắn.';
    const killInfo = !potions.killUsed
      ? `Muốn đầu độc ai không? CHỈ ĐỘC KHI CHẮC CHẮN >80% là sói. Độc nhầm dân = thảm họa.\nLƯU Ý: Nếu đầu độc Thợ Săn → Thợ Săn chết mà KHÔNG được bắn phát cuối.\nDanh sách: ${targets.map(t => t.name).join(', ')}`
      : 'Thuốc độc đã dùng rồi.';
    return `${taskContext(observations)}
${healInfo}
${killInfo}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
Mày KHÔNG biết Bảo Vệ đã bảo vệ ai đêm nay.
Suy nghĩ trong reasoning: cứu/không cứu tại sao? Độc ai tại sao? Bằng chứng gì?
JSON: {"heal":true/false,"killTarget":"Tên"|null,"reasoning":"phân tích chi tiết quyết định"}`;
  }
}

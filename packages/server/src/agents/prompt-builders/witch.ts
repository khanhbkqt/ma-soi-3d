import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class WitchPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `VAI TRÒ: MÀY LÀ PHÙ THỦY — có 2 bình thuốc dùng 1 lần:
- Thuốc cứu (${heal}): cứu người bị sói cắn đêm nay
- Thuốc độc (${kill}): giết 1 người bất kỳ đêm nay
CHIẾN LƯỢC:
- Giấu thân, chơi như dân bình thường ban ngày
- Thuốc cứu: dùng sớm nếu người chết quan trọng (Tiên Tri, Bảo Vệ)
- Thuốc độc: dùng khi chắc chắn ai là sói
- Mày KHÔNG biết Bảo Vệ đã bảo vệ ai → có thể cứu thừa
- Nếu đầu độc Thợ Săn → Thợ Săn chết mà KHÔNG được bắn phát cuối
- Come out khi bị đưa lên giàn: "giết tao thì mất thuốc"`;
  }

  discussionHint(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `MÀY LÀ PHÙ THỦY. Thuốc cứu: ${heal} | Thuốc độc: ${kill}.
Giấu thân, phân tích bình thường như dân. Đừng lộ role.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là PHÙ THỦY bị đưa lên giàn! Cân nhắc come out:
- Come out: "tao là Phù Thủy, giết tao thì mất thuốc"
- Không come out: biện hộ bằng logic, đừng lộ role`;
  }

  witchAction(player: Player, state: GameState, observations: string[], killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    const healInfo = killedName && !potions.healUsed
      ? `Sói vừa cắn ${killedName}. Muốn dùng thuốc cứu không?`
      : potions.healUsed ? 'Thuốc cứu đã dùng rồi.' : 'Đêm nay không ai bị cắn.';
    const killInfo = !potions.killUsed
      ? `Muốn đầu độc ai không? Danh sách: ${targets.map(t => t.name).join(', ')}\nLƯU Ý: Nếu đầu độc Thợ Săn → Thợ Săn chết mà KHÔNG được bắn phát cuối.`
      : 'Thuốc độc đã dùng rồi.';
    return `${taskContext(observations)}
${healInfo}
${killInfo}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
Mày KHÔNG biết Bảo Vệ đã bảo vệ ai đêm nay.
JSON: {"heal":true/false,"killTarget":"Tên"|null,"reasoning":"lý do ngắn"}`;
  }
}

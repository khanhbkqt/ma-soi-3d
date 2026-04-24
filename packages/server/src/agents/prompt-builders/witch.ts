import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class WitchPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `VAI TRÒ: MÀY LÀ PHÙ THỦY — 2 bình thuốc dùng 1 lần: cứu (${heal}) + độc (${kill}).
MỤC TIÊU: Dùng thuốc đúng thời điểm để tạo impact lớn nhất cho phe dân.
CHIẾN THUẬT ĐỈNH CAO (TƯ DUY):
- Độc Quyền Thông Tin: Mày là người duy nhất biết Sói cắn ai. Người bị cắn GẦN NHƯ CHẮC CHẮN LÀ NGƯỜI TỐT. Dù mày có cứu hay không, phải ghi nhớ thông tin này để làm kim chỉ nam phân tích. (CẢNH GIÁC: Có 10% khả năng Sói tự cắn đồng bọn đêm 1 để lừa mày cứu và "tẩy trắng". Hãy giữ 1 chút nghi ngờ).
- Thuốc Cứu: Đừng quá tham giữ thuốc. Đa số trường hợp CỨU NGAY ĐÊM 1 HOẶC 2 LÀ TỐI ƯU vì nó giữ lại mạng (vote cho dân) và tạo ra 1 đồng minh "sạch". Giữ thuốc muộn dễ khiến người quan trọng chết oan. (Lưu ý: Bảo Vệ cũng có thể đỡ, nhưng cứu vẫn an toàn nhất).
- Thuốc Độc: Vũ khí nguy hiểm nhất. Độc nhầm dân = thảm họa (độc Thợ Săn → Thợ Săn mất quyền bắn). Chỉ ném độc khi có LOGIC CHẮC CHẮN (VD: bắt được Tiên Tri giả, kẻ vote bầy đàn cứu Sói ban ngày).
- Có thể dùng cả 2 thuốc cùng 1 đêm.
BAN NGÀY: Giấu thân, chơi như dân. Come out khi bị dồn lên giàn, hoặc khi đã dùng hết 2 bình (lúc đó nhận Phù Thủy để dùng thông tin dẫn dắt Làng).`;
  }

  discussionHint(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}).
CHIẾN THUẬT BAN NGÀY:
1. Giấu vai trò, nói chuyện tự nhiên như một người Dân.
2. TƯ DUY PHẢN BẮT BÀI: Mày biết "ai từng bị Sói cắn" nhưng KHÔNG ĐƯỢC BÊNH VỰC HỌ QUÁ LỘ LIỄU. Sói biết đêm qua chúng cắn ai, nếu mày bênh vực ra mặt, Sói sẽ đánh hơi ra mày là Phù Thủy! Hãy chỉ dùng thông tin đó trong đầu để ngầm quan sát kẻ nào cố tình dồn ép họ nhằm tìm ra Sói.
3. Không claim Phù Thủy trừ khi bị đưa lên bàn phán xét, hoặc khi mày đã hết sạch cả 2 bình thuốc và muốn đứng ra làm Leader dẫn dắt Làng bằng thông tin của mình.`;
  }

  defenseHint(_player: Player, state: GameState): string {
    const potionsLeft = (!state.witchPotions.healUsed || !state.witchPotions.killUsed);
    return `Mày là PHÙ THỦY bị đưa lên giàn phán xét!
- Nếu CÒN THUỐC: COME OUT ngay lập tức! Báo cho Làng biết mày còn thuốc để họ thấy giá trị. Có thể đe dọa "ai vote treo tao, đêm nay tao ném độc".
- Nếu HẾT THUỐC: Vẫn COME OUT và khai báo toàn bộ thông tin (đêm nào cứu ai, độc ai) để Làng biết mày là người tốt đã cống hiến xong và để lại "di sản thông tin".
Chỉ ra kẻ đáng nghi nhất và kêu gọi vote người đó.`;
  }

  witchAction(player: Player, state: GameState, observations: string[], killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    const healInfo = killedName && !potions.healUsed
      ? `Sói vừa cắn ${killedName}. Cứu không? TƯ DUY ĐỈNH CAO: Nếu đây là đêm 1 hoặc 2, ƯU TIÊN CỨU để bảo toàn số phiếu cho Làng. Nhớ rằng: người này 90% là tốt, nhưng vẫn có 10% Sói tự cắn đồng bọn để lừa mày "tẩy trắng" cho chúng. Đừng quá tham giữ thuốc trừ khi có lý do đặc biệt.`
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

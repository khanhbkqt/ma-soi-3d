import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext, hasFool } from './base.js';

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
BAN NGÀY: Giấu thân, chơi như dân.
⚠ COME OUT KHI CÒN THUỐC = TỰ SÁT: Sói biết mày là Phù Thủy → cắn mày đêm sau → mất cả cứu lẫn độc. Chỉ come out khi ĐÃ DÙNG HẾT cả 2 bình thuốc (lúc đó nhận Phù Thủy để dùng thông tin dẫn dắt Làng).`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.round === 1) {
      const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
      const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
      return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}). Vòng đầu — giấu thân:
- Nói chuyện tự nhiên như dân thường. ĐỪNG bênh vực hay chú ý đặc biệt đến người bị sói cắn (nếu cứu).
- Vòng đầu chưa cần tố ai mạnh. Hỏi han, react, tán gẫu thoải mái.
- Giữ kín mọi info từ đêm qua.`;
    }
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}).
CHIẾN THUẬT BAN NGÀY:
1. Giấu vai trò, nói chuyện tự nhiên như một người Dân.
2. TƯ DUY PHẢN BẮT BÀI: Mày biết "ai từng bị Sói cắn" nhưng KHÔNG ĐƯỢC BÊNH VỰC HỌ QUÁ LỘ LIỄU. Sói biết đêm qua chúng cắn ai, nếu mày bênh vực ra mặt, Sói sẽ đánh hơi ra mày là Phù Thủy! Hãy chỉ dùng thông tin đó trong đầu để ngầm quan sát kẻ nào cố tình dồn ép họ nhằm tìm ra Sói.
3. Không claim Phù Thủy trừ khi bị đưa lên bàn phán xét, hoặc khi mày đã hết sạch cả 2 bình thuốc và muốn đứng ra làm Leader dẫn dắt Làng bằng thông tin của mình.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là PHÙ THỦY bị đưa lên giàn! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
⚠ Come out khi CÒN THUỐC = TỰ SÁT. Sói biết mày → cắn đêm sau → mất thuốc còn lại = thảm họa.
ĐỪNG come out khi:
- Còn thuốc (cứu hoặc độc hoặc cả hai) VÀ game chưa endgame → biện hộ như Dân thường. Thà chết trên giàn không lộ role còn hơn come out rồi sói cắn đêm sau.
NÊN come out khi:
- ĐÃ DÙNG HẾT cả 2 bình thuốc → come out an toàn, mày không còn skill, sói cắn mày cũng chẳng mất gì. Khai báo toàn bộ thông tin (đêm nào cứu ai, độc ai, ai bị sói cắn) để lại "di sản thông tin" cho Làng.
- Game đã endgame (rất ít người sống) VÀ còn thuốc → come out để Làng biết giá trị, doạ: "Ai vote treo tao, đêm nay tao ném độc."
Nếu KHÔNG come out: Biện hộ bằng logic, vote pattern, chỉ ra kẻ đáng nghi hơn. Nói mơ hồ: "Giết tao là sai lầm" — đừng nói cụ thể role.
Nếu COME OUT: Dump toàn bộ info. Chỉ ra kẻ đáng nghi nhất.`;
  }

  witchAction(
    player: Player,
    state: GameState,
    observations: string[],
    killedName: string | null,
    potions: { healUsed: boolean; killUsed: boolean },
  ): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    const healInfo =
      killedName && !potions.healUsed
        ? `Sói vừa cắn ${killedName}. Cứu không? TƯ DUY ĐỈNH CAO: Nếu đây là đêm 1 hoặc 2, ƯU TIÊN CỨU để bảo toàn số phiếu cho Làng. Nhớ rằng: người này 90% là tốt, nhưng vẫn có 10% Sói tự cắn đồng bọn để lừa mày "tẩy trắng" cho chúng. Đừng quá tham giữ thuốc trừ khi có lý do đặc biệt.`
        : potions.healUsed
          ? 'Thuốc cứu đã dùng.'
          : 'Đêm nay không ai bị cắn.';
    const killInfo = !potions.killUsed
      ? `Đầu độc ai không? ⚠ ĐỪNG ĐỘC VÌ "NHIỀU NGƯỜI TỐ" — đám đông tố = bằng chứng KHÔNG CÓ GIÁ TRỊ. Sói hay dẫn dắt đám đông frame dân.\nCHỈ ĐỘC KHI CÓ BẰNG CHỨNG CỨNG HOẶC TRUNG BÌNH:\n- CỨNG: Soi ra sói (nếu mày biết kết quả TT), role đã xác nhận.\n- TRUNG BÌNH: Vote pattern rõ ràng match với sói đã lộ, claim role bị conflict.\n- TUYỆT ĐỐI KHÔNG đủ: "nhiều người tố", "linh cảm", "nó im lặng".\nĐộc nhầm dân = thảm họa. Độc Thợ Săn → không được bắn phát cuối.${hasFool(state) ? '\n⚠ CẢNH BÁO: Game có Kẻ Ngốc — kẻ chơi bẩn/xạo/claim sai chưa chắc là Sói, có thể là Ngốc đang câu treo.' : ''} KHÔNG độc người đã lộ role phe dân (xem PHÂN TÍCH ROLE mục Xác nhận). Chỉ độc khi có BẰNG CHỨNG CỨNG là Sói.
Danh sách: ${targets.map((t) => t.name).join(', ')}`
      : 'Thuốc độc đã dùng.';
    return `${taskContext(observations)}
${healInfo}
${killInfo}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
Mày KHÔNG biết Bảo Vệ đã bảo vệ ai đêm nay.
JSON: {"heal":true/false,"killTarget":"Tên"|null}`;
  }
}

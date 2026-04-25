import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class GuardPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, _state: GameState): string {
    if (player.infected) {
      return `VAI TRÒ: MÀY LÀ BẢO VỆ BỊ LÂY NHIỄM — gián điệp sói mang khiên!
MÀY VẪN BẢO VỆ ĐƯỢC mỗi đêm. Nhưng giờ mày DÙNG KHIÊN CHO SÓI:
CHIẾN THUẬT GIÁN ĐIỆP BẢO VỆ:
- BẢO VỆ ĐỒNG ĐỘI SÓI: Đặc biệt sói đang bị nghi ngờ hoặc Sói Đầu Đàn (nếu chưa dùng Lây Nhiễm).
- TẠO HỖN LOẠN: Bảo vệ sói → sói "tự cắn" đồng đội → không ai chết → dân hoang mang "ai bị Bảo Vệ đỡ?". Hoặc sói cắn dân khác trong khi mày đỡ sói bị nghi → sói sống + dân chết.
- KHÔNG BẢO VỆ DÂN QUAN TRỌNG: Để Tiên Tri, Phù Thủy không được đỡ → sói cắn thoải mái.
- GIẤU THÂN: Chơi như Bảo Vệ thường nhưng luôn ưu tiên đỡ phe Sói.
BAN NGÀY: Chơi như dân, giấu kỹ infected status.`;
    }
    return `VAI TRÒ: MÀY LÀ BẢO VỆ — mỗi đêm chọn 1 người bảo vệ khỏi sói cắn.
Ràng buộc: không bảo vệ cùng 1 người 2 đêm liên tiếp. Có thể bảo vệ chính mình. Chỉ chặn sói, không chặn thuốc độc.
MỤC TIÊU: Đoán đúng target sói → chặn kill → phe dân lợi lớn.
THẾ KHÓ VÀ TƯ DUY ĐỈNH CAO (MIND GAME):
- Lỗi đếm nhịp (Rhythm Trap): Đa số Bảo Vệ có thói quen tự đỡ bản thân Đêm 1. Nghĩa là Đêm 2 không thể tự đỡ. Sói khôn sẽ đoán được điều này và nhắm cắn mày Đêm 2. Tốt nhất Đêm 1 hãy đỡ người khác, để dành quyền tự đỡ cho đêm nguy hiểm hơn.
- Tiên Tri come out: Sói biết mày sẽ đỡ Tiên Tri. Chúng có thể cắn Tiên Tri, hoặc cắn người khác. Đôi khi mày có thể "bỏ rơi" Tiên Tri 1 đêm nếu đoán Sói sẽ cắn chéo.
- Bảo vệ ngầm: Nhìn xem ban ngày ai đang ép Sói mạnh nhất, hoặc ai có vẻ là vai trò quan trọng đang giấu mình, kẻ đó dễ bị cắn đêm nay.
BAN NGÀY: Giấu thân TUYỆT ĐỐI, chơi như dân.
⚠ COME OUT = TỰ SÁT: Nếu mày lộ role Bảo Vệ, sói cắn mày ngay đêm sau → không ai đỡ nữa → phe dân thua. ĐỪNG BAO GIỜ come out trừ khi game chỉ còn 4-5 người.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.round === 1) {
      return `MÀY LÀ BẢO VỆ. Vòng đầu — sau đêm bảo vệ đầu tiên:
- Đêm qua mày đã đỡ ai rồi. Ghi nhớ kết quả: người đó sống hay chết? Đêm có yên bình không?
- Nói như dân thường. ĐỪNG hint gì về bảo vệ hay khiên.
- React lại cái chết/sự kiện đêm qua tự nhiên. Tán gẫu, hỏi han.
- Quan sát ai đang nổi, ai đang im — info này giúp mày chọn target bảo vệ đêm sau.`;
    }
    return `MÀY LÀ BẢO VỆ. Giấu thân, nói như dân. Tham gia thảo luận tự nhiên.
Đừng hint gì về bảo vệ. Nếu ai come out Tiên Tri → đừng nói "tao sẽ đỡ" (lộ cho sói).`;
  }

  defenseHint(_player: Player, state: GameState): string {
    const alive = state.players.filter((p) => p.alive).length;
    const isLateGame = alive <= 6;

    if (isLateGame) {
      return `Mày là BẢO VỆ bị đưa lên giàn! ENDGAME — CÂN NHẮC COME OUT:
Chỉ còn ${alive} người sống. Chết = mất khiên VĨNH VIỄN → sói cắn thoải mái.
KHI NÀO NÊN COME OUT:
1. Phiếu đang sát (sắp bị treo) → come out + nói thành tích: "Đêm X tao đỡ Y, Y sống sót" → bằng chứng mày thật.
2. Đã đỡ thành công trước đó → dùng làm bằng chứng cứng: "Đêm qua không ai chết vì tao đỡ đúng."
3. Mỗi mạng = mỗi phiếu vote → giữ mày sống = lợi cho làng.
NẾU COME OUT: Khai timeline đỡ ai đêm nào. Chỉ ra kẻ đáng nghi hơn mày.
NẾU KHÔNG COME OUT: Biện hộ bằng logic, vote pattern, chỉ ra kẻ đáng nghi hơn.`;
    }

    return `Mày là BẢO VỆ bị đưa lên giàn! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
⚠ Come out Bảo Vệ = RỦI RO CAO. Sói biết mày → cắn đêm sau → mất khiên VĨNH VIỄN → phe dân thua dần.
MẶC ĐỊNH: KHÔNG COME OUT. Biện hộ như Dân thường:
- Dùng vote pattern, chỉ ra kẻ đáng nghi hơn mày, phân tích ai hưởng lợi khi mày chết.
- Nếu đã đỡ thành công trước đó, có thể hint nhẹ: "Hôm qua có đứa sống sót là nhờ tao đấy" — nhưng ĐỪNG nói "tao là Bảo Vệ".
- Thà chết trên giàn không lộ role còn hơn come out rồi sói cắn đêm sau.
NGOẠI LỆ COME OUT:
- Game đã endgame (≤6 người sống) → come out + khai timeline đỡ. Mỗi mạng = mỗi phiếu.
- Đã đỡ thành công → dùng làm bằng chứng: "Đêm X tao đỡ Y, Y sống."`;
  }

  guardProtect(
    player: Player,
    state: GameState,
    observations: string[],
    lastGuardedId: string | null,
  ): string {
    const targets = state.players.filter((p) => p.alive && p.id !== lastGuardedId);
    const lastGuardedName = lastGuardedId
      ? state.players.find((p) => p.id === lastGuardedId)?.name
      : null;

    // W4: Extract death history for wolf targeting pattern analysis
    const deathHistory = this.extractDeathHistory(observations);
    const deathBlock = deathHistory.length
      ? `\nLỊCH SỬ CẮN CỦA SÓI (pattern gì?):\n${deathHistory.map((d) => `- ${d}`).join('\n')}\n`
      : '';

    return `${taskContext(observations)}

<task>
Chọn 1 người để bảo vệ đêm nay (có thể bảo vệ chính mình).
${lastGuardedName ? `Không được bảo vệ ${lastGuardedName} (đêm trước đã bảo vệ).` : ''}
${deathBlock}
PHÂN TÍCH PATTERN CẮN CỦA SÓI — framework đoán target:
1. Đêm trước sói cắn ai? Pattern gì? (cắn người tố sói? cắn role lộ? cắn người random?)
2. Ai đang TỐ SÓI MẠNH NHẤT ban ngày hôm nay? → Sói thường cắn để bịt miệng → ĐỠ NGƯỜI NÀY.
3. Có ai come out role không? (Tiên Tri, Phù Thủy) → Sói ưu tiên cắn role quan trọng.
4. MIND GAME: Sói BIẾT mày sẽ đỡ người nổi nhất → có thể cắn chéo (người ít ai ngờ). Đôi khi "bỏ rơi" target hiển nhiên 1 đêm là nước cao tay.
5. Nếu mày vừa đỡ A đêm trước → sói có thể cắn A LẠI (vì mày không đỡ cùng người 2 đêm). Cân nhắc đỡ người khác có nguy cơ tương đương.
6. Nếu đêm trước không ai chết (mày đỡ đúng hoặc Phù Thủy cứu) → sói sẽ THAY ĐỔI target. Đoán người mới.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target":"Tên"}
</task>`;
  }

  /**
   * W4: Extract death history from observations for wolf targeting pattern analysis.
   * Returns lines like: "Đêm 1: Hoa bị cắn (cứu). Đêm 2: Hùng bị cắn (chặn). Đêm 3: Hùng bị cắn (chết)."
   */
  private extractDeathHistory(observations: string[]): string[] {
    const lines: string[] = [];
    let currentRound = 0;

    for (const obs of observations) {
      const roundMatch = obs.match(/^--- Vòng (\d+)/);
      if (roundMatch) {
        currentRound = parseInt(roundMatch[1]);
        continue;
      }

      // Night deaths: "X đã chết (bị sói cắn). Vai: Y."
      const deathMatch = obs.match(/^(.+?) đã chết \(bị sói cắn\)/);
      if (deathMatch) {
        lines.push(`Đ${currentRound}: ${deathMatch[1]} bị cắn → chết`);
        continue;
      }

      // Peaceful night: no deaths
      if (obs.includes('Đêm qua không ai chết') && currentRound > 0) {
        lines.push(`Đ${currentRound}: không ai chết (đỡ đúng hoặc cứu)`);
        continue;
      }

      // Guard protect success (own observation)
      const guardMatch = obs.match(/^Mày đã bảo vệ (.+?) đêm nay/);
      if (guardMatch) {
        lines.push(`Đ${currentRound}: mày đỡ ${guardMatch[1]}`);
      }
    }

    return lines;
  }
}

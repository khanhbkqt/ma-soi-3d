import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class GuardPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
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
      return `MÀY LÀ BẢO VỆ. Vòng đầu — hòa nhập:
- Nói như dân thường. Đừng hint gì về bảo vệ hay khiên.
- Tán gẫu, react lại lời người khác, hỏi han tự nhiên.
- Quan sát ai đang nổi, ai đang im — info này giúp mày chọn target bảo vệ đêm sau.`;
    }
    return `MÀY LÀ BẢO VỆ. Giấu thân, nói như dân. Tham gia thảo luận tự nhiên.
Đừng hint gì về bảo vệ. Nếu ai come out Tiên Tri → đừng nói "tao sẽ đỡ" (lộ cho sói).`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là BẢO VỆ bị đưa lên giàn! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
⚠ Come out Bảo Vệ = TỰ SÁT. Sói biết mày → cắn đêm sau → mất khiên VĨNH VIỄN → phe dân thua dần.
MẶC ĐỊNH: KHÔNG COME OUT. Biện hộ như Dân thường:
- Dùng vote pattern, chỉ ra kẻ đáng nghi hơn mày, phân tích ai hưởng lợi khi mày chết.
- Nếu cần doạ, nói mơ hồ: "Giết tao là sai lầm, tao có giá trị cho làng" — ĐỪNG nói cụ thể role.
- Thà chết trên giàn như Dân còn hơn come out rồi sói cắn đêm sau.
- Nếu đã đỡ thành công trước đó, có thể hint nhẹ: "Hôm qua có đứa sống sót là nhờ tao đấy" — nhưng ĐỪNG nói "tao là Bảo Vệ".
NGOẠI LỆ DUY NHẤT: Game đã endgame (chỉ còn rất ít người sống), come out có thể chấp nhận được vì info quan trọng hơn survival.`;
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
    return `${taskContext(observations)}
Chọn 1 người để bảo vệ đêm nay (có thể bảo vệ chính mình).
${lastGuardedName ? `Không được bảo vệ ${lastGuardedName} (đêm trước đã bảo vệ).` : ''}
Đoán xem sói sẽ cắn ai → bảo vệ người đó. 
TƯ DUY MIND-GAME: Đừng rơi vào thói quen "Tự đỡ mình Đêm 1". Sói biết Đêm 2 mày không thể tự đỡ và sẽ cắn mày. Cân nhắc đỡ người khác Đêm 1. Nếu Tiên Tri đã lộ, Sói có thể cắn người khác vì nghĩ mày sẽ đỡ Tiên Tri. Hãy đoán target thật sự của Sói.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"target":"Tên"}`;
  }
}

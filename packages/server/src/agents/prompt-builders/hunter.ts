import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class HunterPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, _state: GameState): string {
    if (player.infected) {
      return `VAI TRÒ: MÀY LÀ THỢ SĂN ĐÃ BỊ LÂY NHIỄM (GIÁN ĐIỆP SÓI)!
MỤC TIÊU: Giúp phe Sói thắng. Nếu chết, mày vẫn được bắn 1 phát (trừ khi bị Phù Thủy độc).
CHIẾN THUẬT:
- Nếu mày chết, HÃY BẮN CHẾT MỘT DÂN LÀNG! Ưu tiên bắn Tiên Tri, Phù Thủy, Bảo Vệ hoặc người được dân tin tưởng nhất.
- TUYỆT ĐỐI KHÔNG bắn đồng bọn Sói. (Xem danh sách đồng bọn trong event_log).
- Ban ngày: Đóng giả dân, dẫn dắt vote sai, bảo vệ đồng bọn.`;
    }
    return `VAI TRÒ: MÀY LÀ THỢ SĂN — chết thì bắn 1 phát cuối kéo theo 1 người.
Bị sói cắn hoặc treo cổ → được bắn. Bị Phù Thủy đầu độc → chết im, không bắn.
MỤC TIÊU: Sống thì dẫn dắt dân tìm sói. Chết thì bắn đúng sói → swing game.
LỢI THẾ ĐỘC NHẤT: Mày không sợ chết — chết còn bắn được.
TƯ DUY ĐỈNH CAO: Nếu Sói sợ không dám cắn mày, mày sẽ VÔ DỤNG. Đừng quá hổ báo để Sói né!
- Chiến thuật mồi chài (Baiting): Ban ngày hãy tỏ ra nguy hiểm ngầm (giống Tiên Tri hoặc Phù Thủy đang giấu bài). Mục đích là LỪA SÓI CẮN MÀY vào ban đêm. Khi đó mày chết nhưng kéo theo 1 con Sói → 1 đổi 1 phe Dân cực hời.
- Tránh bị dồn lên giàn: Nếu mày hổ báo sai, Làng sẽ vote treo cổ hoặc Phù Thủy ném độc (bị độc = không được bắn). Hãy chơi khôn ngoan.
- Doạ khi thực sự nguy kịch: Chỉ doạ "giết tao thì tao bắn lại" khi chắc chắn bị Làng dồn lên giàn.`;
  }

  discussionHint(player: Player, state: GameState): string {
    if (player.infected) {
      return `MÀY LÀ GIÁN ĐIỆP SÓI.
MỤC TIÊU: Dùng quyền lực ẩn của Thợ Săn để bảo vệ Sói.
CHIẾN THUẬT: Đóng giả dân, hùa theo Sói vote chết dân. Đừng cắn bậy cắn bạ để bị treo cổ phí mạng.`;
    }
    if (state.round === 1) {
      return `MÀY LÀ THỢ SĂN. Vòng đầu — câu nhử:
- Nói tự nhiên nhưng tạo vẻ hơi "bí ẩn" — để sói tò mò, có thể cắn mày (mày chết thì bắn 1 thằng).
- Đừng hổ báo quá (dân vote mày), cũng đừng quá hiền (sói bỏ qua mày).
- Quan sát ai đang nổi — ghim mục tiêu bắn trong đầu.`;
    }
    return `MÀY LÀ THỢ SĂN. Chết thì kéo theo 1 thằng.
CHIẾN THUẬT: Đừng quá hung hăng lộ liễu khiến Sói né không cắn. Hãy "câu nhử" bằng cách tỏ ra nguy hiểm ngầm — phân tích sắc bén, dẫn dắt làng như một người có info để Sói nghĩ mày là Tiên Tri hoặc Phù Thủy.
⚠ KHÔNG fake claim cụ thể ("tao là Tiên Tri", "tao là Phù Thủy") — gây rối loạn info cho phe dân! Chỉ cần TỎ RA nguy hiểm, không cần NÓI mày là ai.
Theo dõi kỹ ai là Sói để ghim mục tiêu bắn.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là THỢ SĂN bị đưa lên giàn! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
Come out Thợ Săn có lợi (doạ bắn) NHƯNG có rủi ro lớn:
- Nếu game còn Phù Thủy (còn thuốc độc): Sói biết mày là Thợ Săn → nhờ Phù Thủy độc mày thay vì cắn → mày chết IM, không bắn được! Bị đầu độc = vô dụng.
- Nếu come out rồi được tha → sói hoàn toàn né cắn mày → mày trở nên vô dụng (mục tiêu của Thợ Săn là bị cắn để bắn trả!).
- Endgame (ít người sống): Come out + doạ bắn có thể hiệu quả vì mỗi phiếu vote quyết định.
PHƯƠNG ÁN AN TOÀN: Biện hộ bằng logic như Dân. Nói mơ hồ: "Giết tao sẽ hối hận" — đừng nói thẳng "tao là Thợ Săn".
Nếu BẮT BUỘC phải come out (đang thua gấp, cần doạ): Come out + chỉ đích danh mục tiêu bắn.
Chỉ ra kẻ đáng nghi nhất và kêu gọi vote người đó.`;
  }

  hunterShot(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    if (player.infected) {
      return `${taskContext(observations)}

<task>
MÀY LÀ THỢ SĂN GIÁN ĐIỆP SÓI! Mày đang chết. Bắn 1 phát cuối để GIÚP PHE SÓI!
TUYỆT ĐỐI KHÔNG bắn trúng đồng bọn Sói! Xem lại <event_log> để biết ai là đồng bọn Sói.
Ưu tiên bắn Tiên Tri, Phù Thủy, Bảo Vệ hoặc một Dân Làng có ảnh hưởng lớn.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target":"Tên"}
</task>`;
    }
    return `${taskContext(observations)}

<task>
MÀY ĐANG CHẾT! Bắn 1 phát cuối — bắn nhầm dân = thảm họa, bắn đúng sói = swing game.
LUẬT SẮT: TUYỆT ĐỐI KHÔNG bắn người đã được xác nhận là phe dân (Tiên Tri soi sạch, role đã lộ là dân). Xem <event_log> để biết ai đã xác nhận.
Ai mày chắc nhất là sói? Dựa trên: Tiên Tri tố, vote pattern, hành vi, ai hưởng lợi khi mày chết.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target":"Tên"}
</task>`;
  }
}

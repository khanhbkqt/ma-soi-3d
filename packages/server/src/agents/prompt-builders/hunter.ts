import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class HunterPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ THỢ SĂN — chết thì bắn 1 phát cuối kéo theo 1 người.
Bị sói cắn hoặc treo cổ → được bắn. Bị Phù Thủy đầu độc → chết im, không bắn.
MỤC TIÊU: Sống thì dẫn dắt dân tìm sói. Chết thì bắn đúng sói → swing game.
LỢI THẾ ĐỘC NHẤT: Mày không sợ chết — chết còn bắn được.
TƯ DUY ĐỈNH CAO: Nếu Sói sợ không dám cắn mày, mày sẽ VÔ DỤNG. Đừng quá hổ báo để Sói né!
- Chiến thuật mồi chài (Baiting): Ban ngày hãy tỏ ra nguy hiểm ngầm (giống Tiên Tri hoặc Phù Thủy đang giấu bài). Mục đích là LỪA SÓI CẮN MÀY vào ban đêm. Khi đó mày chết nhưng kéo theo 1 con Sói → 1 đổi 1 phe Dân cực hời.
- Tránh bị dồn lên giàn: Nếu mày hổ báo sai, Làng sẽ vote treo cổ hoặc Phù Thủy ném độc (bị độc = không được bắn). Hãy chơi khôn ngoan.
- Doạ khi thực sự nguy kịch: Chỉ doạ "giết tao thì tao bắn lại" khi chắc chắn bị Làng dồn lên giàn.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.round === 1) {
      return `MÀY LÀ THỢ SĂN. Vòng đầu — câu nhử:
- Nói tự nhiên nhưng tạo vẻ hơi "bí ẩn" — để sói tò mò, có thể cắn mày (mày chết thì bắn 1 thằng).
- Đừng hổ báo quá (dân vote mày), cũng đừng quá hiền (sói bỏ qua mày).
- Quan sát ai đang nổi — ghim mục tiêu bắn trong đầu.`;
    }
    return `MÀY LÀ THỢ SĂN. Chết thì kéo theo 1 thằng.
CHIẾN THUẬT: Đừng quá hung hăng lộ liễu khiến Sói né không cắn. Hãy "câu nhử" bằng cách tỏ ra nguy hiểm ngầm, đóng giả Tiên Tri hoặc Phù Thủy để Sói cắn nhầm mày vào ban đêm. Theo dõi kỹ ai là Sói để ghim mục tiêu.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là THỢ SĂN bị đưa lên giàn! Come out + doạ: "Tao là Thợ Săn. Nếu Làng vote treo tao, tao thề sẽ bắn thằng [tên nghi nhất] ngay lập tức!"
Chỉ ra mục tiêu bắn của mày để Làng hoặc Sói phải chùn bước.`;
  }

  hunterShot(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
MÀY ĐANG CHẾT! Bắn 1 phát cuối — bắn nhầm dân = thảm họa, bắn đúng sói = swing game.
LUẬT SẮT: TUYỆT ĐỐI KHÔNG bắn người đã được xác nhận là phe dân (Tiên Tri soi sạch, role đã lộ là dân). Xem PHÂN TÍCH ROLE để biết ai đã xác nhận.
Ai mày chắc nhất là sói? Dựa trên: Tiên Tri tố, vote pattern, hành vi, ai hưởng lợi khi mày chết.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do bắn"}`;
  }
}

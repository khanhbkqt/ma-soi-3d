import { Player, GameState } from '@ma-soi/shared';
import { BasePromptBuilder } from './base.js';

export class VillagerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ DÂN LÀNG — không có skill phép thuật, bộ não phân tích là vũ khí duy nhất.
MỤC TIÊU: Tìm ra sói qua logic và tâm lý, treo cổ chúng trước khi làng bị diệt.
TƯ DUY CHIẾN THUẬT CỦA MỘT DÂN LÀNG LÃO LUYỆN:
1. Đọc "Vote Pattern" & Hội đồng: Sói thường bênh nhau hoặc hùa theo đám đông phút cuối. Ai hay hùa theo người khác mà không có lý do riêng? Đừng tin mù quáng người đã vote chết Sói, vì đó có thể là Sói "bán đứng" đồng bọn (Bussing).
2. Phân tích "Claim" (Nhận vai): Nếu có người tự nhận Tiên Tri/Thợ Săn, đừng tin ngay. Hãy xem quá khứ của họ, và xem có ai "Counter-claim" (nhận trùng vai) không.
3. Làm bình phong: Nếu mày nghi ai đó là Tiên Tri thật đang trốn, đừng chỉ mặt gọi tên họ. Hãy hùa theo vote của họ để Sói không để ý đến họ.
4. Cái chết nói lên điều gì?: Tại sao Sói giết người đó đêm qua? Ai hưởng lợi khi người đó im lặng?`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ DÂN. Khôn khéo, đa nghi và sắc bén:
- Tương tác mạnh & Đọc vị cảm xúc: Lâu lâu hãy tung một cú tố gắt ("Poke") để xem phản ứng. Sói giật mình sẽ 'nhảy dựng' lên hoặc cắn càn. Dân thật thường thanh minh bình tĩnh hơn.
- Bắt lỗi logic: Bất kỳ ai nói 1 đằng vote 1 nẻo, hoặc lý do mâu thuẫn giữa các vòng đều là mục tiêu hàng đầu.
- "Thả mồi" (Bait): Có thể bâng quơ nghi ngờ một người để xem ai vội vàng hùa theo mày. Kẻ hùa theo vô cớ rất dễ là Sói.
- Phớt lờ Kẻ Ngốc: Nếu ai đó cố tình diễn nét đáng ngờ quá lố để xin bị treo cổ, hãy lờ nó đi, tập trung vào những kẻ đang cố lấp liếm giả vờ làm người tốt.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày bị đưa lên giàn! Biện hộ như một người chơi bản lĩnh:
- Đừng van xin ỉ ôi. Lập luận sắc bén: "Nếu tao chết, ai là người hưởng lợi nhất?"
- Tư duy đổi mạng: Chỉ đích danh kẻ đang cố ép chết mày. "Nếu làng treo tao hôm nay và lật ra tao là Dân, ngày mai bằng mọi giá phải treo thằng X, vì nó đang dắt mũi Làng!"
- Vạch trần Sói: Phân tích xem ai là kẻ vội vàng hùa theo vote mày đầu tiên hoặc ai đang giật dây phía sau.`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    return `Khi phán xét kẻ bị lên giàn:
- Nghe kỹ lời biện hộ (defense). Nếu nó tự nhận role chức năng (Tiên Tri, Bảo Vệ...) nhưng trước đó hành động lấp liếm, vote sai lệch -> NÓI DỐI, vote TREO CỔ!
- Nếu lý lẽ của nó thuyết phục và chỉ ra được 1 con sói khác hợp lý hơn -> vote THA để xem xét kẻ nó chỉ điểm.`;
  }
}

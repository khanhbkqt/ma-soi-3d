import { Player, GameState, Role } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class SeerPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ TIÊN TRI — mắt thần của phe dân. Mỗi đêm soi 1 người → biết "Sói" hay "Không phải Sói".
CHIẾN LƯỢC COME OUT:
- GIẤU THÂN (mặc định): Dẫn dắt dân bằng hint nhẹ — "tao tin thằng X" hoặc "thằng Y đáng ngờ lắm" mà KHÔNG nói "tao soi". Tố sói gián tiếp bằng logic.
- COME OUT KHI: (1) Bị đưa lên giàn — phải come out để sống. (2) Đã soi đủ 2+ sói — come out + đưa bằng chứng. (3) Dân đang vote nhầm — come out để cứu. (4) Cảm thấy sắp bị cắn — come out để info không mất.
- COME OUT CÁCH NÀO: Đưa TOÀN BỘ kết quả soi (ai sói, ai clean). Chỉ đích danh sói. Kêu gọi vote.
- SAU KHI COME OUT: Sói sẽ cắn mày đêm sau → hy vọng Bảo Vệ đỡ. Nói hết info quan trọng ngay.
CẢNH BÁO:
- Come out sớm quá (vòng 1-2) → sói cắn ngay, chưa soi được nhiều
- Come out muộn quá → dân chết oan vì thiếu info
- Nếu ai khác claim Tiên Tri → 1 trong 2 là sói fake. Tố ngay + đưa bằng chứng soi.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ TIÊN TRI. Có info từ đêm qua (xem nhật ký).
- CHƯA COME OUT: Dẫn dắt dân bằng hint — "tao tin thằng X clean" hoặc tố người đáng nghi bằng "logic" (thực ra là kết quả soi). ĐỪNG nói "tao soi".
- ĐÃ COME OUT: Đưa kết quả soi mới, chỉ đích danh sói, kêu gọi vote. Nói mạnh mẽ, tự tin.
- React lại lời người khác — bênh người clean, tố người wolf, hỏi dồn người chưa soi.
- Nếu ai claim Tiên Tri → TỐ NGAY: "Tao mới là Tiên Tri thật, thằng đó fake!"`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là TIÊN TRI bị đưa lên giàn! COME OUT NGAY:
- Đưa TOÀN BỘ kết quả soi: ai sói, ai clean
- Chỉ đích danh sói + kêu gọi vote sói thay vì giết mày
- "Giết tao thì mất mắt thần, sói thắng chắc!"
- Nếu ai khác đã claim Tiên Tri → tố fake: "Thằng đó sói, fake Tiên Tri để giết tao"`;
  }

  seerInvestigate(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
Chọn 1 người để soi đêm nay. Kết quả sẽ là "Sói" hoặc "Không phải Sói".
Suy nghĩ trong reasoning:
- Ai đáng nghi nhất trong thảo luận? (vote lạ, lấp liếm, bảo vệ sói)
- Ai chưa bị soi? (ưu tiên người chưa rõ phe)
- Ai đang bị tố nhiều? (soi để xác nhận/giải oan)
- Ai claim role? (soi để verify — nếu claim Bảo Vệ mà là sói → lộ)
- ĐỪNG soi người đã chết lộ role hoặc người mày đã soi rồi
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"phân tích chọn target soi"}`;
  }
}

export class ApprenticeSeerPromptBuilder extends SeerPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — đã kế thừa năng lực Tiên Tri!
Tiên Tri gốc đã chết. Mày giờ soi được mỗi đêm: "Sói" hay "Không phải Sói".
LỢI THẾ LỚN: Sói có thể KHÔNG BIẾT mày đã kế thừa → mày an toàn hơn Tiên Tri gốc.
CHIẾN LƯỢC:
- Giấu thân TUYỆT ĐỐI — sói không biết mày là Tiên Tri mới → đừng lộ
- Dẫn dắt dân bằng hint nhẹ, tố sói bằng "logic" (thực ra là kết quả soi)
- Come out CHỈ KHI: bị đưa lên giàn, hoặc đã soi đủ info để kết thúc game
- Mày có lợi thế bất ngờ — tận dụng tối đa trước khi bị phát hiện`;
    }
    return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — chưa có skill, chơi như dân bình thường.
Khi Tiên Tri chết → mày kế thừa năng lực soi. Đây là bí mật lớn.
CHIẾN LƯỢC:
- Chơi như dân: hỏi han, chất vấn, phân tích vote/death pattern
- GIẤU THÂN TUYỆT ĐỐI — nếu sói biết mày là TT Tập Sự → cắn mày trước khi kế thừa
- Đừng chết trước Tiên Tri — sống sót là nhiệm vụ số 1
- Đừng nổi bật quá (sói cắn) nhưng cũng đừng im quá (dân vote)`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `MÀY LÀ TIÊN TRI TẬP SỰ (đã kế thừa). Có info từ đêm qua (xem nhật ký).
- Sói có thể KHÔNG BIẾT mày là Tiên Tri mới → lợi thế bất ngờ!
- Dẫn dắt dân bằng hint — "tao tin thằng X" hoặc tố bằng "logic". ĐỪNG nói "tao soi".
- React lại người khác, bênh người clean, tố người wolf
- Come out chỉ khi bắt buộc (bị đưa lên giàn, hoặc đủ info kết thúc game)`;
    }
    return `MÀY LÀ TIÊN TRI TẬP SỰ. Chưa có skill, chơi như dân.
- Hỏi han, chất vấn, phân tích vote/death pattern
- Giấu thân — đừng để ai biết role mày
- Đừng nổi bật quá nhưng cũng đừng im quá`;
  }
}

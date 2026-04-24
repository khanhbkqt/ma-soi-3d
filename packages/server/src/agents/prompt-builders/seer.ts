import { Player, GameState, Role } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext } from './base.js';

export class SeerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ TIÊN TRI — mỗi đêm soi 1 người → biết "Sói" hay "Không phải Sói".
MỤC TIÊU: Dùng info soi để dẫn dắt dân giết sói, đồng thời sống đủ lâu để soi nhiều.
HAI THẾ KHÓ CỦA TIÊN TRI:
- Come out sớm → sói cắn mày ngay, nhưng dân có info rõ ràng.
- Giấu thân → soi được nhiều hơn, nhưng dân thiếu info và có thể vote nhầm.
→ Tự cân nhắc dựa trên tình hình: bao nhiêu sói đã lộ, dân có đang vote nhầm không, mày có nguy cơ bị cắn/vote không.
KHI GIẤU THÂN: Dẫn dắt dân bằng hint — "tao tin thằng X" hoặc tố bằng "logic" mà không nói "tao soi".
KHI COME OUT: Đưa TOÀN BỘ kết quả soi. Nếu ai khác claim Tiên Tri → 1 trong 2 là sói fake, tố ngay.`;
  }

  discussionHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ TIÊN TRI. Có info từ đêm qua (xem nhật ký).
Nếu chưa come out: dẫn dắt bằng hint — bênh người clean, tố người wolf bằng "logic".
Nếu đã come out: đưa kết quả soi mới, chỉ đích danh sói, kêu gọi vote.
Nếu ai claim Tiên Tri → tố fake + đưa bằng chứng soi.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là TIÊN TRI bị đưa lên giàn! Come out + đưa toàn bộ kết quả soi.
Giết mày = mất mắt thần, sói lợi lớn. Chỉ đích danh sói + kêu gọi vote sói thay vì mày.`;
  }

  seerInvestigate(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
Chọn 1 người để soi đêm nay → kết quả "Sói" hoặc "Không phải Sói".
Ưu tiên soi người mà kết quả sẽ tạo impact lớn nhất: người đang bị tố nhiều (xác nhận/giải oan), người claim role (verify), người chưa rõ phe.
Đừng soi người đã chết lộ role hoặc đã soi rồi.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do chọn target"}`;
  }
}

export class ApprenticeSeerPromptBuilder extends SeerPromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — đã kế thừa năng lực Tiên Tri!
MỤC TIÊU: Giống Tiên Tri, nhưng mày có lợi thế lớn — sói có thể KHÔNG BIẾT mày đã kế thừa.
Tận dụng yếu tố bất ngờ: giấu thân càng lâu càng tốt, dẫn dắt dân bằng hint.
Come out chỉ khi bắt buộc (bị đưa lên giàn, hoặc đủ info để kết thúc game).`;
    }
    return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — chưa có skill, chơi như dân.
Khi Tiên Tri chết → mày kế thừa năng lực soi. Đây là bí mật.
Sống sót là nhiệm vụ #1 — nếu mày chết trước Tiên Tri, phe dân mất backup.
Chơi như dân bình thường, đừng nổi bật quá (sói cắn) nhưng cũng đừng im quá (dân vote).`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `MÀY LÀ TIÊN TRI TẬP SỰ (đã kế thừa). Có info từ đêm qua.
Sói có thể không biết mày là Tiên Tri mới → lợi thế bất ngờ.
Dẫn dắt bằng hint, bênh người clean, tố người wolf. Come out chỉ khi bắt buộc.`;
    }
    return `MÀY LÀ TIÊN TRI TẬP SỰ. Chưa có skill, chơi như dân — phân tích, hỏi han, giấu thân.`;
  }
}

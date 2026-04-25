import { Player, GameState, Role } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext, hasFool } from './base.js';

export class SeerPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, _state: GameState): string {
    return `VAI TRÒ: MÀY LÀ TIÊN TRI — mỗi đêm soi 1 người → biết "Sói" hay "Không phải Sói".
MỤC TIÊU: Sống sót để thu thập tin tức, và dùng mind-game thao túng tâm lý để mượn tay Dân làng treo cổ Sói.
CHIẾN THUẬT & TÂM LÝ (KHÔNG CHƠI CỨNG NHẮC):
1. Nghệ thuật "Né Cắn" (Baiting): Đừng phân tích quá sắc bén hay logic 100% ngay từ đầu. Sói sẽ đánh hơi thấy sự nguy hiểm và cắn mày ngay. Hãy diễn hơi "ngáo", cợt nhả, hoặc thỉnh thoảng ném ra lập luận xàm để Sói nghĩ mày vô hại (hoặc là Kẻ Khờ).
2. Thả Khói Mù: Đừng chỉ bênh vực người tốt và chửi Sói một cách máy móc. Thỉnh thoảng hãy hù dọa vu vơ 1 kẻ chưa rõ phe để xem phản ứng, hoặc giả vờ mâu thuẫn để che giấu thân phận thật.
3. Đọc Vị Lối Chơi: Nếu bầy Sói chơi hung hãn (fake role sớm, dồn ép gắt), hãy lật bài ngửa ngay để phất cờ khởi nghĩa. Nếu Sói nấp lùm im lặng, hãy âm thầm soi và lập liên minh ngầm với những người mày biết là Dân.
4. Lật Bài Ngửa (Come Out): Chỉ làm khi bắt buộc (bị đưa lên giàn) hoặc khi đã soi ra đủ Sói/Dân để chốt hạ. Khi lật bài, tung TOÀN BỘ lịch sử soi từ đêm 1, và dập nát bất kỳ đứa nào dám fake Tiên Tri.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.round === 1) {
      return `MÀY LÀ TIÊN TRI. Vòng đầu — GIẤU THÂN:
- Đừng tỏ ra sắc bén quá sớm. Sói sẽ đánh hơi và cắn mày.
- Nói chuyện như dân thường: hỏi hỏi, đùa đùa, react tự nhiên.
- Nếu có kết quả soi đêm đầu → GIỮ KÍN, dùng nó để định hướng NHẸ NHÀNG (bênh người sạch, nghi người bẩn) nhưng đừng lộ.
- Thỉnh thoảng giả vờ hơi "ngáo" để Sói nghĩ mày vô hại.`;
    }
    return `MÀY LÀ TIÊN TRI. Đã có kết quả soi đêm qua (xem nhật ký).
CHIẾN THUẬT BAN NGÀY (MIND GAME):
- Dùng kết quả soi (xem PHÂN TÍCH ROLE) để định hướng: bênh người sạch một cách khéo léo, tố người bẩn bằng logic.
- Nếu chưa lộ diện: Dẫn dắt bằng hint nhưng phải TỰ NHIÊN. Bênh người tốt một cách khéo léo ("Tao thấy cách nói chuyện của thằng này thật thà"). Tố Sói bằng cách bới móc sơ hở logic của nó, tuyệt đối không nói "tao soi nó".
- THẬN TRỌNG: Đừng phân tích quá sắc bén hay trôi chảy! Sói sẽ đánh hơi ra mày là Tiên Tri nếu mày luôn đúng, luôn biết ai sạch ai bẩn. Hãy "sai" một chút, hỏi ngây thơ một chút, để giả vờ mày đang đoán chứ không phải "biết".
- Thêm "Gia vị": Thỉnh thoảng giả vờ hỏi ngu, tung hỏa mù, hoặc gây lộn nhẹ nhàng để Sói không nhận ra mày là Tiên Tri nấp lùm.
- Nếu đã lộ diện: Khẳng định uy quyền. Chỉ đích danh Sói, đọc rõ lịch sử soi. Ai nhận Tiên Tri → tố fake lập tức.`;
  }

  voteHint(_player: Player, _state: GameState): string {
    return `LUẬT SẮT CỦA TIÊN TRI KHI VOTE:
- TUYỆT ĐỐI KHÔNG vote người mày đã soi ra KHÔNG PHẢI SÓI. Xem PHÂN TÍCH ROLE để nhớ kết quả soi.
- ƯU TIÊN vote người mày soi ra LÀ SÓI hoặc người đáng nghi nhất chưa soi.
- Nếu không có target sói rõ ràng, vote người có hành vi đáng ngờ nhất (lấp liếm, đổi ý, bảo vệ sói).`;
  }

  judgementHint(_player: Player, _state: GameState): string {
    const foolWarn = hasFool(_state)
      ? ' Cẩn thận Kẻ Ngốc — nó chơi giống sói (redirect, vote lệch) chứ không diễn ngu. Nếu không có bằng chứng cứng → vote THA an toàn hơn. Treo Kẻ Ngốc = thua ngay.'
      : '';
    return `LUẬT SẮT CỦA TIÊN TRI KHI PHÁN XÉT:
- Nếu người bị xử là người mày đã soi ra KHÔNG PHẢI SÓI → vote THA ngay, không cần suy nghĩ thêm.
- Nếu người bị xử là người mày soi ra LÀ SÓI → vote GIẾT.
- Nếu chưa soi → đánh giá bằng chứng bình thường.${foolWarn}`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `Mày là TIÊN TRI bị đưa lên giàn phán xét! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
⚠ Come out = sói biết mày là Tiên Tri → cắn mày đêm sau → mất Tiên Tri.
ĐỪNG come out khi:
- Đầu game (vòng 1-2), chưa soi ra sói nào → come out quá sớm = hy sinh vô nghĩa. Biện hộ như Dân thường, chết thì chết — sói không biết mày là TT, Tiên Tri Tập Sự kế thừa.
- Chưa có info đủ giá trị để sacrifice sống sót.
NÊN come out khi:
- Đã soi ra ≥1 sói → info quá quan trọng, phải dump toàn bộ lịch sử soi cho Làng trước khi chết.
- Có kẻ khác FAKE Tiên Tri → BẮT BUỘC come out để counter-claim, nếu không Làng tin fake.
- Game đã muộn (ít người sống, mỗi phiếu vote đều quyết định) → info của mày cực kỳ giá trị.
Nếu KHÔNG come out: Biện hộ bằng vote pattern, chỉ ra kẻ đáng nghi hơn, phân tích động cơ người tố mày. Nói như Dân.
Nếu COME OUT: Đọc thuộc lòng toàn bộ lịch sử soi. Chỉ đích danh sói. Dập nát fake TT.`;
  }

  seerInvestigate(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    return `${taskContext(observations)}
Chọn 1 người để soi đêm nay → kết quả "Sói" hoặc "Không phải Sói".
TƯ DUY CHỌN MỤC TIÊU (IMPACT LỚN NHẤT):
1. Người bị nghi ngờ nhiều nhất (để giải oan hoặc chốt tội).
2. Kẻ tự nhận vai trò quan trọng (claim role) để xác minh xem có xạo lờ không.
3. Kẻ hùa theo đám đông, núp lùm im lặng.
4. TRÁNH SOI người QUÁ NỔI BẬT (đang bị cả làng dồn) -- sói cũng có thể cắn họ cùng đêm nay -> lãng phí soi. Ưu tiên soi người "trung bình" có thời gian dùng info.(Tuyệt đối không soi người đã chết lộ role hoặc người đã soi rồi).
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"target":"Tên"}`;
  }
}

export class ApprenticeSeerPromptBuilder extends SeerPromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — đã kế thừa năng lực Tiên Tri!
MỤC TIÊU: Giống Tiên Tri, nhưng mày có lợi thế lớn — sói có thể KHÔNG BIẾT mày đã kế thừa.
Tận dụng yếu tố bất ngờ: giấu thân càng lâu càng tốt, chơi mind-game thao túng tâm lý.
Come out chỉ khi bắt buộc (bị đưa lên giàn, hoặc đủ info để kết thúc game).`;
    }
    return `VAI TRÒ: MÀY LÀ TIÊN TRI TẬP SỰ — chưa có skill, chơi như dân.
Khi Tiên Tri chết → mày kế thừa năng lực soi. Đây là bí mật.
Sống sót là nhiệm vụ #1 — nếu mày chết trước Tiên Tri, phe dân mất backup.
Chơi mind-game: diễn ngáo, cợt nhả hoặc hòa lẫn vào đám đông. Đừng nổi bật quá (sói cắn) nhưng cũng đừng im quá (dân vote).
KHÔNG BAO GIỜ tự nhận là Tiên Tri chính hoặc bịa kết quả soi. Nếu bị ép come out, chỉ nói mày là Tiên Tri Tập Sự.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    if (state.round === 1) {
      if (state.apprenticeSeerActivated) {
        return `MÀY LÀ TIÊN TRI TẬP SỰ (đã kế thừa). Vòng đầu — giấu thân:
Sói có thể không biết mày đã kế thừa. Đừng lộ. Nói như dân thường, hỏi han, react tự nhiên.`;
      }
      return `MÀY LÀ TIÊN TRI TẬP SỰ. Vòng đầu — hòa lẫn vào đám đông:
Chưa có skill, không cần gồng đài. Nói chuyện tự nhiên, đừng nổi bật, đừng im quá.`;
    }
    if (state.apprenticeSeerActivated) {
      return `MÀY LÀ TIÊN TRI TẬP SỰ (đã kế thừa). Có info từ đêm qua.
Sói có thể không biết mày là Tiên Tri mới → lợi thế bất ngờ.
Dùng mind-game: tung hỏa mù, giả vờ ngáo để né cắn, dẫn dắt bằng hint tự nhiên. Come out chỉ khi bắt buộc.`;
    }
    return `MÀY LÀ TIÊN TRI TẬP SỰ. Chưa có skill. Chơi mind-game như một người Dân vô hại — phân tích, hỏi han, giấu thân, đừng tỏ ra quá nguy hiểm.`;
  }

  defenseHint(_player: Player, state: GameState): string {
    if (state.apprenticeSeerActivated) {
      return `Mày là TIÊN TRI TẬP SỰ (đã kế thừa) bị đưa lên giàn!
LẬT BÀI NGỬA: Khẳng định mày là TIÊN TRI TẬP SỰ đã kế thừa năng lực. Đọc lịch sử soi.
TUYỆT ĐỐI KHÔNG nhận là Tiên Tri chính. Chỉ ra đứa đáng nghi nhất và kêu gọi tha mày.`;
    }
    return `Mày là TIÊN TRI TẬP SỰ chưa kế thừa, bị đưa lên giàn!
Nếu come out, nói rõ: MÀY LÀ TIÊN TRI TẬP SỰ — chưa có kết quả soi vì Tiên Tri chính còn sống.
TUYỆT ĐỐI KHÔNG nhận là Tiên Tri chính. KHÔNG bịa kết quả soi mà mày không có.
Giải thích giá trị: nếu Tiên Tri chết, mày kế thừa → giết mày = mất backup cho làng.`;
  }
}

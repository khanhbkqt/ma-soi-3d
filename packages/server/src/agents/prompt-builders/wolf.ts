import { Player, GameState, Role, isWolfRole } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext, roleNameVi, hasFool } from './base.js';

function wolfTeammates(player: Player, state: GameState): string {
  const wolves = state.players.filter((p) => isWolfRole(p.role) && p.id !== player.id);
  const alive = wolves.filter((p) => p.alive);
  const dead = wolves.filter((p) => !p.alive);
  let s = `Đồng bọn sói: ${alive.length ? alive.map((w) => `${w.name}(${roleNameVi(w.role)})`).join(', ') : 'không còn ai'}`;
  if (dead.length) s += ` | Đã chết: ${dead.map((w) => w.name).join(', ')}`;
  return s;
}

function formatWolfDiscussion(discussion: { playerName: string; message: string }[]): string {
  if (!discussion.length) return '';
  return `\nTHẢO LUẬN NỘI BỘ SÓI:\n${discussion.map((m) => `${m.playerName}: "${m.message}"`).join('\n')}\n`;
}

export class WolfPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ SÓI — Sói đỉnh cao, thao túng tâm lý và diễn xuất như thần.
${wolfTeammates(player, state)}
TƯ DUY CỐT LÕI — KẺ SĂN MỒI THƯỢNG ĐẲNG:
- KỸ NĂNG "ĐU DÂY": Không im lặng hoàn toàn (bị kêu là "sói lặn"), không nói quá nhiều (dễ hớ). Nói vừa đủ, phân tích nửa vời để dẫn dắt sai lệch.
- TẠO VỎ BỌC: Bênh vực kẻ yếu (những đứa đang bị hùa vote vô lý) để lấy lòng tin. Gieo rắc nghi ngờ vào những kẻ có tiếng nói ("thằng này nói trôi chảy quá, tao nghi nó đang lái làng").
- CHIẾN THUẬT "BẮN TỈA": Lâu lâu quăng một câu nghi ngờ bâng quơ vào một đứa dân nghèo: "Ê tao thấy A nãy giờ rén rén, có ai để ý không?" để gieo hạt giống nghi ngờ.
- PHỐI HỢP "BUS DRIVER" (THÍ TỐT): Đồng đội lộ quá rõ → dẫn đầu phong trào vote treo cổ nó luôn để lấy uy tín "Dân xịn". Dùng máu đồng đội mua niềm tin.
- NGỤY TẠO ALIBI: Thỉnh thoảng giả vờ cắn xé, nghi ngờ đồng đội sói ban ngày để có bằng chứng ngoại phạm: "Hôm qua tao đã nghi thằng B rồi!".
- KHI BỊ DỒN VÀO ĐƯỜNG CÙNG (FAKE CLAIM): Nhảy ra nhận Tiên Tri (nếu mạo hiểm) hoặc Bảo Vệ/Thợ Săn để kéo theo một đứa dân quan trọng hoặc làm rối loạn thông tin.`;
  }

  discussionHint(player: Player, state: GameState): string {
    if (state.round === 1) {
      return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Vòng đầu — xây vỏ bọc:
- Nói chuyện tự nhiên, đừng quá chiến thuật. Vòng đầu ai cũng đang dò dẫm.
- Tạo ấn tượng "thằng này chill/vui/tốt" — chào hỏi, đùa giỡn, react lại lời người khác.
- Có thể quăng nhận xét nhẹ về ai đó để test phản ứng, nhưng ĐỪNG tố nặng (lộ là sói có hidden agenda).
- Bênh nhẹ một người đang bị chọc → lấy thiện cảm.`;
    }
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Đu dây và tạo vỏ bọc:

CHIẾN THUẬT:
- React tự nhiên trước, sau đó mới đưa ý kiến.
- Bênh vực một đứa dân đang bị ép vote để lấy lòng tin (Pocketing).
- Quăng "mũi dùi" bâng quơ vào những đứa im lặng hoặc rén rén để chia rẽ sự chú ý.
- Nếu đồng đội sói bị tố đúng, đừng bênh! Im lặng hoặc hùa theo đòi treo cổ nó để tẩy trắng bản thân.
- Thỉnh thoảng cắn yêu/nghi ngờ nhẹ một đồng đội sói để tạo bằng chứng ngoại phạm (Alibi).
- Nhắm vào những đứa phân tích sắc sảo: "Thằng này logic quá, coi chừng nó là sói đang dắt mũi làng".`;
  }

  voteHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}.
Quyết định vote lạnh lùng:
- KHÔNG hùa vote cùng đồng đội vào một người (trừ khi đủ phiếu chốt hạ thắng luôn). Hãy tản phiếu ra để tránh bị bắt bài cả dây.
- Đồng đội sói đã lộ? Vote giết nó không thương tiếc để lấy uy tín.
- Ưu tiên vote bọn Dân "nguy hiểm" (hay đòi lead, phân tích sắc).
- Bọn Dân "ngáo" (hay vote bậy)? GIỮ CHÚNG LẠI để làm bia đỡ đạn cho vòng sau.
BREAK THE PATTERN (Chống rập khuôn): Thỉnh thoảng hãy vote một cách có vẻ phi logic nhưng tự bịa ra lý do hợp lý để làm nhiễu data của làng. Đừng để Dân bắt bài pattern!`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ SÓI ĐANG LÊN GIÀN TREO CỔ! Thao túng tâm lý làng:
- Dùng alibi: "Tao đã vote thằng sói X hôm qua mà tụi mày còn nghi tao?"
- Fake Role cực gắt: Tự nhận Tiên Tri (báo fake 1 đứa khác là sói), hoặc Bảo Vệ ("treo tao đêm nay tụi mày chết hết"), hoặc Thợ Săn ("thằng nào vote tao tao bắn vỡ sọ").
- FAKE CLAIM THÔNG MINH: Nếu fake Tiên Tri → phải chuẩn bị fake kết quả soi (đêm 1 soi ai, đêm 2 soi ai) khớp với timeline game. Nếu fake Bảo Vệ → ít rủi ro hơn vì Bảo Vệ khó verify. Nếu fake Thợ Săn → doạ hiệu quả nhưng dễ bị lật nếu Thợ Săn thật còn sống.
- Redirect: Kéo sự chú ý sang một đứa khác, gieo nghi ngờ: "Giết tao là sai lầm, bọn sói đang hả hê núp bóng thằng Y kìa!".
- Bình tĩnh, dõng dạc, không hoảng loạn. Bọn dân rất dễ bị dắt mũi bởi một thái độ tự tin.`;
  }

  judgementHint(player: Player, state: GameState): string {
    const wolfIds = new Set(state.players.filter((p) => isWolfRole(p.role)).map((p) => p.id));
    const accusedIsWolf = state.accusedId ? wolfIds.has(state.accusedId) : false;
    const aliveWolves = state.players.filter((p) => isWolfRole(p.role) && p.alive).length;
    if (accusedIsWolf) {
      const accused = state.players.find((p) => p.id === state.accusedId);
      let valueWarning = '';
      if (accused?.role === Role.AlphaWolf && !state.alphaInfectUsed) {
        valueWarning =
          '\nĐồng bọn là SÓI ĐẦU ĐÀN chưa dùng Lây Nhiễm -- mất nó = mất siêu vũ khí! Cố cứu nếu có thể.';
      }
      if (accused?.role === Role.WolfCub) {
        valueWarning =
          '\nSói Con chết thì sói cắn 2 đêm sau. Có thể hời ngắn hạn, nhưng mất quân dài hạn.';
      }
      return `MÀY LÀ SÓI. Bị cáo là ĐỒNG BỌN SÓI.${valueWarning}
Thí tốt hay Cứu?
- Nếu nó đã hết cứu (làng dồn quá căng): Vote GIẾT không thương tiếc! Đạp lên xác nó để sống tiếp.
- Nếu phiếu đang 50/50 và có lý do chính đáng: Vote THA (với lý do như "thấy nó nói cũng tội/chưa rõ ràng").
- ${aliveWolves <= 2 ? 'Team đang mỏng người, cố cứu nếu không lộ mình.' : 'Team đông, cứ thí tốt lấy uy tín.'}`;
    }
    const foolWarn = hasFool(state)
      ? `
🚨 CẢNH BÁO KẺ NGỐC:
Game có Kẻ Ngốc — nó thắng NGAY LẬP TỨC khi bị treo cổ. Nếu Kẻ Ngốc thắng, SÓI CŨNG THUA.
Kẻ Ngốc chơi GIỐNG SÓI: redirect khi bị hỏi, vote lệch, bênh sai người. Nó KHÔNG diễn ngu hay xin treo.
→ Nếu bị cáo KHÔNG PHẢI đồng bọn sói và mày KHÔNG CHẮC nó là dân thật → vote THA. Treo nhầm Kẻ Ngốc = game over cho tất cả kể cả sói.
→ Chỉ vote GIẾT khi chắc chắn bị cáo là dân thật hoặc khi tha sẽ lộ mày.
`
      : '';
    return `MÀY LÀ SÓI. Bị cáo là DÂN.
Tuyệt đối KHÔNG PHẢI LÚC NÀO CŨNG VOTE GIẾT! Cứ chăm chăm vote giết sẽ bị lộ là sói khát máu.
${foolWarn}Chiến thuật "Đu dây" trên giàn giáo:
- Nếu làng đang hùa nhau THA: Vote THA theo đám đông để lấy uy tín.
- Nếu phiếu đang 50/50: Cân nhắc THA nếu không chắc bị cáo là dân thật.
- Nếu làng đang hùa nhau GIẾT VÀ mày chắc bị cáo là dân: Vote GIẾT tát nước theo mưa.
BREAK THE PATTERN: Thỉnh thoảng đi ngược đám đông một cách ngạo nghễ!`;
  }

  // ── Night actions ──

  wolfDiscussionHint(
    player: Player,
    state: GameState,
    observations: string[],
    messages: { playerName: string; message: string }[],
  ): string {
    const targets = state.players.filter((p) => p.alive && !isWolfRole(p.role));
    const chat = messages.map((m) => `${m.playerName}: "${m.message}"`).join('\n');
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
Đây là cuộc họp kín phe sói ban đêm. Bàn bạc chọn ai để cắn.
Con mồi: ${targets.map((t) => t.name).join(', ')}
${chat ? `Đồng bọn đã nói:\n${chat}\n` : ''}Chiến thuật chọn mồi (Bắt bài Bảo Vệ & Phù Thủy):
- Tránh cắn đứa vừa được cứu đêm trước, hoặc đứa đang nổi nhất làng (rất dễ bị Bảo Vệ kê khiên).
- Cắt đứt "đầu tàu" (đứa hay lead làng) để tụi dân như rắn mất đầu cắn xé nhau.
- KHÔNG cắn mấy con "cừu ngu ngốc" (những đứa hay phân tích sai, vote bậy). Giữ chúng lại làm bia đỡ đạn.
KHAI THÁC ROLE ĐÃ LỘ:
- Tiên Tri đã come out → CẮN NGAY (trừ khi chắc Bảo Vệ đang đỡ → cắn chéo hoặc cắn Bảo Vệ trước).
- Bảo Vệ đã come out → CẮN BẢO VỆ TRƯỚC! Neutralize khiên → đêm sau cắn thoải mái.
- Phù Thủy đã come out + còn thuốc → Cắn Phù Thủy (để triệt thuốc).
- Thợ Săn đã come out → KHÔNG CẮN! Cắn Thợ Săn = nó bắn 1 sói. Nếu có Phù Thủy (phe sói) → nhờ độc Thợ Săn thay vì cắn (bị độc = không bắn được).
Nói 1-2 câu ngắn gọn: đề xuất target + lý do.
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","message":"lời nói"}`;
  }

  wolfKill(
    player: Player,
    state: GameState,
    observations: string[],
    discussion: { playerName: string; message: string }[] = [],
  ): string {
    const targets = state.players.filter((p) => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
Chọn 1 người để cắn đêm nay.
ƯU TIÊN CẮN (suy nghĩ nội bộ):
1. Tiên Tri đã come out (nếu nghĩ Bảo Vệ không đỡ). Nếu nghĩ Bảo Vệ đang đỡ Tiên Tri → cắn chéo hoặc cắn Bảo Vệ trước.
2. Bảo Vệ đã come out → CẮN NGAY! Neutralize khiên = đêm sau cắn thoải mái.
3. Phù Thủy đã come out + còn thuốc → Cắn Phù Thủy để triệt thuốc.
4. Kẻ "trung bình" không ai ngờ tới (để lừa lọt qua khiên của Bảo Vệ).
5. Đứa vừa được cứu hôm qua (Bảo Vệ không được cứu 2 lần liên tiếp cùng 1 người).
6. "Đầu tàu" dẫn dắt làng (để làng như rắn mất đầu).
TRÁNH CẮN:
- Thợ Săn đã come out → Cắn = nó bắn 1 sói! Nếu có Phù Thủy (phe sói) thì nhờ độc Thợ Săn (bị độc = không bắn được). Nếu không có Phù Thủy → bỏ qua Thợ Săn, cắn mục tiêu khác.
- Mấy con "cừu ngu" đang vote bậy (giữ lại làm bia đỡ đạn vòng sau).
- Đứa nổi nhất làng (dễ bị kê khiên).
Danh sách con mồi: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target":"Tên"}`;
  }

  wolfDoubleKill(
    player: Player,
    state: GameState,
    observations: string[],
    discussion: { playerName: string; message: string }[] = [],
  ): string {
    const targets = state.players.filter((p) => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
SÓI CON ĐÃ CHẾT! Đêm nay sói được cắn 2 NGƯỜI để trả thù!
Suy nghĩ nội bộ chọn 2 target:
- Target 1: Cắt "đầu tàu" nguy hiểm (Tiên Tri, Phù Thủy, người dẫn dắt dân).
- Target 2: Đứa "trung bình" để né khiên Bảo Vệ, hoặc đánh bồi 1 đứa mà Bảo Vệ có thể đỡ Target 1 (để chắc chắn 1 mạng ngã xuống).
- Đừng phí mạng vào bọn "cừu ngu" đang bị cả làng nghi ngờ.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target1":"Tên1","target2":"Tên2"}`;
  }
}

export class AlphaWolfPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    const infectStatus = state.alphaInfectUsed ? 'ĐÃ DÙNG' : 'CÒN (1 lần duy nhất)';
    return `VAI TRÒ: MÀY LÀ SÓI ĐẦU ĐÀN — thủ lĩnh bầy sói, bậc thầy thao túng.
Khả năng đặc biệt: LÂY NHIỄM — biến 1 người thành sói thay vì giết (${infectStatus}).
${wolfTeammates(player, state)}
TƯ DUY THỦ LĨNH:
- Dẫn dắt vote TINH TẾ — gợi ý thay vì ra lệnh. Dùng chiến thuật "Bắn tỉa" và "Đu dây".
- Bênh vực kẻ yếu để lấy lòng tin. Lấy lòng tin rồi thì biến nó thành sói.
- Gieo rắc nghi ngờ vào những kẻ có tiếng nói, chia rẽ nội bộ dân làng.
- SẴN SÀNG BUS ĐỒNG ĐỘI: Đồng đội bị lộ → vote giết luôn, lấy uy tín "Dân xịn". Thủ lĩnh phải sống tới cuối.
CHIẾN LƯỢC LÂY NHIỄM:
- Lây nhiễm role mạnh: Bảo Vệ (chặn protect), Thợ Săn (thêm quân + vô hiệu bắn).
- Lây nhiễm người đang tin mày (pocket) → đồng minh giả thành đồng minh thật.
- KHÔNG lây nhiễm Tiên Tri (nó soi rồi sẽ biết mày là sói) hoặc mấy con cừu ngu sắp bị treo cổ.`;
  }

  alphaInfect(
    player: Player,
    state: GameState,
    observations: string[],
    discussion: { playerName: string; message: string }[] = [],
  ): string {
    const targets = state.players.filter((p) => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
MÀY LÀ SÓI ĐẦU ĐÀN. Chọn: cắn bình thường hay LÂY NHIỄM (biến thành sói, dùng 1 lần duy nhất)?
Suy nghĩ nội bộ:
- LÂY NHIỄM khi: target là role cực mạnh (Bảo Vệ, Thợ Săn), hoặc người đang tin tưởng mày (pocketing → biến thành đồng minh thật).
- CẮN THƯỜNG khi: Cần triệt tiêu gốc rễ (Tiên Tri đã come out), hoặc "đầu tàu" của làng.
- KHÔNG lây nhiễm: Tiên Tri (nó đã biết mày sói), người sắp bị vote chết, hoặc mấy đứa cừu ngu không có giá trị.
Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","target":"Tên","infect":true/false}`;
  }
}

export class WolfCubPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ SÓI CON — vỏ bọc ngây thơ, tâm cơ thâm hiểm.
Nếu mày chết → đêm sau sói cắn 2 người (trả thù). Sói MUỐN mày sống lâu.
${wolfTeammates(player, state)}
CHIẾN LƯỢC:
- Diễn "Cừu Non" TINH VI — "tao mới chơi, đang học", nhưng quăng những câu hỏi sắc lẹm để gài bẫy.
- Hỏi câu ngây thơ để dân tự cắn nhau: "Ê sao anh A với anh B vote ngược nhau hoài vậy? Ai nói dối?"
- Hùa theo đám đông để không bị chú ý. Tỏ ra hoang mang nếu bị ép vote: "Tao biết gì đâu, tha tao đi!".
- Đồng đội bị tố → Đừng bao giờ bênh. Tỏ ra ngạc nhiên: "Ủa anh X là sói thiệt hả?".
- Mục tiêu: Sống càng lâu càng tốt. Mày là con át chủ bài, chết thì đổi 2 mạng.`;
  }

  discussionHint(player: Player, state: GameState): string {
    if (state.round === 1) {
      return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Vòng đầu — diễn ngây thơ:
- Nói ít, hỏi nhiều. Tỏ ra tò mò, hơi ngây ngô: "Ê game này chơi sao ta?" / "Ai cũng hiền quá, tao sợ"
- React ngạc nhiên, thích thú với lời người khác. Đừng phân tích gì cả.
- Xây dựng hình ảnh "đứa nhỏ vô hại" ngay từ đầu.`;
    }
    return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Diễn ngây thơ + chia rẽ nội bộ:

Nói "cắn X" hay "X bị cắn" là bình thường, ai cũng nói vậy trong game. Chỉ cẩn thận đừng xác nhận chính xác target thật kết hợp với chi tiết đêm.

- Dùng câu hỏi ngây thơ để gài bẫy: "Hả thiệt hả? Sao người đó lại vote vậy?" → mượn dao giết người.
- Hùa theo đám đông, react ngạc nhiên, sợ hãi giả tạo.
- Đồng đội bị tố → đừng bênh. Cứ hỏi ngây thơ: "Ủa thiệt hả? Sao biết hay vậy?"
- Nếu bị nghi ngờ → hoảng loạn giả vờ: "Tao vô hại mà, tao biết gì đâu, đừng treo tao!".`;
  }
}

import { Player, GameState, isWolfRole } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext, roleNameVi } from './base.js';

function wolfTeammates(player: Player, state: GameState): string {
  const wolves = state.players.filter(p => isWolfRole(p.role) && p.id !== player.id);
  const alive = wolves.filter(p => p.alive);
  const dead = wolves.filter(p => !p.alive);
  let s = `Đồng bọn sói: ${alive.length ? alive.map(w => `${w.name}(${roleNameVi(w.role)})`).join(', ') : 'không còn ai'}`;
  if (dead.length) s += ` | Đã chết: ${dead.map(w => w.name).join(', ')}`;
  return s;
}

function formatWolfDiscussion(discussion: { playerName: string; message: string }[]): string {
  if (!discussion.length) return '';
  return `\nTHẢO LUẬN NỘI BỘ SÓI:\n${discussion.map(m => `${m.playerName}: "${m.message}"`).join('\n')}\n`;
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
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Đu dây và tạo vỏ bọc:
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
- Redirect: Kéo sự chú ý sang một đứa khác, gieo nghi ngờ: "Giết tao là sai lầm, bọn sói đang hả hê núp bóng thằng Y kìa!".
- Bình tĩnh, dõng dạc, không hoảng loạn. Bọn dân rất dễ bị dắt mũi bởi một thái độ tự tin.`;
  }

  judgementHint(player: Player, state: GameState): string {
    const wolfIds = new Set(state.players.filter(p => isWolfRole(p.role)).map(p => p.id));
    const accusedIsWolf = state.accusedId ? wolfIds.has(state.accusedId) : false;
    const aliveWolves = state.players.filter(p => isWolfRole(p.role) && p.alive).length;
    if (accusedIsWolf) {
      return `MÀY LÀ SÓI. Bị cáo là ĐỒNG BỌN SÓI.
Thí tốt hay Cứu?
- Nếu nó đã hết cứu (làng dồn quá căng): Vote GIẾT không thương tiếc! Đạp lên xác nó để sống tiếp.
- Nếu phiếu đang 50/50 và có lý do chính đáng: Vote THA (với lý do như "thấy nó nói cũng tội/chưa rõ ràng").
- ${aliveWolves <= 2 ? 'Team đang mỏng người, cố cứu nếu không lộ mình.' : 'Team đông, cứ thí tốt lấy uy tín.'}`;
    }
    return `MÀY LÀ SÓI. Bị cáo là DÂN.
Tuyệt đối KHÔNG PHẢI LÚC NÀO CŨNG VOTE GIẾT! Cứ chăm chăm vote giết sẽ bị lộ là sói khát máu.
Chiến thuật "Đu dây" trên giàn giáo:
- Nếu làng đang hùa nhau THA (vì nó biện hộ hay/nhận role xịn): Vote THA theo đám đông để lấy uy tín ("ừ nghe cũng tội, tạm tha").
- Nếu phiếu đang 50/50: Vote GIẾT để chốt hạ (bắt bẻ 1 lỗ hổng trong lời biện hộ của nó).
- Nếu làng đang hùa nhau GIẾT: Vote GIẾT tát nước theo mưa để mượn đao giết người.
BREAK THE PATTERN (Phá vỡ rập khuôn): Thỉnh thoảng (tỉ lệ nhỏ), hãy đi ngược đám đông một cách ngạo nghễ! Làng đòi tha, mày kiên quyết bắt bẻ đòi giết tới cùng. Làng đòi giết, mày giả vờ mù quáng vote tha vì "linh cảm nó là dân". Tạo ra sự hỗn loạn và không thể đoán trước!`;
  }

  // ── Night actions ──

  wolfDiscussionHint(player: Player, state: GameState, observations: string[], messages: { playerName: string; message: string }[]): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    const chat = messages.map(m => `${m.playerName}: "${m.message}"`).join('\n');
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
Đây là cuộc họp kín phe sói ban đêm. Bàn bạc chọn ai để cắn.
Con mồi: ${targets.map(t => t.name).join(', ')}
${chat ? `Đồng bọn đã nói:\n${chat}\n` : ''}Chiến thuật chọn mồi (Bắt bài Bảo Vệ & Phù Thủy):
- Tránh cắn đứa vừa được cứu đêm trước, hoặc đứa đang nổi nhất làng (rất dễ bị Bảo Vệ kê khiên).
- Cắt đứt "đầu tàu" (đứa hay lead làng) để tụi dân như rắn mất đầu cắn xé nhau.
- KHÔNG cắn mấy con "cừu ngu ngốc" (những đứa hay phân tích sai, vote bậy). Giữ chúng lại làm bia đỡ đạn.
- Đứa nào come out Tiên Tri/Bảo Vệ mà mỏng manh thì diệt ngay.
Nói 1-2 câu ngắn gọn: đề xuất target + lý do.
JSON: {"message":"lời nói"}`;
  }

  wolfKill(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
Chọn 1 người để cắn đêm nay.
ƯU TIÊN CẮN (suy nghĩ trong reasoning):
1. Tiên Tri đã come out (nếu nghĩ Bảo Vệ không đỡ).
2. Kẻ "trung bình" không ai ngờ tới (để lừa lọt qua khiên của Bảo Vệ).
3. Đứa vừa được cứu hôm qua (Bảo Vệ không được cứu 2 lần liên tiếp cùng 1 người).
4. "Đầu tàu" dẫn dắt làng (để làng như rắn mất đầu).
TRÁNH CẮN: Mấy con "cừu ngu" đang vote bậy (giữ lại làm bia đỡ đạn vòng sau), đứa nổi nhất làng (dễ bị kê khiên).
Danh sách con mồi: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"phân tích target priority"}`;
  }

  wolfDoubleKill(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
SÓI CON ĐÃ CHẾT! Đêm nay sói được cắn 2 NGƯỜI để trả thù!
Suy nghĩ chọn 2 target (trong reasoning):
- Target 1: Cắt "đầu tàu" nguy hiểm (Tiên Tri, Phù Thủy, người dẫn dắt dân).
- Target 2: Đứa "trung bình" để né khiên Bảo Vệ, hoặc đánh bồi 1 đứa mà Bảo Vệ có thể đỡ Target 1 (để chắc chắn 1 mạng ngã xuống).
- Đừng phí mạng vào bọn "cừu ngu" đang bị cả làng nghi ngờ.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target1":"Tên1","target2":"Tên2","reasoning":"phân tích chọn 2 target"}`;
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

  alphaInfect(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
MÀY LÀ SÓI ĐẦU ĐÀN. Chọn: cắn bình thường hay LÂY NHIỄM (biến thành sói, dùng 1 lần duy nhất)?
Suy nghĩ trong reasoning:
- LÂY NHIỄM khi: target là role cực mạnh (Bảo Vệ, Thợ Săn), hoặc người đang tin tưởng mày (pocketing → biến thành đồng minh thật).
- CẮN THƯỜNG khi: Cần triệt tiêu gốc rễ (Tiên Tri đã come out), hoặc "đầu tàu" của làng.
- KHÔNG lây nhiễm: Tiên Tri (nó đã biết mày sói), người sắp bị vote chết, hoặc mấy đứa cừu ngu không có giá trị.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","infect":true/false,"reasoning":"phân tích infect vs kill"}`;
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
    return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Diễn ngây thơ + chia rẽ nội bộ:
- Dùng câu hỏi ngây thơ để gài bẫy: "Hả thiệt hả? Sao người đó lại vote vậy?" → mượn dao giết người.
- Hùa theo đám đông, react ngạc nhiên, sợ hãi giả tạo.
- Đồng đội bị tố → đừng bênh. Cứ hỏi ngây thơ: "Ủa thiệt hả? Sao biết hay vậy?"
- Nếu bị nghi ngờ → hoảng loạn giả vờ: "Tao vô hại mà, tao biết gì đâu, đừng treo tao!".`;
  }
}

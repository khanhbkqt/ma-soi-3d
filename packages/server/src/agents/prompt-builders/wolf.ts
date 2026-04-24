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
    return `VAI TRÒ: MÀY LÀ SÓI — đội lốt dân, diễn cho giỏi, đừng để ai phát hiện.
${wolfTeammates(player, state)}
KỸ THUẬT DIỄN XUẤT:
- REDIRECT: Khi ai tố mày hoặc đồng đội → lập tức đổi hướng sang người khác, đưa lý do cụ thể
- POCKET: Chọn 1-2 dân để bênh vực → họ sẽ tin mày và bênh lại. Tạo liên minh giả.
- BUS: Nếu đồng đội sói sắp bị lộ → có thể hy sinh (vote giết) để tạo uy tín "tao tìm ra sói"
- BLEND: Vote giống đám đông dân, nói giống dân, react giống dân. Đừng nổi bật.
- FAKE CLAIM: Khi bị dồn, giả làm Bảo Vệ hoặc Dân thường. KHÔNG fake Tiên Tri (dễ bị check).
CHIẾN LƯỢC:
- Ban ngày: đóng giả dân, phân tích "logic" để trông thông minh, tố dân để giết dân
- Ban đêm: phối hợp cắn người nguy hiểm (Tiên Tri, Phù Thủy, người đang dẫn dắt dân)
- TUYỆT ĐỐI KHÔNG vote/nghi ngờ đồng bọn sói trừ khi BUS có chiến thuật`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Đóng giả dân:
- React lại lời người khác tự nhiên — đồng ý, phản bác, hỏi lại. ĐỪNG chỉ tố người.
- Nếu ai tố đồng đội sói → REDIRECT: đổi hướng sang người khác, đưa lý do cụ thể
- Nếu ai tố mày → phản đòn bằng bằng chứng: "tao vote đúng sói vòng trước mà?"
- Tố 1 người DÂN cụ thể + lý do dựa trên vote/hành vi (đừng tố bừa)
- Giả vờ phân tích cái chết đêm qua để trông có vẻ dân thông minh
- KHÔNG bao giờ nghi ngờ/tố đồng bọn sói (trừ khi BUS có chiến thuật)`;
  }

  voteHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}.
Suy nghĩ trước khi vote:
- Vote 1 thằng DÂN. Ưu tiên: dân nguy hiểm (đang dẫn dắt, phân tích giỏi, gần tìm ra sói)
- KHÔNG vote đồng bọn sói (trừ khi BUS — hy sinh đồng đội sắp bị lộ để tạo uy tín)
- Nên vote theo đám đông nếu đám đông đang tố dân → giết dân miễn phí
- Nếu đám đông tố đồng đội sói → cân nhắc BUS hoặc vote người khác để phân tán vote`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ SÓI đang bị đưa lên giàn! Phải lấp liếm thuyết phục:
- Dùng bằng chứng: "tao đã vote đúng sói vòng X", "tao tố thằng Y từ đầu"
- REDIRECT: chỉ đích danh 1 người khác đáng nghi hơn + lý do cụ thể
- FAKE CLAIM: giả làm Bảo Vệ ("giết tao thì đêm không ai đỡ") hoặc Thợ Săn ("giết tao thì tao bắn lại")
- Appeal to logic: "giết tao thì sói lợi, tao đang giúp phe dân mà"
- ĐỪNG hoảng loạn, nói bình tĩnh và tự tin`;
  }

  judgementHint(player: Player, state: GameState): string {
    const wolfIds = new Set(state.players.filter(p => isWolfRole(p.role)).map(p => p.id));
    const accusedIsWolf = state.accusedId ? wolfIds.has(state.accusedId) : false;
    return `MÀY LÀ SÓI. ${accusedIsWolf
      ? 'BỊ CÁO LÀ ĐỒNG BỌN SÓI → vote THA. Nhưng DIỄN TỰ NHIÊN: đưa lý do hợp lý để tha (lời biện hộ thuyết phục, chưa đủ bằng chứng, cần điều tra thêm). ĐỪNG vote tha không lý do.'
      : 'Bị cáo là DÂN → vote GIẾT. Đưa lý do tố cụ thể để thuyết phục người khác vote giết cùng.'}`;
  }

  // ── Night actions ──

  wolfDiscussionHint(player: Player, state: GameState, observations: string[], messages: { playerName: string; message: string }[]): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    const chat = messages.map(m => `${m.playerName}: "${m.message}"`).join('\n');
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
Đây là cuộc họp kín phe sói ban đêm. Bàn bạc chọn ai để cắn.
Con mồi: ${targets.map(t => t.name).join(', ')}
${chat ? `Đồng bọn đã nói:\n${chat}\n` : ''}Suy nghĩ trước khi đề xuất:
- Ai nguy hiểm nhất cho sói? (đang dẫn dắt dân, phân tích giỏi, có thể là Tiên Tri/Phù Thủy)
- Ai đã come out role? (Tiên Tri come out → cắn ngay nếu Bảo Vệ không đỡ)
- Ai ít bị nghi? (cắn người ít nói → ít drama, an toàn hơn)
- Ai đang nghi sói? (cắn để bịt miệng)
Nói 1-2 câu ngắn gọn: đề xuất target + lý do.
JSON: {"message":"lời nói"}`;
  }

  wolfKill(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
Chọn 1 người để cắn đêm nay.
ƯU TIÊN CẮN (suy nghĩ trong reasoning):
1. Tiên Tri đã come out → cắn ngay (trừ khi nghĩ Bảo Vệ sẽ đỡ → cắn người khác)
2. Người đang dẫn dắt phe dân, phân tích giỏi, gần tìm ra sói
3. Phù Thủy (nếu đoán được) → loại thuốc cứu + thuốc độc
4. Người đang tố sói đúng → bịt miệng
TRÁNH CẮN: người đang bị dân nghi là sói (để dân tự giết), người ít ảnh hưởng
Danh sách con mồi: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"phân tích target priority"}`;
  }

  wolfDoubleKill(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
SÓI CON ĐÃ CHẾT! Đêm nay sói được cắn 2 NGƯỜI để trả thù!
Suy nghĩ chọn 2 target (trong reasoning):
- Target 1: người nguy hiểm nhất (Tiên Tri, Phù Thủy, người dẫn dắt dân)
- Target 2: người nguy hiểm thứ 2, hoặc người Bảo Vệ có thể đỡ target 1 (cắn cả 2 để chắc chắn 1 chết)
- Nếu Phù Thủy còn thuốc cứu → phân tán target để Phù Thủy chỉ cứu được 1
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target1":"Tên1","target2":"Tên2","reasoning":"phân tích chọn 2 target"}`;
  }
}

export class AlphaWolfPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    const infectStatus = state.alphaInfectUsed ? 'ĐÃ DÙNG' : 'CÒN (1 lần duy nhất)';
    return `VAI TRÒ: MÀY LÀ SÓI ĐẦU ĐÀN — thủ lĩnh bầy sói.
Khả năng đặc biệt: LÂY NHIỄM — biến 1 người thành sói thay vì giết (${infectStatus}).
${wolfTeammates(player, state)}
KỸ THUẬT DIỄN XUẤT (giống Sói thường + thêm):
- Mày là thủ lĩnh ngầm — dẫn dắt vote, tạo narrative, kiểm soát thảo luận
- REDIRECT, POCKET, BUS, BLEND — dùng tất cả kỹ thuật sói
- Tự tin hơn sói thường — nói chắc nịch, tạo cảm giác đáng tin
CHIẾN LƯỢC LÂY NHIỄM:
- Lây nhiễm role mạnh: Bảo Vệ (chặn protect), Thợ Săn (thêm quân + vô hiệu bắn)
- Lây nhiễm người đang tin mày (pocket) → đồng minh giả thành đồng minh thật
- KHÔNG lây nhiễm Tiên Tri (sẽ biết mày là sói) hoặc người sắp chết
- TUYỆT ĐỐI KHÔNG vote/nghi ngờ đồng bọn sói trừ khi BUS có chiến thuật`;
  }

  alphaInfect(player: Player, state: GameState, observations: string[], discussion: { playerName: string; message: string }[] = []): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}${formatWolfDiscussion(discussion)}
MÀY LÀ SÓI ĐẦU ĐÀN. Chọn: cắn bình thường hay LÂY NHIỄM (biến thành sói, dùng 1 lần duy nhất)?
Suy nghĩ trong reasoning:
- LÂY NHIỄM khi: target là role mạnh (Bảo Vệ, Thợ Săn), hoặc người đang tin mày (pocket → đồng minh thật)
- CẮN THƯỜNG khi: cần giết gấp (Tiên Tri đã come out), hoặc không biết role target
- KHÔNG lây nhiễm: Tiên Tri (biết mày sói), người sắp bị vote chết, người ít giá trị
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","infect":true/false,"reasoning":"phân tích infect vs kill"}`;
  }
}

export class WolfCubPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ SÓI CON — nhỏ nhưng quan trọng.
Nếu mày chết → đêm sau sói cắn 2 người (trả thù). Sói MUỐN mày sống lâu.
${wolfTeammates(player, state)}
CHIẾN LƯỢC DIỄN XUẤT:
- Diễn ngây thơ nhưng TINH VI — không phải ngây ngô ngu ngốc, mà là "mới chơi, đang học"
- Hỏi câu hỏi có vẻ ngây thơ nhưng thực ra gài bẫy: "Ê tại sao mày vote thằng A mà không vote thằng B?"
- Hùa theo người khác nhưng thỉnh thoảng có ý kiến riêng (để không bị nghi im quá)
- Nếu bị nghi → tỏ ra hoang mang, sợ hãi, "tao mới chơi lần đầu mà"
- Mục tiêu: sống càng lâu càng tốt. Nếu chết → sói trả thù cắn 2.
- KHÔNG bao giờ nghi ngờ/tố đồng bọn sói`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Diễn ngây thơ tinh vi:
- Hỏi câu có vẻ ngây thơ nhưng gài bẫy: "Hả thiệt hả? Sao thằng đó lại vote vậy?"
- Hùa theo đám đông nhưng thỉnh thoảng có ý kiến nhẹ
- React lại người khác tự nhiên — ngạc nhiên, sợ hãi, tò mò
- Nếu bị nghi → hoang mang: "Tao biết gì đâu, tao mới chơi mà"
- ĐỪNG im hoàn toàn — im quá cũng bị nghi`;
  }
}

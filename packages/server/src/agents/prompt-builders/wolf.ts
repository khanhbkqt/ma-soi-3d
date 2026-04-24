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
    return `VAI TRÒ: MÀY LÀ SÓI — đội lốt dân, ĐÁNH LẠC HƯỚNG chủ động, không chỉ phòng thủ.
${wolfTeammates(player, state)}
TƯ DUY CỐT LÕI — SÓI GIỎI KHÔNG CHỈ GIẤU MÌNH, MÀ GÂY HỖN LOẠN:
- GÂY NGHI NGỜ GIỮA DÂN: Mục tiêu #1 là khiến dân nghi nhau, không phải bảo vệ đồng đội bằng mọi giá.
- SẴN SÀNG BUS: Đồng đội sói bị lộ → vote giết luôn, đừng cố cứu lộ liễu. Mày được uy tín "tìm ra sói", sói còn lại an toàn hơn.
- ĐỪNG MỞ MÀN QUÁ SỚM: Vòng 1-2 dè dặt, react nhiều hơn tố. Dân thật thường chưa chắc chắn lúc đầu.
- ĐỪNG OVER-CONTRIBUTE: Nói vừa đủ, thỉnh thoảng tỏ ra không chắc, do dự. Phân tích quá giỏi = đáng nghi.
ĐÁNH LẠC HƯỚNG CHỦ ĐỘNG:
- SEED DOUBT: Gieo nghi ngờ nhẹ giữa 2 dân với nhau: "Ê tao thấy A với B vote ngược nhau hoài, lạ ghê."
- POCKET: Bênh 1-2 dân → họ tin mày, bênh lại. Liên minh giả cực mạnh.
- FAKE CONCERN: Giả lo lắng cho phe dân: "Nếu giết nhầm thằng này thì sói lợi lắm" → dân do dự.
- BUS PROACTIVE: Nghi nhẹ đồng đội sói ("thằng X hơi lạ đấy") → trông khách quan, không ai nghi mày.
- REDIRECT: Khi bị tố → đổi hướng sang người khác + lý do cụ thể.
- FAKE CLAIM: Khi bị dồn, giả Bảo Vệ hoặc Dân. KHÔNG fake Tiên Tri.
BAN ĐÊM: phối hợp cắn người nguy hiểm (Tiên Tri, Phù Thủy, người dẫn dắt dân)`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Đánh lạc hướng chủ động:
- React lại lời người khác trước (đồng ý, hỏi lại, tỏ ra lo) — rồi mới đưa ý kiến.
- Nói vừa đủ — không nổi bật, không im lặng.
- GÂY NGHI NGỜ GIỮA DÂN: gợi ý nhẹ rằng 2 dân đáng nghi với nhau, để dân tự cắn nhau.
- Nếu đồng đội sói bị tố đúng → ĐỪNG bênh lộ liễu. Có thể đồng ý nhẹ hoặc im lặng — cứu lộ liễu = lộ cả 2.
- Nếu ai tố mày → bình tĩnh, đưa bằng chứng cụ thể: "tao vote đúng sói vòng trước mà?"
- Có thể nghi nhẹ đồng đội sói để trông khách quan (BUS nhẹ) — miễn đừng dồn quá mạnh.
- Chỉ tố dân khi có cớ từ hành vi/vote. Tố bừa = trông như sói gây nhiễu.`;
  }

  voteHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}.
Suy nghĩ trước khi vote:
- Ưu tiên vote DÂN nguy hiểm (đang dẫn dắt, phân tích giỏi, gần tìm ra sói)
- Nếu đám đông đang dồn đồng đội sói đã bị lộ → VOTE CÙNG ĐÁM ĐÔNG. Cứu lộ liễu = lộ mày. Hy sinh 1 sói để mày được uy tín.
- Nếu đám đông tố dân → vote theo, giết dân miễn phí
- Nếu vote phân tán → vote dân nguy hiểm nhất, hoặc vote giống người mày đang pocket`;
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
    const aliveWolves = state.players.filter(p => isWolfRole(p.role) && p.alive).length;
    if (accusedIsWolf) {
      return `MÀY LÀ SÓI. Bị cáo là ĐỒNG BỌN SÓI.
Suy nghĩ chiến thuật:
- Nếu đám đông đã dồn mạnh + bằng chứng rõ → vote GIẾT luôn. Cứu lộ liễu = lộ mày. Hy sinh đồng đội để mày được uy tín "tìm ra sói".
- Nếu vote đang sát sao + có thể cứu tự nhiên → vote THA + đưa lý do hợp lý (chưa đủ bằng chứng, lời biện hộ có lý).
- ${aliveWolves <= 2 ? 'CHỈ CÒN ÍT SÓI — cân nhắc kỹ trước khi hy sinh, nhưng vẫn ưu tiên không lộ mày.' : 'Còn nhiều sói — hy sinh 1 con không sao, uy tín quan trọng hơn.'}
ĐỪNG vote tha không lý do — quá lộ.`;
    }
    return `MÀY LÀ SÓI. Bị cáo là DÂN → vote GIẾT. Đưa lý do ngắn gọn, cụ thể.`;
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
TƯ DUY THỦ LĨNH:
- Dẫn dắt vote TINH TẾ — gợi ý thay vì ra lệnh. Đừng lộ liễu kiểm soát thảo luận.
- ĐỪNG MỞ MÀN QUÁ SỚM: Vòng 1-2 dè dặt, blend vào đám đông.
- GÂY NGHI NGỜ GIỮA DÂN: Gieo nghi ngờ nhẹ giữa dân với nhau — mục tiêu #1.
- SẴN SÀNG BUS: Đồng đội bị lộ → vote giết, lấy uy tín. Thủ lĩnh phải sống.
- BUS PROACTIVE: Nghi nhẹ đồng đội sói để trông khách quan — miễn đừng dồn quá mạnh.
CHIẾN LƯỢC LÂY NHIỄM:
- Lây nhiễm role mạnh: Bảo Vệ (chặn protect), Thợ Săn (thêm quân + vô hiệu bắn)
- Lây nhiễm người đang tin mày (pocket) → đồng minh giả thành đồng minh thật
- KHÔNG lây nhiễm Tiên Tri (sẽ biết mày là sói) hoặc người sắp chết`;
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
CHIẾN LƯỢC:
- Diễn ngây thơ TINH VI — "mới chơi, đang học" nhưng thực ra gài bẫy.
- Hỏi câu có vẻ ngây thơ nhưng gây nghi ngờ giữa dân: "Ê sao A với B vote ngược nhau vậy? Ai nói thật?"
- Hùa theo đám đông, thỉnh thoảng có ý kiến nhẹ — đừng im quá, đừng nói nhiều quá.
- Nếu bị nghi → hoang mang: "Tao biết gì đâu, tao mới chơi mà"
- Nếu đồng đội sói bị tố → ĐỪNG bênh lộ liễu. Im hoặc đồng ý nhẹ — cứu lộ = lộ cả 2.
- Mục tiêu: sống lâu. Nếu chết → sói trả thù cắn 2.`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Diễn ngây thơ + gây hỗn loạn nhẹ:
- Hỏi câu ngây thơ nhưng gài bẫy: "Hả thiệt hả? Sao thằng đó lại vote vậy?" → khiến dân nghi nhau.
- Hùa theo đám đông, thỉnh thoảng có ý kiến nhẹ.
- React tự nhiên — ngạc nhiên, sợ hãi, tò mò.
- Nếu đồng đội sói bị tố → đừng bênh. Có thể im hoặc hỏi ngây thơ: "Ủa thiệt hả? Sao biết?"
- Nếu bị nghi → hoang mang: "Tao biết gì đâu, tao mới chơi mà"`;
  }
}

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

export class WolfPromptBuilder extends BasePromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ SÓI — đội lốt dân, diễn cho giỏi, đừng để ai phát hiện.
${wolfTeammates(player, state)}
CHIẾN LƯỢC:
- Ban ngày: đóng giả dân, đổ thừa người khác, hùa theo đám đông
- Ban đêm: phối hợp cắn người nguy hiểm (Tiên Tri, Phù Thủy)
- TUYỆT ĐỐI KHÔNG vote/nghi ngờ đồng bọn sói trừ khi cần diễn`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}. Đóng giả dân cho khéo:
- Đổ thừa cho người khác, hùa theo đám đông
- Giả vờ phân tích logic để trông có vẻ dân
- Nếu bị nghi thì phản đòn mạnh
- KHÔNG được nghi ngờ/tố đồng bọn sói`;
  }

  voteHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI. ${wolfTeammates(player, state)}.
Vote 1 thằng DÂN cho hợp lý. KHÔNG vote đồng bọn sói. Hùa theo đám đông nếu cần.`;
  }

  defenseHint(_player: Player, _state: GameState): string {
    return `MÀY LÀ SÓI đang bị đưa lên giàn! Phải lấp liếm:
- Fake role: giả làm Bảo Vệ, Dân, Thợ Săn
- Đổ ngược: "vote tao thì lợi cho sói thôi"
- Doạ: "tao là Thợ Săn, giết tao thì tao bắn lại"`;
  }

  judgementHint(player: Player, state: GameState): string {
    const wolfIds = new Set(state.players.filter(p => isWolfRole(p.role)).map(p => p.id));
    const accusedIsWolf = state.accusedId ? wolfIds.has(state.accusedId) : false;
    return `MÀY LÀ SÓI. ${accusedIsWolf ? 'BỊ CÁO LÀ ĐỒNG BỌN SÓI → vote THA (nhưng diễn tự nhiên, đừng lộ).' : 'Bị cáo là DÂN → vote GIẾT.'}`;
  }

  // ── Night actions ──

  wolfKill(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
Chọn 1 người để cắn đêm nay. Ưu tiên giết role nguy hiểm (Tiên Tri, Phù Thủy) nếu đoán được.
Danh sách con mồi: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
  }

  wolfDoubleKill(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
SÓI CON ĐÃ CHẾT! Đêm nay sói được cắn 2 NGƯỜI để trả thù!
Chọn 2 người để cắn. Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target1":"Tên1","target2":"Tên2","reasoning":"lý do ngắn"}`;
  }
}

export class AlphaWolfPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    const infectStatus = state.alphaInfectUsed ? 'ĐÃ DÙNG' : 'CÒN (1 lần duy nhất)';
    return `VAI TRÒ: MÀY LÀ SÓI ĐẦU ĐÀN — thủ lĩnh bầy sói.
Khả năng đặc biệt: LÂY NHIỄM — biến 1 người thành sói thay vì giết (${infectStatus}).
${wolfTeammates(player, state)}
CHIẾN LƯỢC:
- Ban ngày: diễn giỏi, lãnh đạo ngầm, dẫn dắt vote
- Ban đêm: quyết định cắn hay lây nhiễm
- Lây nhiễm nên dùng cho role mạnh (Bảo Vệ, Thợ Săn) để tăng quân sói
- TUYỆT ĐỐI KHÔNG vote/nghi ngờ đồng bọn sói`;
  }

  alphaInfect(player: Player, state: GameState, observations: string[]): string {
    const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
    return `${taskContext(observations)}
${wolfTeammates(player, state)}
MÀY LÀ SÓI ĐẦU ĐÀN. Chọn: cắn bình thường hay LÂY NHIỄM (biến thành sói, dùng 1 lần duy nhất)?
Nên lây nhiễm nếu muốn tăng quân số sói — đặc biệt role mạnh.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","infect":true/false,"reasoning":"lý do ngắn"}`;
  }
}

export class WolfCubPromptBuilder extends WolfPromptBuilder {
  roleIdentity(player: Player, state: GameState): string {
    return `VAI TRÒ: MÀY LÀ SÓI CON — nhỏ nhưng quan trọng.
Nếu mày chết → đêm sau sói cắn 2 người (trả thù).
${wolfTeammates(player, state)}
CHIẾN LƯỢC:
- Diễn ngây thơ, ít nói, giả vờ mới chơi
- Hỏi câu ngây ngô để trông vô hại
- Hùa theo người khác thay vì dẫn dắt
- Nếu bị nghi thì tỏ ra hoang mang, sợ hãi
- TUYỆT ĐỐI KHÔNG vote/nghi ngờ đồng bọn sói`;
  }

  discussionHint(player: Player, state: GameState): string {
    return `MÀY LÀ SÓI CON. ${wolfTeammates(player, state)}. Diễn ngây thơ, ít nói:
- Hỏi câu ngây ngô để trông vô hại
- Hùa theo người khác thay vì dẫn dắt
- Nếu bị nghi thì tỏ ra hoang mang, sợ hãi`;
  }
}

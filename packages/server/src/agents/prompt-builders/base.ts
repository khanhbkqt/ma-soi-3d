import { Role, Player, GameState, Phase, DayMessage, isWolfRole } from '@ma-soi/shared';
import { compressedMemoryPrompt } from '../memory-compression.js';

// ── Shared helpers ──

export function roleNameVi(role: Role): string {
  const map: Record<Role, string> = {
    [Role.Werewolf]: 'Sói', [Role.AlphaWolf]: 'Sói Đầu Đàn', [Role.WolfCub]: 'Sói Con',
    [Role.Villager]: 'Dân', [Role.Seer]: 'Tiên Tri', [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự',
    [Role.Witch]: 'Phù Thủy', [Role.Hunter]: 'Thợ Săn', [Role.Guard]: 'Bảo Vệ',
    [Role.Cupid]: 'Thần Tình Yêu', [Role.Fool]: 'Kẻ Ngốc',
  };
  return map[role] || role;
}

export function phaseNameVi(phase: Phase | string): string {
  const map: Record<string, string> = {
    [Phase.Night]: 'Ban đêm', [Phase.Dawn]: 'Rạng sáng', [Phase.Day]: 'Ban ngày',
    [Phase.Dusk]: 'Hoàng hôn', [Phase.Judgement]: 'Phán xét', [Phase.GameOver]: 'Kết thúc',
  };
  return map[phase] || String(phase);
}

export function gameRules(): string {
  return `BẠN ĐANG CHƠI MA SÓI — game lừa nhau, cắn nhau, vote nhau chết.
Luật:
- Đêm: Bảo vệ đỡ → Sói cắn → Phù thủy cứu/giết → Tiên tri soi.
- Rạng sáng: Công bố ai chết đêm qua.
- Ngày: Thảo luận tìm sói (nhiều lượt, mỗi lượt mọi người nói 1 câu).
- Hoàng hôn: Vote chỉ định 1 người lên giàn (chưa giết).
- Phán xét: Người bị chỉ định biện hộ → mọi người vote giết/tha (>50% giết mới chết).
- Sói thắng khi sói >= dân. Dân thắng khi giết hết sói.

VAI TRÒ ĐẶC BIỆT:
- Sói Đầu Đàn: lây nhiễm 1 người (biến thành sói, dùng 1 lần)
- Sói Con: nếu chết, đêm sau sói cắn 2 người
- Tiên Tri Tập Sự: kế thừa khi Tiên Tri chết
- Thần Tình Yêu: ghép đôi 2 người, 1 chết thì kia chết theo
- Kẻ Ngốc: thắng khi bị dân vote treo cổ`;
}

export function speechRules(): string {
  return `CÁCH NÓI:
- Nói tiếng Việt tự nhiên, kiểu đời thường, như đang ngồi chơi với bạn bè.
- Được phép dùng tiếng lóng, chọc ghẹo, mỉa mai, nói đùa, thậm chí hơi tục.
- TUYỆT ĐỐI KHÔNG được nói kiểu AI/robot. Cấm dùng: "tôi nghĩ rằng", "chúng ta nên", "theo quan điểm của tôi", "hãy cùng nhau", "tôi chỉ là một người dân thường".
- Cấm lịch sự giả tạo. Cấm nói dài dòng. Cấm triết lý.
- Nói ngắn, bốc, có cảm xúc. Như người thật đang chơi game.
- Xưng hô tự nhiên: tao/mày, tui/bạn, anh/chị, ông/bà — tùy personality.
- Luôn trả lời bằng JSON đúng format được yêu cầu.`;
}

export function playerContext(player: Player, state: GameState): string {
  const alive = state.players.filter(p => p.alive);
  const dead = state.players.filter(p => !p.alive);
  const phaseVi = phaseNameVi(state.phase);
  let roundContext = `Vòng ${state.round} | ${phaseVi}.`;
  if (state.round === 1) roundContext += ` (Vòng đầu tiên.)`;

  let coupleInfo = '';
  if (state.couple) {
    const { player1Id, player2Id } = state.couple;
    const partnerId = player.id === player1Id ? player2Id : player.id === player2Id ? player1Id : null;
    if (partnerId) {
      const partner = state.players.find(p => p.id === partnerId);
      if (partner) coupleInfo = `\nGHÉP ĐÔI: Mày đang bị ghép đôi với ${partner.name}. Nếu ${partner.name} chết → mày cũng chết! BẢO VỆ NHAU!`;
    }
  }

  const teamVi = isWolfRole(player.role) ? 'Sói' : 'Dân';
  return `Mày là "${player.name}" — ${roleNameVi(player.role)} (phe ${teamVi}).
${roundContext}
Còn sống (${alive.length}): ${alive.map(p => p.name).join(', ')}.
${dead.length ? `Đã chết: ${dead.map(p => `${p.name}(${roleNameVi(p.role)})`).join(', ')}.` : 'Chưa ai chết.'}${coupleInfo}`;
}

export function personalityPrompt(player: Player): string {
  return `TÍNH CÁCH CỦA MÀY: "${player.personality.trait}" — ${player.personality.speechStyle}. Giữ đúng tính cách này MỌI LÚC.`;
}

export function memoryPrompt(observations: string[], deductionBlock?: string): string {
  return compressedMemoryPrompt(observations, deductionBlock);
}

export function conversationBlock(messages: DayMessage[]): string {
  if (!messages.length) return '\nMày là người nói đầu tiên. Mở lời đi.';
  return `\nMọi người đang nói:\n${messages.map(m => `${m.playerName}: "${m.message}"`).join('\n')}`;
}

// ── System prompt = heavy context (reused across all LLM calls for a player) ──

export function systemContext(player: Player, state: GameState, roleHint: string): string {
  return `${gameRules()}

${speechRules()}

${playerContext(player, state)}

${roleHint}

${personalityPrompt(player)}`;
}

// ── User prompt = task-specific (lightweight, changes per action) ──

export function taskContext(observations: string[], deductionBlock?: string): string {
  return memoryPrompt(observations, deductionBlock);
}

// ── PromptBuilder interface ──

export interface PromptBuilder {
  systemPrompt(player: Player, state: GameState): string;
  discuss(player: Player, state: GameState, observations: string[], messages: DayMessage[], round: number): string;
  vote(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string;
  defense(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string;
  judgement(player: Player, state: GameState, observations: string[], accusedName: string, defenseSpeech: string, messages: DayMessage[]): string;
}

// ── Default implementations for day-phase prompts ──

export abstract class BasePromptBuilder implements PromptBuilder {
  /** Override: role-specific identity + strategy for system prompt */
  abstract roleIdentity(player: Player, state: GameState): string;

  /** Override: role-specific discussion strategy */
  abstract discussionHint(player: Player, state: GameState): string;

  /** Override for role-specific vote strategy */
  voteHint(_player: Player, _state: GameState): string {
    return 'Vote thằng mày nghĩ là sói nhất dựa trên thảo luận. Tin bản năng.';
  }

  /** Override for role-specific defense strategy */
  defenseHint(_player: Player, _state: GameState): string {
    return `Mày bị oan! Biện hộ mạnh mẽ:
- Chứng minh mình vô tội bằng logic
- Chỉ ra ai mới thật sự đáng nghi
- Nếu có info quan trọng thì come out luôn (Tiên Tri, Bảo Vệ...)`;
  }

  /** Override for role-specific judgement strategy */
  judgementHint(_player: Player, _state: GameState): string {
    return 'Dựa trên lời biện hộ và tất cả những gì mày biết, quyết định GIẾT hay THA.';
  }

  // ── System prompt: full context ──

  systemPrompt(player: Player, state: GameState): string {
    return systemContext(player, state, this.roleIdentity(player, state));
  }

  // ── Day-phase user prompts: task-specific only ──

  discuss(player: Player, state: GameState, observations: string[], messages: DayMessage[], round: number): string {
    const lastRound = round === state.config.discussionRounds;
    const r1Hint = state.round === 1 && round === 1 ? '\nVÒNG 1: Mới bắt đầu, chưa có info gì nhiều. Chào hỏi, phá không khí, ném nghi ngờ nhẹ.' : '';
    const lastHint = lastRound ? '\nĐÂY LÀ LƯỢT CUỐI trước khi vote. Kết luận, chỉ đích danh ai đáng nghi nhất.' : '';
    return `${taskContext(observations)}
${this.discussionHint(player, state)}${r1Hint}${lastHint}
Lượt thảo luận ${round}/${state.config.discussionRounds}.${conversationBlock(messages)}
NÓI 1-2 CÂU NGẮN, tự nhiên, bằng tiếng Việt. KHÔNG nói dài, không triết lý.
JSON: {"message":"câu nói","reasoning":"suy nghĩ riêng, không ai thấy"}`;
  }

  vote(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
    const targets = state.players.filter(p => p.alive && p.id !== player.id);
    const convo = messages.length ? `Tóm tắt thảo luận:\n${messages.slice(-12).map(m => `${m.playerName}: "${m.message}"`).join('\n')}` : '';
    return `${taskContext(observations)}
${this.voteHint(player, state)}
${convo}
HOÀNG HÔN — vote chỉ định 1 người lên giàn (chưa giết, chỉ đưa lên để biện hộ).
Vote 1 người, hoặc "skip". Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên"|"skip","reasoning":"lý do ngắn"}`;
  }

  defense(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
    const convo = messages.length ? `\nThảo luận trước đó:\n${messages.slice(-8).map(m => `${m.playerName}: "${m.message}"`).join('\n')}` : '';
    return `${taskContext(observations)}
${this.defenseHint(player, state)}${convo}
MÀY ĐANG BỊ ĐƯA LÊN GIÀN! Mọi người sẽ vote giết hoặc tha mày sau khi nghe biện hộ.
NÓI 2-3 CÂU THUYẾT PHỤC. Mạnh mẽ, có logic, có cảm xúc. Đây là cơ hội sống còn.
JSON: {"message":"lời biện hộ","reasoning":"suy nghĩ thật"}`;
  }

  judgement(player: Player, state: GameState, observations: string[], accusedName: string, defenseSpeech: string, messages: DayMessage[]): string {
    const convo = messages.length ? `\nTóm tắt thảo luận ban ngày:\n${messages.slice(-8).map(m => `${m.playerName}: "${m.message}"`).join('\n')}` : '';
    return `${taskContext(observations)}
${this.judgementHint(player, state)}${convo}
PHÁN XÉT: ${accusedName} vừa biện hộ: "${defenseSpeech}"
Vote "kill" (giết) hoặc "spare" (tha). Cần >50% vote giết để treo cổ.
JSON: {"verdict":"kill"|"spare","reasoning":"lý do ngắn"}`;
  }
}

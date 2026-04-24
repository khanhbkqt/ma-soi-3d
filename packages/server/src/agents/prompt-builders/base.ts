import { Role, Player, GameState, Phase, DayMessage, isWolfRole } from '@ma-soi/shared';
import { compressedMemoryPrompt } from '../memory-compression.js';

// ── Shared helpers ──

export function roleNameVi(role: Role): string {
  const map: Record<Role, string> = {
    [Role.Werewolf]: 'Sói',
    [Role.AlphaWolf]: 'Sói Đầu Đàn',
    [Role.WolfCub]: 'Sói Con',
    [Role.Villager]: 'Dân',
    [Role.Seer]: 'Tiên Tri',
    [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự',
    [Role.Witch]: 'Phù Thủy',
    [Role.Hunter]: 'Thợ Săn',
    [Role.Guard]: 'Bảo Vệ',
    [Role.Cupid]: 'Thần Tình Yêu',
    [Role.Fool]: 'Kẻ Ngốc',
  };
  return map[role] || role;
}

export function phaseNameVi(phase: Phase | string): string {
  const map: Record<string, string> = {
    [Phase.Night]: 'Ban đêm',
    [Phase.Dawn]: 'Rạng sáng',
    [Phase.Day]: 'Ban ngày',
    [Phase.Dusk]: 'Hoàng hôn',
    [Phase.Judgement]: 'Phán xét',
    [Phase.GameOver]: 'Kết thúc',
  };
  return map[phase] || String(phase);
}

/** Role description registry — extensible: add new roles here, gameRules() picks them up automatically. */
export const roleDescriptions: Record<Role, string> = {
  [Role.Werewolf]: 'Sói — mỗi đêm cùng bầy sói vote chọn 1 người để cắn chết.',
  [Role.AlphaWolf]: 'Sói Đầu Đàn — có thể lây nhiễm 1 người (biến thành sói), dùng 1 lần cả game.',
  [Role.WolfCub]: 'Sói Con — nếu chết, đêm sau bầy sói được cắn 2 người thay vì 1.',
  [Role.Villager]: 'Dân — không có kỹ năng đặc biệt, dùng logic và suy luận để tìm sói.',
  [Role.Seer]: 'Tiên Tri — mỗi đêm soi 1 người, biết người đó LÀ SÓI hay KHÔNG PHẢI SÓI.',
  [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự — kế thừa khả năng soi khi Tiên Tri chính chết.',
  [Role.Witch]:
    'Phù Thủy — có 1 bình cứu (cứu người bị sói cắn) và 1 bình độc (giết 1 người). Mỗi bình dùng 1 lần cả game.',
  [Role.Hunter]: 'Thợ Săn — khi chết (trừ bị Phù Thủy đầu độc), được bắn chết 1 người bất kỳ.',
  [Role.Guard]:
    'Bảo Vệ — mỗi đêm chọn 1 người để bảo vệ khỏi sói cắn. Không được bảo vệ cùng 1 người 2 đêm liên tiếp.',
  [Role.Cupid]:
    'Thần Tình Yêu — đêm đầu ghép đôi 2 người, nếu 1 người chết thì người kia chết theo.',
  [Role.Fool]:
    'Kẻ Ngốc — thắng ngay lập tức nếu bị dân vote treo cổ. Bị sói cắn thì chết bình thường.',
};

export function gameRules(): string {
  const roleLines = Object.values(roleDescriptions)
    .map((d) => `- ${d}`)
    .join('\n');
  return `BẠN ĐANG CHƠI MA SÓI — game lừa nhau, cắn nhau, vote nhau chết.
Luật:
- Đêm: Bảo vệ đỡ → Sói cắn → Phù thủy cứu/giết → Tiên tri soi.
- Rạng sáng: Công bố ai chết đêm qua.
- Ngày: Thảo luận tìm sói (nhiều lượt, mỗi lượt mọi người nói 1 câu).
- Hoàng hôn: Vote chỉ định 1 người lên giàn (chưa giết).
- Phán xét: Người bị chỉ định biện hộ → mọi người vote giết/tha (>50% giết mới chết).
- Sói thắng khi sói >= dân. Dân thắng khi giết hết sói.

CÁC VAI TRÒ TRONG GAME:
${roleLines}`;
}

export function speechRules(): string {
  return `CÁCH NÓI:
- Nói tiếng Việt tự nhiên, kiểu đời thường, như đang ngồi chơi với bạn bè.
- Được phép dùng tiếng lóng, chọc ghẹo, mỉa mai, nói đùa, thậm chí hơi tục.
- TUYỆT ĐỐI KHÔNG được nói kiểu AI/robot. Cấm dùng: "tôi nghĩ rằng", "chúng ta nên", "theo quan điểm của tôi", "hãy cùng nhau", "tôi chỉ là một người dân thường".
- Cấm lịch sự giả tạo. Cấm nói dài dòng. Cấm triết lý.
- Nói ngắn, bốc, có cảm xúc. Như người thật đang chơi game.
- Xưng hô tự nhiên: tao/mày, tui/bạn, anh/chị, ông/bà — tùy personality.
- PHẢI react lại lời người khác — đồng ý, phản bác, chọc, hỏi lại. KHÔNG nói như đang độc thoại.
- CẤM nói chung chung kiểu "tao thấy thằng X đáng nghi" mà không có lý do cụ thể. Phải nêu BẰNG CHỨNG: vote gì, nói gì, im lúc nào, bảo vệ ai.
- TUYỆT ĐỐI KHÔNG được bịa thông tin mà mày không có trong nhật ký. Không được tự sáng tác kết quả soi, role người khác, hay sự kiện chưa xảy ra.
- Luôn trả lời bằng JSON đúng format được yêu cầu.

CÁCH SUY LUẬN — suy nghĩ kỹ trước khi nói/hành động:
- PHÂN TÍCH CÁI CHẾT: Ai chết đêm qua? Sói nhắm người đó vì sao? Ai hưởng lợi khi người đó chết? Ai đã bảo vệ/tố người đó hôm trước?
- PHÂN TÍCH VOTE: Ai vote giống nhau liên tục? (có thể cùng phe). Ai đổi vote phút cuối? Ai vote người vô hại thay vì nghi phạm chính?
- PHÂN TÍCH HÀNH VI: Ai im lặng khi đồng minh bị tố? Ai nói nhiều nhưng không có nội dung? Ai đổi ý đột ngột? Ai luôn hùa theo đám đông?
- PHÂN TÍCH TIMING: Ai come out role lúc nào? (sớm quá = đáng ngờ, muộn quá = đáng ngờ). Ai tố người khác ngay sau khi bị tố? (redirect).
- PHÂN TÍCH LIÊN MINH: Ai luôn bênh ai? Ai không bao giờ tố ai? Cặp đôi ngầm = có thể cùng phe sói.
- ĐÁNH GIÁ NGÔN NGỮ KHÁCH QUAN: Khi ai đó nói "cắn X", "X bị cắn", "đêm qua cắn"... ĐỪNG vội kết luận người đó là sói! Trong Ma Sói, BẤT KỲ AI cũng có thể dùng ngôn ngữ này để bluff, đánh lạc hướng, hoặc test phản ứng. Đánh giá dựa trên TỔNG THỂ hành vi (vote pattern, logic, timing) chứ không phải chỉ vì dùng từ "cắn".`;
}

export function informationRules(): string {
  return `⛔ LUẬT THÔNG TIN — VI PHẠM = PHẠM LUẬT GAME:
1. CHỈ ĐƯỢC dùng thông tin có trong NHẬT KÝ và PHÂN TÍCH ROLE. TUYỆT ĐỐI KHÔNG tự sáng tác.
2. KHÔNG BỊA kết quả soi, role người khác, ai claim gì, ai vote gì — nếu không có trong nhật ký.
3. Khi tố ai "claim role X" → PHẢI có bằng chứng: "vòng N, thằng A nói...". Không có bằng chứng = không được tố.
4. Nếu nhớ lờ mờ → nói "tao nhớ không rõ" thay vì bịa chi tiết cụ thể.
5. KHÔNG vô ý tiết lộ thông tin bí mật (kết quả soi chính xác, ai mày bảo vệ) trừ khi chủ ý come out. Tuy nhiên, nói kiểu "cắn X", "X bị cắn" như chiến thuật bluff/đánh lạc hướng là HOÀN TOÀN HỢP LỆ — đây là một phần của game.
6. Các phát biểu cùng lượt là ĐỒNG THỜI — không ai "reply" ai trong cùng lượt. Chỉ reply lại phát biểu từ LƯỢT TRƯỚC.`;
}

export function playerContext(player: Player, state: GameState): string {
  const alive = state.players.filter((p) => p.alive);
  const dead = state.players.filter((p) => !p.alive);
  const phaseVi = phaseNameVi(state.phase);
  let roundContext = `Vòng ${state.round} | ${phaseVi}.`;
  if (state.round === 1) roundContext += ` (Vòng đầu tiên.)`;

  let coupleInfo = '';
  if (state.couple) {
    const { player1Id, player2Id } = state.couple;
    const partnerId =
      player.id === player1Id ? player2Id : player.id === player2Id ? player1Id : null;
    if (partnerId) {
      const partner = state.players.find((p) => p.id === partnerId);
      if (partner)
        coupleInfo = `\nGHÉP ĐÔI: Mày đang bị ghép đôi với ${partner.name}. Nếu ${partner.name} chết → mày cũng chết! BẢO VỆ NHAU!`;
    }
  }

  // Role distribution summary (counts only, no player-role mapping)
  const roleCounts = new Map<string, number>();
  for (const p of state.players) {
    const name = roleNameVi(p.role);
    roleCounts.set(name, (roleCounts.get(name) || 0) + 1);
  }
  const distStr = [...roleCounts.entries()].map(([r, c]) => `${c} ${r}`).join(', ');

  const teamVi = isWolfRole(player.role) ? 'Sói' : 'Dân';
  return `Mày là "${player.name}" — ${roleNameVi(player.role)} (phe ${teamVi}).
Game có ${state.players.length} người chơi. Phân bố role: ${distStr}.
${roundContext}
Còn sống (${alive.length}): ${alive.map((p) => p.name).join(', ')}.
${dead.length ? `Đã chết: ${dead.map((p) => `${p.name}(${roleNameVi(p.role)})`).join(', ')}.` : 'Chưa ai chết.'}${coupleInfo}`;
}

export function personalityPrompt(player: Player): string {
  return `TÍNH CÁCH CỦA MÀY: "${player.personality.trait}" — ${player.personality.speechStyle}. Giữ đúng tính cách này MỌI LÚC.`;
}

export function memoryPrompt(observations: string[], deductionBlock?: string): string {
  return compressedMemoryPrompt(observations, deductionBlock);
}

export function conversationBlock(messages: DayMessage[]): string {
  if (!messages.length) return '\nChưa ai nói gì. Mày nói trước đi.';
  return `\nCuộc nói chuyện:\n${messages.map((m) => `${m.playerName}: "${m.message}"`).join('\n')}`;
}

// ── System prompt = heavy context (reused across all LLM calls for a player) ──

export function systemContext(player: Player, state: GameState, roleHint: string): string {
  return `${gameRules()}

${speechRules()}

${informationRules()}

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
  discuss(
    player: Player,
    state: GameState,
    observations: string[],
    messages: DayMessage[],
    round: number,
  ): string;
  vote(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string;
  defense(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string;
  judgement(
    player: Player,
    state: GameState,
    observations: string[],
    accusedName: string,
    defenseSpeech: string,
    messages: DayMessage[],
  ): string;
}

// ── Default implementations for day-phase prompts ──

export abstract class BasePromptBuilder implements PromptBuilder {
  /** Override: role-specific identity + strategy for system prompt */
  abstract roleIdentity(player: Player, state: GameState): string;

  /** Override: role-specific discussion strategy */
  abstract discussionHint(player: Player, state: GameState): string;

  /** Override for role-specific vote strategy */
  voteHint(_player: Player, _state: GameState): string {
    return `Suy nghĩ kỹ trước khi vote:
- Ai có hành vi đáng ngờ nhất? (lấp liếm, đổi ý, bảo vệ sói, im lặng bất thường)
- Vote pattern: ai vote giống sói đã bị lộ? ai luôn vote dân?
- Đừng vote theo đám đông mù quáng — sói hay dẫn dắt vote giết dân.`;
  }

  /** Override for role-specific defense strategy */
  defenseHint(_player: Player, _state: GameState): string {
    return `Mày bị đưa lên giàn! Biện hộ thuyết phục:
- Dùng bằng chứng cụ thể: vote pattern của mày nhất quán, mày đã tố đúng sói trước đó
- Chỉ ra ai đáng nghi hơn mày — đích danh + lý do
- Phân tích: ai tố mày? Động cơ của họ? Có phải sói đang frame mày?
- Come out role nếu cần (chỉ khi role quan trọng VÀ tình huống nguy cấp)`;
  }

  /** Override for role-specific judgement strategy */
  judgementHint(_player: Player, _state: GameState): string {
    return `Đánh giá lời biện hộ:
- Logic có chặt không? Có mâu thuẫn với lời nói/hành động trước đó không?
- Come out role có hợp lý không? Có ai khác đã claim role đó?
- Giết nhầm dân = sói lợi. Tha sói = dân thiệt. Cân nhắc kỹ bằng chứng.
- Cẩn thận Kẻ Ngốc — nó thắng khi bị treo cổ!`;
  }

  // ── System prompt: full context ──

  systemPrompt(player: Player, state: GameState): string {
    return systemContext(player, state, this.roleIdentity(player, state));
  }

  // ── Day-phase user prompts: task-specific only ──

  /** Override: first-round ice-breaker hint, context-aware */
  protected firstRoundHint(
    player: Player,
    state: GameState,
    messages: DayMessage[],
    round: number,
  ): string {
    const isOpener = messages.length === 0;
    const hasDeath = state.players.some((p) => !p.alive);

    if (isOpener) {
      // First speaker of first round — ice breaker
      return `\nVÒNG ĐẦU — MỞ MÀN:\nĐây là đầu game, chưa ai nói gì. Mày là người mở lời.\nĐỪNG vội tố ai — chưa có gì để tố. Hãy MỞ MÀN TỰ NHIÊN theo tính cách:\nGợi ý (CHỌN 1, đừng làm hết):\n- Chào theo kiểu riêng → "Ê tụi bây, đêm qua ngủ ngon hông?" / "Hmm... vậy là bắt đầu rồi"\n- Nhận xét bầu không khí → "Sao tao thấy mấy đứa mặt cú vậy?" / "Im lặng gì dữ vậy ta?"\n- Chia sẻ cảm giác → "Tao có linh cảm game này hấp dẫn lắm" / "${hasDeath ? 'Vừa có đứa chết mà sao tụi mày bình tĩnh quá' : 'Mới bắt đầu, chưa ai chết, vui quá'}"\n- Hỏi câu hỏi mở → "Ai có gì muốn nói trước không?" / "Có ai thấy gì lạ đêm qua không?"\nNÓI 1 CÂU NGẮN thôi, tự nhiên. Đừng phân tích, đừng tố, đừng dài dòng.\nNGOẠI LỆ VÒNG 1: Được phép nói cảm tính, nhận xét chung, đùa giỡn. Đây là phá băng, không phải lúc phân tích.`;
    }

    if (round === 1) {
      return `\nVÒNG ĐẦU — WARM UP:\nMới mở màn thôi, chưa có info nhiều. Đừng ép phải tố hay phân tích sâu.\n- React lại lời người vừa nói — đồng tình, cười, chọc lại, hỏi thêm\n- Có thể chia sẻ cảm giác mơ hồ: "Tao thấy ở đây có đứa giả trân lắm" hoặc "Hmm ai cũng hiền quá, nghi"\n- Nếu thật sự thấy gì lạ → nhận xét nhẹ. Nhưng KHÔNG CẦN PHẢI TỐ AI.\nNói tự nhiên, như đang tán gẫu ban đầu.\nNGOẠI LỆ VÒNG 1: Được phép nói cảm tính, nhận xét chung. Không cần bằng chứng cụ thể.`;
    }

    // Round 2+ in first game round
    return `\nVÒNG ĐẦU — BẮT ĐẦU PHÂN TÍCH:\nMọi người đã nói qua rồi. Bây giờ có thể bắt đầu nhận xét:\n- Ai nói đáng ngờ? Ai im quá? Ai cố tỏ ra vô hại?\n- React lại những gì mọi người đã nói — đồng ý, phản bác, hỏi dồn.\n- Vẫn chưa có NHIỀU info nên đừng chắc nịch. Nói kiểu "tao thấy hơi lạ" thay vì "nó chắc chắn là sói".`;
  }

  discuss(
    player: Player,
    state: GameState,
    observations: string[],
    messages: DayMessage[],
    round: number,
  ): string {
    const lastRound = round === state.config.discussionRounds;
    const dead = state.players.filter((p) => !p.alive);
    const hasDeath = dead.length > 0;
    const isFirstRound = state.round === 1;
    const r1Hint = isFirstRound ? this.firstRoundHint(player, state, messages, round) : '';
    const deathHint =
      hasDeath && round === 1 && !isFirstRound
        ? `\nCÓ NGƯỜI CHẾT — suy luận trước khi nói: Ai chết? Tại sao sói chọn người đó? Ai hưởng lợi? Ai hôm qua bảo vệ/tố người chết? Dùng info này để tố hoặc bênh ai đó.`
        : '';
    const midHint =
      !lastRound && round > 1 && !isFirstRound
        ? '\nGIỮA GAME: React lại lời người khác — đồng ý, phản bác, hoặc hỏi dồn. Chỉ ra mâu thuẫn nếu thấy. Đừng lặp lại ý cũ.'
        : '';
    const lastHint = lastRound
      ? '\nLƯỢT CUỐI: Kết luận dứt khoát. Chỉ đích danh 1 người đáng nghi nhất + lý do cụ thể. Kêu gọi mọi người vote cùng nếu tự tin.'
      : '';
    const speakInstruction =
      isFirstRound && round <= 1
        ? 'NÓI 1-2 CÂU, thoải mái tự nhiên. Vòng đầu không cần phải tố ai.'
        : 'NÓI 1-2 CÂU NGẮN, tự nhiên. PHẢI react lại lời người khác nếu có. KHÔNG nói chung chung.';
    return `${taskContext(observations)}
${this.discussionHint(player, state)}${r1Hint}${deathHint}${midHint}${lastHint}
Lượt thảo luận ${round}/${state.config.discussionRounds}.${conversationBlock(messages)}
TRƯỚC KHI NÓI, suy nghĩ trong "reasoning":
- Ai đáng nghi nhất hiện tại? Bằng chứng gì?
- Người vừa nói có điểm gì đáng chú ý? Mâu thuẫn? Lấp liếm?
- Mày nên tố, bênh, hỏi, hay im?
${speakInstruction}
Nếu không có gì mới → wantToSpeak: false.
JSON: {"wantToSpeak":true/false,"message":"câu nói (bỏ trống nếu skip)","reasoning":"phân tích chi tiết tình huống hiện tại"}`;
  }

  vote(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    const convo = messages.length
      ? `Tóm tắt thảo luận:\n${messages
          .slice(-12)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}`
      : '';
    return `${taskContext(observations)}
${this.voteHint(player, state)}
${convo}
HOÀNG HÔN — vote chỉ định 1 người lên giàn (chưa giết, chỉ đưa lên để biện hộ).
TRƯỚC KHI VOTE, suy luận trong "reasoning":
- Ai bị tố nhiều nhất trong thảo luận? Lý do có thuyết phục không?
- Vote pattern các vòng trước: ai vote giống nhau? ai vote lạ?
- Ai hưởng lợi nếu người bị tố chết? Có ai đang dẫn dắt vote để giết dân không?
- Ai im lặng bất thường? Ai nói nhiều nhưng không có nội dung?
- Mày có nên vote theo đám đông hay tách ra vote người khác?
Vote 1 người, hoặc "skip". Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"target":"Tên"|"skip","reasoning":"phân tích chi tiết trước khi vote"}`;
  }

  defense(
    player: Player,
    state: GameState,
    observations: string[],
    messages: DayMessage[],
  ): string {
    const convo = messages.length
      ? `\nThảo luận trước đó:\n${messages
          .slice(-8)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}`
      : '';
    return `${taskContext(observations)}
${this.defenseHint(player, state)}${convo}
MÀY ĐANG BỊ ĐƯA LÊN GIÀN! Mọi người sẽ vote giết hoặc tha mày sau khi nghe biện hộ.
TRƯỚC KHI BIỆN HỘ, suy luận trong "reasoning":
- Ai tố mày? Động cơ của họ là gì? Có phải sói đang frame mày không?
- Mày có bằng chứng cụ thể nào chứng minh vô tội? (vote pattern, hành vi nhất quán)
- Ai đáng nghi hơn mày? Chỉ đích danh + lý do.
- Nên come out role không? (chỉ khi role quan trọng VÀ tình huống nguy cấp)
NÓI 2-3 CÂU THUYẾT PHỤC. Dùng bằng chứng cụ thể, chỉ ra ai đáng nghi hơn, appeal to cả logic lẫn cảm xúc.
JSON: {"message":"lời biện hộ","reasoning":"phân tích tình huống + chiến thuật biện hộ"}`;
  }

  judgement(
    player: Player,
    state: GameState,
    observations: string[],
    accusedName: string,
    defenseSpeech: string,
    messages: DayMessage[],
  ): string {
    const convo = messages.length
      ? `\nTóm tắt thảo luận ban ngày:\n${messages
          .slice(-8)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}`
      : '';
    return `${taskContext(observations)}
${this.judgementHint(player, state)}${convo}
PHÁN XÉT: ${accusedName} vừa biện hộ: "${defenseSpeech}"
TRƯỚC KHI VOTE, đánh giá trong "reasoning":
- Lời biện hộ có logic không? Có mâu thuẫn với những gì ${accusedName} nói/làm trước đó không?
- ${accusedName} có come out role không? Nếu có — role đó có hợp lý không? Có ai khác đã claim role đó chưa?
- Nếu ${accusedName} chết, phe nào hưởng lợi? Giết nhầm dân = sói thắng gần hơn.
- ${accusedName} có phải là Kẻ Ngốc không? (Kẻ Ngốc thắng khi bị treo cổ — cẩn thận!)
- Bằng chứng tố ${accusedName} có đủ mạnh không? Hay chỉ là đám đông hùa nhau?
Vote "kill" (giết) hoặc "spare" (tha). Cần >50% vote giết để treo cổ.
JSON: {"verdict":"kill"|"spare","reasoning":"phân tích chi tiết lời biện hộ + bằng chứng"}`;
  }
}

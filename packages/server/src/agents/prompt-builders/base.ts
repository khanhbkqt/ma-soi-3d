import { Role, Player, GameState, Phase, DayMessage, isWolfRole } from '@ma-soi/shared';
import { compressedMemoryPrompt } from '../memory-compression.js';

// ── Shared helpers ──

export function hasFool(state: GameState): boolean {
  return state.players.some((p) => p.role === Role.Fool);
}

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
- KHÔNG được dùng nguyên văn các từ khóa kỹ thuật như "bằng chứng cứng", "bằng chứng mềm", "bằng chứng trung bình" trong câu nói. Hãy diễn đạt chúng sang ngôn ngữ tự nhiên (Ví dụ: "tao tận mắt thấy", "mày toàn suy đoán cảm tính", "hành động của nó đáng ngờ").
- TUYỆT ĐỐI KHÔNG được bịa thông tin mà mày không có trong nhật ký. Không được tự sáng tác kết quả soi, role người khác, hay sự kiện chưa xảy ra.
- KHÔNG TỰ NHẬN ROLE (come out) trừ khi chủ ý chiến thuật. Tránh vô tình hint role bằng từ ngữ chuyên biệt (VD: đừng nói "tao soi" nếu chưa come out Tiên Tri, đừng nói "tao đỡ" nếu chưa come out Bảo Vệ). Come out sai thời điểm = sói biết mày là ai → cắn đêm sau.
- Luôn trả lời bằng JSON đúng format được yêu cầu.

CÁCH SUY LUẬN — suy nghĩ kỹ trước khi nói/hành động:
- PHÂN TÍCH CÁI CHẾT: Ai chết đêm qua? Sói nhắm người đó vì sao? Ai hưởng lợi khi người đó chết? Ai đã bảo vệ/tố người đó hôm trước?
- PHÂN TÍCH VOTE: Ai vote giống nhau liên tục? (có thể cùng phe). Ai đổi vote phút cuối? Ai vote người vô hại thay vì nghi phạm chính?
- PHÂN TÍCH HÀNH VI: Ai im lặng khi đồng minh bị tố? Ai nói nhiều nhưng không có nội dung? Ai đổi ý đột ngột? Ai luôn hùa theo đám đông?
- PHÂN TÍCH TIMING: Ai come out role lúc nào? (sớm quá = đáng ngờ, muộn quá = đáng ngờ). Ai tố người khác ngay sau khi bị tố? (redirect).
- PHÂN TÍCH LIÊN MINH: Ai luôn bênh ai? Ai không bao giờ tố ai? Cặp đôi ngầm = có thể cùng phe sói.
- ĐÁNH GIÁ NGÔN NGỮ KHÁCH QUAN: Khi ai đó nói "cắn X", "X bị cắn", "đêm qua cắn"... ĐỪNG vội kết luận người đó là sói! Trong Ma Sói, BẤT KỲ AI cũng có thể dùng ngôn ngữ này để bluff, đánh lạc hướng, hoặc test phản ứng. Đánh giá dựa trên TỔNG THỂ hành vi (vote pattern, logic, timing) chứ không phải chỉ vì dùng từ "cắn".

TỰ PHẢN BIỆN (suy nghĩ nội bộ trước khi trả lời, KHÔNG viết ra):
Trước khi viết "message", tự hỏi TRONG ĐẦU:
1. Câu này có vô tình lộ role/thông tin bí mật không? (sói nói "cắn" kèm chi tiết đêm, TT nói "soi" khi chưa come out, Bảo Vệ nói "đỡ")
2. Câu này có rập khuôn/giống AI không? Có quá lịch sự, quá dài, hay quá chung chung không?
3. Câu này có đúng TÍNH CÁCH đã gán không? Giọng điệu có nhất quán không?
4. Nếu có vấn đề → SỬA LẠI trước khi đưa vào "message". Chỉ đưa bản đã sửa vào "message".`;
}

export function informationRules(): string {
  return `⛔ LUẬT THÔNG TIN — VI PHẠM = PHẠM LUẬT GAME:
1. CHỈ ĐƯỢC dùng thông tin có trong NHẬT KÝ và SỔ TAY SỰ KIỆN HỆ THỐNG. TUYỆT ĐỐI KHÔNG tự sáng tác.
2. KHÔNG BỊA kết quả soi, role người khác, ai claim gì, ai vote gì. Tuyệt đối không tự suy diễn hoặc tin lời người khác về việc ai đó đã nhận chức năng (claim role) nếu điều đó không có trong Sổ tay Sự kiện Hệ thống.
3. Khi tố ai "claim role X" → PHẢI có bằng chứng ghi nhận trong Sổ tay Sự kiện Hệ thống. Không có bằng chứng trong sổ tay = không được tố, coi như lời nói dối.
4. Nếu nhớ lờ mờ → nói "tao nhớ không rõ" thay vì bịa chi tiết cụ thể.
5. KHÔNG vô ý tiết lộ thông tin bí mật (kết quả soi chính xác, ai mày bảo vệ) trừ khi chủ ý come out. Tuy nhiên, nói kiểu "cắn X", "X bị cắn" như chiến thuật bluff/đánh lạc hướng là HOÀN TOÀN HỢP LỆ — đây là một phần của game.
6. Các phát biểu cùng lượt là ĐỒNG THỜI — không ai "reply" ai trong cùng lượt. Chỉ reply lại phát biểu từ LƯỢT TRƯỚC.`;
}

export function criticalThinkingRules(): string {
  return `ĐÁNH GIÁ ĐỘ TIN CẬY — BẮT BUỘC trước khi tin bất kỳ ai:
PHÂN LOẠI BẰNG CHỨNG:
- CỨNG (tin được): Tiên Tri soi ra sói/dân, role lộ khi chết, tự mình chứng kiến (đêm sói bàn bạc).
- TRUNG BÌNH: Vote pattern nhất quán qua nhiều vòng, ai đó tố đúng sói trước đó, hành vi bênh/chống rõ ràng.
- MỀM (dễ giả): Claim role (AI NÀO CŨNG CLAIM ĐƯỢC), lời tố cáo không có bằng chứng, "linh cảm", im lặng, nói nhiều.
- KHÔNG CÓ GIÁ TRỊ: Đám đông hùa nhau, "mọi người đều nghĩ vậy", cảm tính.

NGUYÊN TẮC PHẢN BIỆN — TỰ HỎI TRONG ĐẦU:
1. "Ai đang HƯỞNG LỢI từ việc mình tin điều này?" — Sói giỏi nhất là sói dẫn dắt dân tin sai.
2. "Nếu điều ngược lại đúng thì sao?" — Ai đó claim Tiên Tri → nếu nó là sói fake thì pattern gì? Nếu nó thật thì pattern gì? Pattern nào khớp hơn?
3. "Bằng chứng này thuộc loại gì?" — Bằng chứng CỨNG mới đáng tin. Bằng chứng MỀM chỉ nên là gợi ý, KHÔNG phải kết luận.
4. "Đã có ai bị CHẾT OAN vì logic tương tự chưa?" — Nếu vòng trước treo nhầm dân bằng cùng kiểu lập luận → CẢNH GIÁC.
5. "Mình đang bị dẫn dắt không?" — Ai nói mạnh nhất chưa chắc đúng nhất. Sói thường TỎ RA tự tin để lái vote.

ANTI-BANDWAGON (CHỐNG HÙA THEO):
- 3 người tố 1 người ≠ người đó là sói. Có thể 2 trong 3 là sói đang frame.
- Đám đông vote ai → DỪNG LẠI, tự suy nghĩ: "Tao có bằng chứng riêng không, hay tao đang bị kéo theo?"
- Nếu KHÔNG có bằng chứng riêng → TÁCH RA, vote người khác hoặc skip. Hùa theo vô cớ = dân chết oan.`;
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

${criticalThinkingRules()}

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
    const foolWarn = hasFool(_state)
      ? '\n- ⚠ NHỚ: Game có Kẻ Ngốc — nó thắng khi bị treo cổ. Đưa người lên giàn mà không có bằng chứng cứng = rủi ro tặng win cho Kẻ Ngốc.'
      : '';
    return `CHECKPOINT TRƯỚC KHI VOTE — bắt buộc tự hỏi:
1. Bằng chứng tố người này thuộc loại gì? (CỨNG/TRUNG BÌNH/MỀM?) Nếu chỉ có MỀM → cân nhắc kỹ.
2. Mày có bằng chứng RIÊNG hay đang vote theo người khác? Không có bằng chứng riêng = đang bị dẫn dắt.
3. Người dẫn dắt vote có ĐỘ TIN CẬY cao không? (xem SỔ TAY SỰ KIỆN HỆ THỐNG) Hay nó có thể là sói đang frame?
4. Nếu người bị vote là dân thì sao? Phe nào hưởng lợi? Giết nhầm dân = sói lợi 2 lần.
5. Vote pattern: ai vote giống sói đã bị lộ? ai luôn vote dân?
- Đừng vote theo đám đông mù quáng — sói hay dẫn dắt vote giết dân.${foolWarn}`;
  }

  /** Override for role-specific defense strategy */
  defenseHint(_player: Player, _state: GameState): string {
    return `Mày bị đưa lên giàn! Biện hộ thuyết phục:
- Dùng bằng chứng cụ thể: vote pattern của mày nhất quán, mày đã tố đúng sói trước đó
- Chỉ ra ai đáng nghi hơn mày — đích danh + lý do
- Phân tích: ai tố mày? Động cơ của họ? Có phải sói đang frame mày?
COME OUT ROLE? CÂN NHẮC KỸ:
- Come out role quan trọng (Tiên Tri, Bảo Vệ, Phù Thủy) = SÓI BIẾT MÀY LÀ AI → cắn đêm sau → mất role.
- MẶC ĐỊNH: biện hộ bằng logic như Dân thường. KHÔNG come out.
- CHỈ come out khi: (1) role đã hết skill/giá trị, (2) info đủ quan trọng để sacrifice sống sót, (3) có kẻ khác claim cùng role phải phản bác.
- Nếu quyết định KHÔNG come out → biện hộ bằng vote pattern, hành vi nhất quán, chỉ ra kẻ đáng nghi hơn.`;
  }

  /** Override for role-specific judgement strategy */
  judgementHint(_player: Player, _state: GameState): string {
    const foolWarn = hasFool(_state)
      ? `

⚠ CẢNH BÁO KẺ NGỐC — GAME CÓ KẺ NGỐC, NÓ THẮNG NGAY KHI BỊ TREO CỔ:
- Kẻ Ngốc KHÔNG diễn ngu hay xin treo. Nó chơi GIỐNG SÓI ĐANG CỐ GIẤU: redirect khi bị hỏi, vote lệch có chủ đích, bênh sai người, tạo mâu thuẫn nhẹ giữa các vòng.
- Nếu bằng chứng chỉ là "hành vi đáng ngờ" mà KHÔNG CÓ bằng chứng cứng (Tiên Tri soi ra sói, lộ role sói khi chết, tự nhận sói) → rủi ro Kẻ Ngốc RẤT CAO.
- Khi không chắc chắn → vote THA an toàn hơn. Treo nhầm Kẻ Ngốc = THUA NGAY LẬP TỨC cho tất cả.`
      : '';
    return `ĐÁNH GIÁ BIỆN HỘ — framework bắt buộc:
1. Bằng chứng TỐ người này thuộc loại gì? CỨNG (soi ra sói, lộ role) hay MỀM (hành vi, đám đông tố)? Chỉ bằng chứng CỨNG mới đáng vote GIẾT.
2. Lời biện hộ có logic không? Có mâu thuẫn với lời nói/hành động trước đó không?
3. Nếu come out role → cross-check: có ai khác claim cùng role? Timing come out hợp lý? Vote pattern trước khi claim có khớp?
4. Ai TỐ người này? Kiểm tra ĐỘ TIN CẬY của người tố (xem SỔ TAY SỰ KIỆN HỆ THỐNG). Sói hay tố dân để frame.
5. NGUYÊN TẮC QUYẾT ĐOÁN: Suy luận từ hành vi (vote pattern, lấp liếm, lật lọng) chính là vũ khí chính. Đừng bao giờ chờ đợi 'bằng chứng cứng' 100%. Nếu thấy hành vi của một người có mùi Sói, hãy mạnh dạn vote GIẾT (kill). Tha (spare) liên tục sẽ khiến dân làng thua cuộc vì bị sói tỉa dần mỗi đêm.${foolWarn}`;
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
    const hasSpoken = messages.some((m) => m.playerId === player.id);
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
    const skipRule = hasSpoken
      ? 'Nếu không có gì mới → wantToSpeak: false.'
      : 'MÀY CHƯA NÓI GÌ VÒNG NÀY. Phải wantToSpeak: true — nêu ý kiến, tố ai đó, hoặc bình luận.';
    return `${taskContext(observations)}
${this.discussionHint(player, state)}${r1Hint}${deathHint}${midHint}${lastHint}
Lượt thảo luận ${round}/${state.config.discussionRounds}.${conversationBlock(messages)}
TRƯỚC KHI NÓI, suy nghĩ NỘI BỘ (không viết ra):
- Ai đáng nghi nhất hiện tại? Bằng chứng GÌ và thuộc loại NÀO (CỨNG/TRUNG BÌNH/MỀM)?
- Người vừa nói có điểm gì đáng chú ý? Mâu thuẫn? Lấp liếm?
- Ai đang dẫn dắt cuộc thảo luận? Người đó có ĐỘ TIN CẬY cao không? (xem SỔ TAY SỰ KIỆN HỆ THỐNG)
- Có ai claim role mà chưa bị verify không? Claim = bằng chứng MỀM — đừng tin ngay.
- Nếu mày định tố ai — bằng chứng của mày thuộc loại gì? MỀM → nói "tao thấy hơi nghi" thay vì "nó là sói".
- Có giả thuyết đối nghịch nào giải thích hành vi đáng ngờ không? (VD: im lặng ≠ sói, có thể đang giấu role quan trọng)
- Mày nên tố, bênh, hỏi, hay im?
- Tự phản biện câu nói trước khi chốt.
${speakInstruction}
${skipRule}
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","wantToSpeak":true/false,"message":"câu nói (bỏ trống nếu skip)"}`;
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
TRƯỚC KHI VOTE, suy luận NỘI BỘ (không viết ra):
- Ai bị tố nhiều nhất? Nhưng ĐÔNG NGƯỜI TỐ ≠ ĐÚNG. Kiểm tra: bằng chứng tố thuộc loại gì? Có ai có bằng chứng CỨNG không?
- Vote pattern các vòng trước: ai vote giống nhau? ai vote lạ?
- Ai hưởng lợi nếu người bị tố chết? Có ai đang dẫn dắt vote để giết dân không?
- Mày có bằng chứng RIÊNG hay đang bị kéo theo đám đông? Nếu không có bằng chứng riêng → tách ra.
- Ai im lặng bất thường? Ai nói nhiều nhưng không có nội dung?
- ĐỘ TIN CẬY: Người dẫn dắt vote có đáng tin không? (xem SỔ TAY SỰ KIỆN HỆ THỐNG)
Vote 1 người, hoặc "skip". Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","target":"Tên"|"skip"}`;
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
TRƯỚC KHI BIỆN HỘ, suy luận NỘI BỘ (không viết ra):
- Ai tố mày? Động cơ của họ là gì? Có phải sói đang frame mày không?
- Mày có bằng chứng cụ thể nào chứng minh vô tội? (vote pattern, hành vi nhất quán)
- Ai đáng nghi hơn mày? Chỉ đích danh + lý do.
- Nên come out role không? (chỉ khi role quan trọng VÀ tình huống nguy cấp)
NÓI 2-3 CÂU THUYẾT PHỤC. Dùng bằng chứng cụ thể, chỉ ra ai đáng nghi hơn, appeal to cả logic lẫn cảm xúc.
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","message":"lời biện hộ"}`;
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
TRƯỚC KHI VOTE, đánh giá NỘI BỘ (không viết ra):
- Lời biện hộ có logic không? Có mâu thuẫn với những gì ${accusedName} nói/làm trước đó không?
- ${accusedName} có come out role không? Nếu có — role đó có hợp lý không? Có ai khác đã claim role đó chưa?
- Nếu ${accusedName} chết, phe nào hưởng lợi? Giết nhầm dân = sói thắng gần hơn.${hasFool(state) ? `\n- ⚠ ${accusedName} có thể là Kẻ Ngốc! Kẻ Ngốc chơi GIỐNG SÓI (redirect, vote lệch, bênh sai người) chứ KHÔNG diễn ngu xin treo. Nếu không có bằng chứng cứng (soi ra sói, lộ role) → vote THA an toàn hơn. Treo Kẻ Ngốc = THUA NGAY.` : ''}
- Bằng chứng tố ${accusedName} có đủ mạnh không? Hay chỉ là đám đông hùa nhau?
Vote "kill" (giết) hoặc "spare" (tha). Cần >50% vote giết để treo cổ.
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","verdict":"kill"|"spare"}`;
  }
}

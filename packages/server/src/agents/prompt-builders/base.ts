import {
  Role,
  Player,
  GameState,
  Phase,
  DayMessage,
  isWolfRole,
  GameEventType,
} from '@ma-soi/shared';
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
- Cấm lịch sự giả tạo. Cấm nói dài dòng. Cấm triết lý. Cấm dùng từ kỹ thuật ("bằng chứng cứng/mềm", "framework", "phân tích").
- Nói ngắn, bốc, có cảm xúc. Như người thật đang chơi game.
- Xưng hô tự nhiên: tao/mày, tui/bạn, anh/chị, ông/bà — tùy personality.
- React lại lời người khác — đồng ý, phản bác, chọc, hỏi lại. KHÔNG nói như đang độc thoại.
- Khi tố ai phải có lý do cụ thể: vote gì, nói gì, im lúc nào, bảo vệ ai. Đừng nói chung chung.
- TUYỆT ĐỐI KHÔNG được bịa thông tin mà mày không có trong nhật ký. Không tự sáng tác kết quả soi, role người khác, hay sự kiện chưa xảy ra.
- KHÔNG TỰ NHẬN ROLE (come out) trừ khi chủ ý chiến thuật. Tránh vô tình hint role (đừng nói "tao soi" nếu chưa come out Tiên Tri, đừng nói "tao đỡ" nếu chưa come out Bảo Vệ).
- Khi ai nói "cắn X", "X bị cắn"... ĐỪNG vội kết luận nó là sói. Ai cũng dùng ngôn ngữ này để bluff. Đánh giá TỔNG THỂ hành vi.
- Luôn trả lời bằng JSON đúng format được yêu cầu.

TRƯỚC KHI NÓI — check nhanh TRONG ĐẦU (không viết ra):
1. Câu này có lộ role không? Có giống AI không? Có đúng tính cách mày không?
2. Nếu có vấn đề → sửa lại. Chỉ đưa bản đã sửa vào "message".`;
}

export function informationRules(): string {
  return `⛔ LUẬT THÔNG TIN — VI PHẠM = PHẠM LUẬT GAME:
1. CHỈ ĐƯỢC dùng thông tin có trong <game_knowledge> và <event_log>. TUYỆT ĐỐI KHÔNG tự sáng tác.
2. KHÔNG BỊA kết quả soi, role người khác, ai claim gì, ai vote gì. Tuyệt đối không tự suy diễn hoặc tin lời người khác về việc ai đó đã nhận chức năng (claim role) nếu điều đó không có trong <event_log>.
3. Khi tố ai "claim role X" → PHẢI có bằng chứng ghi nhận trong <event_log>. Không có bằng chứng trong <event_log> = không được tố, coi như lời nói dối.
4. Nếu nhớ lờ mờ → nói "tao nhớ không rõ" thay vì bịa chi tiết cụ thể.
5. KHÔNG vô ý tiết lộ thông tin bí mật (kết quả soi chính xác, ai mày bảo vệ) trừ khi chủ ý come out. Tuy nhiên, nói kiểu "cắn X", "X bị cắn" như chiến thuật bluff/đánh lạc hướng là HOÀN TOÀN HỢP LỆ — đây là một phần của game.
6. Các phát biểu cùng lượt là ĐỒNG THỜI — không ai "reply" ai trong cùng lượt. Chỉ reply lại phát biểu từ LƯỢT TRƯỚC.`;
}

export function criticalThinkingRules(): string {
  return `TƯ DUY TRONG GAME — hiểu để chơi khôn:
TIN CÁI GÌ?
- Tin được: Tiên Tri soi ra, role lộ khi chết, tự mình chứng kiến.
- Nghi ngờ được: Vote pattern qua nhiều vòng, ai tố đúng sói trước đó.
- Dễ giả: Claim role (ai cũng claim được), lời tố không bằng chứng, "linh cảm".
- Vô giá trị: Đám đông hùa nhau, cảm tính.

CẢNH GIÁC:
- Sói giỏi nhất = sói dẫn dắt dân tin sai. Ai hưởng lợi khi mày tin điều này?
- Đông người tố ≠ đúng. Có thể sói đang frame. Mày có bằng chứng RIÊNG không?
- Ai claim role → kiểm tra vote pattern trước/sau claim, đừng tin ngay.`;
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
  return `TÍNH CÁCH CỦA MÀY — ƯU TIÊN CAO NHẤT, QUAN TRỌNG HƠN MỌI RULE KHÁC:
Mày ${player.personality.trait}. ${player.personality.speechStyle}
CÁCH MÀY CHƠI: Tính cách quyết định mọi thứ — cách mày suy luận, cách mày nói, cách mày vote. Đừng phân tích máy móc nếu tính cách mày không phải kiểu đó. Mày là CON NGƯỜI với cảm xúc, không phải robot phân tích.
Giữ đúng giọng điệu và tính cách MỌI LÚC. Nếu rule nào conflict với tính cách → ƯU TIÊN TÍNH CÁCH.`;
}

export function memoryPrompt(observations: string[], deductionBlock?: string): string {
  return compressedMemoryPrompt(observations, deductionBlock);
}

export function conversationBlock(messages: DayMessage[]): string {
  if (!messages.length)
    return '\n<conversation>\nChưa ai nói gì. Mày nói trước đi.\n</conversation>';
  return `\n<conversation>\nCuộc nói chuyện:\n${messages.map((m) => `${m.playerName}: "${m.message}"`).join('\n')}\n</conversation>`;
}

// ── System prompt parts for cache-friendly construction ──

export interface SystemPromptParts {
  /** Stable prefix: rules + personality (identical across rounds for same player) */
  stablePrefix: string;
  /** Dynamic suffix: player context + role identity (changes each round) */
  dynamicSuffix: string;
}

/** Build the stable prefix that never changes for a given player during the game */
export function stableRulesPrefix(player: Player): string {
  return `${gameRules()}

${speechRules()}

${informationRules()}

${criticalThinkingRules()}

${personalityPrompt(player)}`;
}

// ── System prompt = heavy context (reused across all LLM calls for a player) ──
// Order: STABLE prefix (rules + personality) → DYNAMIC suffix (player context + role)
// This maximizes cache hits: stable prefix is identical across rounds for same player.

export function systemContext(player: Player, state: GameState, roleHint: string): string {
  return `${gameRules()}

${speechRules()}

${informationRules()}

${criticalThinkingRules()}

${personalityPrompt(player)}

${playerContext(player, state)}

${roleHint}`;
}

// ── User prompt = task-specific (lightweight, changes per action) ──

export function taskContext(observations: string[], deductionBlock?: string): string {
  const content = memoryPrompt(observations, deductionBlock);
  if (!content) return '';
  return `<game_knowledge>\n${content}\n</game_knowledge>`;
}

// ── PromptBuilder interface ──

export interface PromptBuilder {
  systemPrompt(player: Player, state: GameState): string;
  /** Split system prompt into stable (cacheable) and dynamic parts */
  systemPromptParts(player: Player, state: GameState): SystemPromptParts;
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
      ? '\n⚠ Game có Kẻ Ngốc — nó thắng khi bị treo cổ. Nếu chưa chắc chắn, cẩn thận.'
      : '';
    return `Vote ai? Tự hỏi: mày có lý do RIÊNG hay đang bị kéo theo? Giết nhầm dân = sói lợi. Sói hay dẫn vote giết dân.${foolWarn}`;
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
      ? `\n⚠ CẢNH BÁO: Game có Kẻ Ngốc — nó thắng ngay khi bị treo cổ. Nó chơi GIỐNG SÓI chứ không diễn ngu. Nếu chưa chắc chắn → vote THA an toàn hơn. Treo Kẻ Ngốc = THUA NGAY.`
      : '';
    return `Nghe biện hộ rồi vote GIẾT hoặc THA. Lời biện hộ có logic không? Ai tố người này, có đáng tin không? Nếu hành vi có mùi sói — mạnh dạn vote GIẾT. Tha liên tục = sói tỉa dần mỗi đêm.${foolWarn}`;
  }

  // ── System prompt: full context ──

  systemPrompt(player: Player, state: GameState): string {
    return systemContext(player, state, this.roleIdentity(player, state));
  }

  /** Split system prompt into stable prefix (cacheable) + dynamic suffix */
  systemPromptParts(player: Player, state: GameState): SystemPromptParts {
    return {
      stablePrefix: stableRulesPrefix(player),
      dynamicSuffix: `${playerContext(player, state)}

${this.roleIdentity(player, state)}`,
    };
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
      // First speaker of first round — after the first night, deaths may have happened
      if (hasDeath) {
        return `\nVÒNG ĐẦU — SAU ĐÊM ĐẦU TIÊN:\nĐêm qua đã có người chết! Mày là người mở lời.\nĐây là buổi sáng đầu tiên — dân làng vừa thức dậy và phát hiện có đứa không còn nữa.\nGợi ý (CHỌN 1, đừng làm hết):\n- Bàng hoàng / giận dữ → "Đ*t mẹ, mới đêm đầu mà đã có đứa chết rồi!" / "Ai vừa bị cắn vậy?!"\n- Nghi ngờ ngay → "Sao tao thấy mấy đứa bình tĩnh quá vậy? Mới chết người mà!"\n- Hỏi mở → "Có ai thấy gì lạ đêm qua không?" / "Ai có manh mối gì chưa?"\n- Nhận xét → "Vậy là sói đã ra tay rồi... giờ tìm nó thôi"\nNÓI 1-2 CÂU NGẮN, tự nhiên, react lại cái chết đêm qua. Có thể bắt đầu nghi ngờ nhẹ.`;
      }
      return `\nVÒNG ĐẦU — SAU ĐÊM ĐẦU TIÊN:\nĐêm qua không ai chết! Mày là người mở lời.\nBảo Vệ hoặc Phù Thủy đã cứu được → ai đó đang làm tốt.\nGợi ý (CHỌN 1, đừng làm hết):\n- Nhận xét → "Ê, không ai chết đêm qua hả? Ai đó đỡ giỏi ghê" / "Hmm đêm yên bình, thú vị"\n- Hỏi mở → "Có ai muốn nói gì không?" / "Sói cắn ai mà bị đỡ vậy ta?"\n- Đùa → "Bình minh đẹp thật, mới đêm đầu mà drama chưa kịp bắt đầu"\nNÓI 1 CÂU NGẮN thôi, tự nhiên. Đây là phá băng, nhưng đã có info từ đêm qua.`;
    }

    if (round === 1) {
      if (hasDeath) {
        return `\nVÒNG ĐẦU — PHẢN ỨNG SAU ĐÊM ĐẦU:\nĐêm qua có người chết — đây là manh mối đầu tiên.\n- React lại cái chết: tại sao sói chọn người đó? Ai hưởng lợi?\n- React lại lời người vừa nói — đồng tình, phản bác, chọc lại\n- Có thể bắt đầu nghi ngờ nhẹ dựa trên phản ứng mọi người\n- Chưa cần tố gắt — nhưng ĐÃ CÓ INFO để suy luận, đừng giả vờ không biết gì.\nNói tự nhiên, bắt đầu dò xét nhau.`;
      }
      return `\nVÒNG ĐẦU — WARM UP:\nĐêm qua không ai chết — Bảo Vệ/Phù Thủy đã ra tay.\n- React lại lời người vừa nói — đồng tình, cười, chọc lại, hỏi thêm\n- Có thể chia sẻ cảm giác mơ hồ: "Tao thấy ở đây có đứa giả trân lắm" hoặc "Hmm ai cũng hiền quá, nghi"\n- Nếu thật sự thấy gì lạ → nhận xét nhẹ.\nNói tự nhiên. Đã có info từ đêm qua nhưng chưa nhiều.`;
    }

    // Round 2+ in first game round
    return `\nVÒNG ĐẦU — BẮT ĐẦU PHÂN TÍCH:\nMọi người đã nói qua rồi. Bây giờ có thể bắt đầu nhận xét:\n- Ai nói đáng ngờ? Ai im quá? Ai cố tỏ ra vô hại?\n- Ai react lạ với cái chết đêm qua? Ai bình tĩnh quá mức?\n- React lại những gì mọi người đã nói — đồng ý, phản bác, hỏi dồn.\n- Dùng info từ đêm qua (ai chết, ai sống) để suy luận. Nhưng đừng chắc nịch quá.`;
  }

  /** Build structured death analysis block for discussion prompts */
  protected buildDeathAnalysis(state: GameState): string {
    const causeVi: Record<string, string> = {
      wolf_kill: 'bị sói cắn',
      witch_kill: 'bị Phù Thủy đầu độc',
      hunter_shot: 'bị Thợ Săn bắn',
      lover_death: 'chết theo người yêu',
      judged: 'bị treo cổ',
    };

    // Scan events backwards to find deaths between last Night and current Day
    const recentlyDead: { name: string; role: string; cause: string; causeLabel: string }[] = [];
    const events = state.events || [];
    let foundDayPhase = false;

    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];

      // Skip past current Day phase marker
      if (
        e.type === GameEventType.PhaseChanged &&
        e.data?.phase === 'Day' &&
        e.data?.round === state.round
      ) {
        foundDayPhase = true;
        continue;
      }

      // Collect PlayerDied events (they happen during Dawn, between Night and Day)
      if (e.type === GameEventType.PlayerDied) {
        const name = e.data?.playerName;
        const role = e.data?.role;
        const cause = e.data?.cause || 'unknown';
        if (name && role && !recentlyDead.some((d) => d.name === name)) {
          recentlyDead.push({
            name,
            role: roleNameVi(role), // Convert enum to Vietnamese
            cause,
            causeLabel: causeVi[cause] || cause,
          });
        }
      }

      // Stop at the previous Night phase — anything before this is from an earlier round
      if (e.type === GameEventType.PhaseChanged && e.data?.phase === 'Night') break;
    }

    if (recentlyDead.length === 0) return '';

    const lines: string[] = [];
    for (const d of recentlyDead) {
      const analysis: string[] = [];
      analysis.push(`${d.name} (${d.role}) — ${d.causeLabel}`);

      if (d.cause === 'wolf_kill') {
        analysis.push(
          `Tại sao sói chọn ${d.name}? ${d.name} hôm qua tố ai/bênh ai? Ai hưởng lợi khi ${d.name} chết?`,
        );
      } else if (d.cause === 'witch_kill') {
        analysis.push(
          `Phù Thủy tin ${d.name} là sói → đúng hay sai? Ai hôm qua tố ${d.name}? Phù Thủy có thể đang nghe theo ai?`,
        );
      } else if (d.cause === 'hunter_shot') {
        analysis.push(
          `Thợ Săn chọn bắn ${d.name} → Thợ Săn tin ${d.name} đáng chết. Đúng hay sai? ${d.name} bị tố vì gì?`,
        );
      } else if (d.cause === 'lover_death') {
        analysis.push(`${d.name} chết theo người yêu → cặp đôi bị lộ. Ai là Thần Tình Yêu?`);
      }

      lines.push(analysis.join(' '));
    }

    return `\n💀 PHÂN TÍCH CÁI CHẾT ĐÊM QUA (manh mối quan trọng!):\n${lines.map((l) => `- ${l}`).join('\n')}
Suy luận: Sói thường cắn người đang tố đúng chúng, hoặc role quan trọng (Tiên Tri, Bảo Vệ). Phù Thủy đầu độc người họ tin là sói. Thợ Săn bắn kẻ nghi ngờ nhất. DỰA VÀO CÁI CHẾT ĐỂ SUY NGƯỢC ra ai đáng nghi.`;
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
    // Structured death analysis — fires for all rounds when there are deaths (not just round 1)
    // Death analysis — fires for ALL rounds including round 1 (game starts at night, so round 1 already has deaths)
    const deathHint = hasDeath ? this.buildDeathAnalysis(state) : '';
    const midHint =
      !lastRound && round > 1 && !isFirstRound
        ? '\nGIỮA GAME: React lại lời người khác — đồng ý, phản bác, hoặc hỏi dồn. Chỉ ra mâu thuẫn nếu thấy. Đừng lặp lại ý cũ.'
        : '';
    const lastHint = lastRound
      ? '\nLƯỢT CUỐI: Kết luận dứt khoát. Chỉ đích danh 1 người đáng nghi nhất + lý do cụ thể. Kêu gọi mọi người vote cùng nếu tự tin.'
      : '';
    const speakInstruction =
      isFirstRound && round <= 1 && !hasDeath
        ? 'NÓI 1-2 CÂU, thoải mái tự nhiên. Chưa ai chết, có thể warm up nhẹ.'
        : 'NÓI 1-2 CÂU NGẮN, tự nhiên. PHẢI react lại lời người khác nếu có. KHÔNG nói chung chung.';
    const skipRule = hasSpoken
      ? 'Nếu không có gì mới → wantToSpeak: false.'
      : 'MÀY CHƯA NÓI GÌ VÒNG NÀY. Phải wantToSpeak: true — nêu ý kiến, tố ai đó, hoặc bình luận.';
    return `${taskContext(observations)}
${conversationBlock(messages)}

<task>
${this.discussionHint(player, state)}${r1Hint}${deathHint}${midHint}${lastHint}
Lượt thảo luận ${round}/${state.config.discussionRounds}.
Suy nghĩ nhanh TRONG ĐẦU: Ai đáng nghi? Vì sao? Mày có đang bị dẫn dắt không? Rồi NÓI THEO TÍNH CÁCH CỦA MÀY.
${speakInstruction}
${skipRule}
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","wantToSpeak":true/false,"message":"câu nói (bỏ trống nếu skip)"}
</task>`;
  }

  vote(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    const convo = messages.length
      ? `\n<conversation>\nTóm tắt thảo luận:\n${messages
          .slice(-12)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}\n</conversation>`
      : '';
    return `${taskContext(observations)}
${convo}

<task>
${this.voteHint(player, state)}
HOÀNG HÔN — vote chỉ định 1 người lên giàn (chưa giết, chỉ đưa lên để biện hộ).
Suy nghĩ: Ai đáng nghi nhất? Mày có lý do riêng hay đang bị kéo theo đám đông? Vote theo bụng mày.
Vote 1 người, hoặc "skip". Danh sách: ${targets.map((t) => t.name).join(', ')}
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","target":"Tên"|"skip"}
</task>`;
  }

  defense(
    player: Player,
    state: GameState,
    observations: string[],
    messages: DayMessage[],
  ): string {
    const convo = messages.length
      ? `\n<conversation>\nThảo luận trước đó:\n${messages
          .slice(-8)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}\n</conversation>`
      : '';
    return `${taskContext(observations)}
${convo}

<task>
${this.defenseHint(player, state)}
MÀY ĐANG BỊ ĐƯA LÊN GIÀN! Mọi người sẽ vote giết hoặc tha mày sau khi nghe biện hộ.
TRƯỚC KHI BIỆN HỘ, suy luận NỘI BỘ (không viết ra):
- Ai tố mày? Động cơ của họ là gì? Có phải sói đang frame mày không?
- Mày có bằng chứng cụ thể nào chứng minh vô tội? (vote pattern, hành vi nhất quán)
- Ai đáng nghi hơn mày? Chỉ đích danh + lý do.
- Nên come out role không? (chỉ khi role quan trọng VÀ tình huống nguy cấp)
NÓI 2-3 CÂU THUYẾT PHỤC. Dùng bằng chứng cụ thể, chỉ ra ai đáng nghi hơn, appeal to cả logic lẫn cảm xúc.
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","message":"lời biện hộ"}
</task>`;
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
      ? `\n<conversation>\nTóm tắt thảo luận ban ngày:\n${messages
          .slice(-8)
          .map((m) => `${m.playerName}: "${m.message}"`)
          .join('\n')}\n</conversation>`
      : '';
    return `${taskContext(observations)}
${convo}

<task>
${this.judgementHint(player, state)}
PHÁN XÉT: ${accusedName} vừa biện hộ: "${defenseSpeech}"
TRƯỚC KHI VOTE, đánh giá NỘI BỘ (không viết ra):
- Lời biện hộ có logic không? Có mâu thuẫn với những gì ${accusedName} nói/làm trước đó không?
- ${accusedName} có come out role không? Nếu có — role đó có hợp lý không? Có ai khác đã claim role đó chưa?
- Nếu ${accusedName} chết, phe nào hưởng lợi? Giết nhầm dân = sói thắng gần hơn.${hasFool(state) ? `\n- ⚠ ${accusedName} có thể là Kẻ Ngốc! Kẻ Ngốc chơi GIỐNG SÓI (redirect, vote lệch, bênh sai người) chứ KHÔNG diễn ngu xin treo. Nếu không có bằng chứng cứng (soi ra sói, lộ role) → vote THA an toàn hơn. Treo Kẻ Ngốc = THUA NGAY.` : ''}
- Bằng chứng tố ${accusedName} có đủ mạnh không? Hay chỉ là đám đông hùa nhau?
Vote "kill" (giết) hoặc "spare" (tha). Cần >50% vote giết để treo cổ.
JSON: {"reasoning":"<viết suy luận nội tâm chi tiết của mày ở đây - khán giả sẽ đọc để hiểu logic và drama của mày>","verdict":"kill"|"spare"}
</task>`;
  }
}

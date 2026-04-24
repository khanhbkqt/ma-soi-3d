import { Role, Player, GameState, Phase, DayMessage, isWolfRole, Team } from '@ma-soi/shared';

// ── Prompt Templates ──

function gameRules(): string {
  return `BẠN ĐANG CHƠI MA SÓI — game lừa nhau, cắn nhau, vote nhau chết.
Luật:
- Đêm: Bảo vệ đỡ → Sói cắn → Phù thủy cứu/giết → Tiên tri soi.
- Rạng sáng: Công bố ai chết.
- Ngày: Cãi nhau tìm sói.
- Hoàng hôn: Vote chỉ định 1 người lên giàn.
- Phán xét: Người bị chỉ định biện hộ → mọi người vote giết/tha.
- Sói thắng khi sói >= dân. Dân thắng khi giết hết sói.

VAI TRÒ ĐẶC BIỆT:
- Sói Đầu Đàn: lây nhiễm 1 người (biến thành sói, dùng 1 lần)
- Sói Con: nếu chết, đêm sau sói cắn 2 người
- Tiên Tri Tập Sự: kế thừa khi Tiên Tri chết
- Thần Tình Yêu: ghép đôi 2 người, 1 chết thì kia chết theo
- Kẻ Ngốc: thắng khi bị dân vote treo cổ

BẮT BUỘC:
- Nói tiếng Việt tự nhiên, kiểu đời thường, như đang ngồi chơi với bạn bè.
- Được phép dùng tiếng lóng, chọc ghẹo, mỉa mai, nói đùa, thậm chí hơi tục.
- TUYỆT ĐỐI KHÔNG được nói kiểu AI/robot. Cấm dùng: "tôi nghĩ rằng", "chúng ta nên", "theo quan điểm của tôi", "hãy cùng nhau", "tôi chỉ là một người dân thường".
- Cấm lịch sự giả tạo. Cấm nói dài dòng. Cấm triết lý.
- Nói ngắn, bốc, có cảm xúc. Như người thật đang chơi game.
- Xưng hô tự nhiên: tao/mày, tui/bạn, anh/chị, ông/bà — tùy personality.`;
}

function playerContext(player: Player, state: GameState): string {
  const alive = state.players.filter(p => p.alive);
  const dead = state.players.filter(p => !p.alive);
  const phaseVi = state.phase === Phase.Day ? 'Ban ngày' : state.phase === Phase.Night ? 'Ban đêm' : state.phase === Phase.Dusk ? 'Hoàng hôn' : state.phase === Phase.Judgement ? 'Phán xét' : state.phase === Phase.Dawn ? 'Rạng sáng' : state.phase;
  let roundContext = `Vòng ${state.round} | ${phaseVi}.`;
  if (state.round === 1) roundContext += ` (Vòng đầu, mới vào.)`;

  const teamVi = isWolfRole(player.role) ? 'Sói' : 'Dân';
  return `Mày là "${player.name}" (${roleNameVi(player.role)}, phe ${teamVi}).
Còn sống: ${alive.map(p => p.name).join(', ')}.
${dead.length ? `Đã chết: ${dead.map(p => `${p.name}(${roleNameVi(p.role)})`).join(', ')}.` : 'Chưa ai chết.'}
${roundContext}`;
}

function roleNameVi(role: Role): string {
  const map: Record<Role, string> = {
    [Role.Werewolf]: 'Sói', [Role.AlphaWolf]: 'Sói Đầu Đàn', [Role.WolfCub]: 'Sói Con',
    [Role.Villager]: 'Dân', [Role.Seer]: 'Tiên Tri', [Role.ApprenticeSeer]: 'Tiên Tri Tập Sự',
    [Role.Witch]: 'Phù Thủy', [Role.Hunter]: 'Thợ Săn', [Role.Guard]: 'Bảo Vệ',
    [Role.Cupid]: 'Thần Tình Yêu', [Role.Fool]: 'Kẻ Ngốc',
  };
  return map[role] || role;
}

function personalityPrompt(player: Player): string {
  return `Tính cách: "${player.personality.trait}" — ${player.personality.speechStyle}. Giữ đúng tính cách này khi nói.`;
}

function memoryPrompt(observations: string[]): string {
  if (!observations.length) return '';
  return `Mày nhớ:\n${observations.slice(-15).map(o => `- ${o}`).join('\n')}`;
}

// ── Action Prompts ──

export function wolfKillPrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
  const wolves = state.players.filter(p => p.alive && isWolfRole(p.role));
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
Đồng bọn sói: ${wolves.map(w => w.name).join(', ')}. Danh sách con mồi: ${targets.map(t => t.name).join(', ')}
Chọn 1 người để cắn đêm nay. Ưu tiên giết role nguy hiểm (Tiên tri, Phù thủy) nếu đoán được.
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
}

export function wolfDoubleKillPrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
  const wolves = state.players.filter(p => p.alive && isWolfRole(p.role));
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
SÓI CON ĐÃ CHẾT! Đêm nay sói được cắn 2 NGƯỜI để trả thù!
Đồng bọn sói: ${wolves.map(w => w.name).join(', ')}. Danh sách con mồi: ${targets.map(t => t.name).join(', ')}
Chọn 2 người để cắn.
JSON: {"target1":"Tên1","target2":"Tên2","reasoning":"lý do ngắn"}`;
}

export function alphaInfectPrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive && !isWolfRole(p.role));
  const wolves = state.players.filter(p => p.alive && isWolfRole(p.role));
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
MÀY LÀ SÓI ĐẦU ĐÀN. Mày có khả năng LÂY NHIỄM (biến 1 người thành sói thay vì giết). Dùng 1 lần duy nhất cả game.
Đồng bọn sói: ${wolves.map(w => w.name).join(', ')}. Danh sách: ${targets.map(t => t.name).join(', ')}
Chọn: cắn bình thường hay lây nhiễm? Nên lây nhiễm nếu muốn tăng quân số sói.
JSON: {"target":"Tên","infect":true/false,"reasoning":"lý do ngắn"}`;
}

export function seerInvestigatePrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive && p.id !== player.id);
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
Mày là ${player.role === Role.ApprenticeSeer ? 'TIÊN TRI TẬP SỰ (đã kế thừa)' : 'Tiên Tri'}. Chọn 1 người để soi. Kết quả: "Sói" hoặc "Không phải Sói".
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
}

export function witchActionPrompt(player: Player, state: GameState, observations: string[], killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): string {
  const targets = state.players.filter(p => p.alive && p.id !== player.id);
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
Mày là Phù thủy.
${killedName && !potions.healUsed ? `Sói vừa cắn ${killedName}. Muốn cứu không?` : 'Không có ai để cứu hoặc đã dùng thuốc cứu rồi.'}
${!potions.killUsed ? `Muốn đầu độc ai không? Danh sách: ${targets.map(t => t.name).join(', ')}` : 'Thuốc độc đã dùng rồi.'}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
LƯU Ý: Nếu đầu độc Thợ Săn, Thợ Săn sẽ chết mà KHÔNG được bắn phát cuối.
JSON: {"heal":true/false,"killTarget":"Tên"|null,"reasoning":"lý do ngắn"}`;
}

export function guardProtectPrompt(player: Player, state: GameState, observations: string[], lastGuardedId: string | null): string {
  const targets = state.players.filter(p => p.alive && p.id !== lastGuardedId);
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
Mày là Bảo vệ. Chọn 1 người để bảo vệ đêm nay.${lastGuardedId ? ` Không được bảo vệ ${state.players.find(p => p.id === lastGuardedId)?.name} vì đêm trước đã bảo vệ rồi.` : ''}
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
}

export function cupidPairPrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive);
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
MÀY LÀ THẦN TÌNH YÊU. Chọn 2 người để ghép đôi. Nếu 1 người chết, người kia chết theo.
Nếu cặp đôi gồm 1 Sói + 1 Dân, họ trở thành Phe Cặp Đôi và thắng khi là 2 người cuối cùng.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"player1":"Tên1","player2":"Tên2","reasoning":"lý do ngắn"}`;
}

export function discussionPrompt(player: Player, state: GameState, observations: string[], messages: DayMessage[], round: number): string {
  const convo = messages.length ? `\nMọi người đang nói:\n${messages.map(m => `${m.playerName}: "${m.message}"`).join('\n')}` : '\nMày là người nói đầu tiên. Mở lời đi.';

  let roleHint: string;
  if (isWolfRole(player.role)) {
    roleHint = `\nMÀY LÀ ${roleNameVi(player.role).toUpperCase()}. Đóng giả dân cho khéo. Có thể:
- Đổ thừa cho người khác
- Hùa theo đám đông để không bị chú ý
- Giả vờ phân tích logic để trông có vẻ dân
- Nếu bị nghi thì phản đòn mạnh`;
  } else if (player.role === Role.Seer || (player.role === Role.ApprenticeSeer && state.apprenticeSeerActivated)) {
    roleHint = `\nMÀY LÀ TIÊN TRI${player.role === Role.ApprenticeSeer ? ' TẬP SỰ (đã kế thừa)' : ''}. Có info từ đêm qua.
- Dẫn dắt dân tìm sói nhưng đừng lộ thân sớm quá
- Có thể hint nhẹ hoặc come out nếu nguy`;
  } else if (player.role === Role.Witch) {
    roleHint = `\nMÀY LÀ PHÙ THỦY. Giấu thân, phân tích bình thường như dân.`;
  } else if (player.role === Role.Guard) {
    roleHint = `\nMÀY LÀ BẢO VỆ. Giấu thân, nói chuyện như dân bình thường.`;
  } else if (player.role === Role.Hunter) {
    roleHint = `\nMÀY LÀ THỢ SĂN. Nếu chết thì kéo theo 1 thằng. Chơi hung hãn.`;
  } else if (player.role === Role.Cupid) {
    roleHint = `\nMÀY LÀ THẦN TÌNH YÊU. Giấu thân, chơi bình thường. Bảo vệ cặp đôi mày ghép.`;
  } else if (player.role === Role.Fool) {
    roleHint = `\nMÀY LÀ KẺ NGỐC. Mày THẮNG khi bị dân vote treo cổ! Hãy diễn như sói vụng để mọi người đòi treo cổ mày. Nhưng đừng lộ liễu quá.`;
  } else if (player.role === Role.ApprenticeSeer && !state.apprenticeSeerActivated) {
    roleHint = `\nMÀY LÀ TIÊN TRI TẬP SỰ. Chưa có skill, chơi như dân. Khi Tiên Tri chết thì mày kế thừa.`;
  } else {
    roleHint = `\nMÀY LÀ DÂN. Không có skill gì cả, phải dùng não.
- Hỏi han, chất vấn, bắt bẻ logic
- Đừng ngồi im — dân im là dân chết`;
  }

  let r1Hint = '';
  if (state.round === 1) {
    r1Hint = `\nVÒNG 1: Mới bắt đầu, chưa có info gì nhiều. Chào hỏi, phá không khí, ném nghi ngờ nhẹ.`;
  }

  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}${roleHint}${r1Hint}
Lượt thảo luận ${round}/${state.config.discussionRounds}.${convo}
NÓI 1-2 CÂU NGẮN, tự nhiên, bằng tiếng Việt. KHÔNG ĐƯỢC nói dài, không triết lý, không lịch sự giả tạo.
JSON: {"message":"câu nói","reasoning":"suy nghĩ riêng, không ai thấy"}`;
}

export function votePrompt(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
  const targets = state.players.filter(p => p.alive && p.id !== player.id);
  const convo = messages.map(m => `${m.playerName}: "${m.message}"`).join('\n');

  let roleHint: string;
  if (isWolfRole(player.role)) {
    roleHint = `\nMÀY LÀ SÓI. Vote sao cho hợp lý, đừng để lộ. Hùa theo đám đông vote 1 thằng dân.`;
  } else if (player.role === Role.Fool) {
    roleHint = `\nMÀY LÀ KẺ NGỐC. Nhớ: mày MUỐN bị treo cổ. Vote ai cũng được, miễn làm mình đáng ngờ.`;
  } else {
    roleHint = `\nVote thằng mày nghĩ là sói nhất dựa trên thảo luận. Tin bản năng.`;
  }

  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}${roleHint}
Mọi người vừa nói:\n${convo}
Đây là HOÀNG HÔN — vote chỉ định 1 người lên giàn (chưa giết, chỉ đưa lên để biện hộ).
Vote 1 người, hoặc "skip". Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên"|"skip","reasoning":"lý do ngắn"}`;
}

export function defensePrompt(player: Player, state: GameState, observations: string[], messages: DayMessage[]): string {
  const convo = messages.length ? `\nThảo luận trước đó:\n${messages.slice(-8).map(m => `${m.playerName}: "${m.message}"`).join('\n')}` : '';

  let roleHint: string;
  if (isWolfRole(player.role)) {
    roleHint = `\nMÀY LÀ SÓI đang bị đưa lên giàn! Phải lấp liếm thật giỏi. Có thể:
- Fake role: giả làm Bảo Vệ, Dân, Thợ Săn
- Đổ ngược: "vote tao thì lợi cho sói thôi"
- Doạ: "tao là Thợ Săn, giết tao thì tao bắn lại"`;
  } else if (player.role === Role.Fool) {
    roleHint = `\nMÀY LÀ KẺ NGỐC. Mày MUỐN bị giết! Biện hộ yếu yếu cho tự nhiên, nhưng đừng thuyết phục quá.`;
  } else {
    roleHint = `\nMày bị oan! Biện hộ mạnh mẽ:
- Chứng minh mình vô tội bằng logic
- Chỉ ra ai mới thật sự đáng nghi
- Nếu có info quan trọng thì come out luôn (Tiên Tri, Bảo Vệ...)`;
  }

  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}${roleHint}${convo}
MÀY ĐANG BỊ ĐƯA LÊN GIÀN! Mọi người sẽ vote giết hoặc tha mày sau khi nghe biện hộ.
NÓI 2-3 CÂU THUYẾT PHỤC. Mạnh mẽ, có logic, có cảm xúc. Đây là cơ hội sống còn.
JSON: {"message":"lời biện hộ","reasoning":"suy nghĩ thật"}`;
}

export function judgementVotePrompt(player: Player, state: GameState, observations: string[], accusedName: string, defenseSpeech: string): string {
  let roleHint: string;
  if (isWolfRole(player.role)) {
    roleHint = `\nMÀY LÀ SÓI. Vote sao có lợi cho phe sói:
- Nếu bị cáo là dân → vote GIẾT
- Nếu bị cáo là đồng bọn sói → vote THA (nhưng đừng lộ)`;
  } else {
    roleHint = `\nDựa trên lời biện hộ và tất cả những gì mày biết, quyết định GIẾT hay THA.`;
  }

  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}${roleHint}
PHÁN XÉT: ${accusedName} vừa biện hộ: "${defenseSpeech}"
Vote "kill" (giết) hoặc "spare" (tha). Cần >50% vote giết để treo cổ.
JSON: {"verdict":"kill"|"spare","reasoning":"lý do ngắn"}`;
}

export function hunterShotPrompt(player: Player, state: GameState, observations: string[]): string {
  const targets = state.players.filter(p => p.alive && p.id !== player.id);
  return `${gameRules()}\n${playerContext(player, state)}\n${personalityPrompt(player)}\n${memoryPrompt(observations)}
MÀY ĐANG CHẾT! Mày là Thợ săn — được bắn 1 phát cuối. Chọn thằng mày nghi sói nhất.
Danh sách: ${targets.map(t => t.name).join(', ')}
JSON: {"target":"Tên","reasoning":"lý do ngắn"}`;
}

// ── Response Parsing ──

export function parseActionResponse(response: string, validNames: string[]): { target: string | null; target1?: string; target2?: string; player1?: string; player2?: string; message?: string; heal?: boolean; killTarget?: string | null; infect?: boolean; verdict?: string; reasoning?: string } {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate target name if present
      if (parsed.target && parsed.target !== 'skip') {
        const match = validNames.find(n => n.toLowerCase() === parsed.target.toLowerCase());
        if (match) parsed.target = match;
        else if (validNames.length) parsed.target = validNames[Math.floor(Math.random() * validNames.length)];
      }
      if (parsed.killTarget) {
        const match = validNames.find(n => n.toLowerCase() === parsed.killTarget.toLowerCase());
        parsed.killTarget = match || null;
      }
      // Validate target1/target2 for double kill
      for (const key of ['target1', 'target2', 'player1', 'player2']) {
        if (parsed[key]) {
          const match = validNames.find(n => n.toLowerCase() === parsed[key].toLowerCase());
          if (match) parsed[key] = match;
          else if (validNames.length) parsed[key] = validNames[Math.floor(Math.random() * validNames.length)];
        }
      }
      return parsed;
    }
  } catch { }
  // Fallback: try to find a player name in the response
  for (const name of validNames) {
    if (response.toLowerCase().includes(name.toLowerCase())) {
      return { target: name, message: response };
    }
  }
  return { target: validNames.length ? validNames[Math.floor(Math.random() * validNames.length)] : null };
}

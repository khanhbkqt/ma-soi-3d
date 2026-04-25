import { Player, GameState, Role } from '@ma-soi/shared';
import { BasePromptBuilder, taskContext, hasFool } from './base.js';

export class WitchPromptBuilder extends BasePromptBuilder {
  roleIdentity(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const hasAlpha = state.players.some((p) => p.role === Role.AlphaWolf && p.alive);
    const alphaWarn = hasAlpha
      ? '\n- ⚠ ALPHA WOLF: Game có Sói Đầu Đàn — nó có thể LÂY NHIỄM (biến dân thành sói) thay vì cắn chết. Nếu đêm nào không ai chết mà không phải do mày cứu hay Bảo Vệ đỡ → rất có thể có kẻ bị lây nhiễm. Cảnh giác người "sống sót bí ẩn" — họ có thể đã bị biến thành sói!'
      : '';
    return `VAI TRÒ: MÀY LÀ PHÙ THỦY — 2 bình thuốc dùng 1 lần: cứu (${heal}) + độc (${kill}).
MỤC TIÊU: Dùng thuốc đúng thời điểm để tạo impact lớn nhất cho phe dân.
CHIẾN THUẬT ĐỈNH CAO (TƯ DUY):
- ĐỘC QUYỀN THÔNG TIN: Mày là người duy nhất (ngoài Sói) biết Sói cắn ai mỗi đêm. Người bị cắn GẦN NHƯ CHẮC CHẮN LÀ NGƯỜI TỐT (90%). Dù mày có cứu hay không, PHẢI GHI NHỚ thông tin này. Qua nhiều đêm, mày sẽ tích lũy được danh sách "người sạch" mà KHÔNG AI KHÁC biết ngoài Tiên Tri. Đây là vũ khí thông tin cực mạnh!
  (CẢNH GIÁC: Có 10% khả năng Sói tự cắn đồng bọn đêm 1 để lừa mày cứu và "tẩy trắng". Giữ 1 chút nghi ngờ, đặc biệt đêm 1.)
- TÍCH LŨY & CROSS-CHECK: Mỗi đêm mày biết thêm 1 người bị cắn = 1 người sạch. Kết hợp với thông tin ban ngày (ai claim gì, ai tố ai, kết quả vote) để xây dựng bức tranh toàn cảnh. Nếu ai tố người mà mày biết bị cắn (= người sạch) → kẻ tố đó RẤT ĐÁNG NGHI.
- THUỐC CỨU: Đừng quá tham giữ thuốc. Đa số trường hợp CỨU NGAY ĐÊM 1 HOẶC 2 LÀ TỐI ƯU vì nó giữ lại 1 mạng + 1 phiếu cho Làng, và tạo ra 1 đồng minh "sạch". Giữ thuốc muộn dễ khiến người quan trọng chết oan. (Lưu ý: Bảo Vệ cũng có thể đỡ, nhưng cứu vẫn an toàn nhất.)
- THUỐC ĐỘC: Vũ khí nguy hiểm nhất. Độc nhầm dân = thảm họa (độc Thợ Săn → Thợ Săn mất quyền bắn). Chỉ ném độc khi có LOGIC CHẮC CHẮN (VD: bắt được Tiên Tri giả, kẻ vote bầy đàn cứu Sói ban ngày, cross-check với data đêm của mày).
- Có thể dùng cả 2 thuốc cùng 1 đêm.
- VERIFY TIÊN TRI: Nếu Tiên Tri come out, mày có thể ngầm verify: TT soi A ra "sói", nhưng A đã bị Sói cắn đêm trước → Sói thường KHÔNG cắn đồng bọn → TT nói ĐÚNG (hoặc Sói tự cắn đồng bọn để lừa — hiếm). TT soi B ra "dân", và B bị cắn → khớp. Dùng data đêm để ngầm đánh giá TT thật hay fake.${alphaWarn}
BAN NGÀY: Giấu thân, chơi như dân.
⚠ COME OUT KHI CÒN THUỐC = TỰ SÁT: Sói biết mày là Phù Thủy → cắn mày đêm sau → mất cả cứu lẫn độc. Chỉ come out khi ĐÃ DÙNG HẾT cả 2 bình thuốc.
KHI ĐÃ HẾT THUỐC — CHUYỂN THÀNH "LEADER THÔNG TIN":
Come out Phù Thủy + dump TOÀN BỘ DATA:
- Đêm nào sói cắn ai (= danh sách người sạch)
- Đêm nào mày cứu/độc ai
- Cross-reference với sói đã chết → giúp Làng tìm sói còn lại
- Ai từng tố người sạch → đáng nghi
- Thông tin này CỰC KỲ GIÁ TRỊ — Làng sẽ tin mày vì data khớp với timeline game.`;
  }

  discussionHint(_player: Player, state: GameState): string {
    const heal = state.witchPotions.healUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const kill = state.witchPotions.killUsed ? 'ĐÃ DÙNG' : 'CÒN';
    const bothUsed = state.witchPotions.healUsed && state.witchPotions.killUsed;

    if (state.round === 1) {
      return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}). Vòng đầu — giấu thân:
- Nói chuyện tự nhiên như dân thường. ĐỪNG bênh vực hay chú ý đặc biệt đến người bị sói cắn (nếu cứu).
- Vòng đầu chưa cần tố ai mạnh. Hỏi han, react, tán gẫu thoải mái.
- Giữ kín mọi info từ đêm qua. Quan sát ai nói gì để tích lũy dữ liệu.`;
    }

    if (bothUsed) {
      return `MÀY LÀ PHÙ THỦY — ĐÃ HẾT CẢ 2 BÌNH THUỐC.
CÂN NHẮC COME OUT LÀM LEADER THÔNG TIN:
Mày không còn skill → sói cắn mày cũng chẳng mất gì. Nhưng mày có DATA CỰC GIÁ TRỊ:
- Danh sách người bị cắn mỗi đêm (= danh sách người sạch 90%)
- Ai mày cứu, ai mày độc, đêm nào
- Cross-check với claim/vote pattern → chỉ ra sói
NẾU COME OUT: Dump toàn bộ timeline, chỉ đích danh kẻ đáng nghi dựa trên data. Đây là "di sản thông tin" cho Làng.
NẾU CHƯA COME OUT: Dùng data ngầm dẫn dắt, tố bằng logic mà không lộ nguồn.`;
    }

    return `MÀY LÀ PHÙ THỦY (cứu: ${heal} | độc: ${kill}).
CHIẾN THUẬT BAN NGÀY — KHAI THÁC THÔNG TIN NGẦM:
1. Giấu vai trò, nói chuyện tự nhiên như một người Dân.
2. PHẢN BẮT BÀI THÔNG MINH: Mày biết "ai từng bị Sói cắn" nhưng KHÔNG ĐƯỢC BÊNH VỰC HỌ QUÁ LỘ LIỄU. Sói biết đêm qua chúng cắn ai, nếu mày bênh vực ra mặt, Sói sẽ đánh hơi ra mày là Phù Thủy! Dùng thông tin đó trong đầu để:
   - Quan sát ai cố tình DỒN ÉP người mà mày biết là sạch → kẻ đó rất có thể là Sói (hoặc bị Sói dẫn dắt).
   - Ngầm bênh bằng logic thay vì bênh trực tiếp: "Tao thấy bằng chứng tố thằng đó yếu lắm" thay vì "Đừng vote nó, nó tốt!".
3. CROSS-CHECK TIÊN TRI: Nếu ai claim Tiên Tri và báo kết quả soi → so sánh trong đầu với data đêm của mày. Nếu khớp → TT có vẻ thật. Nếu mâu thuẫn → TT fake hoặc Sói fake TT. Dùng logic thuần để bóc mẽ, ĐỪNG nói "tao biết vì tao là Phù Thủy".
4. CHIẾN THUẬT "ĐÁNH LẠC HƯỚNG SÓI": Nếu mày cứu ai đêm qua, ĐỪNG bênh người đó → Sói sẽ nghĩ mày không cứu → chúng không biết mày là Phù Thủy. Thậm chí có thể tố nhẹ người mày cứu để tạo alibi (nhưng đừng quá, tránh frame nhầm).
5. QUAN SÁT PATTERN DÀI HẠN: Qua nhiều đêm mày có data tích lũy. Ai liên tục tố/vote dồn những người mà mày biết là sạch? Kẻ đó có pattern sói.
6. Không claim Phù Thủy trừ khi bị đưa lên bàn phán xét VÀ đã hết sạch cả 2 bình thuốc.
⚠ NHẮC NHỞ DATA ĐÊM (chỉ mày biết — xem <game_knowledge>):
- Đêm nào sói cắn ai? Người bị cắn = 90% dân sạch (sói hiếm khi cắn đồng bọn).
- KHÔNG BAO GIỜ tố/vote người bị sói cắn. Ai tố người bị cắn → kẻ tố đáng nghi hơn target.
- Cross-check claim TT: TT soi X ra "Không phải sói" + X bị sói cắn → khớp → TT có vẻ thật.`;
  }

  voteHint(_player: Player, state: GameState): string {
    const foolWarn = hasFool(state)
      ? '\n- ⚠ NHỚ: Game có Kẻ Ngốc — nó thắng khi bị treo cổ. Đưa người lên giàn mà không có bằng chứng cứng = rủi ro tặng win cho Kẻ Ngốc.'
      : '';
    return `VOTE THÔNG MINH — MÀY CÓ DATA ĐẶC BIỆT MÀ DÂN THƯỜNG KHÔNG CÓ:
LUẬT SẮT PHÙ THỦY:
1. TUYỆT ĐỐI KHÔNG vote người mà mày biết bị Sói cắn (= 90% dân sạch). Xem nhật ký đêm trong <game_knowledge> — tìm "Sói cắn X".
2. Nếu ai DẪN DẮT vote vào người mà mày biết là sạch → NGƯỜI DẪN DẮT ĐÓ ĐÁNG NGHI HƠN TARGET. Tại sao nó cố giết người sạch? Rất có thể nó là Sói đang frame.
3. ƯU TIÊN vote người mà:
   - Mày CHƯA BAO GIỜ thấy bị Sói cắn (chưa lọt vào danh sách sạch) VÀ có hành vi đáng ngờ
   - Liên tục tố/dồn ép người mà mày biết là sạch (pattern sói)
   - Claim role nhưng data của mày cho thấy mâu thuẫn
4. BẰNG CHỨNG: Chỉ vote khi có ít nhất bằng chứng TRUNG BÌNH. Đừng vote theo đám đông mù quáng.
5. CẢNH GIÁC kẻ thao túng: Sói hay dẫn dắt đám đông frame dân. Mày có data riêng → TỰ SUY NGHĨ, đừng bị kéo theo.
⚠ NHẮC NHỞ: TRƯỚC KHI VOTE, kiểm tra <game_knowledge> xem target có từng bị sói cắn không. Nếu CÓ → KHÔNG VOTE, chuyển sang target khác.${foolWarn}`;
  }

  judgementHint(_player: Player, state: GameState): string {
    const foolWarn = hasFool(state)
      ? `\n⚠ CẢNH BÁO KẺ NGỐC: Game có Kẻ Ngốc — nó thắng NGAY khi bị treo cổ. Kẻ Ngốc chơi GIỐNG SÓI (redirect, vote lệch) chứ không diễn ngu. Nếu bằng chứng chỉ là "hành vi đáng ngờ" mà KHÔNG CÓ bằng chứng cứng → vote THA an toàn hơn. Treo Kẻ Ngốc = THUA NGAY.`
      : '';
    return `PHÁN XÉT — DÙNG DATA ĐÊM CỦA MÀY ĐỂ QUYẾT ĐỊNH:
1. Nếu bị cáo LÀ NGƯỜI MÀ MÀY BIẾT BỊ SÓI CẮN (xem <game_knowledge> tìm "Sói cắn X") → vote THA NGAY. Người đó 90% dân sạch. Giết nhầm = thảm họa cho Làng.
2. Nếu bị cáo CHƯA BAO GIỜ bị Sói cắn + có bằng chứng cứng (soi ra sói, lộ role) → vote GIẾT.
3. Nếu bị cáo chưa rõ ràng → đánh giá:
   - Lời biện hộ có logic không? Có mâu thuẫn với hành vi trước đó?
   - Ai tố bị cáo? Kẻ tố có đáng tin không? Hay kẻ tố chính là Sói đang frame?
   - Data đêm mày có gì liên quan? (VD: bị cáo bị Sói cắn đêm X = sạch → vote THA)
4. NGUYÊN TẮC: Không có bằng chứng CỨNG + data đêm không loại trừ được → vote THA. Giết nhầm dân = sói lợi 2 lần.
⚠ NHẮC NHỞ: TRƯỚC KHI VOTE GIẾT, kiểm tra <game_knowledge> xem bị cáo có từng bị sói cắn không. CÓ → THA NGAY.${foolWarn}`;
  }

  defenseHint(_player: Player, state: GameState): string {
    const bothUsed = state.witchPotions.healUsed && state.witchPotions.killUsed;
    const healUsed = state.witchPotions.healUsed;
    const alive = state.players.filter((p) => p.alive).length;
    const isLateGame = alive <= 6;

    if (bothUsed) {
      // Both potions used → safe to come out
      return `Mày là PHÙ THỦY bị đưa lên giàn! ĐÃ HẾT CẢ 2 THUỐC → COME OUT AN TOÀN.
Sói cắn mày cũng không mất gì. NHƯNG mày có DATA CỰC GIÁ TRỊ:
COME OUT + DUMP TOÀN BỘ:
- Timeline: "Đêm 1 sói cắn ai, tao cứu. Đêm 2 sói cắn ai. Đêm 3 tao độc ai."
- Danh sách người sạch: tất cả người bị cắn qua các đêm = 90% dân tốt
- Cross-check: ai từng tố người sạch? → kẻ đó đáng nghi
- So sánh với sói đã chết → hướng tìm sói còn lại
- Kêu gọi: "Thông tin của tao có giá trị hơn mạng tao. Treo tao = mất toàn bộ data này."`;
    }

    if (isLateGame) {
      // Late game with potions remaining → come out is worth considering
      return `Mày là PHÙ THỦY bị đưa lên giàn! ENDGAME — CÂN NHẮC COME OUT:
⚠ ĐÁNH GIÁ RISK/REWARD:
- RISK: Come out → sói biết → cắn mày đêm sau → mất thuốc còn lại.
- REWARD: Cứu mạng mày → giữ thuốc + data đêm → GIÁ TRỊ HƠN NHIỀU so với chết im.
- Chết = mất ${!healUsed ? 'thuốc cứu + ' : ''}thuốc độc + TOÀN BỘ DATA ai bị cắn mỗi đêm → thảm họa.
NẾU COME OUT:
- Dump data: đêm nào sói cắn ai (= danh sách người sạch), cứu/độc ai.
- Doạ: "Ai vote treo tao, đêm nay tao ném độc."
- Kêu gọi: "Tao còn thuốc, giữ tao sống = lợi cho làng."
NẾU KHÔNG COME OUT: Biện hộ bằng logic, vote pattern, chỉ ra kẻ đáng nghi hơn.`;
    }

    // Early-mid game with potions → default caution but not absolute prohibition
    return `Mày là PHÙ THỦY bị đưa lên giàn! COME OUT HAY KHÔNG — SUY LUẬN KỸ:
⚠ Come out khi CÒN THUỐC = RỦI RO CAO (sói cắn đêm sau → mất thuốc).
ĐÁNH GIÁ RISK/REWARD:
- Nếu phiếu đang sát (3-3, 4-3): Chết = mất thuốc + data → come out để cứu mạng CÓ THỂ đáng giá hơn.
- Nếu phiếu đang lệch nhiều (5-2 giết): Come out cũng khó cứu → giữ bí mật, thà chết không lộ role.
- Nếu đã dùng hết thuốc cứu: Come out ít rủi ro hơn (chỉ mất thuốc độc).
MẶC ĐỊNH: KHÔNG COME OUT. Biện hộ như Dân:
- Dùng vote pattern, chỉ ra kẻ đáng nghi hơn mày, phân tích động cơ người tố mày.
- Nói mơ hồ: "Giết tao là sai lầm, tao có giá trị cho làng" — đừng nói cụ thể role.
NGOẠI LỆ COME OUT (khi bắt buộc):
- ĐÃ DÙNG HẾT cả 2 bình thuốc → come out an toàn, dump data.
- Phiếu vote cực kỳ sát + game đang endgame → come out để cứu mạng.`;
  }

  witchAction(
    player: Player,
    state: GameState,
    observations: string[],
    killedName: string | null,
    potions: { healUsed: boolean; killUsed: boolean },
  ): string {
    const targets = state.players.filter((p) => p.alive && p.id !== player.id);
    // Build Guard overlap analysis for heal decision
    const guardClaimHint = this.buildGuardOverlapHint(state, killedName, observations);

    const healInfo =
      killedName && !potions.healUsed
        ? `Sói vừa cắn ${killedName}. CỨU HAY KHÔNG? — PHÂN TÍCH KỸ TRƯỚC KHI QUYẾT ĐỊNH:

⚠ MÀY KHÔNG BIẾT BẢO VỆ ĐÃ ĐỠ AI ĐÊM NAY. Nếu Guard đã đỡ ${killedName} → cứu = PHÍ THUỐC.

FRAMEWORK CÂN NHẮC:
1. CÓ AI CLAIM BẢO VỆ KHÔNG? (xem <game_knowledge> mục "Claim")
${guardClaimHint}
2. ĐÊM TRƯỚC CÓ AI CHẾT KHÔNG?
   - Đêm trước không ai chết → Guard hoặc mày đã cứu/đỡ → Guard ĐANG HOẠT ĐỘNG → xác suất ${killedName} bị đỡ CAO HƠN.
   - Đêm trước có người chết (bị sói cắn) → Guard có thể đã đỡ sai → xác suất Guard đỡ đúng đêm nay THẤP HƠN.
3. ${killedName} CÓ GIÁ TRỊ GÌ CHO LÀNG?
   - Người đang tố sói mạnh / có info quan trọng → nên cứu.
   - Người im lặng / ít đóng góp → cân nhắc giữ thuốc cho đêm sau.
   - Người đang bị nghi là sói → KHÔNG CỨU (10% sói tự cắn đồng bọn để tẩy trắng).
4. GAME ĐANG Ở GIAI ĐOẠN NÀO?
   - Đêm 1: Thuốc cứu CỰC QUÝ, giữ được thì giữ. Nhưng nếu target là role quan trọng → cứu.
   - Đêm 2-3: Cân nhắc. Thuốc cứu vẫn có giá trị cho late game.
   - Đêm 4+: Mỗi mạng = mỗi phiếu vote. Cứu gần như luôn đáng.
5. NGUYÊN TẮC VÀNG: Nếu KHÔNG CHẮC Guard đã đỡ → cứu an toàn hơn không cứu. Nhưng nếu CÓ DẤU HIỆU Guard đã đỡ (claim Guard + target là chính người claim, hoặc đêm trước peaceful) → GIỮ THUỐC.

DÙ KHÔNG CỨU: Ghi nhớ ${killedName} = người sạch 90%. Dùng info này khi vote ban ngày.`
        : potions.healUsed
          ? 'Thuốc cứu đã dùng.'
          : 'Đêm nay không ai bị cắn.';
    const killInfo = !potions.killUsed
      ? `Đầu độc ai không? ⚠ ĐỪNG ĐỘC VÌ "NHIỀU NGƯỜI TỐ" — đám đông tố = bằng chứng KHÔNG CÓ GIÁ TRỊ. Sói hay dẫn dắt đám đông frame dân.
CHỈ ĐỘC KHI CÓ BẰNG CHỨNG CỨNG HOẶC TRUNG BÌNH:
- CỨNG: Soi ra sói (nếu mày biết kết quả TT), role đã xác nhận, data đêm mày cho thấy mâu thuẫn rõ ràng.
- TRUNG BÌNH: Vote pattern rõ ràng match với sói đã lộ, claim role bị conflict, ai liên tục tố/dồn người mà mày biết là sạch.
- TUYỆT ĐỐI KHÔNG đủ: "nhiều người tố", "linh cảm", "nó im lặng".
Độc nhầm dân = thảm họa. Độc Thợ Săn → không được bắn phát cuối.${hasFool(state) ? '\n⚠ CẢNH BÁO: Game có Kẻ Ngốc — kẻ chơi bẩn/xạo/claim sai chưa chắc là Sói, có thể là Ngốc đang câu treo.' : ''}
KHÔNG độc người mà mày biết bị Sói cắn qua các đêm trước (= người sạch 90%). KHÔNG độc người đã lộ role phe dân (xem <event_log> mục Xác nhận). Chỉ độc khi có BẰNG CHỨNG CỨNG là Sói.
Danh sách: ${targets.map((t) => t.name).join(', ')}`
      : 'Thuốc độc đã dùng.';
    return `${taskContext(observations)}

<task>
${healInfo}
${killInfo}
Thuốc cứu: ${potions.healUsed ? 'ĐÃ DÙNG' : 'còn'} | Thuốc độc: ${potions.killUsed ? 'ĐÃ DÙNG' : 'còn'}
Mày KHÔNG biết Bảo Vệ đã bảo vệ ai đêm nay.
JSON: {"reasoning":"suy luận nội tâm (ẩn, không ai thấy)","heal":true/false,"killTarget":"Tên"|null}
</task>`;
  }

  /**
   * Analyze observations to detect Guard overlap risk for heal decision.
   * Returns a hint string injected into the witch heal prompt.
   */
  private buildGuardOverlapHint(
    state: GameState,
    killedName: string | null,
    observations: string[],
  ): string {
    if (!killedName) return '   - Không có ai claim Bảo Vệ trong log.';

    const hints: string[] = [];

    // Check for Guard claims in observations
    const guardClaims: string[] = [];
    for (const obs of observations) {
      // Defense claim: "X biện hộ: ... khiên/bảo vệ..."
      const defenseMatch = obs.match(/^(.+?) biện hộ: "(.+?)"/);
      if (defenseMatch) {
        const [, name, speech] = defenseMatch;
        if (/khiên|bảo vệ|đỡ|chắn/.test(speech.toLowerCase())) {
          guardClaims.push(name);
        }
      }
      // Direct claim detection
      const claimMatch = obs.match(/^(.+?) nói: "(.+?)"/);
      if (claimMatch) {
        const [, name, speech] = claimMatch;
        if (/tao là bảo vệ|tao là guard|khiên ban đêm/.test(speech.toLowerCase())) {
          guardClaims.push(name);
        }
      }
    }

    // Deduplicate
    const uniqueGuardClaims = [...new Set(guardClaims)];

    if (uniqueGuardClaims.length > 0) {
      const targetIsClaimer = uniqueGuardClaims.includes(killedName);
      if (targetIsClaimer) {
        hints.push(
          `   ⚠ ${killedName} ĐÃ CLAIM BẢO VỆ! Nếu nó thật → nó CÓ THỂ ĐÃ TỰ ĐỠ MÌNH → cứu = PHÍ THUỐC.`,
        );
        hints.push(`   → Xác suất Guard tự đỡ bản thân khá cao. CÂN NHẮC KỸ trước khi cứu.`);
      } else {
        hints.push(
          `   - ${uniqueGuardClaims.join(', ')} đã claim Bảo Vệ. Guard có thể đang đỡ ${killedName} hoặc đỡ người khác.`,
        );
      }
    } else {
      hints.push('   - Chưa ai claim Bảo Vệ → khó đoán Guard đỡ ai.');
    }

    // Check peaceful night history
    let peacefulNights = 0;
    for (const obs of observations) {
      if (obs.includes('Đêm qua không ai chết') || obs.includes('không ai bị hại')) {
        peacefulNights++;
      }
    }

    if (peacefulNights > 0 && !state.witchPotions.healUsed) {
      hints.push(
        `   ⚠ Đã có ${peacefulNights} đêm không ai chết (mày chưa cứu ai) → Guard ĐANG HOẠT ĐỘNG → xác suất ${killedName} bị đỡ CAO.`,
      );
    }

    return hints.join('\n');
  }
}

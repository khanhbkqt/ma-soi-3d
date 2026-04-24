import { GameState, GameConfig, Player, Role, DayMessage, WitchPotions, getRoleDistribution, GameEventType, isWolfRole } from '@ma-soi/shared';
import { AgentBrain } from '../agents/brain.js';
import { getRandomPersonalities, PERSONALITIES } from '../agents/personalities.js';
import { getProvider, registerAllProviders } from '../providers/index.js';
import { GameMaster, ActionResolver } from './GameMaster.js';

export class AgentManager implements ActionResolver {
  private brains = new Map<string, AgentBrain>();

  constructor(private gm: GameMaster) {}

  setupGame(config: GameConfig): Player[] {
    registerAllProviders(config.providers);

    const roles = getRoleDistribution(config.playerCount, config.enabledSpecialRoles);
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    const personalities = getRandomPersonalities(config.playerCount);

    const players: Player[] = config.playerSetup.map((setup, i) => {
      const personality = setup.personalityId
        ? PERSONALITIES.find(p => p.id === setup.personalityId) || personalities[i]
        : personalities[i];
      return {
        id: crypto.randomUUID(),
        name: setup.name,
        role: shuffledRoles[i],
        alive: true,
        personality,
        providerId: setup.providerId,
      };
    });

    // Create brains
    for (const player of players) {
      let provider;
      try { provider = getProvider(player.providerId); }
      catch { throw new Error(`Provider "${player.providerId}" not found for player "${player.name}"`); }
      this.brains.set(player.id, new AgentBrain(player, provider));
    }

    // Listen to game events to update agent memories
    this.gm.on('gameEvent', (event) => {
      for (const [id, brain] of this.brains) {
        const obs = this.eventToObservation(event, brain.player);
        if (obs) brain.addObservation(obs);
      }
    });

    return players;
  }

  private eventToObservation(event: any, viewer: Player): string | null {
    const d = event.data;
    const causeVi: Record<string, string> = {
      wolf_kill: 'bị sói cắn', witch_kill: 'bị đầu độc', judged: 'bị treo cổ',
      hunter_shot: 'bị Thợ Săn bắn', lover_death: 'chết theo người yêu',
    };
    switch (event.type) {
      case GameEventType.PhaseChanged: {
        const phaseVi: Record<string, string> = {
          Night: 'Ban đêm', Dawn: 'Rạng sáng', Day: 'Ban ngày',
          Dusk: 'Hoàng hôn', Judgement: 'Phán xét',
        };
        return `--- Vòng ${d.round}, ${phaseVi[d.phase] || d.phase} ---`;
      }
      case GameEventType.PlayerDied:
        return `${d.playerName} đã chết (${causeVi[d.cause] || d.cause}). Vai: ${d.role}.`;
      case GameEventType.DayMessage:
        return `${d.playerName} nói: "${d.message}"`;
      case GameEventType.VoteCast:
        return `${d.voterName} vote ${d.targetName}.`;
      case GameEventType.VoteResult:
        return d.exiled ? `${d.exiled.name} bị đuổi bởi vote.` : 'Không ai bị đuổi (hòa phiếu).';
      case GameEventType.DuskNomination:
        return `${d.accusedName} bị đưa lên giàn để phán xét.`;
      case GameEventType.DefenseSpeech:
        return `${d.playerName} biện hộ: "${d.message}"`;
      case GameEventType.JudgementVoteCast:
        return `${d.voterName} vote ${d.verdict === 'kill' ? 'GIẾT' : 'THA'}.`;
      case GameEventType.JudgementResult:
        return d.executed ? `${d.accusedName} bị treo cổ sau phán xét.` : `${d.accusedName} được tha sau phán xét.`;
      case GameEventType.HunterShot:
        return `Thợ Săn bắn ${d.targetName}!`;
      case GameEventType.SeerResult:
        if (viewer.id === d.seerId) return `Mày soi ${d.targetName}: ${d.isWolf ? 'LÀ SÓI!' : 'Không phải sói.'}`;
        return null;
      case GameEventType.DawnAnnouncement:
        if (d.peaceful) return 'Đêm qua không ai chết.';
        return `Chết đêm qua: ${d.deaths.map((x: any) => x.name).join(', ')}.`;
      case GameEventType.NightResolved:
        if (d.deaths?.length === 0) return 'Đêm qua không ai chết.';
        return d.deaths ? `Chết đêm qua: ${d.deaths.map((x: any) => x.name).join(', ')}.` : null;
      case GameEventType.GuardProtect:
        if (viewer.role === Role.Guard) return `Mày đã bảo vệ ${d.targetName} đêm nay.`;
        return null;
      case GameEventType.WitchAction:
        if (viewer.role === Role.Witch) return `Mày đã dùng thuốc ${d.action === 'heal' ? 'cứu' : 'độc'} cho ${d.targetName}.`;
        return null;
      case GameEventType.NightActionPerformed:
        if (isWolfRole(viewer.role)) return `Sói cắn ${d.targetName || d.targetNames?.join(', ')} đêm nay.`;
        return null;
      case GameEventType.AlphaInfect:
        if (viewer.id === d.targetId) return `MÀY ĐÃ BỊ SÓI ĐẦU ĐÀN LÂY NHIỄM! Mày giờ là Sói!`;
        if (isWolfRole(viewer.role)) return `Sói Đầu Đàn lây nhiễm ${d.targetName}! Hắn giờ là sói.`;
        return null;
      case GameEventType.WolfCubRevenge:
        if (isWolfRole(viewer.role)) return `Sói Con đã chết! Đêm sau sói cắn 2 người trả thù.`;
        return null;
      case GameEventType.CupidPair:
        if (viewer.role === Role.Cupid) return `Mày đã ghép đôi ${d.player1Name} và ${d.player2Name}.`;
        return null;
      case GameEventType.LoverDeath:
        return `${d.loverName} chết theo ${d.deadName} vì tình yêu.`;
      case GameEventType.ApprenticeSeerActivated:
        if (viewer.id === d.apprenticeId) return `Tiên Tri đã chết. Mày kế thừa — giờ mày là Tiên Tri mới!`;
        return null;
      case GameEventType.FoolVictory:
        return `${d.foolName} là Kẻ Ngốc và thắng game!`;
      default: return null;
    }
  }

  private getBrain(player: Player): AgentBrain {
    return this.brains.get(player.id)!;
  }

  async wolfKill(wolves: Player[], state: GameState): Promise<string> {
    if (!wolves.length) return '';
    return this.getBrain(wolves[0]).decideWolfKill(state);
  }

  async wolfDoubleKill(wolves: Player[], state: GameState): Promise<[string, string]> {
    if (!wolves.length) return ['', ''];
    return this.getBrain(wolves[0]).decideWolfDoubleKill(state);
  }

  async alphaInfect(alpha: Player, state: GameState): Promise<{ target: string; infect: boolean }> {
    return this.getBrain(alpha).decideAlphaInfect(state);
  }

  async seerInvestigate(seer: Player, state: GameState): Promise<string> {
    return this.getBrain(seer).decideSeerInvestigate(state);
  }

  async witchAction(witch: Player, state: GameState, killedName: string | null, potions: WitchPotions): Promise<{ heal: boolean; killTarget: string | null }> {
    return this.getBrain(witch).decideWitchAction(state, killedName, potions);
  }

  async guardProtect(guard: Player, state: GameState, lastGuardedId: string | null): Promise<string> {
    return this.getBrain(guard).decideGuardProtect(state, lastGuardedId);
  }

  async cupidPair(cupid: Player, state: GameState): Promise<[string, string]> {
    return this.getBrain(cupid).decideCupidPair(state);
  }

  async discuss(player: Player, state: GameState, messages: DayMessage[], round: number): Promise<string> {
    return this.getBrain(player).discuss(state, messages, round);
  }

  async vote(player: Player, state: GameState, messages: DayMessage[]): Promise<string> {
    return this.getBrain(player).vote(state, messages);
  }

  async defend(player: Player, state: GameState, messages: DayMessage[]): Promise<string> {
    return this.getBrain(player).defend(state, messages);
  }

  async judgeVote(player: Player, state: GameState, accusedName: string, defenseSpeech: string, messages: DayMessage[]): Promise<'kill' | 'spare'> {
    return this.getBrain(player).judgeVote(state, accusedName, defenseSpeech, messages);
  }

  async hunterShot(hunter: Player, state: GameState): Promise<string> {
    return this.getBrain(hunter).hunterShot(state);
  }
}

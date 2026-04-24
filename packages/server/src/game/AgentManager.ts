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
    switch (event.type) {
      case GameEventType.PhaseChanged:
        return `Phase changed to ${d.phase}, round ${d.round}.`;
      case GameEventType.PlayerDied:
        return `${d.playerName} died (${d.cause}). They were ${d.role}.`;
      case GameEventType.DayMessage:
        return `${d.playerName} said: "${d.message}"`;
      case GameEventType.VoteCast:
        return `${d.voterName} voted for ${d.targetName}.`;
      case GameEventType.VoteResult:
        return d.exiled ? `${d.exiled.name} was exiled by vote.` : 'No one was exiled (tie or no majority).';
      case GameEventType.DuskNomination:
        return `${d.accusedName} was nominated for judgement.`;
      case GameEventType.DefenseSpeech:
        return `${d.playerName} defended: "${d.message}"`;
      case GameEventType.JudgementVoteCast:
        return `${d.voterName} voted to ${d.verdict} the accused.`;
      case GameEventType.JudgementResult:
        return d.executed ? `${d.accusedName} was executed after judgement.` : `${d.accusedName} was spared after judgement.`;
      case GameEventType.HunterShot:
        return `Hunter shot ${d.targetName}!`;
      case GameEventType.SeerResult:
        if (viewer.id === d.seerId) return `You investigated ${d.targetName}: they are ${d.isWolf ? 'a WEREWOLF' : 'NOT a werewolf'}.`;
        return null;
      case GameEventType.DawnAnnouncement:
        if (d.peaceful) return 'No one died during the night.';
        return `Night deaths: ${d.deaths.map((x: any) => x.name).join(', ')}.`;
      case GameEventType.NightResolved:
        if (d.deaths?.length === 0) return 'No one died during the night.';
        return d.deaths ? `Night deaths: ${d.deaths.map((x: any) => x.name).join(', ')}.` : null;
      case GameEventType.GuardProtect:
        if (viewer.role === Role.Guard) return `You protected ${d.targetName} tonight.`;
        return null;
      case GameEventType.WitchAction:
        if (viewer.role === Role.Witch) return `You used ${d.action} potion on ${d.targetName}.`;
        return null;
      case GameEventType.NightActionPerformed:
        if (isWolfRole(viewer.role)) return `Werewolves targeted ${d.targetName || d.targetNames?.join(', ')} tonight.`;
        return null;
      case GameEventType.AlphaInfect:
        if (isWolfRole(viewer.role)) return `Alpha Wolf infected ${d.targetName}! They are now a werewolf.`;
        return null;
      case GameEventType.WolfCubRevenge:
        if (isWolfRole(viewer.role)) return `Wolf Cub died! Wolves will kill 2 people next night.`;
        return null;
      case GameEventType.CupidPair:
        if (viewer.role === Role.Cupid) return `You paired ${d.player1Name} and ${d.player2Name}.`;
        return null;
      case GameEventType.LoverDeath:
        return `${d.loverName} died of heartbreak after ${d.deadName}'s death.`;
      case GameEventType.ApprenticeSeerActivated:
        if (viewer.id === d.apprenticeId) return `The Seer has died. You are now the new Seer!`;
        return null;
      case GameEventType.FoolVictory:
        return `${d.foolName} was the Fool and wins the game!`;
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

  async judgeVote(player: Player, state: GameState, accusedName: string, defenseSpeech: string): Promise<'kill' | 'spare'> {
    return this.getBrain(player).judgeVote(state, accusedName, defenseSpeech);
  }

  async hunterShot(hunter: Player, state: GameState): Promise<string> {
    return this.getBrain(hunter).hunterShot(state);
  }
}

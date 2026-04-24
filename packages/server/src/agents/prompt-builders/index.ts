import { Role } from '@ma-soi/shared';
import { PromptBuilder } from './base.js';
import { WolfPromptBuilder, AlphaWolfPromptBuilder, WolfCubPromptBuilder } from './wolf.js';
import { SeerPromptBuilder, ApprenticeSeerPromptBuilder } from './seer.js';
import { WitchPromptBuilder } from './witch.js';
import { GuardPromptBuilder } from './guard.js';
import { HunterPromptBuilder } from './hunter.js';
import { CupidPromptBuilder } from './cupid.js';
import { FoolPromptBuilder } from './fool.js';
import { VillagerPromptBuilder } from './villager.js';

const builders: Record<Role, PromptBuilder> = {
  [Role.Werewolf]: new WolfPromptBuilder(),
  [Role.AlphaWolf]: new AlphaWolfPromptBuilder(),
  [Role.WolfCub]: new WolfCubPromptBuilder(),
  [Role.Seer]: new SeerPromptBuilder(),
  [Role.ApprenticeSeer]: new ApprenticeSeerPromptBuilder(),
  [Role.Witch]: new WitchPromptBuilder(),
  [Role.Guard]: new GuardPromptBuilder(),
  [Role.Hunter]: new HunterPromptBuilder(),
  [Role.Cupid]: new CupidPromptBuilder(),
  [Role.Fool]: new FoolPromptBuilder(),
  [Role.Villager]: new VillagerPromptBuilder(),
};

export function getPromptBuilder(role: Role): PromptBuilder {
  return builders[role] || builders[Role.Villager];
}

// Re-export types and helpers
export type { PromptBuilder } from './base.js';
export { parseActionResponse } from '../prompts.js';
export { WolfPromptBuilder, AlphaWolfPromptBuilder } from './wolf.js';
export { SeerPromptBuilder } from './seer.js';
export { WitchPromptBuilder } from './witch.js';
export { GuardPromptBuilder } from './guard.js';
export { HunterPromptBuilder } from './hunter.js';
export { CupidPromptBuilder } from './cupid.js';

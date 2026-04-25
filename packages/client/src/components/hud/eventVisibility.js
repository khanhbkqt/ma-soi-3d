import { GameEventType, Role, isWolfRole } from '@ma-soi/shared';
/**
 * Client-side mirror of server's eventToObservation visibility logic.
 * Returns true if the given player would see this event.
 */
export function isEventVisibleToPlayer(event, playerId, playerRole) {
  if (event.isPublic) return true;
  const d = event.data;
  switch (event.type) {
    case GameEventType.SeerResult:
      return d.seerId === playerId;
    case GameEventType.GuardProtect:
      return playerRole === Role.Guard;
    case GameEventType.WitchAction:
      return playerRole === Role.Witch;
    case GameEventType.NightActionPerformed:
      return isWolfRole(playerRole);
    case GameEventType.AlphaInfect:
      return isWolfRole(playerRole) || d.targetId === playerId;
    case GameEventType.WolfCubRevenge:
      return isWolfRole(playerRole);
    case GameEventType.CupidPair:
      return playerRole === Role.Cupid;
    case GameEventType.ApprenticeSeerActivated:
      return d.apprenticeId === playerId;
    case GameEventType.RoleReveal:
      return d.playerId === playerId;
    default:
      return false;
  }
}

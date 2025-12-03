import { resolveAvatar } from './avatarResolver';

export function mapPersonas(rows = []) {
  return rows.map(r => {
    return {
      id: r.id ?? r.personaId ?? i,
      name: r.name ?? r.personaName ?? "",
      role: r.role ?? r.personaRole ?? "",
      profile: r.profile ?? r.personaProfile ?? "",
      traits: r.traits ?? r.personaTraits ?? "",
      motivation: r.motivation ?? r.personaMotivation,
      attitude: r.attitude ?? r.personaAttitude ?? "",
      avatar: resolveAvatar(r.personaAvatar),
    };
  });
}



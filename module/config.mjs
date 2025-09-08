/**
 * Runtime configuration settings for the Nechronica game system.
 */
export const NECHRONICA = {
  ASCII: `
 ███▄    █ ▓█████  ▄████▄   ██░ ██  ██▀███   ▒█████   ███▄    █  ██▓ ▄████▄   ▄▄▄      |
 ██ ▀█   █ ▓█   ▀ ▒██▀ ▀█  ▓██░ ██▒▓██ ▒ ██▒▒██▒  ██▒ ██ ▀█   █ ▓██▒▒██▀ ▀█  ▒████▄    |
▓██  ▀█ ██▒▒███   ▒▓█    ▄ ▒██▀▀██░▓██ ░▄█ ▒▒██░  ██▒▓██  ▀█ ██▒▒██▒▒▓█    ▄ ▒██  ▀█▄  |
▓██▒  ▐▌██▒▒▓█  ▄ ▒▓▓▄ ▄██▒░▓█ ░██ ▒██▀▀█▄  ▒██   ██░▓██▒  ▐▌██▒░██░▒▓▓▄ ▄██▒░██▄▄▄▄██ |
▒██░   ▓██░░▒████▒▒ ▓███▀ ░░▓█▒░██▓░██▓ ▒██▒░ ████▓▒░▒██░   ▓██░░██░▒ ▓███▀ ░ ▓█   ▓██▒|
░ ▒░   ▒ ▒ ░░ ▒░ ░░ ░▒ ▒  ░ ▒ ░░▒░▒░ ▒▓ ░▒▓░░ ▒░▒░▒░ ░ ▒░   ▒ ▒ ░▓  ░ ░▒ ▒  ░ ▒▒   ▓▒█░|
░ ░░   ░ ▒░ ░ ░  ░  ░  ▒    ▒ ░▒░ ░  ░▒ ░ ▒░  ░ ▒ ▒░ ░ ░░   ░ ▒░ ▒ ░  ░  ▒     ▒   ▒▒ ░|
   ░   ░ ░    ░   ░         ░  ░░ ░  ░░   ░ ░ ░ ░ ▒     ░   ░ ░  ▒ ░░          ░   ▒   |
         ░    ░  ░░ ░       ░  ░  ░   ░         ░ ░           ░  ░  ░ ░            ░  ░|
                  ░                                                 ░                  |
`,
  /**
   * Actor types
   */
  actorTypes: {
    doll: "TYPES.Actor.doll",
    savant: "TYPES.Actor.savant",
    legion: "TYPES.Actor.legion",
    horror: "TYPES.Actor.horror"
  },

  /**
   * Item types
   */
  itemTypes: {
    skill: "NECH.BodyPart",
    bodypart: "NECH.BodyPart",
    memory: "NECH.Memory",
    regret: "NECH.Regret",
    class: "NECH.Class",
    position: "NECH.Position",
  },

  /**
   * Possible body part locations
   */
  locations: {
    head: "NECH.Locations.Head",
    arms: "NECH.Locations.Arms",
    torso: "NECH.Locations.Torso",
    legs: "NECH.Locations.Legs",
    any: "NECH.Locations.Any",
  },

  /**
   * Timings of a part's or skill's action
   */
  timings: {
    action: "NECH.Timings.Action",
    rapid: "NECH.Timings.Rapid",
    damage: "NECH.Timings.Damage",
    judge: "NECH.Timings.Judge",
    auto: "NECH.Timings.Auto",
  },

  /**
   * The different types of an attack
   */
  attackTypes: {
    unarmed: "NECH.AttackTypes.Unarmed",
    melee: "NECH.AttackTypes.Melee",
    ranged: "NECH.AttackTypes.Ranged",
    blast: "NECH.AttackTypes.Blast",
    mental: "NECH.AttackTypes.Mental",
  },

  /**
   * The types of modifiers a part can have
   */
  modifierTypes: {
    attack: "NECH.Attack",
    damage: "NECH.Modifiers.Damage",
  },

  /**
   * Extra properties a part's attack can have
   */
  effectTypes: {
    dismember: "NECH.EffectTypes.Dismember",
    explosive: "NECH.EffectTypes.Explosive",
    areaAttack: "NECH.EffectTypes.AreaAttack",
    chain: "NECH.EffectTypes.Chain",
    stagger: "NECH.EffectTypes.Stagger",
  },

  /**
   * The types of a part entity
   */
  partTypes: {
    skill: "NECH.Skill",
    bodypart: "NECH.BodyPart",
  },

  /**
   * The placements a doll actor can choose from
   */
  placements: {
    limbo: "NECH.Placements.Limbo",
    elysium: "NECH.Placements.Elysium",
    eden: "NECH.Placements.Eden",
  },

  /**
   * The attributes of a doll actor
   */
  attributes: {
    armament: "NECH.Armament",
    mutation: "NECH.Mutation",
    enhancement: "NECH.Enhancement",
  },

  hitLocations: {
    6: "NECH.Roll.TargetsChoice",
    7: "NECH.Locations.Legs",
    8: "NECH.Locations.Torso",
    9: "NECH.Locations.Arms",
    10: "NECH.Locations.Head",
    crit: "NECH.Roll.AttackersChoice",
  },

  tooltipIcons: {
    skills: { icon: "cogs", color: "grey" },
    head: { icon: "brain", color: "blue" },
    arms: { icon: "fist-raised", color: "red" },
    torso: { icon: "child", color: "yellow" },
    legs: { icon: "shoe-prints", color: "green" },
    all: { icon: "child", color: "red" },
  },
};

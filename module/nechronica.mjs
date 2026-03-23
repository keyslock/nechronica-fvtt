import { NechronicaActor } from "./documents/actor.mjs";
import { NechronicaItem } from "./documents/item.mjs";
import { NechronicaCombat } from "./combat/combat.mjs";
import { NechronicaCombatant } from "./combat/combatant.mjs";
// Import sheet classes.
import { NechronicaActorSheet } from "./sheets/actor-sheet.mjs";
import { NechronicaItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { registerHandlebarsHelpers } from "./handlebars/helpers.mjs";
import { NECHRONICA } from "./config.mjs";

Hooks.once("init", async () => {
  game.settings.register(game.system.id, "tokenTooltip", {
    name: game.i18n.localize("NECH.Config.TokenTooltip.Title"),
    hint: game.i18n.localize("NECH.Config.TokenTooltip.Hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  Handlebars.registerHelper("stripHTML", function (html) {
    if (!html) return "";
    return normarizeHtml(html);
  });

  Handlebars.registerHelper("eq", (a, b) => a === b);

  // Preload Handlebars templates
  await preloadHandlebarsTemplates();
  // Configure custom Document implementations.
  CONFIG.Actor.documentClass = NechronicaActor;
  CONFIG.Item.documentClass = NechronicaItem;
  CONFIG.Combat.documentClass = NechronicaCombat;
  CONFIG.Combatant.documentClass = NechronicaCombatant;

  registerHandlebarsHelpers();
  // Register sheet application classes
  console.log("Initializing Nechronica system");

  Actors.unregisterSheet("core", ActorSheet);
  console.log("Unregistered core ActorSheet");

  Actors.registerSheet("nechronica", NechronicaActorSheet, {
    makeDefault: true,
    label: "Nechronica Sheet",
  });
  console.log("Registered NechronicaActorSheet");

  Items.registerSheet("nechronica", NechronicaItemSheet, {
    makeDefault: true,
    label: "Nechronica Sheet",
  });
  console.log("Registered NechronicaItemSheet");

  // Configure trackable attributes.
  CONFIG.Actor.trackableAttributes = {
    hero: {
      bar: ["resources.health", "resources.power", "goodness"],
      value: ["progress"],
    },
    pawn: {
      bar: ["resources.health", "resources.power"],
      value: [],
    },
  };
});

Hooks.once("ready", () => {
  $(document).on(
    "mousedown.tooltip-remove contextmenu.tooltip-remove",
    removeTooltip,
  );
  $(window).on("blur.tooltip-remove", removeTooltip);
  $(window).on("blur.token-tooltip", removeTooltip);

  Hooks.on("renderApplication", removeTooltip);
  Hooks.on("canvasReady", removeTooltip);
});

Hooks.on("createActor", (actor, options, userId) => {
  actor.update({
    img: `systems/nechronica/asset/icon/chara_${actor.type}.png`,
  });
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (actor.type === "doll") {
    const defaultItems = [
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Precious"),
        type: "regret",
        system: {
          effect:
            game.i18n.localize("NECH.DefaultItems.effect.Regression") +
            "(" +
            game.i18n.localize("NECH.DefaultItems.effect.MaxAp") +
            "-2)",
          target: game.i18n.localize("NECH.DefaultItems.name.Precious"),
          madness: 2,
          content: game.i18n.localize("NECH.DefaultItems.effect.Dependence"),
        },
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Brain"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.MaxAp") + "+2",
          location: "head",
          timing: "auto",
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          apBonus: 2,
          partType: "bodypart",
          threat: 1.5,
        },
        img: "/systems/nechronica/asset/icon/parts_head.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Eye"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.MaxAp") + "+1",
          location: "head",
          timing: "auto",
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          apBonus: 1,
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_head.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Chin"),
        type: "bodypart",
        system: {
          effect:
            game.i18n.localize("NECH.DefaultItems.effect.UnarmedAttack") + "1",
          location: "head",
          timing: "action",
          cost: 2,
          range: "0",
          attack: "unarmed",
          damage: 1,
          partType: "bodypart",
          threat: 0.5,
        },
        img: "/systems/nechronica/asset/icon/parts_head.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Fist"),
        type: "bodypart",
        system: {
          description: "",
          effect:
            game.i18n.localize("NECH.DefaultItems.effect.UnarmedAttack") + "1",
          location: "arms",
          timing: "action",
          cost: 2,
          range: "0",
          attack: "unarmed",
          damage: 1,
          partType: "bodypart",
          threat: 0.5,
        },
        img: "/systems/nechronica/asset/icon/parts_arms.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Arm"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.Support") + "1",
          location: "arms",
          timing: "judge",
          cost: 1,
          range: "0",
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_arms.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Shoulder"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          location: "arms",
          timing: "action",
          cost: 4,
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          partType: "bodypart",
          threat: 0.5,
        },
        img: "/systems/nechronica/asset/icon/parts_arms.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Spine"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.SpineEffect"),
          location: "torso",
          timing: "action",
          cost: 1,
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_torso.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Guts"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.None"),
          location: "torso",
          timing: "auto",
          cost: 0,
          range: game.i18n.localize("NECH.DefaultItems.effect.None"),
          partType: "bodypart",
          threat: 0.5,
        },
        img: "/systems/nechronica/asset/icon/parts_torso.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Guts"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.None"),
          location: "torso",
          timing: "auto",
          cost: 0,
          range: game.i18n.localize("NECH.DefaultItems.effect.None"),
          partType: "bodypart",
          threat: 0.5,
        },
        img: "/systems/nechronica/asset/icon/parts_torso.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Bone"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          location: "legs",
          timing: "action",
          cost: 3,
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_legs.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Bone"),
        type: "bodypart",
        system: {
          effect: game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          location: "legs",
          timing: "action",
          cost: 3,
          range: game.i18n.localize("NECH.DefaultItems.effect.Self"),
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_legs.png",
      },
      {
        name: game.i18n.localize("NECH.DefaultItems.name.Leg"),
        type: "bodypart",
        system: {
          effect:
            game.i18n.localize("NECH.DefaultItems.effect.Interference") + "1",
          location: "legs",
          timing: "judge",
          cost: 1,
          range: "0",
          partType: "bodypart",
          threat: 1,
        },
        img: "/systems/nechronica/asset/icon/parts_legs.png",
      },
    ];

    actor.updateSource({ items: defaultItems });
  }
});

Hooks.on("updateActor", async (actor, updates) => {
  if (updates.system?.ap?.value !== undefined) {
    if (!game.combat) return;

    const combat = game.combat;

    const combatant = combat.combatants.find((c) => c.actorId === actor.id);
    if (!combatant) return;

    const newInitiative = actor.system.ap.value;
    await combat.setInitiative(combatant.id, newInitiative);

    const turns = combat.turns;
    if (!turns || turns.length === 0) return;

    const currentTurn = combat.turn ?? 0;
    const currentCombatant = turns[currentTurn];

    const topCombatant = turns[0];

    if (currentCombatant?.id !== topCombatant?.id) {
      await combat.update({ turn: 0 });
    }
  }
});

Hooks.on("updateCombat", (combat, updateData, options, userId) => {
  if (updateData.turn === undefined && updateData.round === undefined) return;

  const highestInitiativeCombatant = combat.combatants.reduce(
    (highest, current) => {
      if (!highest || current.initiative > highest.initiative) {
        return current;
      }
      return highest;
    },
    null,
  );

  if (highestInitiativeCombatant) {
    const newTurnIndex = combat.turns.findIndex(
      (t) => t.id === highestInitiativeCombatant.id,
    );
    if (newTurnIndex !== -1) {
      combat.update({ turn: newTurnIndex });
    }
  }
});

Hooks.on("hoverToken", async (token, hovered) => {
  if (!game.settings.get(game.system.id, "tokenTooltip")) return;

  if (!hovered) {
    removeTooltip();
    return;
  }

  const actor = token.actor;
  if (!actor) return;

  const content = await getTooltip(actor);

  showTooltip(content);
});

function showTooltip(content) {
  removeTooltip();

  const tooltip = $(content);

  $("body").append(tooltip);

  $(document).on("mousemove.token-tooltip", (e) => {
    tooltip.css({
      left: e.clientX + 12,
      top: e.clientY + 12,
    });
  });
}

function removeTooltip() {
  $("#token-tooltip").remove();
  $(document).off(".token-tooltip");
}

Hooks.on("renderApplication", removeTooltip);

Hooks.on("canvasReady", removeTooltip);

async function getTooltip(actor) {
  return await buildTooltipData(actor);
}

function normarizeHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

async function buildTooltipData(actor) {
  if (actor.type === "doll" || actor.type === "savant") {
    const data = buildDollTooltipData(actor);
    return await renderTemplate(
      "systems/nechronica/templates/tooltip/parts-on.hbs",
      data,
    );
  } else {
    const data = buildPawnTooltipData(actor);
    return await renderTemplate(
      "systems/nechronica/templates/tooltip/parts-less.hbs",
      data,
    );
  }
}

function buildDollTooltipData(actor) {
  const PARTS = ["head", "arms", "torso", "legs"];

  const PARTS_HEADER = {
    head: game.i18n.localize("NECH.Locations.Head"),
    arms: game.i18n.localize("NECH.Locations.Arms"),
    torso: game.i18n.localize("NECH.Locations.Torso"),
    legs: game.i18n.localize("NECH.Locations.Legs"),
  };

  const grouped = Object.fromEntries(PARTS.map((p) => [p, []]));

  for (const item of actor.items) {
    if (item.type !== "bodypart") continue;
    const loc = item.system.location;
    if (grouped[loc]) grouped[loc].push(item);
  }

  const parts = PARTS.map((part) => {
    const items = grouped[part];

    return {
      key: part,
      partsHeader: PARTS_HEADER[part],
      max: items.length,
      current: items.filter((i) => i.system?.broken !== true).length,
      items: items.map((i) => ({
        name: i.name,
        timing: getTimingLabel(i.system.timing),
        cost: i.system.cost ?? "-",
        range: i.system.range ?? "-",
        effect: normarizeHtml(i.system.effect),
        used: i.system.used,
        broken: i.system.broken,
      })),
    };
  });

  return {
    name: actor.name,
    type: actor.type,
    threat: actor.system.threat?.value ?? "-",
    apValue: actor.system.ap?.value ?? "-",
    apMax: actor.system.ap?.max ?? "-",
    spine: actor.system.spineCounter?.value ?? "-",
    hpValue: actor.system.hp?.value ?? "-",
    hpMax: actor.system.hp?.max ?? "-",
    parts,
  };
}

function buildPawnTooltipData(actor) {
  const items = actor.items
    .filter((item) => item.type === "bodypart")
    .map((item) => ({
      name: item.name,
      location: item.system.location,
      broken: item.system.broken === true,
      timing: getTimingLabel(item.system.timing),
      cost: item.system.cost ?? "-",
      range: item.system.range ?? "-",
      effect: normarizeHtml(item.system.effect),
      used: item.system.used,
    }));

  const max = items.length;
  const current = items.filter((i) => !i.broken).length;

  return {
    name: actor.name,
    type: actor.type,
    threat: actor.system.threat?.value ?? "-",
    apValue: actor.system.ap?.value ?? "-",
    apMax: actor.system.ap?.max ?? "-",
    spine: actor.system.spineCounter?.value ?? "-",
    hpValue: actor.system.hp?.value ?? "-",
    hpMax: actor.system.hp?.max ?? "-",

    max,
    current,

    items: items.filter((i) => !i.broken),
  };
}

function getTimingLabel(timing) {
  switch (timing) {
    case "action":
      return game.i18n.localize("NECH.TimingShort.Action");
    case "rapid":
      return game.i18n.localize("NECH.TimingShort.Rapid");
    case "damage":
      return game.i18n.localize("NECH.TimingShort.Damage");
    case "judge":
      return game.i18n.localize("NECH.TimingShort.Judge");
    case "auto":
      return game.i18n.localize("NECH.TimingShort.Auto");
    default:
      return "";
  }
}

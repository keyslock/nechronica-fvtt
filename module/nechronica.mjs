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


Hooks.once("init", async() => {

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
    label: "Nechronica Sheet"
  });
  console.log("Registered NechronicaActorSheet");

  Items.registerSheet("nechronica", NechronicaItemSheet, {
    makeDefault: true,
    label: "Nechronica Sheet"
  });
  console.log("Registered NechronicaItemSheet");

  // Configure trackable attributes.
  CONFIG.Actor.trackableAttributes = {
    hero: {
      bar: ["resources.health", "resources.power", "goodness"],
      value: ["progress"]
    },
    pawn: {
      bar: ["resources.health", "resources.power"],
      value: []
    }
  };
});

Hooks.on("createActor", (actor, options, userId) => {
  actor.update({
    "img": `systems/nechronica/asset/icon/chara_${actor.type}.png`
  });
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (actor.type === "doll") {
    // 追加する初期アイテム
    const defaultItems = [
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Precious"),
        "type": "regret",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Regression") + "(" + game.i18n.localize("NECH.DefaultItems.effect.MaxAp") + "-2)",
          "target": game.i18n.localize("NECH.DefaultItems.name.Precious"),
          "madness": 2,
          "content": game.i18n.localize("NECH.DefaultItems.effect.Dependence")
        }
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Brain"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.MaxAp") + "+2",
          "location": "head",
          "timing": "auto",
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "apBonus": 2,
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_head.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Eye"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.MaxAp") + "+1",
          "location": "head",
          "timing": "auto",
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "apBonus": 1,
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_head.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Chin"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.UnarmedAttack") + "1",
          "location": "head",
          "timing": "action",
          "cost": 2,
          "range": "0",
          "attack": "unarmed",
          "damage": 1,
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_head.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Fist"),
        "type": "bodypart",
        "system": {
          "description": "",
          "effect": game.i18n.localize("NECH.DefaultItems.effect.UnarmedAttack") + "1",
          "location": "arms",
          "timing": "action",
          "cost": 2,
          "range": "0",
          "attack": "unarmed",
          "damage": 1,
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_arms.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Arm"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Support") + "1",
          "location": "arms",
          "timing": "judge",
          "cost": 1,
          "range": "0",
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_arms.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Shoulder"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          "location": "arms",
          "timing": "action",
          "cost": 4,
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_arms.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Spine"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.SpineEffect"),
          "location": "torso",
          "timing": "action",
          "cost": 1,
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_torso.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Guts"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.None"),
          "location": "torso",
          "timing": "auto",
          "cost": 0,
          "range": game.i18n.localize("NECH.DefaultItems.effect.None"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_torso.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Guts"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.None"),
          "location": "torso",
          "timing": "auto",
          "cost": 0,
          "range": game.i18n.localize("NECH.DefaultItems.effect.None"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_torso.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Bone"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          "location": "legs",
          "timing": "action",
          "cost": 3,
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_legs.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Bone"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Move") + "1",
          "location": "legs",
          "timing": "action",
          "cost": 3,
          "range": game.i18n.localize("NECH.DefaultItems.effect.Self"),
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_legs.png"
      },
      {
        "name": game.i18n.localize("NECH.DefaultItems.name.Leg"),
        "type": "bodypart",
        "system": {
          "effect": game.i18n.localize("NECH.DefaultItems.effect.Interference") + "1",
          "location": "legs",
          "timing": "judge",
          "cost": 1,
          "range": "0",
          "partType": "bodypart"
        },
        "img": "/systems/nechronica/asset/icon/parts_legs.png"
      }
    ];

    // Actor の `items` データにデフォルトアイテムを設定
    actor.updateSource({ items: defaultItems });
  }
});

Hooks.on("updateActor", async (actor, updates) => {
  // ステータスが変更されたか確認
  if (updates.system?.ap?.value !== undefined) {
    // 戦闘が存在するか確認
    if (game.combat) {
      // 戦闘に含まれているか確認
      const combatant = game.combat.combatants.find(c => c.actorId === actor.id);
      if (combatant) {
        // イニシアティブを新しい値で更新
        const newInitiative = actor.system.ap.value;
        await game.combat.setInitiative(combatant.id, newInitiative);
      }
    }
  }
});

Hooks.on("updateCombat", (combat, updateData, options, userId) => {
  // 戦闘が更新され、イニシアティブが変更されたかどうかを確認
  if (updateData.turn === undefined && updateData.round === undefined) return;

  const highestInitiativeCombatant = combat.combatants.reduce((highest, current) => {
    if (!highest || (current.initiative > highest.initiative)) {
      return current;
    }
    return highest;
  }, null);

  if (highestInitiativeCombatant) {
    const newTurnIndex = combat.turns.findIndex(t => t.id === highestInitiativeCombatant.id);
    if (newTurnIndex !== -1) {
      combat.update({ turn: newTurnIndex });
      console.log(`${highestInitiativeCombatant.token.name} の手番に移動しました。`);
    }
  }
});

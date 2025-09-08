import { NECHRONICA } from "../config.mjs";

export class NechronicaItem extends Item {

    /**
     * Gets the chat data belonging to an item
     */
    getChatData() {
        const itemData = this.system;
        const rollData = this.getRollData();
        const result = {
            effect: this.getEffectData(rollData),
            description: this.getDescriptionData(rollData),
            props: [],
            extraProps: [],
        };

        result.effect = this.getEffectData(rollData);
        result.description = this.getDescriptionData(rollData);

        // Body Part specific data
        if (itemData.type === "bodypart") {
            if (NECHRONICA.attackTypes[itemData.attack]) {
                result.props.push(game.i18n.localize(NECHRONICA.attackTypes[itemData.attack]));
            }
            if (itemData.type === "bodypart" && NECHRONICA.locations[itemData.location]) {
                result.props.push(game.i18n.localize(NECHRONICA.locations[itemData.location]));
            }
            if (NECHRONICA.timings[itemData.timing]) {
                result.props.push(game.i18n.localize(NECHRONICA.timings[itemData.timing]));
            }
            if (itemData.range) {
                result.props.push(game.i18n.localize("NECH.Range") + ` ${itemData.range}`);
            }
            if (itemData.cost !== undefined) {
                result.props.push(game.i18n.localize("NECH.Cost") + ` ${itemData.cost} ` + game.i18n.localize("NECH.AP"));
            }

            for (const [effect, state] of Object.entries(itemData.effects)) {
                if (state) {
                    result.props.push(game.i18n.localize(NECHRONICA.effectTypes[effect]));
                }
            }
        } else if (itemData.type === "fetter") {
            // Fetter specific data
            result.props.push(game.i18n.localize("NECH.Target") + ` ${itemData.target}`);
            if (itemData.type) {
                result.props.push(game.i18n.localize("NECH.Type") + ` ${itemData.type}`);
            }
            result.props.push(game.i18n.localize("NECH.Madness") + ` ${itemData.madness}`);
        }

        return result;
    }

    /**
     * Gets the item's enriched effect text
     *
     * @param rollData - Roll data to enrich the text with
     * @returns Enriched effect text
     */
    getEffectData(rollData) {
        rollData = rollData ?? this.getRollData();
        const effect = getProperty(this.system, "effect") ?? "";
        const result = TextEditor.enrichHTML(effect, { rollData });
        return result;
    }

    /**
     * Gets the item's enriched description text
     *
     * @param rollData - Roll data to enrich the text with
     * @returns Enriched description text
     */
    getDescriptionData(rollData) {
        rollData = rollData ?? this.getRollData();
        const description = getProperty(this.system, "description") ?? "";
        const result = TextEditor.enrichHTML(description, { rollData });
        return result;
    }

    async roll({
        rollType = 0,
        dice = 1,
        skipDialog = false,
        rollBonus = 0,
        damageBonus = 0,
        ev = null
      } = {}) {
        //TODO:ロール
        const actor = this.parent != null ? this.parent : null;
        if (actor === null) return;
        const token = actor?.token;
        const itemData = this.system;
        const template = "systems/nechronica/templates/chat/item-card.hbs";
        const rollData = this.getRollData();
        skipDialog = ev.shiftKey ?? false;
        const isAttack = rollType === "ATTACK";
        const isCheck = rollType === "CHECK";
        const hasAttack = itemData.attack != "";
        let roll, damageRoll, form;
        const combatant = actor?.combatant;
      
        // Template data collection to be used for dialog and chat message
        const templateData = {
          actor,
          tokenId: token ? `${token.object?.scene.id}.${token.id}` : undefined,
          item: this,
          rollMode: game.settings.get("core", "rollMode"),
          rollModes: CONFIG.Dice.rollModes,
          config: NECHRONICA,
          system: this.getChatData(),
          isAttack,
          isCheck,
          hasAttack,
          spineCounter: this.actor?.spineCounter ?? 0,
          roll: undefined,
          optionalModifiers: actor?.optionalModifiers
            ?.filter((o) =>
              ("attack" in itemData && o.modifier.target === itemData.attack) ||
              (isAttack && o.modifier.type === "damage")
            )
            .reduce((acc, val) => {
              if (!acc.find(o => o.name === val.name)) {
                acc.push({ name: val.name, modifiers: [val.modifier] });
              } else {
                acc.find(o => o.name === val.name)?.modifiers.push(val.modifier);
              }
              return acc;
            }, []),
          dice,
          result: { roll: "", type: "", result: "", location: "" },
        };
        // Handle rolls
        if (itemData.type === "bodypart" && (isAttack || isCheck)) {
          let ap;
      
          if (combatant && isAttack) {
            ap = actor?.system?.ap?.value;
      
            // Zero or less AP
            if (ap != null && ap < 1) {
              ui.notifications?.warn(
                localize("Warnings.MissingAP", {
                  actor: this.actor?.name,
                  part: this.name,
                })
              );
              return;
            }
      
            // Used up attack or part
            if (itemData.used && !this.isRepeatable && !ev.ctrlKey) {
              ui.notifications?.warn(
                localize("Warnings.AlreadyUsed", {
                  actor: this.actor?.name,
                  part: this.name,
                })
              );
              return;
            }
          }
      
          // Show dialog when not skipping
          if (!skipDialog) {
            const dialogContent = await renderTemplate(
              "systems/nechronica/templates/roll-dialog.hbs",
              templateData
            );
            form = await new Promise((resolve) => {
              new Dialog({
                title: game.i18n.localize(`${isAttack ? "NECH.Attack" : "NECH.Check"}`) + `: ${this.name}`,
                content: dialogContent,
                buttons: {
                  roll: {
                    label: game.i18n.localize(`NECH.Roll.Roll`),
                    callback: (html) => resolve(html),
                  },
                },
                default: "roll",
              }).render(true);
            });
      
            // Cancel roll on dialog closing
            if (form === undefined) return;
          }

          if ((isAttack && hasAttack) || isCheck) {
            const parts = [];
            const damageParts = [];
            const nd = Number(form?.find('[name="dice"]:checked').val() ?? dice);
            parts.push(`${nd}d10${nd > 1 ? "kh" : ""}`);
      
            // General modifier
            if (isAttack && getProperty(rollData, `modifiers.${itemData.attack}.attack`)) {
              parts.push(`@modifiers.${itemData.attack}.attack`);
              templateData.system.extraProps.push(
                ...(actor?.sourceDetails?.[`data.modifiers.${itemData.attack}.attack`]?.map(
                  (m) => m.name
                ) ?? [])
              );
            }
            // Roll bonus from form
            rollData.rollBonus = Number(form?.find('[name="roll-bonus"]').val()) + rollBonus;
            if (rollData.rollBonus) parts.push("@rollBonus");
      
            // Damage bonus from form
            rollData.damageBonus = Number(form?.find('[name="damage-bonus"]').val()) + damageBonus;
      
            // Collect checked optional modifiers from form
            const usedOptionals = form
              ?.find(".modifier")
              ?.filter(function () {
                return $(this).prop("checked");
              })
              ?.map(function () {
                return Number($(this).prop("name").split(".")[1]);
              })
              .get()
              .map((mod) => templateData.optionalModifiers?.[mod]);
            templateData.system.extraProps.push(
              ...(usedOptionals
                ?.map((m) => m.name)
                .filter((o) => !templateData.system.extraProps.includes(o)) ?? [])
            );
            // Add optionals to roll formula
            parts.push(
              ...(usedOptionals?.flatMap(
                (optional) =>
                  optional?.modifiers
                    ?.filter((mod) => mod.type === "attack")
                    ?.map((mod) => mod.formula) ?? []
              ) ?? [])
            );
            // Create and roll Roll, add render to data for chat message
            roll = await Roll.create(parts.join("+"), rollData).evaluate({ async: true });
            templateData.roll = await roll.render();

            let fumbleFlg = false;
            for(let d of roll.dice[0].results){
              if(d.result == 1){
                fumbleFlg = true;
              }
            }

            // Add roll result and failure/success details
            templateData.result.type = game.i18n.localize(`${isCheck ? "NECH.Check" : "NECH.Attack"}`);
            if (roll.total != null && roll.total <= 1) {
              templateData.result.roll = game.i18n.localize("NECH.Roll.Fumble");
            } else if (roll.total && roll.total > 1 && roll.total <= 5 && fumbleFlg) {
              templateData.result.roll = game.i18n.localize("NECH.Roll.Fumble");
            } else if (roll.total && roll.total > 1 && roll.total <= 5 && !fumbleFlg) {
              templateData.result.roll = game.i18n.localize("NECH.Roll.Failure");
            } else if (roll.total && roll.total >= 6 && roll.total < 11) {
              templateData.result.roll = game.i18n.localize("NECH.Roll.Success");
              templateData.result.location =
              game.i18n.localize(NECHRONICA.hitLocations[roll.total]);
            } else if (roll.total && roll.total >= 11) {
              templateData.result.roll = game.i18n.localize("NECH.Roll.Critical");
              templateData.result.location = game.i18n.localize(NECHRONICA.hitLocations.crit);
            }
      
            // Damage calculation
            if (isAttack && roll.total != null && roll.total >= 6) {
              damageParts.push(itemData.damage);
              if (roll.total > 10) damageParts.push(roll.total - 10);
              if (rollData.damageBonus) damageParts.push(rollData.damageBonus);
              if (getProperty(rollData, `modifiers.${itemData.attack}.damage`)) {
                damageParts.push(`@modifiers.${itemData.attack}.damage`);
              }
              damageParts.push(
                ...(usedOptionals?.flatMap(
                  (optional) =>
                    optional?.modifiers
                      ?.filter((mod) => mod.type === "damage")
                      ?.map((mod) => mod.formula) ?? []
                ) ?? [])
              );
      
              // Create damage roll
              damageRoll = await Roll.create(damageParts.join("+"), rollData).roll({ async: true });
              templateData.damageRoll = await damageRoll.render();
              templateData.damage = {
                total: damageRoll.total ?? 0,
                formula: damageRoll.formula,
              };
            }
          } else {
            roll = new Roll("1").roll();
          }
        }

        // Cost calc
        if(rollType == "MESSAGE"){
          // Set used status
          await this.update({ "system.used": true });
          // Decrease AP
          const cost = itemData.cost;
          const spine = this.name == game.i18n.localize("NECH.DefaultItems.name.Spine");
          actor?.spendAp(cost, spine);
        }
        const rollMode = form?.find('[name="rollMode"]').val();
        const sound =
          game.dice3d?.enabled || rollType === "MESSAGE"
            ? undefined
            : CONFIG.sounds.dice;
        const type = isCheck || isAttack ? CONST.CHAT_MESSAGE_TYPES.ROLL : CONST.CHAT_MESSAGE_TYPES.IC;

        // Handle chat message
        const chatData = {
          user: game.user?.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor ?? undefined }),
          rollMode: rollMode,
          type: type,
          rolls: roll ? [roll] : [],
          content: await renderTemplate(template, templateData),
          flags: { roll, damageRoll },
          sound,
        };
        const message = await ChatMessage.create(chatData);
      
        // Return complete message for API usage
        return message;
      }
      
}

CONFIG.Item.documentClass = NechronicaItem;
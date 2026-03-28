/*
 * キャラクターインポートマクロ
 * キャラクター保管所（https://charasheet.vampire-blood.net/）のキャラクターシートをFVTT用に変換します。
 * マクロの実行後、ID、またはキャラクターシートのURLを入力して使用してください。
 * ※1:継続キャラクターにおける"たからもの"狂気点について、再設定してください。
 * ※2:基本パーツについてはインポートの対象外になってます。必要に応じて設定してください。
 */

(async () => {
  const inputValue = await new Promise((resolve) => {
    new Dialog({
      title: "キャラクターIDまたはURL入力",
      content: `
      <div>
        <label>ID / URL:</label>
        <input id="chara-id" type="text"
              placeholder="例: 100 または https://charasheet.vampire-blood.net/XXX"/>
      </div>
    `,
      buttons: {
        ok: {
          label: "インポート",
          callback: (html) => resolve(html.find("#chara-id").val()),
        },
        cancel: {
          label: "キャンセル",
          callback: () => resolve(null),
        },
      },
      default: "ok",
    }).render(true);
  });

  if (!inputValue) {
    ui.notifications.warn("キャンセルされました");
    return;
  }

  const charaId = extractId(inputValue);

  if (!charaId) {
    ui.notifications.error("IDまたはURLの形式が不正です");
    return;
  }

  let data;
  try {
    data = await fetchJSONP(charaId);
  } catch (e) {
    ui.notifications.error("取得失敗");
    console.error(e);
    return;
  }

  console.log("取得データ:", data);

  const actorData = await convertToActorData(data, charaId);

  let actor;
  try {
    actor = await Actor.create(actorData);
  } catch (e) {
    ui.notifications.error("アクター作成失敗");
    console.error(e);
    return;
  }

  ui.notifications.info(`作成完了: ${actor.name}`);
})();

function extractId(input) {
  if (!input) return null;

  input = input.trim();

  const match = input.match(/charasheet\.vampire-blood\.net\/([a-zA-Z0-9]+)/);
  if (match) return match[1];

  if (/^\d+$/.test(input)) return input;

  if (/^m[a-zA-Z0-9]+$/.test(input)) return input;

  return null;
}

async function fetchJSONP(id) {
  const callbackName = `jsonpCallback_${Date.now()}`;

  return new Promise((resolve, reject) => {
    window[callbackName] = (json) => {
      resolve(json);
      delete window[callbackName];
      script.remove();
    };

    const script = document.createElement("script");
    script.src = `http://charasheet.vampire-blood.net/${id}.js?callback=${callbackName}`;
    script.onerror = () => reject("JSONP読み込み失敗");

    document.body.appendChild(script);
  });
}

async function convertToActorData(data, charaId) {
  if (data.game !== "nechro") {
    ui.notifications.error("ネクロニカキャラクターシートではありません。");
    return null;
  }
  let actor = {
    name: data.pc_name || `Import_${charaId}`,
    type: "doll",
    system: {
      details: {
        experience: Number(data.exp_his_sum) ?? 0,
      },
      attributes: {
        armament: {},
        mutation: {},
        enhancement: {},
      },
    },
    items: [],
  };

  if (data.Position_Name && data.Position_Name !== "") {
    let matchItem = await findEntryInCompendium("Item", data.Position_Name);
    if (matchItem) {
      let setData = await foundry.utils.duplicate(matchItem);
      actor.items.push(setData);
    } else {
      actor.items.push({
        name: data.Position_Name,
        type: "position",
      });
    }
  }

  if (data.MCLS_Name && data.MCLS_Name !== "-" && data.MCLS_Name !== "") {
    let matchItem = await findEntryInCompendium("Item", data.MCLS_Name);
    if (matchItem) {
      let setData = await foundry.utils.duplicate(matchItem);
      actor.items.push(setData);
    } else {
      actor.items.push({
        name: data.MCLS_Name,
        type: "class",
        system: {
          parameter: {
            armament: Number(data.MC1) || 0,
            mutation: Number(data.MC2) || 0,
            enhancement: Number(data.MC3) || 0,
          },
        },
      });
    }
  }

  if (data.SCLS_Name && data.SCLS_Name !== "-" && data.SCLS_Name !== "") {
    let matchItem = await findEntryInCompendium("Item", data.SCLS_Name);
    if (matchItem) {
      let setData = await foundry.utils.duplicate(matchItem);
      actor.items.push(setData);
    } else {
      actor.items.push({
        name: data.SCLS_Name,
        type: "class",
        system: {
          parameter: {
            armament: Number(data.SC1) || 0,
            mutation: Number(data.SC2) || 0,
            enhancement: Number(data.SC3) || 0,
          },
        },
      });
    }
  }

  if (data.ST_Bonus && data.ST_Bonus !== "") {
    const ATTRIBUTES = ["", "armament", "mutation", "enhancement"];
    actor.system.bonusAttribute = ATTRIBUTES[Number(data.ST_Bonus)];
  }

  if (data.TM1 && data.TM1 !== "") {
    actor.system.attributes.armament.experience = Number(data.TM1);
  }

  if (data.TM2 && data.TM2 !== "") {
    actor.system.attributes.mutation.experience = Number(data.TM2);
  }

  if (data.TM3 && data.TM3 !== "") {
    actor.system.attributes.enhancement.experience = Number(data.TM3);
  }

  if (data.sex) {
    switch (data.sex) {
      case "煉獄":
        actor.system.placement = "limbo";
        break;
      case "花園":
        actor.system.placement = "elysium";
        break;
      case "楽園":
        actor.system.placement = "eden";
        break;
      default:
    }
  }

  // get activate value.
  const result = Object.fromEntries(
    ["A", "B", "C"].map((s) => [
      data[`Act_parts_${s}`],
      Number(data[`Act_Parts${s}_Ef`]),
    ]),
  );

  // config index mapping
  const locationMap = {
    4: "head",
    5: "arms",
    6: "torso",
    7: "legs",
  };

  const timingMap = {
    0: "auto",
    1: "action",
    2: "judge",
    3: "damage",
    4: "rapid",
  };

  const attackMap = {
    0: "auto",
    1: "action",
    2: "judge",
    3: "damage",
    4: "rapid",
  };

  // parts
  const basicParts = [
    game.i18n.localize("NECH.DefaultItems.name.Brain"),
    game.i18n.localize("NECH.DefaultItems.name.Eye"),
    game.i18n.localize("NECH.DefaultItems.name.Chin"),
    game.i18n.localize("NECH.DefaultItems.name.Fist"),
    game.i18n.localize("NECH.DefaultItems.name.Arm"),
    game.i18n.localize("NECH.DefaultItems.name.Shoulder"),
    game.i18n.localize("NECH.DefaultItems.name.Spine"),
    game.i18n.localize("NECH.DefaultItems.name.Guts"),
    game.i18n.localize("NECH.DefaultItems.name.Bone"),
    game.i18n.localize("NECH.DefaultItems.name.Leg"),
  ];
  for (let i = 0; i < data.Power_name.length; i++) {
    const manuvaName = data.Power_name[i];
    if (manuvaName === "" || basicParts.includes(manuvaName)) continue;
    let matchItem = await findEntryInCompendium("Item", manuvaName);
    if (matchItem) {
      let setData = await foundry.utils.duplicate(matchItem);
      actor.items.push(setData);
    } else {
      const timing = timingMap[data.Power_timing[i]] ?? "auto";
      const location = locationMap[data.V_Power_hantei[i]] ?? "any";
      const dismember = data.Power_memo[i].includes("切断");
      const explosive = data.Power_memo[i].includes("爆発");
      const areaAttack = data.Power_memo[i].includes("全体攻撃");
      const chain = data.Power_memo[i].includes("連撃");
      const stagger = data.Power_memo[i].includes("転倒");
      const apBonus = result[manuvaName] ?? 0;
      const attackInfo = getAttackTypeFromMemo(data.Power_memo[i]);
      const used = data.Power_Used[i] === "1";
      const broken = data.Power_Lost[i] === "1";
      let setData = {
        name: manuvaName,
        type: "bodypart",
        img: `/systems/nechronica-fvtt/asset/icon/parts_${location}.png`,
        system: {
          description: data.Power_shozoku[i],
          effect: data.Power_memo[i],
          partType: ["1", "2", "3"].includes(data.V_Power_hantei[i])
            ? "skill"
            : "bodypart",
          location: location,
          timing: timing,
          cost: Number(data.Power_cost[i]),
          range: data.Power_range[i],
          effects: {
            dismember: dismember,
            explosive: explosive,
            areaAttack: areaAttack,
            chain: chain,
            stagger: stagger,
          },
          apBonus: apBonus,
          attack: timing === "action" ? attackInfo.key : "-",
          damage: timing === "action" ? attackInfo.value : 0,
          used: used,
          broken: broken,
        },
      };
      actor.items.push(setData);
    }
  }

  // regret
  for (let i = 0; i < data.roice_name.length; i++) {
    const itemName = data.roice_name[i];
    if (itemName === "" || itemName === "たからもの") continue;
    let setData = {
      name: itemName,
      type: "regret",
      system: {
        description: "",
        effect: `${data.roice_neg[i]}(${data.roice_break[i]}`,
        target: itemName,
        madness: Number(data.roice_damage[i]) - 1,
        content: data.roice_pos[i],
      },
    };
    actor.items.push(setData);
  }

  // memories
  for (let i = 0; i < data.kakera_name.length; i++) {
    const itemName = data.kakera_name[i];
    if (itemName === "") continue;
    let setData = {
      name: itemName,
      type: "memory",
      system: {
        description: data.kakera_memo[i],
      },
    };
    actor.items.push(setData);
  }
  // backborn
  actor.system.details.age = data.age;
  let biography = `<table>
      <tr>
        <th>身長</th>
        <th>体重</th>
        <th>髪の色</th>
        <th>瞳の色</th>
        <th>肌の色</th>
      </tr>
      <tr>
        <td style="text-align:center;">${data.pc_height}</td>
        <td style="text-align:center;">${data.pc_weight}</td>
        <td style="text-align:center;">${data.color_hair}</td>
        <td style="text-align:center;">${data.color_eye}</td>
        <td style="text-align:center;">${data.color_skin}</td>
      </tr>
    </table>`;
  actor.system.details.biography = biography;
  actor.system.details.premonitions = data.pc_carma;
  actor.system.details.notes = data.message;

  return actor;
}

async function findEntryInCompendium(type, entryName) {
  const packs = game.packs
    .filter((p) => p.documentClass.documentName === type)
    .sort((a, b) => a.metadata.label.localeCompare(b.metadata.label));
  for (const pack of packs) {
    const index = await pack.getIndex();
    const entryIndex = index.find((e) => e.name === entryName);
    if (entryIndex) {
      const compEntry = await pack.getDocument(entryIndex._id);
      return compEntry;
    }
  }
  return null;
}

const attackTypes = {
  unarmed: "NECH.AttackTypes.Unarmed",
  melee: "NECH.AttackTypes.Melee",
  ranged: "NECH.AttackTypes.Ranged",
  blast: "NECH.AttackTypes.Blast",
  mental: "NECH.AttackTypes.Mental",
};

function getAttackTypeFromMemo(memo) {
  memo = memo ?? "";

  for (const [key, locKey] of Object.entries(attackTypes)) {
    const label = game.i18n.localize(locKey);

    const regex = new RegExp(label + "\\s*([0-9０-９]+)");

    const match = memo.match(regex);

    if (match) {
      const num = Number(
        match[1].replace(/[０-９]/g, (d) =>
          String.fromCharCode(d.charCodeAt(0) - 0xfee0),
        ),
      );

      return { key, value: num };
    }
    if (memo.includes(label)) {
      return { key, value: null };
    }
  }

  return { key: "-", value: null };
}

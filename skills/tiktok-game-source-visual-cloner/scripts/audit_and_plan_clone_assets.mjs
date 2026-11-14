#!/usr/bin/env node
/**
 * Kiểm toán tài nguyên Clone đa nguồn (YouTube / Livestream / GitHub / assets-raw 3-4 ảnh)
 * hỗ trợ chuẩn 2 nhánh Master Blueprint (Branch A: Cutout Rig + ModularActor2D, Branch B: Flipbook .webp) + AI bù file thiếu.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

export const REQUIRED_SPEC = Object.freeze({
  actions: ["idle", "move", "attack", "skill", "hit", "ko"],
  expressions: ["neutral", "angry_rage", "happy_cheer", "hurt_stun", "low_hp_panic"],
  cutoutParts: [
    "body.png", "head.png", "arm_L.png", "arm_R.png", "leg_L.png", "leg_R.png",
    "eyes_normal.png", "eyes_blink.png", "eyes_happy.png", "eyes_shock.png",
    "mouth_idle.png", "mouth_talk.png", "mouth_cheer.png",
  ],
  vfxFlipbooks: ["muzzle_or_slash", "projectile", "impact_hit", "gift_aura"],
  uiSkins: ["hp_bar_frame.png", "gift_toast_box.png", "faction_badge_blue.png", "faction_badge_red.png"],
});

async function listImages(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter((n) => /\.(png|webp)$/i.test(n)).sort();
  } catch {
    return [];
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function auditAndPlanCloneAssets(
  assetsDir,
  characters,
  sourceUrl = "",
  pipelineMode = "two-branch",
) {
  const root = path.resolve(assetsDir);
  await fs.mkdir(root, { recursive: true });

  const artStyleDna = {
    sourceUrl,
    pipelineMode,
    outlineStyle: "locked_to_source_reference",
    paletteMatching: "strict_histogram_and_hex_lock",
    pivotAnchor: [0.5, 1.0],
    requireTrueRgbaAlpha: true,
    sharedMotionsBound: ["idle_breathe.json", "walk.json", "cheer_jump.json", "hit_recoil.json"],
    expressionBlinkIntervalSec: [2.5, 5.5],
  };

  const objectInteractionMatrix = [
    {
      pair: "projectile_vs_shield",
      primitiveGroup: "physics-and-cues",
      visualFx: "impact_hit",
      physicsResponse: "deflect_bounce_45deg",
      hitStopMs: 40,
      targetMood: "hyped",
    },
    {
      pair: "melee_or_projectile_vs_character",
      primitiveGroup: "modular-actor-2d",
      visualFx: "impact_hit",
      physicsResponse: "knockback_impulse_and_squash_stretch",
      hitStopMs: 55,
      attackerMood: "hyped",
      defenderMood: "panicked",
    },
    {
      pair: "gift_summon_vs_arena",
      primitiveGroup: "lighting-shadow",
      visualFx: "gift_aura",
      physicsResponse: "additive_glow_and_contact_shadow",
      hitStopMs: 70,
      summonerMood: "hyped",
    },
  ];

  const foundFiles = [];
  const missingJobs = [];

  for (const cid of characters) {
    // Luôn tạo chuẩn thư mục actions + expressions + cutout rig_parts để tương thích cả 2 chế độ
    for (const act of REQUIRED_SPEC.actions) {
      const actDir = path.join(root, "characters", cid, "actions", act);
      await fs.mkdir(actDir, { recursive: true });
      const imgs = await listImages(actDir);
      if (imgs.length > 0) {
        for (const p of imgs) foundFiles.push(`characters/${cid}/actions/${act}/${p}`);
      } else if (pipelineMode !== "two-branch") {
        missingJobs.push({
          branch: "CLASSIC_FRAMES",
          category: "character_action",
          characterId: cid,
          targetRelPath: `characters/${cid}/actions/${act}/frame_00.png`,
        });
      }
    }

    const expDir = path.join(root, "characters", cid, "expressions");
    await fs.mkdir(expDir, { recursive: true });
    for (const exp of REQUIRED_SPEC.expressions) {
      const fp = path.join(expDir, `${exp}.png`);
      if (await fileExists(fp)) foundFiles.push(`characters/${cid}/expressions/${exp}.png`);
    }

    if (pipelineMode === "two-branch") {
      const rigDir = path.join(root, "characters", cid, "rig_parts");
      await fs.mkdir(rigDir, { recursive: true });
      for (const part of REQUIRED_SPEC.cutoutParts) {
        const fp = path.join(rigDir, part);
        if (await fileExists(fp)) {
          foundFiles.push(`characters/${cid}/rig_parts/${part}`);
        } else {
          missingJobs.push({
            branch: "BRANCH_A_CUTOUT_RIG",
            category: "modular_actor_part",
            characterId: cid,
            targetRelPath: `characters/${cid}/rig_parts/${part}`,
            aiGenerationRule: `Tách/vẽ mảnh rời '${part}' từ 3-4 ảnh tham chiếu của '${cid}' giữ nguyên 100% nét gốc, nền RGBA thật để ghép xương ModularActor2D.`,
          });
        }
      }
    }
  }

  for (const vfxName of REQUIRED_SPEC.vfxFlipbooks) {
    const vdir = path.join(root, "vfx", vfxName);
    await fs.mkdir(vdir, { recursive: true });
    const imgs = await listImages(vdir);
    if (imgs.length > 0) {
      for (const p of imgs) foundFiles.push(`vfx/${vfxName}/${p}`);
    } else {
      missingJobs.push({
        branch: "BRANCH_B_FLIPBOOK_SHEET",
        category: "vfx_spritesheet",
        vfxId: vfxName,
        targetRelPath: `vfx/${vfxName}/${vfxName}_grid.webp`,
        aiGenerationRule: `Sinh dải Grid SpriteSheet 6-12 khung đồng nhất cho hiệu ứng '${vfxName}' xuất .webp + .json (1 Draw Call).`,
      });
    }
  }

  const uiDir = path.join(root, "ui_skins");
  await fs.mkdir(uiDir, { recursive: true });
  for (const uiFile of REQUIRED_SPEC.uiSkins) {
    const fp = path.join(uiDir, uiFile);
    if (await fileExists(fp)) foundFiles.push(`ui_skins/${uiFile}`);
    else {
      missingJobs.push({
        branch: "UI_SKIN",
        category: "source_ui_skin",
        targetRelPath: `ui_skins/${uiFile}`,
      });
    }
  }

  const blueprint = {
    runtime: "nodejs-esm",
    blueprintVersion: "4.0.1.0",
    artStyleDna,
    characters,
    objectInteractionMatrix,
    foundSourceAssetsCount: foundFiles.length,
    missingAssetsToSynthesizeCount: missingJobs.length,
    aiSynthesisQueue: missingJobs,
  };

  const outFp = path.join(root, "clone_fidelity_blueprint.json");
  await fs.writeFile(outFp, `${JSON.stringify(blueprint, null, 2)}\n`, "utf8");
  return { blueprint, outFp };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { values } = parseArgs({
    options: {
      "assets-dir": { type: "string" },
      characters: { type: "string", default: "hero_blue,boss_red" },
      "source-url": { type: "string", default: "" },
      "pipeline-mode": { type: "string", default: "two-branch" },
    },
  });
  if (!values["assets-dir"]) {
    console.error("Thiếu tham số --assets-dir");
    process.exit(1);
  }
  const chars = values.characters.split(",").map((s) => s.trim()).filter(Boolean);
  const { blueprint, outFp } = await auditAndPlanCloneAssets(
    values["assets-dir"],
    chars,
    values["source-url"],
    values["pipeline-mode"],
  );
  console.log(JSON.stringify({
    status: "OK",
    runtime: process.version,
    pipelineMode: values["pipeline-mode"],
    characters: blueprint.characters,
    foundSourceAssetsCount: blueprint.foundSourceAssetsCount,
    missingAssetsToSynthesizeCount: blueprint.missingAssetsToSynthesizeCount,
    blueprint: outFp,
  }));
}

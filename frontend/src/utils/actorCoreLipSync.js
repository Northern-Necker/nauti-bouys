import * as THREE from 'three'

/**
 * ActorCore Lip Sync System
 * Ready-made viseme → ActorCore blendshape mapping for facial animation
 * Based on Rhubarb 11-viseme set with ActorCore's 60 facial blendshapes
 */

// ---- 1) Mapping helpers -----------------------------------------------------

// Utility: pick the first morph name that exists on the mesh
function findFirstExisting(dict, candidates) {
  for (const name of candidates) {
    if (name in dict) return name;
  }
  return null;
}

// Build a resolved mapping (once) after you have mesh.morphTargetDictionary
function resolveActorCoreMap(dict) {
  // First try named morph targets with comprehensive aliases
  let r = {
    // Jaw controls
    JawOpen:        findFirstExisting(dict, [
      "CC_Base_Jaw_Open", "Jaw_Open", "jawOpen", "JAW_Open", "JawOpen",
      "Jaw.Open", "jaw_open", "JawDrop", "jaw_drop", "Jaw Drop"
    ]),
    
    // Basic mouth shapes
    MouthClose:     findFirstExisting(dict, [
      "CC_Base_Mouth_Close", "Mouth_Close", "mouthClose", "MouthClose",
      "Mouth.Close", "mouth_close", "Mouth Close"
    ]),
    MouthOpen:      findFirstExisting(dict, [
      "CC_Base_Mouth_Open", "Mouth_Open", "mouthOpen", "MouthOpen",
      "Mouth.Open", "mouth_open", "Mouth Open"
    ]),
    MouthFunnel:    findFirstExisting(dict, [
      "CC_Base_Mouth_Funnel", "Mouth_Funnel", "mouthFunnel", "MouthFunnel",
      "Mouth.Funnel", "mouth_funnel", "Mouth Funnel", "MouthO"
    ]),
    MouthPucker:    findFirstExisting(dict, [
      "CC_Base_Mouth_Pucker", "Mouth_Pucker", "mouthPucker", "MouthPucker",
      "Mouth.Pucker", "mouth_pucker", "Mouth Pucker", "MouthKiss"
    ]),
    MouthNarrow:    findFirstExisting(dict, [
      "CC_Base_Mouth_Narrow", "Mouth_Narrow", "mouthNarrow", "MouthNarrow",
      "Mouth.Narrow", "mouth_narrow", "Mouth Narrow"
    ]),
    MouthWide:      findFirstExisting(dict, [
      "CC_Base_Mouth_Wide", "Mouth_Wide", "mouthWide", "MouthWide",
      "Mouth.Wide", "mouth_wide", "Mouth Wide", "MouthStretch"
    ]),
    
    // Upper lip controls
    UpperLipUp_L:   findFirstExisting(dict, [
      "CC_Base_UpperLip_Up_L", "UpperLip_Up_L", "upperLipUp_L", "UpperLipUpL",
      "UpperLip.Up.L", "upper_lip_up_l", "Upper Lip Up L", "UpperLipRaise_L"
    ]),
    UpperLipUp_R:   findFirstExisting(dict, [
      "CC_Base_UpperLip_Up_R", "UpperLip_Up_R", "upperLipUp_R", "UpperLipUpR",
      "UpperLip.Up.R", "upper_lip_up_r", "Upper Lip Up R", "UpperLipRaise_R"
    ]),
    
    // Lower lip controls
    LowerLipDown_L: findFirstExisting(dict, [
      "CC_Base_LowerLip_Down_L", "LowerLip_Down_L", "lowerLipDown_L", "LowerLipDownL",
      "LowerLip.Down.L", "lower_lip_down_l", "Lower Lip Down L", "LowerLipDepress_L"
    ]),
    LowerLipDown_R: findFirstExisting(dict, [
      "CC_Base_LowerLip_Down_R", "LowerLip_Down_R", "lowerLipDown_R", "LowerLipDownR",
      "LowerLip.Down.R", "lower_lip_down_r", "Lower Lip Down R", "LowerLipDepress_R"
    ]),
    
    // Mouth corner controls
    MouthSmile_L:   findFirstExisting(dict, [
      "CC_Base_Mouth_Smile_L", "Mouth_Smile_L", "mouthSmile_L", "MouthSmileL",
      "Mouth.Smile.L", "mouth_smile_l", "Mouth Smile L", "MouthCornerUp_L"
    ]),
    MouthSmile_R:   findFirstExisting(dict, [
      "CC_Base_Mouth_Smile_R", "Mouth_Smile_R", "mouthSmile_R", "MouthSmileR",
      "Mouth.Smile.R", "mouth_smile_r", "Mouth Smile R", "MouthCornerUp_R"
    ]),
    MouthFrown_L:   findFirstExisting(dict, [
      "CC_Base_Mouth_Frown_L", "Mouth_Frown_L", "mouthFrown_L", "MouthFrownL",
      "Mouth.Frown.L", "mouth_frown_l", "Mouth Frown L", "MouthCornerDown_L"
    ]),
    MouthFrown_R:   findFirstExisting(dict, [
      "CC_Base_Mouth_Frown_R", "Mouth_Frown_R", "mouthFrown_R", "MouthFrownR",
      "Mouth.Frown.R", "mouth_frown_r", "Mouth Frown R", "MouthCornerDown_R"
    ]),
    
    // Mouth press/compression
    MouthPress_L:   findFirstExisting(dict, [
      "CC_Base_Mouth_Press_L", "Mouth_Press_L", "mouthPress_L", "MouthPressL",
      "Mouth.Press.L", "mouth_press_l", "Mouth Press L", "MouthCompress_L"
    ]),
    MouthPress_R:   findFirstExisting(dict, [
      "CC_Base_Mouth_Press_R", "Mouth_Press_R", "mouthPress_R", "MouthPressR",
      "Mouth.Press.R", "mouth_press_r", "Mouth Press R", "MouthCompress_R"
    ]),
    
    // Mouth dimples
    MouthDimple_L:  findFirstExisting(dict, [
      "CC_Base_Mouth_Dimple_L", "Mouth_Dimple_L", "mouthDimple_L", "MouthDimpleL",
      "Mouth.Dimple.L", "mouth_dimple_l", "Mouth Dimple L"
    ]),
    MouthDimple_R:  findFirstExisting(dict, [
      "CC_Base_Mouth_Dimple_R", "Mouth_Dimple_R", "mouthDimple_R", "MouthDimpleR",
      "Mouth.Dimple.R", "mouth_dimple_r", "Mouth Dimple R"
    ]),
    
    // Mouth shrug
    MouthShrug_Up:  findFirstExisting(dict, [
      "CC_Base_Mouth_Shrug_Upper", "Mouth_Shrug_Upper", "mouthShrugUpper", "MouthShrugUp",
      "Mouth.Shrug.Upper", "mouth_shrug_upper", "Mouth Shrug Upper"
    ]),
    MouthShrug_Dn:  findFirstExisting(dict, [
      "CC_Base_Mouth_Shrug_Lower", "Mouth_Shrug_Lower", "mouthShrugLower", "MouthShrugDown",
      "Mouth.Shrug.Lower", "mouth_shrug_lower", "Mouth Shrug Lower"
    ]),
    
    // Cheek controls
    CheekPuff_L:    findFirstExisting(dict, [
      "CC_Base_Cheek_Puff_L", "Cheek_Puff_L", "cheekPuff_L", "CheekPuffL",
      "Cheek.Puff.L", "cheek_puff_l", "Cheek Puff L", "CheekInflate_L"
    ]),
    CheekPuff_R:    findFirstExisting(dict, [
      "CC_Base_Cheek_Puff_R", "Cheek_Puff_R", "cheekPuff_R", "CheekPuffR",
      "Cheek.Puff.R", "cheek_puff_r", "Cheek Puff R", "CheekInflate_R"
    ]),
    
    // Tongue controls
    TongueOut:      findFirstExisting(dict, [
      "CC_Base_Tongue_Out", "Tongue_Out", "tongueOut", "TongueOut",
      "Tongue.Out", "tongue_out", "Tongue Out", "TongueProtrude"
    ]),
    
    // Eye controls (for expression and WQ viseme)
    EyeBlink_L:     findFirstExisting(dict, [
      "CC_Base_Eye_Blink_L", "Eye_Blink_L", "eyeBlink_L", "EyeBlinkL",
      "Eye.Blink.L", "eye_blink_l", "Eye Blink L", "EyeClose_L"
    ]),
    EyeBlink_R:     findFirstExisting(dict, [
      "CC_Base_Eye_Blink_R", "Eye_Blink_R", "eyeBlink_R", "EyeBlinkR",
      "Eye.Blink.R", "eye_blink_r", "Eye Blink R", "EyeClose_R"
    ]),
    
    // Lip roll controls (for F/V sounds)
    MouthRollIn_Up: findFirstExisting(dict, [
      "CC_Base_Mouth_Roll_In_Upper", "Mouth_Roll_In_Upper", "mouthRollInUpper", "MouthRollInUp",
      "Mouth.Roll.In.Upper", "mouth_roll_in_upper", "Mouth Roll In Upper", "UpperLipRollIn"
    ]),
    MouthRollIn_Lo: findFirstExisting(dict, [
      "CC_Base_Mouth_Roll_In_Lower", "Mouth_Roll_In_Lower", "mouthRollInLower", "MouthRollInLow",
      "Mouth.Roll.In.Lower", "mouth_roll_in_lower", "Mouth Roll In Lower", "LowerLipRollIn"
    ]),
    
    // Additional common ActorCore blendshapes
    MouthStretch_L: findFirstExisting(dict, [
      "CC_Base_Mouth_Stretch_L", "Mouth_Stretch_L", "mouthStretch_L", "MouthStretchL",
      "Mouth.Stretch.L", "mouth_stretch_l", "Mouth Stretch L"
    ]),
    MouthStretch_R: findFirstExisting(dict, [
      "CC_Base_Mouth_Stretch_R", "Mouth_Stretch_R", "mouthStretch_R", "MouthStretchR",
      "Mouth.Stretch.R", "mouth_stretch_r", "Mouth Stretch R"
    ]),
    
    // Lip corner pull
    MouthCornerPull_L: findFirstExisting(dict, [
      "CC_Base_Mouth_Corner_Pull_L", "Mouth_Corner_Pull_L", "mouthCornerPull_L",
      "MouthCornerPullL", "Mouth.Corner.Pull.L", "mouth_corner_pull_l"
    ]),
    MouthCornerPull_R: findFirstExisting(dict, [
      "CC_Base_Mouth_Corner_Pull_R", "Mouth_Corner_Pull_R", "mouthCornerPull_R",
      "MouthCornerPullR", "Mouth.Corner.Pull.R", "mouth_corner_pull_r"
    ]),
  };

  // Add ARKit-standard blendshape names (ActorCore uses these)
  const arkitAliases = {
    // Eye controls - ARKit standard names
    EyeBlink_L: findFirstExisting(dict, ["eyeBlinkLeft", "Eye_Blink_L", "eyeBlink_L"]),
    EyeBlink_R: findFirstExisting(dict, ["eyeBlinkRight", "Eye_Blink_R", "eyeBlink_R"]),
    
    // Jaw controls - ARKit standard
    JawOpen: findFirstExisting(dict, ["jawOpen", "Open", "Jaw_Open", "jawDrop"]),
    JawForward: findFirstExisting(dict, ["jawForward", "Jaw_Forward"]),
    JawLeft: findFirstExisting(dict, ["jawLeft", "Jaw_Left"]),
    JawRight: findFirstExisting(dict, ["jawRight", "Jaw_Right"]),
    
    // Mouth controls - ARKit standard
    MouthClose: findFirstExisting(dict, ["mouthClose", "Mouth_Close"]),
    MouthFunnel: findFirstExisting(dict, ["mouthFunnel", "Mouth_Funnel"]),
    MouthPucker: findFirstExisting(dict, ["mouthPucker", "Mouth_Pucker"]),
    MouthLeft: findFirstExisting(dict, ["mouthLeft", "Mouth_Left"]),
    MouthRight: findFirstExisting(dict, ["mouthRight", "Mouth_Right"]),
    MouthWide: findFirstExisting(dict, ["mouthStretchLeft", "mouthStretchRight", "Mouth_Wide"]),
    
    // Mouth corners - ARKit standard
    MouthSmile_L: findFirstExisting(dict, ["mouthSmileLeft", "Mouth_Smile_L"]),
    MouthSmile_R: findFirstExisting(dict, ["mouthSmileRight", "Mouth_Smile_R"]),
    MouthFrown_L: findFirstExisting(dict, ["mouthFrownLeft", "Mouth_Frown_L"]),
    MouthFrown_R: findFirstExisting(dict, ["mouthFrownRight", "Mouth_Frown_R"]),
    MouthDimple_L: findFirstExisting(dict, ["mouthDimpleLeft", "Mouth_Dimple_L"]),
    MouthDimple_R: findFirstExisting(dict, ["mouthDimpleRight", "Mouth_Dimple_R"]),
    MouthStretch_L: findFirstExisting(dict, ["mouthStretchLeft", "Mouth_Stretch_L"]),
    MouthStretch_R: findFirstExisting(dict, ["mouthStretchRight", "Mouth_Stretch_R"]),
    
    // Lip controls - ARKit standard
    MouthRollIn_Up: findFirstExisting(dict, ["mouthRollUpper", "Mouth_Roll_Upper"]),
    MouthRollIn_Lo: findFirstExisting(dict, ["mouthRollLower", "Mouth_Roll_Lower"]),
    MouthShrug_Up: findFirstExisting(dict, ["mouthShrugUpper", "Mouth_Shrug_Upper"]),
    MouthShrug_Dn: findFirstExisting(dict, ["mouthShrugLower", "Mouth_Shrug_Lower"]),
    MouthPress_L: findFirstExisting(dict, ["mouthPressLeft", "Mouth_Press_L"]),
    MouthPress_R: findFirstExisting(dict, ["mouthPressRight", "Mouth_Press_R"]),
    UpperLipUp_L: findFirstExisting(dict, ["mouthUpperUpLeft", "UpperLip_Up_L"]),
    UpperLipUp_R: findFirstExisting(dict, ["mouthUpperUpRight", "UpperLip_Up_R"]),
    LowerLipDown_L: findFirstExisting(dict, ["mouthLowerDownLeft", "LowerLip_Down_L"]),
    LowerLipDown_R: findFirstExisting(dict, ["mouthLowerDownRight", "LowerLip_Down_R"]),
    
    // Cheek controls - ARKit standard
    CheekPuff_L: findFirstExisting(dict, ["cheekPuff", "cheekSquintLeft", "Cheek_Puff_L"]),
    CheekPuff_R: findFirstExisting(dict, ["cheekPuff", "cheekSquintRight", "Cheek_Puff_R"]),
    
    // Nose controls - ARKit standard
    NoseSneer_L: findFirstExisting(dict, ["noseSneerLeft", "Nose_Sneer_L"]),
    NoseSneer_R: findFirstExisting(dict, ["noseSneerRight", "Nose_Sneer_R"]),
    
    // Brow controls - ARKit standard
    BrowDown_L: findFirstExisting(dict, ["browDownLeft", "Brow_Down_L"]),
    BrowDown_R: findFirstExisting(dict, ["browDownRight", "Brow_Down_R"]),
    BrowInnerUp: findFirstExisting(dict, ["browInnerUp", "Brow_Inner_Up"]),
    BrowOuterUp_L: findFirstExisting(dict, ["browOuterUpLeft", "Brow_Outer_Up_L"]),
    BrowOuterUp_R: findFirstExisting(dict, ["browOuterUpRight", "Brow_Outer_Up_R"]),
    
    // Eye controls - ARKit standard (additional)
    EyeLookDown_L: findFirstExisting(dict, ["eyeLookDownLeft", "Eye_Look_Down_L"]),
    EyeLookDown_R: findFirstExisting(dict, ["eyeLookDownRight", "Eye_Look_Down_R"]),
    EyeLookIn_L: findFirstExisting(dict, ["eyeLookInLeft", "Eye_Look_In_L"]),
    EyeLookIn_R: findFirstExisting(dict, ["eyeLookInRight", "Eye_Look_In_R"]),
    EyeLookOut_L: findFirstExisting(dict, ["eyeLookOutLeft", "Eye_Look_Out_L"]),
    EyeLookOut_R: findFirstExisting(dict, ["eyeLookOutRight", "Eye_Look_Out_R"]),
    EyeLookUp_L: findFirstExisting(dict, ["eyeLookUpLeft", "Eye_Look_Up_L"]),
    EyeLookUp_R: findFirstExisting(dict, ["eyeLookUpRight", "Eye_Look_Up_R"]),
    EyeSquint_L: findFirstExisting(dict, ["eyeSquintLeft", "Eye_Squint_L"]),
    EyeSquint_R: findFirstExisting(dict, ["eyeSquintRight", "Eye_Squint_R"]),
    EyeWide_L: findFirstExisting(dict, ["eyeWideLeft", "Eye_Wide_L"]),
    EyeWide_R: findFirstExisting(dict, ["eyeWideRight", "Eye_Wide_R"]),
    
    // Visemes for lip-sync (ActorCore's additional morphs)
    Viseme_sil: findFirstExisting(dict, ["viseme_sil", "Viseme_sil", "silence"]),
    Viseme_PP: findFirstExisting(dict, ["viseme_PP", "Viseme_PP", "viseme_p"]),
    Viseme_FF: findFirstExisting(dict, ["viseme_FF", "Viseme_FF", "viseme_f"]),
    Viseme_TH: findFirstExisting(dict, ["viseme_TH", "Viseme_TH", "viseme_th"]),
    Viseme_DD: findFirstExisting(dict, ["viseme_DD", "Viseme_DD", "viseme_d"]),
    Viseme_kk: findFirstExisting(dict, ["viseme_kk", "Viseme_kk", "viseme_k"]),
    Viseme_CH: findFirstExisting(dict, ["viseme_CH", "Viseme_CH", "viseme_ch"]),
    Viseme_SS: findFirstExisting(dict, ["viseme_SS", "Viseme_SS", "viseme_s"]),
    Viseme_nn: findFirstExisting(dict, ["viseme_nn", "Viseme_nn", "viseme_n"]),
    Viseme_RR: findFirstExisting(dict, ["viseme_RR", "Viseme_RR", "viseme_r"]),
    Viseme_aa: findFirstExisting(dict, ["viseme_aa", "Viseme_aa", "viseme_a"]),
    Viseme_E: findFirstExisting(dict, ["viseme_E", "Viseme_E", "viseme_e"]),
    Viseme_I: findFirstExisting(dict, ["viseme_I", "Viseme_I", "viseme_i"]),
    Viseme_O: findFirstExisting(dict, ["viseme_O", "Viseme_O", "viseme_o"]),
    Viseme_U: findFirstExisting(dict, ["viseme_U", "Viseme_U", "viseme_u"]),
  };

  // Merge ARKit aliases with existing mapping, ARKit takes precedence
  Object.keys(arkitAliases).forEach(key => {
    if (arkitAliases[key] !== null) {
      r[key] = arkitAliases[key];
    }
  });

  // If still no named morph targets found, try numbered fallback mapping
  // This handles GLB exports where morph target names are stripped to numbers
  const hasNamedTargets = Object.values(r).some(val => val !== null);
  
  if (!hasNamedTargets) {
    console.log('No named morph targets found, using numbered fallback mapping for ActorCore/CC4');
    
    // Standard ActorCore/CC4 blendshape order (based on typical exports)
    // These indices are educated guesses based on common ActorCore ordering
    const numberedMapping = {
      // Eye controls (typically first in CC4 exports)
      EyeBlink_L: "0",      // eyeBlinkLeft
      EyeBlink_R: "1",      // eyeBlinkRight
      
      // Jaw controls
      JawOpen: "2",         // jawOpen
      
      // Basic mouth shapes (core lip sync targets)
      MouthFunnel: "15",    // mouthFunnel (O/U sounds)
      MouthPucker: "16",    // mouthPucker (U/W sounds)
      MouthWide: "20",      // mouthStretchLeft/Right (E/I sounds)
      MouthClose: "14",     // mouthClose (M/B/P sounds)
      
      // Mouth corners (smile/frown)
      MouthSmile_L: "21",   // mouthSmileLeft
      MouthSmile_R: "22",   // mouthSmileRight
      MouthFrown_L: "13",   // mouthFrownLeft
      MouthFrown_R: "12",   // mouthFrownRight
      
      // Lip controls
      UpperLipUp_L: "30",   // mouthUpperUpLeft
      UpperLipUp_R: "31",   // mouthUpperUpRight
      LowerLipDown_L: "10", // mouthLowerDownLeft
      LowerLipDown_R: "11", // mouthLowerDownRight
      
      // Mouth press (for consonants)
      MouthPress_L: "19",   // mouthPressLeft
      MouthPress_R: "23",   // mouthPressRight
      
      // Cheek controls
      CheekPuff_L: "6",     // cheekSquintLeft
      CheekPuff_R: "7",     // cheekSquintRight
      
      // Additional controls (if available)
      MouthDimple_L: "8",   // mouthDimpleLeft
      MouthDimple_R: "9",   // mouthDimpleRight
      MouthShrug_Up: "24",  // mouthShrugUpper
      MouthShrug_Dn: "25",  // mouthShrugLower
      
      // Lip roll (for F/V sounds)
      MouthRollIn_Lo: "26", // mouthRollLower
      MouthRollIn_Up: "27", // mouthRollUpper
      
      // Visemes (if available)
      Viseme_aa: "28",      // viseme_aa
      Viseme_E: "29",       // viseme_E
      Viseme_I: "32",       // viseme_I
      Viseme_O: "33",       // viseme_O
      Viseme_U: "34",       // viseme_U
    };
    
    // Apply numbered mapping, but only if the index exists
    Object.keys(numberedMapping).forEach(key => {
      const index = numberedMapping[key];
      if (index in dict) {
        r[key] = index;
      }
    });
    
    console.log('Applied numbered morph target mapping:', r);
  }
  
  return r;
}

// ---- 2) Rhubarb 11-viseme → ActorCore mix ----------------------------------
// Each viseme emits a set of (targetName, weight) pairs. We split L/R where useful.
// Weights here are reasonable starting points; tweak per character.

function makeVisemeMixer(map) {
  const S = (name) => map[name]; // short alias

  const mix = {
    // AI: "a" / "eye" — big jaw open + slight narrow/upper lip lift
    "AI": () => [
      [S("JawOpen"), 1.00],
      [S("MouthNarrow"), 0.25],
      [S("UpperLipUp_L"), 0.25], [S("UpperLipUp_R"), 0.25],
      [S("MouthSmile_L"), 0.10], [S("MouthSmile_R"), 0.10],
    ],

    // E: "eh/ee" — wide corners + some upper lip raise
    "E": () => [
      [S("MouthWide"), 0.85],
      [S("UpperLipUp_L"), 0.35], [S("UpperLipUp_R"), 0.35],
      [S("MouthSmile_L"), 0.25], [S("MouthSmile_R"), 0.25],
      [S("JawOpen"), 0.25],
    ],

    // I: often similar to E but less wide, more narrow/press
    "I": () => [
      [S("MouthWide"), 0.55],
      [S("MouthNarrow"), 0.30],
      [S("UpperLipUp_L"), 0.25], [S("UpperLipUp_R"), 0.25],
      [S("JawOpen"), 0.30],
    ],

    // O: round mouth (funnel/pucker) + jaw
    "O": () => [
      [S("MouthFunnel"), 0.65],
      [S("MouthPucker"), 0.45],
      [S("JawOpen"), 0.45],
      [S("LowerLipDown_L"), 0.20], [S("LowerLipDown_R"), 0.20],
    ],

    // U: tight pucker, less jaw
    "U": () => [
      [S("MouthPucker"), 0.85],
      [S("MouthFunnel"), 0.35],
      [S("JawOpen"), 0.25],
    ],

    // C: "ch/j/sh/zh" (fricatives/affricates) — slight open + corners pressed
    "C": () => [
      [S("JawOpen"), 0.30],
      [S("MouthPress_L"), 0.40], [S("MouthPress_R"), 0.40],
      [S("MouthNarrow"), 0.30],
    ],

    // D: "t/d/k/g/s/z" — light open, some narrow, slight frown (tension)
    "D": () => [
      [S("JawOpen"), 0.35],
      [S("MouthNarrow"), 0.35],
      [S("MouthFrown_L"), 0.15], [S("MouthFrown_R"), 0.15],
    ],

    // F: "f/v" — upper teeth on lower lip: roll lower lip in, press corners
    "F": () => [
      [S("MouthRollIn_Lo"), 0.80],
      [S("MouthPress_L"), 0.35], [S("MouthPress_R"), 0.35],
      [S("JawOpen"), 0.20],
    ],

    // L: tongue/lip shape; if TongueOut exists, add a hint; otherwise jaw+press
    "L": () => [
      [S("JawOpen"), 0.35],
      [S("MouthPress_L"), 0.25], [S("MouthPress_R"), 0.25],
      [S("TongueOut"), 0.25],
    ],

    // M: "m/b/p" — closed lips (press), tiny jaw
    "M": () => [
      [S("MouthPress_L"), 0.90], [S("MouthPress_R"), 0.90],
      [S("MouthClose"), 0.80],
      [S("JawOpen"), 0.05],
    ],

    // WQ: "w/oo" — rounded lips + maybe a little blink to add life
    "WQ": () => [
      [S("MouthPucker"), 0.70],
      [S("MouthFunnel"), 0.40],
      [S("JawOpen"), 0.25],
      [S("EyeBlink_L"), 0.05], [S("EyeBlink_R"), 0.05],
    ],

    // Rest/neutral
    "rest": () => [
      [S("MouthClose"), 0.50],
      [S("MouthShrug_Up"), 0.10], [S("MouthShrug_Dn"), 0.10],
      [S("MouthDimple_L"), 0.10], [S("MouthDimple_R"), 0.10],
    ],
  };

  // Remove null targets (missing on a given model)
  for (const k of Object.keys(mix)) {
    mix[k] = mix[k]().filter(([name, _]) => !!name);
  }
  return mix;
}

// ---- 3) Real-time driver ----------------------------------------------------
// Example: apply one viseme frame (from your timing system) with smoothing.

function createMorphDriver(targetMesh) {
  const dict = targetMesh.morphTargetDictionary;
  const infl = targetMesh.morphTargetInfluences;
  const nameToIndex = Object.fromEntries(Object.entries(dict).map(([n,i]) => [n, i]));

  const map = resolveActorCoreMap(dict);
  const visemeMix = makeVisemeMixer(map);

  // Simple critically-damped low-pass
  const smoothing = 0.5; // 0..1; raise for snappier
  const active = new Map(); // name -> weight

  function applyViseme(viseme, strength = 1.0) {
    // Decay everything a bit
    for (let i=0;i<infl.length;i++) infl[i] *= (1 - smoothing*0.5);

    const pairs = visemeMix[viseme] || visemeMix["rest"];
    for (const [name, baseW] of pairs) {
      const idx = nameToIndex[name];
      if (idx === undefined) continue;
      const w = Math.max(0, Math.min(1, baseW * strength));
      infl[idx] = (1 - smoothing) * (infl[idx] || 0) + smoothing * w;
      active.set(idx, infl[idx]);
    }

    // Optional: light clamp on overlapping shapes
    // (keep max <= 1.0). Many rigs tolerate sums >1, but clamp if you see artifacts.
    for (const [idx, w] of active) infl[idx] = Math.min(1, w);
  }

  // Get mapping info for debugging
  function getMappingInfo() {
    const resolved = {};
    const missing = {};
    
    Object.entries(map).forEach(([key, value]) => {
      if (value) {
        resolved[key] = value;
      } else {
        missing[key] = true;
      }
    });

    return {
      resolved,
      missing,
      totalMorphTargets: Object.keys(dict).length,
      availableVisemes: Object.keys(visemeMix)
    };
  }

  // Test a specific viseme
  function testViseme(viseme, strength = 1.0, duration = 2000) {
    console.log(`Testing viseme: ${viseme} at strength ${strength}`);
    applyViseme(viseme, strength);
    
    // Reset after duration
    setTimeout(() => {
      applyViseme("rest", 0.5);
      console.log(`Reset to rest position`);
    }, duration);
  }

  return { 
    applyViseme, 
    getMappingInfo, 
    testViseme,
    map,
    visemeMix 
  };
}

// ---- 4) Enhanced ActorCore Lip Sync Class ----------------------------------

export class ActorCoreLipSync {
  constructor(faceMesh) {
    this.faceMesh = faceMesh;
    this.driver = null;
    this.isInitialized = false;
    this.currentViseme = "rest";
    this.animationQueue = [];
    this.isPlaying = false;
    
    this.initialize();
  }

  initialize() {
    if (!this.faceMesh || !this.faceMesh.morphTargetDictionary) {
      console.error('ActorCoreLipSync: Face mesh or morph targets not found');
      return;
    }

    this.driver = createMorphDriver(this.faceMesh);
    this.isInitialized = true;
    
    const info = this.driver.getMappingInfo();
    console.log('ActorCore Lip Sync initialized:', info);
    
    // Log all available morph targets for debugging
    console.log('Available morph targets:', Object.keys(this.faceMesh.morphTargetDictionary));
  }

  // Speak text using TTS and lip sync
  async speakText(text, options = {}) {
    const {
      voice = 'en-US',
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0
    } = options;

    if (!this.isInitialized) {
      console.error('ActorCoreLipSync not initialized');
      return;
    }

    try {
      // Create speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = speechSynthesis.getVoices().find(v => v.lang.includes(voice)) || null;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Generate viseme sequence from text (simplified phoneme mapping)
      const visemeSequence = this.textToVisemes(text);
      
      // Start lip sync animation
      this.playVisemeSequence(visemeSequence, utterance.rate);
      
      // Speak the text
      speechSynthesis.speak(utterance);
      
      return new Promise((resolve) => {
        utterance.onend = () => {
          this.driver.applyViseme("rest", 0.5);
          resolve();
        };
      });
    } catch (error) {
      console.error('Error in speakText:', error);
      this.driver.applyViseme("rest", 0.5);
    }
  }

  // Convert text to viseme sequence (simplified)
  textToVisemes(text) {
    const words = text.toLowerCase().split(/\s+/);
    const sequence = [];
    let time = 0;
    
    words.forEach(word => {
      // Simple phoneme mapping - in production, use Rhubarb or similar
      const visemes = this.wordToVisemes(word);
      visemes.forEach(viseme => {
        sequence.push({
          time: time,
          viseme: viseme,
          duration: 0.15 // 150ms per viseme
        });
        time += 0.15;
      });
      
      // Add pause between words
      sequence.push({
        time: time,
        viseme: "rest",
        duration: 0.1
      });
      time += 0.1;
    });
    
    return sequence;
  }

  // Simple word to viseme mapping (for demo purposes)
  wordToVisemes(word) {
    const visemeMap = {
      'hello': ['M', 'E', 'L', 'O'],
      'world': ['WQ', 'O', 'L', 'D'],
      'welcome': ['WQ', 'E', 'L', 'C', 'O', 'M'],
      'nauti': ['AI', 'O', 'D', 'I'],
      'bouys': ['M', 'O', 'I', 'S'],
      'how': ['AI', 'O'],
      'are': ['AI', 'R'],
      'you': ['U', 'O'],
      'today': ['D', 'O', 'D', 'AI'],
      'good': ['G', 'U', 'D'],
      'morning': ['M', 'O', 'R', 'I', 'G'],
      'evening': ['I', 'V', 'I', 'G'],
      'thank': ['TH', 'AI', 'G', 'K'],
      'thanks': ['TH', 'AI', 'G', 'K', 'S']
    };
    
    return visemeMap[word] || ['AI', 'E', 'O']; // Default fallback
  }

  // Play a sequence of visemes with timing
  playVisemeSequence(sequence, speedMultiplier = 1.0) {
    if (this.isPlaying) {
      this.stopAnimation();
    }
    
    this.isPlaying = true;
    this.animationQueue = [...sequence];
    
    const startTime = Date.now();
    
    const animate = () => {
      if (!this.isPlaying || this.animationQueue.length === 0) {
        this.isPlaying = false;
        this.driver.applyViseme("rest", 0.5);
        return;
      }
      
      const currentTime = (Date.now() - startTime) / 1000 / speedMultiplier;
      
      // Find current viseme
      while (this.animationQueue.length > 0 && this.animationQueue[0].time <= currentTime) {
        const visemeEvent = this.animationQueue.shift();
        this.driver.applyViseme(visemeEvent.viseme, 1.0);
        this.currentViseme = visemeEvent.viseme;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Stop current animation
  stopAnimation() {
    this.isPlaying = false;
    this.animationQueue = [];
    this.driver.applyViseme("rest", 0.5);
  }

  // Test individual visemes
  testViseme(viseme, strength = 1.0, duration = 2000) {
    if (!this.isInitialized) {
      console.error('ActorCoreLipSync not initialized');
      return;
    }
    
    this.driver.testViseme(viseme, strength, duration);
  }

  // Get available visemes
  getAvailableVisemes() {
    return this.driver ? this.driver.getMappingInfo().availableVisemes : [];
  }

  // Get mapping information
  getMappingInfo() {
    return this.driver ? this.driver.getMappingInfo() : null;
  }
}

// ---- 5) Export utilities ----------------------------------------------------

export { createMorphDriver, resolveActorCoreMap, makeVisemeMixer };

// Example usage:
// const lipSync = new ActorCoreLipSync(faceMesh);
// lipSync.speakText("Hello, welcome to Nauti Bouys!");
// lipSync.testViseme("AI", 1.0, 2000);

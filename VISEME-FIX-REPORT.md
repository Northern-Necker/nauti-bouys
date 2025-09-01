# Viseme Mapping Fix Report

## Issue Identified
The PP viseme (for P/B bilabial plosive sounds) was incorrectly showing puckered/pursed lips (like a kiss) instead of lips pressed together.

## Root Cause
The viseme mapping was using `Mouth_Pucker` morph which creates lip rounding/pursing, not the pressed-together lips needed for P/B sounds.

## Research Findings
Per phonetic research on bilabial plosives:
- P/B sounds require "closed lip configuration to build pressure before sound release"
- Lips must be pressed together (not puckered) to create the proper seal
- The closure builds air pressure that's released with a burst

## Solution Applied

### Corrected PP Viseme Mapping
```javascript
// FIXED: PP bilabial plosives - lips pressed together (not puckered!)
PP: { morphs: ['V_Tight', 'V_Lip_Open'], weights: [1.0, -0.2] }
```

- `V_Tight` at 1.0: Creates proper lip closure/pressing
- `V_Lip_Open` at -0.2: Negative weight ensures complete seal

## All Viseme Mappings (Corrected)

| Viseme | Phonetic Type | Morphs Used | Description |
|--------|--------------|-------------|-------------|
| **PP** | Bilabial plosives | V_Tight (1.0), V_Lip_Open (-0.2) | P, B - lips pressed together |
| **FF** | Labiodental | V_Dental_Lip, Mouth_Frown_L/R | F, V - lower lip to upper teeth |
| **TH** | Dental | V_Open, Tongue_Out | TH - tongue between teeth |
| **DD** | Alveolar | V_Open, Tongue_Tip_Up | D, T, N - tongue to ridge |
| **kk** | Velar | V_Tight, V_Open | K, G - back tongue raised |
| **CH** | Affricate | V_Affricate, V_Wide | CH, J, SH - combined stop/fricative |
| **SS** | Sibilant | V_Tight, V_Wide | S, Z - narrow with teeth close |
| **nn** | Nasal | V_Tight, Mouth_Smile_L/R | N, M, NG - slight closure |
| **RR** | Approximant | V_Open, V_Wide | R, L - partial constriction |
| **aa** | Open vowel | V_Open, Jaw_Open | AH - mouth wide open |
| **E** | Mid-front vowel | V_Wide | EH - moderate spread |
| **I** | Close-front vowel | V_Wide, Mouth_Smile_L/R | EE - minimal opening |
| **O** | Mid-back vowel | Mouth_Pucker, V_Open | OH - rounded with opening |
| **U** | Close-back vowel | Mouth_Pucker, V_Tight-O | OO - maximum rounding |

## Testing Status
- [x] PP viseme corrected to show proper lip pressing
- [ ] Full visual validation of all visemes needed
- [ ] Test with actual speech for natural transitions

## Files Modified
- `frontend/src/utils/babylonGLBActorCoreLipSync.js` - Updated viseme mappings

## Date: 2025-01-26

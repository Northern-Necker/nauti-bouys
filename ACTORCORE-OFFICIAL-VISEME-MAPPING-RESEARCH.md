# ActorCore Official Viseme Mapping Research

## Research Summary
Based on official Reallusion Character Creator 4 documentation, I've identified the authoritative ActorCore viseme system specifications.

## Official ActorCore/iClone Viseme System

### 15 Standard Visemes
According to the official documentation, each ActorCore character uses 15 standard visemes:

1. **AE** - Low front vowel (like "cat")
2. **Ah** - Low back vowel (like "father") 
3. **B_M_P** - Bilabial plosives (P, B, M sounds)
4. **Ch_J** - Affricates (CH, J sounds)
5. **EE** - High front vowel (like "see")
6. **Er** - Rhotic vowel (like "her")
7. **F_V** - Labiodental fricatives (F, V sounds)
8. **Ih** - Near-close front vowel (like "sit")
9. **K_G_H_NG** - Velar consonants (K, G, H, NG sounds)
10. **Oh** - Mid back rounded vowel (like "go")
11. **R** - Rhotic consonant
12. **S_Z** - Sibilant fricatives (S, Z sounds)
13. **T_L_D_N** - Alveolar consonants (T, L, D, N sounds)
14. **Th** - Dental fricatives (TH sounds)
15. **W_OO** - Close back rounded vowel with lip rounding (W, OO sounds)

## ActorCore Viseme Systems

### 8+7 Phoneme Pair System
- Composes 15 visemes from **8 basic lip shapes** + **7 tongue movements**
- System automatically generates the 15 visemes from these basic components
- More efficient for animation setup

### 1:1 Direct System  
- Modifies each of the 15 visemes directly
- More granular control over individual viseme shapes

## Expression Set Compatibility

### CC4 Standard Set (Most Relevant)
- **52 ARKit** + **11 Tongue** morph sliders
- Medium morphing slider count
- Can perform basic facial expressions
- **Best match for our GLB model** (exported from Blender via FBX from Character Creator)

### CC4 Extended Set
- Maximum morphing sliders
- Matches Meta Human for Live Link synchronization
- Divides morphs into up/down/left/right parts

## Mapping to Our Current System

| Our System | ActorCore Official | Notes |
|------------|-------------------|-------|
| sil | *Neutral/Rest* | Silence state |
| PP | B_M_P | Bilabial plosives (P, B, M) ✅ |
| FF | F_V | Labiodental fricatives (F, V) ✅ |
| TH | Th | Dental fricatives ✅ |
| DD | T_L_D_N | Alveolar consonants (T, L, D, N) ✅ |
| kk | K_G_H_NG | Velar consonants (K, G, H, NG) ✅ |
| CH | Ch_J | Affricates (CH, J) ✅ |
| SS | S_Z | Sibilant fricatives (S, Z) ✅ |
| nn | T_L_D_N | Alveolar nasal (part of T_L_D_N group) ✅ |
| RR | R + Er | Rhotic sounds ✅ |
| aa | AE + Ah | Low vowels ✅ |
| E | EE | High front vowel ✅ |
| I | Ih | Near-close front vowel ✅ |
| O | Oh | Mid back rounded vowel ✅ |
| U | W_OO | Close back rounded vowel ✅ |

## Key Research Insights

1. **Morph Target Names**: Our GLB model should contain morphs that follow ActorCore conventions
2. **Multi-Morph Combinations**: Some visemes benefit from combining multiple morphs (e.g., aa = AE + Ah)
3. **Tongue Integration**: The 11 tongue morphs are crucial for complete lip-sync
4. **ARKit Compatibility**: 52 ARKit morphs provide standard facial expression support

## Recommended Actions

1. **Verify Morph Names**: Check if our GLB contains official ActorCore morph names
2. **Update Mappings**: Use multi-morph combinations based on ActorCore groupings
3. **Test Systematically**: Validate each viseme against ActorCore standards
4. **Optimize Weights**: Use proper weight distribution for multi-morph visemes

## Source Documentation
- Character Creator 4 Online Manual - Expression and Viseme Sets
- Character Creator 4 Online Manual - Viseme Panel Mapping  
- Character Creator 4 Online Manual - 8+7 Phoneme Pairs and 1:1 Direct Systems

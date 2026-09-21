# Git baseline — 2026-09-21

## Repository role

Repository: RicochetAngles_3D_RND. Root: existing ThreeJSDEV folder.
Role: THREE.JS / 3D / DCC AUTHORING R&D. Current product authority: NO.
HTML gameplay authority: series341000Lunar/steel-angle-prototype.
Unity authority: series341000Lunar/RicochetAngles_UNITY.
Remote: https://github.com/series341000Lunar/RicochetAngles_3D_RND.git
Branch: main, based on the existing remote README commit using `reset --mixed`.
Visibility observed before bootstrap: PRIVATE; no visibility change requested or made.

## Existing R&D and inventory

Preserved: M41 primitive/GLB/muzzle bridge; multi-asset R&D; contour and polish;
V2 / V2B Focus; V3 muzzle lighting; V4A tone/grade; V4B toon; V4C prewarm;
V5 bloom; G1 Tiger II weakpoint remap. No DCC-00 implementation.

Pre-bootstrap inventory: 765 files, classified in the accompanying
[GIT_BASELINE_20260921_inventory.json](GIT_BASELINE_20260921_inventory.json)
with original byte sizes, UTC modification times and SHA-256 hashes.

| Category | Original files |
|---|---:|
| A. Source code / runtime inputs | 35 |
| B. Test code | 38 |
| C. Documentation | 31 |
| D. Vendored runtime | 14 |
| E. Generated 3D assets | 13 |
| F. Blender/DCC derivatives | 15 |
| G. Generated previews/screenshots | 427 |
| H. Validation evidence | 133 |
| I. Historical pre-Git backups | 42 |
| J. Mainline reference snapshots | 17 |

Track source/scripts, tests, Markdown, JSON manifests/evidence, vendor runtime
and LICENSE, and the runtime toon texture `spike/textures/`.
Ignore GLB/GLTF/BIN/BLEND/BLEND1/BLEND2/FBX/MAX, generated image evidence
in observed preview/Docs locations, manual `.before_*` HTML/JS/Markdown,
MainlineReference, and the standalone upstream AGENTS reference copy.
Text reports/reproduction code in image evidence directories remain tracked.
No global PNG exclusion; future explicitly approved small fixture exceptions
may be appended to .gitignore. No production fixture whitelist was introduced.

Local-only model families: M41, Panzer3, Panzer6_Tiger1, Panzer6B_Tiger2,
75mm_PAK_40, LV_Kubelwagen, M4A3E2, M4A3E8, ATGun_Traverse, SHIP_LCT.
Their directories, models, previews and export/source layout remain on disk.
A fresh clone requires separately supplied local model assets for visual parity.

Upstream source identity: `2ecba9c768b2705bbe5d50a6e82ccd2c44c5c0d0`,
as recorded in the actual SOURCE_MANIFEST, despite the snapshot directory suffix.
See [UPSTREAM_REFERENCE.md](UPSTREAM_REFERENCE.md) for read-only/refresh policy.

## Tests and preservation

PASS: `Launch_MultiAsset_RND.ps1 -NoBrowser` started the local HTTP server on 8765.
Direct invocation was blocked by the existing unsigned-script policy; rerun
with process-scoped `-ExecutionPolicy Bypass`, matching the existing BAT policy,
succeeded. No system execution-policy or launcher changes were made.

PASS: `tests/test_g1_isolation.cjs`: 600-frame traces, legacy exact comparison,
legacy/remap render isolation, and eight gameplay functions unchanged.
PASS: `tests/test_g1_interactions.cjs`: Q legacy/remap, left/right track damage,
UI controls and restart behavior.
Existing test logic was executed with only its output JSON destination redirected
in memory to the separate audit folder. Original test files and evidence were
not rewritten. Results are retained as `GIT_BASELINE_20260921_G1_*.json`.

FAIL: no completed runtime test failed.
NOT RUN: remaining G1 remap, V5, V4C, V4B, V4A, V3, V2B, V2, contour,
polish and earlier test scripts; wrappers/probes/image-comparison tools were
inventoried but not executed. Full historical suite and user visual review are
not claimed. Historical reports retain their original claims and dates.

Preservation PASS: 764 original files retain identical SHA-256; README retains
all 7,009 original bytes as an exact suffix after the new scope introduction.
Launchers, all 38 test files, runtime code, models, backups, MainlineReference,
and prior evidence are unchanged. No files/directories were deleted or moved.
No hard reset, git clean, overwriting checkout, production or sibling-repository
modification was performed.

## Environment and Git gates

NAS ownership differs from the Windows account. Git is invoked with the exact
repository path in command-scoped `safe.directory`; global config is unchanged.
A future ordinary Git client may need the user to trust this exact NAS folder.
The initial remote tree contained only README.md (49 bytes).
`reset --mixed` changes HEAD/index and preserves the working tree; local help
was inspected and original file hashes were checked after attachment.

Before commit/push: inspect status, staged stat, every staged path and size;
reject production models, pre-Git copies, local references, generated screenshots,
NUL-containing unexpected binaries or files over 10 MiB. The sole intended
binary runtime input is the existing toon PNG. Re-check remote visibility before
push; stop if PUBLIC without explicit user confirmation. Never change visibility.

Next recommended task: DCC-00 Blender Semantic Authoring Feasibility Slice.

## Final staged gate results

PASS: 258 tracked files; no production model, manual backup, MainlineReference,
or generated screenshot staged. Largest file: geometry-points JSON, 1,713,198
bytes; largest vendor: three.module.js, 1,326,024 bytes. Sole binary: existing
`spike/textures/T_Lut_03.png`, 2,027 bytes. Full staged list/stat/size inventory
were saved in the separate session audit folder. Visibility rechecked: PRIVATE.
Repository-local `core.autocrlf=false` prevents automatic line-ending conversion;
no global Git setting was changed. Original working files remain unchanged.

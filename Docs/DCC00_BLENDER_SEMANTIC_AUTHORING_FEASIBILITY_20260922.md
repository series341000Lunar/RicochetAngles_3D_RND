# DCC-00 Blender Semantic Authoring Feasibility — 2026-09-22

## Result and authority

**DCC-00 = TECHNICAL PASS. USER REVIEW REQUIRED; UX Gate = PENDING.**
Branch: `dcc-00-semantic-authoring`, starting at baseline
`b61739ee43ff733da12a4a0f3e5e593b01daabe3`.
No merge to main. Blender has not been promoted to long-term spatial source of truth.
No H5E import/export/schema adoption, Unity adapter, combat, physics, AI,
mission engine, or production gameplay implementation was added. MainlineReference
code was not consulted; snapshot bytes were read only for preservation hashes.

## Implementation

Independent `dcc00/` adds registry/classes.json, registry/assets.json, tracked
fixtures/seed.authoring.json, a source-registered Blender add-on with explicit
PropertyGroups/operators/N-panel, stdlib authoring server, HTML editor/testbed,
and contract/Blender/browser/regression tests. Root adds separate
Launch_DCC00_Authoring.ps1 and .bat. Only .gitignore changed among baseline files,
to ignore dcc00/workspace and dcc00/test-output.

Runtime uses existing Python, Blender 4.5.1 LTS, Node, Chrome and Playwright.
No dependencies were installed. Add-on registration is session-local through the
launcher; Blender global preferences and any existing interactive scene are untouched.
The launcher opens a separate factory-startup Blender session or the local review blend.

## Actor, identity and Inspector

| Class | Tier | Inspector and preview |
|---|---|---|
| LightTank | A | Stable ID, M41 asset, SCOUT/GUARD, facing, homeRadius, enabled |
| Trigger | A | Stable ID, sizeX/sizeY, enabled, string eventRef, wire box |
| Checkpoint | A | Stable ID, checkpointId, enabled, marker |
| PresentationActor | B | Stable ID, Kübelwagen asset, path, start/duration/loop/enabled |
| Decoration | C | Asset and transform, anonymous crate proxy or bound GLB |

A/B use UUID at creation. The semantic anchor owns identity/transform/properties;
preview children never own the semantic ID. Rename, move, asset replacement and
preview rebuild retain identity. Duplicate IDs BLOCK; an explicit new-ID action
is restricted to duplicated or missing IDs. Ordinary A/B disappearance retains
source data and BLOCKs save. Explicit deletion creates `{ra_id, deleted:true}`.
Anonymous decorations can be deleted ordinarily, without IDs or tombstones;
orphan preview cleanup accompanies that ordinary deletion.

N-panel `RICOCHETANGLES R&D` has Create, class-specific typed Inspector, registry
asset binding, validation, JSON Save/Reload, explicit deletion, path actions and
Save Review .blend. Raw custom-property editing is not required.

## Assets and existing testbed

Registry uses observed local paths:
- `M41/export/M41_RND_v02_muzzle.glb`
- `LV_Kubelwagen/export/LV_Kubelwagen_RND_v01.glb`

Assets were read only and remain ignored. Missing files or IDs produce a visible
MISSING_ASSET proxy warning; the semantic actor remains and saving is allowed.
`proxy-crate` is an intentional decoration proxy, not a missing production model.

The DCC testbed embeds the unchanged original multi-asset HTML and reuses its
scene, 75-degree orthographic camera, ground/grid/road, GLTFLoader and WebGLRenderer.
No new renderer was constructed. The same 1280 x 3600 world and 14 units/m are used.
The iframe stays in READY so gameplay simulation is paused; the DCC layer animates
presentation children only. Existing collision/damage/weakpoint/projectile/Q/Focus/
Boss state receives no authoring binding. Browser checks compared the complete
serialized game state before/after DCC movement and found it unchanged.

## Shared save / reload and paths

Schema is `ra-dcc00-authoring-v0`, not H5E. Unknown top-level, actor, transform,
path and unchanged-topology point fields survive merging. Unsupported class/schema
or destructive unknown point-topology changes block saving instead of dropping data.

127.0.0.1:8766 serves the repo read-only and allows JSON writes only to
`dcc00/workspace/testbed.authoring.json`. It validates Host/Origin, content type,
finite typed values, size, stable IDs, paths and deletion intent. Atomic replacement
and If-Match revision checks prevent partial writes and stale-client overwrite.
Malformed existing workspaces are reported; they are never reset to seed silently.
The isolated integration server used port 18766 and test-output, not user workspace.

Blender uses native single POLY curves with editable points. A timeline handler
samples distance-normalized segments and applies the result only to the preview
child of the presentation anchor. Before start it holds the first point; after
non-loop duration it holds the last; a loop returns to the first point. Three.js
uses equivalent interpolation. At 0/3/6/12/15 seconds, exported Blender and browser
positions agreed within 0.001 testbed unit. No gameplay progression is driven.

Mini HTML provides actor list, 2D overview/drag, class fields, validation, Save/Reload,
and explicit semantic deletion. JSON edits preserve unknown data. Stable IDs are
read-only in HTML. Decoration bulk authoring remains in Blender.

## Verification evidence

Detailed machine-readable results: [DCC00_VALIDATION_20260922.json](DCC00_VALIDATION_20260922.json).
Generated .blend/screenshots/logs stay local in `dcc00/test-output/`.

| Verification | Result |
|---|---|
| Pure contract + real HTTP server tests | PASS, 12 tests |
| Blender 4.5.1 registration and typed-property operations | PASS |
| Actual M41 / Kübelwagen GLB imports and proxy fallback | PASS |
| Create, edit, rename, duplicate detection/new ID | PASS |
| Manual semantic disappearance retained and blocked | PASS |
| Explicit tombstone and ordinary anonymous deletion | PASS |
| Native curve + timeline movement | PASS |
| Blender JSON save + .blend save, exit, second process reopen | PASS |
| HTML receives Blender edits, changes homeRadius, saves/reloads | PASS |
| Fresh Blender process receives HTML homeRadius=333 | PASS |
| Unknown root and nested actor data preservation | PASS |
| Three.js authoring load / visible canvas / actual GLBs | PASS |
| Forced M41 network failure keeps IDs and proxy previews | PASS |
| Blender/Three path position and timing parity | PASS, tolerance 0.001 |
| Existing launcher 8765 and DCC launcher 8766 startup | PASS |
| Existing G1 isolation / interactions | PASS / PASS |
| Original pre-Git source/asset/evidence files | 764 unchanged SHA-256 |
| Baseline tracked runtime/README/vendor/tests/launchers | unchanged |

Initial validation found preview-selection/reload stale Blender object references
and hidden startup canvas state. These were fixed and the affected real round trips
were rerun. Final tests above passed. Historical V2–V5/full suite, Blender 5.2,
large-decoration performance and human Inspector/authoring preference review were
NOT RUN; they are not implied by technical PASS.

## Known limitations

- Source activation via the supplied launcher is supported; a distributable installed
  extension/zip and permanent preference changes are outside this feasibility slice.
- Unparented, unit-scale anchors with XYZ and yaw only. Tilt/scale/parent transforms
  BLOCK on save; asset preview geometry edits are not semantic JSON edits.
- Paths are one POLY spline; smooth Bezier/NURBS, banking and tangent orientation
  are not implemented. Looping an open path jumps back to its beginning.
- Unknown point extensions block topology changes that could lose their meaning.
- Blender/JSON coordinate conversion uses tolerance rather than bit-exact floats.
- Manual A/B deletion requires Reload then explicit delete. Saves do not silently
  infer deletion. JSON and .blend saves are separate; synchronization is Save→Reload.
- Testbed simulation is deliberately paused during authoring preview. The original
  8765 entry remains the place to exercise unchanged gameplay.
- Existing unrelated scene objects remain; unsupported custom preview editing does
  not become production model authoring. Missing assets on fresh clones use proxies.
- Browser checks and screenshots establish rendering/functionality; subjective
  Blender Inspector usability remains the user's separate Gate.

## Hands-on review and next gate

Follow the [10-step user review](../dcc00/README.md#사용자-체험--10단계).
Double-click `Launch_DCC00_Authoring.bat`; no code or JSON editing is required.

A. Is spatial placement more natural than Stage2 HTML Map Editor?
B. Are semantic properties understandable and editable in the Inspector?
C. Is immediate actual-model/proxy preview useful?
D. Is the Blender / HTML Save→Reload split clear?
E. Is native curve + presentation timing practical?

**User Gate = PENDING. Next action: USER DCC-00 HANDS-ON REVIEW.**
Only after explicit user UX acceptance should a separate next feasibility gate be
considered. Do not merge to main or infer H5E/Unity/product authority from these tests.


## UX correction — native authoring window / Blender 5.2 (2026-09-22)

This is a DCC-00 hands-on UX/runtime correction, not a new capability gate.
The original 4.5.1 results above and DCC00_VALIDATION_20260922.json remain
historical evidence. **PRIMARY DEVELOPMENT / TEST TARGET = Blender 5.2.x LTS.**
The installed executable reports **Blender 5.2.1 LTS**, build 9e2066aef7ef,
at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
5.2.2 was not found in the inspected installation locations; no installation or
4.5 fallback was performed. The launcher compares installed 5.2.x versions and
chooses the highest, so a later installed 5.2.2 is preferred automatically.
Add-on metadata now targets 5.2; 4.5 compatibility does not constrain this UX.

### Native primary editor

`authoring_window.py` adds a native same-instance floating window using
`bpy.ops.screen.area_dupli`, with a wide Properties editor and three columns:
Actor Browser (Tier A/B class, name, semantic ID, last validation state),
class-specific typed Inspector, and selected-actor/workspace Validation.
The browser and main 3D View share the same scene/view-layer selection.
Common controls provide Add Actor, Reload Workspace, Save Authoring JSON,
Validate and Save Review .blend. Native Blender Scene panels remain accessible
in that Properties editor and can be collapsed by the user.

Closing the secondary window keeps the main session and scene intact. Reopen via
N-panel **Open RA Authoring Editor** or F3 **Open RicochetAngles Authoring Editor**.
The same operator is also exposed in native View and Window menus. Repeated open
requests report that the existing window is available and never spawn duplicates.
No external GUI toolkit, separate executable, permanent keymap or user-preference
change was introduced. The standard launcher automatically opens the editor after
source registration; it remains within that one Blender process.

The existing N-panel is retained as Quick Access/status, selected actor, summary,
Open, Validate and Save. Its collapsed **Fallback Editing** child retains creation,
full typed Inspector, validation, reload and review-save if the window cannot open.

### Runtime context correction without data migration

Properties-editor `context.object` can be None even with a selected scene object.
Preview creation now reads the active view-layer object, and actor operators resolve
the selected semantic anchor through the current context/view layer. This fixes
Reload/proxy creation and buttons in the new editor without altering data meanings.
Window-manager selection index and screen window marker are UI state only.

The schema, class/asset registries, seed, PropertyGroups, core validation/identity,
JSON IO/reconcile, Curve timing, server and HTML/Three.js data semantics are unchanged.
No ra-dcc00-authoring-v0 migration; A/B/C identity, explicit deletion/tombstones,
anonymous deletion, unknown preservation and missing-asset fail-soft are retained.

### Revalidation

Machine-readable evidence: [DCC00_UX_BLENDER52_VALIDATION_20260922.json](DCC00_UX_BLENDER52_VALIDATION_20260922.json).
New outputs are under ignored `dcc00/test-output/ux52/`; original 4.5 screenshots,
blend/JSON results and the actual user workspace were hash-checked and preserved.

| Acceptance | Result |
|---|---|
| 5.2.1 Add-on registration / PropertyGroups / actor create/edit | PASS |
| Actual M41 and Kuebelwagen GLB; missing proxy + save | PASS |
| .blend save, exit, fresh 5.2 process reopen | PASS |
| Native Curve timing and Blender/Three trajectory parity | PASS |
| JSON and Blender → HTML → Blender round-trip | PASS |
| Existing DCC-00 contract tests | PASS, 13 |
| Native graphical window open / close / main scene retained | PASS |
| N-panel operator recall / duplicate-open handling | PASS |
| Actual F3 key, typed search, Enter and window recreation | PASS |
| Actor Browser selection → main view and reverse → Inspector | PASS |
| Typed property editing / validation in dedicated window | PASS |
| Save JSON / Reload / Save Review .blend from window context | PASS |
| Native panel drawing | PASS, no final Python draw errors |
| Existing G1 isolation / interactions | PASS / PASS |

The GUI test ran in its own foreground Blender instance with native event simulation;
only the test instance was closed. Test saves targeted the isolated integration
workspace (18766) and ux52 review blend, never the user's authoring files.
Initial GUI checks caught a panel registry-name collision, search events targeting
the wrong editor, and the Properties context issue; these were corrected before
final successful native lifecycle and round-trip runs. Native factory-startup brush
path relativity warnings during .blend save do not affect the tested semantic data.

**USER UX GATE = PENDING.** This correction does not promote Blender to long-term
spatial authority and does not authorize H5E/Unity/mainline integration or merge.
The next action remains user hands-on review of this revised editor.

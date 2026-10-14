# Global LookDev — current-code comparison (before runtime implementation)

Read-only Mainline reference: `C:\Users\LunarGagarin\Documents\Topdown Tank`,
observed HEAD `6791fdb60ca83f88ff744505e0d058b3f387bdd8`.
ThreeJSDEV base: `22994e3258c8d452c830fa4fb3d78c50f0e1a289`, branch
`dcc-00-semantic-authoring`. Existing untracked `Panzer4/` and
`Stage1_CostalBattery/` are preserved. No Mainline or source-package writes.
Mainline AGENTS §§3.2, 10, 25.40–25.42 take precedence over historical ENV-01
tile/Canvas contracts. Current RW-02 uses a common ENV + actor world/depth/shadow.

| Item | Classification | Observed difference / chosen action |
|---|---|---|
| Three / module structure | ALREADY EXISTS | Both r160 / 0.160.1, local vendored loader. Mainline classic bundled file transport; R&D ES modules + local HTTP. Reuse existing `spike/vendor`, including its MIT license and UUID-only patch. |
| Renderer | IMPORT FROM MAINLINE | Existing R&D DPR ≤1.5; Unified DPR 1, alpha + antialias, clear `0x87908b`. New isolated entry uses one renderer/context and DPR 1. |
| Camera projection | ADAPT FOR LOOKDEV | Both 75° orthographic, up `(0,0,-1)`, sin(elevation) ground compensation. Mainline 300m distance / far700, 14px/m; R&D historically pixels. Use metres, same basis; add viewport footprint pan/zoom clamp. |
| Scene graph | ADAPT FOR LOOKDEV | Legacy R&D playable ENV ×14. Unified ENV root identity, actor scene ×1/14. LookDev identity ENV + model wrappers in metres, common scene. Keep old pages intact. |
| Lighting | IMPORT FROM MAINLINE | R&D hemisphere `e0edff/414331` 1.65, sun `ffefcf` 2.3, offset -550/950/-420 px. Unified hemisphere `cbdcf0/82734e` .85, sun `ffefd4` 2.3, offset -70/100/80 m. |
| Shadows | IMPORT FROM MAINLINE | R&D1024, span±1050/±850px, bias-.00015 / normalBias .8px. Unified2048, span±105m, near .1 / far400, bias-.001 / normalBias .2m, texel-snapped following region. Opaque actors cast+receive, ENV source policy retained. |
| Material / shader | ALREADY EXISTS | GLTFLoader PBR remains. No new shader or material replacement. Static actor material state only; gameplay damage/readiness adapters excluded. |
| Color / tone | IMPORT FROM MAINLINE | SRGB / NoToneMapping / exposure1 / no grade. Preserve R&D grade/toon/bloom experiments on their existing page. Baseline reset on the new page. |
| GLB loading / lifecycle | ADAPT FOR LOOKDEV | Use current relative HTTP fetch, exact-byte local derivatives, source/hash mapping, per-asset errors. One bounded compile/draw preparation, context failure/reload and owned disposal. No file:// transport import. |
| UI / camera control | ADAPT FOR LOOKDEV | R&D gameplay tracking/angle options retained. Separate LookDev page: ground pan, wheel zoom, arrows/WASD, focus/visibility, baseline reset, small lighting controls. |
| H5E / production RAF / gameplay UI | NOT REQUIRED | No gameplay, AI, armor, projectiles, Boss schedulers, stage/save/radio import. New standalone page has one own RAF; original launch paths retain their loops. |
| DCC bridge | NOT REQUIRED | Direction documentation only: primary future authoring 3ds Max, existing Blender bridge kept. No importer/exporter/MCP/UI implementation. |

Selected reference algorithms: `HYBRID_ENVIRONMENT_TUNING`,
`attachHybridEnvironment` lighting/shadow setup, `syncHybridEnvironmentCamera`
projection and texel snapping, `prepareUnifiedWorld` output/tone/clear state,
`applyUnifiedWorldActorShadows` opaque policy, and vehicle descriptor scale divided
by ENV14px/m. Adapted locally with provenance; no whole Mainline file copied.

Stage field comes from current canonical `ENC_01` (8960–10240px) and world height
1440px: X640–731.428571m / Z0–102.857143m. Entire ENV is retained at source
origin/scale; camera is restricted to this representative region. Actual ground
triangle coverage is validated before a rectangular clamp is accepted. Mesh-wide
bounds include tall/off-ground decorations and are not used as ground authority.

Technical baseline is a reference for comparison, not final art approval or a
claim of pixel equality with the complete Mainline gameplay/Canvas composition.

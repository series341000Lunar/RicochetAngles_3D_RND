# LV_Kubelwagen GLB derivative v01

## Source and protection
Source: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\LV_Kubelwagen\LV_Kubelwagen_v01.blend
Reason: only completed current original v01; authored proportions, wheel locations and root retained.
SHA-256 before/after: 69dd9807a859ca1ffa5df7169beac84f8e9ce90f071df680e28267e15d194944 (identical).
M41 reference blend/GLB hashes also unchanged.

## Changes
Fixed body, fenders, interior, lamps and canvas merged into HULL. Evaluated license text converted to geometry.
Four wheel assemblies merged separately; two steering empties added.
No decimation or silhouette redesign. Geometry maximum vertex deviation: 1.4901161193847656e-08 m.
Five original materials retained to preserve body, rubber, seats/canvas, transparent glass and light/marking distinctions.
Glass: BLEND, alpha 0.23, double-sided; no textures.

## Deliverables
- source/LV_Kubelwagen_RND_v01.blend
- export/LV_Kubelwagen_RND_v01.glb
- preview/: neutral and +/-25-degree steering, each isometric/top/side (9 PNGs)
- notes/asset_validation_v01.json: detailed numerical evidence
- notes/execution_request.txt: exact user execution request

## Statistics
GLB: 946436 bytes; 8 nodes; 5 meshes; 23076 triangles; 13 material primitives; 5 materials; 0 textures.
HULL 14884 triangles; each wheel 2048 triangles.
Overall neutral length/width/height: 3.525 / 2.016 / 1.856 m, all model geometry included.

## Technical verification: PASS
Requested hierarchy, names, original root and wheel centers retained.
GLB meters, +X forward, +Y up, left -Z/right +Z.
All neutral local rotations identity, scales positive unit; no animation/skin/skeleton.
Front steer local Y; wheel spin local Z. Front wheel local translations zero.
Fresh empty-scene GLB reimport: names/parents/positions/dimensions match.
Each front wheel independently tested at -25 and +25 degrees; other wheels and HULL remained fixed.
Wheel spin +60 degrees tested after steering; center drift 0 m. Rear wheel spins passed.
Neutral pose restored; derivative saved and reopened. Repeated reopen after recovery passed.
Original and M41 SHA-256 protected.

## Visual verification: PASS within inspected views
Actual neutral top/side/isometric and steering previews inspected.
Hood, fenders, windshield, open cabin, seats, folded canvas and four wheel locations retained.
Windshield transparency preserved; through-glass cabin remains visible.
No visible tire/fender penetration in inspected views.
BVH surface intersection checks against front fender/lip geometry: 0 intersecting pairs at 0/-25/+25 for both front wheels.

## Limitations
No continuous-angle clearance, whole-vehicle collision, suspension or physics validation.
The tested +/-25 degrees are not approved gameplay steering limits.
No steering/driving logic or animation implemented; no HTML/Unity runtime integration.
Runtime transparency sorting, performance and game appearance remain UNVERIFIED.

## Execution issue and recovery
Interactive Blender terminated during optional preview refresh. Single background Blender regenerated all nine previews. Saved derivative reopened with 8 nodes, neutral rotations and unit scales. First recovery assertion used invalid Euler.length API; corrected component-wise check passed.
Final previews use Workbench with shadows disabled; original geometry and exported GLB were unchanged.
Finished: 2026-09-20T16:28:51.857925+09:00

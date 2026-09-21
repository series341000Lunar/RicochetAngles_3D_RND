# RicochetAngles_3D_RND

This repository is a 3D / Three.js / DCC authoring R&D repository.
It is NOT HTML mainline gameplay authority.
It is NOT Unity runtime authority. Current product authority: NO.

HTML gameplay authority: series341000Lunar/steel-angle-prototype
Unity authority: series341000Lunar/RicochetAngles_UNITY

Scope: Three.js rendering, runtime asset validation, Blender authoring add-on
feasibility, DCC semantic authoring, Mini HTML semantic editor research,
DCC ↔ H5E bridges, map/semantic validation, presentation R&D, 3D testbeds,
and future Unity-facing authoring experiments.
These scopes do not authorize implementation without a concrete task.
HTML Stage 1 gameplay, Boss schedulers, production checkpoints, and Unity
runtime implementation remain outside this repository's authority.

1. Existing Three.js R&D behavior must be preserved unless the task explicitly changes it.
2. Production GLB / BLEND / FBX / MAX assets may exist locally but are not repository-owned by default.
3. Missing visual assets must fail soft where practical.
4. Visual mesh does not become gameplay authority automatically.
5. MainlineReference is read-only reference material. Port only explicitly selected code with provenance.
6. Do not modify files outside this repository unless explicitly instructed.
7. Do not introduce generic ECS / mission engine / universal editor architecture without demonstrated need; this is not a generic game engine or universal level format project.
8. New Blender semantic-authoring work begins as feasibility R&D, not production authority.
9. Stable semantic data, validation, explicit deletion and preservation rules take priority over convenience.
10. Existing tests and launch paths must remain functional.

Keep local source/export assets, generated evidence, and pre-Git rollback copies
on disk. Do not clean them merely because they are ignored. Track source,
tests, text evidence, and spike/vendor with its license. Add small fixture
exceptions only through explicit review (for example testbed/fixtures/tracked/).
DCC-00 implementation is not part of the Git bootstrap.

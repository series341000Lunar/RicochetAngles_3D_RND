# Panzer6_Tiger1 naming correction

MODEL/Tiger and ThreeJSDEV/Tiger were renamed to Panzer6_Tiger1.
Vehicle-prefixed filenames, Blender objects, collections, mesh/material names and local text/path references were corrected.
Tiger_I_ROOT is now Panzer6_Tiger1_ROOT. Generic HULL/TRACK_L/TRACK_R/TURRET_PIVOT/TURRET/GUN/MUZZLE names remain unchanged.

Verification: 9 Blender files including .blend1 backups were saved and reopened; evaluated geometry, topology, world transforms, hierarchy and material indices match before/after.
Both GLBs were updated by editing JSON names only. All binary geometry buffers and non-name metadata are unchanged; both reimport successfully with 8 objects.
Image pixels and reference content were not modified. No render was required for naming-only changes.
Previous validation SHA256/byte-size fields describe pre-correction binaries; name_correction_20260920.json contains current hashes and GLB sizes.
No HTML/Unity/runtime code outside these two folders was changed.
Backup: \\192.168.87.201\Projects\RicochetAngles\99_temp\Panzer6_Tiger1_name_correction_20260920_151523/before_name_correction.zip

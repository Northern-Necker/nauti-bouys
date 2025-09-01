# ActorCore to Three.js Guide

This guide provides a step-by-step process for importing ActorCore models into Blender, exporting them to GLB format, and loading them into a `three.js` application.

## Blender Setup

1.  **Install "CC/iC Blender Tools" Add-on:**
    *   Download the latest release from the [CC/iC Blender Tools GitHub page](https://github.com/soupday/cc_blender_tools/releases).
    *   In Blender, go to **Edit > Preferences > Add-ons**.
    *   Click **Install** and select the downloaded ZIP file.
    *   Enable the add-on by checking the box next to its name.

2.  **Start Blender MCP Server:**
    *   In Blender's 3D Viewport, press the `N` key to open the sidebar.
    *   Go to the **BlenderMCP** tab.
    *   Click **Connect to MCP server**.

## Import ActorCore Model

1.  **Clear Default Scene:**
    *   Delete the default cube, light, and camera from the scene.

2.  **Import FBX Model:**
    *   Use the `import_scene.fbx` operator with `automatic_bone_orientation` enabled. This will help to correct any rigging issues with the model.

## Export to GLB

1.  **Apply Transformations:**
    *   Select the model and apply all transformations (location, rotation, and scale). This will bake the transformations into the model's geometry and help to prevent distortion issues.

2.  **Export GLB:**
    *   Export the model to GLB format with the following settings:
        *   **Format:** GLB
        *   **Include:** Selected Objects
        *   **Transform:** +Y Up
        *   **Geometry:**
            *   Apply Modifiers: OFF
            *   Export Morph Targets: ON
            *   Export Morph Normals: ON
        *   **Animation:**
            *   Export Animations: ON (if needed)
            *   Export Skinning: ON

## Three.js Implementation

1.  **Load GLB Model:**
    *   Use the `GLTFLoader` to load the GLB model into your `three.js` application.

2.  **Access Morph Targets:**
    *   Traverse the loaded model to find the meshes with morph targets. The morph targets will be located on the `CC_Game_Tongue` mesh.

3.  **Fix Texture Distortion:**
    *   Set the renderer's output encoding to `sRGBEncoding` to ensure that the colors are displayed correctly.

4.  **Fix Transparency Issues:**
    *   Traverse the model and set the `transparent` property to `false` and the `depthWrite` property to `true` for all materials. This will ensure that the materials are treated as opaque objects and that they are rendered correctly.

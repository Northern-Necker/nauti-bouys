# Blender MCP Setup Guide for FBX to GLB Conversion

## Overview
This guide will help you set up Blender MCP to convert your ActorCore FBX files to GLB format, which will solve the tongue morph accessibility issue in Three.js.

## Prerequisites ✅
- [x] Blender installed
- [x] Python 3.10+ installed
- [x] `uv` package manager installed (version 0.8.13)
- [x] Blender MCP addon downloaded (`blender-mcp-addon.py`)
- [x] MCP server configured in Claude

## Step 1: Install Blender Addon

1. **Open Blender**

2. **Go to Preferences**
   - Edit → Preferences → Add-ons

3. **Install the Addon**
   - Click "Install..." button
   - Navigate to the `blender-mcp-addon.py` file in your nauti-bouys directory
   - Select the file and click "Install Add-on"

4. **Enable the Addon**
   - Search for "Blender MCP" in the add-ons list
   - Check the box next to "Interface: Blender MCP"
   - The addon should now be enabled

## Step 2: Start Blender MCP Server

1. **Find the BlenderMCP Panel**
   - In Blender's 3D Viewport, press `N` to open the sidebar if not visible
   - Look for the "BlenderMCP" tab in the sidebar

2. **Configure Settings**
   - Port: Leave as default (9876)
   - Uncheck "Use assets from Poly Haven" (not needed for our conversion)
   - Uncheck "Use Hyper3D Rodin" (not needed for our conversion)
   - Uncheck "Use assets from Sketchfab" (not needed for our conversion)

3. **Start the Connection**
   - Click "Connect to MCP server" button
   - You should see "Running on port 9876" status

## Step 3: Test the Connection

You should now be able to use Blender MCP tools in this chat. The available tools include:
- `get_scene_info` - Get information about the current Blender scene
- `get_object_info` - Get detailed information about a specific object
- `execute_code` - Execute arbitrary Blender Python code
- `get_viewport_screenshot` - Capture screenshots of the viewport

## Step 4: Convert FBX to GLB

Once the connection is established, we can:

1. **Import your ActorCore FBX file** into Blender
2. **Verify all morph targets are present**, including tongue morphs
3. **Export as GLB** with all morph targets preserved
4. **Test the GLB file** to ensure tongue morphs are accessible

## Expected Benefits

After conversion to GLB format:
- ✅ **All morph targets preserved** including tongue morphs (Tongue_Out, Tongue_Tip_Up, Tongue_Curl)
- ✅ **Three.js GLTFLoader compatibility** - much more reliable than FBXLoader
- ✅ **Smaller file sizes** and faster loading
- ✅ **Multi-mesh search approach will work** - each mesh's morph targets will be accessible
- ✅ **DD, NN, RR visemes will work properly** with actual tongue movement

## The Solution in Action

The multi-mesh search approach that the other AI suggested will work perfectly with GLB:

```typescript
export class GLBMultiMeshLipSync extends Behaviour {
    private meshTargets: SkinnedMesh[] = [];
    
    start() {
        // Search for all skinned meshes in the GLB
        this.gameObject.traverse((obj: Object3D) => {
            if (obj instanceof SkinnedMesh && obj.morphTargetDictionary) {
                this.meshTargets.push(obj);
                console.log(`Found mesh: ${obj.name} with morphs:`, 
                           Object.keys(obj.morphTargetDictionary));
            }
        });
    }
    
    applyViseme(visemeName: string, morphTargets: string[]) {
        // Search each mesh for the required morph targets
        for (const morphName of morphTargets) {
            for (const mesh of this.meshTargets) {
                if (mesh.morphTargetDictionary[morphName] !== undefined) {
                    // This WILL work with GLB files!
                    const index = mesh.morphTargetDictionary[morphName];
                    mesh.morphTargetInfluences[index] = 1.0;
                    console.log(`Applied ${morphName} on ${mesh.name}`);
                }
            }
        }
    }
}
```

## Next Steps

1. **Complete the Blender addon installation** following the steps above
2. **Test the connection** to ensure Blender MCP is working
3. **Convert your ActorCore FBX to GLB** using the MCP tools
4. **Verify tongue morphs are preserved** in the resulting GLB file
5. **Update your lip-sync code** to use GLB instead of FBX

## Troubleshooting

If you encounter issues:
- Make sure Blender is running and the addon is enabled
- Verify the MCP server shows "Running on port 9876"
- Check that no firewall is blocking port 9876
- Restart both Blender and Claude if connection fails

Once you've completed the Blender addon installation, let me know and I'll help you convert your FBX files to GLB format with preserved morph targets!

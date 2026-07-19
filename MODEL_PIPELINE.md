# 2D-to-3D Teaching Material Pipeline

The app now supports a model-first teaching material flow:

1. Teacher types a topic, such as `tiger`.
2. Backend returns photo, facts, labels, and model-generation status.
3. Frontend loads `modelUrl` as a real `.glb` model when available.
4. If no `.glb` exists, the frontend shows the 2.5D photo fallback.

## Manual GLB path

Export a model from Meshy, Tripo, Polycam, or another 2D-to-3D tool, then save it here:

```txt
client/public/models/generated/tiger.glb
```

Optional model metadata can be saved beside it:

```txt
client/public/models/generated/tiger.meta.json
```

Use metadata to tune the viewer without changing app code:

```json
{
  "message": "Photorealistic tiger model loaded.",
  "view": {
    "quality": "realistic",
    "scale": 1,
    "rotation": [0, -0.45, 0],
    "cameraPosition": [0, 0.25, 5.2],
    "target": [0, 0.05, 0],
    "labelPositions": {
      "head": [-2.25, 1.35, 0.35],
      "stripes": [-0.1, 1.25, 0.65],
      "tail": [2.1, 0.95, 0.45],
      "paws": [-0.75, -1.15, 0.55]
    }
  }
}
```

Refresh the app and type:

```txt
tiger
```

The backend will automatically return:

```json
{
  "modelUrl": "/models/generated/tiger.glb",
  "modelStatus": "ready"
}
```

## API integration path

Add provider code in:

```txt
server/services/modelGenerationService.js
```

Recommended provider flow:

1. Upload or pass the selected topic photo to the provider.
2. Start an image-to-3D job.
3. Poll the job until the exported `.glb` is ready.
4. Download the `.glb` to `client/public/models/generated/{topic}.glb`.
5. Return `modelStatus: "ready"` and `modelUrl`.

Until that provider flow is connected, the app safely falls back to the 2.5D photo viewer.

## Realism note

The included `tiger.glb` is an enhanced local teaching placeholder, not a scanned or AI-generated photorealistic tiger. To make it truly realistic, export a textured tiger from Meshy, Tripo, Luma, Polycam, Sketchfab, or another licensed 3D source and overwrite:

```txt
client/public/models/generated/tiger.glb
```

The app will automatically load the replacement model for the `tiger` topic.

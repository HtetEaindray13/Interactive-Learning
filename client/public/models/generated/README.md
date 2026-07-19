# Generated Teaching Models

Put exported 2D-to-3D `.glb` files here.

The backend automatically looks for:

- `tiger.glb` when the topic is `tiger`
- `{topic-slug}.glb` for other topics

Example:

```txt
client/public/models/generated/tiger.glb
```

When that file exists, the teaching material viewer loads it as the real 3D model.
When it does not exist, the viewer uses the 2.5D photo fallback.

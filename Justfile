types:
    node build-src/native-types.ts

ui:
    cargo run --features ui --bin alicorn

capture-vizia-patches:
    node build-src/capture-vizia-patches.ts

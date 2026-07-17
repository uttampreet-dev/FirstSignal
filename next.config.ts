import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The embedding model (ONNX runtime) must load natively at runtime,
  // not be bundled by webpack/turbopack.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  // onnxruntime-node loads its native binding via a computed path, which
  // file tracing can miss — force the Linux binaries into the function bundle.
  outputFileTracingIncludes: {
    "/api/**": ["node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**"],
  },
};

export default nextConfig;

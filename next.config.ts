import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The embedding model (ONNX runtime) must load natively at runtime,
  // not be bundled by webpack/turbopack.
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;

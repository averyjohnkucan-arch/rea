import { isAbsolute } from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

import { ApkSignatureProvider } from "../../src/apkSignature/ApkSignatureProvider.js";
import { ApkSignatureService } from "../../src/application/apkSignature/ApkSignatureService.js";
import { ElfNotesService } from "../../src/application/binaryDiagnostics/ElfNotesService.js";
import { PeCertificatesService } from "../../src/application/binaryDiagnostics/PeCertificatesService.js";
import { PeImportsService } from "../../src/application/binaryDiagnostics/PeImportsService.js";
import { PeResourcesService } from "../../src/application/binaryDiagnostics/PeResourcesService.js";
import { GoBinaryService } from "../../src/application/go/GoBinaryService.js";
import { GpuCodeObjectsService } from "../../src/application/gpu/GpuCodeObjectsService.js";
import { ModelArtifactService } from "../../src/application/model/ModelArtifactService.js";
import { RustBinaryService } from "../../src/application/rust/RustBinaryService.js";
import { GoBinaryProvider } from "../../src/go/GoBinaryProvider.js";
import { GpuCodeObjectsProvider } from "../../src/gpu/GpuCodeObjectsProvider.js";
import { ModelArtifactProvider } from "../../src/model/ModelArtifactProvider.js";
import { ElfNotesProvider } from "../../src/native/elf/ElfNotesProvider.js";
import { PeCertificatesProvider } from "../../src/native/pe/PeCertificatesProvider.js";
import { PeImportsProvider } from "../../src/native/pe/PeImportsProvider.js";
import { PeResourcesProvider } from "../../src/native/pe/PeResourcesProvider.js";
import { RustBinaryProvider } from "../../src/rust/RustBinaryProvider.js";

const server = new McpServer({ name: "rea", version: "6.10.1" });
const inputSchema = z.strictObject({
  path: z.string().min(1).describe("Absolute path to the local file you want to inspect."),
});

function register(name, description, createService, options = {}) {
  server.registerTool(name, {
    description,
    inputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ path }, context) => {
    if (!isAbsolute(path)) {
      return { isError: true, content: [{ type: "text", text: "Supply an absolute local file path." }] };
    }
    const service = createService();
    try {
      const result = await service.inspect({ path, ...options }, { signal: context.mcpReq.signal });
      if (!result.ok) {
        return { isError: true, content: [{ type: "text", text: result.error.message }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result.value) }],
        structuredContent: result.value,
      };
    } finally {
      await service.close();
    }
  });
}

const complete = { detail: "complete" };
register("inspect_model_artifact", "Read GGUF or safetensors metadata and tensor declarations. Weights stay on disk.",
  () => new ModelArtifactService(new ModelArtifactProvider()), complete);
register("inspect_go_binary", "Read compiler, module and build settings recorded in a Go executable.",
  () => new GoBinaryService(new GoBinaryProvider()), complete);
register("inspect_rust_binary", "Read dependency and build metadata embedded in a Rust binary.",
  () => new RustBinaryService(new RustBinaryProvider()), complete);
register("inspect_gpu_code_objects", "Read declarations in CUDA or HIP GPU code objects.",
  () => new GpuCodeObjectsService(new GpuCodeObjectsProvider()), complete);
register("inspect_apk_signature", "Inspect signatures and signer certificates recorded in an Android APK.",
  () => new ApkSignatureService(new ApkSignatureProvider()), complete);
register("inspect_elf_notes", "Read note records and build identifiers in an ELF file.",
  () => new ElfNotesService(new ElfNotesProvider()));
register("inspect_pe_imports", "Read DLL and function import tables in a Windows PE file.",
  () => new PeImportsService(new PeImportsProvider()));
register("inspect_pe_resources", "Read the resource directory of a Windows executable or DLL.",
  () => new PeResourcesService(new PeResourcesProvider()));
register("inspect_pe_certificates", "Read certificates and signed-data metadata from a Windows PE file.",
  () => new PeCertificatesService(new PeCertificatesProvider()));

await serveStdio(() => server);

# REA file inspection for DeepSeek Harness

This fork packages nine read-only REA inspectors as a Cordis plugin. They read local files and return REA's evidence, including available identities, format details and coverage. The plugin uses the model you have already configured in Harness.

## Install

1. Open **Plugins → Add plugin** in DeepSeek Harness.
2. Paste `https://github.com/averyjohnkucan-arch/rea` and click **Install**.
3. Select **Enable now**. Open **REA file inspection** in the plugin list and check that **Components** shows **Running**.

In a Harness session, try “Use REA to list the tensors in `/path/to/model.safetensors`.” Replace the example with the absolute path on the computer running Harness. On Windows, a path can look like `C:\Models\example.safetensors`. The analysis runs locally. Your configured model receives the tool result through Harness.

| File | Available inspection |
| --- | --- |
| GGUF or safetensors | Header metadata and tensor declarations |
| Windows PE executable or DLL | Import tables, resource directory and certificate metadata |
| ELF binary | Note records and build identifiers |
| Go or Rust executable | Embedded build or dependency metadata |
| Android APK | Signing records and certificates |
| CUDA or HIP code object | GPU format and kernel declarations |

The plugin registers the tools as `mcp__rea__…`. Disable the bundle in **Plugins** to disconnect them. If an existing manual REA connection already owns the name `rea`, keep one enabled connection for that profile.

## Compatibility

Tested in the Harness 0.2.2-rc.4 Web profile on Linux with Node.js 24.22.3. The plugin uses the MCP manager supplied by Harness. The readers come from REA 6.10.1. The upstream Node.js requirement is 22.x from 22.23.4, 24.x from 24.22.1, or 26.12.1 and later. Installing from the repository requires access to GitHub and the npm registry.

The fork's default branch contains the installable package. The [source branch](https://github.com/averyjohnkucan-arch/rea/tree/main/plugins/deepseek-harness) keeps the adapter beside the original [REA project](https://github.com/morluto/rea).

Maintainers can rebuild the inspection module from `plugins/deepseek-harness` on the source branch with the following command.

```sh
npx --yes esbuild@0.28.2 server.mjs --bundle --platform=node --format=esm --target=node22 --packages=external --outfile=inspection.mjs
```

Then run `npm pack --ignore-scripts` in that directory. The package contains the compiled readers and declares their JavaScript dependencies in its manifest.

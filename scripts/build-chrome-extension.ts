import fs from "fs";
import path from "path";
import ts from "typescript";
import { execSync } from "child_process";

const rootDir = path.join(__dirname, "..");
const extDir = path.join(rootDir, "chrome-extension");
const srcDir = path.join(extDir, "src");

console.log("=== Building Dealflow AI Chrome Extension ===");

// 1. Ensure icons exist by invoking python generator if needed
const iconsDir = path.join(extDir, "icons");
const requiredIcons = ["icon16.png", "icon48.png", "icon128.png"];
const missingIcons = requiredIcons.some(img => !fs.existsSync(path.join(iconsDir, img)));

if (missingIcons) {
  console.log("[Build] Generating missing PNG icons...");
  execSync("python scripts/generate_extension_icons.py", { cwd: rootDir, stdio: "inherit" });
}

// 2. Transpile TypeScript files from src/ to root chrome-extension/
const tsFiles = ["content.ts", "background.ts", "popup.ts"];

for (const file of tsFiles) {
  const srcPath = path.join(srcDir, file);
  const outName = file.replace(/\.ts$/, ".js");
  const outPath = path.join(extDir, outName);

  if (fs.existsSync(srcPath)) {
    const code = fs.readFileSync(srcPath, "utf8");
    const transpiled = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        removeComments: false,
      },
    });

    fs.writeFileSync(outPath, transpiled.outputText, "utf8");
    console.log(`[Build] Transpiled ${file} -> ${outName}`);
  } else {
    console.warn(`[Build] Warning: Source file ${srcPath} not found!`);
  }
}

// 3. Copy HTML files from src/ to root chrome-extension/
const htmlFiles = ["popup.html", "options.html"];

for (const htmlFile of htmlFiles) {
  const srcPath = path.join(srcDir, htmlFile);
  const outPath = path.join(extDir, htmlFile);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, outPath);
    console.log(`[Build] Copied ${htmlFile} -> root chrome-extension/${htmlFile}`);
  } else {
    console.warn(`[Build] Warning: HTML file ${srcPath} not found!`);
  }
}

// 4. Verify all manifest assets exist
const manifestPath = path.join(extDir, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("❌ Error: manifest.json is missing!");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const requiredFiles = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  manifest.options_page,
  ...(manifest.content_scripts?.[0]?.js || []),
  manifest.icons?.["16"],
  manifest.icons?.["48"],
  manifest.icons?.["128"],
].filter(Boolean);

let allValid = true;
for (const relFile of requiredFiles) {
  const targetFile = path.join(extDir, relFile);
  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Missing manifest asset: ${relFile} (${targetFile})`);
    allValid = false;
  }
}

if (allValid) {
  console.log("🎉 Chrome Extension built successfully! Ready for 'Load unpacked' in chrome://extensions/");
} else {
  console.error("❌ Extension build contains missing asset references.");
  process.exit(1);
}

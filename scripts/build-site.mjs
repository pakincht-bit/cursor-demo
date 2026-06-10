import { execSync } from "node:child_process"
import { cpSync, mkdirSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const distDir = join(root, "dist")

const staticFiles = ["index.html", "styles.css", "script.js", "aurora.js"]

process.chdir(root)

console.log("Building React story-stack bundle...")
execSync("vite build", { stdio: "inherit" })

console.log("Assembling static site...")
rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

for (const file of staticFiles) {
  cpSync(join(root, file), join(distDir, file))
}

cpSync(join(root, "assets"), join(distDir, "assets"), { recursive: true })

console.log("Build complete. Output:", distDir)

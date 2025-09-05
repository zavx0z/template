#!/usr/bin/env bun

import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const packageJsonPath = join(process.cwd(), "package.json")
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))

const currentVersion = packageJson.version
const [major, minor, patch] = currentVersion.split(".").map(Number)

console.log(`Current version: ${currentVersion}`)

// Определяем тип релиза
const releaseType = process.argv[2] || "patch"
let newVersion: string

switch (releaseType) {
  case "major":
    newVersion = `${major + 1}.0.0`
    break
  case "minor":
    newVersion = `${major}.${minor + 1}.0`
    break
  case "patch":
  default:
    newVersion = `${major}.${minor}.${patch + 1}`
    break
}

console.log(`New version: ${newVersion}`)

// Обновляем версию в package.json
packageJson.version = newVersion
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")

// Создаем коммит с новой версией
execSync("git add package.json", { stdio: "inherit" })
execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: "inherit" })

// Создаем тег
const tagName = `v${newVersion}`
execSync(`git tag ${tagName}`, { stdio: "inherit" })

// Пушим коммит и тег
execSync("git push origin main", { stdio: "inherit" })
execSync(`git push origin ${tagName}`, { stdio: "inherit" })

console.log(`✅ Release ${tagName} created and pushed!`)
console.log(`📦 GitHub Actions will now create the release automatically.`)

import { execSync } from 'node:child_process'
import inquirer from 'inquirer'
import { cyan, dim, green, red, yellow } from 'kolorist'

export interface VersionCheckResult {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
}

/**
 * Check if there's a newer version available on npm
 */
export async function checkForUpdates(
  packageName: string,
  currentVersion: string,
): Promise<VersionCheckResult> {
  try {
    // Get latest version from npm
    const latestVersion = execSync(`npm view ${packageName} version`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim()

    const hasUpdate = compareVersions(currentVersion, latestVersion) < 0

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
    }
  }
  catch {
    // If npm check fails, silently skip the update check
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
    }
  }
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 < part2)
      return -1
    if (part1 > part2)
      return 1
  }

  return 0
}

/**
 * Display update notification and prompt user to update
 */
export async function promptForUpdate(
  packageName: string,
  result: VersionCheckResult,
): Promise<void> {
  if (!result.hasUpdate)
    return

  console.log(yellow('\n╔═══════════════════════════════════════════════════════════════╗'))
  console.log(yellow('║                    📦  Update Available                       ║'))
  console.log(yellow('╚═══════════════════════════════════════════════════════════════╝'))
  console.log(dim(`  Current version: ${result.currentVersion}`))
  console.log(green(`  Latest version:  ${result.latestVersion}\n`))

  const { shouldUpdate, packageManager } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldUpdate',
      message: 'Would you like to update now?',
      default: false,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: ['npm', 'pnpm', 'yarn'],
      default: 'npm',
      when: (answers: any) => answers.shouldUpdate,
    },
  ])

  if (shouldUpdate) {
    try {
      console.log(cyan(`\n⏳  Updating ${packageName}...\n`))

      let command: string
      if (packageManager === 'npm') {
        command = `npm install -g ${packageName}`
      }
      else if (packageManager === 'pnpm') {
        command = `pnpm add -g ${packageName}`
      }
      else {
        command = `yarn global add ${packageName}`
      }

      execSync(command, { stdio: 'inherit' })
      console.log(green(`\n✅  Successfully updated to version ${result.latestVersion}!`))
      console.log(yellow('Please restart the command to use the new version.\n'))
      process.exit(0)
    }
    catch {
      console.log(red('\n❌  Failed to update. Please try manually:'))
      console.log(dim(`  npm install -g ${packageName}`))
      console.log(dim(`  or: pnpm add -g ${packageName}`))
      console.log(dim(`  or: yarn global add ${packageName}\n`))
    }
  }
  else {
    console.log(dim('\nYou can update later by running:'))
    console.log(yellow(`  npm install -g ${packageName}\n`))
  }
}

/**
 * Check for updates and prompt user (non-blocking)
 */
export async function checkAndNotifyUpdate(
  packageName: string,
  currentVersion: string,
): Promise<void> {
  try {
    const result = await checkForUpdates(packageName, currentVersion)
    await promptForUpdate(packageName, result)
  }
  catch {
    // Silently fail if update check fails
  }
}

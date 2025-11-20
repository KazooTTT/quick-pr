import { cyan, dim, green, red, yellow } from 'kolorist'
import { addPinnedBranch, getPinnedBranches, removePinnedBranch } from './config.js'
import { promptBranchSelection } from './pr-cli.js'

/**
 * 处理 pin branch 命令
 */
export async function handlePinCommand(branchName?: string): Promise<void> {
  console.log(cyan('\n📌  Pin Branch'))
  console.log(dim('Pin frequently used branches for quick access\n'))

  // 如果提供了分支名，直接 pin 该分支
  if (branchName) {
    const pinnedBranches = getPinnedBranches()
    if (pinnedBranches.includes(branchName)) {
      console.log(yellow(`⚠️  Branch '${branchName}' is already pinned`))
      return
    }
    addPinnedBranch(branchName)
    console.log(green(`✅  Branch '${branchName}' has been pinned`))
  }
  else {
    // 没有提供分支名，显示所有分支，已固定的分支默认选中
    const { getAllBranches } = await import('../services/pr.js')
    const branches = getAllBranches()

    if (branches.length === 0) {
      console.log(yellow('⚠️  No branches found'))
      return
    }

    const pinnedBranches = getPinnedBranches()

    const selectedBranches = await promptBranchSelection(branches, {
      title: '📌  Manage Pinned Branches',
      message: 'Select branches to pin (type to search, Space to toggle, Enter to confirm):',
      mode: 'multiple',
      defaultSelected: pinnedBranches,
    }) as string[]

    // 计算需要添加和移除的分支
    const toAdd = selectedBranches.filter(b => !pinnedBranches.includes(b))
    const toRemove = pinnedBranches.filter(b => !selectedBranches.includes(b))

    // 批量添加新固定的分支
    toAdd.forEach((branch: string) => {
      addPinnedBranch(branch)
    })

    // 批量移除取消固定的分支
    toRemove.forEach((branch: string) => {
      removePinnedBranch(branch)
    })

    if (toAdd.length > 0 || toRemove.length > 0) {
      if (toAdd.length > 0) {
        console.log(green(`✅  Pinned ${toAdd.length} branch(es)`))
      }
      if (toRemove.length > 0) {
        console.log(green(`✅  Unpinned ${toRemove.length} branch(es)`))
      }
    }
    else {
      console.log(dim('No changes made'))
    }
  }

  // 显示当前所有固定的分支
  const updatedPinnedBranches = getPinnedBranches()
  console.log(cyan('\n📌  Current pinned branches:'))
  updatedPinnedBranches.forEach((branch, index) => {
    console.log(dim(`  ${index + 1}. ${branch}`))
  })
  console.log()
}

/**
 * 处理 unpin branch 命令
 */
export async function handleUnpinCommand(branchName?: string): Promise<void> {
  console.log(cyan('\n📍  Unpin Branch'))
  console.log(dim('Remove a branch from pinned list\n'))

  const pinnedBranches = getPinnedBranches()

  if (pinnedBranches.length === 0) {
    console.log(yellow('⚠️  No pinned branches found'))
    return
  }

  // 如果提供了分支名，直接 unpin 该分支
  if (branchName) {
    if (!pinnedBranches.includes(branchName)) {
      console.log(red(`❌  Branch '${branchName}' is not pinned`))
      return
    }
    removePinnedBranch(branchName)
    console.log(green(`✅  Branch '${branchName}' has been unpinned`))
  }
  else {
    // 没有提供分支名，从固定列表中多选
    const selectedBranches = await promptBranchSelection(pinnedBranches, {
      title: '📍  Unpin Branches',
      message: 'Select branches to unpin (type to search, Space to select, Enter to confirm):',
      mode: 'multiple',
    }) as string[]

    if (selectedBranches.length === 0) {
      console.log(yellow('⚠️  No branches selected'))
      return
    }

    // 批量移除
    selectedBranches.forEach((branch: string) => {
      removePinnedBranch(branch)
    })
    console.log(green(`✅  Unpinned ${selectedBranches.length} branch(es)`))
  }

  // 显示当前所有固定的分支
  const updatedPinnedBranches = getPinnedBranches()
  if (updatedPinnedBranches.length > 0) {
    console.log(cyan('\n📌  Current pinned branches:'))
    updatedPinnedBranches.forEach((branch, index) => {
      console.log(dim(`  ${index + 1}. ${branch}`))
    })
  }
  else {
    console.log(dim('\nNo pinned branches'))
  }
  console.log()
}

/**
 * 显示所有固定的分支
 */
export async function handleListPinnedCommand(): Promise<void> {
  console.log(cyan('\n📌  Pinned Branches'))
  console.log(dim('List of all pinned branches\n'))

  const pinnedBranches = getPinnedBranches()

  if (pinnedBranches.length === 0) {
    console.log(yellow('⚠️  No pinned branches found'))
    console.log(dim('Use "qkpr pin <branch-name>" to pin a branch\n'))
    return
  }

  pinnedBranches.forEach((branch, index) => {
    console.log(`  ${green(`${index + 1}.`)} ${branch}`)
  })
  console.log()
}

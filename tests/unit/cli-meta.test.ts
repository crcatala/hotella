import { describe, expect, it } from 'vitest'
import {
  buildInfo,
  compareVersions,
  detectInstall,
  formatVersion,
  gitCloneUrl,
  gitInstallUrl,
  packageMeta,
  updateSteps,
} from '../../src/cli-meta.js'

// The version line, install detection and update steps from the release standard.
// Nothing here touches the network: `checkForUpdate` and `runUpdate` are exercised
// end to end by `pnpm run test:package` and the CLI integration tests.

const meta = (over: Partial<ReturnType<typeof packageMeta>> = {}) => ({
  root: '/x',
  name: 'hotella',
  version: '0.1.3',
  isPrivate: false,
  ...over,
})

describe('formatVersion', () => {
  it('prints version, short commit and commit date', () => {
    expect(
      formatVersion('hotella', { version: '0.1.3', commit: 'a1b2c3d4e5f6', date: '2026-10-27' }),
    ).toBe('hotella 0.1.3 (a1b2c3d 2026-10-27)')
  })

  it('marks dirty builds', () => {
    expect(
      formatVersion('hotella', {
        version: '0.1.3',
        commit: 'a1b2c3d4e5f6',
        date: '2026-10-27',
        dirty: true,
      }),
    ).toBe('hotella 0.1.3 (a1b2c3d-dirty 2026-10-27)')
  })

  it('omits empty parentheses without a commit', () => {
    expect(formatVersion('hotella', { version: '0.1.3' })).toBe('hotella 0.1.3')
  })
})

describe('detectInstall', () => {
  it('recognizes the supported install methods', () => {
    expect(detectInstall('/Users/u/src/hotella', true)).toBe('checkout')
    expect(detectInstall('/Users/u/.npm/_npx/abc/node_modules/hotella', false)).toBe('npx')
    expect(
      detectInstall(
        '/Users/u/.local/share/mise/installs/npm-hotella/0.1.3/lib/node_modules/hotella',
        false,
      ),
    ).toBe('mise')
    expect(detectInstall('/Users/u/.bun/install/global/node_modules/hotella', false)).toBe('bun')
    expect(detectInstall('/Users/u/.local/share/pnpm/global/5/node_modules/hotella', false)).toBe(
      'pnpm',
    )
    expect(detectInstall('/usr/lib/node_modules/hotella', false, '/usr/lib/node_modules')).toBe(
      'npm',
    )
    expect(detectInstall('/proj/node_modules/hotella', false, '/usr/lib/node_modules')).toBe(
      'unknown',
    )
  })
})

describe('updateSteps', () => {
  it('updates registry installs to the latest version', () => {
    expect(updateSteps('npm', meta())).toEqual([
      { cmd: 'npm', args: ['install', '-g', 'hotella@latest'] },
    ])
    expect(updateSteps('pnpm', meta())).toEqual([
      { cmd: 'pnpm', args: ['add', '-g', 'hotella@latest'] },
    ])
    expect(updateSteps('bun', meta())).toEqual([
      { cmd: 'bun', args: ['add', '-g', 'hotella@latest'] },
    ])
    expect(updateSteps('mise', meta())).toEqual([
      { cmd: 'mise', args: ['upgrade', '--bump', 'npm:hotella'] },
    ])
  })

  it('pulls, installs and rebuilds a source checkout', () => {
    expect(
      updateSteps('checkout', meta(), 'pnpm').map((s) => [s.cmd, ...s.args].join(' ')),
    ).toEqual(['git pull --ff-only origin main', 'pnpm install', 'pnpm run build'])
  })

  it('never looks a private package up on the registry', () => {
    const priv = meta({ isPrivate: true, repositoryUrl: 'github:o/r' })
    expect(updateSteps('npm', priv)).toEqual([
      { cmd: 'npm', args: ['install', '-g', 'git+https://github.com/o/r.git'] },
    ])
    expect(updateSteps('mise', priv)).toBeNull()
    expect(updateSteps('npm', meta({ isPrivate: true }))).toBeNull()
  })

  it('has no steps for npx or an unknown install method', () => {
    expect(updateSteps('npx', meta())).toBeNull()
    expect(updateSteps('unknown', meta())).toBeNull()
  })
})

describe('repository URLs', () => {
  it('normalizes once for git and for installers', () => {
    for (const [input, clone] of [
      ['github:o/r', 'https://github.com/o/r.git'],
      ['o/r', 'https://github.com/o/r.git'],
      ['git@github.com:o/r.git', 'ssh://git@github.com/o/r.git'],
      ['git+https://github.com/o/r.git', 'https://github.com/o/r.git'],
    ]) {
      expect(gitCloneUrl(input)).toBe(clone)
      expect(gitInstallUrl(input)).toBe(`git+${clone}`)
    }
  })
})

describe('compareVersions', () => {
  it('orders releases and prereleases', () => {
    expect(compareVersions('0.1.3', '0.10.0')).toBeLessThan(0)
    expect(compareVersions('1.0.0', '0.99.99')).toBeGreaterThan(0)
    expect(compareVersions('v1.0.0', '1.0.0')).toBe(0)
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBeLessThan(0)
  })
})

describe('packageMeta and buildInfo in this checkout', () => {
  it('finds the package that owns the module', () => {
    const found = packageMeta()
    expect(found.name).toBe('hotella')
    expect(found.isPrivate).toBe(false)
    expect(found.repositoryUrl).toContain('crcatala/hotella')
  })

  it('reports a commit from source, so a stale build cannot hide it', () => {
    const info = buildInfo(packageMeta())
    expect(info.version).toBe(packageMeta().version)
    expect(info.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(info.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

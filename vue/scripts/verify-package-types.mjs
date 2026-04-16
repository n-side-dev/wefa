import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = dirname(repoRoot)
const tempBaseDir = join(workspaceRoot, 'node_modules', '.tmp')

mkdirSync(tempBaseDir, { recursive: true })

const smokeTestRoot = mkdtempSync(join(tempBaseDir, 'wefa-package-types-'))
let tarballPath

try {
  const packOutput = execFileSync('npm', ['pack', '--json'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  })
  const [{ filename }] = JSON.parse(packOutput)
  tarballPath = join(workspaceRoot, filename)

  const packagedNetworkDts = execFileSync('tar', ['-xOf', tarballPath, 'package/dist/network.d.ts'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  })

  for (const expectedExport of [
    "export { default as axiosInstance } from './src/network/axios';",
    "export { default as apiClient } from './src/network/apiClient';",
    "export { default as typedApiClient } from './src/network/typedApiClient';",
  ]) {
    if (!packagedNetworkDts.includes(expectedExport)) {
      throw new Error(`Missing network declaration export: ${expectedExport}`)
    }
  }

  const packagedTypedApiClientDts = execFileSync(
    'tar',
    ['-xOf', tarballPath, 'package/dist/src/network/typedApiClient.d.ts'],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
    },
  )

  for (const expectedMember of ['setupOpenApiClient', 'query', 'mutation']) {
    if (!packagedTypedApiClientDts.includes(expectedMember)) {
      throw new Error(`Missing typedApiClient declaration member: ${expectedMember}`)
    }
  }

  const packagedScopeDir = join(smokeTestRoot, 'node_modules', '@nside')
  mkdirSync(packagedScopeDir, { recursive: true })
  execFileSync('tar', ['-xzf', tarballPath, '-C', packagedScopeDir], { cwd: workspaceRoot })
  renameSync(join(packagedScopeDir, 'package'), join(packagedScopeDir, 'wefa'))

  writeFileSync(
    join(smokeTestRoot, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          target: 'ES2022',
          strict: true,
          skipLibCheck: false,
          noEmit: true,
        },
        include: ['./index.ts'],
      },
      null,
      2,
    ),
  )

  writeFileSync(
    join(smokeTestRoot, 'index.ts'),
    [
      "import { typedApiClient, apiClient, axiosInstance } from '@nside/wefa/network'",
      '',
      'typedApiClient.setupOpenApiClient({ setConfig() {} })',
      'void typedApiClient.query',
      'void typedApiClient.mutation',
      'void apiClient',
      'void axiosInstance',
      '',
    ].join('\n'),
  )

  execFileSync(join(workspaceRoot, 'node_modules', '.bin', 'vue-tsc'), ['--project', join(smokeTestRoot, 'tsconfig.json')], {
    cwd: workspaceRoot,
    stdio: 'pipe',
  })

  console.log('Package type verification passed.')
} finally {
  rmSync(smokeTestRoot, { recursive: true, force: true })

  if (tarballPath) {
    rmSync(tarballPath, { force: true })
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Fake executables exercise publication order without Git writes or network calls.
test('publisher verifies the account and checks before publishing, and stops on failures', { skip: process.platform === 'win32' }, () => {
  const stub = `#!/bin/bash
command_name="\${0##*/}"
printf '%s' "$command_name" >> "$PUBLISH_TEST_LOG"
printf ' <%s>' "$@" >> "$PUBLISH_TEST_LOG"
printf '\\n' >> "$PUBLISH_TEST_LOG"
if [[ "$command_name $*" == "$PUBLISH_TEST_FAIL" ]]; then exit 1; fi
if [[ "$command_name $1" == 'gh api' ]]; then printf '%s\\n' "$PUBLISH_TEST_ACCOUNT"; fi
`;
  const cases = [
    { name: 'success', success: true },
    { name: 'wrong account', account: 'someone-else' },
    { name: 'authentication failure', fail: 'gh api user --jq .login' },
    { name: 'test failure', fail: 'npm test' },
    { name: 'documentation failure', fail: 'npm run check' },
    { name: 'existing repository', existing: true },
  ];
  for (const scenario of cases) {
    const root = mkdtempSync(join(tmpdir(), 'inverse-publish-test-'));
    try {
      mkdirSync(join(root, 'scripts'));
      mkdirSync(join(root, 'bin'));
      copyFileSync(new URL('../scripts/publish-github.sh', import.meta.url), join(root, 'scripts/publish-github.sh'));
      if (scenario.existing) mkdirSync(join(root, '.git'));
      const logPath = join(root, 'calls.log');
      writeFileSync(logPath, '');
      for (const command of ['gh', 'git', 'npm']) writeFileSync(join(root, 'bin', command), stub, { mode: 0o755 });
      const result = spawnSync('bash', ['scripts/publish-github.sh'], {
        cwd: root, encoding: 'utf8',
        env: {
          ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`,
          PUBLISH_TEST_LOG: logPath,
          PUBLISH_TEST_ACCOUNT: scenario.account || 'burhan-mujahid',
          PUBLISH_TEST_FAIL: scenario.fail || '',
        },
      });
      const calls = readFileSync(logPath, 'utf8');
      assert.equal(result.status === 0, Boolean(scenario.success), `${scenario.name}: ${result.stderr}`);
      if (scenario.success) {
        assert.ok(calls.indexOf('npm <run> <check>') < calls.indexOf('git <init>'), 'Checks precede Git writes.');
        assert.match(calls, /gh <repo> <create> <burhan-mujahid\/inverse-notebook> <--public>/);
        assert.match(calls, /<--source=\.> <--remote=origin> <--push>/);
        assert.ok(calls.indexOf('gh <repo> <edit>') > calls.indexOf('gh <repo> <create>'));
        assert.match(calls, /<--enable-discussions>/);
        assert.match(calls, /gh <repo> <view>/);
      } else {
        assert.doesNotMatch(calls, /^git |gh <repo>/m, `${scenario.name} must stop before publication.`);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

#!/usr/bin/env bash
# First publication only. Recovery commands are in docs/PUBLISHING.md.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -e .git ]]; then
  echo 'A Git repository already exists. Use the recovery commands in docs/PUBLISHING.md.' >&2
  exit 1
fi

account=$(gh api user --jq .login)
if [[ "$account" != 'burhan-mujahid' ]]; then
  echo 'Switch gh to the burhan-mujahid account before publishing.' >&2
  exit 1
fi

npm test
npm run check
git init -b main
git add -- .gitignore .nvmrc .github LICENSE README.md PRODUCT.md DESIGN.md \
  CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md CITATION.cff \
  package.json package-lock.json index.html public src scripts test docs
git -c user.name='Burhan Mujahid' -c user.email='burhanmujahid552@gmail.com' \
  commit -m 'Open source Inverse: interactive inverse problems notebook'

gh repo create burhan-mujahid/inverse-notebook --public --source=. --remote=origin --push \
  --description 'Move the result. See what must change. An interactive notebook for inverse problems, constraint solving, and explainable convex optimization. MIT licensed.' \
  --disable-wiki

gh repo edit burhan-mujahid/inverse-notebook \
  --enable-issues --enable-discussions --enable-wiki=false --delete-branch-on-merge \
  --add-topic 'inverse-problems,interactive-computation,computational-notebook,convex-optimization,constraint-solving,scientific-computing,explorable-explanations,human-computer-interaction,engineering-education,beam-analysis,javascript,numerical-methods,local-first'

gh repo view burhan-mujahid/inverse-notebook \
  --json url,visibility,description,repositoryTopics,licenseInfo,hasDiscussionsEnabled

# Publish Inverse on GitHub

Intended repository: **`burhan-mujahid/inverse-notebook`**, public, MIT licensed.

The preparation environment could write project files but could not create `.git` or resolve `api.github.com`. No remote creation was verified there. The README, package metadata, issue links, and citation file use the intended repository address; they become usable once publication succeeds. No hosted demo URL is claimed.

## First publication

From the project directory in your normal terminal:

```sh
bash scripts/publish-github.sh
```

The script verifies the active GitHub account, runs the tests and link checks, initializes `main`, commits the reviewed project paths, creates and pushes a public repository, and sets its description and 13 relevant topics. It enables Issues and Discussions and disables the redundant wiki. It uses your existing `gh` login and stops on errors. It does not create a separate npm publication; `private: true` in package.json only prevents that accidental action.

The script refuses an existing `.git` directory so it cannot accidentally republish unrelated history. If `gh api user` fails in a terminal with working connectivity, use `gh auth status`; reauthenticate with `gh auth login --hostname github.com` only if GitHub reports an authentication problem. Do not put tokens in project files.

## Resume a partial publication

First inspect what exists:

```sh
git status
git log -1 --oneline
git remote -v
gh repo view burhan-mujahid/inverse-notebook
```

If the local commit exists but the remote was never created, run:

```sh
gh repo create burhan-mujahid/inverse-notebook --public --source=. --remote=origin --push \
  --description 'Move the result. See what must change. An interactive notebook for inverse problems, constraint solving, and explainable convex optimization. MIT licensed.' \
  --disable-wiki
```

If remote creation succeeded but pushing failed, verify that the remote is the newly created repository for this project. If `origin` is missing, add it:

```sh
git remote add origin https://github.com/burhan-mujahid/inverse-notebook.git
```

Then push normally:

```sh
git push -u origin main
```

Do not force-push over an existing repository. If the intended name already belongs to a different project, choose a new name and update its references in README, CONTRIBUTING, package.json, CITATION.cff, issue configuration, this guide, STATUS, and the publishing script before publishing.

Apply or reapply the discovery/community settings:

```sh
gh repo edit burhan-mujahid/inverse-notebook \
  --enable-issues --enable-discussions --enable-wiki=false --delete-branch-on-merge \
  --add-topic 'inverse-problems,interactive-computation,computational-notebook,convex-optimization,constraint-solving,scientific-computing,explorable-explanations,human-computer-interaction,engineering-education,beam-analysis,javascript,numerical-methods,local-first'

gh repo view burhan-mujahid/inverse-notebook \
  --json url,visibility,description,repositoryTopics,licenseInfo,hasDiscussionsEnabled
gh run list --repo burhan-mujahid/inverse-notebook --workflow checks.yml --limit 3
```

## Discoverability choices

The name, description, README heading, topics, and citation keywords use language that matches the actual implementation. [GitHub topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) help people browse projects by subject. A root [CITATION.cff](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files) enables GitHub's citation interface.

The screenshot demonstrates a real result. The research brief cites primary work and makes the open questions explicit. The README identifies the kinds of collaborators sought and provides a direct email address. These choices improve clarity and relevance; they do not guarantee search ranking, stars, adoption, or research interest.

## After publication

1. Verify the README image, rendered equations, license recognition, citation entry, and passing Checks workflow on GitHub.
2. Pin the repository on your GitHub profile and add a short profile sentence about interactive computational tools.
3. Turn selected tasks from CONTRIBUTING into bounded issues with reproduction steps or acceptance criteria. Use `good first issue` only for tasks that are actually ready for a newcomer.
4. When the first public revision is stable, create a tagged release with limitations and reproducible verification instructions. A DOI archive can be considered once there is a stable research artifact to cite.
5. Share a specific demonstration and question with relevant communities, following each community's rules. Seek concrete workflow feedback and collaborators rather than promising general program inversion.

Suggested introduction, ready to adapt after the repository is live:

> I'm building Inverse, an MIT-licensed computational notebook where you edit a desired result, lock the inputs that matter, and inspect what needs to change. The first prototype is a cantilever beam with a small, inspectable convex solver. I'm looking for HCI and optimization collaborators, educators, and people with a concrete modeling workflow to test. What result would you want to manipulate directly? Contact: burhanmujahid552@gmail.com.

No outreach messages are sent by the publishing script.

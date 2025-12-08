# CodeMaestro Git Workflow Guide
# Branch Strategy for Multi-Agent Development

================================================================================
## BRANCH HIERARCHY
================================================================================

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BRANCH STRUCTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  master (PRODUCTION)                                                       │
│    ├── Stable, tested, deployable code                                     │
│    ├── Only merged after entire Phase is complete & tested                 │
│    └── Tagged with version numbers (v5.0.0, v6.0.0)                        │
│                                                                             │
│  phase-X-base (DEVELOPMENT)                                                │
│    ├── Orion sits here during active development                           │
│    ├── All feature work merges HERE first                                  │
│    ├── Integration testing happens here                                    │
│    └── Created at start of each Phase, merged at end                       │
│                                                                             │
│  feature/X-Y-name (FEATURE WORK)                                           │
│    ├── Devon's implementation branches                                     │
│    ├── Tara's test branches                                                │
│    ├── Branch FROM phase-X-base                                            │
│    └── Merge BACK TO phase-X-base                                          │
│                                                                             │
│  hotfix/description (EMERGENCY FIXES)                                      │
│    ├── Branch FROM master                                                  │
│    ├── Merge TO master AND phase-X-base                                    │
│    └── Used only for production emergencies                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Flow

```
master ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━► (stable)
         │                                               ↑
         │                                               │ (Phase complete)
         │                                               │
         └── phase-6-base ──┬─── updates ───┬───────────┘
                            │               │
                            ├── feature/6-1 ┤ (Devon)
                            │               │
                            └── feature/6-2 ┘ (Tara)
```

================================================================================
## CLONE STRUCTURE
================================================================================

Each agent has their own independent Git clone:

```
/codemaestro-agents/
├── orion-workspace/          # Orion's clone (on phase-X-base)
├── devon-workspace/          # Devon's clone (on feature branches)
└── tara-workspace/           # Tara's clone (on feature branches)
```

### Why Separate Clones?
- **Physical isolation**: No checkout conflicts between agents
- **Independent work**: Each agent has own .git directory
- **Simple commands**: Standard git workflow, no worktree complexity
- **Safe experimentation**: One agent's mistakes don't affect others

================================================================================
## PHASE LIFECYCLE
================================================================================

### Phase Start: Orion Creates Development Branch

```bash
# In Orion's workspace
cd /orion-workspace

# Ensure we have latest stable code
git checkout master
git pull origin master

# Create the phase development branch
git checkout -b phase-6-base
git push origin phase-6-base

# Announce to team
echo "Phase 6 development branch created: phase-6-base"
```

### During Phase: Agents Branch and Work

```bash
# Devon creates feature branch
cd /devon-workspace
git fetch origin
git checkout -b feature/6-1-project-context origin/phase-6-base
git push -u origin feature/6-1-project-context

# Tara creates feature branch
cd /tara-workspace
git fetch origin
git checkout -b feature/6-2-orion-panel origin/phase-6-base
git push -u origin feature/6-2-orion-panel
```

### Phase End: Orion Merges to Master

```bash
# In Orion's workspace
cd /orion-workspace

# Ensure phase-6-base is complete and tested
git checkout phase-6-base
git pull origin phase-6-base
npm test  # All tests must pass

# Merge to master
git checkout master
git pull origin master
git merge phase-6-base -m "Merge Phase 6: Context Intelligence"

# Final verification
npm test

# Push and tag
git push origin master
git tag -a v6.0.0 -m "Phase 6 Release: Context Intelligence"
git push origin v6.0.0
```

================================================================================
## DAILY WORKFLOW: SYNCING CHANGES
================================================================================

### Scenario: Orion Updates a Subtask Log

Orion updates `6-3.yml` while Devon and Tara are working on their features.

#### Step 1: Orion Commits and Pushes

```bash
cd /orion-workspace
git checkout phase-6-base

# Make changes to 6-3.yml
git add Agents/Subtasks/Logs/6-3.yml
git commit -m "[ORION] Update 6-3 requirements"
git push origin phase-6-base
```

#### Step 2: Devon Syncs (Has Uncommitted Work)

```bash
cd /devon-workspace

# ALWAYS commit your work first!
git add .
git commit -m "[WIP] Devon: 6-1 in progress"

# Fetch and merge from development branch
git fetch origin
git merge origin/phase-6-base -m "Sync: phase-6-base updates"

# Continue working - your changes are preserved
```

#### Step 3: Tara Syncs

```bash
cd /tara-workspace

# Save work
git add .
git commit -m "[WIP] Tara: 6-2 tests in progress"

# Sync
git fetch origin
git merge origin/phase-6-base -m "Sync: phase-6-base updates"
```

### Visual: Before and After Sync

```
BEFORE:
phase-6-base:   A ━━━ B ━━━ C (Orion's 6-3 update)

feature/6-1:    A ━━━ B ━━━ D ━━━ E (Devon's work)

feature/6-2:    A ━━━ B ━━━ F (Tara's work)


AFTER SYNC:
phase-6-base:   A ━━━ B ━━━ C

feature/6-1:    A ━━━ B ━━━ D ━━━ E ━━━ M1 (merge commit)
                          \           /
                           └━━━ C ━━━┘

feature/6-2:    A ━━━ B ━━━ F ━━━ M2 (merge commit)
                          \     /
                           └━ C ┘
```

================================================================================
## FEATURE COMPLETION WORKFLOW
================================================================================

### Devon Completes Feature 6-1

```bash
cd /devon-workspace

# Final sync before completion
git fetch origin
git merge origin/phase-6-base

# Final commit
git add .
git commit -m "[DEVON] Complete 6-1: Project Context API"

# Push feature branch
git push origin feature/6-1-project-context

# Notify Orion: "6-1 ready for merge"
```

### Orion Merges Completed Feature

```bash
cd /orion-workspace
git checkout phase-6-base
git pull origin phase-6-base

# Fetch Devon's branch
git fetch origin

# Merge the completed feature
git merge origin/feature/6-1-project-context -m "Merge 6-1: Project Context API"

# Run tests
npm test

# If tests pass, push
git push origin phase-6-base

# Notify team: "6-1 merged, sync your branches"
```

### Tara Syncs to Get Devon's Work

```bash
cd /tara-workspace

git add .
git commit -m "[WIP] Tara: current progress"

git fetch origin
git merge origin/phase-6-base -m "Sync: includes 6-1"

# Now Tara has Devon's implementation to test against
```

================================================================================
## HANDLING MERGE CONFLICTS
================================================================================

### When Conflicts Occur

If Devon and Orion both edited the same file:

```bash
cd /devon-workspace
git fetch origin
git merge origin/phase-6-base

# Git outputs:
# CONFLICT (content): Merge conflict in Agents/Subtasks/Logs/6-3.yml
# Automatic merge failed; fix conflicts and then commit the result.
```

### Resolving Conflicts

```bash
# 1. Open the conflicted file
# You'll see conflict markers:

<<<<<<< HEAD
Devon's version of this section
=======
Orion's version of this section
>>>>>>> origin/phase-6-base

# 2. Edit to combine both changes (or choose one)
# Remove the conflict markers

# 3. Mark as resolved
git add Agents/Subtasks/Logs/6-3.yml

# 4. Complete the merge
git commit -m "Merge phase-6-base, resolved 6-3 conflict"

# 5. Continue working
```

### Conflict Prevention Tips

1. **Communicate**: Announce when editing shared files
2. **Sync often**: Merge phase-X-base at least daily
3. **Small commits**: Easier to merge than large changes
4. **Divide ownership**: Devon owns `src/`, Tara owns `__tests__/`

================================================================================
## COMMAND QUICK REFERENCE
================================================================================

### Starting Work (Beginning of Day)

```bash
# Sync your branch with latest development
git fetch origin
git merge origin/phase-X-base
```

### Saving Work (Throughout Day)

```bash
# Commit frequently with WIP prefix for incomplete work
git add .
git commit -m "[WIP] Description of progress"
```

### Completing Work (Feature Done)

```bash
# Final sync, clean commit, push
git fetch origin
git merge origin/phase-X-base
git add .
git commit -m "[AGENT] Complete X-Y: Feature Name"
git push origin feature/X-Y-name
```

### Emergency: Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
# Your changes are now unstaged but preserved
```

### Emergency: Discard All Local Changes

```bash
# WARNING: This loses uncommitted work!
git checkout -- .
git clean -fd
```

================================================================================
## BRANCH NAMING CONVENTIONS
================================================================================

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Phase development | `phase-X-base` | `phase-6-base` |
| Feature implementation | `feature/X-Y-name` | `feature/6-1-project-context` |
| Feature tests | `feature/X-Y-name-tests` | `feature/6-1-tests` |
| Hotfix | `hotfix/description` | `hotfix/auth-bypass` |
| Release tag | `vX.Y.Z` | `v6.0.0` |

================================================================================
## WHO MERGES WHERE
================================================================================

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MERGE PERMISSIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Devon/Tara → phase-X-base                                                 │
│    ├── Push feature branches                                               │
│    ├── Request merge via notification to Orion                             │
│    └── Orion performs actual merge                                         │
│                                                                             │
│  Orion → phase-X-base                                                      │
│    ├── Direct commits (planning docs, logs)                                │
│    ├── Merge feature branches                                              │
│    └── Integration testing                                                 │
│                                                                             │
│  Orion → master                                                            │
│    ├── ONLY after Phase complete                                           │
│    ├── ONLY after all tests pass                                           │
│    └── Creates version tag                                                 │
│                                                                             │
│  NEVER: Devon/Tara → master (direct)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

================================================================================
## COMPLETE PHASE EXAMPLE: Phase 6
================================================================================

### Timeline

```
Day 1: Phase Start
├── Orion creates phase-6-base from master
├── Devon creates feature/6-1-project-context
└── Tara creates feature/6-2-orion-panel

Day 2-5: Development
├── Devon works on 6-1
├── Tara works on 6-2
├── Orion updates logs, plans (commits to phase-6-base)
└── Everyone syncs daily from phase-6-base

Day 6: Devon Completes 6-1
├── Devon pushes final commit
├── Orion merges feature/6-1 into phase-6-base
└── Tara syncs to get 6-1

Day 8: Tara Completes 6-2
├── Tara pushes final commit
├── Orion merges feature/6-2 into phase-6-base
└── Integration testing begins

Day 9: Phase Complete
├── All tests pass on phase-6-base
├── Orion merges phase-6-base into master
├── Orion creates tag v6.0.0
└── Phase 7 planning begins
```

### Commands Summary

```bash
# DAY 1: Setup
# Orion:
git checkout master && git pull origin master
git checkout -b phase-6-base && git push origin phase-6-base

# Devon:
git fetch origin
git checkout -b feature/6-1-project-context origin/phase-6-base

# Tara:
git fetch origin
git checkout -b feature/6-2-orion-panel origin/phase-6-base

# DAILY: Sync
git fetch origin && git merge origin/phase-6-base

# COMPLETION: Devon
git push origin feature/6-1-project-context
# (notify Orion)

# MERGE: Orion
git checkout phase-6-base && git pull origin phase-6-base
git merge origin/feature/6-1-project-context
npm test && git push origin phase-6-base

# PHASE END: Orion
git checkout master && git pull origin master
git merge phase-6-base && npm test
git push origin master
git tag -a v6.0.0 -m "Phase 6" && git push origin v6.0.0
```

================================================================================
## GOLDEN RULES
================================================================================

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GOLDEN RULES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NEVER merge directly to master during development                      │
│                                                                             │
│  2. ALWAYS commit your work before syncing                                 │
│        git add . && git commit -m "[WIP] progress"                         │
│                                                                             │
│  3. ALWAYS sync from phase-X-base, NOT master                              │
│        git merge origin/phase-X-base                                       │
│                                                                             │
│  4. ONLY Orion merges to master (after full testing)                       │
│                                                                             │
│  5. Sync at least once daily to avoid large conflicts                      │
│                                                                             │
│  6. Use descriptive commit messages with agent prefix                      │
│        [DEVON], [TARA], [ORION], [WIP]                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

================================================================================
## RELATED DOCUMENTS
================================================================================

- `Multi_Agent_Scaling_Architecture.md` - Clone vs worktree strategies
- `Self_Evolution_Workflow.md` - CI/CD and deployment process
- `Constraint_Discovery_Implementation_Guide.md` - Analyzing workflows for risks

================================================================================


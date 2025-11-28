import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Store } from '../../core/store';
import { Watcher } from '../../core/watcher';
import { StatusBarController } from '../../view/statusBar';

suite('StatusBar Test Suite', () => {
  const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
  const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
  const epicsDir = path.join(workspaceRoot, '.devstories', 'epics');

  const epicFile = path.join(epicsDir, 'EPIC-STATUS.md');
  const story1File = path.join(storiesDir, 'STATUS-001.md');
  const story2File = path.join(storiesDir, 'STATUS-002.md');
  const story3File = path.join(storiesDir, 'STATUS-003.md');
  const story4File = path.join(storiesDir, 'STATUS-004.md');

  let watcher: Watcher;
  let store: Store;
  let statusBar: StatusBarController;

  setup(async () => {
    // Ensure directories exist
    if (!fs.existsSync(storiesDir)) {
      fs.mkdirSync(storiesDir, { recursive: true });
    }
    if (!fs.existsSync(epicsDir)) {
      fs.mkdirSync(epicsDir, { recursive: true });
    }

    // Create epic
    fs.writeFileSync(epicFile, `---
id: EPIC-STATUS
title: Status Test Epic
status: todo
created: 2025-01-01
---
# Status Test Epic`);

    // Create 4 stories: 2 done, 1 in_progress, 1 todo (for sprint-1)
    fs.writeFileSync(story1File, `---
id: STATUS-001
title: Done Story 1
type: feature
epic: EPIC-STATUS
status: done
sprint: sprint-1
size: S
created: 2025-01-01
---
# Done Story 1`);

    fs.writeFileSync(story2File, `---
id: STATUS-002
title: Done Story 2
type: task
epic: EPIC-STATUS
status: done
sprint: sprint-1
size: M
created: 2025-01-01
---
# Done Story 2`);

    fs.writeFileSync(story3File, `---
id: STATUS-003
title: In Progress Story
type: bug
epic: EPIC-STATUS
status: in_progress
sprint: sprint-1
size: S
created: 2025-01-01
---
# In Progress Story`);

    fs.writeFileSync(story4File, `---
id: STATUS-004
title: Todo Story
type: chore
epic: EPIC-STATUS
status: todo
sprint: sprint-1
size: XS
created: 2025-01-01
---
# Todo Story`);

    watcher = new Watcher();
    store = new Store(watcher);
    statusBar = new StatusBarController(store);
    await store.load();
  });

  teardown(() => {
    watcher.dispose();
    statusBar.dispose();

    const files = [epicFile, story1File, story2File, story3File, story4File];
    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  });

  test('should count stories accurately', () => {
    const stats = statusBar.getStats();
    assert.strictEqual(stats.total, 4, 'Should have 4 total stories');
    assert.strictEqual(stats.done, 2, 'Should have 2 done stories');
  });

  test('should count stories by sprint', () => {
    const stats = statusBar.getStats('sprint-1');
    assert.strictEqual(stats.total, 4, 'Sprint-1 should have 4 stories');
    assert.strictEqual(stats.done, 2, 'Sprint-1 should have 2 done');
  });

  test('should update on store change', async () => {
    // Change a story status from todo to done
    fs.writeFileSync(story4File, `---
id: STATUS-004
title: Todo Story
type: chore
epic: EPIC-STATUS
status: done
sprint: sprint-1
size: XS
created: 2025-01-01
---
# Todo Story (now done)`);

    // Wait for watcher to trigger
    await new Promise(resolve => setTimeout(resolve, 200));

    const stats = statusBar.getStats();
    assert.strictEqual(stats.done, 3, 'Should now have 3 done stories');
  });

  test('should format status bar text correctly', () => {
    const text = statusBar.getFormattedText();
    // Expected format: "██░░ 2/4" or similar progress bar
    assert.ok(text.includes('2/4') || text.includes('2 / 4'), 'Should show done/total count');
  });

  test('should show progress bar characters', () => {
    const text = statusBar.getFormattedText();
    // Should contain filled and empty bar characters
    assert.ok(text.includes('█') || text.includes('░'), 'Should contain progress bar characters');
  });
});

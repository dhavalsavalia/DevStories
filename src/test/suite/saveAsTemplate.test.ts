import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractTemplateContent, generateTemplateFileName } from '../../commands/saveAsTemplateUtils';

suite('SaveAsTemplate Command Integration Test', () => {
  test('should have saveAsTemplate command registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('devstories.saveAsTemplate'), 'saveAsTemplate command should be registered');
  });

  test('extractTemplateContent should extract content after frontmatter', () => {
    const fileContent = `---
id: STORY-001
title: "Test Story"
---

# Test Story

## Description
Some content here
`;
    const result = extractTemplateContent(fileContent);

    assert.ok(result.includes('## Description'), 'Should include Description section');
    assert.ok(result.includes('Some content here'), 'Should include body content');
    assert.ok(!result.includes('# Test Story'), 'Should not include title header');
    assert.ok(!result.includes('id: STORY-001'), 'Should not include frontmatter');
  });

  test('extractTemplateContent should handle story with checklist', () => {
    const fileContent = `---
id: STORY-002
title: "Feature Story"
type: feature
---

# Feature Story

## User Story
As a user, I need this feature.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes
Implementation details here.
`;
    const result = extractTemplateContent(fileContent);

    assert.ok(result.includes('## User Story'), 'Should include User Story section');
    assert.ok(result.includes('- [ ] Criterion 1'), 'Should include checklist');
    assert.ok(result.includes('## Technical Notes'), 'Should include Technical Notes');
  });

  test('generateTemplateFileName should convert to kebab-case', () => {
    assert.strictEqual(generateTemplateFileName('API Endpoint'), 'api-endpoint.md');
    assert.strictEqual(generateTemplateFileName('React Component'), 'react-component.md');
    assert.strictEqual(generateTemplateFileName('Bug Triage'), 'bug-triage.md');
  });

  test('generateTemplateFileName should handle special characters', () => {
    assert.strictEqual(generateTemplateFileName('My Template!'), 'my-template.md');
    assert.strictEqual(generateTemplateFileName('API v2 Endpoint'), 'api-v2-endpoint.md');
  });
});

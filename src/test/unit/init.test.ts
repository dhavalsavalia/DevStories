import { describe, expect, it } from 'vitest';
import { generateConfigYaml, detectProjectName, InitConfig } from '../../commands/initUtils';

describe('Init Command', () => {
  describe('generateConfigYaml', () => {
    it('should generate valid config yaml with defaults', () => {
      const config: InitConfig = {
        projectName: 'my-project',
        epicPrefix: 'EPIC',
        storyPrefix: 'DS',
        sprint: 'sprint-1',
      };

      const yaml = generateConfigYaml(config);

      expect(yaml).toContain('version: 1');
      expect(yaml).toContain('project: "my-project"');
      expect(yaml).toContain('epic: "EPIC"');
      expect(yaml).toContain('story: "DS"');
      expect(yaml).toContain('current: "sprint-1"');
      expect(yaml).toContain('id: todo');
      expect(yaml).toContain('id: in_progress');
      expect(yaml).toContain('id: review');
      expect(yaml).toContain('id: done');
      expect(yaml).toContain('sizes: ["XS", "S", "M", "L", "XL"]');
    });

    it('should handle custom prefixes', () => {
      const config: InitConfig = {
        projectName: 'acme-app',
        epicPrefix: 'EP',
        storyPrefix: 'US',
        sprint: 'iteration-1',
      };

      const yaml = generateConfigYaml(config);

      expect(yaml).toContain('epic: "EP"');
      expect(yaml).toContain('story: "US"');
      expect(yaml).toContain('current: "iteration-1"');
    });

    it('should escape quotes in project name', () => {
      const config: InitConfig = {
        projectName: 'my "quoted" project',
        epicPrefix: 'EPIC',
        storyPrefix: 'DS',
        sprint: 'sprint-1',
      };

      const yaml = generateConfigYaml(config);

      expect(yaml).toContain('project: "my \\"quoted\\" project"');
    });
  });

  describe('detectProjectName', () => {
    it('should detect from package.json', () => {
      const files = new Map([
        ['package.json', '{"name": "my-npm-package"}'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBe('my-npm-package');
    });

    it('should detect from Cargo.toml', () => {
      const files = new Map([
        ['Cargo.toml', '[package]\nname = "my-rust-crate"'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBe('my-rust-crate');
    });

    it('should detect from pyproject.toml', () => {
      const files = new Map([
        ['pyproject.toml', '[project]\nname = "my-python-pkg"'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBe('my-python-pkg');
    });

    it('should detect from go.mod', () => {
      const files = new Map([
        ['go.mod', 'module github.com/user/my-go-mod'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBe('my-go-mod');
    });

    it('should prefer package.json when multiple files exist', () => {
      const files = new Map([
        ['package.json', '{"name": "npm-pkg"}'],
        ['Cargo.toml', '[package]\nname = "rust-crate"'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBe('npm-pkg');
    });

    it('should return undefined when no project files found', () => {
      const files = new Map<string, string>();
      const name = detectProjectName(files);
      expect(name).toBeUndefined();
    });

    it('should return undefined for invalid package.json', () => {
      const files = new Map([
        ['package.json', 'invalid json'],
      ]);

      const name = detectProjectName(files);
      expect(name).toBeUndefined();
    });
  });
});

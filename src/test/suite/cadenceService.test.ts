import * as assert from 'assert';
import * as vscode from 'vscode';
import { CadenceService } from '../../core/cadenceService';
import { ConfigService } from '../../core/configService';

suite('CadenceService Integration Test', () => {
  test('should have cadence service importable', () => {
    // Verify the module can be imported
    assert.ok(CadenceService);
  });

  test('should create cadence service with config service', () => {
    const configService = new ConfigService();
    const cadenceService = new CadenceService(configService);
    assert.ok(cadenceService);
  });

  test('should return null ritual when disabled', async () => {
    const configService = new ConfigService();
    const cadenceService = new CadenceService(configService);

    // Before initialization, cadence is disabled by default
    const nextRitual = cadenceService.getNextRitual();
    assert.strictEqual(nextRitual, null);
  });

  test('should provide status bar text', () => {
    const configService = new ConfigService();
    const cadenceService = new CadenceService(configService);

    const text = cadenceService.getStatusBarText();
    // When disabled, should return empty string
    assert.strictEqual(text, '');
  });

  test('should support dispose', () => {
    const configService = new ConfigService();
    const cadenceService = new CadenceService(configService);

    // Should not throw
    cadenceService.dispose();
  });
});

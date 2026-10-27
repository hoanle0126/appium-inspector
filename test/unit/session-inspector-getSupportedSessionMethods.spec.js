import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import * as SessionInspectorActions from '../../app/common/renderer/actions/SessionInspector.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(() => Promise.resolve()),
  getSetting: vi.fn(() => Promise.resolve(null)),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: vi.fn().mockResolvedValue(null),
}));

describe('SessionInspector actions', function () {
  describe('#getSupportedSessionMethods', function () {
    let mockDispatch, mockGetState, mockRun;

    beforeEach(() => {
      mockDispatch = vi.fn();
      mockGetState = vi.fn(() => ({
        inspector: {
          driver: {},
        },
      }));
      mockRun = vi.fn();
      vi.spyOn(InspectorDriver, 'instance').mockReturnValue({
        run: mockRun,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retrieve supported commands and execute methods via executeDriverCommand', async function () {
      const mockCommands = {rest: {base: {'/status': {GET: {command: 'getStatus'}}}}};
      const mockExtensions = {rest: {driver: {'mobile: pressButton': {command: 'mobilePressButton'}}}};

      mockRun.mockImplementation(async ({methodName}) => {
        if (methodName === 'getAppiumCommands') {
          return {commandRes: mockCommands};
        }
        if (methodName === 'getAppiumExtensions') {
          return {commandRes: mockExtensions};
        }
        return {};
      });

      const action = SessionInspectorActions.getSupportedSessionMethods();
      const res = await action(mockDispatch, mockGetState);

      expect(mockGetState).toHaveBeenCalledTimes(2);
      expect(mockRun).toHaveBeenCalledWith({methodName: 'getAppiumCommands', skipRefresh: true});
      expect(mockRun).toHaveBeenCalledWith({methodName: 'getAppiumExtensions', skipRefresh: true});
      expect(res).toEqual({
        commands: mockCommands,
        executeMethods: mockExtensions,
      });
    });

    it('should fall back to empty arrays if driver commands throw', async function () {
      mockRun.mockRejectedValue(new Error('Unsupported command'));

      const action = SessionInspectorActions.getSupportedSessionMethods();
      const res = await action(mockDispatch, mockGetState);

      expect(res).toEqual({
        commands: [],
        executeMethods: [],
      });
    });
  });
});

/**
 * Integration Tests for Full Workflow
 * Tests complete workflows across all components with persistence and reload scenarios
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.5**
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get _store() {
      return store;
    }
  };
})();

global.localStorage = localStorageMock;

// Import components by loading the app.js file
await import('../../js/app.js');

// Components are exported on window object
let StorageManager, TaskList, QuickLinks, FocusTimer;

describe('Integration Tests - Full Workflow', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset DOM
    document.body.innerHTML = `
      <div id="storage-warning"></div>
      <div id="time-display"></div>
      <div id="date-display"></div>
      <div id="greeting-message"></div>
      
      <div id="timer-display">25:00</div>
      <button id="timer-start">Start</button>
      <button id="timer-stop">Stop</button>
      <button id="timer-reset">Reset</button>
      <div id="timer-notification"></div>
      
      <input id="task-input" />
      <button id="task-add-button">Add Task</button>
      <div id="task-list"></div>
      
      <input id="link-name-input" />
      <input id="link-url-input" />
      <button id="link-add-button">Add Link</button>
      <div id="links-container"></div>
      <div id="link-error-message"></div>
    `;

    // Get components from window
    StorageManager = window.StorageManager;
    TaskList = window.TaskList;
    QuickLinks = window.QuickLinks;
    FocusTimer = window.FocusTimer;

    // Reset component state
    if (TaskList) {
      TaskList.state = { tasks: [] };
    }
    if (QuickLinks) {
      QuickLinks.state = { links: [] };
    }
    if (FocusTimer) {
      FocusTimer.state = {
        remainingSeconds: 1500,
        isRunning: false,
        intervalId: null
      };
    }
  });

  afterEach(() => {
    // Clean up any running timers
    vi.useRealTimers();
  });

  describe('Task Workflow Integration', () => {
    test('complete task workflow: add, edit, complete, delete, persist, reload', () => {
      // Initialize TaskList
      TaskList.init();

      // Step 1: Add a task
      const initialTaskCount = TaskList.state.tasks.length;
      TaskList.addTask('Write integration tests');
      
      expect(TaskList.state.tasks.length).toBe(initialTaskCount + 1);
      const task = TaskList.state.tasks[0];
      expect(task.text).toBe('Write integration tests');
      expect(task.completed).toBe(false);
      expect(task.id).toMatch(/^task-\d+-[a-z0-9]+$/);

      // Verify persistence
      const savedData = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      expect(savedData).toHaveLength(1);
      expect(savedData[0].text).toBe('Write integration tests');

      // Step 2: Edit the task
      TaskList.editTask(task.id, 'Write comprehensive integration tests');
      
      expect(TaskList.state.tasks[0].text).toBe('Write comprehensive integration tests');
      expect(TaskList.state.tasks[0].id).toBe(task.id); // ID preserved
      
      // Verify edit persisted
      const savedAfterEdit = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      expect(savedAfterEdit[0].text).toBe('Write comprehensive integration tests');

      // Step 3: Mark task as complete
      TaskList.toggleComplete(task.id);
      
      expect(TaskList.state.tasks[0].completed).toBe(true);
      
      // Verify completion persisted
      const savedAfterComplete = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      expect(savedAfterComplete[0].completed).toBe(true);

      // Step 4: Reload from storage (simulate page reload)
      TaskList.state.tasks = [];
      TaskList.loadTasks();
      
      expect(TaskList.state.tasks.length).toBe(1);
      expect(TaskList.state.tasks[0].text).toBe('Write comprehensive integration tests');
      expect(TaskList.state.tasks[0].completed).toBe(true);
      expect(TaskList.state.tasks[0].id).toBe(task.id);

      // Step 5: Delete the task
      TaskList.deleteTask(task.id);
      
      expect(TaskList.state.tasks.length).toBe(0);
      
      // Verify deletion persisted
      const savedAfterDelete = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      expect(savedAfterDelete).toHaveLength(0);

      // Step 6: Reload after deletion
      TaskList.loadTasks();
      expect(TaskList.state.tasks.length).toBe(0);
    });

    test('multiple tasks maintain order through persist and reload', () => {
      TaskList.init();

      // Add multiple tasks with slight delays to ensure different timestamps
      TaskList.addTask('First task');
      TaskList.addTask('Second task');
      TaskList.addTask('Third task');

      expect(TaskList.state.tasks.length).toBe(3);

      // Get task IDs in order
      const firstId = TaskList.state.tasks[0].id;
      const secondId = TaskList.state.tasks[1].id;
      const thirdId = TaskList.state.tasks[2].id;

      // Reload from storage
      TaskList.state.tasks = [];
      TaskList.loadTasks();

      // Verify order is maintained (sorted by createdAt)
      expect(TaskList.state.tasks.length).toBe(3);
      expect(TaskList.state.tasks[0].id).toBe(firstId);
      expect(TaskList.state.tasks[1].id).toBe(secondId);
      expect(TaskList.state.tasks[2].id).toBe(thirdId);
    });
  });

  describe('Quick Links Workflow Integration', () => {
    test('complete link workflow: add, delete, persist, reload', () => {
      // Initialize QuickLinks
      QuickLinks.init();

      // Step 1: Add a link
      const initialLinkCount = QuickLinks.state.links.length;
      const success = QuickLinks.addLink('GitHub', 'https://github.com');
      
      expect(success).toBe(true);
      expect(QuickLinks.state.links.length).toBe(initialLinkCount + 1);
      
      const link = QuickLinks.state.links[0];
      expect(link.name).toBe('GitHub');
      expect(link.url).toBe('https://github.com');
      expect(link.id).toMatch(/^link-\d+-[a-z0-9]+$/);

      // Verify persistence
      const savedData = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('GitHub');
      expect(savedData[0].url).toBe('https://github.com');

      // Step 2: Add another link
      QuickLinks.addLink('Google', 'https://google.com');
      
      expect(QuickLinks.state.links.length).toBe(2);
      
      // Verify both links persisted
      const savedAfterSecond = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
      expect(savedAfterSecond).toHaveLength(2);

      // Step 3: Reload from storage (simulate page reload)
      QuickLinks.state.links = [];
      QuickLinks.loadLinks();
      
      expect(QuickLinks.state.links.length).toBe(2);
      expect(QuickLinks.state.links[0].name).toBe('GitHub');
      expect(QuickLinks.state.links[1].name).toBe('Google');

      // Step 4: Delete first link
      const firstLinkId = QuickLinks.state.links[0].id;
      QuickLinks.deleteLink(firstLinkId);
      
      expect(QuickLinks.state.links.length).toBe(1);
      expect(QuickLinks.state.links[0].name).toBe('Google');
      
      // Verify deletion persisted
      const savedAfterDelete = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
      expect(savedAfterDelete).toHaveLength(1);
      expect(savedAfterDelete[0].name).toBe('Google');

      // Step 5: Reload after deletion
      QuickLinks.loadLinks();
      expect(QuickLinks.state.links.length).toBe(1);
      expect(QuickLinks.state.links[0].name).toBe('Google');
    });

    test('invalid URL validation prevents adding and shows error', () => {
      QuickLinks.init();

      // Try to add link without protocol
      const success1 = QuickLinks.addLink('Invalid', 'github.com');
      expect(success1).toBe(false);
      expect(QuickLinks.state.links.length).toBe(0);

      // Try to add link with ftp protocol
      const success2 = QuickLinks.addLink('FTP', 'ftp://example.com');
      expect(success2).toBe(false);
      expect(QuickLinks.state.links.length).toBe(0);

      // Add valid link
      const success3 = QuickLinks.addLink('Valid', 'https://example.com');
      expect(success3).toBe(true);
      expect(QuickLinks.state.links.length).toBe(1);
    });
  });

  describe('Timer Workflow Integration', () => {
    test('complete timer workflow: start, stop, reset, completion', () => {
      // Use fake timers for testing
      vi.useFakeTimers();

      // Initialize FocusTimer
      FocusTimer.init();

      // Step 1: Initial state
      expect(FocusTimer.state.remainingSeconds).toBe(1500);
      expect(FocusTimer.state.isRunning).toBe(false);

      // Step 2: Start timer
      FocusTimer.start();
      expect(FocusTimer.state.isRunning).toBe(true);
      expect(FocusTimer.state.intervalId).not.toBeNull();

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      expect(FocusTimer.state.remainingSeconds).toBe(1495);

      // Step 3: Stop timer
      FocusTimer.stop();
      expect(FocusTimer.state.isRunning).toBe(false);
      expect(FocusTimer.state.remainingSeconds).toBe(1495); // Time preserved

      // Advance time - should not change since stopped
      vi.advanceTimersByTime(3000);
      expect(FocusTimer.state.remainingSeconds).toBe(1495);

      // Step 4: Resume timer
      FocusTimer.start();
      expect(FocusTimer.state.isRunning).toBe(true);

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);
      expect(FocusTimer.state.remainingSeconds).toBe(1485);

      // Step 5: Reset timer
      FocusTimer.reset();
      expect(FocusTimer.state.remainingSeconds).toBe(1500);
      expect(FocusTimer.state.isRunning).toBe(false);

      // Step 6: Test completion
      FocusTimer.state.remainingSeconds = 3;
      FocusTimer.start();

      // Advance to completion
      vi.advanceTimersByTime(3000);
      expect(FocusTimer.state.remainingSeconds).toBe(0);
      expect(FocusTimer.state.isRunning).toBe(false);

      // Check notification
      const notification = document.getElementById('timer-notification');
      expect(notification.textContent).toBe('Focus session complete! Time for a break.');

      vi.useRealTimers();
    });

    test('timer prevents negative values', () => {
      vi.useFakeTimers();

      FocusTimer.init();
      FocusTimer.state.remainingSeconds = 1;
      FocusTimer.start();

      // Advance past zero
      vi.advanceTimersByTime(5000);

      // Should stop at 0, not go negative
      expect(FocusTimer.state.remainingSeconds).toBe(0);
      expect(FocusTimer.state.isRunning).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Storage Unavailable Scenario', () => {
    test('warning displayed when storage unavailable, in-memory state works', () => {
      // Mock localStorage to throw SecurityError
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      
      localStorage.setItem = () => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      };
      localStorage.getItem = () => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      };

      // Check storage availability
      const isAvailable = StorageManager.isAvailable();
      expect(isAvailable).toBe(false);

      // Show warning
      StorageManager.showWarning();
      
      // Verify warning is displayed
      const warning = document.getElementById('storage-warning');
      expect(warning).not.toBeNull();
      expect(warning.textContent).toContain('Local Storage is not available');

      // Test that TaskList still works with in-memory state
      TaskList.init();
      TaskList.addTask('In-memory task');
      
      expect(TaskList.state.tasks.length).toBe(1);
      expect(TaskList.state.tasks[0].text).toBe('In-memory task');

      // Edit task in memory
      const taskId = TaskList.state.tasks[0].id;
      TaskList.editTask(taskId, 'Updated in-memory task');
      expect(TaskList.state.tasks[0].text).toBe('Updated in-memory task');

      // Delete task in memory
      TaskList.deleteTask(taskId);
      expect(TaskList.state.tasks.length).toBe(0);

      // Test that QuickLinks still works with in-memory state
      QuickLinks.init();
      QuickLinks.addLink('Memory Link', 'https://example.com');
      
      expect(QuickLinks.state.links.length).toBe(1);
      expect(QuickLinks.state.links[0].name).toBe('Memory Link');

      // Delete link in memory
      const linkId = QuickLinks.state.links[0].id;
      QuickLinks.deleteLink(linkId);
      expect(QuickLinks.state.links.length).toBe(0);

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
    });

    test('warning can be dismissed', () => {
      // Show warning
      StorageManager.showWarning();
      
      let warning = document.getElementById('storage-warning');
      expect(warning).not.toBeNull();

      // Click dismiss button
      const dismissButton = warning.querySelector('.storage-warning-dismiss');
      expect(dismissButton).not.toBeNull();
      dismissButton.click();

      // Warning should be removed
      warning = document.getElementById('storage-warning');
      expect(warning).toBeNull();
    });

    test('warning not duplicated if shown multiple times', () => {
      // Show warning twice
      StorageManager.showWarning();
      StorageManager.showWarning();

      // Should only have one warning
      const warnings = document.querySelectorAll('#storage-warning');
      expect(warnings.length).toBe(1);
    });
  });

  describe('Cross-Component Integration', () => {
    test('tasks and links persist independently', () => {
      // Initialize both components
      TaskList.init();
      QuickLinks.init();

      // Add task
      TaskList.addTask('Test task');
      expect(TaskList.state.tasks.length).toBe(1);

      // Add link
      QuickLinks.addLink('Test Link', 'https://test.com');
      expect(QuickLinks.state.links.length).toBe(1);

      // Verify both persisted to different keys
      const taskData = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      const linkData = JSON.parse(localStorage.getItem('productivity-dashboard-links'));

      expect(taskData).toHaveLength(1);
      expect(linkData).toHaveLength(1);
      expect(taskData[0].text).toBe('Test task');
      expect(linkData[0].name).toBe('Test Link');

      // Reload both
      TaskList.state.tasks = [];
      QuickLinks.state.links = [];
      
      TaskList.loadTasks();
      QuickLinks.loadLinks();

      expect(TaskList.state.tasks.length).toBe(1);
      expect(QuickLinks.state.links.length).toBe(1);
    });

    test('deleting tasks does not affect links', () => {
      TaskList.init();
      QuickLinks.init();

      // Add data to both
      TaskList.addTask('Task 1');
      TaskList.addTask('Task 2');
      QuickLinks.addLink('Link 1', 'https://link1.com');
      QuickLinks.addLink('Link 2', 'https://link2.com');

      expect(TaskList.state.tasks.length).toBe(2);
      expect(QuickLinks.state.links.length).toBe(2);

      // Delete all tasks
      const taskIds = TaskList.state.tasks.map(t => t.id);
      taskIds.forEach(id => TaskList.deleteTask(id));

      expect(TaskList.state.tasks.length).toBe(0);
      expect(QuickLinks.state.links.length).toBe(2); // Links unaffected

      // Verify in storage
      const taskData = JSON.parse(localStorage.getItem('productivity-dashboard-tasks'));
      const linkData = JSON.parse(localStorage.getItem('productivity-dashboard-links'));

      expect(taskData).toHaveLength(0);
      expect(linkData).toHaveLength(2);
    });
  });
});

/**
 * Test setup file for Vitest
 * Configures jsdom environment and mocks for browser APIs
 */

// Mock localStorage for testing
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
    }
  };
})();

global.localStorage = localStorageMock;

// Mock DOM elements that TaskList needs
beforeEach(() => {
  localStorage.clear();
  
  // Create minimal DOM structure for TaskList
  document.body.innerHTML = `
    <div id="task-list"></div>
    <input id="task-input" />
    <button id="task-add-button"></button>
  `;
});

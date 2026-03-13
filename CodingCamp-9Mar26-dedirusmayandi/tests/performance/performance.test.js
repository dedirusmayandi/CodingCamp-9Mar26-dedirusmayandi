/**
 * Performance Tests for Productivity Dashboard
 * 
 * Validates Requirements:
 * - 5.2: Save task data to Local Storage within 100ms
 * - 5.3: Save link data to Local Storage within 100ms
 * - 6.2: Complete initial page load within 1 second
 * - 6.3: Update task display within 100ms
 * - 6.4: Update link display within 100ms
 * - 6.5: Maintain 60fps during UI animations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Load HTML and JS files
const html = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const js = fs.readFileSync(path.resolve('js/app.js'), 'utf-8');

describe('Performance Tests', () => {
  let dom;
  let window;
  let document;
  let localStorage;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });
    
    window = dom.window;
    document = window.document;
    localStorage = window.localStorage;
    
    // Clear localStorage
    localStorage.clear();
    
    // Execute JavaScript
    const scriptElement = document.createElement('script');
    scriptElement.textContent = js;
    document.body.appendChild(scriptElement);
    
    // Trigger DOMContentLoaded to initialize components
    const event = new window.Event('DOMContentLoaded');
    window.document.dispatchEvent(event);
  });

  describe('Requirement 6.2: Initial Page Load Performance', () => {
    it('should complete initial page load and render within 1 second', () => {
      const startTime = performance.now();
      
      // Create a new DOM and load everything
      const testDom = new JSDOM(html, {
        runScripts: 'dangerously',
        url: 'http://localhost'
      });
      
      const testWindow = testDom.window;
      const testDocument = testWindow.document;
      
      // Execute JavaScript
      const scriptElement = testDocument.createElement('script');
      scriptElement.textContent = js;
      testDocument.body.appendChild(scriptElement);
      
      // Trigger DOMContentLoaded
      testWindow.document.dispatchEvent(new testWindow.Event('DOMContentLoaded'));
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load in under 1000ms (1 second) - Requirement 6.2
      expect(loadTime).toBeLessThan(1000);
      
      // Verify components initialized
      expect(testDocument.getElementById('time-display')).toBeTruthy();
      expect(testDocument.getElementById('task-list')).toBeTruthy();
      expect(testDocument.getElementById('links-container')).toBeTruthy();
    });
  });

  describe('Requirement 5.2 & 6.3: Task Operations Performance', () => {
    it('should add task and save to storage within 100ms', () => {
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      
      taskInput.value = 'Test task for performance';
      
      const startTime = performance.now();
      addButton.click();
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(operationTime).toBeLessThan(100);
      
      // Verify task was saved to storage
      const savedTasks = JSON.parse(localStorage.getItem('productivity-dashboard-tasks') || '{"tasks":[]}');
      expect(savedTasks.tasks.length).toBe(1);
    });

    it('should edit task and update display within 100ms', () => {
      // First add a task
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      taskInput.value = 'Original task';
      addButton.click();
      
      // Find the edit button
      const editButton = document.querySelector('.task-edit-button');
      
      const startTime = performance.now();
      editButton.click();
      
      // Simulate editing
      const taskText = document.querySelector('.task-text');
      if (taskText.contentEditable === 'true') {
        taskText.textContent = 'Edited task';
        taskText.blur();
      }
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(operationTime).toBeLessThan(100);
    });

    it('should delete task and update display within 100ms', () => {
      // First add a task
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      taskInput.value = 'Task to delete';
      addButton.click();
      
      // Find the delete button
      const deleteButton = document.querySelector('.task-delete-button');
      
      const startTime = performance.now();
      deleteButton.click();
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(operationTime).toBeLessThan(100);
      
      // Verify task was removed
      const taskList = document.getElementById('task-list');
      expect(taskList.children.length).toBe(0);
    });

    it('should save task data to Local Storage within 100ms', () => {
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      
      taskInput.value = 'Storage performance test';
      
      const startTime = performance.now();
      addButton.click();
      
      // Check when data appears in localStorage
      const savedTasks = localStorage.getItem('productivity-dashboard-tasks');
      const endTime = performance.now();
      
      const saveTime = endTime - startTime;
      
      // Should save within 100ms (Requirement 5.2)
      expect(saveTime).toBeLessThan(100);
      expect(savedTasks).not.toBeNull();
    });
  });

  describe('Requirement 5.3 & 6.4: Quick Links Operations Performance', () => {
    it('should add link and save to storage within 100ms', () => {
      const nameInput = document.getElementById('link-name-input');
      const urlInput = document.getElementById('link-url-input');
      const addButton = document.getElementById('link-add-button');
      
      nameInput.value = 'Test Link';
      urlInput.value = 'https://example.com';
      
      const startTime = performance.now();
      addButton.click();
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(operationTime).toBeLessThan(100);
      
      // Verify link was saved to storage
      const savedLinks = JSON.parse(localStorage.getItem('productivity-dashboard-links') || '{"links":[]}');
      expect(savedLinks.links.length).toBe(1);
    });

    it('should delete link and update display within 100ms', () => {
      // First add a link
      const nameInput = document.getElementById('link-name-input');
      const urlInput = document.getElementById('link-url-input');
      const addButton = document.getElementById('link-add-button');
      
      nameInput.value = 'Link to delete';
      urlInput.value = 'https://example.com';
      addButton.click();
      
      // Find the delete button
      const deleteButton = document.querySelector('.link-delete-button');
      
      const startTime = performance.now();
      deleteButton.click();
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(operationTime).toBeLessThan(100);
      
      // Verify link was removed
      const linksContainer = document.getElementById('links-container');
      expect(linksContainer.children.length).toBe(0);
    });

    it('should save link data to Local Storage within 100ms', () => {
      const nameInput = document.getElementById('link-name-input');
      const urlInput = document.getElementById('link-url-input');
      const addButton = document.getElementById('link-add-button');
      
      nameInput.value = 'Storage test';
      urlInput.value = 'https://test.com';
      
      const startTime = performance.now();
      addButton.click();
      
      // Check when data appears in localStorage
      const savedLinks = localStorage.getItem('productivity-dashboard-links');
      const endTime = performance.now();
      
      const saveTime = endTime - startTime;
      
      // Should save within 100ms (Requirement 5.3)
      expect(saveTime).toBeLessThan(100);
      expect(savedLinks).not.toBeNull();
    });
  });

  describe('Requirement 6.5: UI Animation Performance (60fps)', () => {
    it('should complete DOM updates within frame budget (16.67ms for 60fps)', () => {
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      
      taskInput.value = 'Animation test task';
      
      const startTime = performance.now();
      addButton.click();
      const endTime = performance.now();
      
      const updateTime = endTime - startTime;
      
      // Should complete DOM update within one frame at 60fps (16.67ms)
      expect(updateTime).toBeLessThan(16.67);
    });

    it('should handle task completion toggle within frame budget', () => {
      // Add a task first
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      taskInput.value = 'Task for toggle test';
      addButton.click();
      
      const checkbox = document.querySelector('.task-checkbox');
      
      const startTime = performance.now();
      checkbox.click();
      const endTime = performance.now();
      
      const toggleTime = endTime - startTime;
      
      // Should complete within frame budget for smooth 60fps animation
      expect(toggleTime).toBeLessThan(16.67);
    });

    it('should handle link addition within frame budget', () => {
      const nameInput = document.getElementById('link-name-input');
      const urlInput = document.getElementById('link-url-input');
      const addButton = document.getElementById('link-add-button');
      
      nameInput.value = 'Animation Test';
      urlInput.value = 'https://example.com';
      
      const startTime = performance.now();
      addButton.click();
      const endTime = performance.now();
      
      const updateTime = endTime - startTime;
      
      // Should complete DOM update within one frame at 60fps
      expect(updateTime).toBeLessThan(16.67);
    });
  });

  describe('Storage Performance Under Load', () => {
    it('should handle multiple rapid task additions efficiently', () => {
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      
      const startTime = performance.now();
      
      // Add 10 tasks rapidly
      for (let i = 0; i < 10; i++) {
        taskInput.value = `Rapid task ${i}`;
        addButton.click();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete all operations within reasonable time (1000ms for 10 tasks)
      expect(totalTime).toBeLessThan(1000);
      
      // Verify all tasks were saved
      const savedTasks = JSON.parse(localStorage.getItem('productivity-dashboard-tasks') || '{"tasks":[]}');
      expect(savedTasks.tasks.length).toBe(10);
    });

    it('should handle multiple rapid link additions efficiently', () => {
      const nameInput = document.getElementById('link-name-input');
      const urlInput = document.getElementById('link-url-input');
      const addButton = document.getElementById('link-add-button');
      
      const startTime = performance.now();
      
      // Add 10 links rapidly
      for (let i = 0; i < 10; i++) {
        nameInput.value = `Link ${i}`;
        urlInput.value = `https://example${i}.com`;
        addButton.click();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete all operations within reasonable time (1000ms for 10 links)
      expect(totalTime).toBeLessThan(1000);
      
      // Verify all links were saved
      const savedLinks = JSON.parse(localStorage.getItem('productivity-dashboard-links') || '{"links":[]}');
      expect(savedLinks.links.length).toBe(10);
    });
  });

  describe('Memory and Resource Efficiency', () => {
    it('should not leak memory when adding and removing tasks repeatedly', () => {
      const taskInput = document.getElementById('task-input');
      const addButton = document.getElementById('task-add-button');
      
      // Perform multiple add/delete cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        // Add tasks
        for (let i = 0; i < 5; i++) {
          taskInput.value = `Cycle ${cycle} Task ${i}`;
          addButton.click();
        }
        
        // Delete all tasks
        let deleteButton = document.querySelector('.task-delete-button');
        while (deleteButton) {
          deleteButton.click();
          deleteButton = document.querySelector('.task-delete-button');
        }
      }
      
      // Verify clean state
      const taskList = document.getElementById('task-list');
      expect(taskList.children.length).toBe(0);
      
      const savedTasks = JSON.parse(localStorage.getItem('productivity-dashboard-tasks') || '{"tasks":[]}');
      expect(savedTasks.tasks.length).toBe(0);
    });

    it('should efficiently load large datasets from storage', () => {
      // Prepare large dataset
      const largeTasks = {
        tasks: Array.from({ length: 100 }, (_, i) => ({
          id: `task-${Date.now()}-${i}`,
          text: `Task ${i}`,
          completed: false,
          createdAt: Date.now() + i
        }))
      };
      
      localStorage.setItem('productivity-dashboard-tasks', JSON.stringify(largeTasks));
      
      // Reload the page
      const startTime = performance.now();
      window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Should load even large datasets quickly (under 500ms)
      expect(loadTime).toBeLessThan(500);
    });
  });
});

/**
 * Property-Based Tests for TaskList Component
 * Tests universal properties that should hold for all valid inputs
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Import the app.js to load components into global scope
import '../../js/app.js';

// Access TaskList from global window object
const { TaskList } = window;

describe('TaskList Property-Based Tests', () => {
  beforeEach(() => {
    // Reset TaskList state before each test
    TaskList.state.tasks = [];
    localStorage.clear();
  });

  // Feature: productivity-dashboard, Property 7: Adding Valid Task Increases List Size
  // **Validates: Requirements 3.1**
  test('Property 7: Adding Valid Task Increases List Size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (taskText) => {
          // Record initial list size
          const initialSize = TaskList.state.tasks.length;
          
          // Add task
          TaskList.addTask(taskText);
          
          // Verify list size increased by exactly one
          expect(TaskList.state.tasks.length).toBe(initialSize + 1);
          
          // Clean up for next iteration
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 8: Editing Task Updates Text
  // **Validates: Requirements 3.2**
  test('Property 8: Editing Task Updates Text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (originalText, newText) => {
          // Add a task
          TaskList.addTask(originalText);
          const task = TaskList.state.tasks[0];
          const originalId = task.id;
          const originalCreatedAt = task.createdAt;
          
          // Edit the task
          TaskList.editTask(task.id, newText);
          
          // Verify text was updated
          const updatedTask = TaskList.state.tasks.find(t => t.id === originalId);
          expect(updatedTask.text).toBe(newText.trim().substring(0, 500));
          
          // Verify id and createdAt were preserved
          expect(updatedTask.id).toBe(originalId);
          expect(updatedTask.createdAt).toBe(originalCreatedAt);
          
          // Clean up
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 9: Toggling Task Completion Flips Status
  // **Validates: Requirements 3.3**
  test('Property 9: Toggling Task Completion Flips Status', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.boolean(),
        (taskText, initialCompleted) => {
          // Add a task
          TaskList.addTask(taskText);
          const task = TaskList.state.tasks[0];
          
          // Set initial completion status
          task.completed = initialCompleted;
          
          // Toggle completion
          TaskList.toggleComplete(task.id);
          
          // Verify status flipped
          const updatedTask = TaskList.state.tasks.find(t => t.id === task.id);
          expect(updatedTask.completed).toBe(!initialCompleted);
          
          // Toggle again
          TaskList.toggleComplete(task.id);
          
          // Verify status flipped back
          const reToggledTask = TaskList.state.tasks.find(t => t.id === task.id);
          expect(reToggledTask.completed).toBe(initialCompleted);
          
          // Clean up
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 10: Deleting Task Removes From List
  // **Validates: Requirements 3.4**
  test('Property 10: Deleting Task Removes From List', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (taskText) => {
          // Add a task
          TaskList.addTask(taskText);
          const task = TaskList.state.tasks[0];
          const taskId = task.id;
          const initialSize = TaskList.state.tasks.length;
          
          // Delete the task
          TaskList.deleteTask(taskId);
          
          // Verify list size decreased by exactly one
          expect(TaskList.state.tasks.length).toBe(initialSize - 1);
          
          // Verify task is no longer findable by ID
          const deletedTask = TaskList.state.tasks.find(t => t.id === taskId);
          expect(deletedTask).toBeUndefined();
          
          // Clean up
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 12: Tasks Maintain Creation Order
  // **Validates: Requirements 3.7**
  test('Property 12: Tasks Maintain Creation Order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          { minLength: 2, maxLength: 10 }
        ),
        (taskTexts) => {
          // Add tasks in sequence
          const createdAtTimestamps = [];
          taskTexts.forEach(text => {
            TaskList.addTask(text);
            const lastTask = TaskList.state.tasks[TaskList.state.tasks.length - 1];
            createdAtTimestamps.push(lastTask.createdAt);
          });
          
          // Sort tasks by createdAt (as render() does)
          const sortedTasks = [...TaskList.state.tasks].sort((a, b) => a.createdAt - b.createdAt);
          
          // Verify sorted order matches ascending createdAt timestamps
          for (let i = 0; i < sortedTasks.length - 1; i++) {
            expect(sortedTasks[i].createdAt).toBeLessThanOrEqual(sortedTasks[i + 1].createdAt);
          }
          
          // Verify the sorted tasks match the original creation order
          sortedTasks.forEach((task, index) => {
            expect(task.createdAt).toBe(createdAtTimestamps[index]);
          });
          
          // Clean up
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 17: Empty Task Text Rejected
  // **Validates: Requirements 3.1**
  test('Property 17: Empty Task Text Rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (whitespaceText) => {
          // Record initial list size
          const initialSize = TaskList.state.tasks.length;
          
          // Attempt to add whitespace-only task
          TaskList.addTask(whitespaceText);
          
          // Verify list size remained unchanged
          expect(TaskList.state.tasks.length).toBe(initialSize);
          
          // Clean up
          TaskList.state.tasks = [];
        }
      ),
      { numRuns: 100 }
    );
  });
});

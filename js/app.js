/**
 * Productivity Dashboard - Main Application
 * A client-side productivity tool with greeting display, focus timer, task management, and quick links
 */

// ============================================================================
// StorageManager Component
// ============================================================================

/**
 * StorageManager abstracts Local Storage operations with comprehensive error handling.
 * Handles QuotaExceededError and SecurityError exceptions gracefully.
 */
const StorageManager = {
  /**
   * Tests if Local Storage is accessible
   * @returns {boolean} True if Local Storage is available and functional
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (error) {
      // Catches SecurityError (storage disabled) or any other access errors
      return false;
    }
  },

  /**
   * Serializes and saves data to Local Storage
   * @param {string} key - Storage key
   * @param {any} data - Data to serialize and save
   * @returns {boolean} True if save was successful, false otherwise
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle QuotaExceededError (storage full) and SecurityError (storage disabled)
      if (error.name === 'QuotaExceededError') {
        console.error('Local Storage quota exceeded:', error);
      } else if (error.name === 'SecurityError') {
        console.error('Local Storage access denied:', error);
      } else {
        console.error('Failed to save to Local Storage:', error);
      }
      return false;
    }
  },

  /**
   * Retrieves and deserializes data from Local Storage
   * @param {string} key - Storage key
   * @returns {any|null} Deserialized data or null on error
   */
  load(key) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized);
    } catch (error) {
      // Handle JSON parsing errors or SecurityError
      console.error('Failed to load from Local Storage:', error);
      return null;
    }
  },

  /**
   * Removes an item from Local Storage
   * @param {string} key - Storage key to remove
   * @returns {boolean} True if removal was successful, false otherwise
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from Local Storage:', error);
      return false;
    }
  },

  /**
   * Displays a warning message to the user when storage is unavailable
   * Creates and shows a dismissible warning banner at the top of the page
   */
  showWarning() {
    // Check if warning already exists
    if (document.getElementById('storage-warning')) {
      return;
    }

    // Create warning element
    const warning = document.createElement('div');
    warning.id = 'storage-warning';
    warning.className = 'storage-warning';
    warning.innerHTML = `
      <div class="storage-warning-content">
        <strong>Warning:</strong> Local Storage is not available. Your data will not be saved across sessions.
        <button class="storage-warning-dismiss" aria-label="Dismiss warning">×</button>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertBefore(warning, document.body.firstChild);

    // Add dismiss functionality
    const dismissButton = warning.querySelector('.storage-warning-dismiss');
    dismissButton.addEventListener('click', () => {
      warning.remove();
    });
  }
};

// ============================================================================
// GreetingDisplay Component
// ============================================================================

/**
 * GreetingDisplay manages the dynamic greeting, time, and date display.
 * Updates every second to show current time and appropriate greeting message.
 */
const GreetingDisplay = {
  /**
   * Interval ID for the update timer
   * @type {number|null}
   */
  intervalId: null,

  /**
   * Initializes the GreetingDisplay component
   * Performs initial display update and starts the update interval
   */
  init() {
    // Update display immediately
    this.updateDisplay();

    // Set up interval to update every second
    this.intervalId = setInterval(() => {
      this.updateDisplay();
    }, 1000);
  },

  /**
   * Returns appropriate greeting based on the hour of day
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} Greeting message
   */
  getGreeting(hour) {
    // Morning: 5:00 AM to 11:59 AM (hours 5-11)
    if (hour >= 5 && hour <= 11) {
      return 'Good morning';
    }
    // Afternoon: 12:00 PM to 4:59 PM (hours 12-16)
    if (hour >= 12 && hour <= 16) {
      return 'Good afternoon';
    }
    // Evening: 5:00 PM to 4:59 AM (hours 17-23 and 0-4)
    return 'Good evening';
  },

  /**
   * Formats time in 12-hour format with AM/PM
   * @param {Date} date - Date object to format
   * @returns {string} Formatted time string (e.g., "3:45:12 PM")
   */
  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // 0 should be 12

    // Pad minutes and seconds with leading zeros
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    return `${hours}:${minutesStr}:${secondsStr} ${ampm}`;
  },

  /**
   * Formats date in readable format
   * @param {Date} date - Date object to format
   * @returns {string} Formatted date string (e.g., "Monday, January 15, 2024")
   */
  formatDate(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
  },

  /**
   * Updates the display with current time, date, and greeting
   * Reads current system time and updates all DOM elements
   */
  updateDisplay() {
    const now = new Date();

    // Get DOM elements
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const greetingMessage = document.getElementById('greeting-message');

    // Update time display
    if (timeDisplay) {
      timeDisplay.textContent = this.formatTime(now);
    }

    // Update date display
    if (dateDisplay) {
      dateDisplay.textContent = this.formatDate(now);
    }

    // Update greeting message
    if (greetingMessage) {
      const hour = now.getHours();
      greetingMessage.textContent = this.getGreeting(hour);
    }
  }
};

// ============================================================================
// FocusTimer Component
// ============================================================================

/**
 * FocusTimer manages a 25-minute countdown timer for focused work sessions.
 * Provides start, stop, and reset controls with visual feedback and notifications.
 */
const FocusTimer = {
  /**
   * Timer duration constant (25 minutes in seconds)
   * @type {number}
   */
  TIMER_DURATION: 1500,

  /**
   * Component state
   * @type {Object}
   */
  state: {
    remainingSeconds: 1500,
    isRunning: false,
    intervalId: null
  },

  /**
   * Initializes the FocusTimer component
   * Sets up event listeners for timer control buttons
   */
  init() {
    // Get button elements
    const startButton = document.getElementById('timer-start');
    const stopButton = document.getElementById('timer-stop');
    const resetButton = document.getElementById('timer-reset');

    // Set up event listeners
    if (startButton) {
      startButton.addEventListener('click', () => this.start());
    }

    if (stopButton) {
      stopButton.addEventListener('click', () => this.stop());
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => this.reset());
    }

    // Initial display update
    this.updateDisplay();
  },

  /**
   * Starts the countdown timer
   * Sets isRunning to true and begins decrementing every second
   */
  start() {
    // Prevent multiple intervals from running
    if (this.state.isRunning) {
      return;
    }

    // Don't start if timer is at zero
    if (this.state.remainingSeconds <= 0) {
      return;
    }

    this.state.isRunning = true;

    // Start interval to tick every second
    this.state.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.updateDisplay();
  },

  /**
   * Stops (pauses) the countdown timer
   * Sets isRunning to false and clears the interval
   */
  stop() {
    if (!this.state.isRunning) {
      return;
    }

    this.state.isRunning = false;

    // Clear the interval
    if (this.state.intervalId !== null) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }

    this.updateDisplay();
  },

  /**
   * Resets the timer to initial duration (1500 seconds)
   * Stops the timer if running and clears any notifications
   */
  reset() {
    // Stop the timer if running
    if (this.state.isRunning) {
      this.stop();
    }

    // Reset to initial duration
    this.state.remainingSeconds = this.TIMER_DURATION;

    // Clear notification
    const notification = document.getElementById('timer-notification');
    if (notification) {
      notification.textContent = '';
      notification.style.display = 'none';
    }

    this.updateDisplay();
  },

  /**
   * Decrements remainingSeconds by 1 and checks for completion
   * Stops timer and shows notification when reaching zero
   */
  tick() {
    // Decrement remaining seconds
    this.state.remainingSeconds--;

    // Prevent negative values
    if (this.state.remainingSeconds < 0) {
      this.state.remainingSeconds = 0;
    }

    // Update display
    this.updateDisplay();

    // Check if timer reached zero
    if (this.state.remainingSeconds === 0) {
      this.stop();
      this.showNotification();
    }
  },

  /**
   * Formats seconds into MM:SS format
   * @param {number} seconds - Total seconds to format
   * @returns {string} Formatted time string (e.g., "25:00", "03:45")
   */
  formatTime(seconds) {
    // Ensure non-negative
    const totalSeconds = Math.max(0, seconds);

    // Calculate minutes and seconds
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    // Pad with leading zeros
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
  },

  /**
   * Displays completion notification when timer reaches zero
   * Shows message in the notification container
   */
  showNotification() {
    const notification = document.getElementById('timer-notification');
    if (notification) {
      notification.textContent = 'Focus session complete! Time for a break.';
      notification.style.display = 'block';
    }
  },

  /**
   * Updates the timer display with current remaining time
   * Renders the formatted time to the DOM
   */
  updateDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = this.formatTime(this.state.remainingSeconds);
    }
  }
};

// ============================================================================
// TaskList Component
// ============================================================================

/**
 * TaskList manages task creation, editing, completion, and deletion with persistence.
 * All tasks are stored in Local Storage and loaded on initialization.
 */
const TaskList = {
  /**
   * Storage key for tasks
   * @type {string}
   */
  STORAGE_KEY: 'productivity-dashboard-tasks',

  /**
   * Component state
   * @type {Object}
   */
  state: {
    tasks: []
  },

  /**
   * Initializes the TaskList component
   * Loads tasks from storage and sets up event listeners
   */
  init() {
    // Load tasks from storage
    this.loadTasks();

    // Get DOM elements
    const addButton = document.getElementById('task-add-button');
    const taskInput = document.getElementById('task-input');

    // Set up event listener for add button
    if (addButton) {
      addButton.addEventListener('click', () => {
        const text = taskInput ? taskInput.value : '';
        this.addTask(text);
        // Clear input after adding
        if (taskInput) {
          taskInput.value = '';
        }
      });
    }

    // Set up event listener for Enter key in input
    if (taskInput) {
      taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          const text = taskInput.value;
          this.addTask(text);
          taskInput.value = '';
        }
      });
    }

    // Initial render
    this.render();
  },

  /**
   * Creates a new task and adds it to the list
   * @param {string} text - Task description text
   */
  addTask(text) {
    // Trim whitespace
    const trimmedText = text.trim();

    // Validate non-empty
    if (trimmedText === '') {
      return;
    }

    // Truncate to 500 characters maximum
    const finalText = trimmedText.substring(0, 500);

    // Generate unique ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const id = `task-${timestamp}-${random}`;

    // Create task object
    const task = {
      id: id,
      text: finalText,
      completed: false,
      createdAt: timestamp
    };

    // Add to state
    this.state.tasks.push(task);

    // Persist and render
    this.saveTasks();
    this.render();
  },

  /**
   * Updates the text of an existing task
   * @param {string} id - Task ID
   * @param {string} newText - New task description text
   */
  editTask(id, newText) {
    // Trim whitespace
    const trimmedText = newText.trim();

    // Validate non-empty
    if (trimmedText === '') {
      return;
    }

    // Truncate to 500 characters maximum
    const finalText = trimmedText.substring(0, 500);

    // Find task by ID
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) {
      return;
    }

    // Update text
    task.text = finalText;

    // Persist and render
    this.saveTasks();
    this.render();
  },

  /**
   * Toggles the completion status of a task
   * @param {string} id - Task ID
   */
  toggleComplete(id) {
    // Find task by ID
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) {
      return;
    }

    // Flip completed status
    task.completed = !task.completed;

    // Persist and render
    this.saveTasks();
    this.render();
  },

  /**
   * Removes a task from the list
   * @param {string} id - Task ID
   */
  deleteTask(id) {
    // Filter out the task with matching ID
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);

    // Persist and render
    this.saveTasks();
    this.render();
  },

  /**
   * Renders all tasks to the DOM
   * Sorts tasks by creation time before rendering
   */
  render() {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
      return;
    }

    // Sort tasks by createdAt (ascending - oldest first)
    const sortedTasks = [...this.state.tasks].sort((a, b) => a.createdAt - b.createdAt);

    // Clear existing content
    taskList.innerHTML = '';

    // Render each task
    sortedTasks.forEach(task => {
      // Create task item container
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      if (task.completed) {
        taskItem.classList.add('completed');
      }

      // Create checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        this.toggleComplete(task.id);
      });

      // Create text span
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'task-edit-button';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null) {
          this.editTask(task.id, newText);
        }
      });

      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        this.deleteTask(task.id);
      });

      // Assemble task item
      taskItem.appendChild(checkbox);
      taskItem.appendChild(textSpan);
      taskItem.appendChild(editButton);
      taskItem.appendChild(deleteButton);

      // Add to list
      taskList.appendChild(taskItem);
    });
  },

  /**
   * Persists tasks to Local Storage
   */
  saveTasks() {
    StorageManager.save(this.STORAGE_KEY, this.state.tasks);
  },

  /**
   * Retrieves tasks from Local Storage
   * Initializes with empty array if no data or error occurs
   */
  loadTasks() {
    const loaded = StorageManager.load(this.STORAGE_KEY);
    
    // Validate loaded data
    if (Array.isArray(loaded)) {
      // Validate each task has required properties
      const validTasks = loaded.filter(task => {
        return task &&
               typeof task.id === 'string' &&
               typeof task.text === 'string' &&
               typeof task.completed === 'boolean' &&
               typeof task.createdAt === 'number';
      });
      
      this.state.tasks = validTasks;
    } else {
      // Initialize with empty array if no valid data
      this.state.tasks = [];
    }
  }
};

// ============================================================================
// QuickLinks Component
// ============================================================================

/**
 * QuickLinks manages quick link creation, deletion, and navigation with persistence.
 * All links are stored in Local Storage and loaded on initialization.
 */
const QuickLinks = {
  /**
   * Storage key for links
   * @type {string}
   */
  STORAGE_KEY: 'productivity-dashboard-links',

  /**
   * Component state
   * @type {Object}
   */
  state: {
    links: []
  },

  /**
   * Initializes the QuickLinks component
   * Loads links from storage and sets up event listeners
   */
  init() {
    // Load links from storage
    this.loadLinks();

    // Get DOM elements
    const addButton = document.getElementById('link-add-button');
    const nameInput = document.getElementById('link-name-input');
    const urlInput = document.getElementById('link-url-input');

    // Set up event listener for add button
    if (addButton) {
      addButton.addEventListener('click', () => {
        const name = nameInput ? nameInput.value : '';
        const url = urlInput ? urlInput.value : '';
        const success = this.addLink(name, url);
        
        // Clear inputs after successful add
        if (success && nameInput && urlInput) {
          nameInput.value = '';
          urlInput.value = '';
        }
      });
    }

    // Set up event listener for Enter key in inputs
    const handleEnter = (event) => {
      if (event.key === 'Enter') {
        const name = nameInput ? nameInput.value : '';
        const url = urlInput ? urlInput.value : '';
        const success = this.addLink(name, url);
        
        if (success && nameInput && urlInput) {
          nameInput.value = '';
          urlInput.value = '';
        }
      }
    };

    if (nameInput) {
      nameInput.addEventListener('keypress', handleEnter);
    }

    if (urlInput) {
      urlInput.addEventListener('keypress', handleEnter);
    }

    // Initial render
    this.render();
  },

  /**
   * Validates that a URL starts with http:// or https://
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid, false otherwise
   */
  validateUrl(url) {
    // Check for http:// or https:// prefix using regex
    const urlPattern = /^https?:\/\//;
    return urlPattern.test(url);
  },

  /**
   * Creates a new link and adds it to the list
   * @param {string} name - Link display name
   * @param {string} url - Link URL
   * @returns {boolean} True if link was added successfully, false otherwise
   */
  addLink(name, url) {
    // Clear any existing error messages
    this.clearError();

    // Trim whitespace
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    // Validate non-empty name
    if (trimmedName === '') {
      this.showError('Name is required');
      return false;
    }

    // Validate non-empty URL
    if (trimmedUrl === '') {
      this.showError('URL is required');
      return false;
    }

    // Validate URL length
    if (trimmedUrl.length > 2000) {
      this.showError('URL is too long');
      return false;
    }

    // Validate URL format
    if (!this.validateUrl(trimmedUrl)) {
      this.showError('URL must start with http:// or https://');
      return false;
    }

    // Truncate name to 100 characters maximum
    const finalName = trimmedName.substring(0, 100);

    // Generate unique ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const id = `link-${timestamp}-${random}`;

    // Create link object
    const link = {
      id: id,
      name: finalName,
      url: trimmedUrl,
      createdAt: timestamp
    };

    // Add to state
    this.state.links.push(link);

    // Persist and render
    this.saveLinks();
    this.render();

    return true;
  },

  /**
   * Removes a link from the list
   * @param {string} id - Link ID
   */
  deleteLink(id) {
    // Filter out the link with matching ID
    this.state.links = this.state.links.filter(link => link.id !== id);

    // Persist and render
    this.saveLinks();
    this.render();
  },

  /**
   * Renders all links to the DOM
   * Sorts links by creation time before rendering
   */
  render() {
    const linksContainer = document.getElementById('links-container');
    if (!linksContainer) {
      return;
    }

    // Sort links by createdAt (ascending - oldest first)
    const sortedLinks = [...this.state.links].sort((a, b) => a.createdAt - b.createdAt);

    // Clear existing content
    linksContainer.innerHTML = '';

    // Render each link
    sortedLinks.forEach(link => {
      // Create link item container
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';

      // Create anchor element
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.name;
      anchor.className = 'link-anchor';

      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'link-delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        this.deleteLink(link.id);
      });

      // Assemble link item
      linkItem.appendChild(anchor);
      linkItem.appendChild(deleteButton);

      // Add to container
      linksContainer.appendChild(linkItem);
    });
  },

  /**
   * Persists links to Local Storage
   */
  saveLinks() {
    StorageManager.save(this.STORAGE_KEY, this.state.links);
  },

  /**
   * Retrieves links from Local Storage
   * Initializes with empty array if no data or error occurs
   */
  loadLinks() {
    const loaded = StorageManager.load(this.STORAGE_KEY);
    
    // Validate loaded data
    if (Array.isArray(loaded)) {
      // Validate each link has required properties
      const validLinks = loaded.filter(link => {
        return link &&
               typeof link.id === 'string' &&
               typeof link.name === 'string' &&
               typeof link.url === 'string' &&
               typeof link.createdAt === 'number';
      });
      
      this.state.links = validLinks;
    } else {
      // Initialize with empty array if no valid data
      this.state.links = [];
    }
  },

  /**
   * Displays an inline error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorContainer = document.getElementById('link-error-message');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  },

  /**
   * Clears any displayed error message
   */
  clearError() {
    const errorContainer = document.getElementById('link-error-message');
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
    }
  }
};

// ============================================================================
// Application Initialization
// ============================================================================

/**
 * Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check storage availability and show warning if unavailable
  if (!StorageManager.isAvailable()) {
    StorageManager.showWarning();
  }

  // Initialize all components
  GreetingDisplay.init();
  FocusTimer.init();
  TaskList.init();
  QuickLinks.init();
});

// Export components for testing
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.GreetingDisplay = GreetingDisplay;
  window.FocusTimer = FocusTimer;
  window.TaskList = TaskList;
  window.QuickLinks = QuickLinks;
}

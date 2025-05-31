class DarkModeController {
  constructor() {
    this.theme = this.getStoredTheme() || this.getPreferredTheme();
    this.toggleButton = null;
    this.init();
  }

  init() {
    this.setTheme(this.theme);
    this.createToggleButton();
    this.addEventListeners();
  }

  getStoredTheme() {
    return localStorage.getItem('theme');
  }

  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateToggleButton();
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  createToggleButton() {
    // Remove existing button if any
    const existingButton = document.querySelector('.theme-toggle');
    if (existingButton) {
      existingButton.remove();
    }

    // Create new button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'theme-toggle';
    this.toggleButton.setAttribute('aria-label', 'Alternar tema');
    this.toggleButton.setAttribute('title', 'Alternar entre modo claro e escuro');
    
    this.updateToggleButton();
    document.body.appendChild(this.toggleButton);
  }

  updateToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
      this.toggleButton.setAttribute('aria-label', 
        this.theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'
      );
    }
  }

  addEventListeners() {
    // Toggle button click
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleTheme());
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Keyboard shortcut (Ctrl/Cmd + Shift + D)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  // Public method to manually set theme
  setManualTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      this.setTheme(theme);
    }
  }

  // Public method to get current theme
  getCurrentTheme() {
    return this.theme;
  }

  // Public method to reset to system preference
  resetToSystemTheme() {
    localStorage.removeItem('theme');
    this.theme = this.getPreferredTheme();
    this.setTheme(this.theme);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.darkModeController = new DarkModeController();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkModeController;
}

/* LogiTrack shared Admin tools.
   Injects the same Search, Notifications and Admin menu on every page.
   The existing root script.js provides all interactions and persistence. */
(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#main-nav');
  if (!header || !nav) return;

  if (!header.querySelector('.header-tools')) {
    const tools = document.createElement('div');
    tools.className = 'header-tools';
    tools.setAttribute('aria-label', 'Quick tools');
    tools.innerHTML = `
      <button class="tool-button command-trigger" type="button"
              aria-label="Open search (Control or Command K)" data-command-open>
        <span aria-hidden="true">⌕</span><span class="tool-label">Search</span><kbd>⌘ K</kbd>
      </button>

      <div class="tool-popover-wrap">
        <button class="icon-button" type="button" aria-label="Notifications"
                aria-expanded="false" data-notifications-toggle>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
          </svg>
          <span class="unread-dot" data-unread-dot></span>
        </button>
        <section class="popover-panel notifications-panel" data-notifications-panel
                 hidden aria-label="Notifications">
          <div class="popover-heading">
            <div><strong>Notifications</strong><small>Demo activity</small></div>
            <button type="button" class="text-action" data-mark-all>Mark all read</button>
          </div>
          <div class="notification-list" data-notification-list></div>
          <button type="button" class="popover-footer-action" data-clear-notifications>
            Clear notifications
          </button>
        </section>
      </div>

      <div class="tool-popover-wrap profile-wrap">
        <button class="profile-trigger" type="button" aria-expanded="false" data-profile-toggle>
          <span class="avatar">LA</span>
          <span class="profile-copy"><strong>Logistics Admin</strong><small>Administrator</small></span>
          <span class="chevron" aria-hidden="true">⌄</span>
        </button>
        <section class="popover-panel profile-panel" data-profile-panel hidden aria-label="Profile menu">
          <div class="profile-summary">
            <span class="avatar avatar-large">LA</span>
            <span><strong>Logistics Admin</strong><small>Demo administrator</small></span>
          </div>
          <a href="dashboard.html">My Profile <span>↗</span></a>
          <a href="dashboard.html">Account Settings <span>↗</span></a>
          <button type="button" data-theme-toggle>
            <span data-theme-label>Switch to dark mode</span><span>◐</span>
          </button>
          <a href="contact.html">Help &amp; Support <span>↗</span></a>
          <button type="button" data-demo-session>End demo session <span>↗</span></button>
        </section>
      </div>`;
    nav.insertAdjacentElement('afterend', tools);
  }

  // These shared overlays are present in the homepage already. Add them only
  // on the other pages so the existing script.js can control them everywhere.
  if (!document.querySelector('[data-command-backdrop]')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'command-backdrop';
    backdrop.dataset.commandBackdrop = '';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="command-dialog" role="dialog" aria-modal="true"
               aria-labelledby="command-title" aria-describedby="command-help">
        <div class="command-search-row">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search pages, shipments and actions..."
                 data-command-input aria-label="Search commands">
          <kbd>ESC</kbd>
        </div>
        <h2 id="command-title" class="visually-hidden">Quick search</h2>
        <p id="command-help" class="command-hint">
          Navigate anywhere in LogiTrack. Use ↑ ↓ to move and Enter to select.
        </p>
        <div class="command-results" data-command-results></div>
        <div class="command-bottom">
          <span>LOGITRACK QUICK NAVIGATION</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate <kbd>↵</kbd> Open</span>
        </div>
      </section>`;
    document.body.append(backdrop);
  }

  if (!document.querySelector('[data-toast-region]')) {
    const region = document.createElement('div');
    region.className = 'toast-region';
    region.dataset.toastRegion = '';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    document.body.append(region);
  }
  if (!document.querySelector('[data-back-to-top]')) {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.type = 'button';
    button.setAttribute('aria-label', 'Back to top');
    button.dataset.backToTop = '';
    button.textContent = '↑';
    document.body.append(button);
  }
  if (!document.querySelector('[data-scroll-progress]')) {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.dataset.scrollProgress = '';
    document.body.append(progress);
  }
})();

/**
 * Agent Data Pod — Interactive Scripts
 * Version: 0.2.0
 */

// ==========================================================================
// Safe localStorage Wrapper
// ==========================================================================

const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }
  }
};

// ==========================================================================
// Theme Toggle
// ==========================================================================

const initTheme = () => {
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Load saved theme or detect system preference
  const saved = storage.get('theme');
  if (saved) {
    html.dataset.theme = saved;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.dataset.theme = 'dark';
  }

  // Update aria-pressed state
  const updateToggleState = () => {
    if (toggle) {
      toggle.setAttribute('aria-pressed', html.dataset.theme === 'dark');
    }
  };
  updateToggleState();

  if (toggle) {
    const toggleTheme = () => {
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      storage.set('theme', next);
      updateToggleState();
    };

    toggle.addEventListener('click', toggleTheme);

    // Keyboard support
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!storage.get('theme')) {
      html.dataset.theme = e.matches ? 'dark' : 'light';
      updateToggleState();
    }
  });
};

// ==========================================================================
// Mobile Navigation Toggle
// ==========================================================================

const initNavigation = () => {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  if (!toggle || !links) return;

  const openMenu = () => {
    links.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });

  // Close menu when clicking a link
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
};

// ==========================================================================
// Scroll Progress Bar
// ==========================================================================

const initProgressBar = () => {
  const progress = document.getElementById('progress');
  if (!progress) return;

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = `${percent}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // Initial call
};

// ==========================================================================
// Copy Buttons
// ==========================================================================

const initCopyButtons = () => {
  const statusRegion = document.getElementById('copy-status');

  const announce = (message) => {
    if (statusRegion) {
      statusRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        statusRegion.textContent = '';
      }, 1000);
    }
  };

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copy;
      const code = document.getElementById(targetId);
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code.textContent);

        // Visual feedback
        btn.classList.add('copied');
        const span = btn.querySelector('span');
        const originalText = span?.textContent || 'Copy';
        if (span) span.textContent = 'Copied!';

        // Screen reader announcement
        announce('Code copied to clipboard');

        // Reset after delay
        setTimeout(() => {
          btn.classList.remove('copied');
          if (span) span.textContent = originalText;
        }, 2000);

      } catch (err) {
        console.error('Copy failed:', err);
        announce('Failed to copy code');

        // Fallback: select the text
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  });
};

// ==========================================================================
// Active TOC Highlighting
// ==========================================================================

const initTOC = () => {
  const toc = document.getElementById('toc');
  if (!toc) return;

  const headings = document.querySelectorAll('h2[id], h3[id]');
  const tocLinks = toc.querySelectorAll('a');

  if (headings.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(link => {
          const isActive = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }, { rootMargin: '-20% 0% -80% 0%' });

  headings.forEach(h => observer.observe(h));
};

// ==========================================================================
// Reveal on Scroll Animation
// ==========================================================================

const initRevealAnimations = () => {
  const elements = document.querySelectorAll('.reveal, .stagger');
  if (elements.length === 0) return;

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Just show everything immediately
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
};

// ==========================================================================
// External Link Icons
// ==========================================================================

const initExternalLinks = () => {
  // Add visual indicator for external links
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    // Skip if it's our own domain or has specific classes
    if (link.hostname === window.location.hostname) return;
    if (link.classList.contains('btn') || link.classList.contains('nav-brand')) return;

    // Add external indicator if not already present
    if (!link.querySelector('.external-icon') && !link.textContent.includes('↗')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
};

// ==========================================================================
// Initialize All
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initProgressBar();
  initCopyButtons();
  initTOC();
  initRevealAnimations();
  initExternalLinks();
});

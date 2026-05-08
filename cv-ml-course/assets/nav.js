// === Computer Vision ML Course: Shared Navigation & State ===

(function() {
  const CURRENT_LESSON = parseInt(document.body.dataset.lesson || '0');
  const TOTAL_LESSONS = 9;

  // Drawer toggle
  const menuBtn = document.querySelector('.menu-btn');
  const drawer = document.querySelector('.lesson-drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Close drawer on link click
  drawer?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      setTimeout(closeDrawer, 150);
    });
  });

  // Mark current lesson as active in drawer
  const activeLink = document.querySelector(`.lesson-list a[href="lesson${CURRENT_LESSON}.html"]`);
  if (activeLink) activeLink.classList.add('active');

  // Completion tracking via localStorage
  const STORAGE_KEY = 'cv-ml-course-completed';
  function getCompleted() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }
  function setCompleted(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function toggleCurrent() {
    const completed = getCompleted();
    const idx = completed.indexOf(CURRENT_LESSON);
    if (idx === -1) completed.push(CURRENT_LESSON);
    else completed.splice(idx, 1);
    setCompleted(completed);
    updateCompletionUI();
  }

  function updateCompletionUI() {
    const completed = getCompleted();
    const box = document.querySelector('.completion-box');
    if (!box) return;
    if (completed.includes(CURRENT_LESSON)) {
      box.classList.add('checked');
      box.querySelector('.check-text').textContent = 'Lesson completed ✓';
    } else {
      box.classList.remove('checked');
      box.querySelector('.check-text').textContent = 'Mark as complete';
    }
    // Update drawer checkmarks
    document.querySelectorAll('.lesson-check').forEach(el => {
      const lessonNum = parseInt(el.dataset.lesson);
      if (completed.includes(lessonNum)) el.classList.add('done');
      else el.classList.remove('done');
    });
    // Update progress bar
    const bar = document.querySelector('.progress-bar-fill');
    if (bar) {
      bar.style.width = `${(completed.length / TOTAL_LESSONS) * 100}%`;
    }
  }

  const completionBox = document.querySelector('.completion-box');
  if (completionBox) {
    completionBox.addEventListener('click', toggleCurrent);
  }

  // Initial UI state
  updateCompletionUI();

  // Keyboard shortcut: Escape closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();
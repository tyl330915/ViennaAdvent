document.addEventListener('DOMContentLoaded', () => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoTypes = ['mp4', 'webm'];
  const gameDays = new Set([19]);

  const today = new Date().getDate();
  const maxDay = computeMaxDay();

  function computeMaxDay() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') return 25;

    const targetYear = 2026;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (year < targetYear) return 0;
    if (year > targetYear) return 25;
    if (month !== 12) return 0;
    return Math.min(now.getDate(), 25);
  }
  const doors = Array.from(document.querySelectorAll('#numbers .door'));

  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalContent = document.getElementById('modal-content');

  let requestId = 0;

  doors.forEach((door) => {
    const day = Number(door.dataset.day);
    const unlocked = day <= maxDay;

    door.classList.toggle('enabled', unlocked);
    door.classList.toggle('today', day === today);
    door.setAttribute('aria-disabled', String(!unlocked));
    door.setAttribute('tabindex', unlocked ? '0' : '-1');

    if (unlocked) {
      door.setAttribute('aria-label', 'Open day ' + day);
    } else {
      door.removeAttribute('aria-label');
    }

    door.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!door.classList.contains('enabled')) return;
      openDay(day);
    });

    door.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        door.click();
      }
    });
  });

  createSnow();
  initBackgroundVideo();

  function initBackgroundVideo() {
    const video = document.querySelector('.map-video');
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const play = () => {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {});
      }
    };

    play();
    video.addEventListener('loadeddata', play);
    video.addEventListener('canplay', play);

    const resume = () => {
      if (video.paused) play();
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('pointerdown', resume);
    document.addEventListener('keydown', resume);
    document.addEventListener('touchstart', resume, { passive: true });
  }

  function createSnow() {
    const snow = document.getElementById('snow');
    if (!snow) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = reducedMotion ? 0 : 120;
    const ns = 'http://www.w3.org/2000/svg';

    for (let i = 0; i < count; i += 1) {
      const flake = document.createElementNS(ns, 'circle');
      const duration = 9 + Math.random() * 9;
      const size = 1.5 + Math.random() * 3.5;

      flake.setAttribute('cx', (Math.random() * 1920).toFixed(1));
      flake.setAttribute('cy', '0');
      flake.setAttribute('r', size.toFixed(1));
      flake.style.animationDuration = duration.toFixed(1) + 's';
      flake.style.animationDelay = (-Math.random() * duration).toFixed(1) + 's';

      snow.appendChild(flake);
    }
  }

  function openDay(day) {
    requestId += 1;
    const id = requestId;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    showMessage('Opening day ' + day + '\u2026');

    if (day === 9) {
      const frame = document.createElement('iframe');
      frame.src = 'https://tyl330915.github.io/gravemaze/';
      frame.title = 'Day 9 - Grave Maze';
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = 'none';
      modalContent.replaceChildren(frame);
      return;
    }

    probeImage(day, id, 0);
  }

  function probeImage(day, id, index) {
    if (id !== requestId) return;
    if (index >= imageTypes.length) {
      probeVideo(day, id, 0);
      return;
    }

    const url = 'assets/' + day + '.' + imageTypes[index];
    const probe = new Image();

    probe.onload = () => {
      if (id === requestId) showImage(url);
    };
    probe.onerror = () => probeImage(day, id, index + 1);
    probe.src = url;
  }

  function probeVideo(day, id, index) {
    if (id !== requestId) return;
    if (index >= videoTypes.length) {
      probeGame(day, id);
      return;
    }

    const url = 'assets/' + day + '.' + videoTypes[index];
    const probe = document.createElement('video');

    probe.muted = true;
    probe.playsInline = true;
    probe.preload = 'auto';
    probe.onloadeddata = () => {
      if (id === requestId) showVideo(url);
    };
    probe.onerror = () => probeVideo(day, id, index + 1);
    probe.src = url;
    probe.load();
  }

  function probeGame(day, id) {
    if (id !== requestId) return;

    const url = 'assets/' + day + '.html';

    if (window.location.protocol === 'file:') {
      if (!gameDays.has(day)) {
        showComingSoon(day);
        return;
      }

      const frame = document.createElement('iframe');
      frame.src = url;
      frame.title = 'Day ' + day;
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = 'none';
      modalContent.replaceChildren(frame);
      return;
    }

    fetch(url, { method: 'HEAD' })
      .then((response) => {
        if (id !== requestId) return;

        if (response.ok) {
          const frame = document.createElement('iframe');
          frame.src = url;
          frame.title = 'Day ' + day;
          modalContent.replaceChildren(frame);
        } else {
          showComingSoon(day);
        }
      })
      .catch(() => {
        if (id === requestId) showComingSoon(day);
      });
  }

  function showImage(url) {
    const image = new Image();
    image.src = url;
    image.alt = '';
    modalContent.replaceChildren(image);
  }

  function showVideo(url) {
    const video = document.createElement('video');

    video.src = url;
    video.autoplay = true;
    video.loop = true;
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.controls = true;

    modalContent.replaceChildren(video);
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }

  function showMessage(message) {
    const box = document.createElement('div');
    box.className = 'modal-message';
    box.textContent = message;
    modalContent.replaceChildren(box);
  }

  function showComingSoon(day) {
    const box = document.createElement('div');
    box.className = 'modal-message coming-soon';

    const label = document.createElement('div');
    label.className = 'coming-soon-day';
    label.textContent = 'Day ' + day;

    const title = document.createElement('div');
    title.className = 'coming-soon-title';
    title.textContent = 'Coming soon';

    const note = document.createElement('p');
    note.className = 'coming-soon-note';
    note.textContent = 'This little door isn\u2019t ready yet \u2014 check back soon!';

    box.append(label, title, note);
    modalContent.replaceChildren(box);
  }

  function closeModal() {
    requestId += 1;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalContent.replaceChildren();
  }

  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
});

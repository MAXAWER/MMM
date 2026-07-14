(() => {
  const root = document.documentElement;
  const body = document.body;

  /* ---------- preloader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => body.classList.remove('is-loading'), 500);
  });

  /* ---------- scroll progress bar ---------- */
  const progressBar = document.getElementById('progressBar');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    progressBar.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- header state + back to top ---------- */
  const header = document.querySelector('.site-header');
  const toTop = document.getElementById('toTop');
  document.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 40;
    header.classList.toggle('is-scrolled', scrolled);
    toTop.style.opacity = window.scrollY > 500 ? '1' : '0';
    toTop.style.pointerEvents = window.scrollY > 500 ? 'auto' : 'none';
  }, { passive: true });
  toTop.style.transition = 'opacity .3s ease';
  toTop.style.opacity = '0';
  toTop.style.pointerEvents = 'none';
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- theme toggle ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
  } else if (prefersDark) {
    root.setAttribute('data-theme', 'dark');
  }
  themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    mobileNav.classList.toggle('is-open');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('is-open');
      mobileNav.classList.remove('is-open');
    });
  });

  /* ---------- custom cursor ---------- */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  if (window.matchMedia('(hover: hover)').matches) {
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    document.querySelectorAll('[data-cursor="link"], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
    });
  } else {
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
  }

  /* ---------- typewriter ---------- */
  const roles = [
    'UI/UX дизайнер',
    'фронтенд-энтузиаст',
    'студентка 3 курса',
    'любитель lo-fi и кофе'
  ];
  const typewriterEl = document.getElementById('typewriter');
  let roleIndex = 0, charIndex = 0, deleting = false;

  const tick = () => {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typewriterEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      charIndex--;
      typewriterEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  };
  tick();

  /* ---------- scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('.reveal, .reveal-line');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => io.observe(el));

  /* hero title lines reveal immediately since hero-title itself isn't observed */
  document.querySelectorAll('.hero-title .reveal-line').forEach((el, i) => {
    el.style.transitionDelay = `${i * 120}ms`;
  });

  /* ---------- lo-fi player toggle (decorative) ---------- */
  const player = document.getElementById('player');
  const playerToggle = document.getElementById('playerToggle');
  playerToggle.addEventListener('click', () => {
    player.classList.toggle('is-playing');
  });

  /* ---------- contact form (demo only, no backend) ---------- */
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formNote.textContent = 'спасибо! это демо-форма — сообщение никуда не ушло 🙂';
    formNote.classList.add('is-sent');
    contactForm.reset();
  });
})();

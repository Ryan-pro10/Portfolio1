const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

document.documentElement.classList.add('js-anim');

/* ---------- Estrelas no fundo ---------- */
const starsCanvas = document.createElement('canvas');
starsCanvas.className = 'stars-canvas';
starsCanvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(starsCanvas);

const ctx = starsCanvas.getContext('2d');
let stars = [];
let width = 0;
let height = 0;
let starsFrame = null;
let pointerX = 0;
let pointerY = 0;

function buildStars() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;

  starsCanvas.width = width * dpr;
  starsCanvas.height = height * dpr;
  starsCanvas.style.width = `${width}px`;
  starsCanvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(150, Math.round((width * height) / 13000));

  stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.1 + 0.3,
    depth: Math.random() * 0.8 + 0.2,
    alpha: Math.random() * 0.45 + 0.2,
    speed: Math.random() * 0.0016 + 0.0005,
    phase: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    accent: Math.random() < 0.28,
  }));
}

function drawStars(time) {
  ctx.clearRect(0, 0, width, height);

  stars.forEach((star) => {
    if (!reduceMotion) {
      star.x += star.vx;
      star.y += star.vy;

      if (star.x < -2) star.x = width + 2;
      if (star.x > width + 2) star.x = -2;
      if (star.y < -2) star.y = height + 2;
      if (star.y > height + 2) star.y = -2;
    }

    const twinkle = reduceMotion
      ? 1
      : 0.55 + 0.45 * Math.sin(time * star.speed + star.phase);
    const offsetX = pointerX * star.depth * 14;
    const offsetY = pointerY * star.depth * 14;

    ctx.beginPath();
    ctx.arc(star.x + offsetX, star.y + offsetY, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.accent
      ? `rgba(185, 174, 255, ${star.alpha * twinkle})`
      : `rgba(240, 239, 245, ${star.alpha * twinkle})`;
    ctx.fill();
  });

  starsFrame = requestAnimationFrame(drawStars);
}

function startStars() {
  if (starsFrame === null) starsFrame = requestAnimationFrame(drawStars);
}

function stopStars() {
  if (starsFrame !== null) {
    cancelAnimationFrame(starsFrame);
    starsFrame = null;
  }
}

buildStars();

if (reduceMotion) {
  drawStars(0);
  stopStars();
} else {
  startStars();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopStars();
    else startStars();
  });
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildStars();
    if (reduceMotion) drawStars(0);
  }, 200);
});

if (finePointer && !reduceMotion) {
  window.addEventListener('pointermove', (e) => {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
  });
}

/* ---------- Barra de progresso da rolagem ---------- */
const progress = document.createElement('div');
progress.className = 'scroll-progress';
document.body.appendChild(progress);

/* ---------- Entrada do hero ---------- */
const heroEls = document.querySelectorAll(
  '.hero-tag, .hero-name, .hero-role, .hero-desc, .hero-ctas, .hero-photo-wrap'
);

heroEls.forEach((el, i) => {
  el.setAttribute('data-reveal', '');
  el.style.setProperty('--reveal-delay', `${i * 110}ms`);
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    heroEls.forEach((el) => el.classList.add('is-visible'));
  });
});

/* ---------- Revelação ao rolar ---------- */
const revealGroups = [
  { selector: '#habilidades .section-label, #habilidades .section-title', stagger: 90 },
  { selector: '.skill-card', stagger: 70 },
  { selector: '#projetos .section-label, #projetos .section-title', stagger: 90 },
  { selector: '.project-card', stagger: 110 },
  { selector: '#trajetoria .section-label, #trajetoria .section-title', stagger: 90 },
  { selector: '.timeline-item', stagger: 120, direction: 'left' },
  { selector: '.contact-inner .section-label, .contact-inner .section-title', stagger: 90 },
  { selector: '.contact-link', stagger: 80 },
];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

revealGroups.forEach(({ selector, stagger, direction }) => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.setAttribute('data-reveal', direction || '');
    el.style.setProperty('--reveal-delay', `${i * stagger}ms`);
    revealObserver.observe(el);
  });
});

/* ---------- Linha da trajetória se desenhando ---------- */
const timeline = document.querySelector('.timeline');

if (timeline) {
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        timeline.classList.add('is-drawn');
        timelineObserver.disconnect();
      });
    },
    { threshold: 0.2 }
  );
  timelineObserver.observe(timeline);
}

/* ---------- Nav: estado compacto, link ativo e progresso ---------- */
const nav = document.querySelector('nav');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav ul a');
let ticking = false;

function updateOnScroll() {
  const scrollY = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  nav.classList.toggle('scrolled', scrollY > 40);

  let current = '';
  sections.forEach((section) => {
    if (scrollY >= section.offsetTop - 120) current = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
  });

  ticking = false;
}

window.addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateOnScroll);
  },
  { passive: true }
);

updateOnScroll();

/* ---------- Brilho seguindo o cursor nos cards ---------- */
if (finePointer) {
  document.querySelectorAll('.project-card, .skill-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---------- Parallax do brilho do hero ---------- */
const heroBlur = document.querySelector('.hero-blur');

if (heroBlur && finePointer && !reduceMotion) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let blurFrame = null;

  function animateBlur() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    heroBlur.style.transform = `translate(${currentX}px, ${currentY}px)`;

    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      blurFrame = requestAnimationFrame(animateBlur);
    } else {
      blurFrame = null;
    }
  }

  window.addEventListener('pointermove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 70;
    targetY = (e.clientY / window.innerHeight - 0.5) * 70;
    if (!blurFrame) blurFrame = requestAnimationFrame(animateBlur);
  });
}

/* ---------- Foto do perfil inclinando com o mouse ---------- */
const heroPhoto = document.querySelector('.hero-photo');
const heroPhotoWrap = document.querySelector('.hero-photo-wrap');

if (heroPhoto && heroPhotoWrap && finePointer && !reduceMotion) {
  heroPhotoWrap.addEventListener('pointermove', (e) => {
    const rect = heroPhotoWrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    heroPhoto.style.transition = 'transform 0.1s linear';
    heroPhoto.style.transform = `rotateY(${px * 18}deg) rotateX(${-py * 18}deg) scale(1.04)`;
  });

  heroPhotoWrap.addEventListener('pointerleave', () => {
    heroPhoto.style.transition = '';
    heroPhoto.style.transform = '';
  });
}

/* ---------- Botões magnéticos ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.btn-primary, .btn-outline').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      btn.style.transform = `translate(${x}px, ${y - 1}px)`;
    });

    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

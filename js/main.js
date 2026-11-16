(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('menu-principal');
  const status = document.getElementById('a11y-status');
  const desktop = window.matchMedia('(min-width: 56.25em)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const isMenuOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setMenu = (open, returnFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (!open && returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setMenu(!isMenuOpen()));

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && !desktop.matches) setMenu(false);
  });

  header.addEventListener('focusout', (event) => {
    if (isMenuOpen() && !header.contains(event.relatedTarget)) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) setMenu(false, true);
  });

  document.addEventListener('click', (event) => {
    if (isMenuOpen() && !header.contains(event.target)) setMenu(false);
  });

  desktop.addEventListener('change', () => setMenu(false));

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if ('IntersectionObserver' in window) {
    if (!reduceMotion.matches) {
      root.classList.add('can-reveal');
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    }

    const links = [...nav.querySelectorAll('.nav__list a[href^="#"]')];
    const sections = document.querySelectorAll('main section[id]');
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((section) => spy.observe(section));
  }

  const STORAGE_KEY = 'sp-a11y';
  const SIZES = ['100%', '112,5%', '125%', '137,5%'];
  const prefs = { fonte: 0, contraste: false };
  const contrastButton = document.querySelector('[data-a11y="contraste"]');

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      prefs.fonte = Math.min(SIZES.length - 1, Math.max(0, Number(saved.fonte) || 0));
      prefs.contraste = saved.contraste === true;
    }
  } catch (error) {
    prefs.fonte = 0;
  }

  const savePrefs = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      return;
    }
  };

  const announce = (message) => {
    status.textContent = '';
    window.setTimeout(() => {
      status.textContent = message;
    }, 60);
  };

  const applyPrefs = () => {
    if (prefs.fonte > 0) root.setAttribute('data-fonte', String(prefs.fonte));
    else root.removeAttribute('data-fonte');
    if (prefs.contraste) root.setAttribute('data-contraste', 'alto');
    else root.removeAttribute('data-contraste');
    contrastButton.setAttribute('aria-pressed', String(prefs.contraste));
  };

  applyPrefs();

  document.querySelectorAll('[data-a11y]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.a11y;
      if (action === 'contraste') {
        prefs.contraste = !prefs.contraste;
        announce(prefs.contraste ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
      } else {
        const step = action === 'mais' ? 1 : -1;
        const next = Math.min(SIZES.length - 1, Math.max(0, prefs.fonte + step));
        if (next === prefs.fonte) {
          announce(step > 0 ? `O texto já está no tamanho máximo, ${SIZES[next]}.` : `O texto já está no tamanho padrão, ${SIZES[next]}.`);
        } else {
          prefs.fonte = next;
          announce(`Tamanho do texto: ${SIZES[next]}.`);
        }
      }
      applyPrefs();
      savePrefs();
    });
  });

  const vlibrasEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'];
  let vlibrasRequested = false;

  const loadVLibras = () => {
    if (vlibrasRequested) return;
    vlibrasRequested = true;
    vlibrasEvents.forEach((name) => window.removeEventListener(name, loadVLibras));
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    widget.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(widget);
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.addEventListener('load', () => {
      if (!window.VLibras) return;
      new window.VLibras.Widget('https://vlibras.gov.br/app');
      if (document.readyState === 'complete' && typeof window.onload === 'function') window.onload();
    });
    document.body.appendChild(script);
  };

  vlibrasEvents.forEach((name) => window.addEventListener(name, loadVLibras, { passive: true }));
})();

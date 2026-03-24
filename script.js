// ===== NAVIGATION =====
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Sticky nav
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile nav toggle
hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close mobile nav on link click
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close mobile nav on resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

// ===== SMOOTH ANCHOR SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== STAT NUMBER ANIMATION =====
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(10px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  statsObserver.observe(el);
});

// ===== LEAD FORM SUBMISSION =====
const leadForm = document.getElementById('lead-form');
if (leadForm) {
  const ALLOWED_WEBHOOK_HOSTS = new Set(['rankn8n.com']);
  const FORM_TIMEOUT_MS = 10000;
  const webhookUrl = (
    leadForm.dataset.webhookUrl ||
    leadForm.getAttribute('action') ||
    ''
  ).trim();
  const statusEl = document.getElementById('form-status');

  const setFormStatus = (message, type = '') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('is-error', 'is-success');
    if (type) {
      statusEl.classList.add(type);
    }
  };

  const validateLeadForm = () => {
    const requiredFields = [
      {
        field: leadForm.querySelector('[name="name"]'),
        message: 'Please enter your name.',
      },
      {
        field: leadForm.querySelector('[name="email"]'),
        message: 'Please enter a valid email address.',
      },
    ];

    for (const { field, message } of requiredFields) {
      if (!field || !field.checkValidity()) {
        setFormStatus(message, 'is-error');
        if (field) {
          field.focus();
        }
        return false;
      }
    }

    return true;
  };

  if (webhookUrl) {
    leadForm.setAttribute('action', webhookUrl);
  }

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = leadForm.querySelector('.form-submit');
    const originalText = btn.innerHTML;

    setFormStatus('');

    if (!validateLeadForm()) {
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Sending...';
    setFormStatus('Sending your request...', '');

    try {
      if (!webhookUrl) {
        throw new Error('Missing webhook URL');
      }

      const parsedWebhookUrl = new URL(webhookUrl, window.location.href);
      if (parsedWebhookUrl.protocol !== 'https:') {
        throw new Error('Webhook URL must use HTTPS');
      }

      if (!ALLOWED_WEBHOOK_HOSTS.has(parsedWebhookUrl.hostname)) {
        throw new Error('Webhook host is not allowed');
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, FORM_TIMEOUT_MS);

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: new FormData(leadForm),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      btn.innerHTML = 'Request Sent';
      btn.disabled = false;
      leadForm.reset();
      setFormStatus('Thanks. Your request was sent and our team will follow up soon.', 'is-success');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (err.name === 'AbortError') {
        setFormStatus('The request timed out. Please try again or call us directly.', 'is-error');
        return;
      }

      setFormStatus('We could not submit your request. Please try again or call us directly.', 'is-error');
    }
  });
}

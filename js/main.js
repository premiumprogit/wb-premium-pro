/* ============================================
   PREMIUM PRO CONTRACTORS — main.js
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Mobile Menu ── */
  const toggle = document.querySelector('.menu-toggle');
  const nav    = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', false);
      }
    });
  }

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq__item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq__item.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Reveal on Scroll ── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* ── Sticky header shadow ── */
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.style.boxShadow = window.scrollY > 20
        ? '0 4px 20px rgba(0,0,0,.35)'
        : 'none';
    }, { passive: true });
  }

  /* ── Site forms → CRM webhook ── */
  const CRM_WEBHOOK_URL = window.PREMIUM_PRO_CRM_WEBHOOK_URL ||
    'https://mediagrowth-n8n.63kuy3.easypanel.host/webhook/premium-pro-site-lead';

  function detectLeadPlatform() {
    const url = window.location.href.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    const utmMedium = (params.get('utm_medium') || '').toLowerCase();

    if (utmSource.includes('google') || utmMedium.includes('cpc') || utmMedium.includes('ppc') || url.includes('google')) {
      return 'GOOGLE';
    }
    if (utmSource.includes('meta') || utmSource.includes('facebook') || utmSource.includes('instagram') || url.includes('meta')) {
      return 'META';
    }
    if (utmSource.includes('tiktok') || url.includes('tiktok')) return 'TIKTOK';
    if (utmSource.includes('linkedin') || url.includes('linkedin')) return 'LINKEDIN';
    return 'ORGANIC';
  }

  function getFormMessage(form, selector) {
    return form.querySelector(selector) || form.parentElement.querySelector(selector);
  }

  function getCheckedValue(form, name) {
    return form.querySelector('[name="' + name + '"]')?.checked ? 'yes' : 'no';
  }

  function normalizePhone(value) {
    const phone = (value || '').toString().trim();
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? phone : '';
  }

  function buildLeadPayload(form) {
    const formData = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    const platform = detectLeadPlatform();

    return {
      name: (formData.get('name') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: normalizePhone(formData.get('phone')),
      address: (formData.get('address') || '').toString().trim(),
      city: (formData.get('city') || '').toString().trim(),
      service: (formData.get('service') || '').toString().trim(),
      budget: (formData.get('budget') || '').toString().trim(),
      timeline: (formData.get('timeline') || '').toString().trim(),
      contact_preference: (formData.get('contact_preference') || '').toString().trim(),
      message: (formData.get('message') || '').toString().trim(),
      how_did_you_hear: (formData.get('source') || '').toString().trim(),
      consent_transactional: getCheckedValue(form, 'consent_transactional'),
      consent_marketing: getCheckedValue(form, 'consent_marketing'),
      PLATAFORMA: platform,
      FONTE: window.location.href,
      source: (window.MG_LEAD_SOURCE || 'site'),
      source_detail: 'premiumprocontractors.com',
      tags: [(window.MG_LEAD_SOURCE || 'site'), 'premium pro', platform === 'ORGANIC' ? 'lp organic' : 'lp ' + platform.toLowerCase()],
      pipeline_stage: 'Novos leads',
      page_name: document.title,
      page_path: window.location.pathname,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || ''
    };
  }

  async function sendLeadToCrm(payload) {
    if (!CRM_WEBHOOK_URL) {
      throw new Error('CRM webhook not configured');
    }

    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('CRM webhook HTTP ' + response.status);
    }
  }

  function initStepForm(form) {
    const steps = Array.prototype.slice.call(form.querySelectorAll('.form-step'));
    const nav = form.querySelector('.form-nav');
    const prev = form.querySelector('.form-prev');
    const next = form.querySelector('.form-next');
    const progress = form.querySelector('.form-progress__bar span');
    const labels = Array.prototype.slice.call(form.querySelectorAll('.form-progress__steps span'));
    let current = 0;

    function showStep(index) {
      current = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach(function (step, stepIndex) {
        step.classList.toggle('active', stepIndex === current);
      });
      labels.forEach(function (label, labelIndex) {
        label.classList.toggle('active', labelIndex === current);
        label.classList.toggle('done', labelIndex < current);
      });
      if (progress) progress.style.width = ((current + 1) / steps.length * 100) + '%';
      if (nav) {
        nav.classList.toggle('is-first', current === 0);
        nav.classList.toggle('is-final', current === steps.length - 1);
      }
      const firstField = steps[current].querySelector('input, select, textarea');
      if (firstField) firstField.focus({ preventScroll: true });
    }

    function currentStepIsValid() {
      const fields = Array.prototype.slice.call(steps[current].querySelectorAll('input, select, textarea'));
      return fields.every(function (field) {
        return field.reportValidity();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showStep(current - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        if (currentStepIsValid()) showStep(current + 1);
      });
    }

    steps.forEach(function (step) {
      step.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && current < steps.length - 1) {
          event.preventDefault();
          if (currentStepIsValid()) showStep(current + 1);
        }
      });
    });

    showStep(0);
  }

  /* ── Lead popup (todos os CTAs abrem o mesmo step-form) ── */
  function leadCardHTML(prefix) {
    var p = prefix || 'pp';
    return '' +
      '<div class="lead-card__title">Get a Free Estimate</div>' +
      '<div class="lead-card__sub">Answer one question at a time. Your request goes straight to our team.</div>' +
      '<form data-feedback data-step-form action="#" method="POST">' +
        '<div class="form-progress" aria-label="Estimate request progress">' +
          '<div class="form-progress__bar"><span></span></div>' +
          '<div class="form-progress__steps"><span class="active">Service</span><span>Name</span><span>Phone</span><span>Email</span></div>' +
        '</div>' +
        '<div class="form-step active" data-step="0"><div class="form__field">' +
          '<label for="'+p+'-service">What do you need help with? *</label>' +
          '<select id="'+p+'-service" name="service" required>' +
            '<option value="">Select a service...</option>' +
            '<option>Kitchen Remodeling</option><option>Bathroom Remodeling</option>' +
            '<option>Home Additions</option><option>Interior Painting</option>' +
            '<option>Exterior Painting</option><option>Cabinet Painting</option>' +
            '<option>Carpentry &amp; Trim</option><option>Decks &amp; Patios</option>' +
            '<option>Drywall / Insulation / Plaster</option><option>Framing</option>' +
            '<option>Power Washing</option><option>Multiple Services</option>' +
          '</select></div></div>' +
        '<div class="form-step" data-step="1"><div class="form__field"><label for="'+p+'-name">What is your name? *</label><input type="text" id="'+p+'-name" name="name" required placeholder="John Smith" autocomplete="name"></div></div>' +
        '<div class="form-step" data-step="2"><div class="form__field"><label for="'+p+'-phone">What number should we call or text? *</label><input type="tel" id="'+p+'-phone" name="phone" required placeholder="(617) 555-0100" autocomplete="tel"></div></div>' +
        '<div class="form-step" data-step="3"><div class="form__field"><label for="'+p+'-email">What is your email? *</label><input type="email" id="'+p+'-email" name="email" required placeholder="john@email.com" autocomplete="email"></div>' +
          '<p class="form__note">By submitting, you agree to our <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms">Terms &amp; Conditions</a>. We use your contact information only to respond to your request.</p></div>' +
        '<div class="form-nav">' +
          '<button class="btn btn--ghost form-prev" type="button">Back</button>' +
          '<button class="btn btn--primary btn--block form-next" type="button">Next</button>' +
          '<button class="btn btn--primary btn--block form-submit" type="submit">Send Request</button>' +
        '</div>' +
      '</form>' +
      '<div class="form__success" style="display:none;padding:20px 0;text-align:center;">' +
        '<p style="font-size:1.1rem;font-weight:700;color:#16a34a;margin-bottom:8px;">Request received.</p>' +
        '<p>Claudiney or our team will reach out within 24 hours. If you prefer to speak with us now, you can call directly.</p>' +
        '<div class="form__quick-actions"><a class="btn btn--primary btn--block" href="tel:' + (window.MG_CALL_NUMBER || '+19783547573') + '">Call Premium Pro</a></div>' +
      '</div>';
  }

  (function initLeadPopup() {
    if (document.getElementById('ppLeadOverlay')) return;
    var st = document.createElement('style');
    st.textContent =
      '.pp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.72);z-index:9998;display:none;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 16px}' +
      '.pp-overlay.open{display:flex}' +
      '.pp-modal{background:#fff;border-radius:16px;max-width:480px;width:100%;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.35);margin:auto}' +
      '.pp-modal .lead-card{margin:0;box-shadow:none}' +
      '.pp-close{position:absolute;top:10px;right:14px;background:none;border:0;font-size:30px;line-height:1;color:#94a3b8;cursor:pointer;z-index:2}' +
      '.pp-close:hover{color:#0f172a}' +
      '.pp-call-fab{position:fixed;right:20px;bottom:88px;z-index:9997;width:56px;height:56px;border-radius:50%;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.3);text-decoration:none}' +
      '.pp-call-fab:hover{filter:brightness(1.06)}';
    document.head.appendChild(st);

    var ov = document.createElement('div');
    ov.className = 'pp-overlay';
    ov.id = 'ppLeadOverlay';
    ov.innerHTML = '<div class="pp-modal" role="dialog" aria-modal="true" aria-label="Get a Free Estimate">' +
      '<button class="pp-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="lead-card" style="padding:26px 22px">' + leadCardHTML('pp') + '</div></div>';
    document.body.appendChild(ov);

    function openPopup(e) { if (e) e.preventDefault(); ov.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closePopup() { ov.classList.remove('open'); document.body.style.overflow = ''; }
    ov.querySelector('.pp-close').addEventListener('click', closePopup);
    ov.addEventListener('click', function (e) { if (e.target === ov) closePopup(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
    window.PP_openLeadPopup = openPopup;

    // Todos os CTAs de conversão abrem o popup (site inteiro)
    var CTA_TXT = /free estimate|get (a )?(free )?(estimate|quote)|request (a |your )?(free )?(quote|estimate)|get started|book|schedule|contact us|start (your |my )?project/i;
    var els = document.querySelectorAll('a, button');
    Array.prototype.forEach.call(els, function (el) {
      if (el.closest('form') || el.closest('.pp-modal')) return;      // não mexe em botões de form/popup
      var href = (el.getAttribute('href') || '').toLowerCase();
      if (href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) return; // ligação/email seguem
      var txt = (el.textContent || '').trim();
      var isConvHref = /free-estimate|\/contact(\.html)?$|#estimate|#quote|#contact/.test(href);
      if (isConvHref || (CTA_TXT.test(txt) && el.classList.contains('btn'))) {
        el.setAttribute('data-lead-open', '1');
        el.addEventListener('click', openPopup);
      }
    });
    document.querySelectorAll('[data-lead-open]').forEach(function (el) {
      if (!el.__ppBound) { el.__ppBound = 1; el.addEventListener('click', openPopup); }
    });
    // Obs: o FAB flutuante de ligação (.float-call) já existe no HTML de todas as páginas,
    // com o número de rastreamento correto por tipo de página (SEO/blog vs site).
  })();

  document.querySelectorAll('form[data-step-form]').forEach(initStepForm);

  document.querySelectorAll('form[data-feedback]').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const msg = getFormMessage(form, '.form__success');
      const originalText = button ? button.textContent : '';

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
      }

      try {
        await sendLeadToCrm(buildLeadPayload(form));
        if (msg && form.contains(msg)) {
          Array.prototype.forEach.call(form.children, function (child) {
            if (child !== msg) child.style.display = 'none';
          });
          msg.style.display = 'block';
        } else {
          form.style.display = 'none';
          if (msg) msg.style.display = 'block';
        }
      } catch (error) {
        console.error(error);
        alert('We could not send your request right now. Please call Premium Pro Contractors at +1 (617) 501-2989 or email contact@premiumprocontractors.com.');
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }
    });
  });

  /* ── Smooth anchor scrolling ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Active nav link ── */
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a').forEach(function (a) {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (path === href || (href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });

  /* ── Before/After slider (pointer events + rAF) ── */
  document.querySelectorAll('[data-ba]').forEach(function (container) {
    const after   = container.querySelector('.before-after__after');
    const divider = container.querySelector('.before-after__divider');
    const handle  = container.querySelector('.before-after__handle');
    let dragging  = false;
    let pendingPct = null;
    let rafId = 0;

    function apply(pct) {
      const pctStr = pct + '%';
      after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      divider.style.left   = pctStr;
      handle.style.left    = pctStr;
    }

    function schedule(pct) {
      pendingPct = Math.max(2, Math.min(98, pct));
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        rafId = 0;
        if (pendingPct !== null) apply(pendingPct);
      });
    }

    function getPercent(e) {
      const rect = container.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * 100;
    }

    container.addEventListener('pointerdown', function (e) {
      dragging = true;
      container.setPointerCapture(e.pointerId);
      container.classList.add('is-dragging');
      schedule(getPercent(e));
      e.preventDefault();
    });
    container.addEventListener('pointermove', function (e) {
      if (dragging) schedule(getPercent(e));
    });
    function stop(e) {
      if (!dragging) return;
      dragging = false;
      container.classList.remove('is-dragging');
      try { container.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    container.addEventListener('pointerup', stop);
    container.addEventListener('pointercancel', stop);
    container.addEventListener('pointerleave', stop);
  });

  /* ── Video Sound Toggle ── */
  document.querySelectorAll('.video-sound').forEach(function (btn) {
    const video = btn.closest('.video-wrap').querySelector('video');
    if (!video) return;
    video.muted = true;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      video.muted = !video.muted;
      btn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
      btn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
      if (!video.muted) {
        const p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
    });
  });

});

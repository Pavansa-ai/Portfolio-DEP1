/* ═══════════════════════════════════════════════════════
   ZENTRO — Interactions & Motion
   Building Products People Remember.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── SUPABASE CONFIG ────────────────────────────────
  // Public project URL + anon/publishable key — safe to expose client-side.
  // RLS policies (set server-side) restrict what this key can actually do:
  // INSERT requires a signed-in (Google-authenticated) user; SELECT/DELETE are admin-only.
  const SUPABASE_URL = 'https://hlvflflyfyvxzvuwzgqm.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_he43u9JV_Dswv4R5vKUPhA_BLA6XHNQ';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentSession = null;
  const REOPEN_MODAL_KEY = 'zentro_reopen_modal_after_auth';

  async function getSession() {
    const { data } = await sb.auth.getSession();
    currentSession = data.session;
    return currentSession;
  }

  async function signInWithGoogle(preselect) {
    sessionStorage.setItem(REOPEN_MODAL_KEY, preselect || '__none__');
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
  }

  async function submitLead(data) {
    const payload = {
      services: data.services,
      biz_name: data.bizName || null,
      biz_industry: data.bizIndustry || null,
      biz_url: data.bizUrl || null,
      goals: data.goals || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
      project_desc: data.projectDesc || null,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone || null,
      contact_method: data.contactMethod || 'email'
    };

    const { error } = await sb.from('leads').insert(payload);
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
  }

  // ─── DOM CACHE ──────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const cursorGlow = $('#cursorGlow');
  const nav = $('#mainNav');
  const navBurger = $('#navBurger');
  const mobileNav = $('#mobileNav');
  const modal = $('#projectModal');
  const modalBackdrop = $('#modalBackdrop');
  const modalClose = $('#modalClose');
  const modalNext = $('#modalNext');
  const modalBack = $('#modalBack');
  const modalDone = $('#modalDone');
  const modalSteps = $('#modalSteps');
  const progressBar = $('#progressBar');
  const modalNav = $('#modalNav');

  // ─── STATE ──────────────────────────────────────────
  let currentStep = 1;
  const totalSteps = 7;
  const formData = {
    services: [],
    bizName: '',
    bizIndustry: '',
    bizUrl: '',
    goals: '',
    budget: '',
    timeline: '',
    projectDesc: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactMethod: 'email'
  };

  // ─── SCROLL REVEAL ──────────────────────────────────
  function initScrollReveal() {
    const revealElements = $$('.z-reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseFloat(el.dataset.delay || 0) * 1000;
          setTimeout(() => {
            el.classList.add('is-visible');
          }, delay);
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // ─── WORD-BY-WORD REVEAL ────────────────────────────
  function initWordReveal() {
    const wordElements = $$('.z-reveal-words');

    wordElements.forEach(container => {
      const text = container.textContent.trim();
      // Preserve inner HTML for <br> and <span> tags
      const html = container.innerHTML;

      // Split text nodes into words while preserving HTML tags
      const fragment = document.createElement('div');
      fragment.innerHTML = html;

      const newHtml = [];
      let wordIndex = 0;

      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/);
          words.forEach(word => {
            if (word.trim()) {
              newHtml.push(`<span class="z-word" style="transition-delay: ${wordIndex * 0.06}s">${word}</span>`);
              wordIndex++;
            } else if (word) {
              newHtml.push(word);
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'BR') {
            newHtml.push('<br>');
          } else {
            const tag = node.tagName.toLowerCase();
            const classAttr = node.className ? ` class="${node.className}"` : '';
            newHtml.push(`<${tag}${classAttr}>`);
            node.childNodes.forEach(child => processNode(child));
            newHtml.push(`</${tag}>`);
          }
        }
      }

      fragment.childNodes.forEach(child => processNode(child));
      container.innerHTML = newHtml.join('');
    });

    // Now observe each word container
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const words = $$('.z-word', entry.target);
          words.forEach(word => word.classList.add('is-visible'));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -30px 0px'
    });

    wordElements.forEach(el => observer.observe(el));
  }

  // ─── LINE REVEAL ────────────────────────────────────
  function initLineReveal() {
    const lines = $$('.z-reveal-line');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    lines.forEach(el => observer.observe(el));
  }

  // ─── CURSOR GLOW ───────────────────────────────────
  function initCursorGlow() {
    if (!cursorGlow) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function animate() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      cursorGlow.style.left = currentX + 'px';
      cursorGlow.style.top = currentY + 'px';
      requestAnimationFrame(animate);
    }

    animate();
  }

  // ─── NAV SCROLL ─────────────────────────────────────
  function initNavScroll() {
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }

      lastScroll = scrollY;
    }, { passive: true });
  }

  // ─── MOBILE NAV ─────────────────────────────────────
  function initMobileNav() {
    navBurger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      navBurger.classList.toggle('is-active');
      navBurger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('modal-open', isOpen);
    });

    $$('.z-mobile-nav__link', mobileNav).forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        navBurger.classList.remove('is-active');
        navBurger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      });
    });

    const mobileCta = $('#mobileCta');
    if (mobileCta) {
      mobileCta.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        navBurger.classList.remove('is-active');
        document.body.classList.remove('modal-open');
        openModal();
      });
    }
  }

  // ─── SERVICE TABS ───────────────────────────────────
  function initServiceTabs() {
    const navItems = $$('.z-arsenal__nav-item');
    const panels = $$('.z-arsenal__panel');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const service = item.dataset.service;

        // Update nav
        navItems.forEach(n => n.classList.remove('is-active'));
        item.classList.add('is-active');

        // Update panels
        panels.forEach(p => {
          if (p.dataset.panel === service) {
            // Remove is-active from all, add to target
            panels.forEach(pp => {
              pp.classList.remove('is-active');
              pp.style.position = 'absolute';
            });
            // Small delay for transition
            requestAnimationFrame(() => {
              p.classList.add('is-active');
              p.style.position = 'relative';
            });
          }
        });
      });
    });
  }

  // ─── MODAL ──────────────────────────────────────────
  function openModal(preselect) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    currentStep = 1;
    updateModalStep();

    // Lock the email field to the verified Google identity.
    if (currentSession && currentSession.user && currentSession.user.email) {
      const emailField = $('#contactEmail');
      if (emailField) {
        emailField.value = currentSession.user.email;
        emailField.readOnly = true;
        emailField.title = 'Verified via Google sign-in';
      }
      formData.contactEmail = currentSession.user.email;
    }

    // Preselect service if provided
    if (preselect) {
      const chip = $(`.z-chip[data-value="${preselect}"]`);
      if (chip && !chip.classList.contains('is-selected')) {
        chip.classList.add('is-selected');
        if (!formData.services.includes(preselect)) {
          formData.services.push(preselect);
        }
      }
    }
  }

  async function requireAuthThenOpen(preselect) {
    const session = await getSession();
    if (session) {
      openModal(preselect);
    } else {
      await signInWithGoogle(preselect);
      // Page will redirect to Google and back; modal reopens on return (see init()).
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    // Reset after animation
    setTimeout(() => {
      currentStep = 1;
      updateModalStep();
      resetForm();
    }, 500);
  }

  function resetForm() {
    formData.services = [];
    formData.bizName = '';
    formData.bizIndustry = '';
    formData.bizUrl = '';
    formData.goals = '';
    formData.budget = '';
    formData.timeline = '';
    formData.projectDesc = '';
    formData.contactName = '';
    formData.contactEmail = '';
    formData.contactPhone = '';
    formData.contactMethod = 'email';

    // Reset UI
    $$('.z-chip').forEach(c => c.classList.remove('is-selected'));
    $$('.z-budget-card').forEach(c => c.classList.remove('is-selected'));
    $$('.z-timeline-card').forEach(c => c.classList.remove('is-selected'));
    $$('.z-field__input').forEach(f => {
      if (f.tagName === 'SELECT') {
        f.selectedIndex = 0;
      } else {
        f.value = '';
      }
    });
  }

  function updateModalStep() {
    const steps = $$('.z-modal__step');
    steps.forEach(s => s.classList.remove('is-active'));

    if (currentStep === 'success') {
      const successStep = $('[data-step="success"]');
      if (successStep) successStep.classList.add('is-active');
      modalNav.style.display = 'none';
      progressBar.style.width = '100%';
      return;
    }

    const activeStep = $(`[data-step="${currentStep}"]`);
    if (activeStep) activeStep.classList.add('is-active');

    // Progress
    const pct = (currentStep / totalSteps) * 100;
    progressBar.style.width = pct + '%';

    // Nav buttons
    modalNav.style.display = 'flex';
    modalBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    if (currentStep === totalSteps) {
      modalNext.querySelector('span').textContent = 'Submit';
    } else {
      modalNext.querySelector('span').textContent = 'Continue';
    }
  }

  async function nextStep() {
    collectStepData();

    if (currentStep < totalSteps) {
      currentStep++;
      updateModalStep();
      return;
    }

    // Final step — basic required-field check before hitting the network.
    if (!formData.contactName || !formData.contactEmail) {
      alert('Please enter your name and email so we can reach you.');
      return;
    }

    const btnLabel = modalNext.querySelector('span');
    const originalLabel = btnLabel.textContent;
    modalNext.disabled = true;
    btnLabel.textContent = 'Submitting…';

    try {
      await submitLead(formData);
      currentStep = 'success';
      updateModalStep();
    } catch (err) {
      console.error('ZENTRO lead submission failed:', err);
      alert("Something went wrong sending your brief. Please try again, or email us directly.");
    } finally {
      modalNext.disabled = false;
      btnLabel.textContent = originalLabel;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateModalStep();
    }
  }

  function collectStepData() {
    switch (currentStep) {
      case 2:
        formData.bizName = $('#bizName').value;
        formData.bizIndustry = $('#bizIndustry').value;
        formData.bizUrl = $('#bizUrl').value;
        break;
      case 3:
        formData.goals = $('#goals').value;
        break;
      case 6:
        formData.projectDesc = $('#projectDesc').value;
        break;
      case 7:
        formData.contactName = $('#contactName').value;
        formData.contactEmail = $('#contactEmail').value;
        formData.contactPhone = $('#contactPhone').value;
        const checked = $('input[name="contactMethod"]:checked');
        if (checked) formData.contactMethod = checked.value;
        break;
    }
  }

  function initModal() {
    // Open buttons
    const navCta = $('#navCta');
    const ignitionCta = $('#ignitionCta');

    if (navCta) navCta.addEventListener('click', () => requireAuthThenOpen());
    if (ignitionCta) ignitionCta.addEventListener('click', () => requireAuthThenOpen());

    // Panel CTAs
    $$('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preselect = btn.dataset.preselect;
        requireAuthThenOpen(preselect);
      });
    });

    // Close
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Nav
    modalNext.addEventListener('click', nextStep);
    modalBack.addEventListener('click', prevStep);
    if (modalDone) modalDone.addEventListener('click', closeModal);

    // Chips (multi-select)
    $$('.z-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-selected');
        const val = chip.dataset.value;
        if (chip.classList.contains('is-selected')) {
          if (!formData.services.includes(val)) formData.services.push(val);
        } else {
          formData.services = formData.services.filter(s => s !== val);
        }
      });
    });

    // Budget cards (single select)
    $$('.z-budget-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('.z-budget-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        formData.budget = card.dataset.value;
      });
    });

    // Timeline cards (single select)
    $$('.z-timeline-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('.z-timeline-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        formData.timeline = card.dataset.value;
      });
    });
  }

  // ─── SMOOTH SCROLL ──────────────────────────────────
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        const target = $(href);
        if (target) {
          e.preventDefault();
          const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ─── SCROLL-DRIVEN MARQUEE ───────────────────────────
  function initScrollMarquee() {
    const marquees = $$('.z-scroll-marquee');
    if (marquees.length === 0) return;

    let ticking = false;

    function updateMarquees() {
      const scrollY = window.scrollY;

      marquees.forEach((marquee) => {
        const rect = marquee.getBoundingClientRect();
        const windowH = window.innerHeight;

        // Only animate when near the viewport (performance)
        if (rect.top > windowH + 200 || rect.bottom < -200) return;

        const direction = marquee.dataset.direction || 'left';
        const speed = 0.15;
        const offset = scrollY * speed;

        // Alternate directions: left moves negative, right moves positive
        const translateX = direction === 'left' ? -(offset % 800) : (offset % 800) - 400;

        marquee.style.transform = `translateX(${translateX}px)`;
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateMarquees);
        ticking = true;
      }
    }, { passive: true });

    // Initial position
    updateMarquees();
  }

  // ─── INITIALIZE ─────────────────────────────────────
  async function init() {
    initScrollReveal();
    initWordReveal();
    initLineReveal();
    initCursorGlow();
    initNavScroll();
    initMobileNav();
    initServiceTabs();
    initModal();
    initSmoothScroll();
    initScrollMarquee();

    // Resolve auth state, then reopen the modal if the user just came back
    // from a Google sign-in redirect mid-flow.
    await getSession();
    const pending = sessionStorage.getItem(REOPEN_MODAL_KEY);
    if (pending !== null) {
      sessionStorage.removeItem(REOPEN_MODAL_KEY);
      if (currentSession) {
        openModal(pending === '__none__' ? undefined : pending);
      }
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

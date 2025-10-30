// Pequeno script para controlar o menu responsivo e comportamentos do site
(function () {
    'use strict';

    function $(selector) {
        return document.querySelector(selector);
    }

    window.toggleMenu = function () {
        const nav = $('#navLinks');
        const btn = $('#menuToggle');
        if (!nav) return;
        nav.classList.toggle('active');
        if (btn) {
            const isOpen = nav.classList.contains('active');
            btn.classList.toggle('open', isOpen);
            btn.setAttribute('aria-expanded', String(isOpen));
            btn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        }
    };

    window.closeMenu = function () {
        const nav = $('#navLinks');
        const btn = $('#menuToggle');
        if (!nav) return;
        nav.classList.remove('active');
        if (btn) {
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Abrir menu');
        }
    };

    // Fecha o menu ao clicar em qualquer link (útil para mobile)
    document.addEventListener('DOMContentLoaded', function () {
        // Configura o botão de toggle para usar JS em vez de onclick inline
        const menuBtn = document.getElementById('menuToggle');
        if (menuBtn) {
            menuBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.toggleMenu();
            });
        }

        // --- Simple carousel for skills ---
        (function initSkillsCarousel(){
            const track = document.querySelector('.carousel-track');
            const prevBtn = document.querySelector('.carousel-nav.prev');
            const nextBtn = document.querySelector('.carousel-nav.next');
            if (!track || !prevBtn || !nextBtn) return;

            const items = Array.from(track.children);
            let index = 0;

            function slidesPerView() {
                const w = window.innerWidth;
                if (w >= 1200) return 3;
                if (w >= 880) return 2;
                return 1;
            }

            function update() {
                const spv = slidesPerView();
                const card = items[0];
                const cardWidth = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 18);
                const shift = index * cardWidth;
                track.style.transform = `translateX(-${shift}px)`;
                prevBtn.disabled = index <= 0;
                nextBtn.disabled = index >= Math.max(0, items.length - spv);
            }

            prevBtn.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
            nextBtn.addEventListener('click', () => { index = Math.min(items.length - slidesPerView(), index + 1); update(); });

            window.addEventListener('resize', () => { index = Math.min(index, items.length - slidesPerView()); update(); });

            // keyboard support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') prevBtn.click();
                if (e.key === 'ArrowRight') nextBtn.click();
            });

            // initial
            setTimeout(update, 120);
        })();

        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => link.addEventListener('click', closeMenu));

        // Fecha o menu ao redimensionar para desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 968) closeMenu();
        });

        // Tratamento do formulário de contato: enviar via WhatsApp (cliente) ou fallback para abrir o email
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function (e) {
                e.preventDefault();

                // use HTML5 validation first (fields have required attribute)
                if (!contactForm.checkValidity()) {
                    contactForm.reportValidity();
                    return;
                }

                const name = (document.getElementById('name') || {}).value || '';
                const email = (document.getElementById('email') || {}).value || '';
                const message = (document.getElementById('message') || {}).value || '';

                // Build the message body
                const body = `Olá, meu nome é ${name}\nE-mail: ${email}\n\n${message}`;

                // ====== CONFIGURE AQUI: número de destino em formato internacional (ex: 55<ddd><numero>) ======
                // Substitua pelo seu número/cliente: exemplo Brasil: 5511999999999
                const WHATSAPP_TO = '+244925126963'; // <<-- altere para o número que deve receber a mensagem

                // Prefer WhatsApp (abre o chat com a mensagem pronta)
                const waUrl = `https://wa.me/${WHATSAPP_TO}?text=${encodeURIComponent(body)}`;

                // Fallback por email caso o usuário não queira/possa usar WhatsApp
                const MAIL_TO = 'anisiomunda@hotmail.com'; // <<-- altere para o e-mail destino
                const mailUrl = `mailto:${MAIL_TO}?subject=${encodeURIComponent('Contato via portfólio')}&body=${encodeURIComponent(body)}`;

                // Tentar abrir WhatsApp em nova aba/janela. Se preferir usar email por padrão, troque a ordem.
                try {
                    window.open(waUrl, '_blank');
                } catch (err) {
                    // se abertura for bloqueada, abrir mailto como fallback
                    window.location.href = mailUrl;
                }

                // limpa o formulário
                contactForm.reset();
            });
        }

        // Anima barras de progresso ao entrarem na viewport, com delay sequencial
        const skillProgresses = document.querySelectorAll('.skill-progress');
        if (skillProgresses.length && 'IntersectionObserver' in window) {
            const animateProgresses = (container) => {
                const progresses = Array.from(container.querySelectorAll('.skill-progress'));
                progresses.forEach((p, i) => {
                    const target = p.getAttribute('data-width') || '0%';
                    // staggered animation
                    setTimeout(() => {
                        p.style.width = target;
                        // accessibility: expose progress to assistive tech
                        p.setAttribute('role', 'progressbar');
                        const numeric = parseInt((target + '').replace('%',''),10) || 0;
                        p.setAttribute('aria-valuemin','0');
                        p.setAttribute('aria-valuemax','100');
                        p.setAttribute('aria-valuenow', String(numeric));
                        // optional: add a badge showing the percent
                        const percent = p.getAttribute('data-width') || '';
                        const parent = p.closest('.skill-item');
                        if (parent && !parent.querySelector('.skill-percent-badge')) {
                            const badge = document.createElement('div');
                            badge.className = 'skill-percent-badge';
                            badge.textContent = percent;
                            parent.appendChild(badge);
                        }
                    }, i * 120);
                });
            };

            const obs = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateProgresses(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });

            const aboutRight = document.querySelector('.about-right') || document.querySelector('.skills');
            if (aboutRight) obs.observe(aboutRight);
        } else {
            // fallback: apply widths immediately
            skillProgresses.forEach(p => {
                p.style.width = p.getAttribute('data-width') || p.style.width || '0%';
            });
        }

        // --- Transform .skill-bubble into horizontal animated progress bars ---
        (function animateSkillBubbles(){
            const bubbles = Array.from(document.querySelectorAll('.skill-bubble'));
            if (!bubbles.length) return;

            function setupBubble(bubble){
                // if already enhanced, skip
                if (bubble.querySelector('.skill-fill')) return;

                const percentEl = bubble.querySelector('.skill-percent');
                let percentText = (percentEl && percentEl.textContent) ? percentEl.textContent.trim() : '';
                // normalize to number (e.g. '95%' -> 95)
                let value = parseInt(percentText.replace('%',''), 10);
                if (isNaN(value)) value = 0;

                // create fill element
                const fill = document.createElement('div');
                fill.className = 'skill-fill';
                fill.setAttribute('aria-hidden','true');
                bubble.insertBefore(fill, bubble.firstChild);

                // ensure percentEl remains visible on top (we keep it for text)
                if (percentEl) percentEl.setAttribute('aria-hidden','true');

                // store target on dataset for later animation
                bubble.dataset.target = value + '%';
                bubble.dataset.targetNum = String(value);

                // accessibility wrapper on the bubble container
                bubble.setAttribute('role','progressbar');
                bubble.setAttribute('aria-valuemin','0');
                bubble.setAttribute('aria-valuemax','100');
                bubble.setAttribute('aria-valuenow', '0');
            }

            bubbles.forEach(setupBubble);

            function animateBubble(bubble, delay){
                const fill = bubble.querySelector('.skill-fill');
                const target = bubble.dataset.target || '0%';
                const targetNum = parseInt(bubble.dataset.targetNum || '0',10) || 0;
                if (!fill) return;
                setTimeout(() => {
                    fill.style.width = target;
                    bubble.setAttribute('aria-valuenow', String(targetNum));
                    // also reveal percent text if it was visually hidden by contrast
                    const p = bubble.querySelector('.skill-percent');
                    if (p) p.style.opacity = '1';
                }, delay || 0);
            }

            if ('IntersectionObserver' in window) {
                const obs = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const visibleBubbles = [entry.target];
                            visibleBubbles.forEach((b, i) => animateBubble(b, i * 120));
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.2 });

                bubbles.forEach(b => obs.observe(b));
            } else {
                // fallback: animate immediately with small stagger
                bubbles.forEach((b, i) => animateBubble(b, i * 80));
            }
        })();

        // Hero bubbles animation retired — no parallax JS is active.
    });
})();

// --- Projects filtering (lightweight) ---
(function projectsFilter(){
    const btns = Array.from(document.querySelectorAll('.filter-btn'));
    const cards = Array.from(document.querySelectorAll('.projects-grid .project-card'));
    if (!btns.length || !cards.length) return;

    function setActive(btn){
        btns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    }

    function applyFilter(filter){
        const f = (filter || 'all').toLowerCase();
        cards.forEach(c => {
            const tags = (c.dataset.tags || '').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
            const show = f === 'all' || tags.includes(f);
            c.style.display = show ? '' : 'none';
        });
        const countEl = document.querySelector('.projects-count');
        if (countEl) countEl.textContent = document.querySelectorAll('.projects-grid .project-card:not([style*="display: none"])').length + ' projetos';
    }

    btns.forEach(btn => btn.addEventListener('click', (e) => {
        const filter = btn.dataset.filter || 'all';
        setActive(btn);
        applyFilter(filter);
    }));

    // initial state
    const active = btns.find(b => b.classList.contains('active')) || btns[0];
    if (active) applyFilter(active.dataset.filter || 'all');
})();

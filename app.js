document.addEventListener('DOMContentLoaded', () => {
    const routeTo = (path) => {
        if (!path) return;
        window.location.href = path;
    };

    const showToast = (message) => {
        const existing = document.querySelector('.ux-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'ux-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 260);
        }, 1800);
    };

    const bindNavigation = (selector, path) => {
        document.querySelectorAll(selector).forEach((el) => {
            el.addEventListener('click', () => routeTo(path));
            el.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    routeTo(path);
                }
            });
        });
    };

    const bindFeedbackOnly = (selector, message) => {
        document.querySelectorAll(selector).forEach((el) => {
            el.addEventListener('click', (event) => {
                event.preventDefault();
                showToast(message);
            });
        });
    };

    const closeAllFilterDropdowns = () => {
        document.querySelectorAll('.filter-dropdown.is-open').forEach((dd) => {
            dd.classList.remove('is-open');
            const t = dd.querySelector('.filter-dropdown__trigger');
            const p = dd.querySelector('.filter-dropdown__panel');
            t?.setAttribute('aria-expanded', 'false');
            if (p) p.hidden = true;
        });
    };

    let headerPopoverTrigger = null;

    const closeChatModal = () => {
        const chat = document.getElementById('chatSupportModal');
        if (chat) chat.hidden = true;
        const lm = document.getElementById('locationModal');
        const pd = document.getElementById('personalDetailsModal');
        if ((!lm || lm.hidden) && (!pd || pd.hidden)) {
            document.body.style.overflow = '';
        }
    };

    const ensureChatModal = () => {
        if (document.getElementById('chatSupportModal')) return;
        const m = document.createElement('div');
        m.id = 'chatSupportModal';
        m.className = 'chat-modal';
        m.hidden = true;
        m.innerHTML = `
    <div class="chat-modal__panel" role="dialog" aria-modal="true" aria-labelledby="chatSupportModalTitle">
      <button type="button" class="chat-modal__close" id="chatSupportModalClose" aria-label="Close">&times;</button>
      <h2 id="chatSupportModalTitle" class="chat-modal__title">24/7 Chat support</h2>
      <p class="chat-modal__lead">Ask about your order, payment, or account. This is a demo — messages are not sent to a real agent.</p>
      <div class="chat-modal__chips">
        <button type="button" class="chat-modal__chip">Where is my order?</button>
        <button type="button" class="chat-modal__chip">Refund or missing items</button>
        <button type="button" class="chat-modal__chip">Speak to an agent</button>
      </div>
      <label class="chat-modal__label" for="chatModalInput">Message</label>
      <textarea id="chatModalInput" class="chat-modal__textarea" rows="3" placeholder="Type your message…"></textarea>
      <button type="button" class="chat-modal__send" id="chatModalSendBtn">Send message (demo)</button>
    </div>`;
        document.body.appendChild(m);
        document.getElementById('chatSupportModalClose')?.addEventListener('click', () => closeChatModal());
        m.querySelectorAll('.chat-modal__chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                showToast(`Support: “${chip.textContent.trim()}” (demo)`);
            });
        });
        document.getElementById('chatModalSendBtn')?.addEventListener('click', () => {
            const ta = document.getElementById('chatModalInput');
            const v = (ta?.value || '').trim();
            showToast(v ? `Message sent (demo): “${v.length > 48 ? `${v.slice(0, 48)}…` : v}”` : 'Type a message first.');
        });
    };

    const closePersonalDetailsModal = () => {
        const m = document.getElementById('personalDetailsModal');
        if (m) m.hidden = true;
        const chat = document.getElementById('chatSupportModal');
        const lm = document.getElementById('locationModal');
        if ((!chat || chat.hidden) && (!lm || lm.hidden)) {
            document.body.style.overflow = '';
        }
    };

    const openChatModal = () => {
        closeAllFilterDropdowns();
        closeHeaderPopover();
        closePersonalDetailsModal();
        const lm = document.getElementById('locationModal');
        if (lm && !lm.hidden) {
            document.getElementById('locationModalClose')?.click();
        }
        ensureChatModal();
        const chat = document.getElementById('chatSupportModal');
        if (chat) {
            chat.hidden = false;
            document.body.style.overflow = 'hidden';
        }
    };

    const closeHeaderPopover = () => {
        const pop = document.getElementById('headerPopover');
        if (pop) pop.hidden = true;
        document.querySelectorAll('[data-header-menu]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
        headerPopoverTrigger = null;
    };

    const ensureHeaderPopover = () => {
        let pop = document.getElementById('headerPopover');
        if (pop) return pop;
        pop = document.createElement('div');
        pop.id = 'headerPopover';
        pop.className = 'header-popover';
        pop.hidden = true;
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', 'Menu');
        pop.innerHTML = '<div class="header-popover__inner"></div>';
        pop.addEventListener('click', (e) => e.stopPropagation());
        document.body.appendChild(pop);
        return pop;
    };

    const getAccountDisplayName = (trigger) => {
        const fromAttr = trigger.dataset.userName?.trim();
        if (fromAttr) return fromAttr;
        const clone = trigger.cloneNode(true);
        clone.querySelectorAll('.icon, .badge').forEach((el) => el.remove());
        return clone.textContent.replace(/⌄/g, ' ').replace(/\s+/g, ' ').trim() || 'Guest';
    };

    const openHeaderPopover = (trigger, type) => {
        const templates = {
            account: '<h3 class="header-popover__title"></h3><p class="header-popover__muted">Signed in for faster checkout.</p><ul class="header-popover__list"><li><button type="button" class="header-popover__action">Orders</button></li><li><button type="button" class="header-popover__action">Addresses</button></li><li><button type="button" class="header-popover__action">Payment methods</button></li><li><button type="button" class="header-popover__action header-popover__action--danger">Log out</button></li></ul>',
            language: '<h3 class="header-popover__title">Language</h3><ul class="header-popover__list"><li><button type="button" class="header-popover__action is-active">English</button></li><li><button type="button" class="header-popover__action">Filipino</button></li></ul>',
            favorites: '<h3 class="header-popover__title">Favorites</h3><p class="header-popover__muted">No saved restaurants yet. Tap ♡ on a restaurant on the home page to save it here.</p>',
            cart: '<h3 class="header-popover__title">Your cart</h3><p class="header-popover__muted">1 item from <strong>Mang Inasal</strong></p><button type="button" class="header-popover__cta" data-go-checkout>Go to checkout</button>'
        };
        const pop = ensureHeaderPopover();
        const inner = pop.querySelector('.header-popover__inner');
        inner.innerHTML = templates[type] || '<p class="header-popover__muted">Menu</p>';
        if (type === 'account') {
            const titleEl = inner.querySelector('.header-popover__title');
            if (titleEl) titleEl.textContent = `Hi, ${getAccountDisplayName(trigger)}`;
        }
        inner.querySelectorAll('.header-popover__action').forEach((btn) => {
            btn.addEventListener('click', () => {
                showToast(`${btn.textContent.trim()} (demo)`);
                closeHeaderPopover();
            });
        });
        inner.querySelector('[data-go-checkout]')?.addEventListener('click', () => {
            closeHeaderPopover();
            window.location.href = '/checkout';
        });
        const rect = trigger.getBoundingClientRect();
        const w = 260;
        pop.style.width = `${w}px`;
        let left = rect.right - w;
        if (left < 12) left = 12;
        if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
        pop.style.top = `${rect.bottom + 8}px`;
        pop.style.left = `${left}px`;
        pop.hidden = false;
        headerPopoverTrigger = trigger;
        document.querySelectorAll('[data-header-menu]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
        trigger.setAttribute('aria-expanded', 'true');
    };

    document.querySelectorAll('[data-header-menu]').forEach((trigger) => {
        const type = trigger.dataset.headerMenu;
        if (!type) return;
        const onActivate = (e) => {
            if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
            if (e.type === 'keydown') e.preventDefault();
            e.stopPropagation();
            const pop = document.getElementById('headerPopover');
            if (pop && !pop.hidden && headerPopoverTrigger === trigger) {
                closeHeaderPopover();
                return;
            }
            closeAllFilterDropdowns();
            closePersonalDetailsModal();
            closeChatModal();
            openHeaderPopover(trigger, type);
        };
        trigger.addEventListener('click', onActivate);
        trigger.addEventListener('keydown', onActivate);
    });

    document.querySelectorAll('.chat-support').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openChatModal();
        });
    });

    const locationModal = document.getElementById('locationModal');
    const locationChangeBtn = document.getElementById('locationChangeBtn');
    const locationDisplay = document.getElementById('locationDisplay');
    const locationAddressInput = document.getElementById('locationAddressInput');

    if (locationModal && locationChangeBtn) {
        let focusReturn = null;

        const openLocationModal = () => {
            closeAllFilterDropdowns();
            closeHeaderPopover();
            closeChatModal();
            closePersonalDetailsModal();
            focusReturn = document.activeElement;
            locationModal.hidden = false;
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => locationAddressInput?.focus());
        };

        const closeLocationModal = () => {
            locationModal.hidden = true;
            const chat = document.getElementById('chatSupportModal');
            const pd = document.getElementById('personalDetailsModal');
            if ((!chat || chat.hidden) && (!pd || pd.hidden)) {
                document.body.style.overflow = '';
            }
            if (focusReturn && typeof focusReturn.focus === 'function') {
                focusReturn.focus();
            }
        };

        locationChangeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLocationModal();
        });

        document.getElementById('locationModalClose')?.addEventListener('click', () => closeLocationModal());

        locationModal.addEventListener('click', (e) => {
            if (e.target === locationModal) closeLocationModal();
        });

        const submitAddress = () => {
            const v = locationAddressInput?.value.trim() || '';
            if (v && locationDisplay) {
                locationDisplay.textContent = v;
                closeLocationModal();
            } else {
                showToast('Enter an address or choose a popular location.');
            }
        };

        document.getElementById('locationSubmitAddress')?.addEventListener('click', submitAddress);

        locationAddressInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitAddress();
            }
        });

        document.getElementById('locationLocateMe')?.addEventListener('click', () => {
            showToast('Locating you… (demo — no live GPS in this prototype.)');
        });

        document.getElementById('locationLoginLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Log in would open in the full app.');
        });

        locationModal.querySelectorAll('.location-modal__pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                const label = btn.dataset.location || btn.textContent.trim();
                if (locationDisplay) locationDisplay.textContent = label;
                if (locationAddressInput) locationAddressInput.value = '';
                closeLocationModal();
            });
        });
    }

    bindNavigation('.header-logo', '/');
    bindNavigation('.header-nav .nav-item:nth-child(3)', '/tracking');
    bindNavigation('.checkout-btn', '/tracking');
    bindNavigation('.add-more', '/');

    bindFeedbackOnly('#deliveryAddressChange', 'Change delivery area (demo — map picker in full app).');
    bindFeedbackOnly('#deliveryAddressEdit', 'Edit address on map (demo).');

    const personalDetailsModal = document.getElementById('personalDetailsModal');
    const personalDetailsOpen = document.getElementById('personalDetailsOpen');
    const checkoutDisplayName = document.getElementById('checkoutDisplayName');
    const checkoutDisplayEmail = document.getElementById('checkoutDisplayEmail');
    const checkoutDisplayPhone = document.getElementById('checkoutDisplayPhone');

    if (personalDetailsModal && personalDetailsOpen) {
        let personalDetailsFocusReturn = null;

        const openPersonalDetailsModal = () => {
            closeAllFilterDropdowns();
            closeHeaderPopover();
            const lm = document.getElementById('locationModal');
            if (lm && !lm.hidden) {
                document.getElementById('locationModalClose')?.click();
            }
            closeChatModal();
            personalDetailsFocusReturn = document.activeElement;
            personalDetailsModal.hidden = false;
            document.body.style.overflow = 'hidden';
            const nameEl = document.getElementById('pdFullName');
            const emailEl = document.getElementById('pdEmail');
            const phoneEl = document.getElementById('pdPhone');
            if (nameEl) nameEl.value = checkoutDisplayName?.textContent.trim() || '';
            if (emailEl) emailEl.value = checkoutDisplayEmail?.textContent.trim() || '';
            if (phoneEl) phoneEl.value = checkoutDisplayPhone?.textContent.trim() || '';
            requestAnimationFrame(() => nameEl?.focus());
        };

        personalDetailsOpen.addEventListener('click', (e) => {
            e.preventDefault();
            openPersonalDetailsModal();
        });

        document.getElementById('personalDetailsModalClose')?.addEventListener('click', () => closePersonalDetailsModal());

        personalDetailsModal.addEventListener('click', (e) => {
            if (e.target === personalDetailsModal) closePersonalDetailsModal();
        });

        document.getElementById('personalDetailsSave')?.addEventListener('click', () => {
            const name = document.getElementById('pdFullName')?.value.trim() || '';
            const email = document.getElementById('pdEmail')?.value.trim() || '';
            const phone = document.getElementById('pdPhone')?.value.trim() || '';
            if (!name || !phone) {
                showToast('Please enter your full name and mobile number.');
                return;
            }
            if (checkoutDisplayName) checkoutDisplayName.textContent = name;
            if (checkoutDisplayEmail) checkoutDisplayEmail.textContent = email || checkoutDisplayEmail.textContent;
            if (checkoutDisplayPhone) checkoutDisplayPhone.textContent = phone;
            showToast('Personal details saved.');
            closePersonalDetailsModal();
            if (personalDetailsFocusReturn && typeof personalDetailsFocusReturn.focus === 'function') {
                personalDetailsFocusReturn.focus();
            }
        });
    }

    document.getElementById('checkoutHeaderLocation')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Change delivery area (demo).');
    });

    document.querySelectorAll('.checkout-header .step').forEach((step, idx) => {
        step.setAttribute('role', 'button');
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', () => {
            showToast(`Checkout step ${idx + 1} (prototype). Finish delivery details before payment.`);
        });
        step.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                step.click();
            }
        });
    });

    const svgDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    const placeholderSvg = {
        hero: svgDataUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 420'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#ffe5ee'/><stop offset='100%' stop-color='#ffd3e5'/></linearGradient></defs><rect width='720' height='420' fill='url(#g)'/><circle cx='520' cy='205' r='130' fill='#ffffff'/><circle cx='470' cy='180' r='18' fill='#d70f64'/><circle cx='570' cy='180' r='18' fill='#d70f64'/><ellipse cx='520' cy='235' rx='58' ry='38' fill='#ff7cae'/><text x='40' y='360' font-size='44' fill='#d70f64' font-family='Arial,sans-serif'>Food delivery hero</text></svg>"),
        support: svgDataUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' rx='60' fill='#ffd2e4'/><circle cx='60' cy='62' r='34' fill='#fff'/><circle cx='46' cy='54' r='7' fill='#d70f64'/><circle cx='74' cy='54' r='7' fill='#d70f64'/><path d='M43 75c5 9 29 9 34 0' stroke='#d70f64' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"),
        category: svgDataUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'><rect width='200' height='140' rx='16' fill='#ffe5ee'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='20' font-family='Arial,sans-serif' fill='#d70f64'>Food Item</text></svg>"),
        restaurant: svgDataUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><defs><linearGradient id='r' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#ffc7dc'/><stop offset='100%' stop-color='#ffe9f2'/></linearGradient></defs><rect width='640' height='360' fill='url(#r)'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='42' font-family='Arial,sans-serif' fill='#a80f50'>Restaurant Image</text></svg>")
    };

    const applyImageFallback = (img) => {
        const src = (img.getAttribute('src') || '').toLowerCase();
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        let fallback = placeholderSvg.restaurant;

        if (src.includes('panda_hero') || alt.includes('mascot')) {
            fallback = placeholderSvg.hero;
        } else if (src.includes('panda_support') || src.includes('support.png') || alt.includes('support')) {
            fallback = placeholderSvg.support;
        } else if (src.includes('cat_') || img.closest('.cat-image-wrapper')) {
            fallback = placeholderSvg.category;
        }

        img.onerror = null;
        img.src = fallback;
    };

    document.querySelectorAll('img').forEach((img) => {
        img.addEventListener('error', () => applyImageFallback(img));
        if (img.complete && img.naturalWidth === 0) {
            applyImageFallback(img);
        }
    });

    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });

    const options = document.querySelectorAll('.option-btn');
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const parent = opt.closest('.options-grid, .payment-grid');
            if (parent) {
                parent.querySelectorAll('.option-btn').forEach(sib => {
                    sib.classList.remove('active');
                    const radio = sib.querySelector('.radio');
                    if(radio) radio.classList.remove('selected');
                });
            }
            opt.classList.add('active');
            const radio = opt.querySelector('.radio');
            if(radio) radio.classList.add('selected');
        });
    });

    const restaurantCards = [...document.querySelectorAll('.restaurant-card')];
    const searchInput = document.getElementById('restaurantSearch');
    const filterButtons = [...document.querySelectorAll('.filter-control')];
    const emptyState = document.getElementById('emptyState');
    const activeFilters = new Set();

    const updateRestaurantResults = () => {
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let visibleCount = 0;

        restaurantCards.forEach((card) => {
            const name = (card.dataset.name || '').toLowerCase();
            const tags = (card.dataset.tags || '').toLowerCase();
            const rating = Number(card.dataset.rating || '0');
            const matchesSearch = !keyword || name.includes(keyword) || tags.includes(keyword);

            const matchesFilters = [...activeFilters].every((filter) => {
                if (filter === 'rating4') return rating >= 4;
                if (filter === 'free-delivery') return tags.includes('free delivery');
                if (filter === 'top-offers') return tags.includes('top offers');
                return tags.includes(filter.toLowerCase());
            });

            const shouldShow = matchesSearch && matchesFilters;
            card.hidden = !shouldShow;
            if (shouldShow) visibleCount += 1;
        });

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    };

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filterName = button.dataset.filter;
            if (!filterName) return;

            closeAllFilterDropdowns();

            if (activeFilters.has(filterName)) {
                activeFilters.delete(filterName);
                button.classList.remove('active-filter');
            } else {
                activeFilters.add(filterName);
                button.classList.add('active-filter');
            }
            if (filterName === 'rating4') {
                button.setAttribute('aria-pressed', activeFilters.has(filterName) ? 'true' : 'false');
            }
            updateRestaurantResults();
        });
    });

    document.querySelectorAll('.filter-dropdown').forEach((dd) => {
        const trigger = dd.querySelector('.filter-dropdown__trigger');
        const panel = dd.querySelector('.filter-dropdown__panel');
        if (!trigger || !panel) return;

        panel.addEventListener('click', (e) => e.stopPropagation());

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const willOpen = !dd.classList.contains('is-open');
            closeAllFilterDropdowns();
            if (willOpen) {
                dd.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                panel.hidden = false;
            }
        });

        panel.querySelectorAll('.filter-dropdown__option[role="menuitem"]').forEach((opt) => {
            opt.addEventListener('click', () => {
                showToast(`Price filter: ${opt.textContent.trim()}`);
                closeAllFilterDropdowns();
            });
        });

        const applyBtn = panel.querySelector('.filter-dropdown__apply');
        applyBtn?.addEventListener('click', () => {
            const checked = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map((inp) => {
                const lb = inp.closest('label');
                return lb ? lb.textContent.replace(/\s+/g, ' ').trim() : '';
            });
            showToast(checked.length ? `More filters applied: ${checked.join(' · ')}` : 'Select options, then tap Apply.');
            closeAllFilterDropdowns();
        });
    });

    const onDocumentUiClick = (e) => {
        closeAllFilterDropdowns();
        const pop = document.getElementById('headerPopover');
        if (pop && !pop.hidden) {
            if (!pop.contains(e.target) && !e.target.closest('[data-header-menu]')) {
                closeHeaderPopover();
            }
        }
        const chat = document.getElementById('chatSupportModal');
        if (chat && !chat.hidden && e.target === chat) {
            closeChatModal();
        }
    };
    document.addEventListener('click', onDocumentUiClick);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const chat = document.getElementById('chatSupportModal');
        if (chat && !chat.hidden) {
            closeChatModal();
            return;
        }
        const pdModal = document.getElementById('personalDetailsModal');
        if (pdModal && !pdModal.hidden) {
            closePersonalDetailsModal();
            return;
        }
        const lm = document.getElementById('locationModal');
        if (lm && !lm.hidden) {
            document.getElementById('locationModalClose')?.click();
            return;
        }
        const pop = document.getElementById('headerPopover');
        if (pop && !pop.hidden) {
            closeHeaderPopover();
            return;
        }
        closeAllFilterDropdowns();
    });

    restaurantCards.forEach((card) => {
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                card.click();
            }
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', updateRestaurantResults);
    }

    const orderSummaryToggle = document.getElementById('orderSummaryToggle');
    const orderSummaryBody = document.getElementById('orderSummaryBody');
    if (orderSummaryToggle && orderSummaryBody) {
        orderSummaryToggle.addEventListener('click', () => {
            const expanded = orderSummaryToggle.getAttribute('aria-expanded') === 'true';
            orderSummaryToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            orderSummaryBody.hidden = expanded;
        });
    }

    updateRestaurantResults();
});

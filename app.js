document.addEventListener('DOMContentLoaded', () => {
    const showToast = (message) => {
        const old = document.querySelector('.ux-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = 'ux-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => toast.remove(), 1800);
    };

    const bindNavigation = (selector, path) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('click', () => {
                window.location.href = path;
            });

            el.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = path;
                }
            });
        });
    };

    /* HOME PAGE SEARCH + FILTER */

    const restaurantCards = [...document.querySelectorAll('.restaurant-card')];
    const restaurantSearch = document.getElementById('restaurantSearch');
    const filterButtons = [...document.querySelectorAll('.filter-control')];
    const emptyState = document.getElementById('emptyState');
    const activeFilters = new Set();

    const updateResults = () => {
        if (!restaurantCards.length) return;

        const keyword = restaurantSearch?.value.toLowerCase() || '';
        let visible = 0;

        restaurantCards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const tags = (card.dataset.tags || '').toLowerCase();
            const rating = Number(card.dataset.rating || 0);

            const matchesSearch = !keyword || name.includes(keyword) || tags.includes(keyword);

            const matchesFilters = [...activeFilters].every(filter => {
                if (filter === 'rating4') return rating >= 4;
                if (filter === 'free-delivery') return tags.includes('free delivery');
                if (filter === 'top-offers') return tags.includes('top offers');
                return tags.includes(filter.toLowerCase());
            });

            const shouldShow = matchesSearch && matchesFilters;
            card.hidden = !shouldShow;

            if (shouldShow) visible++;
        });

        if (emptyState) emptyState.hidden = visible > 0;
    };

    restaurantSearch?.addEventListener('input', updateResults);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            if (!filter) return;

            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
                btn.classList.remove('active-filter');
            } else {
                activeFilters.add(filter);
                btn.classList.add('active-filter');
            }

            updateResults();
        });
    });

    /* HOME PAGE DROPDOWNS */

    const closeDropdowns = () => {
        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            dropdown.classList.remove('is-open');

            const trigger = dropdown.querySelector('.filter-dropdown__trigger');
            const panel = dropdown.querySelector('.filter-dropdown__panel');

            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            if (panel) panel.hidden = true;
        });
    };

    document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.filter-dropdown__trigger');
        const panel = dropdown.querySelector('.filter-dropdown__panel');

        if (!trigger || !panel) return;

        trigger.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = dropdown.classList.contains('is-open');

            closeDropdowns();

            if (!isOpen) {
                dropdown.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                panel.hidden = false;
            }
        });

        panel.addEventListener('click', e => {
            e.stopPropagation();
        });

        panel.querySelectorAll('.filter-dropdown__option').forEach(option => {
            option.addEventListener('click', () => {
                showToast(`${option.textContent.trim()} selected`);
                closeDropdowns();
            });
        });

        panel.querySelector('.filter-dropdown__apply')?.addEventListener('click', () => {
            showToast('Filters applied');
            closeDropdowns();
        });
    });

    document.addEventListener('click', closeDropdowns);

    /* LOCATION MODAL */

    const locationModal = document.getElementById('locationModal');
    const locationChangeBtn = document.getElementById('locationChangeBtn');
    const locationDisplay = document.getElementById('locationDisplay');
    let locationMap = null;
    let locationMarker = null;
    let pinnedLat = null;
    let pinnedLng = null;
    let previewMap = null;
    let previewMarker = null;

    const ensurePreviewMap = () => {
        const previewContainer = document.getElementById('deliveryAddressMap');
        if (!previewContainer || !window.L || previewMap) return;

        previewMap = window.L.map('deliveryAddressMap', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false,
            touchZoom: false
        }).setView([13.40755, 123.37466], 15);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(previewMap);

        previewMarker = window.L.marker([13.40755, 123.37466]).addTo(previewMap);
    };

    const setPreviewMapPin = (lat, lng) => {
        ensurePreviewMap();
        if (!previewMap || !previewMarker) return;
        previewMap.setView([lat, lng], previewMap.getZoom());
        previewMarker.setLatLng([lat, lng]);
    };

    const updatePinPreview = (lat, lng) => {
        const shortLat = lat.toFixed(5);
        const shortLng = lng.toFixed(5);
        const selectedText = document.getElementById('selectedLocationText');
        const caption = document.getElementById('locationCaption');
        if (selectedText) selectedText.textContent = `Pinned at ${shortLat}, ${shortLng}`;
        if (caption) caption.textContent = `Selected map point: ${shortLat}, ${shortLng}`;
    };

    const updateLocationDisplays = (titleText, subtitleText) => {
        if (locationDisplay) locationDisplay.textContent = titleText;

        const headerLocationText = document.querySelector('.checkout-location-text');
        if (headerLocationText) headerLocationText.textContent = titleText;

        const deliveryAddressTitle = document.getElementById('deliveryAddressTitle') || document.querySelector('.address-info h4');
        if (deliveryAddressTitle) {
            deliveryAddressTitle.innerHTML = `<span class="icon text-primary">📍</span> ${titleText}`;
        }

        const deliveryAddressLine = document.getElementById('deliveryAddressLine') || document.querySelector('.address-info p.text-muted');
        if (deliveryAddressLine) deliveryAddressLine.textContent = subtitleText;
    };

    const openLocationModal = () => {
        if (!locationModal) return;
        locationModal.hidden = false;
        document.body.style.overflow = 'hidden';

        const mapContainer = document.getElementById('liveMap');
        if (!mapContainer || !window.L) return;

        if (!locationMap) {
            locationMap = window.L.map('liveMap').setView([13.4090, 123.3720], 15);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(locationMap);

            locationMap.on('click', (event) => {
                const { lat, lng } = event.latlng;
                pinnedLat = lat;
                pinnedLng = lng;

                if (!locationMarker) {
                    locationMarker = window.L.marker([lat, lng], { draggable: true }).addTo(locationMap);
                    locationMarker.on('dragend', () => {
                        const point = locationMarker.getLatLng();
                        pinnedLat = point.lat;
                        pinnedLng = point.lng;
                        updatePinPreview(point.lat, point.lng);
                    });
                } else {
                    locationMarker.setLatLng([lat, lng]);
                }

                updatePinPreview(lat, lng);
                setPreviewMapPin(lat, lng);
            });
        }

        setTimeout(() => locationMap?.invalidateSize(), 120);
    };

    const closeLocationModal = () => {
        if (!locationModal) return;
        locationModal.hidden = true;
        document.body.style.overflow = '';
    };

    locationChangeBtn?.addEventListener('click', e => {
        e.preventDefault();
        openLocationModal();
    });

    document.getElementById('locationModalClose')?.addEventListener('click', () => {
        closeLocationModal();
    });

    locationModal?.addEventListener('click', e => {
        if (e.target === locationModal) {
            closeLocationModal();
        }
    });

    document.querySelectorAll('.location-modal__pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const selectedLocation = pill.dataset.location || pill.textContent.trim();
            updateLocationDisplays(selectedLocation, 'Selected from quick locations');
            if (pinnedLat !== null && pinnedLng !== null) {
                setPreviewMapPin(pinnedLat, pinnedLng);
            }
            closeLocationModal();
        });
    });

    document.getElementById('locationLocateMe')?.addEventListener('click', () => {
        showToast('Locating you... demo only');
    });

    document.getElementById('locationSubmitAddress')?.addEventListener('click', () => {
        const input = document.getElementById('locationAddressInput');
        const value = input?.value.trim();

        if (value) {
            updateLocationDisplays(value, 'Updated from typed delivery address');
            try { localStorage.setItem('deliveryAddressText', value); } catch (_e) {}
            closeLocationModal();
            return;
        }

        if (pinnedLat !== null && pinnedLng !== null) {
            const pinText = `${pinnedLat.toFixed(5)}, ${pinnedLng.toFixed(5)}`;
            updateLocationDisplays(`Pinned Location (${pinText})`, `Coordinates: ${pinText}`);
            setPreviewMapPin(pinnedLat, pinnedLng);
            try { localStorage.setItem('deliveryPin', JSON.stringify({ lat: pinnedLat, lng: pinnedLng })); } catch (_e) {}
            closeLocationModal();
            return;
        }

        showToast('Please enter an address or pin a location on the map.');
    });

    /* CHAT SUPPORT */

    const ensureChatModal = () => {
        let chatModal = document.getElementById('chatModal');
        if (chatModal) return chatModal;

        const modalMarkup = `
            <div id="chatModal" class="chat-modal" role="dialog" aria-modal="true" aria-labelledby="chatModalTitle" hidden>
                <div class="chat-modal__panel">
                    <button type="button" class="chat-modal__close" id="chatModalClose" aria-label="Close">&times;</button>
                    <h2 id="chatModalTitle" class="chat-modal__title">How can we help?</h2>
                    <p class="chat-modal__lead">Choose a quick concern or send a message and support will get back to you.</p>
                    <div class="chat-modal__chips">
                        <button type="button" class="chat-modal__chip">Order status</button>
                        <button type="button" class="chat-modal__chip">Payment issue</button>
                        <button type="button" class="chat-modal__chip">Cancel order</button>
                        <button type="button" class="chat-modal__chip">Promo concerns</button>
                    </div>
                    <label class="chat-modal__label" for="chatMessageInput">Message</label>
                    <textarea id="chatMessageInput" class="chat-modal__textarea" rows="4" placeholder="Type your concern here..."></textarea>
                    <button type="button" class="chat-modal__send" id="chatSendBtn">Send message</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalMarkup);
        return document.getElementById('chatModal');
    };

    const openChatModal = () => {
        const chatModal = ensureChatModal();
        if (!chatModal) return;
        chatModal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    const closeChatModal = () => {
        const chatModal = document.getElementById('chatModal');
        if (!chatModal) return;
        chatModal.hidden = true;
        document.body.style.overflow = '';
    };

    document.querySelectorAll('.chat-support').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openChatModal();
        });
    });

    document.addEventListener('click', e => {
        const target = e.target;
        if (!(target instanceof Element)) return;

        if (target.id === 'chatModalClose') {
            closeChatModal();
            return;
        }

        const chatModal = document.getElementById('chatModal');
        if (target === chatModal) {
            closeChatModal();
            return;
        }

        if (target.classList.contains('chat-modal__chip')) {
            const input = document.getElementById('chatMessageInput');
            if (input instanceof HTMLTextAreaElement) {
                input.value = target.textContent?.trim() || '';
                input.focus();
            }
            return;
        }

        if (target.id === 'chatSendBtn') {
            const input = document.getElementById('chatMessageInput');
            const message = input instanceof HTMLTextAreaElement ? input.value.trim() : '';

            if (!message) {
                showToast('Please enter your concern first.');
                return;
            }

            showToast('Message sent. Our support team will reply soon.');
            if (input instanceof HTMLTextAreaElement) input.value = '';
            closeChatModal();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const chatModal = document.getElementById('chatModal');
        if (chatModal && !chatModal.hidden) {
            closeChatModal();
        }
    });

    /* CHECKOUT / REVIEW PAGE BUTTONS */

    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.options-grid, .payment-grid');
            if (!parent) return;

            parent.querySelectorAll('.option-btn').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.radio')?.classList.remove('selected');
            });

            btn.classList.add('active');
            btn.querySelector('.radio')?.classList.add('selected');
        });
    });

    /* REVIEW PAGE ACTIONS */

    const personalDetailsModal = document.getElementById('personalDetailsModal');

    const openPersonalDetailsModal = () => {
        if (!personalDetailsModal) return;
        const nameInput = document.getElementById('pdFullName');
        const emailInput = document.getElementById('pdEmail');
        const phoneInput = document.getElementById('pdPhone');

        const displayName = document.getElementById('checkoutDisplayName')?.textContent?.trim() || '';
        const displayEmail = document.getElementById('checkoutDisplayEmail')?.textContent?.trim() || '';
        const displayPhone = document.getElementById('checkoutDisplayPhone')?.textContent?.trim() || '';

        if (nameInput) nameInput.value = displayName;
        if (emailInput) emailInput.value = displayEmail;
        if (phoneInput) phoneInput.value = displayPhone;

        personalDetailsModal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    const closePersonalDetailsModal = () => {
        if (!personalDetailsModal) return;
        personalDetailsModal.hidden = true;
        document.body.style.overflow = '';
    };

    document.getElementById('personalDetailsOpen')?.addEventListener('click', e => {
        e.preventDefault();
        openPersonalDetailsModal();
    });

    document.getElementById('personalDetailsModalClose')?.addEventListener('click', closePersonalDetailsModal);

    personalDetailsModal?.addEventListener('click', e => {
        if (e.target === personalDetailsModal) closePersonalDetailsModal();
    });

    document.getElementById('personalDetailsSave')?.addEventListener('click', () => {
        const nameInput = document.getElementById('pdFullName');
        const emailInput = document.getElementById('pdEmail');
        const phoneInput = document.getElementById('pdPhone');

        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();
        const phone = phoneInput?.value.trim();

        if (name) document.getElementById('checkoutDisplayName').textContent = name;
        if (email) document.getElementById('checkoutDisplayEmail').textContent = email;
        if (phone) document.getElementById('checkoutDisplayPhone').textContent = phone;

        closePersonalDetailsModal();
        showToast('Personal details updated.');
    });

    document.getElementById('deliveryAddressChange')?.addEventListener('click', e => {
        e.preventDefault();
        if (locationModal) return openLocationModal();
        showToast('Address change is unavailable on this page.');
    });

    document.getElementById('deliveryAddressEdit')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('deliveryAddressChange')?.click();
    });

    document.getElementById('checkoutHeaderLocation')?.addEventListener('click', e => {
        e.preventDefault();
        if (locationModal) return openLocationModal();
        showToast('Location picker is unavailable on this page.');
    });

    document.querySelector('.order-summary .checkout-btn')?.addEventListener('click', () => {
        showToast('Placing your order...');
    });

    ensurePreviewMap();

    let currentReviewPayload = null;

    const saveReviewPayload = (payload) => {
        try {
            localStorage.setItem('checkoutCart', JSON.stringify(payload));
        } catch (_error) {}
        try {
            sessionStorage.setItem('checkoutCart', JSON.stringify(payload));
        } catch (_error) {}
    };

    const renderReviewPayload = (payload) => {
        const orderItemsContainer = document.getElementById('reviewOrderItems');
        if (!orderItemsContainer) return;
        orderItemsContainer.innerHTML = '';

        const restaurantName = document.getElementById('reviewRestaurantName');
        const restaurantLogo = document.getElementById('reviewRestaurantLogo');
        if (!payload || !Array.isArray(payload.items) || !payload.items.length) {
            if (restaurantName) restaurantName.innerHTML = '<strong>No active order</strong>';
            if (orderItemsContainer) {
                orderItemsContainer.innerHTML = '<p class="text-muted">No checkout data found. Please add items first.</p>';
            }
            const subtotalEl = document.getElementById('reviewSubtotal');
            const serviceFeeEl = document.getElementById('reviewServiceFee');
            const grandTotalEl = document.getElementById('reviewGrandTotal');
            const placeOrderBtn = document.getElementById('reviewPlaceOrderBtn');
            if (subtotalEl) subtotalEl.textContent = '₱0';
            if (serviceFeeEl) serviceFeeEl.textContent = 'Free';
            if (grandTotalEl) grandTotalEl.textContent = '₱ 0';
            if (placeOrderBtn) placeOrderBtn.textContent = 'Place Order ₱ 0';
            return;
        }

        if (restaurantName) restaurantName.innerHTML = `<strong>${payload.restaurantName || 'Restaurant'}</strong>`;
        if (restaurantLogo && payload.restaurantLogo) restaurantLogo.src = payload.restaurantLogo;

        orderItemsContainer.innerHTML = payload.items.map((item, index) => `
            <div class="item">
                <div class="item-qty">${item.qty} ✕</div>
                <div class="item-desc">
                    <strong>${item.name}</strong>
                    ${item.img ? `<div class="food-thumb-small"><img src="${item.img}" alt="${item.name}"></div>` : ''}
                    ${item.addons?.length ? `<div class="text-muted text-sm">${item.addons.join(', ')}</div>` : ''}
                </div>
                <div class="item-price">₱ ${item.price}</div>
            </div>
            ${index < payload.items.length - 1 ? '<hr class="divider">' : ''}
        `).join('');

        const subtotal = Number(payload.total || 0);
        const serviceFee = subtotal > 0 ? 5 : 0;
        const grandTotal = subtotal + serviceFee;

        const subtotalEl = document.getElementById('reviewSubtotal');
        const serviceFeeEl = document.getElementById('reviewServiceFee');
        const grandTotalEl = document.getElementById('reviewGrandTotal');
        const placeOrderBtn = document.getElementById('reviewPlaceOrderBtn');
        if (subtotalEl) subtotalEl.textContent = `₱${subtotal}`;
        if (serviceFeeEl) serviceFeeEl.textContent = serviceFee > 0 ? `₱${serviceFee}` : 'Free';
        if (grandTotalEl) grandTotalEl.textContent = `₱ ${grandTotal}`;
        if (placeOrderBtn) placeOrderBtn.textContent = `Place Order ₱ ${grandTotal}`;

        const addMore = document.getElementById('reviewAddMore');
        if (addMore && payload.restaurantKey) {
            addMore.setAttribute('href', '#');
        }
    };

    const hydrateReviewOrder = () => {
        const params = new URLSearchParams(window.location.search);
        let payload = null;
        const cartParam = params.get('cart');

        if (cartParam) {
            try {
                payload = JSON.parse(atob(decodeURIComponent(cartParam)));
            } catch {
                payload = null;
            }
        }

        try {
            if (!payload) {
                const sessionPayload = sessionStorage.getItem('checkoutCart');
                const localPayload = localStorage.getItem('checkoutCart');
                payload = JSON.parse(sessionPayload || localPayload || 'null');
            }
        } catch {
            payload = null;
        }

        currentReviewPayload = payload;
        renderReviewPayload(payload);
    };

    const reviewAddItemModal = document.getElementById('reviewAddItemModal');
    const reviewAddItemList = document.getElementById('reviewAddItemList');
    const reviewAddQtyByName = {};

    const getReviewAddQty = (name) => {
        if (!reviewAddQtyByName[name]) reviewAddQtyByName[name] = 1;
        return reviewAddQtyByName[name];
    };

    const renderReviewAddItemList = () => {
        if (!reviewAddItemList || !currentReviewPayload?.menuItems?.length) return;
        reviewAddItemList.innerHTML = currentReviewPayload.menuItems.map(item => {
            const qty = getReviewAddQty(item.name);
            return `
                <div class="row" style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:8px; border:1px solid #eee; border-radius:10px;">
                    <img src="${item.img}" alt="${item.name}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;">
                    <div style="flex:1; min-width:0;">
                        <strong style="display:block;">${item.name}</strong>
                        <div class="text-muted text-sm">₱${item.price}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
                        <button type="button" data-review-qty-minus="${item.name}" style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;">-</button>
                        <span style="min-width:16px; text-align:center; font-weight:700;">${qty}</span>
                        <button type="button" data-review-qty-plus="${item.name}" style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;">+</button>
                    </div>
                    <button type="button" class="primary-btn" data-review-add-item="${item.name}" style="padding:8px 12px;font-size:14px; white-space:nowrap;">Add</button>
                </div>
            `;
        }).join('');
    };

    const openReviewAddItemModal = () => {
        if (!reviewAddItemModal || !reviewAddItemList || !currentReviewPayload?.menuItems?.length) return;
        renderReviewAddItemList();
        reviewAddItemModal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    const closeReviewAddItemModal = () => {
        if (!reviewAddItemModal) return;
        reviewAddItemModal.hidden = true;
        document.body.style.overflow = '';
    };

    document.getElementById('reviewAddMore')?.addEventListener('click', e => {
        e.preventDefault();
        openReviewAddItemModal();
    });

    document.getElementById('reviewAddItemModalClose')?.addEventListener('click', closeReviewAddItemModal);
    reviewAddItemModal?.addEventListener('click', e => {
        if (e.target === reviewAddItemModal) closeReviewAddItemModal();
    });

    document.addEventListener('click', e => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const qtyPlusName = target.dataset.reviewQtyPlus;
        if (qtyPlusName) {
            reviewAddQtyByName[qtyPlusName] = getReviewAddQty(qtyPlusName) + 1;
            renderReviewAddItemList();
            return;
        }

        const qtyMinusName = target.dataset.reviewQtyMinus;
        if (qtyMinusName) {
            reviewAddQtyByName[qtyMinusName] = Math.max(1, getReviewAddQty(qtyMinusName) - 1);
            renderReviewAddItemList();
            return;
        }

        const name = target.dataset.reviewAddItem;
        if (!name || !currentReviewPayload?.menuItems?.length) return;

        const match = currentReviewPayload.menuItems.find(item => item.name === name);
        if (!match) return;

        const qtyToAdd = getReviewAddQty(name);
        const itemTotal = Number(match.price) * qtyToAdd;
        currentReviewPayload.items.push({
            name: match.name,
            price: itemTotal,
            qty: qtyToAdd,
            img: match.img,
            addons: []
        });
        currentReviewPayload.total = currentReviewPayload.items.reduce((sum, item) => sum + Number(item.price || 0), 0);
        saveReviewPayload(currentReviewPayload);
        renderReviewPayload(currentReviewPayload);
        showToast(`${match.name} x${qtyToAdd} added to order.`);
    });

    hydrateReviewOrder();

    /* CONFIRM PAYMENT (REVIEW PAGE) */

    const confirmPaymentModal = document.getElementById('confirmPaymentModal');
    const openConfirmPaymentModal = () => {
        if (!confirmPaymentModal || !currentReviewPayload?.items?.length) return;

        const restaurantNameText = (currentReviewPayload.restaurantName || '').trim() || 'Restaurant';
        const total = Number(currentReviewPayload.total || 0);
        const serviceFee = total > 0 ? 5 : 0;
        const grandTotal = total + serviceFee;

        const activePayment = document.querySelector('.payment-grid .option-btn.active');
        const paymentMethod = activePayment ? activePayment.textContent.replace(/\s+/g, ' ').trim() : 'Selected method';

        document.getElementById('confirmPayRestaurant').textContent = restaurantNameText;
        document.getElementById('confirmPayMethod').textContent = paymentMethod;
        document.getElementById('confirmPayTotal').textContent = `₱ ${grandTotal}`;
        document.getElementById('confirmPaySubtotal').textContent = `₱${total}`;
        document.getElementById('confirmPayFee').textContent = serviceFee > 0 ? `₱${serviceFee}` : 'Free';

        const itemsEl = document.getElementById('confirmPayItems');
        if (itemsEl) {
            itemsEl.innerHTML = currentReviewPayload.items.map(item => `
                <div class="confirm-pay__item">
                    <div class="confirm-pay__thumb">${item.img ? `<img src="${item.img}" alt="${item.name}">` : ''}</div>
                    <div>
                        <div class="confirm-pay__name">${item.qty}× ${item.name}</div>
                        ${item.addons?.length ? `<div class="confirm-pay__sub">${item.addons.join(', ')}</div>` : `<div class="confirm-pay__sub"> </div>`}
                    </div>
                    <div class="confirm-pay__price">₱ ${item.price}</div>
                </div>
            `).join('');
        }

        confirmPaymentModal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    const closeConfirmPaymentModal = () => {
        if (!confirmPaymentModal) return;
        confirmPaymentModal.hidden = true;
        document.body.style.overflow = '';
    };

    document.getElementById('reviewPlaceOrderBtn')?.addEventListener('click', () => {
        openConfirmPaymentModal();
    });

    document.getElementById('confirmPaymentClose')?.addEventListener('click', closeConfirmPaymentModal);
    document.getElementById('confirmPaymentCancel')?.addEventListener('click', closeConfirmPaymentModal);
    confirmPaymentModal?.addEventListener('click', e => {
        if (e.target === confirmPaymentModal) closeConfirmPaymentModal();
    });

    const placeOrderAndGoOngoing = () => {
        if (!currentReviewPayload?.items?.length) return;

        const ordersKey = 'orders';
        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
            if (!Array.isArray(orders)) orders = [];
        } catch {
            orders = [];
        }

        const id = `ord_${Date.now()}`;
        const serviceFee = Number(currentReviewPayload.total || 0) > 0 ? 5 : 0;
        let deliveryPin = null;
        let deliveryAddressText = null;
        try { deliveryPin = JSON.parse(localStorage.getItem('deliveryPin') || 'null'); } catch { deliveryPin = null; }
        try { deliveryAddressText = localStorage.getItem('deliveryAddressText'); } catch { deliveryAddressText = null; }

        const orderRecord = {
            id,
            status: 'ongoing',
            createdAt: Date.now(),
            restaurantKey: currentReviewPayload.restaurantKey,
            restaurantName: currentReviewPayload.restaurantName,
            restaurantLogo: currentReviewPayload.restaurantLogo,
            items: currentReviewPayload.items,
            total: Number(currentReviewPayload.total || 0),
            serviceFee,
            deliveryPin,
            deliveryAddressText
        };

        orders.unshift(orderRecord);
        try { localStorage.setItem(ordersKey, JSON.stringify(orders)); } catch (_e) {}
        try { localStorage.setItem('lastOrderId', id); } catch (_e) {}

        // Clear checkoutCart so next session starts clean
        try { sessionStorage.removeItem('checkoutCart'); } catch (_e) {}
        try { localStorage.removeItem('checkoutCart'); } catch (_e) {}

        window.location.href = '/ongoing';
    };

    document.getElementById('confirmPaymentConfirm')?.addEventListener('click', () => {
        closeConfirmPaymentModal();
        placeOrderAndGoOngoing();
    });

    /* ONGOING ORDERS PAGE */

    const hydrateOngoingOrders = () => {
        const ongoingCard = document.getElementById('ongoingOrderCard');
        if (!ongoingCard) return;

        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('orders') || '[]');
            if (!Array.isArray(orders)) orders = [];
        } catch {
            orders = [];
        }

        const lastId = localStorage.getItem('lastOrderId');
        const ongoing = orders.find(o => o.status === 'ongoing' && (!lastId || o.id === lastId)) || orders.find(o => o.status === 'ongoing');

        const nameEl = document.getElementById('ongoingRestaurantName');
        const metaEl = document.getElementById('ongoingOrderMeta');
        const logoEl = document.getElementById('ongoingRestaurantLogo');
        const trackBtn = document.getElementById('trackOrderBtn');

        if (!ongoing) {
            if (nameEl) nameEl.textContent = 'No active order';
            if (metaEl) metaEl.textContent = 'Place an order to see it here.';
            if (trackBtn) trackBtn.disabled = true;
            return;
        }

        if (nameEl) nameEl.textContent = ongoing.restaurantName || 'Restaurant';
        if (metaEl) metaEl.textContent = `${ongoing.items?.length || 0} item(s) • Total ₱ ${Number(ongoing.total || 0) + Number(ongoing.serviceFee || 0)}`;
        if (logoEl && ongoing.restaurantLogo) logoEl.src = ongoing.restaurantLogo;
        if (trackBtn) {
            trackBtn.disabled = false;
            trackBtn.addEventListener('click', () => {
                window.location.href = '/tracking';
            });
        }

        const completedEl = document.getElementById('completedOrders');
        if (completedEl) {
            const completed = orders.filter(o => o.status === 'completed').slice(0, 5);
            if (!completed.length) {
                completedEl.textContent = 'No completed orders yet.';
            } else {
                completedEl.innerHTML = completed.map(o => `
                    <div class="address-card" style="align-items:center;">
                        <div class="rest-logo-small">${o.restaurantLogo ? `<img src="${o.restaurantLogo}" alt="Restaurant logo">` : ''}</div>
                        <div style="flex:1;">
                            <strong>${o.restaurantName || 'Restaurant'}</strong>
                            <div class="text-muted text-sm">${o.items?.length || 0} item(s) • Total ₱ ${Number(o.total || 0) + Number(o.serviceFee || 0)}</div>
                        </div>
                        <span class="text-muted text-sm">Delivered</span>
                    </div>
                `).join('');
            }
        }
    };

    hydrateOngoingOrders();

    /* TRACKING PAGE */

    const hydrateTrackingPage = () => {
        const trackingMapEl = document.getElementById('trackingMap');
        if (!trackingMapEl) return;

        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('orders') || '[]');
            if (!Array.isArray(orders)) orders = [];
        } catch {
            orders = [];
        }

        const lastId = localStorage.getItem('lastOrderId');
        const order = orders.find(o => o.id === lastId) || orders.find(o => o.status === 'ongoing') || orders[0];
        if (!order) return;

        const restaurantEl = document.getElementById('trackingRestaurant');
        const itemsPreviewEl = document.getElementById('trackingItemsPreview');
        const orderIdEl = document.getElementById('trackingOrderId');
        const etaRangeEl = document.getElementById('trackingEtaRange');
        const etaSubEl = document.getElementById('trackingEtaSub');
        const thumbEl = document.getElementById('trackingThumb');

        if (restaurantEl) restaurantEl.textContent = order.restaurantName || 'Restaurant';
        if (orderIdEl) orderIdEl.textContent = `Order #${(order.id || '').replace('ord_', '')}`;

        const items = Array.isArray(order.items) ? order.items : [];
        if (itemsPreviewEl) {
            const preview = items.slice(0, 2).map(i => `${i.qty}× ${i.name}`).join(' • ');
            itemsPreviewEl.textContent = preview || '—';
        }

        if (thumbEl) {
            const firstImg = items.find(i => i.img)?.img;
            thumbEl.innerHTML = firstImg ? `<img src="${firstImg}" alt="Order item">` : '';
        }

        const createdAt = Number(order.createdAt || Date.now());
        const now = Date.now();
        const minMs = 20 * 60 * 1000;
        const maxMs = 25 * 60 * 1000;
        const etaMin = new Date(createdAt + minMs);
        const etaMax = new Date(createdAt + maxMs);
        const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (etaRangeEl) etaRangeEl.textContent = `Estimated Arrival: ${fmt(etaMin)} - ${fmt(etaMax)}`;
        const remainingMin = Math.max(1, Math.round((createdAt + maxMs - now) / 60000));
        if (etaSubEl) etaSubEl.textContent = `Arriving in ~${remainingMin} mins`;

        // Destination defaults to Iriga area if no pin saved.
        const destination = (order.deliveryPin && typeof order.deliveryPin.lat === 'number' && typeof order.deliveryPin.lng === 'number')
            ? [order.deliveryPin.lat, order.deliveryPin.lng]
            : [13.40755, 123.37466];

        // Fake rider start point slightly away from destination.
        const riderStart = [destination[0] - 0.006, destination[1] - 0.006];

        if (!window.L) return;
        const map = window.L.map('trackingMap').setView(destination, 14);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const destMarker = window.L.marker(destination).addTo(map);
        const riderMarker = window.L.marker(riderStart).addTo(map);
        const path = window.L.polyline([riderStart, destination], { color: '#d70f64', weight: 4, opacity: 0.9 }).addTo(map);
        map.fitBounds(path.getBounds(), { padding: [20, 20] });

        // Animate rider moving to destination
        let t = 0;
        const steps = 120;
        const tickMs = 1000;
        const interval = setInterval(() => {
            t += 1;
            const p = Math.min(1, t / steps);
            const lat = riderStart[0] + (destination[0] - riderStart[0]) * p;
            const lng = riderStart[1] + (destination[1] - riderStart[1]) * p;
            riderMarker.setLatLng([lat, lng]);
            if (p >= 1) clearInterval(interval);
        }, tickMs);
    };

    hydrateTrackingPage();

    // Keep latest review payload available after any page refresh.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'hidden') return;
        const reviewBtn = document.getElementById('reviewBtn');
        if (!reviewBtn) return;
        try {
            const sessionPayload = sessionStorage.getItem('checkoutCart');
            if (sessionPayload) localStorage.setItem('checkoutCart', sessionPayload);
        } catch (_error) {
            // Ignore storage sync errors.
        }
    });

    /* RESTAURANT MENU PAGE */

    const foodGrid = document.getElementById('foodGrid');

    if (foodGrid) {
        const restaurantData = {
            'mang-inasal': {
                name: 'Mang Inasal - Iriga City',
                category: 'Desserts · Meat · BBQ · Chicken',
                logo: 'images/manginasal-logo.png',
                hero: 'images/manginasal-food.png',
                items: [
                    { name: 'Paa Large - PM1', price: 157, img: 'images/paa-large.png', category: 'Popular', desc: 'Paa Large with 1 rice' },
                    { name: 'Pecho Large - PM2', price: 187, img: 'images/pecho-large.png', category: 'Chicken', desc: 'Pecho Large with 1 rice' },
                    { name: 'Pork BBQ Meal', price: 145, img: 'images/paa-large.png', category: 'Meals', desc: 'Pork BBQ with rice' },
                    { name: 'Halo-Halo', price: 89, img: 'images/pecho-large.png', category: 'Dessert', desc: 'Cold dessert treat' }
                ]
            },
            'jollibee': {
                name: 'Jollibee - Iriga City',
                category: 'Fast Food · Chicken · Burger · Spaghetti',
                logo: 'images/jollibee-logo.png',
                hero: 'images/jollibee-food.png',
                items: [
                    { name: 'Chickenjoy Meal', price: 120, img: 'images/chickenjoy.png', category: 'Popular', desc: 'Chickenjoy with rice' },
                    { name: 'Jolly Spaghetti', price: 75, img: 'images/spaghetti.png', category: 'Meals', desc: 'Sweet-style spaghetti' },
                    { name: 'Yumburger', price: 55, img: 'images/chickenjoy.png', category: 'Burger', desc: 'Classic Jollibee burger' },
                    { name: 'Peach Mango Pie', price: 48, img: 'images/spaghetti.png', category: 'Dessert', desc: 'Crispy peach mango pie' }
                ]
            },
            'mcdo': {
                name: 'Mcdo - Iriga City',
                category: 'Fast Food · Burgers · Fries · Drinks',
                logo: 'images/mcdo-logo.png',
                hero: 'images/mcdo-food.png',
                items: [
                    { name: 'Burger McDo Meal', price: 115, img: 'images/burger-mcdo.png', category: 'Popular', desc: 'Burger McDo with fries' },
                    { name: 'McChicken Meal', price: 155, img: 'images/mcchicken.png', category: 'Chicken', desc: 'McChicken with drink' },
                    { name: 'Fries Large', price: 92, img: 'images/burger-mcdo.png', category: 'Meals', desc: 'Large crispy fries' },
                    { name: 'Coke Float', price: 65, img: 'images/mcchicken.png', category: 'Drinks', desc: 'Coke float drink' }
                ]
            }
        };

        const params = new URLSearchParams(window.location.search);
        const restaurantKey = params.get('restaurant') || 'mang-inasal';
        const restaurant = restaurantData[restaurantKey] || restaurantData['mang-inasal'];

        let cart = [];
        let currentCategory = 'Popular';
        let selectedFood = null;
        let modalQty = 1;

        const restaurantName = document.getElementById('restaurantName');
        const restaurantCategory = document.getElementById('restaurantCategory');
        const breadcrumb = document.getElementById('breadcrumb');
        const logo = document.querySelector('.menu-rest-logo');
        const hero = document.querySelector('.menu-hero-food');
        const sectionTitle = document.getElementById('sectionTitle');
        const menuSearch = document.getElementById('menuSearch');
        const cartContent = document.getElementById('cartContent');
        const cartTotal = document.getElementById('cartTotal');
        const cartIcon = document.getElementById('cartIcon');

        if (restaurantName) restaurantName.textContent = restaurant.name;
        if (restaurantCategory) restaurantCategory.textContent = restaurant.category;
        if (breadcrumb) breadcrumb.textContent = `Iriga Camarines Sur > Restaurant List > ${restaurant.name}`;
        if (logo) {
            logo.src = restaurant.logo;
            logo.alt = restaurant.name;
        }
        if (hero) {
            hero.src = restaurant.hero;
            hero.alt = restaurant.name;
        }

        const createFoodModal = () => {
            if (document.getElementById('foodModal')) return;

            const modal = document.createElement('div');
            modal.id = 'foodModal';
            modal.className = 'food-modal';
            modal.hidden = true;

            modal.innerHTML = `
                <div class="food-modal-card">
                    <button class="food-modal-close" id="foodModalClose" type="button">×</button>

                    <img id="modalFoodImg" class="food-modal-img" src="" alt="Food">

                    <div class="food-modal-content">
                        <h2 id="modalFoodName"></h2>
                        <p id="modalFoodPrice" class="food-modal-price"></p>
                        <p id="modalFoodDesc"></p>

                        <hr>

                        <div class="option-box">
                            <div class="option-title">
                                <div>
                                    <h3>Variation</h3>
                                    <p>Select 1</p>
                                </div>
                                <span>Required</span>
                            </div>
                            <div id="modalVariationList"></div>
                        </div>

                        <div class="addons-box">
                            <h3>Frequently bought together</h3>
                            <p>Other consumers also ordered these</p>
                            <div id="modalAddonList"></div>
                        </div>

                        <div class="modal-bottom">
                            <div class="qty-control">
                                <button id="qtyMinus" type="button">-</button>
                                <span id="modalQty">1</span>
                                <button id="qtyPlus" type="button">+</button>
                            </div>

                            <button id="modalAddCart" type="button">Add to cart</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('foodModalClose').addEventListener('click', () => {
                modal.hidden = true;
            });

            modal.addEventListener('click', e => {
                if (e.target === modal) modal.hidden = true;
            });

            document.getElementById('qtyMinus').addEventListener('click', () => {
                if (modalQty > 1) modalQty--;
                document.getElementById('modalQty').textContent = modalQty;
            });

            document.getElementById('qtyPlus').addEventListener('click', () => {
                modalQty++;
                document.getElementById('modalQty').textContent = modalQty;
            });

            document.getElementById('modalAddCart').addEventListener('click', () => {
                if (!selectedFood) return;

                const variation = document.querySelector("input[name='variation']:checked");
                if (!variation) {
                    showToast('Please select a variation.');
                    return;
                }

                const variationName = variation.value;
                const variationAdd = Number(variation.dataset.price || 0);

                let addonTotal = 0;
                const addonNames = [];

                document.querySelectorAll('.addon-row input:checked').forEach(addon => {
                    addonTotal += Number(addon.dataset.price || 0);
                    addonNames.push(addon.closest('.addon-row').querySelector('span').textContent.trim());
                });

                const finalPrice = (selectedFood.price + variationAdd + addonTotal) * modalQty;

                cart.push({
                    name: `${selectedFood.name} (${variationName})`,
                    price: finalPrice,
                    qty: modalQty,
                    addons: addonNames
                });

                updateCart();
                modal.hidden = true;
            });
        };

        const getModalConfig = (item) => {
            const defaults = {
                variations: [
                    { name: 'Solo', add: 0 },
                    { name: 'With Drink', add: 30 },
                    { name: 'Busog Upgrade', add: 49, note: '1 Small Drink, 1 Plain Rice, 1 Extra Chicken Oil & Toyomansi' }
                ],
                addons: [
                    { name: 'Chicken Oil', add: 7 },
                    { name: 'Soup', add: 12 },
                    { name: 'Toyomansi', add: 7 }
                ]
            };

            const itemConfigs = {
                '1-pc. Chickenjoy w/ Drink': {
                    variations: [
                        { name: 'Solo', add: 0 },
                        { name: 'With Drink', add: 30 },
                        { name: 'Busog Upgrade', add: 49, note: '1 Small Drink, 1 Plain Rice, 1 Extra Chicken Oil & Toyomansi' }
                    ],
                    addons: defaults.addons
                },
                'Jolly Spaghetti': {
                    variations: [
                        { name: 'Solo', add: 0 },
                        { name: 'With Drink', add: 30 },
                        { name: 'Busog Upgrade', add: 49, note: '1 Small Drink, 1 Plain Rice, 1 Extra Chicken Oil & Toyomansi' }
                    ],
                    addons: defaults.addons
                },
                'Yumburger': {
                    variations: [
                        { name: 'Solo', add: 0 },
                        { name: 'With Drink', add: 30 },
                        { name: 'Busog Upgrade', add: 49, note: '1 Small Drink, 1 Plain Rice, 1 Extra Chicken Oil & Toyomansi' }
                    ],
                    addons: defaults.addons
                },
                'Peach Mango Pie': {
                    variations: [
                        { name: 'Solo', add: 0 },
                        { name: 'With Drink', add: 30 },
                        { name: 'Busog Upgrade', add: 49, note: '1 Small Drink, 1 Plain Rice, 1 Extra Chicken Oil & Toyomansi' }
                    ],
                    addons: defaults.addons
                }
            };

            return itemConfigs[item.name] || defaults;
        };

        const renderModalSelections = (item) => {
            const variationList = document.getElementById('modalVariationList');
            const addonList = document.getElementById('modalAddonList');
            if (!variationList || !addonList) return;

            const config = getModalConfig(item);

            variationList.innerHTML = config.variations.map((variation, index) => `
                <label class="option-row">
                    <input type="radio" name="variation" value="${variation.name}" data-price="${variation.add}" ${index === 0 ? 'checked' : ''}>
                    <span>${variation.name}${variation.note ? ` <small>${variation.note}</small>` : ''}</span>
                    <strong>₱${item.price + variation.add}</strong>
                </label>
            `).join('');

            addonList.innerHTML = config.addons.map(addon => `
                <label class="addon-row">
                    <span>${addon.name}</span>
                    <strong>+ ₱${addon.add}</strong>
                    <input type="checkbox" data-price="${addon.add}">
                </label>
            `).join('');
        };

        const openFoodModal = (item) => {
            createFoodModal();

            selectedFood = item;
            modalQty = 1;

            document.getElementById('modalFoodImg').src = item.img;
            document.getElementById('modalFoodName').textContent = item.name;
            document.getElementById('modalFoodPrice').textContent = `₱${item.price}`;
            document.getElementById('modalFoodDesc').textContent = item.desc || `${item.name} meal`;
            renderModalSelections(item);
            document.getElementById('modalQty').textContent = '1';

            document.getElementById('foodModal').hidden = false;
        };

        const renderMenu = () => {
            const keyword = menuSearch?.value.toLowerCase() || '';

            const filteredItems = restaurant.items.filter(item => {
                const categoryMatch = currentCategory === 'Popular' || item.category === currentCategory;
                const searchMatch = item.name.toLowerCase().includes(keyword);
                return categoryMatch && searchMatch;
            });

            foodGrid.innerHTML = '';

            if (!filteredItems.length) {
                foodGrid.innerHTML = '<p>No menu items found.</p>';
                return;
            }

            filteredItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'menu-food-card';

                card.innerHTML = `
                    <div>
                        <h3>${item.name}</h3>
                        <strong>from ₱${item.price}</strong>
                        <p>${item.desc || `${item.name} meal`}</p>
                    </div>
                    <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'">
                    <button type="button">+</button>
                `;

                card.querySelector('button').addEventListener('click', e => {
                    e.stopPropagation();
                    openFoodModal(item);
                });

                card.addEventListener('click', () => openFoodModal(item));

                foodGrid.appendChild(card);
            });
        };

        const updateCart = () => {
            const total = cart.reduce((sum, item) => sum + item.price, 0);

            if (cartTotal) cartTotal.textContent = `₱ ${total}`;
            if (cartIcon) cartIcon.textContent = `🛒 ${cart.length}`;

            if (!cartContent) return;

            if (!cart.length) {
                cartContent.innerHTML = `
                    <img src="assets/logos/cart-panda.png" alt="Panda cart" onerror="this.src='assets/logos/support.png'">
                    <h3>Hungry?</h3>
                    <p>You haven't added anything<br>in your cart</p>
                `;
                return;
            }

            cartContent.innerHTML = `
                <h3>Your Cart</h3>
                <div class="cart-items-list">
                    ${cart.map(item => `
                        <p>
                            ${item.qty}x ${item.name} - ₱${item.price}
                            ${item.addons.length ? `<br><small>Add-ons: ${item.addons.join(', ')}</small>` : ''}
                        </p>
                    `).join('')}
                </div>
            `;
        };

        document.querySelectorAll('.menu-category-row button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.menu-category-row button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                currentCategory = button.dataset.category || 'Popular';
                if (sectionTitle) sectionTitle.textContent = currentCategory === 'Popular' ? '🔥 Popular' : currentCategory;

                renderMenu();
            });
        });

        menuSearch?.addEventListener('input', renderMenu);

        document.getElementById('deliveryTab')?.addEventListener('click', () => {
            document.getElementById('deliveryTab').classList.add('active');
            document.getElementById('pickupTab').classList.remove('active');
        });

        document.getElementById('pickupTab')?.addEventListener('click', () => {
            document.getElementById('pickupTab').classList.add('active');
            document.getElementById('deliveryTab').classList.remove('active');
        });

        document.getElementById('locationBtn')?.addEventListener('click', () => {
            showToast('Change location feature is for prototype only.');
        });

        document.getElementById('accountBtn')?.addEventListener('click', () => {
            showToast('Account menu is for prototype only.');
        });

        document.getElementById('languageBtn')?.addEventListener('click', () => {
            showToast('Language menu is for prototype only.');
        });

        document.getElementById('favoriteBtn')?.addEventListener('click', () => {
            showToast('Favorites feature is for prototype only.');
        });

        document.getElementById('summaryBtn')?.addEventListener('click', e => {
            e.preventDefault();
            showToast('Cart summary feature is for prototype only.');
        });

        document.getElementById('reviewBtn')?.addEventListener('click', () => {
            if (!cart.length) {
                showToast('Please add an item to your cart first.');
                return;
            }

            window.location.href = '/review';
        });

        renderMenu();
        updateCart();
    }

    /* IMAGE FALLBACK */

    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => {
            img.src = 'assets/logos/support.png';
        });
    });

    /* NAVIGATION */

    bindNavigation('.header-logo', '/');
    bindNavigation('.header-nav .nav-item:nth-child(3)', '/tracking');
    // Do NOT bind all `.checkout-btn` globally; review page uses it for Place Order modal.
    bindNavigation('.go-tracking', '/tracking');

    updateResults();
});
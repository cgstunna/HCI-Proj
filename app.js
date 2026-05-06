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

    locationChangeBtn?.addEventListener('click', e => {
        e.preventDefault();
        if (locationModal) {
            locationModal.hidden = false;
            document.body.style.overflow = 'hidden';
        }
    });

    document.getElementById('locationModalClose')?.addEventListener('click', () => {
        locationModal.hidden = true;
        document.body.style.overflow = '';
    });

    locationModal?.addEventListener('click', e => {
        if (e.target === locationModal) {
            locationModal.hidden = true;
            document.body.style.overflow = '';
        }
    });

    document.querySelectorAll('.location-modal__pill').forEach(pill => {
        pill.addEventListener('click', () => {
            if (locationDisplay) locationDisplay.textContent = pill.dataset.location || pill.textContent.trim();
            if (locationModal) locationModal.hidden = true;
            document.body.style.overflow = '';
        });
    });

    document.getElementById('locationLocateMe')?.addEventListener('click', () => {
        showToast('Locating you... demo only');
    });

    document.getElementById('locationSubmitAddress')?.addEventListener('click', () => {
        const input = document.getElementById('locationAddressInput');
        const value = input?.value.trim();

        if (!value) {
            showToast('Please enter an address.');
            return;
        }

        if (locationDisplay) locationDisplay.textContent = value;
        if (locationModal) locationModal.hidden = true;
        document.body.style.overflow = '';
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
    bindNavigation('.checkout-btn', '/tracking');

    updateResults();
});
document.addEventListener('DOMContentLoaded', () => {
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
        } else if (src.includes('panda_support') || alt.includes('support')) {
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

            if (activeFilters.has(filterName)) {
                activeFilters.delete(filterName);
                button.classList.remove('active-filter');
            } else {
                activeFilters.add(filterName);
                button.classList.add('active-filter');
            }
            updateRestaurantResults();
        });
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

    updateRestaurantResults();
});

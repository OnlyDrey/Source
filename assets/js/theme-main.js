/**
 * Ghost Theme - Main JavaScript
 * Features: Theme toggle, Navigation, Search, Reading Progress, TOC
 */

(function() {
    'use strict';

    // ===================================
    // Theme System
    // ===================================
    class ThemeManager {
        constructor() {
            this.storageKey = 'akio-theme';
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
            this.init();
        }

        init() {
            // Apply theme immediately to prevent FOUC
            this.applyTheme(this.currentTheme);

            // Setup toggle buttons
            document.addEventListener('DOMContentLoaded', () => {
                this.setupToggleButtons();
            });
        }

        getSystemTheme() {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }

        getStoredTheme() {
            return localStorage.getItem(this.storageKey);
        }

        setStoredTheme(theme) {
            localStorage.setItem(this.storageKey, theme);
        }

        applyTheme(theme) {
            this.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            this.setStoredTheme(theme);
            this.updateToggleIcons();
        }

        toggleTheme() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        }

        setupToggleButtons() {
            const toggleButtons = document.querySelectorAll('.theme-toggle');

            toggleButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
            });

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!this.getStoredTheme()) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
        }

        updateToggleIcons() {
            const toggleButtons = document.querySelectorAll('.theme-toggle');

            toggleButtons.forEach(button => {
                const icon = button.querySelector('svg, span');
                if (icon) {
                    // Update icon based on current theme
                    if (this.currentTheme === 'dark') {
                        icon.innerHTML = '☀️'; // Sun icon for light mode switch
                    } else {
                        icon.innerHTML = '🌙'; // Moon icon for dark mode switch
                    }
                }
            });
        }
    }

    // ===================================
    // Navigation
    // ===================================
    class Navigation {
        constructor() {
            this.nav = null;
            this.mobileToggle = null;
            this.mobileMenu = null;
            this.isScrolled = false;
            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.nav = document.querySelector('.site-nav');
                this.mobileToggle = document.querySelector('.mobile-menu-toggle');
                this.mobileMenu = document.querySelector('.mobile-menu');

                if (this.nav) {
                    this.setupScrollHandler();
                }

                if (this.mobileToggle && this.mobileMenu) {
                    this.setupMobileMenu();
                }
            });
        }

        setupScrollHandler() {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        this.handleScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        }

        handleScroll() {
            const scrolled = window.scrollY > 50;

            if (scrolled !== this.isScrolled) {
                this.isScrolled = scrolled;

                if (scrolled) {
                    this.nav.classList.add('scrolled');
                } else {
                    this.nav.classList.remove('scrolled');
                }
            }
        }

        setupMobileMenu() {
            this.mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });

            // Close menu when clicking links
            const menuLinks = this.mobileMenu.querySelectorAll('a');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.mobileMenu.classList.contains('active') &&
                    !this.mobileMenu.contains(e.target) &&
                    !this.mobileToggle.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
        }

        toggleMobileMenu() {
            const isActive = this.mobileMenu.classList.toggle('active');
            this.mobileToggle.classList.toggle('active');

            // Lock body scroll when menu is open
            if (isActive) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        closeMobileMenu() {
            this.mobileMenu.classList.remove('active');
            this.mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ===================================
    // Reading Progress Bar
    // ===================================
    class ReadingProgress {
        constructor() {
            this.progressBar = null;
            this.content = null;
            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.progressBar = document.getElementById('reading-progress');
                this.content = document.querySelector('.gh-content');

                if (this.progressBar && this.content) {
                    this.setupScrollHandler();
                }
            });
        }

        setupScrollHandler() {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        this.updateProgress();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        }

        updateProgress() {
            const contentRect = this.content.getBoundingClientRect();
            const contentHeight = this.content.offsetHeight;
            const viewportHeight = window.innerHeight;

            // Calculate how much of the content has been scrolled
            const contentTop = contentRect.top;
            const contentBottom = contentTop + contentHeight;

            let progress = 0;

            if (contentTop <= 0 && contentBottom >= viewportHeight) {
                // Content is being scrolled
                const scrolled = Math.abs(contentTop);
                const scrollableHeight = contentHeight - viewportHeight;
                progress = (scrolled / scrollableHeight) * 100;
            } else if (contentBottom < viewportHeight) {
                // Scrolled past content
                progress = 100;
            }

            progress = Math.max(0, Math.min(100, progress));
            this.progressBar.style.width = progress + '%';
        }
    }

    // ===================================
    // Table of Contents
    // ===================================
    class TableOfContents {
        constructor() {
            this.tocList = null;
            this.headings = [];
            this.activeHeading = null;
            this.observer = null;
            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.tocList = document.querySelector('.toc-list');
                const content = document.querySelector('.gh-content');

                if (this.tocList && content) {
                    this.generateTOC(content);
                    this.setupIntersectionObserver();
                    this.setupClickHandlers();
                }
            });
        }

        generateTOC(content) {
            const headings = content.querySelectorAll('h2, h3');

            if (headings.length === 0) {
                // Hide TOC if no headings
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (tocSidebar) {
                    tocSidebar.style.display = 'none';
                }
                return;
            }

            headings.forEach((heading, index) => {
                // Assign ID if not present
                if (!heading.id) {
                    heading.id = 'heading-' + index;
                }

                this.headings.push({
                    element: heading,
                    id: heading.id,
                    level: heading.tagName.toLowerCase()
                });

                // Create TOC item
                const li = document.createElement('li');
                const a = document.createElement('a');

                a.href = '#' + heading.id;
                a.textContent = heading.textContent;
                a.dataset.headingId = heading.id;

                if (heading.tagName.toLowerCase() === 'h3') {
                    a.classList.add('toc-h3');
                }

                li.appendChild(a);
                this.tocList.appendChild(li);
            });
        }

        setupIntersectionObserver() {
            const options = {
                rootMargin: '-100px 0px -66%',
                threshold: 0
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.setActiveHeading(entry.target.id);
                    }
                });
            }, options);

            this.headings.forEach(({ element }) => {
                this.observer.observe(element);
            });
        }

        setActiveHeading(id) {
            if (this.activeHeading === id) return;

            this.activeHeading = id;

            // Remove active class from all links
            const links = this.tocList.querySelectorAll('a');
            links.forEach(link => {
                link.classList.remove('active');
            });

            // Add active class to current link
            const activeLink = this.tocList.querySelector(`a[data-heading-id="${id}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }

        setupClickHandlers() {
            const links = this.tocList.querySelectorAll('a');

            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();

                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        const offset = 100; // Account for fixed navbar
                        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    }

    // ===================================
    // Search System
    // ===================================
    class SearchSystem {
        constructor() {
            this.modal = null;
            this.input = null;
            this.resultsContainer = null;
            this.searchIndex = null;
            this.debounceTimer = null;
            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.modal = document.querySelector('.search-modal');
                this.input = document.querySelector('.search-input');
                this.resultsContainer = document.querySelector('.search-results');

                if (this.modal && this.input) {
                    this.setupKeyboardShortcut();
                    this.setupModalHandlers();
                    this.setupSearchInput();
                }
            });
        }

        setupKeyboardShortcut() {
            document.addEventListener('keydown', (e) => {
                // Cmd/Ctrl + K to open search
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.openModal();
                }

                // Escape to close
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            });
        }

        setupModalHandlers() {
            // Close on backdrop click
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });

            // Open search button
            const searchButtons = document.querySelectorAll('.search-toggle');
            searchButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal();
                });
            });
        }

        setupSearchInput() {
            this.input.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);

                const query = e.target.value.trim();

                if (query.length < 2) {
                    this.showEmptyState();
                    return;
                }

                // Debounce search
                this.debounceTimer = setTimeout(() => {
                    this.performSearch(query);
                }, 200);
            });
        }

        openModal() {
            this.modal.classList.add('active');
            this.input.focus();
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            this.modal.classList.remove('active');
            this.input.value = '';
            this.showEmptyState();
            document.body.style.overflow = '';
        }

        async performSearch(query) {
            this.showLoadingState();

            try {
                // Load search index if not already loaded
                if (!this.searchIndex) {
                    await this.loadSearchIndex();
                }

                // Perform search
                const results = this.search(query);

                this.displayResults(results);
            } catch (error) {
                console.error('Search error:', error);
                this.showErrorState();
            }
        }

        async loadSearchIndex() {
            // Try to get Ghost API key
            const ghostUrl = window.location.origin;
            const apiKey = this.extractAPIKey();

            if (!apiKey) {
                console.warn('Ghost Content API key not found');
                this.searchIndex = [];
                return;
            }

            const apiUrl = `${ghostUrl}/ghost/api/content/posts/?key=${apiKey}&limit=all&fields=title,slug,excerpt,feature_image,published_at,tags,authors`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            this.searchIndex = data.posts || [];
        }

        extractAPIKey() {
            // Try to extract API key from script tags
            const scripts = document.querySelectorAll('script');

            for (let script of scripts) {
                const content = script.textContent;
                const match = content.match(/key:\s*['"]([a-f0-9]+)['"]/);

                if (match) {
                    return match[1];
                }
            }

            return null;
        }

        search(query) {
            const lowerQuery = query.toLowerCase();

            return this.searchIndex.filter(post => {
                // Search in title
                if (post.title && post.title.toLowerCase().includes(lowerQuery)) {
                    return true;
                }

                // Search in excerpt
                if (post.excerpt && post.excerpt.toLowerCase().includes(lowerQuery)) {
                    return true;
                }

                // Search in tags
                if (post.tags && post.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))) {
                    return true;
                }

                // Search in authors
                if (post.authors && post.authors.some(author => author.name.toLowerCase().includes(lowerQuery))) {
                    return true;
                }

                return false;
            }).slice(0, 10); // Limit to 10 results
        }

        displayResults(results) {
            if (results.length === 0) {
                this.showNoResultsState();
                return;
            }

            const html = results.map(post => {
                const image = post.feature_image || '';
                const title = post.title || 'Untitled';
                const excerpt = post.excerpt || '';
                const url = `/${post.slug}/`;

                return `
                    <a href="${url}" class="search-result-item">
                        ${image ? `<img src="${image}" alt="${title}" class="search-result-image">` : ''}
                        <div>
                            <div class="search-result-title">${title}</div>
                            <div class="search-result-excerpt">${excerpt}</div>
                        </div>
                    </a>
                `;
            }).join('');

            this.resultsContainer.innerHTML = html;
        }

        showEmptyState() {
            this.resultsContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">
                    Type to search posts...
                </div>
            `;
        }

        showLoadingState() {
            this.resultsContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <div class="spinner"></div>
                </div>
            `;
        }

        showNoResultsState() {
            this.resultsContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">
                    No results found
                </div>
            `;
        }

        showErrorState() {
            this.resultsContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">
                    Search unavailable
                </div>
            `;
        }
    }

    // ===================================
    // Initialize All Systems
    // ===================================

    // Theme must initialize immediately to prevent FOUC
    window.themeManager = new ThemeManager();

    // Initialize other systems
    const navigation = new Navigation();
    const readingProgress = new ReadingProgress();
    const tableOfContents = new TableOfContents();
    const searchSystem = new SearchSystem();

})();

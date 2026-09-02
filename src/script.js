/**
 * Dynamic Portfolio Application & Controller
 */

window.PORTFOLIO_DATA = null;

const FALLBACK_DATA = {};

function renderThumbContent(icon) {
    if (!icon) return '🚀';
    const isImage = icon.startsWith('http://') || 
                    icon.startsWith('https://') || 
                    icon.startsWith('/') || 
                    icon.startsWith('./') || 
                    icon.startsWith('src/') || 
                    /\.(png|jpe?g|svg|webp|gif)$/i.test(icon);

    if (isImage) {
        return `<img src="${icon}" alt="thumbnail" class="project-thumb-img" loading="lazy" />`;
    }
    return `<span>${icon}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const breadcrumbBtn = document.getElementById('header-breadcrumb-btn');
    const breadcrumbText = document.getElementById('breadcrumb-text');
    const homeLogo = document.getElementById('home-button');
    const avatarBtn = document.getElementById('avatar-btn');
    const searchBar = document.getElementById('search-bar');
    const scrollArea = document.getElementById('card-scroll-area');

    // Views
    const viewProjects = document.getElementById('view-projects');
    const viewBlog = document.getElementById('view-blog');
    const viewAbout = document.getElementById('view-about');
    const allViews = [viewProjects, viewBlog, viewAbout];

    const projectsContainer = document.querySelector('.projects-list-container') || viewProjects;
    const projectsCounter = document.getElementById('projects-counter');
    const blogContainer = document.getElementById('blog-posts-container');
    const skillsContainer = document.querySelector('.skills-grid');
    const contactsContainer = document.querySelector('.contacts-list');

    let currentView = 'main';
    let blogLoaded = false;

    function updateProjectsCount() {
        const currentProjectItems = document.querySelectorAll('.project-item');
        const visibleProjects = Array.from(currentProjectItems).filter(item => item.style.display !== 'none');
        if (projectsCounter) {
            projectsCounter.textContent = `${visibleProjects.length} items`;
        }
    }

    function alignBreadcrumbToCard() {
        const breadcrumb = document.getElementById('header-breadcrumb-btn');
        const card = document.querySelector('.main-card-viewport');
        const logo = document.getElementById('home-button');

        if (!breadcrumb || !card || !logo) return;

        if (window.innerWidth <= 768) {
            breadcrumb.style.marginLeft = '';
            return;
        }

        const cardLeft = card.getBoundingClientRect().left;
        const logoRight = logo.getBoundingClientRect().right;
        const offset = cardLeft - logoRight - 12;

        breadcrumb.style.marginLeft = `${Math.max(0, offset)}px`;
    }

    window.addEventListener('resize', alignBreadcrumbToCard);
    alignBreadcrumbToCard();

    function switchView(viewName) {
        currentView = viewName;

        const allNavButtons = document.querySelectorAll('.side-nav-btn');
        allNavButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        allViews.forEach(v => {
            if (v) v.classList.remove('visible');
        });

        if (scrollArea) scrollArea.scrollTop = 0;

        const currentProjectItems = document.querySelectorAll('.project-item');

        if (viewName === 'main') {
            if (breadcrumbText) breadcrumbText.textContent = 'main page';
            if (viewProjects) viewProjects.classList.add('visible');
            currentProjectItems.forEach(item => item.style.display = 'flex');
        } else if (viewName === 'best') {
            if (breadcrumbText) breadcrumbText.textContent = 'featured';
            if (viewProjects) viewProjects.classList.add('visible');
            currentProjectItems.forEach(item => {
                const isFeatured = item.getAttribute('data-featured') === 'true';
                item.style.display = isFeatured ? 'flex' : 'none';
            });
        } else if (viewName === 'blog') {
            if (breadcrumbText) breadcrumbText.textContent = 'blog';
            if (viewBlog) viewBlog.classList.add('visible');
            if (!blogLoaded) loadBlogPosts();
        } else if (viewName === 'about') {
            if (breadcrumbText) breadcrumbText.textContent = 'about me';
            if (viewAbout) viewAbout.classList.add('visible');
        }

        updateProjectsCount();
        alignBreadcrumbToCard();
    }

    function filterContent(query) {
        const term = query.toLowerCase().trim();
        const currentProjectItems = document.querySelectorAll('.project-item');

        if (term.length > 0) {
            if (viewProjects) viewProjects.classList.add('visible');
            if (viewBlog) viewBlog.classList.add('visible');
            if (viewAbout) viewAbout.classList.remove('visible');
            if (breadcrumbText) breadcrumbText.textContent = 'search results';
        } else {
            switchView(currentView);
            return;
        }

        currentProjectItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });

        updateProjectsCount();
    }

    async function loadBlogPosts() {
        if (blogLoaded || !blogContainer) return;
        try {
            const response = await fetch('src/blog/blog-manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            const manifest = await response.json();
            blogContainer.innerHTML = '';
            for (const postFile of manifest.posts) {
                const postResponse = await fetch(`src/blog/articles/${postFile}`);
                const markdown = await postResponse.text();
                const postData = parseMarkdownPost(markdown);
                const postElement = createBlogCard(postData, postFile);
                blogContainer.appendChild(postElement);
            }
            blogLoaded = true;
        } catch (error) {
            blogContainer.innerHTML = `
                <div class="blog-card">
                    <h3><a href="#">Articles & Engineering Notes</a></h3>
                    <p>Posts will appear here once published in your blog repository.</p>
                </div>`;
        }
    }

    function parseMarkdownPost(markdown) {
        const lines = markdown.split('\n');
        const metadata = { tags: [], categories: [] };
        let body = '';
        let parsingMeta = true;

        for (const line of lines) {
            if (parsingMeta) {
                const match = line.match(/^([^:]+):\s*(.*)$/);
                if (match) {
                    const key = match[1].trim().toLowerCase();
                    const val = match[2].trim();
                    if (key === 'title') metadata.title = val;
                    else if (key === 'date') metadata.date = val;
                    else if (key === 'tags') metadata.tags = val.split(',').map(t => t.trim()).filter(Boolean);
                } else if (line.trim() === '' && Object.keys(metadata).length >= 1) {
                    parsingMeta = false;
                }
            } else {
                body += line + '\n';
            }
        }
        metadata.body = body;
        return metadata;
    }

    function createBlogCard(postData, filename) {
        const card = document.createElement('div');
        card.className = 'blog-card';
        const snippet = postData.body.split('\n').find(l => l.length > 15 && !l.startsWith('#')) || '';
        const tagsHtml = (postData.tags || []).map(t => `<span class="blog-tag" data-search="${t}">${t}</span>`).join(' ');
        card.innerHTML = `
            <h3><a href="src/blog/blog-post.html?post=${filename}">${postData.title || filename}</a></h3>
            <div class="blog-meta-row">
                <span>${postData.date || 'Recent'}</span>
                <div>${tagsHtml}</div>
            </div>
            <p style="font-size:14px; color:#5c6061; line-height:1.5;">${snippet.slice(0, 140)}...</p>
        `;
        return card;
    }

    window.renderPortfolioApp = function (data) {
        if (!data) return;
        window.PORTFOLIO_DATA = data;

        if (data.profile) {
            const logoText = document.querySelector('.header-logo-text');
            if (logoText && data.profile.name) logoText.textContent = data.profile.name;

            const avatarImg = document.querySelector('#avatar-btn img') || document.querySelector('.header-avatar-btn img');
            if (avatarImg && data.profile.avatar) avatarImg.src = data.profile.avatar;

            const roleElem = document.querySelector('.about-subtitle');
            if (roleElem && data.profile.role) roleElem.textContent = data.profile.role;

            const bioElem = document.querySelector('.about-bio');
            if (bioElem && data.profile.bio) bioElem.textContent = data.profile.bio;
        }

        if (data.projects && projectsContainer) {
            projectsContainer.innerHTML = data.projects.map(p => `
                <article class="project-item" id="${p.id || ''}" data-featured="${p.featured ? 'true' : 'false'}">
                    <div class="project-thumb">${renderThumbContent(p.icon)}</div>
                    <div class="project-content">
                        <div class="project-top-bar">
                            <div class="project-heading">
                                <!-- <span class="project-category">${p.category || 'Project'}</span> -->
                                <h3 class="project-title">${p.title || 'Untitled'}</h3>
                            </div>
                        </div>
                        <p class="project-desc">${p.desc || ''}</p>
                        <div class="project-tags">
                                ${(p.tags || []).map(t => `<span class="blog-tag" data-search="${t}">${t}</span>`).join('')}
                        </div>
                        <div class="project-actions">
                            ${(p.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="action-btn">${l.label}</a>`).join('')}
                        </div>
                    </div>
                </article>
            `).join('');
        }

        if (data.skills && skillsContainer) {
            skillsContainer.innerHTML = data.skills.map(s => `<span class="skill-chip">${s}</span>`).join('');
        }

        if (data.contacts && contactsContainer) {
            contactsContainer.innerHTML = data.contacts.map(c => `
                <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="contact-card">
                    <span class="contact-lbl">${c.label}</span>
                    <span class="contact-val">${c.value}</span>
                </a>
            `).join('');
        }

        const currentSideNavBtns = document.querySelectorAll('.side-nav-btn');
        currentSideNavBtns.forEach(btn => {
            btn.onclick = () => {
                if (searchBar) searchBar.value = '';
                switchView(btn.dataset.view);
            };
        });

        switchView(currentView);
        updateProjectsCount();
    };

    if (homeLogo) {
        homeLogo.addEventListener('click', () => {
            if (searchBar) searchBar.value = '';
            switchView('main');
        });
    }

    if (breadcrumbBtn) {
        breadcrumbBtn.addEventListener('click', () => {
            if (searchBar) searchBar.value = '';
            switchView('main');
        });
    }

    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            if (searchBar) searchBar.value = '';
            switchView('about');
        });
    }

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            filterContent(e.target.value);
        });
    }

    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.blog-tag');
        if (tag) {
            const term = tag.dataset.search || tag.textContent.trim();
            if (searchBar) searchBar.value = term;
            filterContent(term);
        }
    });

    async function initApp() {
        try {
            const res = await fetch('src/data/data.json');
            if (!res.ok) throw new Error('data.json fetch failed');
            const data = await res.json();
            window.renderPortfolioApp(data);
        } catch (err) {
            console.warn('Using fallback data:', err);
            window.renderPortfolioApp(FALLBACK_DATA);
        }
    }

    initApp();
});
/**
 * Interactive Admin Panel & Site State Manager
 */

const adminpanel_is_active = false;

(function () {
    if (!adminpanel_is_active) return;

    let clickCount = 0;
    let clickTimer = null;
    let activeTab = 'projects';

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('#home-button') || e.target.closest('#avatar-btn') || e.target.closest('.header-logo');
        if (!trigger) return;

        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount >= 5) {
            clickCount = 0;
            openAdminPanel();
            showToast('⚡ Admin Mode Activated');
        } else {
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
        }
    });

    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.innerHTML = `
        <div class="admin-modal">
            <div class="admin-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span class="admin-title-badge">Admin Panel</span>
                    <span style="font-size:13px; color:rgba(255,255,255,0.4);">Site Live Configurator</span>
                </div>
                <button class="admin-btn admin-btn-outline" id="admin-close-btn" style="padding:6px 12px;">✕ Close</button>
            </div>
            
            <div class="admin-nav">
                <button class="admin-tab-btn is-active" data-tab="projects">📁 Projects</button>
                <button class="admin-tab-btn" data-tab="profile">👤 Profile</button>
                <button class="admin-tab-btn" data-tab="skills">⚡ Skills</button>
                <button class="admin-tab-btn" data-tab="contacts">📬 Contacts</button>
                <button class="admin-tab-btn" data-tab="json">🧾 Raw JSON</button>
            </div>

            <div class="admin-body" id="admin-content"></div>

            <div class="admin-footer">
                <div style="display:flex; gap:10px;">
                    <button class="admin-btn admin-btn-lime" id="admin-save-btn">💾 Apply Live</button>
                    <button class="admin-btn admin-btn-outline" id="admin-download-btn">📥 Download data.json</button>
                </div>
                <button class="admin-btn admin-btn-danger" id="admin-reset-btn">🔄 Reset</button>
            </div>
        </div>
    `;

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    document.body.appendChild(overlay);
    document.body.appendChild(toast);

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('is-show');
        setTimeout(() => toast.classList.remove('is-show'), 2500);
    }

    function openAdminPanel() {
        overlay.classList.add('is-open');
        renderAdminTab();
    }

    function closeAdminPanel() {
        overlay.classList.remove('is-open');
    }

    overlay.querySelector('#admin-close-btn').addEventListener('click', closeAdminPanel);

    overlay.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            activeTab = btn.dataset.tab;
            renderAdminTab();
        });
    });

    function renderAdminTab() {
        const container = overlay.querySelector('#admin-content');
        const data = window.PORTFOLIO_DATA;

        if (activeTab === 'projects') {
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:16px;">Projects Management (${data.projects.length})</h3>
                    <button class="admin-btn admin-btn-lime" id="add-project-btn" style="padding:6px 14px;">+ Add Project</button>
                </div>
                ${data.projects.map((p, idx) => `
                    <div class="admin-card" data-idx="${idx}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-weight:700; color:var(--color-lime);">Project #${idx + 1}</span>
                                <label style="display:flex; align-items:center; gap:6px; font-size:12px; cursor:pointer;">
                                    <input type="checkbox" class="p-featured" ${p.featured ? 'checked' : ''}> Featured
                                </label>
                            </div>
                            <button class="admin-btn admin-btn-danger del-project-btn" data-idx="${idx}" style="padding:4px 10px; font-size:12px;">Delete</button>
                        </div>
                        <div class="admin-row">
                            <div class="admin-field" style="flex:1.2;">
                                <label>Icon (Emoji or Photo URL)</label>
                                <input type="text" class="p-icon" value="${p.icon || '🚀'}" placeholder="🌊 or https://.../photo.png">
                            </div>
                            <div class="admin-field" style="flex:1.5;">
                                <label>Title</label>
                                <input type="text" class="p-title" value="${p.title}">
                            </div>
                            <div class="admin-field">
                                <label>Category</label>
                                <input type="text" class="p-cat" value="${p.category}">
                            </div>
                        </div>
                        <div class="admin-field">
                            <label>Description</label>
                            <textarea class="p-desc">${p.desc}</textarea>
                        </div>
                        <div class="admin-field">
                            <label>Tags (comma separated)</label>
                            <input type="text" class="p-tags" value="${(p.tags || []).join(', ')}">
                        </div>
                        <div class="admin-field">
                            <label>Action Buttons (Format: Label|URL, Label2|URL2)</label>
                            <input type="text" class="p-links" value="${(p.links || []).map(l => `${l.label}|${l.url}`).join(', ')}">
                        </div>
                    </div>
                `).join('')}
            `;

            container.querySelector('#add-project-btn').addEventListener('click', () => {
                data.projects.unshift({
                    id: 'new-project-' + Date.now(),
                    title: 'New Project',
                    category: 'Development',
                    desc: 'Project description goes here.',
                    icon: '🚀',
                    featured: true,
                    tags: ['TypeScript', 'WebGL'],
                    links: [{ label: 'GitHub', url: 'https://github.com' }]
                });
                renderAdminTab();
            });

            container.querySelectorAll('.del-project-btn').forEach(b => {
                b.addEventListener('click', (e) => {
                    data.projects.splice(e.target.dataset.idx, 1);
                    renderAdminTab();
                });
            });

        } else if (activeTab === 'profile') {
            container.innerHTML = `
                <div class="admin-card">
                    <h3 style="margin:0 0 10px 0; font-size:16px;">Profile Information</h3>
                    <div class="admin-row">
                        <div class="admin-field">
                            <label>Name</label>
                            <input type="text" id="prof-name" value="${data.profile.name}">
                        </div>
                        <div class="admin-field">
                            <label>Role / Subtitle</label>
                            <input type="text" id="prof-role" value="${data.profile.role}">
                        </div>
                    </div>
                    <div class="admin-row">
                        <div class="admin-field">
                            <label>Status Badge</label>
                            <input type="text" id="prof-status" value="${data.profile.status}">
                        </div>
                        <div class="admin-field">
                            <label>Avatar Photo URL</label>
                            <input type="text" id="prof-avatar" value="${data.profile.avatar}">
                        </div>
                    </div>
                    <div class="admin-field">
                        <label>Bio</label>
                        <textarea id="prof-bio">${data.profile.bio}</textarea>
                    </div>
                </div>
            `;

        } else if (activeTab === 'skills') {
            container.innerHTML = `
                <div class="admin-card">
                    <h3 style="margin:0; font-size:16px;">Skills & Technologies</h3>
                    <div class="admin-field">
                        <label>Skills List (comma-separated)</label>
                        <textarea id="skills-input" style="min-height:120px;">${data.skills.join(', ')}</textarea>
                    </div>
                </div>
            `;

        } else if (activeTab === 'contacts') {
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:16px;">Contact Cards</h3>
                    <button class="admin-btn admin-btn-lime" id="add-contact-btn" style="padding:6px 14px;">+ Add Contact</button>
                </div>
                ${data.contacts.map((c, idx) => `
                    <div class="admin-card" data-idx="${idx}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; color:var(--color-lime);">${c.label}</span>
                            <button class="admin-btn admin-btn-danger del-contact-btn" data-idx="${idx}" style="padding:4px 10px; font-size:12px;">Delete</button>
                        </div>
                        <div class="admin-row">
                            <div class="admin-field">
                                <label>Label</label>
                                <input type="text" class="c-label" value="${c.label}">
                            </div>
                            <div class="admin-field">
                                <label>Display Value</label>
                                <input type="text" class="c-val" value="${c.value}">
                            </div>
                            <div class="admin-field">
                                <label>URL</label>
                                <input type="text" class="c-url" value="${c.url}">
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;

            container.querySelector('#add-contact-btn').addEventListener('click', () => {
                data.contacts.push({ label: 'Social', value: '@link', url: 'https://' });
                renderAdminTab();
            });

            container.querySelectorAll('.del-contact-btn').forEach(b => {
                b.addEventListener('click', (e) => {
                    data.contacts.splice(e.target.dataset.idx, 1);
                    renderAdminTab();
                });
            });

        } else if (activeTab === 'json') {
            container.innerHTML = `
                <div class="admin-card">
                    <h3 style="margin:0; font-size:16px;">Raw JSON State</h3>
                    <div class="admin-field">
                        <textarea id="raw-json-input" style="min-height:360px; font-family:monospace; font-size:13px;">${JSON.stringify(data, null, 2)}</textarea>
                    </div>
                </div>
            `;
        }
    }

    function syncDataFromUI() {
        const data = window.PORTFOLIO_DATA;

        if (activeTab === 'projects') {
            const cards = overlay.querySelectorAll('.admin-card[data-idx]');
            cards.forEach(card => {
                const idx = card.dataset.idx;
                if (!data.projects[idx]) return;
                data.projects[idx].icon = card.querySelector('.p-icon').value.trim();
                data.projects[idx].title = card.querySelector('.p-title').value.trim();
                data.projects[idx].category = card.querySelector('.p-cat').value.trim();
                data.projects[idx].desc = card.querySelector('.p-desc').value.trim();
                data.projects[idx].featured = card.querySelector('.p-featured').checked;
                data.projects[idx].tags = card.querySelector('.p-tags').value.split(',').map(s => s.trim()).filter(Boolean);
                
                const rawLinks = card.querySelector('.p-links').value.split(',');
                data.projects[idx].links = rawLinks.map(l => {
                    const parts = l.split('|');
                    return { label: parts[0]?.trim() || 'Link', url: parts[1]?.trim() || '#' };
                }).filter(l => l.url !== '#');
            });
        } else if (activeTab === 'profile') {
            data.profile.name = overlay.querySelector('#prof-name').value.trim();
            data.profile.role = overlay.querySelector('#prof-role').value.trim();
            data.profile.status = overlay.querySelector('#prof-status').value.trim();
            data.profile.avatar = overlay.querySelector('#prof-avatar').value.trim();
            data.profile.bio = overlay.querySelector('#prof-bio').value.trim();
        } else if (activeTab === 'skills') {
            data.skills = overlay.querySelector('#skills-input').value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (activeTab === 'contacts') {
            const cards = overlay.querySelectorAll('.admin-card[data-idx]');
            cards.forEach(card => {
                const idx = card.dataset.idx;
                if (!data.contacts[idx]) return;
                data.contacts[idx].label = card.querySelector('.c-label').value.trim();
                data.contacts[idx].value = card.querySelector('.c-val').value.trim();
                data.contacts[idx].url = card.querySelector('.c-url').value.trim();
            });
        } else if (activeTab === 'json') {
            try {
                const parsed = JSON.parse(overlay.querySelector('#raw-json-input').value);
                window.PORTFOLIO_DATA = parsed;
            } catch (err) {
                alert('Invalid JSON: ' + err.message);
            }
        }
    }

    overlay.querySelector('#admin-save-btn').addEventListener('click', () => {
        syncDataFromUI();
        if (window.renderPortfolioApp) {
            window.renderPortfolioApp(window.PORTFOLIO_DATA);
        }
        showToast('✅ Applied Live to Site');
    });

    overlay.querySelector('#admin-download-btn').addEventListener('click', () => {
        syncDataFromUI();
        const jsonStr = JSON.stringify(window.PORTFOLIO_DATA, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📥 data.json downloaded');
    });

    overlay.querySelector('#admin-reset-btn').addEventListener('click', () => {
        if (confirm('Reload and reset changes?')) {
            window.location.reload();
        }
    });
})();
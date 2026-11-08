document.addEventListener('DOMContentLoaded', () => {
    const githubBtn = document.getElementById('github-link-btn') || document.getElementById('back-button');
    const projectNameHeader = document.getElementById('doc-title') || document.querySelector('header h1');
    const markdownContainer = document.getElementById('markdown-content');

    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('projectName');
    const githubLink = urlParams.get('githubLink');

    if (projectName && projectNameHeader) {
        projectNameHeader.textContent = projectName;
    }

    let username = '';
    let repo = '';
    let activeBranch = 'main';

    if (githubLink) {
        const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            username = match[1];
            repo = match[2].replace(/\.git$/, '');
        }
        if (githubBtn) {
            githubBtn.href = githubLink;
            githubBtn.setAttribute('target', '_blank');
            githubBtn.setAttribute('rel', 'noopener noreferrer');
        }
    } else if (githubBtn) {
        githubBtn.style.display = 'none';
    }

    // Global click interceptor to NEVER let the iframe navigate and get 404
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;

        // Header button opens directly via target="_blank"
        if (a.id === 'github-link-btn' || a.classList.contains('github-action-btn')) {
            return;
        }

        const rawHref = a.getAttribute('href');
        if (!rawHref) return;

        // In-page hash scrolling
        if (rawHref.startsWith('#')) {
            const targetId = rawHref.slice(1);
            const targetElem = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
            if (targetElem) {
                e.preventDefault();
                targetElem.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }

        if (rawHref.startsWith('mailto:') || rawHref.startsWith('javascript:')) return;

        // Prevent iframe internal navigation that causes 404
        e.preventDefault();
        e.stopPropagation();

        let finalUrl = rawHref;

        // If it's a relative path in markdown (e.g. docs/ru/index.md, src/core/, LICENSE-MIT)
        if (!rawHref.startsWith('http://') && !rawHref.startsWith('https://') && !rawHref.startsWith('//')) {
            if (username && repo) {
                const cleanPath = rawHref.replace(/^\.?\//, '');
                const isDir = cleanPath.endsWith('/') || !cleanPath.includes('.');
                const type = isDir ? 'tree' : 'blob';
                finalUrl = `https://github.com/${username}/${repo}/${type}/${activeBranch}/${cleanPath}`;
            } else if (githubLink) {
                finalUrl = `${githubLink.replace(/\/$/, '')}/blob/main/${rawHref.replace(/^\.?\//, '')}`;
            }
        }

        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }, true);

    if (username && repo) {
        const branches = ['main', 'master'];

        function tryFetchReadme(index) {
            if (index >= branches.length) {
                if (markdownContainer) {
                    markdownContainer.innerHTML = '<p style="color: #ff8080;">README not found for this repository.</p>';
                }
                return;
            }
            const branch = branches[index];
            activeBranch = branch;
            const readmeURL = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/README.md`;

            fetch(readmeURL)
                .then(response => {
                    if (!response.ok) {
                        tryFetchReadme(index + 1);
                        return null;
                    }
                    return response.text();
                })
                .then(markdown => {
                    if (!markdown) return;
                    if (window.marked) {
                        markdownContainer.innerHTML = marked.parse(markdown);

                        // Ensure all links point to GitHub and open in new tab
                        markdownContainer.querySelectorAll('a').forEach(a => {
                            const rawHref = a.getAttribute('href');
                            if (!rawHref) return;

                            a.setAttribute('target', '_blank');
                            a.setAttribute('rel', 'noopener noreferrer');

                            if (!rawHref.startsWith('http://') && !rawHref.startsWith('https://') && !rawHref.startsWith('#') && !rawHref.startsWith('mailto:')) {
                                const cleanPath = rawHref.replace(/^\.?\//, '');
                                const isDir = cleanPath.endsWith('/') || !cleanPath.includes('.');
                                const type = isDir ? 'tree' : 'blob';
                                const fullUrl = `https://github.com/${username}/${repo}/${type}/${activeBranch}/${cleanPath}`;
                                a.setAttribute('href', fullUrl);
                                a.href = fullUrl;
                            }
                        });

                        // Resolve relative images to raw.githubusercontent.com
                        markdownContainer.querySelectorAll('img').forEach(img => {
                            const rawSrc = img.getAttribute('src');
                            if (rawSrc && !rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
                                const cleanSrc = rawSrc.replace(/^\.?\//, '');
                                img.src = `https://raw.githubusercontent.com/${username}/${repo}/${activeBranch}/${cleanSrc}`;
                            }
                        });

                        if (window.Prism) {
                            Prism.highlightAllUnder(markdownContainer);
                        }
                    } else {
                        markdownContainer.textContent = markdown;
                    }
                })
                .catch(error => {
                    if (markdownContainer) {
                        markdownContainer.innerHTML = `<p style="color: #ff8080;">Error fetching README: ${error.message}</p>`;
                    }
                });
        }

        tryFetchReadme(0);
    } else if (markdownContainer) {
        markdownContainer.innerHTML = '<p>Project information not found.</p>';
    }
});
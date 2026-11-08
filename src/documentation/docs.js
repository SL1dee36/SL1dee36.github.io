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

                        // Ensure all links open in a new tab, and rewrite relative markdown links to GitHub
                        markdownContainer.querySelectorAll('a').forEach(a => {
                            const rawHref = a.getAttribute('href');
                            if (!rawHref) return;

                            a.setAttribute('target', '_blank');
                            a.setAttribute('rel', 'noopener noreferrer');

                            if (!rawHref.startsWith('http://') && !rawHref.startsWith('https://') && !rawHref.startsWith('#') && !rawHref.startsWith('mailto:')) {
                                const cleanPath = rawHref.replace(/^\.?\//, '');
                                a.href = `https://github.com/${username}/${repo}/blob/${branch}/${cleanPath}`;
                            }
                        });

                        // Resolve relative images to raw.githubusercontent.com
                        markdownContainer.querySelectorAll('img').forEach(img => {
                            const rawSrc = img.getAttribute('src');
                            if (rawSrc && !rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
                                const cleanSrc = rawSrc.replace(/^\.?\//, '');
                                img.src = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${cleanSrc}`;
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
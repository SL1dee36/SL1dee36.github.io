document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button') || document.querySelector('header button');
    const projectNameHeader = document.querySelector('header h1');
    const markdownContainer = document.getElementById('markdown-content');

    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('projectName');
    const githubLink = urlParams.get('githubLink');

    if (projectName && projectNameHeader) {
        projectNameHeader.textContent = projectName;
    }

    if (projectName && githubLink) {
        const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const username = match[1];
            const repo = match[2].replace(/\.git$/, '');
            const readmeURL = `https://raw.githubusercontent.com/${username}/${repo}/main/README.md`;

            fetch(readmeURL)
                .then(response => {
                    if (!response.ok) {
                        // Резервная попытка через ветку master, если main не существует
                        return fetch(`https://raw.githubusercontent.com/${username}/${repo}/master/README.md`)
                            .then(fallbackRes => {
                                if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${response.status}`);
                                return fallbackRes.text();
                            });
                    }
                    return response.text();
                })
                .then(markdown => {
                    if (window.marked) {
                        markdownContainer.innerHTML = marked.parse(markdown);
                    } else {
                        markdownContainer.textContent = markdown;
                    }
                })
                .catch(error => {
                    if (markdownContainer) {
                        markdownContainer.innerHTML = `<p style="color: #ff8080;">Error fetching README: ${error.message}</p>`;
                    }
                    console.error("Error fetching README:", error);
                });
        } else if (markdownContainer) {
            markdownContainer.innerHTML = "<p>Invalid GitHub link.</p>";
        }
    } else if (markdownContainer) {
        markdownContainer.innerHTML = "<p>Project information not found.</p>";
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            if (window.parent && window.parent !== window && window.parent.ModView) {
                window.parent.ModView.close();
            } else {
                window.location.href = '../../index.html';
            }
        });
    }
});
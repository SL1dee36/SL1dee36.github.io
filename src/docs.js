document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('header button');
    const projectNameHeader = document.querySelector('header h1');
    const markdownContainer = document.getElementById('markdown-content');

    // Get project info from URL parameters (set in index.html)
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('projectName');
    const githubLink = urlParams.get('githubLink');

    if (projectName && githubLink) {
        projectNameHeader.textContent = `${projectName}`;

        // Extract username and repo name from GitHub link
        const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const username = match[1];
            const repo = match[2];
            const readmeURL = `https://raw.githubusercontent.com/${username}/${repo}/main/README.md`;

            fetch(readmeURL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(markdown => {
                    markdownContainer.innerHTML = marked.parse(markdown); // Use marked.js

                    // Show documentation section, hide projects section (if needed)
                    document.getElementById('projects').classList.add('hidden');
                    document.getElementById('documentation').classList.remove('hidden');
                    document.getElementById('documentation').classList.add('visible');


                    backButton.style.display = 'block';

                })
                .catch(error => {
                    markdownContainer.innerHTML = `<p>Error fetching README: ${error.message}</p>`;
                    console.error("Error fetching README:", error);
                    backButton.style.display = 'block'; // Show back button even on error
                });
        } else {
            markdownContainer.innerHTML = "<p>Invalid GitHub link.</p>";
            backButton.style.display = 'block';  // Show back button even if GitHub link is invalid.

        }


    } else {
        markdownContainer.innerHTML = "<p>Project information not found.</p>";
        backButton.style.display = 'block';

    }


    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    backButton.style.display = 'none'; // Hide back button initially



});
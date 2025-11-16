document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');
    const postTitleHeader = document.getElementById('post-title');
    const postMetaHeader = document.getElementById('post-meta');
    const markdownContainer = document.getElementById('markdown-content');

    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');

    function parseMarkdownPost(markdown) {
        const lines = markdown.split('\n');
        const metadata = {};
        const bodyLines = [];
        let parsingMeta = true;

        for (const line of lines) {
            if (parsingMeta) {
                const metaMatch = line.match(/^([^:]+):\s*(.*)$/);
                if (metaMatch) {
                    const key = metaMatch[1].trim().toLowerCase();
                    const value = metaMatch[2].trim();
                    if (key === 'title') metadata.title = value;
                    else if (key === 'date') metadata.date = value;
                    else if (key === 'tags') metadata.tags = value.split(',').map(t => t.trim());
                    else if (key === 'categories') metadata.categories = value.split(',').map(c => c.trim());
                } else if (line.trim() === '' && Object.keys(metadata).length > 0) {
                    parsingMeta = false;
                } else {
                     if (line.trim() !== '') {
                        parsingMeta = false;
                        bodyLines.push(line);
                     }
                }
            } else {
                bodyLines.push(line);
            }
        }
        
        metadata.body = bodyLines.join('\n');
        return metadata;
    }

    if (postFilename) {
        const postURL = `src/blog/${postFilename}`;

        fetch(postURL)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(markdown => {
                const postData = parseMarkdownPost(markdown);
                document.title = postData.title;
                postTitleHeader.textContent = postData.title;
                postMetaHeader.innerHTML = `<p>${postData.date} | Categories: ${postData.categories.join(', ')}</p>`;
                markdownContainer.innerHTML = marked.parse(postData.body);
            })
            .catch(error => {
                markdownContainer.innerHTML = `<p>Error loading post: ${error.message}</p>`;
                console.error("Error fetching blog post:", error);
            });
    } else {
        markdownContainer.innerHTML = "<p>Post not found.</p>";
    }

    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
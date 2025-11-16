document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const homeButton = document.getElementById('home-button');
    const headerButtons = document.querySelectorAll('header .nav-links button');
    const mobileNavButtons = document.querySelectorAll('.mobile-nav button');
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');

    const mainContainer = document.querySelector('.main-container');
    const projectsSection = document.getElementById('projects');
    const blogSection = document.getElementById('blog');
    const aboutSection = document.getElementById('about');
    const allSections = [projectsSection, blogSection, aboutSection];
    
    const searchBar = document.getElementById('search-bar');
    let blogLoaded = false;

    // --- State ---
    // 'Home' view shows both projects and blog.
    let currentView = 'Home'; 

    // --- Functions ---

    /**
     * Updates the layout based on screen width, current view, and filter state.
     */
    function updateLayout() {
        const isWideScreen = window.innerWidth > 1280;
        const isFiltering = searchBar.value.trim() !== '';

        allSections.forEach(s => s.classList.remove('visible'));
        mainContainer.classList.remove('single-view');

        if (isFiltering) {
            // Filter mode always overrides view and shows a single list of results.
            mainContainer.classList.add('single-view');
            projectsSection.classList.add('visible');
            blogSection.classList.add('visible');
            if (!blogLoaded) loadBlogPosts();
            return; // Stop execution here for filter mode
        }

        // Logic for normal view modes (no filtering)
        switch (currentView) {
            case 'About Me':
                mainContainer.classList.add('single-view');
                aboutSection.classList.add('visible');
                break;
            
            case 'My repositories':
                mainContainer.classList.add('single-view');
                projectsSection.classList.add('visible');
                break;

            case 'Blog':
                mainContainer.classList.add('single-view');
                blogSection.classList.add('visible');
                if (!blogLoaded) loadBlogPosts();
                break;
            
            case 'Home':
            default:
                if (isWideScreen) {
                    // Two-column view for Home on wide screens
                    projectsSection.classList.add('visible');
                    blogSection.classList.add('visible');
                } else {
                    // Stacked single-column view for Home on narrow screens
                    mainContainer.classList.add('single-view');
                    projectsSection.classList.add('visible');
                    blogSection.classList.add('visible');
                }
                if (!blogLoaded) loadBlogPosts();
                break;
        }
    }

    /**
     * Sets the active button in both header and mobile nav.
     */
    function setActiveButton(viewName) {
        [headerButtons, mobileNavButtons].forEach(buttonList => {
            buttonList.forEach(btn => {
                btn.classList.toggle('active', btn.textContent === viewName);
            });
        });
    }

    /**
     * Handles clicks on any navigation button.
     */
    function handleNavClick(e) {
        const selectedView = e.target.textContent;
        currentView = selectedView; // Set the view based on the button clicked
        setActiveButton(selectedView);
        updateLayout();
        mobileNav.classList.remove('active');
        hamburger.classList.remove('active');
    }

    /**
     * Resets the entire page view to its default "Home" state.
     */
    function showHomeView() {
        searchBar.value = '';
        filterContent('');
        currentView = 'Home'; // Set the view to 'Home'
        setActiveButton('My repositories'); // Keep 'My repositories' as the visually active button for home
        updateLayout();
        mobileNav.classList.remove('active');
        hamburger.classList.remove('active');
    }

    async function loadBlogPosts() {
        if (blogLoaded) return;
        try {
            const response = await fetch('src/blog-manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            const manifest = await response.json();
            blogSection.innerHTML = '';
            for (const postFile of manifest.posts) {
                const postResponse = await fetch(`src/blog/${postFile}`);
                const markdown = await postResponse.text();
                const postData = parseMarkdownPost(markdown);
                const postElement = createBlogPostPreview(postData, postFile);
                blogSection.appendChild(postElement);
            }
            blogLoaded = true;
        } catch (error) {
            console.error('Failed to load blog posts:', error);
            blogSection.innerHTML = '<p>Could not load blog posts.</p>';
        }
    }

    function parseMarkdownPost(markdown) {
        const lines = markdown.split('\n');
        const metadata = { tags: [], categories: [] };
        let body = '';
        let parsingMeta = true;
        for (const line of lines) {
            if (parsingMeta) {
                const metaMatch = line.match(/^([^:]+):\s*(.*)$/);
                if (metaMatch) {
                    const key = metaMatch[1].trim().toLowerCase();
                    const value = metaMatch[2].trim();
                    if (key === 'title') metadata.title = value;
                    else if (key === 'date') metadata.date = value;
                    else if (key === 'tags') metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
                    else if (key === 'categories') metadata.categories = value.split(',').map(c => c.trim()).filter(Boolean);
                } else if (line.trim() === '' && Object.keys(metadata).length > 2) {
                    parsingMeta = false;
                }
            } else {
                body += line + '\n';
            }
        }
        metadata.body = body;
        return metadata;
    }

    function createBlogPostPreview(postData, filename) {
        const container = document.createElement('div');
        container.className = 'blog-post-preview';
        const snippet = postData.body.split('\n').find(line => line.length > 10 && !line.startsWith('#')) || '';
        const imageMatch = postData.body.match(/!\[.*\]\((.*?)\)/);
        const imageUrl = imageMatch ? imageMatch[1] : '';
        const categoriesHTML = postData.categories.map(cat => `<a href="#" class="meta-link" data-search="${cat}">${cat}</a>`).join(', ');
        const tagsHTML = postData.tags.map(tag => `<a href="#" class="meta-link" data-search="${tag}">${tag}</a>`).join(', ');
        container.innerHTML = `
            <h2><a href="blog-post.html?post=${filename}">${postData.title}</a></h2>
            <div class="blog-post-body">
                <div class="blog-post-summary">
                    <p>${snippet}...</p>
                    ${imageUrl ? `<img src="${imageUrl}" alt="${postData.title}">` : ''}
                    <br>
                    <a href="blog-post.html?post=${filename}" class="project-link">Read more</a>
                </div>
                <div class="blog-post-meta">
                    <p><strong>Date:</strong><br>${postData.date || 'N/A'}</p>
                    <p><strong>Categories:</strong><br>${categoriesHTML || 'N/A'}</p>
                    <p><strong>Tags:</strong><br>${tagsHTML || 'N/A'}</p>
                </div>
            </div>`;
        return container;
    }

    function filterContent(searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        document.querySelectorAll('#projects .project, #blog .blog-post-preview').forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            if (item.classList.contains('project')) {
                item.style.display = isVisible ? 'flex' : 'none';
            } else {
                item.style.display = isVisible ? 'block' : 'none';
            }
        });
    }
    
    // --- Event Listeners ---
    homeButton.addEventListener('click', showHomeView);
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });

    headerButtons.forEach(button => button.addEventListener('click', handleNavClick));
    mobileNavButtons.forEach(button => button.addEventListener('click', handleNavClick));
    window.addEventListener('resize', updateLayout);

    searchBar.addEventListener('input', (e) => {
        updateLayout();
        filterContent(e.target.value);
    });

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('meta-link')) {
            e.preventDefault();
            const searchTerm = e.target.dataset.search;
            searchBar.value = searchTerm;
            updateLayout();
            filterContent(searchTerm);
            searchBar.focus();
        }
    });

    // --- Initial Load ---
    setActiveButton('My repositories'); // Set default active button
    updateLayout(); // Initial layout render based on currentView = 'Home'
});
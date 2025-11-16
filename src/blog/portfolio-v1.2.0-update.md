Title: Portfolio 1.2.0: Blog and a Total Upgrade!
Date: August 15, 2025
Tags: update, portfolio, JavaScript, UI/UX, frontend
Categories: Project News, Web Development

Hello everyone! If this isn't your first time here, you've probably noticed that everything has changed. If you're visiting for the first time—welcome to the fresh, completely redesigned version of my portfolio!

The previous version was decent, but at its core, it remained a static showcase. I wanted to transform it into a living platform where you can not only see a list of projects but also learn something new, follow my thought process, and dive deeper into the development details.

That's how the idea for a major update was born. Let's take a look at what's new!

![New portfolio interface](src/images/blog/portfolio-1.2.0-update.jpg)

### The Main New Feature — The Blog

This is something I've been missing for a long time. Now I have a platform to:

- **Share insights:** Talk about non-obvious solutions in my projects.
- **Publish tutorials:** Explain complex things in simple terms.
- **Announce updates:** Just like in this article!

All posts are written in Markdown and are loaded dynamically, making the writing and publishing process as simple as possible.

### Smart Interface and Navigation

Interacting with the site has reached a new level.

1.  **Dynamic Layout:** On wide screens (>1280px), you see a convenient dashboard: projects on the left, blog on the right. This allows you to get a full overview of the content at a glance. On smaller devices, the site automatically switches to a comfortable single-column mode.

2.  **Global Search:** The search bar has moved to the header and now searches **everywhere at once**—through project titles and the content of blog posts.

3.  **Clickable Tags and Categories:** Notice the tags under the post title? Click on any of them, and the site will instantly filter all content, showing you only relevant projects and posts in a single list.

### Under the Hood

The most interesting part is that all this dynamic functionality works exclusively on the client side. No backends or databases—just static files and the magic of `fetch()`! JavaScript asynchronously loads a manifest with the list of posts and then the `.md` files themselves, rendering them on the fly. This ensures lightning-fast loading speeds and easy maintenance.

### What's Next?

This update is not the end, but just the beginning. I plan to regularly update the blog with new articles, share code, and possibly add new interactive features.

Thanks for stopping by! Explore, click, and search. I'd appreciate any feedback.
const buttons = document.querySelectorAll('.button-container button');
const aboutSection = document.getElementById('about');
const projectsSection = document.getElementById('projects');

buttons.forEach(button => {
    button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (button.textContent === 'My repositories') {
            aboutSection.classList.remove('visible');
            setTimeout(() => {
                 projectsSection.classList.add('visible');
            }, 50);
          
        } else if (button.textContent === 'About Me') {
             projectsSection.classList.remove('visible');
            setTimeout(() => {
                 aboutSection.classList.add('visible');
            }, 50);
        }
    });
});

// Initially, hide the about section
aboutSection.classList.remove('visible');
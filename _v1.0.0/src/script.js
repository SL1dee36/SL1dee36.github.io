const buttons = document.querySelectorAll('.button-container button');
const aboutMeSection = document.getElementById('AboutMe');
const projectsSection = document.getElementById('projects');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    if (button.textContent === 'My repositories') {
      aboutMeSection.classList.add('hidden');
      aboutMeSection.classList.remove('visible');
      projectsSection.classList.remove('hidden');
      setTimeout(() => {
         projectsSection.classList.add('visible');
      }, 50); // Задержка для анимации
    } else if (button.textContent === 'About Me') {
      projectsSection.classList.add('hidden');
      projectsSection.classList.remove('visible');
       aboutMeSection.classList.remove('hidden');
       setTimeout(() => {
           aboutMeSection.classList.add('visible');
       }, 50); // Задержка для анимации
    }
  });
});



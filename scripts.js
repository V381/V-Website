document.addEventListener('DOMContentLoaded', function() {
    AOS.init();

    // Smooth scrolling for links
    document.querySelectorAll('a.nav-link').forEach(function(anchor) {
        anchor.addEventListener('click', function(event) {
            if (this.hash !== "") {
                event.preventDefault();
                const hash = this.hash;
                const targetElement = document.querySelector(hash);
                const navbarHeight = document.querySelector('.navbar').offsetHeight;

                // Collapse the navbar after click
                document.querySelector('.navbar-collapse').classList.remove('show');

                window.scroll({
                    top: targetElement.offsetTop - navbarHeight,
                    behavior: 'smooth'
                });

                // Update URL hash without jumping
                history.pushState(null, null, hash);
            }
        });
    });

    const toggleButton = document.querySelector('.navbar-toggler');
    const navbarLinks = document.getElementById('navbarNav');

    toggleButton.addEventListener('click', function() {
        navbarLinks.classList.toggle('active');
    });

    // Ensure page starts at the top on mobile
    setTimeout(function() {
        window.scrollTo(0, 0);
    }, 100);

    // Animate numbers and circles
    function animateNumbersAndCircles() {
        document.querySelectorAll('.stat').forEach(function(stat) {
            const numberElement = stat.querySelector('.stat-number');
            const circleElement = stat.querySelector('.circle');
            const countTo = parseInt(numberElement.getAttribute('data-count'));
            const percentage = parseInt(circleElement.getAttribute('data-percentage'));
            let count = 0;
            let angle = 0;

            const interval = setInterval(function() {
                if (count >= countTo) {
                    clearInterval(interval);
                    numberElement.textContent = countTo;
                    circleElement.style.background = `conic-gradient(var(--primary-color-darker) ${percentage}%, transparent 0)`;
                } else {
                    count++;
                    angle = (count / countTo) * percentage;
                    numberElement.textContent = count;
                    circleElement.style.background = `conic-gradient(var(--primary-color-darker) ${angle}%, transparent 0)`;
                }
            }, 10);
        });
    }

    // Trigger number and circle animation when stats section is in view
    let statsAnimated = false;
    window.addEventListener('scroll', function() {
        const statsSection = document.getElementById('stats');
        const statsPosition = statsSection.getBoundingClientRect().top + window.scrollY;
        const viewportHeight = window.innerHeight;

        if (!statsAnimated && window.scrollY + viewportHeight >= statsPosition) {
            animateNumbersAndCircles();
            statsAnimated = true;
        }

        const navbar = document.querySelector('nav.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('shrink');
        } else {
            navbar.classList.remove('shrink');
        }

        // Highlight navbar links based on scroll position
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');

        sections.forEach((section) => {
            const sectionTop = section.offsetTop - document.querySelector('.navbar').offsetHeight;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = Array.from(navLinks).find(link => link.getAttribute('href') === `#${section.id}`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    });
});


(() => {
    document.getElementById('vehicle-pickup-form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const form = document.getElementById('vehicle-pickup-form');
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            vehicle: formData.get('vehicle'),
            pickupDate: formData.get('pickupDate')
        };

        try {
            const response = await fetch('/.netlify/functions/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Email Sent!',
                        text: 'Your vehicle pickup request has been sent successfully.',
                        confirmButtonText: 'OK'
                    });
                    form.reset();
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `An error occurred: ${error.message}`,
                confirmButtonText: 'OK'
            });
        }
    });
    });
})();
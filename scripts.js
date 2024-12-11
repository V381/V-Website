document.addEventListener('DOMContentLoaded', function() {
    AOS.init();
    

    // Smooth scrolling for links
    document.querySelectorAll('a.nav-link').forEach(function(anchor) {
        anchor.addEventListener('click', function(event) {
            // Check if this is the MON-SAT link
            if (this.innerHTML.includes('MON-SAT')) {
                event.preventDefault();
                const footer = document.querySelector('.footer');
                const navbarHeight = document.querySelector('.navbar').offsetHeight;

                // Collapse the navbar after click on mobile
                document.querySelector('.navbar-collapse').classList.remove('show');

                // Smooth scroll to footer
                window.scroll({
                    top: footer.offsetTop - navbarHeight,
                    behavior: 'smooth'
                });
            } else if (this.hash !== "") {
                // Original code for other nav links
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
    // Form validation
    document.getElementById('vehicle-pickup-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const pickupDateInput = document.getElementById('pickup-date');
        const dateError = document.getElementById('date-error');
        const selectedDate = new Date(pickupDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight to compare only date part

        if (selectedDate < today) {
            dateError.style.display = 'block';
            return;
        } else {
            dateError.style.display = 'none';
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

        const formData = new FormData(event.target);
        
        // Manually add the checkbox value to the form data
        const checkbox = document.getElementById('agreement');
        formData.append('sms', checkbox.checked ? 'on' : 'off'); 

        const formObject = Object.fromEntries(formData.entries());

        fetch('/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formObject)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Email sent successfully! You will be contacted soon!',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                document.getElementById('vehicle-pickup-form').reset();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Error sending email.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit';
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Error sending email.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit';
        });
    });
})();


document.addEventListener('DOMContentLoaded', function () {
    new Glide('.glide', {
      type: 'slider', 
      perView: 1,
      autoplay: 4000, 
      hoverpause: true, 
      animationDuration: 1200,
      animationTimingFunc: 'ease-in-out',
    }).mount();
  });
  
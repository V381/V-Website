document.addEventListener('DOMContentLoaded', function() {
    AOS.init();

    const isFirstVisit = !sessionStorage.getItem('hasVisited');
    const loader = document.querySelector('.loader-wrapper');
    
    if (isFirstVisit) {
        // Show loader on first visit
        loader.style.display = 'flex';
        
        // Hide loader and show content when everything is loaded
        window.addEventListener('load', function() {
            setTimeout(() => {
                document.body.classList.add('loaded');
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }, 100);
            
            // Set the flag in sessionStorage
            sessionStorage.setItem('hasVisited', 'true');
        });
    } else {
        // Hide loader and show content immediately for subsequent visits
        loader.style.display = 'none';
        // Small timeout to ensure smooth transition
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 50);
    }
    
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); // Match this with the CSS transition duration
    });

    // Prevent showing unstyled content during page load
    document.body.style.visibility = 'visible';

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
    // Form validation helper functions
    function validateName(name) {
        const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
        return {
            isValid: nameRegex.test(name.trim()),
            message: 'Please enter a valid name (2-50 characters, letters only)'
        };
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email.trim()),
            message: 'Please enter a valid email address'
        };
    }

    function validatePhone(phone) {
        // Allows formats: (123) 456-7890, 123-456-7890, 1234567890
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return {
            isValid: phoneRegex.test(phone.trim()),
            message: 'Please enter a valid phone number'
        };
    }

    function validateVehicle(vehicle) {
        return {
            isValid: vehicle.trim().length >= 3,
            message: 'Please enter valid vehicle details (minimum 3 characters)'
        };
    }

    function validateLocation(location) {
        return {
            isValid: location.trim().length >= 3,
            message: 'Please enter a valid location (minimum 3 characters)'
        };
    }

    function validateDate(date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return {
            isValid: selectedDate >= today,
            message: 'Please select a future date'
        };
    }

    // Create error message element
    function createErrorElement(fieldId, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-danger mt-1';
        errorDiv.id = `${fieldId}-error`;
        errorDiv.textContent = message;
        return errorDiv;
    }

    // Show error message
    function showError(field, message) {
        let errorDiv = document.getElementById(`${field.id}-error`);
        if (!errorDiv) {
            errorDiv = createErrorElement(field.id, message);
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        field.classList.add('is-invalid');
    }

    // Clear all error messages
    function clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
        
        const invalidFields = document.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => field.classList.remove('is-invalid'));
    }
    
    // Validate individual field
    function validateField(field) {
        let validation = { isValid: true, message: '' };
        
        switch(field.id) {
            case 'name':
                validation = validateName(field.value);
                break;
            case 'email':
                validation = validateEmail(field.value);
                break;
            case 'phone':
                validation = validatePhone(field.value);
                break;
            case 'vehicle':
                validation = validateVehicle(field.value);
                break;
            case 'origin':
            case 'destination':
                validation = validateLocation(field.value);
                break;
            case 'pickup-date':
                validation = validateDate(field.value);
                break;
        }
        
        if (!validation.isValid) {
            showError(field, validation.message);
            return false;
        }
        return true;
    }

    const form = document.getElementById('vehicle-pickup-form');

    // Form submit handler
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Clear any existing error messages first
        clearAllErrors();
        
        // Validate all fields
        const fields = ['name', 'email', 'phone', 'vehicle', 'origin', 'destination', 'pickup-date'];
        let isValid = true;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            return;
        }

        // If validation passes, proceed with form submission
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

        const formData = new FormData(event.target);
        
        // Manually add the checkbox value to the form data
        const agreement = document.getElementById('agreement');
        formData.append('sms', agreement.checked ? 'on' : 'off');
        
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
                form.reset();
                clearAllErrors(); // Clear any remaining error messages after successful submission
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Error sending email.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Error sending email.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        })
        .finally(() => {
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
  
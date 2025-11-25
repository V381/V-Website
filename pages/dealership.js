document.addEventListener('DOMContentLoaded', () => {
    // Loader functionality
    const isFirstVisit = !sessionStorage.getItem('hasVisited');
    const loader = document.querySelector('.loader-wrapper');
    
    if (isFirstVisit) {
        loader.style.display = 'flex';
        window.addEventListener('load', function() {
            setTimeout(() => {
                document.body.classList.add('loaded');
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }, 100);
            sessionStorage.setItem('hasVisited', 'true');
        });
    } else {
        loader.style.display = 'none';
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 50);
    }

    document.body.classList.add('loaded');

    const { createApp } = Vue;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    createApp({
        data() {
            return {
                steps: [
                    { title: 'Basic Details', fields: ['companyName', 'customerName', 'customerPhone', 'email', 'vehicleYear', 'vehicleMakeModel'] },
                    { title: 'Pickup Details', fields: ['pickupAddress', 'pickupCity', 'pickupState', 'pickupZip', 'pickupContact'] },
                    { title: 'Delivery Location', fields: ['deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip', 'deliveryContact'] },
                    { title: 'Pickup Date', fields: ['pickupDate'] }
                ],
                currentStep: 0,
                today: new Date().toISOString().split('T')[0],
                submitting: false,
                message: '',
                messageType: 'success',
                errors: {},
                formData: {
                    companyName: '',
                    customerName: '',
                    customerPhone: '',
                    email: '',
                    vehicleYear: '',
                    vehicleMakeModel: '',
                    pickupAddress: '',
                    pickupCity: '',
                    pickupState: '',
                    pickupZip: '',
                    pickupContact: '',
                    deliveryAddress: '',
                    deliveryCity: '',
                    deliveryState: '',
                    deliveryZip: '',
                    deliveryContact: '',
                    pickupDate: ''
                }
            };
        },
        computed: {
            progressPercent() {
                return (this.currentStep / (this.steps.length - 1)) * 100;
            }
        },
        methods: {
            clearError(field) {
                if (this.errors[field]) {
                    const updated = { ...this.errors };
                    delete updated[field];
                    this.errors = updated;
                }
            },
            validateStep(index = this.currentStep) {
                const fields = this.steps[index].fields;
                const updatedErrors = { ...this.errors };

                fields.forEach((field) => {
                    const value = (this.formData[field] ?? '').toString().trim();
                    let errorMessage = '';

                    if (!value) {
                        errorMessage = 'This field is required.';
                    } else if (field === 'email' && !emailRegex.test(value)) {
                        errorMessage = 'Please enter a valid email.';
                    } else if (field === 'pickupDate' && value < this.today) {
                        errorMessage = 'Date cannot be in the past.';
                    } else if ((field === 'vehicleYear') && (Number(value) < 1900 || Number(value) > 2100)) {
                        errorMessage = 'Enter a valid year.';
                    }

                    if (errorMessage) {
                        updatedErrors[field] = errorMessage;
                    } else {
                        delete updatedErrors[field];
                    }
                });

                this.errors = updatedErrors;
                return fields.every((field) => !this.errors[field]);
            },
            nextStep() {
                if (this.validateStep()) {
                    this.currentStep += 1;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
            prevStep() {
                if (this.currentStep > 0) {
                    this.currentStep -= 1;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
            async submitRequest() {
                const firstInvalidIndex = this.steps.findIndex((_, idx) => !this.validateStep(idx));
                if (firstInvalidIndex !== -1) {
                    this.currentStep = firstInvalidIndex;
                    return;
                }

                this.submitting = true;
                this.message = '';

                try {
                    const endpoint = '/.netlify/functions/dealershipRequest';

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.formData)
                    });

                    const contentType = response.headers.get('content-type') || '';
                    const isJson = contentType.includes('application/json');
                    const raw = await response.text();
                    let data = {};

                    // Always try to parse JSON so success responses without JSON headers still work
                    if (raw) {
                        try {
                            data = JSON.parse(raw);
                        } catch (parseError) {
                            if (isJson) {
                                console.error('Failed to parse JSON response', parseError);
                            }
                        }
                    }

                    // Treat any 2xx response as success unless the payload explicitly sets success to false
                    const wasSuccessful = response.ok && (data.success !== false);

                    if (wasSuccessful) {
                        this.messageType = 'success';
                        this.message = data.message || 'Request submitted successfully. Our team will reach out shortly.';
                        
                        // Fixed SWAL call with proper syntax
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                title: 'Success!',
                                text: this.message,
                                icon: 'success',
                                iconColor: '#28a745',
                                confirmButtonColor: '#28a745'
                            });
                        }
                        this.resetForm();
                    } else {
                        // Handle error case
                        const errorMessage = (data && data.message) || raw || 'Unable to submit request.';
                        throw new Error(errorMessage);
                    }
                } catch (error) {
                    console.error(error);
                    this.messageType = 'danger';
                    this.message = error.message || 'There was a problem submitting your request.';
                    
                    // Fixed SWAL call with proper syntax
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: 'Error',
                            text: this.message,
                            icon: 'error'
                        });
                    }
                } finally {
                    this.submitting = false;
                }
            },
            resetForm() {
                this.formData = {
                    companyName: '',
                    customerName: '',
                    customerPhone: '',
                    email: '',
                    vehicleYear: '',
                    vehicleMakeModel: '',
                    pickupAddress: '',
                    pickupCity: '',
                    pickupState: '',
                    pickupZip: '',
                    pickupContact: '',
                    deliveryAddress: '',
                    deliveryCity: '',
                    deliveryState: '',
                    deliveryZip: '',
                    deliveryContact: '',
                    pickupDate: ''
                };
                this.errors = {};
                this.currentStep = 0;
            }
        }
    }).mount('#dealership-app');
});

(() => {
    document.addEventListener('DOMContentLoaded', function () {
        const trigger = document.getElementById('help-widget-trigger');
        const panel = document.getElementById('help-widget-panel');
        const closeBtn = document.getElementById('help-widget-close');
        const form = document.getElementById('help-widget-form');
        const fileInput = document.getElementById('help-attachment');
        const fileNameLabel = document.getElementById('help-attach-filename');
        const removeBtn = document.getElementById('help-attach-remove');
        const preview = document.getElementById('help-attach-preview');

        if (!trigger || !panel || !form) {
            return;
        }

        const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
        let attachmentData = null; // { filename, type, content (base64) }

        function openPanel() {
            panel.classList.add('is-open');
            trigger.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            const nameField = document.getElementById('help-name');
            if (nameField) {
                nameField.focus();
            }
        }

        function closePanel() {
            panel.classList.remove('is-open');
            trigger.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function () {
            if (panel.classList.contains('is-open')) {
                closePanel();
            } else {
                openPanel();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closePanel);
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && panel.classList.contains('is-open')) {
                closePanel();
            }
        });

        document.addEventListener('click', function (event) {
            if (!panel.classList.contains('is-open')) return;
            if (panel.contains(event.target) || trigger.contains(event.target)) return;
            closePanel();
        });

        function clearAttachment() {
            attachmentData = null;
            if (fileInput) fileInput.value = '';
            if (fileNameLabel) fileNameLabel.textContent = '';
            if (removeBtn) removeBtn.style.display = 'none';
            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
        }

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                const file = fileInput.files && fileInput.files[0];
                if (!file) {
                    clearAttachment();
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    if (window.Swal) {
                        Swal.fire({
                            title: 'Invalid file',
                            text: 'Please choose an image file.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                    clearAttachment();
                    return;
                }

                if (file.size > MAX_FILE_SIZE) {
                    if (window.Swal) {
                        Swal.fire({
                            title: 'File too large',
                            text: 'Please choose an image smaller than 4MB.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                    clearAttachment();
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    const result = event.target.result; // data:<type>;base64,<data>
                    const base64 = result.substring(result.indexOf(',') + 1);
                    attachmentData = {
                        filename: file.name,
                        type: file.type,
                        content: base64
                    };
                    if (fileNameLabel) fileNameLabel.textContent = file.name;
                    if (removeBtn) removeBtn.style.display = 'inline';
                    if (preview) {
                        preview.src = result;
                        preview.style.display = 'block';
                    }
                };
                reader.onerror = function () {
                    if (window.Swal) {
                        Swal.fire({
                            title: 'Error',
                            text: 'Could not read the selected file.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                    clearAttachment();
                };
                reader.readAsDataURL(file);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', clearAttachment);
        }

        function validateHelpEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const name = document.getElementById('help-name').value.trim();
            const subject = document.getElementById('help-subject').value.trim();
            const email = document.getElementById('help-email').value.trim();
            const message = document.getElementById('help-message').value.trim();
            const honeypotField = document.getElementById('help-honeypot');
            const honeypot = honeypotField ? honeypotField.value : '';

            if (!name || !subject || !email || !message) {
                if (window.Swal) {
                    Swal.fire({
                        title: 'Missing information',
                        text: 'Please fill in all fields.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                }
                return;
            }

            if (!validateHelpEmail(email)) {
                if (window.Swal) {
                    Swal.fire({
                        title: 'Invalid email',
                        text: 'Please enter a valid email address.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                }
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalHtml = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

            const payload = {
                name: name,
                subject: subject,
                email: email,
                message: message,
                honeypot: honeypot
            };

            if (attachmentData) {
                payload.attachment = attachmentData;
            }

            fetch('/send-help-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.success) {
                        if (window.Swal) {
                            Swal.fire({
                                title: 'Message sent!',
                                text: 'Thanks for reaching out, we will get back to you soon.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
                        }
                        form.reset();
                        clearAttachment();
                        closePanel();
                    } else {
                        if (window.Swal) {
                            Swal.fire({
                                title: 'Error!',
                                text: (data && data.message) || 'Error sending your message.',
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    }
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    if (window.Swal) {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Error sending your message.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                })
                .finally(function () {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalHtml;
                });
        });
    });
})();
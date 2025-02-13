document.addEventListener('DOMContentLoaded', function() {
    // Tab handling for code viewer
    const tabs = document.querySelectorAll('.code-tab');
    const contents = document.querySelectorAll('.code-content');
    
    // Presentation handling
    const presentationContainer = document.querySelector('.presentation-container');
    const slideContainer = document.querySelector('.slide-container');
    const prevButton = document.querySelector('.slide-nav.prev');
    const nextButton = document.querySelector('.slide-nav.next');
    let currentSlide = 0;
    let slides = [];
    
    // Function to load code files
    async function loadCodeFile(filename) {
        try {
            const response = await fetch(`assets/code/${filename}.txt`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return text;
        } catch (error) {
            console.error('Error loading file:', error);
            return `Error loading file content: ${error.message}`;
        }
    }

    // Handle tab clicks
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get file name and corresponding content element
            const file = tab.dataset.file;
            const contentId = file.split('.')[0] + '-content';
            const contentElement = document.getElementById(contentId);
            
            // Show content and load file
            contentElement.classList.add('active');
            loadCodeFile(file).then(content => {
                contentElement.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
            });
        });
    });

    // Load initial code file
    loadCodeFile('index.html').then(content => {
        document.getElementById('html-content').innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    });

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Function to load file content for code viewer
    async function loadFileContent(filename) {
        try {
            const response = await fetch(`/assets/code/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return text;
        } catch (error) {
            console.error('Error loading file:', error);
            return `Error loading file content: ${error.message}`;
        }
    }

    // Initialize presentation
    async function initializePresentation() {
        try {
            // First try to load PDF
            const pdfResponse = await fetch('/assets/presentation/presentation.pdf');
            if (pdfResponse.ok) {
                // If PDF exists, use PDF viewer
                const pdfViewer = document.createElement('iframe');
                pdfViewer.className = 'pdf-view';
                pdfViewer.src = '/assets/presentation/presentation.pdf';
                presentationContainer.innerHTML = '';
                presentationContainer.appendChild(pdfViewer);
                return;
            }

            // If PDF not found, try loading slides
            const slidesResponse = await fetch('/assets/presentation/slides.json');
            if (slidesResponse.ok) {
                const slideData = await slidesResponse.json();
                slides = slideData.slides;
                initializeSlideshow();
            } else {
                throw new Error('No presentation content found');
            }
        } catch (error) {
            console.error('Error initializing presentation:', error);
            presentationContainer.innerHTML = '<p class="error">Error loading presentation. Please ensure content is properly exported from LaTeX.</p>';
        }
    }

    function initializeSlideshow() {
        if (slides.length === 0) return;

        // Clear existing content
        slideContainer.innerHTML = '';

        // Create slide elements
        slides.forEach((slide, index) => {
            const img = document.createElement('img');
            img.src = slide.url;
            img.alt = `Slide ${index + 1}`;
            img.className = `slide ${index === 0 ? 'active' : ''}`;
            slideContainer.appendChild(img);
        });

        updateSlideNavigation();
    }

    function updateSlideNavigation() {
        const slideElements = document.querySelectorAll('.slide');
        slideElements.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });

        // Update navigation buttons
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === slides.length - 1;
    }

    // Event listeners for slide navigation
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlideNavigation();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                updateSlideNavigation();
            }
        });
    }
    
});
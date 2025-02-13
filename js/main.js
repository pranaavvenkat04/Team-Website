document.addEventListener('DOMContentLoaded', () => {
    initializeTeamImages();
    initializeMobileMenu();
    initializeNavigation();
    initializePresentation();
    initializeCodeViewer();
    initializeTeamAnimations();
    initializeFooter();
});

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

function initializeFooter() {
    const elements = [
        '.footer-logo-container',
        '.footer-title',
        '.back-to-top-content'
    ].map(selector => document.querySelector(selector));

    elements.forEach(element => {
        if (element) element.addEventListener('click', scrollToTop);
    });
}

function initializeTeamImages() {
    document.querySelectorAll('.image-container img').forEach(img => {
        img.onerror = () => {
            const initials = (img.alt || 'Team Member')
                .split(' ')
                .map(n => n[0])
                .join('');
            
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'image-fallback';
            fallbackDiv.textContent = initials;
            img.parentNode.replaceChild(fallbackDiv, img);
        };
    });
}

function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileMenuBtn) return;

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}

function initializeNavigation() {
    const logo = document.querySelector('.logo');
    if (logo) logo.addEventListener('click', scrollToTop);

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.querySelector(link.getAttribute('href'));
            
            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

function initializeTeamAnimations() {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );

    document.querySelectorAll('.team-member').forEach(member => {
        member.style.opacity = '1';
        member.style.transform = 'none';
    });
}

function initializePresentation() {
    const container = document.querySelector('.presentation-container');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');
    const slideNumber = document.getElementById('slideNumber');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;

    function calculateScale() {
        return (container.clientWidth - 20) / 1000;
    }
    
    function renderPage(num) {
        pageRendering = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.textContent = 'Loading page...';
        container.appendChild(loadingDiv);
        
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: calculateScale() });
            const canvas = document.getElementById('presentation-canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            page.render({
                canvasContext: context,
                viewport: viewport
            }).promise.then(() => {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
                loadingDiv.remove();
                updatePageCount();
            });
        });
    }
    
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }
    
    function updatePageCount() {
        slideNumber.textContent = `${pageNum} / ${pdfDoc.numPages}`;
        prevButton.disabled = pageNum <= 1;
        nextButton.disabled = pageNum >= pdfDoc.numPages;
    }
    
    const canvas = document.createElement('canvas');
    canvas.id = 'presentation-canvas';
    canvas.className = 'presentation-canvas';
    container.appendChild(canvas);
    
    pdfjsLib.getDocument('assets/presentation/presentation.pdf').promise
        .then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            renderPage(pageNum);
            
            prevButton.addEventListener('click', () => {
                if (pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
            });
            
            nextButton.addEventListener('click', () => {
                if (pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' && pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
                if (e.key === 'ArrowRight' && pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            });
        })
        .catch(error => {
            container.innerHTML = `
                <div class="error-message">
                    Error loading presentation. Please ensure the PDF file exists and try again.
                </div>
            `;
        });
    
    window.addEventListener('resize', debounce(() => {
        if (pdfDoc) renderPage(pageNum);
    }, 250));
}

function initializeCodeViewer() {
    const tabs = document.querySelectorAll('.code-tab');
    document.querySelectorAll('.code-content').forEach(content => {
        content.style.display = 'none';
    });

    function switchTab(tab, fileType) {
        document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.code-content').forEach(c => {
            c.classList.remove('active');
            c.style.display = 'none';
        });
        
        tab.classList.add('active');
        const content = document.getElementById(`${fileType}-content`);
        if (content) {
            content.classList.add('active');
            content.style.display = 'block';
            loadCodeFile(fileType, content);
        }
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab, tab.getAttribute('data-tab'));
        });
    });

    if (tabs.length > 0) {
        switchTab(tabs[0], tabs[0].getAttribute('data-tab'));
    }
}

async function loadCodeFile(fileType, contentElement) {
    const fileMap = {
        html: 'indexHTML.txt',
        css: 'stylesCSS.txt',
        js: 'mainJS.txt'
    };

    try {
        contentElement.innerHTML = '<div class="loading">Loading...</div>';
        
        const response = await fetch(`/assets/code/${fileMap[fileType]}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const content = await response.text();
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        contentElement.innerHTML = `<pre><code class="language-${fileType}">${escapedContent}</code></pre>`;
        
        if (window.Prism) {
            Prism.highlightElement(contentElement.querySelector('code'));
        }
    } catch (error) {
        contentElement.innerHTML = `
            <div class="error">
                Error loading file: ${error.message}
            </div>
        `;
    }
}
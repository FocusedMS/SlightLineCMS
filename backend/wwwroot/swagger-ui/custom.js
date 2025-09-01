// Custom Swagger UI JavaScript Enhancements
(function() {
    'use strict';
    
    // Wait for Swagger UI to load
    function waitForSwaggerUI() {
        if (typeof SwaggerUIBundle !== 'undefined') {
            enhanceSwaggerUI();
        } else {
            setTimeout(waitForSwaggerUI, 100);
        }
    }
    
    function enhanceSwaggerUI() {
        // Add custom header with API information
        addCustomHeader();
        
        // Enhance operation descriptions
        enhanceOperationDescriptions();
        
        // Add copy button functionality
        addCopyButtons();
        
        // Add search functionality
        addSearchEnhancement();
        
        // Add keyboard shortcuts
        addKeyboardShortcuts();
    }
    
    function addCustomHeader() {
        const header = document.createElement('div');
        header.className = 'custom-api-header';
        header.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Blog CMS API Documentation</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Comprehensive REST API for Blogging & Content Management System
                </p>
                <div style="margin-top: 15px;">
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; margin: 0 5px; font-size: 12px;">
                        🔐 JWT Authentication
                    </span>
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; margin: 0 5px; font-size: 12px;">
                        📝 Content Management
                    </span>
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; margin: 0 5px; font-size: 12px;">
                        🔍 SEO Analysis
                    </span>
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; margin: 0 5px; font-size: 12px;">
                        🖼️ Media Upload
                    </span>
                </div>
            </div>
        `;
        
        const infoSection = document.querySelector('.swagger-ui .info');
        if (infoSection) {
            infoSection.parentNode.insertBefore(header, infoSection);
        }
    }
    
    function enhanceOperationDescriptions() {
        // Add icons to operation methods
        const operations = document.querySelectorAll('.opblock-summary-method');
        operations.forEach(op => {
            const method = op.textContent.toLowerCase();
            const icon = getMethodIcon(method);
            if (icon) {
                op.innerHTML = `<span style="margin-right: 5px;">${icon}</span>${op.textContent}`;
            }
        });
    }
    
    function getMethodIcon(method) {
        const icons = {
            'get': '📖',
            'post': '➕',
            'put': '✏️',
            'delete': '🗑️',
            'patch': '🔧'
        };
        return icons[method] || '';
    }
    
    function addCopyButtons() {
        // Add copy buttons to code blocks
        const codeBlocks = document.querySelectorAll('.highlight-code');
        codeBlocks.forEach(block => {
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '📋 Copy';
            copyBtn.className = 'copy-btn';
            copyBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #3498db;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            copyBtn.addEventListener('click', () => {
                const code = block.querySelector('.microlight').textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                    }, 2000);
                });
            });
            
            block.style.position = 'relative';
            block.appendChild(copyBtn);
        });
    }
    
    function addSearchEnhancement() {
        // Enhance the search functionality
        const searchBox = document.querySelector('.swagger-ui .filter input');
        if (searchBox) {
            searchBox.placeholder = '🔍 Search endpoints, descriptions, or tags...';
            searchBox.style.cssText = `
                padding: 10px 15px;
                border: 2px solid #e9ecef;
                border-radius: 6px;
                font-size: 14px;
                width: 100%;
                max-width: 400px;
            `;
        }
    }
    
    function addKeyboardShortcuts() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchBox = document.querySelector('.swagger-ui .filter input');
                if (searchBox) {
                    searchBox.focus();
                }
            }
            
            // Ctrl/Cmd + / to toggle all operations
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const toggleBtns = document.querySelectorAll('.opblock-summary-toggle');
                toggleBtns.forEach(btn => btn.click());
            }
        });
    }
    
    // Add helpful tooltips
    function addTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                tooltip.style.cssText = `
                    position: absolute;
                    background: #2c3e50;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1000;
                    pointer-events: none;
                    max-width: 200px;
                    word-wrap: break-word;
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.bottom + 5) + 'px';
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.custom-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }
    
    // Initialize enhancements
    waitForSwaggerUI();
    
    // Re-apply enhancements when content changes (for dynamic content)
    const observer = new MutationObserver(() => {
        setTimeout(enhanceSwaggerUI, 100);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();

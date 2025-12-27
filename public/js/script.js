document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
    
    const userAgent = navigator.userAgent;
    console.log('User Agent:', userAgent);
    
    detectMyDevice(userAgent);
});

async function detectMyDevice(userAgent) {
    const loader = document.getElementById('main-loader');
    const modelDisplay = document.getElementById('detected-model');
    const detectInfo = document.querySelector('.detect-info');
    
    loader.style.display = 'block';
    modelDisplay.textContent = 'Analyzing your device...';
    
    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userAgent: userAgent })
        });
        
        const data = await response.json();
        
        if (data.success && data.devices && data.devices.length > 0) {
            modelDisplay.textContent = `Detected: ${data.detectedModel}`;
            detectInfo.querySelector('i').className = 'fas fa-check-circle';
            detectInfo.querySelector('i').style.color = 'var(--success-color)';
            
            if (data.devices.length === 1) {
                setTimeout(() => {
                    loadDeviceInfo(data.devices[0].url, userAgent);
                }, 500);
            } else {
                loader.style.display = 'none';
                showDeviceOptions(data.devices, userAgent);
            }
        } else {
            showError(data.message || 'Could not detect your device automatically');
        }
    } catch (error) {
        showError('Error detecting device: ' + error.message);
    }
}

function showDeviceOptions(devices, userAgent) {
    const selection = document.getElementById('device-selection');
    const options = document.getElementById('device-options');
    
    options.innerHTML = '';
    
    devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-option-card';
        card.innerHTML = `
            <img src="${device.image}" alt="${device.name}" onerror="this.src='https://fdn2.gsmarena.com/vv/bigpic/default.jpg'">
            <h4>${device.name}</h4>
        `;
        card.onclick = () => {
            selection.style.display = 'none';
            const loader = document.getElementById('main-loader');
            loader.style.display = 'block';
            loadDeviceInfo(device.url, userAgent);
        };
        options.appendChild(card);
    });
    
    selection.style.display = 'block';
}

async function loadDeviceInfo(url, userAgent) {
    const loader = document.getElementById('main-loader');
    const container = document.getElementById('device-info-container');
    const detectInfo = document.querySelector('.detect-info');
    
    loader.style.display = 'block';
    
    try {
        const response = await fetch('/api/device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                url: url,
                userAgent: userAgent 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            detectInfo.style.display = 'none';
            displayDeviceInfo(data.device);
            container.style.display = 'block';
            
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        } else {
            showError(data.message);
        }
    } catch (error) {
        showError('Error loading device info: ' + error.message);
    } finally {
        loader.style.display = 'none';
    }
}

function displayDeviceInfo(device) {
    document.getElementById('device-name').textContent = device.name || 'Unknown Device';
    document.getElementById('device-subtitle').textContent = device.subtitle || '';
    
    const deviceImage = document.getElementById('device-image');
    deviceImage.src = device.image || 'https://fdn2.gsmarena.com/vv/bigpic/default.jpg';
    deviceImage.alt = device.name;
    deviceImage.onerror = function() {
        this.src = 'https://fdn2.gsmarena.com/vv/bigpic/default.jpg';
    };
    
    if (device.popularity) {
        const popularityDiv = document.getElementById('device-popularity');
        popularityDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 5px;">
                    ${device.popularity.percentage || 'N/A'}
                </div>
                <div style="font-size: 0.9rem; color: var(--text-light);">
                    ${device.popularity.hits || 'Popularity'}
                </div>
            </div>
        `;
    }
    
    displayQuickSpecs(device.quickSpecs);
    displayFullSpecs(device.specs);
}

function displayQuickSpecs(quickSpecs) {
    const quickSpecsContent = document.getElementById('quick-specs-content');
    quickSpecsContent.innerHTML = '';
    
    if (!quickSpecs || Object.keys(quickSpecs).length === 0) {
        quickSpecsContent.innerHTML = '<p style="color: var(--text-light);">No quick specs available</p>';
        return;
    }
    
    for (const [key, value] of Object.entries(quickSpecs)) {
        const specItem = document.createElement('div');
        specItem.className = 'spec-item fade-in';
        
        if (typeof value === 'object' && value !== null && value.value) {
            specItem.innerHTML = `
                <div class="spec-value">${escapeHtml(value.value)}</div>
                <div class="spec-detail">${escapeHtml(value.detail || '')}</div>
            `;
        } else if (typeof value === 'string') {
            const cleanValue = value.replace(/<i class="[^"]*"><\/i>/g, '').trim();
            
            if (cleanValue) {
                specItem.innerHTML = `<div class="spec-text">${escapeHtml(cleanValue)}</div>`;
            } else {
                specItem.style.display = 'none';
            }
        }
        
        quickSpecsContent.appendChild(specItem);
    }
}

function displayFullSpecs(specs) {
    const fullSpecsContent = document.getElementById('full-specs-content');
    fullSpecsContent.innerHTML = '';
    
    if (!specs || Object.keys(specs).length === 0) {
        fullSpecsContent.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 40px;">No detailed specifications available</p>';
        return;
    }
    
    for (const [category, categorySpecs] of Object.entries(specs)) {
        if (!categorySpecs || Object.keys(categorySpecs).length === 0) continue;
        
        const categorySection = document.createElement('div');
        categorySection.className = 'spec-category fade-in';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categorySection.appendChild(categoryTitle);
        
        const specTable = document.createElement('table');
        specTable.className = 'spec-table';
        
        const tbody = document.createElement('tbody');
        
        for (const [label, value] of Object.entries(categorySpecs)) {
            if (!value || value.trim() === '') continue;
            
            const row = document.createElement('tr');
            
            const labelCell = document.createElement('td');
            labelCell.className = 'spec-label';
            labelCell.textContent = label;
            
            const valueCell = document.createElement('td');
            valueCell.className = 'spec-value-cell';
            valueCell.innerHTML = formatSpecValue(value);
            
            row.appendChild(labelCell);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }
        
        specTable.appendChild(tbody);
        categorySection.appendChild(specTable);
        fullSpecsContent.appendChild(categorySection);
    }
}

function formatSpecValue(value) {
    if (!value) return '';
    
    let formatted = escapeHtml(value.toString());
    
    formatted = formatted.replace(/\n/g, '<br>');
    
    formatted = formatted.replace(/(\d+\.?\d*)\s*(MP|GB|RAM|mAh|MHz|GHz|mm|inches?|cm|Hz|W|nits?)/gi, 
        '<strong>$1 $2</strong>');
    
    formatted = formatted.replace(/(\d{3,4})\s*x\s*(\d{3,4})/g, '<strong>$1 x $2</strong>');
    
    return formatted;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    const loader = document.getElementById('main-loader');
    const container = document.getElementById('device-info-container');
    const selection = document.getElementById('device-selection');
    const detectInfo = document.querySelector('.detect-info');
    
    loader.style.display = 'none';
    selection.style.display = 'none';
    
    detectInfo.querySelector('i').className = 'fas fa-exclamation-triangle';
    detectInfo.querySelector('i').style.color = 'var(--error-color)';
    detectInfo.querySelector('h2').textContent = 'Detection Failed';
    
    container.innerHTML = `
        <div class="error-message fade-in">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Detect Device</h3>
            <p>${escapeHtml(message)}</p>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 20px;">
                This might happen if:
            </p>
            <ul style="text-align: left; max-width: 400px; margin: 15px auto; color: var(--text-light);">
                <li>Your device is too new or not in the GSMArena database</li>
                <li>You're using a desktop browser</li>
                <li>Your browser's user agent is modified</li>
            </ul>
            <button onclick="location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('Service Worker support detected');
    });
}

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href') === '#') {
        e.preventDefault();
    }
});

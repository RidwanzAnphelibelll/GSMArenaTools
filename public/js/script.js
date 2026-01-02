function handleSearch() {
    const searchInput = document.getElementById('phone-search');
    const query = searchInput.value.trim();
    
    if (query) {
        searchPhones(query);
    } else {
        showError('Please enter a phone model!');
    }
}

function clearAll() {
    const searchInput = document.getElementById('phone-search');
    const clearBtn = document.getElementById('clear-search');
    const errorMessage = document.getElementById('error-message');
    const searchResults = document.getElementById('search-results');
    const specsContainer = document.getElementById('specs-container');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    errorMessage.classList.remove('active');
    searchResults.classList.remove('active');
    specsContainer.style.display = 'none';
    searchInput.focus();
}

function searchPhones(query) {
    const loader = document.getElementById('loader');
    const loaderText = loader.querySelector('p');
    const errorMessage = document.getElementById('error-message');
    const searchResults = document.getElementById('search-results');
    const specsContainer = document.getElementById('specs-container');
    
    loaderText.textContent = 'Searching for "' + query + '"...';
    loader.classList.add('active');
    errorMessage.classList.remove('active');
    searchResults.classList.remove('active');
    specsContainer.style.display = 'none';
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/search/' + encodeURIComponent(query), true);
    
    xhr.onload = function() {
        loader.classList.remove('active');
        
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                
                if (data.success && data.results && data.results.length > 0) {
                    displaySearchResults(data.results, query);
                } else {
                    showError('No phones found matching "' + query + '"');
                }
            } catch (e) {
                showError('Failed to parse response data!');
            }
        } else {
            showError('Failed to search. Please try again.');
        }
    };
    
    xhr.onerror = function() {
        loader.classList.remove('active');
        showError('Network error occurred. Please check your connection.');
    };
    
    xhr.send();
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = 'Found <strong>' + results.length + '</strong> result(s) for "<strong>' + query + '</strong>". Click to view details:';
    searchResults.appendChild(header);
    
    const resultsList = document.createElement('div');
    resultsList.className = 'results-list';
    
    results.forEach(function(phone) {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.setAttribute('data-url', phone.url);
        item.setAttribute('data-name', phone.name);
        
        if (phone.image) {
            const img = document.createElement('img');
            img.className = 'result-item-image';
            img.src = phone.image;
            img.alt = phone.name;
            item.appendChild(img);
        }
        
        const name = document.createElement('div');
        name.className = 'result-item-name';
        name.textContent = phone.name;
        item.appendChild(name);
        
        item.addEventListener('click', function() {
            loadPhoneSpecs(phone.url, phone.name, true);
        });
        
        resultsList.appendChild(item);
    });
    
    searchResults.appendChild(resultsList);
    searchResults.classList.add('active');
}

function loadPhoneSpecs(model, phoneName, isDirectUrl) {
    const loader = document.getElementById('loader');
    const loaderText = loader.querySelector('p');
    const errorMessage = document.getElementById('error-message');
    const specsContainer = document.getElementById('specs-container');
    const searchResults = document.getElementById('search-results');
    
    loaderText.textContent = 'Loading ' + phoneName + ' specifications...';
    loader.classList.add('active');
    errorMessage.classList.remove('active');
    specsContainer.style.display = 'none';
    searchResults.classList.remove('active');
    
    const endpoint = isDirectUrl ? '/specs/' : '/phone/';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', endpoint + encodeURIComponent(model), true);
    
    xhr.onload = function() {
        loader.classList.remove('active');
        
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                
                if (data.success) {
                    displayPhoneSpecs(data.data);
                    specsContainer.style.display = 'block';
                    window.scrollTo({ top: specsContainer.offsetTop - 20, behavior: 'smooth' });
                } else {
                    showError(data.message);
                }
            } catch (e) {
                showError('Failed to parse response data!');
            }
        } else {
            showError('Failed to load phone specifications. Please try again.');
        }
    };
    
    xhr.onerror = function() {
        loader.classList.remove('active');
        showError('Network error occurred. Please check your connection.');
    };
    
    xhr.send();
}

function displayPhoneSpecs(data) {
    document.getElementById('phone-name').textContent = data.name;
    document.getElementById('phone-image').src = data.image;
    document.getElementById('phone-image').alt = data.name;
    
    displayQuickSpecs(data.quickSpecs);
    displayDetailedSpecs(data.detailedSpecs);
}

function displayQuickSpecs(quickSpecs) {
    const quickSpecsContainer = document.getElementById('quick-specs');
    quickSpecsContainer.innerHTML = '';
    
    const specIcons = {
        display: 'fa-solid fa-mobile-screen',
        camera: 'fa-solid fa-camera',
        video: 'fa-solid fa-video',
        ram: 'fa-solid fa-memory',
        chipset: 'fa-solid fa-microchip',
        battery: 'fa-solid fa-battery-full',
        charging: 'fa-solid fa-bolt',
        released: 'fa-solid fa-calendar-days',
        body: 'fa-solid fa-mobile',
        os: 'fa-brands fa-android',
        storage: 'fa-solid fa-sd-card'
    };
    
    const specLabels = {
        display: 'Display',
        camera: 'Camera',
        video: 'Video',
        ram: 'RAM',
        chipset: 'Chipset',
        battery: 'Battery',
        charging: 'Charging',
        released: 'Released',
        body: 'Body',
        os: 'OS',
        storage: 'Storage'
    };
    
    for (const key in quickSpecs) {
        if (quickSpecs.hasOwnProperty(key)) {
            const value = quickSpecs[key];
            if (value && value.trim()) {
                const li = document.createElement('li');
                li.className = 'quick-spec-item';
                li.innerHTML = '<div class="quick-spec-icon"><i class="' + (specIcons[key] || 'fa-solid fa-circle-info') + '"></i></div>' +
                               '<div class="quick-spec-content">' +
                               '<span class="quick-spec-value">' + value + '</span>' +
                               '<span class="quick-spec-label">' + (specLabels[key] || key) + '</span>' +
                               '</div>';
                quickSpecsContainer.appendChild(li);
            }
        }
    }
}

function displayDetailedSpecs(detailedSpecs) {
    const detailedSpecsContainer = document.getElementById('detailed-specs');
    detailedSpecsContainer.innerHTML = '';
    
    for (const category in detailedSpecs) {
        if (detailedSpecs.hasOwnProperty(category)) {
            const specs = detailedSpecs[category];
            
            const table = document.createElement('table');
            table.className = 'spec-table';
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const th = document.createElement('th');
            th.className = 'spec-table-header';
            if (category === 'Network') {
                th.classList.add('collapsed');
            }
            th.setAttribute('colspan', '2');
            th.textContent = category;
            headerRow.appendChild(th);
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            
            for (const label in specs) {
                if (specs.hasOwnProperty(label)) {
                    const value = specs[label];
                    const tr = document.createElement('tr');
                    tr.className = 'spec-row';
                    
                    if (category === 'Network' && label.toLowerCase() !== 'technology') {
                        tr.classList.add('hidden-row');
                    }
                    
                    tr.innerHTML = '<td class="spec-label">' + label + '</td>' +
                                  '<td class="spec-value">' + value + '</td>';
                    tbody.appendChild(tr);
                }
            }
            
            table.appendChild(tbody);
            detailedSpecsContainer.appendChild(table);
            
            if (category === 'Network') {
                th.addEventListener('click', function() {
                    const isCurrentlyCollapsed = !th.classList.contains('expanded');
                    
                    th.classList.toggle('expanded');
                    
                    const hiddenRows = tbody.querySelectorAll('.hidden-row');
                    hiddenRows.forEach(function(row) {
                        row.classList.toggle('show-row');
                    });
                    
                    if (isCurrentlyCollapsed) {
                        window.scrollTo({ top: table.offsetTop - 20, behavior: 'smooth' });
                    }
                });
            }
        }
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorMessage.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
    
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('phone-search');
    const clearBtn = document.getElementById('clear-search');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    
    searchBtn.addEventListener('click', handleSearch);
    clearBtn.addEventListener('click', clearAll);
    
    hamburgerMenu.addEventListener('click', function() {
        navMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function(event) {
        if (!hamburgerMenu.contains(event.target) && !navMenu.contains(event.target)) {
            navMenu.classList.remove('show');
        }
    });
    
    searchInput.addEventListener('input', function() {
        if (searchInput.value.trim()) {
            clearBtn.style.display = 'flex';
        } else {
            clearBtn.style.display = 'none';
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

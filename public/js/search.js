document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query'); 

    fetch(`/api/search?query=${query}`) 
        .then(response => response.json())
        .then(data => {
            displayResults(data);
        })
        .catch(error => console.error('Error fetching search results:', error));
});

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; 

    if (results.length > 0) {
        results.forEach(result => {
            const element = document.createElement('div');
            element.className = 'search-result';
            element.textContent = result.title; 
            resultsContainer.appendChild(element);
        });
    } else {
        resultsContainer.textContent = 'No results found';
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('event-grid'); 
    const noResultsDiv = document.getElementById('no-results');

    if (resultsContainer.children.length === 0) { 
        noResultsDiv.style.display = 'block'; 
    }
});

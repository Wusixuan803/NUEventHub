document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.onsubmit = function(event) {
        const price = document.getElementById('price').value;
        if (!price || isNaN(price) || price <= 0) {
            alert('Please enter a valid price greater than zero.');
            event.preventDefault();  // Prevent form from submitting
            return false;
        }

        if (!confirm('Are you sure you want to update the ticket price?!')) {
            event.preventDefault();  // Prevent form from submitting
            return false;
        }

        return true;
    };
});

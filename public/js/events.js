document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/events')
        .then(response => response.json())
        .then(events => {
            const container = document.getElementById('events-container');
            events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>${event.date}</p>
                    <button onclick="updateEvent(${event.id})">Update</button>
                    <button onclick="deleteEvent(${event.id})">Delete</button>
                `;
                container.appendChild(eventElement);
            });
        });
});

function updateEvent(eventId) {
    // Example: Send a PUT request with new data for the event
    fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: "Updated Event Title", // You need actual input from user
            date: "New Date", // Example data
            // Include other event details that may be updated
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Event updated successfully!');
        location.reload(); // Optionally reload the page to show the updated info
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function deleteEvent(eventId) {
    // Example: Send a DELETE request to the server
    fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            alert('Event deleted successfully!');
            location.reload(); // Reload the page to update the list of events
        } else {
            alert('Failed to delete the event.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



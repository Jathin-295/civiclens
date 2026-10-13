const form = document.getElementById('ticket-form');
const tableBody = document.querySelector('#tickets-table tbody');

function loadTickets() {
  const stored = localStorage.getItem('tickets');
  const tickets = stored ? JSON.parse(stored) : [];
  tableBody.innerHTML = '';
  tickets.forEach(addRow);
}

function addRow(ticket) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${ticket.id}</td>
    <td>${ticket.route}</td>
    <td>${ticket.date}</td>
    <td>${ticket.seats}</td>
  `;
  tableBody.appendChild(tr);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const ticket = {
    id: Date.now(),
    route: data.get('route'),
    date: data.get('date'),
    seats: data.get('seats')
  };
  const stored = localStorage.getItem('tickets');
  const tickets = stored ? JSON.parse(stored) : [];
  tickets.push(ticket);
  localStorage.setItem('tickets', JSON.stringify(tickets));
  addRow(ticket);
  form.reset();
});

loadTickets();

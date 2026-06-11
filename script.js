document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navLinks.classList.toggle('open');
});

const bikeById = Object.fromEntries(bikes.map((bike) => [bike.id, bike]));
const modal = document.getElementById('bikeModal');
const modalImage = document.getElementById('modalImage');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalMarketing = document.getElementById('modalMarketing');
const modalMeta = document.getElementById('modalMeta');
const modalSpecs = document.getElementById('modalSpecs');
const bikeSelect = document.getElementById('bikeSelect');
const durationSelect = document.getElementById('durationSelect');
const calendarTitle = document.getElementById('calendarTitle');
const calendarGrid = document.getElementById('calendarGrid');
const bookingSummary = document.getElementById('bookingSummary');
const mailReservation = document.getElementById('mailReservation');
const selectedDates = new Set();

let calendarDate = new Date();
calendarDate.setDate(1);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function prettyDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

function selectedBike() {
  return bikeById[bikeSelect.value] || bikes[0];
}

function openBikeModal(bikeId) {
  const bike = bikeById[bikeId];
  if (!bike) return;

  modalImage.src = bike.image;
  modalImage.alt = bike.name;
  modalCategory.textContent = `${bike.category} • rozmiar ${bike.size}`;
  modalTitle.textContent = bike.name;
  modalMarketing.textContent = bike.marketing;

  modalMeta.innerHTML = `
    <div><span>4 godziny</span><strong>${bike.price_4h} zł</strong></div>
    <div><span>Cały dzień</span><strong>${bike.price_day} zł</strong></div>
    <div><span>Kaucja</span><strong>${bike.deposit} zł</strong></div>
  `;

  modalSpecs.innerHTML = bike.technical.map((item) => `<li>${item}</li>`).join('');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  bikeSelect.value = bike.id;
  updateBookingSummary();
}

function closeBikeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-bike]').forEach((element) => {
  element.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const bikeId = button?.dataset.bike || element.dataset.bike;
    openBikeModal(bikeId);
  });

  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBikeModal(element.dataset.bike);
    }
  });
});

document.getElementById('closeModal').addEventListener('click', closeBikeModal);
document.getElementById('modalCloseSecondary').addEventListener('click', closeBikeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeBikeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeBikeModal();
});

document.getElementById('modalReserve').addEventListener('click', closeBikeModal);

bikes.forEach((bike) => {
  const option = document.createElement('option');
  option.value = bike.id;
  option.textContent = `${bike.name} — rozmiar ${bike.size}`;
  bikeSelect.appendChild(option);
});

bikeSelect.addEventListener('change', updateBookingSummary);
durationSelect.addEventListener('change', updateBookingSummary);

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  calendarTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  calendarGrid.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < firstWeekday; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'day outside';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const iso = formatDate(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day';
    button.dataset.date = iso;
    button.innerHTML = `<span class="number">${day}</span><span class="status">dostępny</span>`;

    if (date < today) {
      button.classList.add('past');
      button.querySelector('.status').textContent = 'niedostępny';
      button.disabled = true;
    }

    if (selectedDates.has(iso)) {
      button.classList.add('selected');
      button.querySelector('.status').textContent = 'wybrany';
    }

    button.addEventListener('click', () => {
      if (selectedDates.has(iso)) {
        selectedDates.delete(iso);
      } else {
        selectedDates.add(iso);
      }
      renderCalendar();
      updateBookingSummary();
    });

    calendarGrid.appendChild(button);
  }
}

document.getElementById('prevMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

document.getElementById('clearDates').addEventListener('click', () => {
  selectedDates.clear();
  renderCalendar();
  updateBookingSummary();
});

function updateBookingSummary() {
  const bike = selectedBike();
  const dates = Array.from(selectedDates).sort();
  const duration = durationSelect.value;
  const unitPrice = duration === '4h' ? bike.price_4h : bike.price_day;
  const total = dates.length ? unitPrice * dates.length : unitPrice;
  const durationLabel = duration === '4h' ? '4 godziny' : 'cały dzień';

  if (!dates.length) {
    bookingSummary.innerHTML = `
      <strong>${bike.name}</strong><br>
      ${durationLabel}: ${unitPrice} zł • kaucja: ${bike.deposit} zł<br>
      Wybierz jedną lub kilka dat w kalendarzu.
    `;
  } else {
    bookingSummary.innerHTML = `
      <strong>${bike.name}</strong><br>
      Termin: ${dates.map(prettyDate).join(', ')}<br>
      Czas: ${durationLabel} • Cena: ${total} zł • Kaucja: ${bike.deposit} zł
    `;
  }

  updateMailLink();
}

function updateMailLink() {
  const bike = selectedBike();
  const dates = Array.from(selectedDates).sort();
  const duration = durationSelect.value === '4h' ? '4 godziny' : 'cały dzień';
  const unitPrice = durationSelect.value === '4h' ? bike.price_4h : bike.price_day;
  const total = dates.length ? unitPrice * dates.length : unitPrice;

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const height = document.getElementById('customerHeight').value.trim();
  const notes = document.getElementById('customerNotes').value.trim();

  const subject = `Rezerwacja roweru EkoRide: ${bike.short}`;
  const body = [
    'Dzień dobry,',
    '',
    'Chciałbym/chciałabym zapytać o rezerwację roweru:',
    `Rower: ${bike.name}`,
    `Rozmiar: ${bike.size}`,
    `Termin: ${dates.length ? dates.map(prettyDate).join(', ') : 'nie wybrano daty'}`,
    `Czas wypożyczenia: ${duration}`,
    `Cena orientacyjna: ${total} zł`,
    `Kaucja: ${bike.deposit} zł`,
    '',
    `Imię i nazwisko: ${name}`,
    `Telefon: ${phone}`,
    `E-mail: ${email}`,
    `Wzrost rowerzysty: ${height}`,
    `Uwagi: ${notes}`,
    '',
    'Proszę o potwierdzenie dostępności terminu.',
  ].join('\n');

  mailReservation.href = `mailto:kontakt@ekoride.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

['customerName', 'customerPhone', 'customerEmail', 'customerHeight', 'customerNotes'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateMailLink);
});

renderCalendar();
updateBookingSummary();

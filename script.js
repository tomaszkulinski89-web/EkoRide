
document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navLinks.classList.toggle('open');
});

const bikeById = Object.fromEntries(bikes.map((bike) => [bike.id, bike]));
const selectedDates = new Set();
let calendarDate = new Date();
calendarDate.setDate(1);
let selectedDuration = '4h';

/*
  Tu można ręcznie wpisywać zajęte terminy.
  Format: id roweru: ['YYYY-MM-DD', 'YYYY-MM-DD']
  Przykład:
  const bookedDates = {
    ghost: ['2026-06-20', '2026-06-21'],
    raymon: ['2026-06-22']
  };
*/
const bookedDates = {
  ghost: [],
  focus: [],
  raymon: [],
  ns: [],
  dartmoor: [],
  trek: []
};

const modal = document.getElementById('bikeModal');
const modalImage = document.getElementById('modalImage');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalMarketing = document.getElementById('modalMarketing');
const modalMeta = document.getElementById('modalMeta');
const modalSpecs = document.getElementById('modalSpecs');
const bikeSelect = document.getElementById('bikeSelect');
const calendarTitle = document.getElementById('calendarTitle');
const calendarGrid = document.getElementById('calendarGrid');
const bookingSummary = document.getElementById('bookingSummary');
const mailReservation = document.getElementById('mailReservation');
const copyReservation = document.getElementById('copyReservation');
const copyStatus = document.getElementById('copyStatus');
const bookingBikeImage = document.getElementById('bookingBikeImage');
const bookingBikeCategory = document.getElementById('bookingBikeCategory');
const bookingBikeName = document.getElementById('bookingBikeName');
const bookingBikePrices = document.getElementById('bookingBikePrices');

function selectedBike() {
  return bikeById[bikeSelect.value] || bikes[0];
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function prettyDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
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
  selectedDates.clear();
  renderCalendar();
  updateBookingSummary();
}

function closeBikeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.bike-card').forEach((element) => {
  element.addEventListener('click', (event) => {
    if (event.target.closest('a.quick-book')) return;
    openBikeModal(element.dataset.bike);
  });
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBikeModal(element.dataset.bike);
    }
  });
});

document.querySelectorAll('.quick-book').forEach((link) => {
  link.addEventListener('click', () => {
    bikeSelect.value = link.dataset.bike;
    selectedDates.clear();
    renderCalendar();
    updateBookingSummary();
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
document.getElementById('modalReserve').addEventListener('click', () => {
  closeBikeModal();
});

bikes.forEach((bike) => {
  const option = document.createElement('option');
  option.value = bike.id;
  option.textContent = `${bike.name} — rozmiar ${bike.size}`;
  bikeSelect.appendChild(option);
});

bikeSelect.addEventListener('change', () => {
  selectedDates.clear();
  renderCalendar();
  updateBookingSummary();
});

document.querySelectorAll('.duration').forEach((button) => {
  button.addEventListener('click', () => {
    selectedDuration = button.dataset.duration;
    document.querySelectorAll('.duration').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    updateBookingSummary();
  });
});

function isBooked(bikeId, iso) {
  return (bookedDates[bikeId] || []).includes(iso);
}

function renderCalendar() {
  const bike = selectedBike();
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
    const iso = formatDateLocal(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day';
    button.dataset.date = iso;
    button.innerHTML = `<span class="number">${day}</span><span class="status">dostępny</span>`;

    const booked = isBooked(bike.id, iso);

    if (date < today) {
      button.classList.add('past');
      button.querySelector('.status').textContent = 'niedostępny';
      button.disabled = true;
    } else if (booked) {
      button.classList.add('booked');
      button.querySelector('.status').textContent = 'zarezerwowany';
      button.disabled = true;
    } else {
      button.addEventListener('click', () => {
        if (selectedDates.has(iso)) {
          selectedDates.delete(iso);
        } else {
          selectedDates.add(iso);
        }
        renderCalendar();
        updateBookingSummary();
      });
    }

    if (selectedDates.has(iso)) {
      button.classList.add('selected');
      button.querySelector('.status').textContent = 'wybrany';
    }

    calendarGrid.appendChild(button);
  }

  bookingBikeImage.src = bike.image;
  bookingBikeImage.alt = bike.name;
  bookingBikeCategory.textContent = `${bike.category} • rozmiar ${bike.size}`;
  bookingBikeName.textContent = bike.name;
  bookingBikePrices.textContent = `4 h: ${bike.price_4h} zł • dzień: ${bike.price_day} zł • kaucja: ${bike.deposit} zł`;
}

document.getElementById('prevMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

function buildReservationText() {
  const bike = selectedBike();
  const dates = Array.from(selectedDates).sort();
  const durationLabel = selectedDuration === '4h' ? '4 godziny' : 'cały dzień';
  const unitPrice = selectedDuration === '4h' ? bike.price_4h : bike.price_day;
  const total = dates.length ? unitPrice * dates.length : unitPrice;

  const name = document.getElementById('customerName').value.trim();
  const surname = document.getElementById('customerSurname').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const height = document.getElementById('customerHeight').value.trim();
  const pickupTime = document.getElementById('pickupTime').value.trim();
  const notes = document.getElementById('customerNotes').value.trim();

  return [
    'Dzień dobry,',
    '',
    'Proszę o sprawdzenie dostępności i rezerwację roweru:',
    `Rower: ${bike.name}`,
    `Rozmiar: ${bike.size}`,
    `Termin: ${dates.length ? dates.map(prettyDate).join(', ') : 'nie wybrano daty'}`,
    `Czas wypożyczenia: ${durationLabel}`,
    `Cena orientacyjna: ${total} zł`,
    `Kaucja: ${bike.deposit} zł`,
    '',
    `Imię: ${name}`,
    `Nazwisko: ${surname}`,
    `E-mail: ${email}`,
    `Telefon: ${phone}`,
    `Wzrost rowerzysty: ${height}`,
    `Preferowana godzina odbioru: ${pickupTime}`,
    `Uwagi: ${notes}`,
    '',
    'Proszę o potwierdzenie terminu.',
  ].join('\n');
}

function updateBookingSummary() {
  const bike = selectedBike();
  const dates = Array.from(selectedDates).sort();
  const durationLabel = selectedDuration === '4h' ? '4 godziny' : 'cały dzień';
  const unitPrice = selectedDuration === '4h' ? bike.price_4h : bike.price_day;
  const total = dates.length ? unitPrice * dates.length : unitPrice;

  bookingSummary.innerHTML = dates.length
    ? `<strong>${bike.short}</strong><br>Termin: ${dates.map(prettyDate).join(', ')}<br>Czas: ${durationLabel}<br>Cena: ${total} zł • kaucja: ${bike.deposit} zł`
    : `<strong>${bike.short}</strong><br>${durationLabel}: ${unitPrice} zł • kaucja: ${bike.deposit} zł<br>Wybierz dzień lub kilka dni w kalendarzu.`;

  const subject = `Rezerwacja roweru EkoRide: ${bike.short}`;
  mailReservation.href = `mailto:kontakt@ekoride.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildReservationText())}`;
  renderCalendar();
}

['customerName', 'customerSurname', 'customerEmail', 'customerPhone', 'customerHeight', 'pickupTime', 'customerNotes'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateBookingSummary);
});

copyReservation.addEventListener('click', async () => {
  const text = buildReservationText();
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = 'Skopiowano treść zapytania. Możesz wkleić ją do e-maila, SMS-a lub WhatsAppa.';
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copyStatus.textContent = 'Skopiowano treść zapytania.';
  }
});

renderCalendar();
updateBookingSummary();

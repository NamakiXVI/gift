const messageContainer = document.getElementById('messageContainer');
const messageBoxes = document.querySelectorAll('.message-box');
let currentIndex = 0;

function handleSwipeUp() {
  if (currentIndex >= messageBoxes.length - 1) return;

  messageBoxes[currentIndex].classList.add('fade-out-up');

  currentIndex++;
  messageBoxes[currentIndex].classList.remove('fade-out-down');
  messageBoxes[currentIndex].classList.add('visible');
}

function handleSwipeDown() {
  if (currentIndex <= 0) return;
  messageBoxes[currentIndex].classList.add('fade-out-down');

  currentIndex--;
  messageBoxes[currentIndex].classList.remove('fade-out-up');
  messageBoxes[currentIndex].classList.add('visible');
}

let touchStartY = 0;

messageContainer.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
});

messageContainer.addEventListener('touchend', (e) => {
  const touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchStartY - touchEndY;

  if (deltaY > 50) {
    handleSwipeUp();
  }
  else if (deltaY < -50) {
    handleSwipeDown();
  }
});

function generateCalendarGrid() {
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarHeader = document.getElementById('calendarHeader');
  const year = 2025;
  const month = 1;
  const specialDate = 14;

  calendarGrid.innerHTML = '';

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  calendarHeader.innerHTML = `
    <div class="calendar-title">${monthNames[month]} ❤️</div>
    <div class="calendar-year">${year}</div>
  `;


  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayContainer = document.createElement('div');
  weekdayContainer.className = 'weekdays';
  weekdays.forEach(day => {
    const weekdayElem = document.createElement('div');
    weekdayElem.className = 'weekday';
    weekdayElem.textContent = day;
    weekdayContainer.appendChild(weekdayElem);
  });

  for (let i = 0; i < weekdays.length; i++) {
    const weekdayBtn = document.createElement('button');
    weekdayBtn.className = 'date-btn empty';
    weekdayBtn.innerHTML = `<span>${weekdays[i]}</span>`;
    calendarGrid.appendChild(weekdayBtn);
  }

  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyBtn = document.createElement('button');
    emptyBtn.className = 'date-btn empty';
    calendarGrid.appendChild(emptyBtn);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateBtn = document.createElement('button');
    dateBtn.className = 'date-btn';
    dateBtn.innerHTML = `<span>${day}</span>`;

    if (day === specialDate) {
      dateBtn.innerHTML = `
        <span>${day}</span>
      `;
    }
    
    dateBtn.addEventListener('click', () => handleDateClick(day, dateBtn));
    calendarGrid.appendChild(dateBtn);
  }
}

function handleDateClick(day, button) {
  const allButtons = document.querySelectorAll('.date-btn');
  const text = document.getElementById('date');
  allButtons.forEach(btn => btn.classList.remove('special-date'));
  text.style.marginTop = "1vh";

  if (day === 14) {
    button.classList.add('special-date');
    text.style.color = "red";
    text.innerHTML = "YYAASSS PERFECT DAYY";


    setTimeout(() => {
      window.location.href = 'valentines-place.html';
    }, 5000);
  } else if (day < 14) {
    text.innerHTML = "Nahhh thats too early •~•";
  } else if (day > 14) {
    text.innerHTML = "but thats too late tho :c";
  }

}

generateCalendarGrid();
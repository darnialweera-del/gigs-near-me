// ========================================================
// GIGS NEAR ME — BRISBANE EVENT ENGINE (VERSION 2.0)
// ========================================================

// 1. Timezone-aware date calculations (Australia/Brisbane)
function getBrisbaneDateParts() {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  
  const parts = formatter.formatToParts(new Date());
  const map = {};
  parts.forEach(p => map[p.type] = p.value);
  return map;
}

function getBrisbaneTodayISO() {
  const parts = getBrisbaneDateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysToISO(isoString, days) {
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split('T')[0];
}

const todayISO = getBrisbaneTodayISO();

// Format date into brand layout: "THU 15 OCT"
function formatEventDate(isoString) {
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  const dayNum = date.toLocaleDateString('en-AU', { day: '2-digit', timeZone: 'UTC' });
  const month = date.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${weekday} ${dayNum} ${month}`;
}

// 2. Demonstration event dataset (clearly labelled for testing)
const brisbaneEvents = [
  {
    id: 1,
    title: "The Brightside Live: Indie Band Showcase",
    venue: "The Brightside",
    suburb: "Fortitude Valley",
    isoDate: "2026-11-01",
    timeString: "7:30 PM",
    category: "Live music",
    stickerClass: "sticker-music",
    initials: "BS",
    price: 15,
    priceDisplay: "AUD 15",
    description: "Four emerging local indie-rock acts taking over the carpark stage for an intimate mid-week room.",
    ticketUrl: "#"
  },
  {
    id: 2,
    title: "Boundary Street Acoustic & Open Mic",
    venue: "The Burrow",
    suburb: "West End",
isoDate: "2026-11-01",
    timeString: "6:30 PM",
    category: "Open mic",
    stickerClass: "sticker-openmic",
    initials: "TB",
    price: 0,
    priceDisplay: "FREE",
    description: "Walk-in acoustic slots, warm hospitality, and good local songwriters testing out fresh material.",
    ticketUrl: "#"
  },
  {
    id: 3,
    title: "Late Night Selector Sessions",
    venue: "Warehouse 25",
    suburb: "Milton",
isoDate: "2026-11-07",
    timeString: "9:00 PM",
    category: "DJ nights",
    stickerClass: "sticker-dj",
    initials: "W25",
    price: 10,
    priceDisplay: "AUD 10",
    description: "Deep house, garage, and vinyl club rhythms featuring local crate-diggers in the barrel room.",
    ticketUrl: "#"
  },
  {
    id: 4,
    title: "Good Chat Standup & New Material",
    venue: "Good Chat Comedy Club",
    suburb: "Fortitude Valley",
isoDate: "2026-11-07",
    timeString: "7:00 PM",
    category: "Comedy",
    stickerClass: "sticker-comedy",
    initials: "GC",
    price: 20,
    priceDisplay: "AUD 20",
    description: "A hand-picked lineup of rising Brisbane comics plus a couple of unannounced touring headliners.",
    ticketUrl: "#"
  },
  {
    id: 5,
    title: "Sunday Jazz on the Green",
    venue: "Brisbane Powerhouse",
    suburb: "New Farm",
isoDate: "2026-11-08",
    timeString: "3:30 PM",
    category: "Live music",
    stickerClass: "sticker-music",
    initials: "PH",
    price: 0,
    priceDisplay: "FREE",
    description: "Free afternoon soul and jazz quartet by the river. Grab a rug or a cold drink on the lawn.",
    ticketUrl: "#"
  },
  {
    id: 6,
    title: "Folk & Storytelling in the Yard",
    venue: "The Princess Theatre",
    suburb: "Woolloongabba",
isoDate: "2026-11-14",
    timeString: "7:00 PM",
    category: "Live music",
    stickerClass: "sticker-music",
    initials: "PT",
    price: 12,
    priceDisplay: "AUD 12",
    description: "Low-key acoustic sessions, narrative songwriters, and local cider under the fairy lights.",
    ticketUrl: "#"
  }
];
// 3 Permanent Featured Gigs (Always visible regardless of search/filter)
const featuredEvents = [
  {
    id: 'feat-1',
    title: "The Brightside Live: Indie Band Showcase",
    venue: "The Brightside",
    suburb: "Fortitude Valley",
    isoDate: todayISO,
    timeString: "7:30 PM",
    category: "Live music",
    stickerClass: "sticker-music",
    initials: "BS",
    price: 15,
    priceDisplay: "AUD 15",
    description: "Four emerging local indie-rock acts taking over the carpark stage for an intimate mid-week room.",
    ticketUrl: "#"
  },
  {
    id: 'feat-2',
    title: "Good Chat Standup & New Material",
    venue: "Good Chat Comedy Club",
    suburb: "Fortitude Valley",
    isoDate: addDaysToISO(todayISO, 2),
    timeString: "7:00 PM",
    category: "Comedy",
    stickerClass: "sticker-comedy",
    initials: "GC",
    price: 20,
    priceDisplay: "AUD 20",
    description: "A hand-picked lineup of rising Brisbane comics plus a couple of unannounced touring headliners.",
    ticketUrl: "#"
  },
  {
    id: 'feat-3',
    title: "Sunday Jazz on the Green",
    venue: "Brisbane Powerhouse",
    suburb: "New Farm",
    isoDate: addDaysToISO(todayISO, 4),
    timeString: "3:30 PM",
    category: "Live music",
    stickerClass: "sticker-music",
    initials: "PH",
    price: 0,
    priceDisplay: "FREE",
    description: "Free afternoon soul and jazz quartet by the river. Grab a rug or a cold drink on the lawn.",
    ticketUrl: "#"
  }
];

function renderFeatured() {
  const featuredContainer = document.getElementById('featured-grid');
  if (!featuredContainer) return;

  featuredContainer.innerHTML = featuredEvents.map(event => {
    const isFree = event.price === 0;
    const priceBadge = isFree
      ? `<span class="sticker-tag sticker-price is-free">FREE ENTRY</span>`
      : `<span class="sticker-tag sticker-price">${event.priceDisplay}</span>`;

    return `
      <article class="gnm-card event-card">
        <div class="card-visual">
          <div class="card-visual-pattern" aria-hidden="true">${event.initials}</div>
          <div class="card-badges">
            <span class="sticker-tag ${event.stickerClass}">${event.category}</span>
            ${priceBadge}
          </div>
        </div>
        <div class="card-content">
          <div class="card-date-row">
            ${formatEventDate(event.isoDate)} &middot; ${event.timeString}
          </div>
          <h3 class="card-title">${event.title}</h3>
          <div class="card-venue">${event.venue} &middot; ${event.suburb}</div>
          <p class="card-description">${event.description}</p>
          <div class="card-footer">
            <a href="${event.ticketUrl}" class="card-action-link">View event &amp; tickets &mdash;&gt;</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 3. State Management
let currentFilter = 'all';
let searchQuery = '';
let selectedDatePreset = "anytime";
let selectedSingleDate = null;
let selectedRangeStart = null;
let selectedRangeEnd = null;

// DOM Elements
const eventsGrid = document.getElementById('events-grid');
const countLabel = document.getElementById('events-count-label');
const resetBtn = document.getElementById('reset-filters');
const searchInput = document.getElementById('event-search');
const filterChips = document.querySelectorAll('.filter-chip');
const newsletterForm = document.getElementById('newsletter-form');
const newsletterFeedback = document.getElementById('newsletter-feedback');

// 4. Weekend calculation helper
function isThisWeekend(isoDate) {
  const [y, m, d] = todayISO.split('-').map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = now.getUTCDay(); // 0 is Sun, 5 is Fri, 6 is Sat

  // Days until Friday
  const diffToFriday = (5 - dayOfWeek + 7) % 7;
  const fridayISO = addDaysToISO(todayISO, diffToFriday);
  const sundayISO = addDaysToISO(fridayISO, 2);

  return isoDate >= fridayISO && isoDate <= sundayISO;
}

// 5. Filter & Search Logic
function filterEvents() {
  const cleanQuery = searchQuery.trim().toLowerCase();

  return brisbaneEvents.filter(event => {
    // Search Matching (title, venue, suburb, category, description)
    const matchesSearch = cleanQuery === '' ||
      event.title.toLowerCase().includes(cleanQuery) ||
      event.venue.toLowerCase().includes(cleanQuery) ||
      event.suburb.toLowerCase().includes(cleanQuery) ||
      event.category.toLowerCase().includes(cleanQuery) ||
      event.description.toLowerCase().includes(cleanQuery);

    if (!matchesSearch) return false;

        if (!eventMatchesSelectedDate(event)) return false;

    // 6. Fast-tap Filter Chip matching
    switch (currentFilter) {
      case 'tonight':
        return event.isoDate === todayISO;
      case 'weekend':
        return isThisWeekend(event.isoDate);
      case 'free':
        return event.price === 0;
      case 'music':
        return event.category === 'Live music';
      case 'comedy':
        return event.category === 'Comedy';
      case 'under-20':
        return event.price <= 20;
      case 'all':
      default:
        return true;
    }
  });
}

// Escape text before inserting it into HTML.
function escapeEventText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderEvents() {
  const resultsStartDate = "2026-11-01";

  const filtered = filterEvents()
    .filter((event) => event.isoDate >= resultsStartDate)
    .sort((first, second) => {
      return (
        first.isoDate.localeCompare(second.isoDate) ||
        first.title.localeCompare(second.title, "en-AU", {
          sensitivity: "base"
        })
      );
    });

  countLabel.textContent =
    `Showing ${filtered.length} ${
      filtered.length === 1 ? "event" : "events"
    } in Brisbane`;

  resetBtn.hidden =
    currentFilter === "all" &&
    searchQuery.trim() === "";

  if (filtered.length === 0) {
    eventsGrid.innerHTML = `
      <div class="no-results-box">
        <h3>No matching events from November onwards</h3>
        <p>Try a different search or clear your filters.</p>
        <button
          type="button"
          class="btn btn-secondary"
          onclick="resetAllFilters()"
        >
          Clear all filters
        </button>
      </div>
    `;
    return;
  }

  const months = new Map();

  filtered.forEach((event) => {
    const monthKey = event.isoDate.slice(0, 7);

    if (!months.has(monthKey)) {
      months.set(monthKey, []);
    }

    months.get(monthKey).push(event);
  });

  eventsGrid.innerHTML = Array.from(months)
    .map(([monthKey, monthEvents]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const monthDate = new Date(Date.UTC(year, month - 1, 1));

      const monthHeading = monthDate.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      });

      const rows = monthEvents.map((event) => {
        const [eventYear, eventMonth, eventDay] =
          event.isoDate.split("-").map(Number);

        const date = new Date(
          Date.UTC(eventYear, eventMonth - 1, eventDay)
        );

        const weekday = date.toLocaleDateString("en-AU", {
          weekday: "short",
          timeZone: "UTC"
        }).toUpperCase();

        const shortMonth = date.toLocaleDateString("en-AU", {
          month: "short",
          timeZone: "UTC"
        }).toUpperCase();

        const fullDate = date.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });

        const isFree = event.price === 0;
        const title = escapeEventText(event.title);
        const venue = escapeEventText(event.venue);
        const suburb = escapeEventText(event.suburb);
        const category = escapeEventText(event.category);

        const price = isFree
          ? "FREE ENTRY"
          : escapeEventText(event.priceDisplay);

        const categoryClass = [
          "sticker-music",
          "sticker-comedy",
          "sticker-dj",
          "sticker-openmic"
        ].includes(event.stickerClass)
          ? event.stickerClass
          : "sticker-openmic";

        const timeLabel = event.doorsTime
          ? `Doors ${escapeEventText(event.doorsTime)}`
          : `Start ${escapeEventText(event.timeString)}`;

        const thumbnail = event.imageUrl
          ? `
            <img
              src="${escapeEventText(event.imageUrl)}"
              alt="${escapeEventText(event.imageAlt || "")}"
              width="120"
              height="80"
              loading="lazy"
            >
          `
          : `
            <span aria-hidden="true">
              ${escapeEventText(event.initials)}
            </span>
          `;

        // Only genuine HTTPS destinations become ticket links.
        const ticketUrl = /^https:\/\//i.test(event.ticketUrl || "")
          ? event.ticketUrl
          : null;

        const action = isFree
          ? `<span class="event-row-free">Free</span>`
          : ticketUrl
            ? `
              <a
                class="event-row-action"
                href="${escapeEventText(ticketUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tickets for ${title} (opens in a new tab)"
              >
                Tickets <span aria-hidden="true">→</span>
              </a>
            `
            : `
              <span
                class="event-row-action is-unavailable"
                aria-disabled="true"
                title="Ticket link not added yet"
              >
                Tickets
              </span>
            `;

        return `
          <article class="event-row">
            <time
              class="event-row-date"
              datetime="${event.isoDate}"
              aria-label="${escapeEventText(fullDate)}"
            >
              <span>${weekday}</span>
              <strong>${String(eventDay).padStart(2, "0")}</strong>
              <span>${shortMonth}</span>
            </time>

            <div class="event-row-thumbnail">
              ${thumbnail}
            </div>

            <div class="event-row-info">
              <div class="event-row-tags">
                <span class="sticker-tag ${categoryClass}">
                  ${category}
                </span>
                <span aria-hidden="true">·</span>
                <span class="sticker-tag sticker-price ${
                  isFree ? "is-free" : ""
                }">
                  ${price}
                </span>
              </div>

              <h3 class="event-row-title">${title}</h3>

              <p class="event-row-meta">
                ${venue} · ${suburb} · ${timeLabel}
              </p>
            </div>

            <div class="event-row-action-slot">
              ${action}
            </div>
          </article>
        `;
      }).join("");

      return `
        <section class="event-month">
          <h3 class="event-month-heading">
            ${escapeEventText(monthHeading)}
          </h3>
          <div class="event-month-list">${rows}</div>
        </section>
      `;
    }).join("");
}

// 7. Event Handlers
// Search input
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderEvents();
});

// Fast-tap filter chips
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => {
      c.classList.remove('is-active');
      c.setAttribute('aria-pressed', 'false');
    });

    chip.classList.add('is-active');
    chip.setAttribute('aria-pressed', 'true');
    currentFilter = chip.dataset.filter;
    renderEvents();
  });
});

// Reset filters function
window.resetAllFilters = function() {
  currentFilter = 'all';
  searchQuery = '';
  searchInput.value = '';

  filterChips.forEach(c => {
    const isAll = c.dataset.filter === 'all';
    c.classList.toggle('is-active', isAll);
    c.setAttribute('aria-pressed', isAll ? 'true' : 'false');
  });

  renderEvents();
};

resetBtn.addEventListener('click', resetAllFilters);

// Honest newsletter feedback (per acceptance criteria)
newsletterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const emailInput = document.getElementById('newsletter-email');

  if (emailInput.value) {
    newsletterFeedback.textContent = `Thanks! You'll receive the Thursday dispatch once publication begins.`;
    newsletterFeedback.style.color = 'var(--cobalt)';
    emailInput.value = '';
  }
});

// 8. Initial Boot
renderEvents();
// Restored Date button: open and close the calendar panel
const dateTriggerButton = document.getElementById("date-trigger-btn");
const datePickerPanel = document.getElementById("date-picker-modal");
const closeDatePickerButton = document.getElementById("date-modal-close");

function closeDatePicker() {
  datePickerPanel.hidden = true;
  dateTriggerButton.setAttribute("aria-expanded", "false");
}

dateTriggerButton.addEventListener("click", () => {
  const shouldOpen = datePickerPanel.hidden;

  datePickerPanel.hidden = !shouldOpen;
  dateTriggerButton.setAttribute("aria-expanded", String(shouldOpen));

  if (shouldOpen) {
    closeDatePickerButton.focus();
  }
});

closeDatePickerButton.addEventListener("click", () => {
  closeDatePicker();
  dateTriggerButton.focus();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#date-picker-modal")) return;
  if (event.target.closest("#date-trigger-btn")) return;
  closeDatePicker();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !datePickerPanel.hidden) {
    closeDatePicker();
    dateTriggerButton.focus();
  }
});


// ========================================================
// RESTORED DATE CALENDAR — UP TO SIX MONTHS AHEAD
// ========================================================


const calendarDaysGrid = document.getElementById("calendar-days-grid");
const calendarMonthLabel = document.getElementById("cal-month-label");
const calendarPreviousButton = document.getElementById("cal-prev-month");
const calendarNextButton = document.getElementById("cal-next-month");
const dateLabel = document.getElementById("date-trigger-label");
const rangeToggle = document.getElementById("range-toggle-checkbox");
const dateClearButton = document.getElementById("date-clear-btn");
const dateApplyButton = document.getElementById("date-apply-btn");
const dateFooterLabel = document.getElementById("footer-selection-label");
const dateFooterCount = document.getElementById("footer-selection-sub");

const [todayYear, todayMonth, todayDay] = todayISO.split("-").map(Number);

let displayedCalendarMonth = new Date(
  todayYear,
  todayMonth - 1,
  1
);

const firstCalendarMonth = new Date(
  todayYear,
  todayMonth - 1,
  1
);

const finalCalendarMonth = new Date(
  todayYear,
  todayMonth + 5,
  1
);

function dateToISO(year, monthIndex, day) {
  return [
    year,
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function formatDateForPicker(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function eventMatchesSelectedDate(event) {
  if (selectedDatePreset === "anytime") {
    return true;
  }

  if (selectedDatePreset === "tonight") {
    return event.isoDate === todayISO;
  }

  if (selectedDatePreset === "tomorrow") {
    return event.isoDate === addDaysToISO(todayISO, 1);
  }

  if (selectedDatePreset === "this-weekend") {
    return isThisWeekend(event.isoDate);
  }

  if (selectedDatePreset === "this-week") {
    const todayDayOfWeek = new Date(
      Date.UTC(todayYear, todayMonth - 1, todayDay)
    ).getUTCDay();

    const daysUntilSunday = (7 - todayDayOfWeek) % 7;
    const weekEnd = addDaysToISO(todayISO, daysUntilSunday);

    return event.isoDate >= todayISO && event.isoDate <= weekEnd;
  }

  if (selectedDatePreset === "next-7-days") {
    return (
      event.isoDate >= todayISO &&
      event.isoDate <= addDaysToISO(todayISO, 7)
    );
  }

  if (selectedDatePreset === "next-30-days") {
    return (
      event.isoDate >= todayISO &&
      event.isoDate <= addDaysToISO(todayISO, 30)
    );
  }

  if (selectedDatePreset === "single-date") {
    return event.isoDate === selectedSingleDate;
  }

  if (selectedDatePreset === "date-range") {
    return (
      event.isoDate >= selectedRangeStart &&
      event.isoDate <= selectedRangeEnd
    );
  }

  return true;
}

function countMatchingDateEvents() {
  return brisbaneEvents.filter(eventMatchesSelectedDate).length;
}

function updateDateFooter() {
  dateFooterCount.textContent = `${countMatchingDateEvents()} matching gigs`;
}

function updateDatePresetCounts() {
  const presetCountElements = {
    anytime: document.getElementById("count-anytime"),
    tonight: document.getElementById("count-tonight"),
    tomorrow: document.getElementById("count-tomorrow"),
    "this-weekend": document.getElementById("count-weekend"),
    "this-week": document.getElementById("count-week"),
    "next-7-days": document.getElementById("count-7days"),
    "next-30-days": document.getElementById("count-30days")
  };

  Object.entries(presetCountElements).forEach(([preset, element]) => {
    const count = brisbaneEvents.filter((event) => {
      const savedPreset = selectedDatePreset;
      selectedDatePreset = preset;
      const matches = eventMatchesSelectedDate(event);
      selectedDatePreset = savedPreset;
      return matches;
    }).length;

    element.textContent = count;
  });
}

function renderCalendar() {
  const year = displayedCalendarMonth.getFullYear();
  const month = displayedCalendarMonth.getMonth();

  calendarMonthLabel.textContent = displayedCalendarMonth.toLocaleDateString(
    "en-AU",
    {
      month: "long",
      year: "numeric"
    }
  );

  calendarPreviousButton.disabled =
    displayedCalendarMonth.getTime() === firstCalendarMonth.getTime();

  calendarNextButton.disabled =
    displayedCalendarMonth.getTime() === finalCalendarMonth.getTime();

  calendarDaysGrid.innerHTML = "";

  const firstDayOfMonth = new Date(year, month, 1);
  const weekdayStartingMonday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let blankDay = 0; blankDay < weekdayStartingMonday; blankDay += 1) {
    const blankCell = document.createElement("div");
    blankCell.className = "cal-day cal-day-empty";
    calendarDaysGrid.appendChild(blankCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayButton = document.createElement("button");
    const isoDate = dateToISO(year, month, day);
    const thisDay = new Date(year, month, day);
    const todayAtMidnight = new Date(todayYear, todayMonth - 1, todayDay);

    dayButton.type = "button";
    dayButton.className = "cal-day";
    dayButton.textContent = day;
    dayButton.setAttribute("aria-label", formatDateForPicker(isoDate));

    if (thisDay < todayAtMidnight) {
      dayButton.disabled = true;
    }

    if (brisbaneEvents.some((event) => event.isoDate === isoDate)) {
      dayButton.classList.add("has-gigs");
    }

    if (
      selectedDatePreset === "single-date" &&
      selectedSingleDate === isoDate
    ) {
      dayButton.classList.add("selected");
    }

    if (selectedDatePreset === "date-range") {
      if (isoDate === selectedRangeStart || isoDate === selectedRangeEnd) {
        dayButton.classList.add("selected");
      }

      if (
        selectedRangeStart &&
        selectedRangeEnd &&
        isoDate > selectedRangeStart &&
        isoDate < selectedRangeEnd
      ) {
        dayButton.classList.add("in-range");
      }
    }

    dayButton.addEventListener("click", (event) => {
  event.stopPropagation();
  chooseCalendarDate(isoDate);
});

    calendarDaysGrid.appendChild(dayButton);
  }
}

function chooseCalendarDate(isoDate) {
  document.querySelectorAll(".preset-btn").forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });

  if (!rangeToggle.checked) {
    selectedDatePreset = "single-date";
    selectedSingleDate = isoDate;
    selectedRangeStart = null;
    selectedRangeEnd = null;

    const formattedDate = formatDateForPicker(isoDate);
    dateLabel.textContent = formattedDate;
    dateFooterLabel.textContent = formattedDate;
  } else if (!selectedRangeStart || selectedRangeEnd) {
    selectedDatePreset = "date-range";
    selectedSingleDate = null;
    selectedRangeStart = isoDate;
    selectedRangeEnd = null;

    const startLabel = `From ${formatDateForPicker(isoDate)}`;
    dateLabel.textContent = startLabel;
    dateFooterLabel.textContent = startLabel;
  } else {
    selectedDatePreset = "date-range";
    selectedRangeEnd = isoDate;

    if (selectedRangeEnd < selectedRangeStart) {
      const originalStart = selectedRangeStart;
      selectedRangeStart = selectedRangeEnd;
      selectedRangeEnd = originalStart;
    }

    const rangeLabel = `${formatDateForPicker(
      selectedRangeStart
    )} – ${formatDateForPicker(selectedRangeEnd)}`;

    dateLabel.textContent = rangeLabel;
    dateFooterLabel.textContent = rangeLabel;
  }

  renderCalendar();
  updateDateFooter();
}

function selectDatePreset(preset, label) {
  selectedDatePreset = preset;
  selectedSingleDate = null;
  selectedRangeStart = null;
  selectedRangeEnd = null;

  dateLabel.textContent = label;
  dateFooterLabel.textContent = label;

  document.querySelectorAll(".preset-btn").forEach((button) => {
    const isSelected = button.dataset.preset === preset;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  renderCalendar();
  updateDateFooter();
}

document.querySelectorAll(".preset-btn").forEach((button) => {
  button.addEventListener("click", () => {
    selectDatePreset(
      button.dataset.preset,
      button.querySelector("span").textContent
    );
  });
});

calendarPreviousButton.addEventListener("click", () => {
  displayedCalendarMonth.setMonth(displayedCalendarMonth.getMonth() - 1);
  renderCalendar();
});

calendarNextButton.addEventListener("click", () => {
  displayedCalendarMonth.setMonth(displayedCalendarMonth.getMonth() + 1);
  renderCalendar();
});

dateClearButton.addEventListener("click", () => {
  rangeToggle.checked = false;
  selectDatePreset("anytime", "Anytime");
});
dateApplyButton.addEventListener("click", () => {
  renderEvents();
  closeDatePicker();
  dateTriggerButton.focus();
});

// First calendar render
updateDatePresetCounts();
renderCalendar();
updateDateFooter();
renderFeatured();

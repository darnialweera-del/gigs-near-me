// GIGS NEAR ME — BRISBANE EVENT ENGINE (VERSION 2.0)
// Live Data via Google Sheets "Published" tab

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Zv0uvaoHneYxbnD3XKkh6aFc8U_wh9gYL9YI2V-lUw8/gviz/tq?tqx=out:csv&sheet=Published';

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

function formatEventDate(isoString) {
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  const day = date.toLocaleDateString('en-AU', { day: '2-digit', timeZone: 'UTC' });
  const month = date.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${weekday} ${day} ${month}`;
}

const todayISO = getBrisbaneTodayISO();

// CSV Parser
function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(value.trim());
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map(cells => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] || '').trim();
    });
    return obj;
  });
}

function normaliseDateToISO(value) {
  if (!value) return '';
  const cleaned = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
  }
  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function getStickerClass(category) {
  const val = String(category || '').toLowerCase();
  if (val.includes('comedy')) return 'sticker-comedy';
  if (val.includes('dj') || val.includes('club')) return 'sticker-dj';
  if (val.includes('open')) return 'sticker-openmic';
  if (val.includes('theatre') || val.includes('art')) return 'sticker-arts';
  return 'sticker-music';
}

function getPriceValue(exactPrice, priceTier) {
  const val = String(exactPrice || priceTier || '').toLowerCase();
  if (val.includes('free')) return 0;
  const match = val.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getPriceDisplay(exactPrice, priceTier) {
  const exact = String(exactPrice || '').trim();
  const tier = String(priceTier || '').trim();
  if (exact) {
    if (/free/i.test(exact)) return 'FREE ENTRY';
    if (/aud/i.test(exact)) return exact;
    if (/^\d+(?:\.\d{1,2})?$/.test(exact)) return `AUD ${exact}`;
    return exact;
  }
  if (/free/i.test(tier)) return 'FREE ENTRY';
  return tier || 'See venue';
}

function getValidEventLink(ticketUrl, officialUrl) {
  const t = String(ticketUrl || '').trim();
  const o = String(officialUrl || '').trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^https?:\/\//i.test(o)) return o;
  return '#';
}

function venueInitials(venueName) {
  const words = String(venueName || 'TBA').replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase() || 'GN';
}

// Global Event Arrays
let brisbaneEvents = [];
let featuredEvents = [];

function escapeEventText(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Automatically build the Suburb dropdown from live sheet data
function populateSuburbDropdown() {
  const suburbSelect = document.getElementById('filter-suburb');
  if (!suburbSelect) return;

  const currentSelection = suburbSelect.value;

  // Extract unique suburbs from loaded events
  const suburbs = Array.from(
    new Set(
      brisbaneEvents
        .map(e => e.suburb)
        .filter(s => s && s.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b));

  // Build the option elements
  suburbSelect.innerHTML = '<option value="all">All suburbs</option>' +
    suburbs.map(s => `<option value="${escapeEventText(s)}">${escapeEventText(s)}</option>`).join('');

  // Keep the user's current selection if it still exists
  if (suburbs.includes(currentSelection)) {
    suburbSelect.value = currentSelection;
  } else {
    suburbSelect.value = 'all';
  }
}

// 2. Render Featured Gigs (Matches original markup & classes)
function renderFeatured() {
  const featuredContainer = document.getElementById('featured-grid');
  if (!featuredContainer) return;

  featuredContainer.innerHTML = featuredEvents.map(event => {
    const isFree = event.price === 0;
    const priceBadge = isFree
      ? `<span class="sticker-tag sticker-price is-free">FREE ENTRY</span>`
      : `<span class="sticker-tag sticker-price">${escapeEventText(event.priceDisplay)}</span>`;

    return `
      <article class="gnm-card event-card">
        <div class="card-visual">
          <div class="card-visual-pattern" aria-hidden="true">${escapeEventText(event.initials)}</div>
          <div class="card-badges">
            <span class="sticker-tag ${escapeEventText(event.stickerClass)}">${escapeEventText(event.category)}</span>
            ${priceBadge}
          </div>
        </div>
        <div class="card-content">
          <div class="card-date-row">
            ${formatEventDate(event.isoDate)} &middot; ${escapeEventText(event.doorsTime ? 'Doors ' + event.doorsTime : event.timeString)}
          </div>
          <h3 class="card-title">${escapeEventText(event.title)}</h3>
          <div class="card-venue">${escapeEventText(event.venue)} &middot; ${escapeEventText(event.suburb)}</div>
          <p class="card-description">${escapeEventText(event.description)}</p>
          <div class="card-footer">
            <a href="${escapeEventText(event.ticketUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link">View event &amp; tickets &mdash;&gt;</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 3. State Management
let currentFilter = 'this-week'; // Option B: Default to current week
let searchQuery = '';
let selectedDatePreset = "this-week";
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

// 4. Weekend and Week calculation helpers
function isThisWeekend(isoDate) {
  const [y, m, d] = todayISO.split('-').map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = now.getUTCDay(); // 0 is Sun, 5 is Fri, 6 is Sat
  const diffToFriday = (5 - dayOfWeek + 7) % 7;
  const fridayISO = addDaysToISO(todayISO, diffToFriday);
  const sundayISO = addDaysToISO(fridayISO, 2);
  return isoDate >= fridayISO && isoDate <= sundayISO;
}

function getThisWeekEndISO() {
  const [y, m, d] = todayISO.split('-').map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = now.getUTCDay(); // 0 Sun, 1 Mon ... 6 Sat
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  return addDaysToISO(todayISO, daysUntilSunday);
}

// 5. Filter & Search Logic
function filterEvents() {
  const cleanQuery = searchQuery.trim().toLowerCase();

  const selectedSuburb =
    document.getElementById('filter-suburb')?.value || 'all';
  const selectedType =
    document.getElementById('filter-type')?.value || 'all';
  const selectedPrice =
    document.getElementById('filter-price')?.value || 'all';

  return brisbaneEvents.filter(event => {
    // Suburb filter
    if (
      selectedSuburb !== 'all' &&
      event.suburb.toLowerCase() !== selectedSuburb.toLowerCase()
    ) {
      return false;
    }

    // Event type filter
    if (selectedType !== 'all') {
      const typeLower = selectedType.toLowerCase();
      const categoryLower = event.category.toLowerCase();

      if (
        !categoryLower.includes(typeLower) &&
        !typeLower.includes(categoryLower)
      ) {
        return false;
      }
    }

    // Price filter
    if (selectedPrice === 'free' && event.price !== 0) return false;

    if (
      selectedPrice === 'under-15' &&
      (event.price === null || event.price >= 15)
    ) return false;

    if (
      selectedPrice === '15-30' &&
      (event.price === null || event.price < 15 || event.price > 30)
    ) return false;

    if (
      selectedPrice === '30-50' &&
      (event.price === null || event.price < 30 || event.price > 50)
    ) return false;

    if (
      selectedPrice === '50-plus' &&
      (event.price === null || event.price < 50)
    ) return false;

    // Search query matching
    const matchesSearch = cleanQuery === '' ||
      event.title.toLowerCase().includes(cleanQuery) ||
      event.venue.toLowerCase().includes(cleanQuery) ||
      event.suburb.toLowerCase().includes(cleanQuery) ||
      event.category.toLowerCase().includes(cleanQuery) ||
      event.description.toLowerCase().includes(cleanQuery);

    if (!matchesSearch) return false;

    // Fast-tap chips
    let matchesChip = true;
    if (
  !cleanQuery &&
  !selectedSingleDate &&
  !selectedRangeStart &&
  selectedDatePreset === 'this-week' &&
  selectedSuburb === 'all' &&
  selectedType === 'all' &&
  selectedPrice === 'all'
) {
      if (currentFilter === 'this-week') {
        matchesChip = event.isoDate >= todayISO && event.isoDate <= getThisWeekEndISO();
      } else if (currentFilter === 'tonight') {
        matchesChip = event.isoDate === todayISO;
      } else if (currentFilter === 'weekend') {
        matchesChip = isThisWeekend(event.isoDate);
      } else if (currentFilter === 'free') {
        matchesChip = event.price === 0;
      } else if (currentFilter === 'music') {
        matchesChip = /music|dj|open mic/i.test(event.category);
      } else if (currentFilter === 'comedy') {
        matchesChip = /comedy/i.test(event.category);
      } else if (currentFilter === 'under-20') {
        matchesChip = event.price !== null && event.price <= 20;
      } else if (currentFilter === 'all') {
        matchesChip = event.isoDate >= todayISO;
      }
    }
    if (!matchesChip) return false;

        // Date picker filtering
    if (event.isoDate < todayISO) return false;

    if (selectedRangeStart) {
      const rangeEnd = selectedRangeEnd || selectedRangeStart;
      return event.isoDate >= selectedRangeStart &&
        event.isoDate <= rangeEnd;
    }

    if (selectedSingleDate) {
      return event.isoDate === selectedSingleDate;
    }

    // Search and non-date filters look across upcoming events
    // unless the user has explicitly selected a date.
    const hasDiscoveryFilter =
      cleanQuery !== '' ||
      selectedSuburb !== 'all' ||
      selectedType !== 'all' ||
      selectedPrice !== 'all' ||
      ['free', 'music', 'comedy', 'under-20', 'all'].includes(currentFilter);

    if (selectedDatePreset === 'this-week' && hasDiscoveryFilter) {
      return true;
    }

    switch (selectedDatePreset) {
      case 'tonight':
      case 'today':
        return event.isoDate === todayISO;

      case 'tomorrow':
        return event.isoDate === addDaysToISO(todayISO, 1);

      case 'this-weekend':
      case 'weekend':
        return isThisWeekend(event.isoDate);

      case 'this-week':
        return event.isoDate <= getThisWeekEndISO();

      case 'next-7-days':
        return event.isoDate <= addDaysToISO(todayISO, 6);

      case 'next-30-days':
        return event.isoDate <= addDaysToISO(todayISO, 29);

      case 'anytime':
      default:
        return true;
    }
  });
}

// 6. Render Events (Exact Original Classes & Markup)
function renderEvents() {
  if (!eventsGrid) return;
  const filtered = filterEvents();

  if (countLabel) {
    countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'gig' : 'gigs'} found`;
  }

  if (filtered.length === 0) {
    eventsGrid.innerHTML = `
      <div class="empty-state">
        <p>No gigs match that filter yet.</p>
        <button type="button" class="btn-reset" onclick="resetAllFilters()">Reset filters</button>
      </div>
    `;
    return;
  }

  // Group by month
  const months = new Map();
  filtered.forEach((event) => {
    const monthKey = event.isoDate.slice(0, 7);
    if (!months.has(monthKey)) months.set(monthKey, []);
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
        const [eventYear, eventMonth, eventDay] = event.isoDate.split("-").map(Number);
        const date = new Date(Date.UTC(eventYear, eventMonth - 1, eventDay));
        const weekday = date.toLocaleDateString("en-AU", { weekday: "short", timeZone: "UTC" }).toUpperCase();
        const shortMonth = date.toLocaleDateString("en-AU", { month: "short", timeZone: "UTC" }).toUpperCase();
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
        const price = isFree ? "FREE ENTRY" : escapeEventText(event.priceDisplay);
        const categoryClass = ["sticker-music", "sticker-comedy", "sticker-dj", "sticker-openmic"].includes(event.stickerClass)
          ? event.stickerClass
          : "sticker-openmic";
        const timeLabel = event.doorsTime ? `Doors ${escapeEventText(event.doorsTime)}` : `Start ${escapeEventText(event.timeString)}`;

        // Venue initials typographic block
        const thumbnail = `
          <div class="event-row-initials ${categoryClass}" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:1.1rem;background:#F3F4F6;color:#5E6470;border-radius:4px;border:1px solid #E5E7EB;">
            ${escapeEventText(event.initials)}
          </div>
        `;

        const destination = isFree ? (event.eventUrl || event.ticketUrl) : event.ticketUrl;
        const validUrl = /^https?:\/\//i.test(destination || "") ? destination : null;
        const buttonLabel = isFree ? "Free" : "Tickets";

        const action = validUrl
          ? `<a class="event-row-action" href="${escapeEventText(validUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${isFree ? "Information" : "Tickets"} for ${title} (opens in a new tab)">
              ${buttonLabel} <span aria-hidden="true">&rarr;</span>
            </a>`
          : `<span class="event-row-action is-unavailable" aria-disabled="true" title="Event link not added yet">${buttonLabel}</span>`;

        return `
          <article class="event-row">
            <time class="event-row-date" datetime="${event.isoDate}" aria-label="${escapeEventText(fullDate)}">
              <span>${weekday}</span>
              <strong>${String(eventDay).padStart(2, "0")}</strong>
              <span>${shortMonth}</span>
            </time>
            <div class="event-row-thumbnail">${thumbnail}</div>
            <div class="event-row-info">
              <div class="event-row-tags">
                <span class="sticker-tag ${categoryClass}">${category}</span>
                <span aria-hidden="true">&middot;</span>
                <span class="sticker-tag sticker-price ${isFree ? "is-free" : ""}">${price}</span>
              </div>
              <h3 class="event-row-title">${title}</h3>
              <p class="event-row-meta">${venue} &middot; ${suburb} &middot; ${timeLabel}</p>
            </div>
            <div class="event-row-action-slot">${action}</div>
          </article>
        `;
      }).join("");

      return `
        <section class="event-month">
          <h3 class="event-month-heading">${escapeEventText(monthHeading)}</h3>
          <div class="event-month-list">${rows}</div>
        </section>
      `;
    }).join("");
}

// 7. Event Handlers
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderEvents();
  });
}

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

window.resetAllFilters = function() {
  currentFilter = 'this-week';
  searchQuery = '';
  selectedDatePreset = "this-week";
  selectedSingleDate = null;
  selectedRangeStart = null;
  selectedRangeEnd = null;

  if (searchInput) searchInput.value = '';

  filterChips.forEach(c => {
    const isDefault = c.dataset.filter === 'this-week' || c.dataset.filter === 'all';
    c.classList.toggle('is-active', isDefault);
    c.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
  });

  const dateLabel = document.getElementById("date-trigger-label");
  if (dateLabel) dateLabel.textContent = "This week";

  renderCalendar();
  updateDateFooter();
  renderEvents();
};

if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    if (emailInput && emailInput.value) {
      if (newsletterFeedback) {
        newsletterFeedback.textContent = `Thanks! You'll receive the Thursday dispatch once publication begins.`;
        newsletterFeedback.style.color = 'var(--cobalt, #002B49)';
      }
      emailInput.value = '';
    }
  });
}

// 8. RESTORED DATE CALENDAR & MODAL CONTROLS
const dateTriggerButton = document.getElementById("date-trigger-btn");
const datePickerPanel = document.getElementById("date-picker-modal");
const closeDatePickerButton = document.getElementById("date-modal-close");
const calendarPreviousButton = document.getElementById("cal-prev-month");
const calendarNextButton = document.getElementById("cal-next-month");
const calendarMonthDisplay = document.getElementById("cal-month-label");
const calendarGrid = document.getElementById("calendar-days-grid");
const rangeToggle = document.getElementById("range-toggle-checkbox");
const dateLabel = document.getElementById("date-trigger-label");
const dateFooterLabel = document.getElementById("footer-selection-label");
const dateClearButton = document.getElementById("date-clear-btn");
const dateApplyButton = document.getElementById("date-apply-btn");

let displayedCalendarMonth = new Date();

function closeDatePicker() {
  if (datePickerPanel) {
    datePickerPanel.hidden = true;
    if (dateTriggerButton) dateTriggerButton.setAttribute("aria-expanded", "false");
  }
}

if (dateTriggerButton && datePickerPanel) {
  dateTriggerButton.addEventListener("click", () => {
    const shouldOpen = datePickerPanel.hidden;
    datePickerPanel.hidden = !shouldOpen;
    dateTriggerButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen && closeDatePickerButton) closeDatePickerButton.focus();
  });
}

if (closeDatePickerButton) {
  closeDatePickerButton.addEventListener("click", () => {
    closeDatePicker();
    if (dateTriggerButton) dateTriggerButton.focus();
  });
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#date-picker-modal") || event.target.closest("#date-trigger-btn")) return;
  closeDatePicker();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && datePickerPanel && !datePickerPanel.hidden) {
    closeDatePicker();
    if (dateTriggerButton) dateTriggerButton.focus();
  }
});

function updateDatePresetCounts() {
  const weekEnd = getThisWeekEndISO();
  const tomorrow = addDaysToISO(todayISO, 1);
  const sevenDaysEnd = addDaysToISO(todayISO, 6);
  const thirtyDaysEnd = addDaysToISO(todayISO, 29);

  document.querySelectorAll(".preset-btn").forEach(button => {
    const preset = button.dataset.preset;

    const count = brisbaneEvents.filter(event => {
      if (event.isoDate < todayISO) return false;

      switch (preset) {
        case "anytime":
          return true;
        case "tonight":
          return event.isoDate === todayISO;
        case "tomorrow":
          return event.isoDate === tomorrow;
        case "this-weekend":
          return isThisWeekend(event.isoDate);
        case "this-week":
          return event.isoDate <= weekEnd;
        case "next-7-days":
          return event.isoDate <= sevenDaysEnd;
        case "next-30-days":
          return event.isoDate <= thirtyDaysEnd;
        default:
          return false;
      }
    }).length;

    const countSpan = button.querySelector(".preset-count");
    if (countSpan) countSpan.textContent = String(count);
  });
}

function updateDateFooter() {
  if (!dateFooterLabel) return;
  if (selectedRangeStart && selectedRangeEnd) {
    dateFooterLabel.textContent = `${formatEventDate(selectedRangeStart)} – ${formatEventDate(selectedRangeEnd)}`;
  } else if (selectedSingleDate) {
    dateFooterLabel.textContent = formatEventDate(selectedSingleDate);
  } else {
    dateFooterLabel.textContent = "This week";
  }
}

function renderCalendar() {
  if (!calendarGrid || !calendarMonthDisplay) return;

  const year = displayedCalendarMonth.getFullYear();
  const month = displayedCalendarMonth.getMonth();

  calendarMonthDisplay.textContent = new Date(year, month).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay + 6) % 7; // Monday start

  calendarGrid.innerHTML = "";

  for (let i = 0; i < leadingBlanks; i++) {
    const blank = document.createElement("div");
   blank.className = "cal-day cal-day-empty";
    calendarGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.textContent = d;
    btn.dataset.date = isoDate;

    if (isoDate < todayISO) {
      btn.disabled = true;
      btn.classList.add("is-disabled");
    }

        // Highlight a single date or both range endpoints
    if (
      selectedSingleDate === isoDate ||
      selectedRangeStart === isoDate ||
      selectedRangeEnd === isoDate
    ) {
      btn.classList.add("selected");
    }

    // Highlight the dates between the range endpoints
    if (
      selectedRangeStart &&
      selectedRangeEnd &&
      isoDate > selectedRangeStart &&
      isoDate < selectedRangeEnd
    ) {
      btn.classList.add("in-range");
    }

    btn.addEventListener("click", (event) => {
  event.stopPropagation();
  handleDateClick(isoDate);
});
    calendarGrid.appendChild(btn);
  }
}

function handleDateClick(isoDate) {
  selectedDatePreset = null;
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));

  const isRangeMode = rangeToggle ? rangeToggle.checked : false;

  if (!isRangeMode) {
    selectedSingleDate = isoDate;
    selectedRangeStart = null;
    selectedRangeEnd = null;
    if (dateLabel) dateLabel.textContent = formatEventDate(isoDate);
    if (dateFooterLabel) dateFooterLabel.textContent = formatEventDate(isoDate);
  } else {
    selectedSingleDate = null;
    if (!selectedRangeStart || (selectedRangeStart && selectedRangeEnd)) {
      selectedRangeStart = isoDate;
      selectedRangeEnd = null;
    } else {
      if (isoDate < selectedRangeStart) {
        selectedRangeEnd = selectedRangeStart;
        selectedRangeStart = isoDate;
      } else {
        selectedRangeEnd = isoDate;
      }
    }
    const rangeLabel = selectedRangeEnd
      ? `${formatEventDate(selectedRangeStart)} – ${formatEventDate(selectedRangeEnd)}`
      : formatEventDate(selectedRangeStart);
    if (dateLabel) dateLabel.textContent = rangeLabel;
    if (dateFooterLabel) dateFooterLabel.textContent = rangeLabel;
  }

  renderCalendar();
  updateDateFooter();
  renderEvents();
}

function selectDatePreset(preset, label) {
  selectedDatePreset = preset;
  selectedSingleDate = null;
  selectedRangeStart = null;
  selectedRangeEnd = null;

  if (dateLabel) dateLabel.textContent = label;
  if (dateFooterLabel) dateFooterLabel.textContent = label;

  document.querySelectorAll(".preset-btn").forEach((button) => {
    const isSelected = button.dataset.preset === preset;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  renderCalendar();
  updateDateFooter();
  renderEvents();
}

document.querySelectorAll(".preset-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const span = button.querySelector("span");
    selectDatePreset(button.dataset.preset, span ? span.textContent : button.textContent);
  });
});

if (calendarPreviousButton) {
  calendarPreviousButton.addEventListener("click", () => {
    displayedCalendarMonth.setMonth(displayedCalendarMonth.getMonth() - 1);
    renderCalendar();
  });
}

if (calendarNextButton) {
  calendarNextButton.addEventListener("click", () => {
    displayedCalendarMonth.setMonth(displayedCalendarMonth.getMonth() + 1);
    renderCalendar();
  });
}

if (dateClearButton) {
  dateClearButton.addEventListener("click", () => {
    if (rangeToggle) rangeToggle.checked = false;
    selectDatePreset("anytime", "Anytime");
  });
}

if (dateApplyButton) {
  dateApplyButton.addEventListener("click", () => {
    renderEvents();
    closeDatePicker();
    if (dateTriggerButton) dateTriggerButton.focus();
  });
}

// 9. Load Live Events From Google Sheets
async function loadLiveEvents() {
  if (eventsGrid) {
    eventsGrid.innerHTML = '<p class="empty-state">Loading Brisbane gigs&hellip;</p>';
  }

  try {
    const res = await fetch(`${SHEET_CSV_URL}&_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);

    brisbaneEvents = rows
      .filter(r => String(r.Status || '').trim().toLowerCase() === 'approved')
      .map(r => {
        const isoDate = normaliseDateToISO(r.Event_Date);
        return {
          id: r.Event_ID || `ev-${Math.random().toString(36).slice(2)}`,
          title: String(r.Event_Name || '').trim(),
          venue: String(r.Venue_Name || 'Venue TBA').trim(),
          suburb: String(r.Suburb || 'Brisbane').trim(),
          isoDate: isoDate,
          timeString: String(r.Door_Time || 'Doors 7:30 PM').trim(),
          doorsTime: String(r.Door_Time || '').trim(),
          category: String(r.Category || 'Live music').trim(),
          stickerClass: getStickerClass(r.Category),
          initials: venueInitials(r.Venue_Name),
          price: getPriceValue(r.Exact_Price, r.Price_Tier),
          priceDisplay: getPriceDisplay(r.Exact_Price, r.Price_Tier),
          description: String(r.Editorial_Blurb || '').trim(),
          ticketUrl: getValidEventLink(r.Ticket_URL, r.Official_Source_URL),
          isFeatured: String(r.Featured_Paid || '').trim().toLowerCase() === 'yes'
        };
      })
      .filter(e => e.title && e.isoDate)
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

    // Featured Paid cards: pick items with Featured_Paid = Yes
    featuredEvents = brisbaneEvents.filter(e => e.isFeatured).slice(0, 3);
    // Fallback: if none are marked Yes, pick first 3 future gigs
    if (featuredEvents.length === 0) {
      featuredEvents = brisbaneEvents.filter(e => e.isoDate >= todayISO).slice(0, 3);
    }

    populateSuburbDropdown();
    renderFeatured();
    updateDatePresetCounts();
    renderCalendar();
    updateDateFooter();
    renderEvents();
  } catch (err) {
    console.error('Error fetching Google Sheet:', err);
    if (eventsGrid) {
      eventsGrid.innerHTML = `
        <div class="empty-state">
          <p>Unable to load live gigs right now. Please refresh in a moment.</p>
        </div>
      `;
    }
  }
}

// Initial Boot
// Main page Apply and Clear buttons
const mainApplyBtn = document.getElementById('filter-apply-btn');
const mainClearBtn = document.getElementById('filter-clear-btn');

if (mainApplyBtn) {
  mainApplyBtn.addEventListener('click', () => {
    renderEvents();
  });
}

if (mainClearBtn) {
  mainClearBtn.addEventListener('click', () => {
    document.getElementById('filter-suburb').value = 'all';
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-price').value = 'all';

    resetAllFilters();
  });
}
loadLiveEvents();

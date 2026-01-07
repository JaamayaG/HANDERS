const form = document.getElementById("packageForm");
const originInput = document.getElementById("origin");
const destinationInput = document.getElementById("destination");
const adultsInput = document.getElementById("adults");
const childrenInput = document.getElementById("children");
const infantsInput = document.getElementById("infants");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const dateRangeInput = document.getElementById("dateRange");
const dateRangePicker = document.getElementById("dateRangePicker");
const flightsInput = document.getElementById("flightsInput");
const hotelsInput = document.getElementById("hotelsInput");
const mealsInput = document.getElementById("meals");
const drinksInput = document.getElementById("drinks");
const transfersInput = document.getElementById("transfers");
const passengerTotal = document.getElementById("passengerTotal");
const messageOutput = document.getElementById("messageOutput");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");
const dateError = document.getElementById("dateError");
const hotelCount = document.getElementById("hotelCount");
const hotelWarning = document.getElementById("hotelWarning");
const originOptions = document.getElementById("originOptions");
const destinationOptions = document.getElementById("destinationOptions");
const packageMode = document.getElementById("packageMode");
const packageLayout = document.getElementById("packageLayout");
const imagePaste = document.getElementById("imagePaste");
const imagePreview = document.getElementById("imagePreview");
const imageStatus = document.getElementById("imageStatus");

const lodgingLayout = document.getElementById("lodgingLayout");
const lodgingForm = document.getElementById("lodgingForm");
const lodgingDestinationInput = document.getElementById("lodgingDestination");
const lodgingDestinationOptions = document.getElementById(
  "lodgingDestinationOptions"
);
const lodgingAdultsInput = document.getElementById("lodgingAdults");
const lodgingChildrenInput = document.getElementById("lodgingChildren");
const lodgingFromDateInput = document.getElementById("lodgingFromDate");
const lodgingToDateInput = document.getElementById("lodgingToDate");
const lodgingDateRangeInput = document.getElementById("lodgingDateRange");
const lodgingDateRangePicker = document.getElementById(
  "lodgingDateRangePicker"
);
const lodgingHotelsInput = document.getElementById("lodgingHotelsInput");
const lodgingMealsInput = document.getElementById("lodgingMeals");
const lodgingDrinksInput = document.getElementById("lodgingDrinks");
const lodgingTransfersInput = document.getElementById("lodgingTransfers");
const lodgingCopyButton = document.getElementById("lodgingCopyButton");
const lodgingClearButton = document.getElementById("lodgingClearButton");
const lodgingDateError = document.getElementById("lodgingDateError");
const lodgingHotelCount = document.getElementById("lodgingHotelCount");
const lodgingHotelWarning = document.getElementById("lodgingHotelWarning");
const lodgingMessageOutput = document.getElementById("lodgingMessageOutput");

const hotelPattern =
  /^\s*(.+?)\s*-\s*Aerol[ií]nea\s*:?\s*(.+?)\s*-\s*Precio\s*:?\s*(.+?)\s*$/i;
const lodgingHotelPattern = /^\s*(.+?)\s*-\s*Precio\s*:?\s*(.+?)\s*$/i;
const originChoices = ["BOGOTÁ", "CALI", "PEREIRA", "MEDELLÍN"];
const destinationChoices = [
  "GIRARDOT",
  "SAN ANDRÉS",
  "LA GUAJIRA",
  "EL AMAZONAS",
  "SANTA MARTA",
  "COVEÑAS",
  "MEDELLÍN",
  "PANAMÁ",
  "CANCÚN",
  "PUNTA CANA",
  "SANTO DOMINGO",
];
const lodgingDestinationChoices = [
  "GIRARDOT",
  "SAN ANDRÉS",
  "LA GUAJIRA",
  "EL AMAZONAS",
  "SANTA MARTA",
  "COVEÑAS",
  "MEDELLÍN",
];

const forceUppercase = (input) => {
  if (!input) {
    return;
  }
  input.value = input.value.toUpperCase();
};

const stripDiacritics = (text) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const resetImagePaste = () => {
  if (!imagePaste || !imagePreview) {
    return;
  }
  imagePreview.src = "";
  imagePreview.classList.remove("show");
  imagePaste.textContent = "Pega aqui una imagen";
  if (imageStatus) {
    imageStatus.textContent = "";
  }
};

const formatRangeDisplay = (fromValue, toValue) => {
  if (!fromValue || !toValue) {
    return "";
  }
  return `${fromValue} al ${toValue}`;
};

const setRangeInputs = (fromInput, toInput, rangeInput, fromValue, toValue) => {
  if (fromInput) {
    fromInput.value = fromValue || "";
  }
  if (toInput) {
    toInput.value = toValue || "";
  }
  if (rangeInput) {
    rangeInput.value = formatRangeDisplay(fromValue, toValue);
  }
};

const applyBackendOcrData = (data) => {
  if (!data || data.error) {
    return;
  }
  if (data.origin) {
    originInput.value = data.origin.toUpperCase();
  }
  if (data.destination) {
    destinationInput.value = data.destination.toUpperCase();
  }
  if (data.totals) {
    adultsInput.value = data.totals.adults ?? 0;
    childrenInput.value = data.totals.children ?? 0;
    infantsInput.value = data.totals.infants ?? 0;
  }
  if (data.departure_date) {
    fromDateInput.value = data.departure_date;
  }
  if (data.return_date) {
    toDateInput.value = data.return_date;
  }
  setRangeInputs(
    fromDateInput,
    toDateInput,
    dateRangeInput,
    fromDateInput.value,
    toDateInput.value
  );
  buildMessage();
};

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const cleanLines = (input) => {
  const lines = input.split(/\r?\n/);
  const cleaned = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = stripDiacritics(trimmed)
      .toLowerCase()
      .replace(/[.]/g, "")
      .replace(/\s+/g, " ");

    if (normalized.includes("ver detalle") || normalized.includes("ver mas")) {
      continue;
    }

    cleaned.push(trimmed);
  }
  return cleaned;
};

const parseHotels = (input) => {
  const cleaned = cleanLines(input);
  const hotels = [];

  for (const line of cleaned) {
    const match = line.match(hotelPattern);
    if (!match) {
      continue;
    }

    const name = match[1].trim();
    const airline = match[2].trim();
    const price = match[3].trim();

    if (!name || !airline || !price) {
      continue;
    }

    hotels.push({ name, airline, price });
  }

  return hotels;
};

const parseFlightDetails = (input) => {
  const cleaned = cleanLines(input);
  let outbound = "";
  let inbound = "";
  let flightId = "";

  for (let i = 0; i < cleaned.length; i += 1) {
    const line = cleaned[i];
    const normalized = stripDiacritics(line)
      .toLowerCase()
      .replace(/\s+/g, " ");

    if (normalized.startsWith("ida")) {
      outbound = cleaned[i + 1]?.trim() || outbound;
      continue;
    }

    if (normalized.startsWith("regreso")) {
      inbound = cleaned[i + 1]?.trim() || inbound;
      continue;
    }

    const idMatch = line.match(/id\s*vuelo\s*:?\s*(.+)$/i);
    if (idMatch) {
      flightId = idMatch[1].trim();
    }
  }

  return { outbound, inbound, flightId };
};

const buildFlightText = (details) => {
  const formatTime = (value) => {
    if (!value) {
      return "POR DEFINIR";
    }
    const match = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
      return value;
    }
    const hours24 = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] ?? "00";
    const hours12 = ((hours24 + 11) % 12) + 1;
    const period = hours24 >= 12 ? "PM" : "AM";
    return `${String(hours12).padStart(2, "0")}:${minutes}:${seconds} ${period}`;
  };

  const outbound = formatTime(details.outbound);
  const inbound = formatTime(details.inbound);
  const flightId = details.flightId || "POR DEFINIR";
  return `HORARIO IDA: ${outbound}\nHORARIO REGRESO: ${inbound}\nID VUELO: ${flightId}`;
};

const parseLodgingHotels = (input) => {
  const cleaned = cleanLines(input);
  const hotels = [];

  for (const line of cleaned) {
    const match = line.match(lodgingHotelPattern);
    if (!match) {
      continue;
    }

    const name = match[1].trim();
    const price = match[2].trim();

    if (!name || !price) {
      continue;
    }

    hotels.push({ name, price });
  }

  return hotels;
};

const buildHotelsText = (hotels) => {
  if (hotels.length === 0) {
    return "No se detectaron hoteles válidos.";
  }

  return hotels
    .map(
      (hotel) =>
        `**${hotel.name}**\n✈️ Aerolínea: ${hotel.airline}\n💰 TOTAL**${hotel.price} COP**`
    )
    .join("\n________________\n\n");
};

const parsePriceValue = (raw) => {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }
  return Number.parseInt(digits, 10);
};

const formatPrice = (value) =>
  `$ ${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const buildLodgingHotelsText = (hotels, perPersonExtra, peopleCount) => {
  if (hotels.length === 0) {
    return "No se detectaron hoteles válidos.";
  }

  return hotels
    .map((hotel) => {
      const base = parsePriceValue(hotel.price);
      if (base === null) {
        return `**${hotel.name}**\n💰 **${hotel.price} COP**`;
      }

      const totalExtra = perPersonExtra * peopleCount;
      const total = base + totalExtra;
      return `**${hotel.name}**\n💰 **${formatPrice(total)} COP**`;
    })
    .join("\n________________\n\n");
};

const buildMessage = () => {
  const adults = toInt(adultsInput.value);
  const children = toInt(childrenInput.value);
  const infants = toInt(infantsInput.value);

  const passengerParts = [];
  if (adults > 0) {
    passengerParts.push(`Adultos: ${adults}`);
  }
  if (children > 0) {
    passengerParts.push(`Niños: ${children}`);
  }
  if (infants > 0) {
    passengerParts.push(`Bebés (infantes): ${infants}`);
  }
  const passengerLine = `👥 ${passengerParts.join(" | ") || "Adultos: 0"}`;
  passengerTotal.textContent = passengerLine;

  const fromDateValue = fromDateInput.value;
  const toDateValue = toDateInput.value;

  const hotels = parseHotels(hotelsInput.value);
  hotelCount.textContent = `Hoteles detectados: ${hotels.length}`;

  if (hotels.length === 0) {
    hotelWarning.textContent =
      "No se detectaron hoteles válidos. Revisa el formato del bloque de texto.";
    hotelWarning.style.display = "block";
  } else {
    hotelWarning.textContent = "";
    hotelWarning.style.display = "none";
  }

  if (
    !fromDateValue ||
    !toDateValue ||
    new Date(fromDateValue) > new Date(toDateValue)
  ) {
    dateError.textContent =
      "La fecha es inválida. La fecha final debe ser mayor o igual a la inicial.";
    dateError.style.display = "block";
    messageOutput.textContent = "";
    copyButton.disabled = true;
    return;
  }

  dateError.textContent = "";
  dateError.style.display = "none";

  const fromDate = new Date(fromDateValue + "T00:00:00");
  const toDate = new Date(toDateValue + "T00:00:00");
  const diffMs = toDate.getTime() - fromDate.getTime();
  const nights = Math.max(Math.round(diffMs / 86400000), 0);
  const days = nights + 1;

  const hotelsText = buildHotelsText(hotels);
  const flightDetails = parseFlightDetails(flightsInput?.value || "");
  const flightsText = buildFlightText(flightDetails);
  const meals = mealsInput.value.trim();
  const drinks = drinksInput.value.trim();
  const transfers = transfersInput.value.trim();

  const fromDay = String(fromDate.getDate()).padStart(2, "0");
  const toDay = String(toDate.getDate()).padStart(2, "0");
  const fromMonth = fromDate
    .toLocaleDateString("es-CO", { month: "long" })
    .toUpperCase();
  const toMonth = toDate
    .toLocaleDateString("es-CO", { month: "long" })
    .toUpperCase();
  const fromYear = fromDate.getFullYear();
  const toYear = toDate.getFullYear();
  let cycleText = `📆 Ciclo: DEL ${fromDay} AL ${toDay} DE ${fromMonth} DEL ${fromYear}`;
  if (fromMonth !== toMonth || fromYear !== toYear) {
    cycleText =
      fromYear === toYear
        ? `📆 Ciclo: DEL ${fromDay} DE ${fromMonth} AL ${toDay} DE ${toMonth} DEL ${toYear}`
        : `📆 Ciclo: DEL ${fromDay} DE ${fromMonth} DEL ${fromYear} AL ${toDay} DE ${toMonth} DEL ${toYear}`;
  }

  const origin = originInput.value.trim().toUpperCase();
  const destination = destinationInput.value.trim().toUpperCase();
  const includeDrinks = drinks.toLowerCase() !== "no";
  const includeTransfers = transfers.toLowerCase() !== "sin traslados";
  const drinksLine = includeDrinks ? `\n🍹 BEBIDAS ILIMITADAS: ${drinks}` : "";
  const transfersBlock = includeTransfers
    ? `\n\n🚐 TRASLADOS INCLUIDOS\n${transfers}`
    : "";

  const message = `🌴 ORIGEN: ${origin}\n🌴 DESTINO: ${destination}\n\n${passengerLine}\n${cycleText}\n\n🏨💰\n\n🏨 Opciones de hotel disponibles:\n\n${hotelsText}\n\n✅ INCLUYE:\n\n✈️ Tiquetes aéreos\n${flightsText}\n\n🏨 Ciclo de ${nights} noches y ${days} días\n\n🍽️ Alimentación: ${meals}\n\n🛏️ PACK HABITACIÓN:\n• Toalla de baño\n• Aseo diario de la habitación\n• Aire acondicionado ❄️${drinksLine}${transfersBlock}`;

  messageOutput.textContent = message;
  copyButton.disabled = false;
};

const buildLodgingMessage = () => {
  const destination = lodgingDestinationInput.value.trim().toUpperCase();
  const adults = toInt(lodgingAdultsInput.value);
  const children = toInt(lodgingChildrenInput.value);
  const people = adults + children;
  const fromValue = lodgingFromDateInput.value;
  const toValue = lodgingToDateInput.value;

  if (!fromValue || !toValue || new Date(fromValue) > new Date(toValue)) {
    lodgingDateError.textContent =
      "La fecha es inválida. La fecha final debe ser mayor o igual a la inicial.";
    lodgingDateError.style.display = "block";
    lodgingMessageOutput.textContent = "";
    lodgingCopyButton.disabled = true;
    return;
  }

  lodgingDateError.textContent = "";
  lodgingDateError.style.display = "none";

  const fromDate = new Date(fromValue + "T00:00:00");
  const toDate = new Date(toValue + "T00:00:00");
  const diffMs = toDate.getTime() - fromDate.getTime();
  const nights = Math.max(Math.round(diffMs / 86400000), 0);
  const days = nights + 1;

  const hotels = parseLodgingHotels(lodgingHotelsInput.value);
  lodgingHotelCount.textContent = `Hoteles detectados: ${hotels.length}`;

  if (hotels.length === 0) {
    lodgingHotelWarning.textContent =
      "No se detectaron hoteles válidos. Revisa el formato del bloque de texto.";
    lodgingHotelWarning.style.display = "block";
  } else {
    lodgingHotelWarning.textContent = "";
    lodgingHotelWarning.style.display = "none";
  }

  const meals = lodgingMealsInput.value.trim();
  const drinks = lodgingDrinksInput.value.trim();
  const transfers = lodgingTransfersInput.value.trim();
  const transfersKey = transfers.toLowerCase();

  const perPersonExtra = (() => {
    if (transfersKey === "sin traslados") {
      return 0;
    }

    if (destination === "LA GUAJIRA") {
      if (transfersKey === "aeropuerto hotel aeropuerto") {
        return 60000;
      }
      if (transfersKey === "hotel aeropuerto") {
        return 45000;
      }
      return 0;
    }

    if (destination === "EL AMAZONAS") {
      if (transfersKey === "aeropuerto hotel aeropuerto") {
        return 90000;
      }
      if (transfersKey === "hotel aeropuerto") {
        return 60000;
      }
      return 0;
    }

    return 0;
  })();

  const hotelsText = buildLodgingHotelsText(hotels, perPersonExtra, people);

  const fromDay = String(fromDate.getDate()).padStart(2, "0");
  const toDay = String(toDate.getDate()).padStart(2, "0");
  const fromMonth = fromDate
    .toLocaleDateString("es-CO", { month: "long" })
    .toUpperCase();
  const toMonth = toDate
    .toLocaleDateString("es-CO", { month: "long" })
    .toUpperCase();
  const fromYear = fromDate.getFullYear();
  const toYear = toDate.getFullYear();

  let cycleText = `Ciclo: *DEL ${fromDay} AL ${toDay} DE ${fromMonth} DEL ${fromYear}*`;
  if (fromMonth !== toMonth || fromYear !== toYear) {
    cycleText =
      fromYear === toYear
        ? `Ciclo: *DEL ${fromDay} DE ${fromMonth} AL ${toDay} DE ${toMonth} DEL ${toYear}*`
        : `Ciclo: *DEL ${fromDay} DE ${fromMonth} DEL ${fromYear} AL ${toDay} DE ${toMonth} DEL ${toYear}*`;
  }

  const includeDrinks = drinks.toLowerCase() !== "no";
  const includeTransfers = transfersKey !== "sin traslados";
  const drinksLine = includeDrinks
    ? "\n- Bebidas alcohólicas y no alcohólicas *ILIMITADAS* en el Bar."
    : "";
  const transfersLine = includeTransfers
    ? `\n- TRASLADOS ${transfers.toUpperCase()}`
    : "";

  const message = `Alojamiento en ${destination} 🏝️🌅\n\n👥 Precio para ${people} PERSONAS.\n\n${cycleText}\n\n${hotelsText}\n\n${nights} NOCHES Y ${days} DÍAS\n\nINCLUYE:\n\n- Alimentación:🍽️.\n(${meals}.)${drinksLine}${transfersLine}`;

  lodgingMessageOutput.textContent = message;
  lodgingCopyButton.disabled = false;
};

const copyText = async (buttonEl, text) => {
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    buttonEl.textContent = "✅ MENSAJE COPIADO";
    setTimeout(() => {
      buttonEl.textContent = "📋 COPIAR MENSAJE";
    }, 1600);
  } catch (error) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
};

const copyMessage = async () => {
  const text = messageOutput.textContent.trim();
  await copyText(copyButton, text);
};

const clearAll = () => {
  form.reset();
  originInput.value = "";
  destinationInput.value = "";
  setRangeInputs(fromDateInput, toDateInput, dateRangeInput, "", "");
  resetImagePaste();
  messageOutput.textContent = "";
  hotelWarning.textContent = "";
  hotelWarning.style.display = "none";
  dateError.textContent = "";
  dateError.style.display = "none";
  copyButton.disabled = true;
  buildMessage();
};

const clearLodging = () => {
  lodgingForm.reset();
  setRangeInputs(
    lodgingFromDateInput,
    lodgingToDateInput,
    lodgingDateRangeInput,
    "",
    ""
  );
  lodgingMessageOutput.textContent = "";
  lodgingHotelWarning.textContent = "";
  lodgingHotelWarning.style.display = "none";
  lodgingDateError.textContent = "";
  lodgingDateError.style.display = "none";
  lodgingCopyButton.disabled = true;
  buildLodgingMessage();
};

const renderOptions = (listEl, options) => {
  listEl.innerHTML = "";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "combo-option";
    button.textContent = option;
    listEl.appendChild(button);
  });
};

const setupCombo = (input, listEl, options) => {
  const showList = () => {
    listEl.classList.add("show");
  };

  const hideList = () => {
    listEl.classList.remove("show");
  };

  const filterOptions = () => {
    const query = input.value.trim().toUpperCase();
    const filtered = options.filter((option) => option.includes(query));
    renderOptions(listEl, filtered.length ? filtered : options);
    showList();
  };

  input.addEventListener("focus", filterOptions);
  input.addEventListener("click", filterOptions);
  input.addEventListener("input", filterOptions);

  input.addEventListener("blur", () => {
    setTimeout(hideList, 120);
  });

  listEl.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement) {
      input.value = target.textContent;
      hideList();
      buildMessage();
    }
  });
};

const setupDateRangePicker = ({
  input,
  picker,
  fromInput,
  toInput,
  onChange,
}) => {
  if (!input || !picker || !fromInput || !toInput) {
    return;
  }

  let currentMonth = new Date();
  currentMonth.setDate(1);
  let rangeStart = null;
  let rangeEnd = null;

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const render = () => {
    picker.innerHTML = "";
    const header = document.createElement("div");
    header.className = "date-range-header";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "date-range-nav";
    prevBtn.textContent = "<";
    prevBtn.addEventListener("click", () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      render();
    });

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "date-range-nav";
    nextBtn.textContent = ">";
    nextBtn.addEventListener("click", () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    });

    const title = document.createElement("div");
    title.textContent = currentMonth.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    picker.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "date-range-grid";

    ["L", "M", "M", "J", "V", "S", "D"].forEach((day) => {
      const el = document.createElement("div");
      el.className = "date-range-weekday";
      el.textContent = day;
      grid.appendChild(el);
    });

    const firstDayIndex = (currentMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    for (let i = 0; i < firstDayIndex; i += 1) {
      const blank = document.createElement("div");
      blank.className = "date-range-day is-muted";
      blank.textContent = "";
      grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "date-range-day";
      cell.textContent = String(day);

      const inRange =
        rangeStart &&
        rangeEnd &&
        date >= rangeStart &&
        date <= rangeEnd;
      if (inRange) {
        cell.classList.add("is-selected");
      }
      if (isSameDay(date, rangeStart)) {
        cell.classList.add("is-start");
      }
      if (isSameDay(date, rangeEnd)) {
        cell.classList.add("is-end");
      }

      cell.addEventListener("click", () => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
          rangeStart = date;
          rangeEnd = null;
          render();
          return;
        }

        if (date < rangeStart) {
          rangeEnd = rangeStart;
          rangeStart = date;
        } else {
          rangeEnd = date;
        }

        const fromValue = formatDate(rangeStart);
        const toValue = formatDate(rangeEnd);
        setRangeInputs(fromInput, toInput, input, fromValue, toValue);
        picker.classList.remove("show");
        picker.setAttribute("aria-hidden", "true");
        if (typeof onChange === "function") {
          onChange();
        }
        render();
      });

      grid.appendChild(cell);
    }

    picker.appendChild(grid);
  };

  const openPicker = () => {
    rangeStart = null;
    rangeEnd = null;
    setRangeInputs(fromInput, toInput, input, "", "");
    picker.classList.add("show");
    picker.setAttribute("aria-hidden", "false");
    render();
  };

  input.addEventListener("click", (event) => {
    event.stopPropagation();
    openPicker();
  });

  picker.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (event.target === input || picker.contains(event.target)) {
      return;
    }
    picker.classList.remove("show");
    picker.setAttribute("aria-hidden", "true");
  });
};

const toggleMode = () => {
  const lodgingOnly = packageMode.checked;
  if (lodgingOnly) {
    packageLayout.style.display = "none";
    lodgingLayout.style.display = "grid";
    lodgingLayout.setAttribute("aria-hidden", "false");
  } else {
    packageLayout.style.display = "";
    lodgingLayout.style.display = "none";
    lodgingLayout.setAttribute("aria-hidden", "true");
  }
};

form.addEventListener("input", buildMessage);
copyButton.addEventListener("click", copyMessage);
clearButton.addEventListener("click", clearAll);

if (lodgingForm) {
  lodgingForm.addEventListener("input", buildLodgingMessage);
  lodgingCopyButton.addEventListener("click", async () => {
    const text = lodgingMessageOutput.textContent.trim();
    await copyText(lodgingCopyButton, text);
  });
  lodgingClearButton.addEventListener("click", clearLodging);
  buildLodgingMessage();
}

packageMode.addEventListener("change", toggleMode);
toggleMode();

setupCombo(originInput, originOptions, originChoices);
setupCombo(destinationInput, destinationOptions, destinationChoices);
setupCombo(
  lodgingDestinationInput,
  lodgingDestinationOptions,
  lodgingDestinationChoices
);

setupDateRangePicker({
  input: dateRangeInput,
  picker: dateRangePicker,
  fromInput: fromDateInput,
  toInput: toDateInput,
  onChange: buildMessage,
});

setupDateRangePicker({
  input: lodgingDateRangeInput,
  picker: lodgingDateRangePicker,
  fromInput: lodgingFromDateInput,
  toInput: lodgingToDateInput,
  onChange: buildLodgingMessage,
});

buildMessage();

if (imagePaste && imagePreview) {
  imagePaste.addEventListener("paste", (event) => {
    const items = event.clipboardData?.items || [];
    const imageItem = Array.from(items).find((item) =>
      item.type.startsWith("image/")
    );
    if (!imageItem) {
      return;
    }
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.classList.add("show");
      imagePaste.textContent = "Imagen pegada";
      if (imageStatus) {
        imageStatus.textContent = "Procesando imagen...";
      }
      if (!window.Tesseract) {
        if (imageStatus) {
          imageStatus.textContent = "OCR no disponible.";
        }
        return;
      }
      window.Tesseract.recognize(imagePreview, "spa", {
        logger: () => {},
      })
        .then((result) => {
          const rawText = result.data.text || "";
          return fetch("/parse_ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_text: rawText }),
          })
            .then((response) =>
              response
                .json()
                .then((data) => ({ ok: response.ok, data }))
            )
            .then(({ ok, data }) => {
              if (ok) {
                applyBackendOcrData(data);
                if (imageStatus) {
                  imageStatus.textContent = "Datos cargados desde OCR.";
                }
              } else if (imageStatus) {
                imageStatus.textContent = "OCR no disponible en servidor.";
              }
            });
        })
        .catch(() => {
          if (imageStatus) {
            imageStatus.textContent = "No se pudo leer la imagen.";
          }
        });
    };
    reader.readAsDataURL(file);
  });

  imagePaste.addEventListener("click", () => {
    if (imagePreview.classList.contains("show")) {
      resetImagePaste();
    }
  });
}

originInput.addEventListener("input", () => forceUppercase(originInput));
destinationInput.addEventListener("input", () => forceUppercase(destinationInput));
if (lodgingDestinationInput) {
  lodgingDestinationInput.addEventListener("input", () =>
    forceUppercase(lodgingDestinationInput)
  );
}

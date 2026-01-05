const form = document.getElementById("packageForm");
const originInput = document.getElementById("origin");
const destinationInput = document.getElementById("destination");
const adultsInput = document.getElementById("adults");
const childrenInput = document.getElementById("children");
const infantsInput = document.getElementById("infants");
const fromDayInput = document.getElementById("fromDay");
const toDayInput = document.getElementById("toDay");
const fromMonthInput = document.getElementById("fromMonth");
const toMonthInput = document.getElementById("toMonth");
const yearInput = document.getElementById("year");
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

const hotelPattern = /^\s*(.+?)\s*-\s*Aerol[ií]nea\s*:?\s*(.+?)\s*-\s*Precio\s*:?\s*(.+?)\s*$/i;

const stripDiacritics = (text) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

const buildHotelsText = (hotels) => {
  if (hotels.length === 0) {
    return "No se detectaron hoteles válidos.";
  }

  return hotels
    .map(
      (hotel) =>
        `**${hotel.name}**\n✈️ Aerolínea: ${hotel.airline}\n💰 **${hotel.price} COP**`
    )
    .join("\n________________\n\n");
};

const buildMessage = () => {
  const adults = toInt(adultsInput.value);
  const children = toInt(childrenInput.value);
  const infants = toInt(infantsInput.value);
  const totalPassengers = adults + children + infants;

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

  const fromDay = toInt(fromDayInput.value);
  const toDay = toInt(toDayInput.value);
  const fromMonth = fromMonthInput.value.trim();
  const toMonth = toMonthInput.value.trim();
  const year = yearInput.value.trim();

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

  const fromMonthIndex = fromMonthInput.selectedIndex;
  const toMonthIndex = toMonthInput.selectedIndex;
  const yearNumber = toInt(yearInput.value);

  if (
    fromDay <= 0 ||
    toDay <= 0 ||
    fromMonthIndex > toMonthIndex ||
    (fromMonthIndex === toMonthIndex && toDay < fromDay)
  ) {
    dateError.textContent =
      "La fecha es inválida. El día final debe ser mayor o igual al inicial.";
    dateError.style.display = "block";
    messageOutput.textContent = "";
    copyButton.disabled = true;
    return;
  }

  dateError.textContent = "";
  dateError.style.display = "none";

  const fromDate = new Date(Date.UTC(yearNumber, fromMonthIndex, fromDay));
  const toDate = new Date(Date.UTC(yearNumber, toMonthIndex, toDay));
  const diffMs = toDate.getTime() - fromDate.getTime();
  const nights = Math.max(Math.round(diffMs / 86400000), 0);
  const days = nights + 1;

  const hotelsText = buildHotelsText(hotels);
  const meals = mealsInput.value.trim();
  const drinks = drinksInput.value.trim();
  const transfers = transfersInput.value.trim();

  const cycleText =
    fromMonthIndex === toMonthIndex
      ? `📆 Ciclo: DEL ${fromDay} AL ${toDay} DE ${fromMonth} DEL ${year}`
      : `📆 Ciclo: DEL ${fromDay} DE ${fromMonth} AL ${toDay} DE ${toMonth} DEL ${year}`;

  const origin = originInput.value.trim().toUpperCase();
  const destination = destinationInput.value.trim().toUpperCase();
  const includeDrinks = drinks.toLowerCase() !== "no";
  const includeTransfers = transfers.toLowerCase() !== "sin traslados";
  const drinksLine = includeDrinks ? `\n🍹 BEBIDAS ILIMITADAS: ${drinks}` : "";
  const transfersBlock = includeTransfers
    ? `\n\n🚐 TRASLADOS INCLUIDOS\n${transfers}`
    : "";

  const message = `🌴 PAQUETE DESDE ${origin} HACIA ${destination} 🌴\n\n${passengerLine}\n${cycleText}\n🏨💰\n\n🏨 Opciones de hotel disponibles:\n\n${hotelsText}\n\n✅ INCLUYE:\n\n✈️ Tiquetes aéreos\nIda y regreso\n\n🏨 Ciclo de ${nights} noches y ${days} días\n\n🍽️ Alimentación: ${meals}\n\n🛏️ PACK HABITACIÓN:\n• Toalla de baño\n• Aseo diario de la habitación\n• Aire acondicionado ❄️${drinksLine}${transfersBlock}`;

  messageOutput.textContent = message;
  copyButton.disabled = false;
};

const copyMessage = async () => {
  const text = messageOutput.textContent.trim();
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "✅ MENSAJE COPIADO";
    setTimeout(() => {
      copyButton.textContent = "📋 COPIAR MENSAJE";
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

const clearAll = () => {
  form.reset();
  originInput.value = "";
  destinationInput.value = "";
  messageOutput.textContent = "";
  hotelWarning.textContent = "";
  hotelWarning.style.display = "none";
  dateError.textContent = "";
  dateError.style.display = "none";
  copyButton.disabled = true;
  buildMessage();
};

if (!yearInput.value) {
  const currentYear = new Date().getFullYear();
  yearInput.value = currentYear;
  yearInput.defaultValue = currentYear;
}

form.addEventListener("input", buildMessage);
copyButton.addEventListener("click", copyMessage);
clearButton.addEventListener("click", clearAll);

buildMessage();

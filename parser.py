import json
import re
from typing import Dict, List, Optional, Tuple


def normalize_text(raw_text: str) -> Dict[str, str]:
    # Preserve length by replacing noisy separators with spaces.
    cleaned = (
        raw_text.replace("\u2014", " ")
        .replace("\u2013", " ")
        .replace("|", " ")
    )
    lower = cleaned.lower()
    collapsed = re.sub(r"[ \t]+", " ", lower)
    return {
        "raw": raw_text,
        "lower": lower,
        "collapsed": collapsed,
    }


def extract_between(raw_text: str, lower_text: str, start: str, end_markers: List[str]) -> Optional[str]:
    start_idx = lower_text.find(start)
    if start_idx == -1:
        return None
    start_idx += len(start)
    end_idx = len(lower_text)
    for marker in end_markers:
        idx = lower_text.find(marker, start_idx)
        if idx != -1:
            end_idx = min(end_idx, idx)
    segment = raw_text[start_idx:end_idx].strip()
    return segment or None


def parse_dates(raw_text: str) -> Tuple[Optional[str], Optional[str]]:
    date_matches = []
    for match in re.finditer(r"\b(\d{4})-(\d{2})-(\d{2})\b", raw_text):
        date_matches.append(f"{match.group(1)}-{match.group(2)}-{match.group(3)}")
    for match in re.finditer(r"\b(\d{4})(\d{2})(\d{2})\b", raw_text):
        date_matches.append(f"{match.group(1)}-{match.group(2)}-{match.group(3)}")
    if len(date_matches) >= 2:
        return date_matches[0], date_matches[1]
    if len(date_matches) == 1:
        return date_matches[0], None
    return None, None


def clean_city(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    line = value.splitlines()[0]
    line = re.sub(r"\(.*?\)", "", line)
    line = re.sub(r"\bd\.?c\.?\b", "", line, flags=re.IGNORECASE)
    line = re.sub(r"\bcolombia\b", "", line, flags=re.IGNORECASE)
    line = re.sub(r"\bpesos?\b", "", line, flags=re.IGNORECASE)
    line = re.sub(r"\bcop\b", "", line, flags=re.IGNORECASE)
    line = re.sub(r"\b[A-Z]{2,4}\b", "", line)
    line = re.sub(r"[^A-Za-z\u00C0-\u017F\s]", " ", line)
    line = re.sub(r"\s+", " ", line).strip()
    line = " ".join(part for part in line.split() if len(part) > 1)
    return line or None


def extract_general_fields(raw_text: str) -> Dict[str, Optional[str]]:
    norm = normalize_text(raw_text)
    lower = norm["lower"]

    plan = "Plan completo" if "plan completo" in lower else None

    flight_type = None
    if "vuelo comercial" in lower:
        flight_type = "Vuelo comercial"
    if "vuelo onvacation" in lower:
        flight_type = "Vuelo Onvacation"

    origin = extract_between(
        raw_text,
        lower,
        "ciudad de origen",
        ["ciudad de destino", "cantidad de habitaciones", "fecha salida"],
    )
    destination = extract_between(
        raw_text,
        lower,
        "ciudad de destino",
        ["cantidad de habitaciones", "fecha salida", "multiorigen"],
    )

    origin = clean_city(origin)
    destination = clean_city(destination)

    def split_origin_destination(value: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        if not value:
            return None, None
        line = value.splitlines()[0]
        parts = re.split(r"\s+e\s+|\s+y\s+|\s{2,}", line, flags=re.IGNORECASE)
        parts = [clean_city(part) for part in parts if part.strip()]
        parts = [part for part in parts if part]
        if len(parts) >= 2:
            return parts[0], parts[1]
        words = parts[0].split() if parts else []
        if len(words) == 2:
            return words[0], words[1]
        return parts[0] if parts else None, None

    origin_candidates = {
        "bogota": "Bogotá",
        "cali": "Cali",
        "medellin": "Medellín",
        "pereira": "Pereira",
        "bucaramanga": "Bucaramanga",
        "santa marta": "Santa Marta",
    }
    destination_candidates = {
        "san andres islas": "San Andrés Islas",
        "san andres": "San Andrés",
        "la guajira": "La Guajira",
        "el amazonas": "El Amazonas",
        "santa marta": "Santa Marta",
        "covenas": "Coveñas",
        "medellin": "Medellín",
        "panama": "Panamá",
        "cancun": "Cancún",
        "punta cana": "Punta Cana",
        "santo domingo": "Santo Domingo",
    }

    def find_city_candidate(value: Optional[str], candidates: Dict[str, str]) -> Optional[str]:
        if not value:
            return None
        normalized = clean_city(value) or ""
        normalized = normalized.lower()
        for candidate, label in candidates.items():
            if candidate in normalized:
                return label
        return None

    def find_city_in_line(line: str, candidates: Dict[str, str]) -> Optional[Tuple[str, int]]:
        normalized = clean_city(line) or ""
        normalized = normalized.lower()
        matches = []
        for candidate, label in candidates.items():
            idx = normalized.find(candidate)
            if idx != -1:
                matches.append((label, idx, len(candidate)))
        if not matches:
            return None
        matches.sort(key=lambda item: item[1])
        label, idx, length = matches[0]
        return label, idx + length

    def parse_origin_destination_line(line: str) -> Tuple[Optional[str], Optional[str]]:
        # Expected layout: "<origin> (Colombia) CODE <destination> (Colombia) CODE"
        parts = re.split(r"\(colombia\)\s*[A-Z]{2,4}", line, flags=re.IGNORECASE)
        parts = [clean_city(part) for part in parts if part.strip()]
        if len(parts) >= 2:
            return parts[0], parts[1]
        return None, None

    origin_line = None
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    for idx, line in enumerate(lines):
        if "ciudad de origen" in line.lower() and "ciudad de destino" in line.lower():
            if idx + 1 < len(lines):
                origin_line = lines[idx + 1]
            break

    if origin_line:
        line_origin, line_destination = parse_origin_destination_line(origin_line)
        if line_origin and line_destination:
            origin, destination = line_origin, line_destination
        else:
            origin_match = find_city_in_line(origin_line, origin_candidates)
            destination_match = find_city_in_line(origin_line, destination_candidates)
            if origin_match and destination_match:
                origin, _ = origin_match
                destination, _ = destination_match

    if origin and destination and destination.startswith(origin):
        maybe_origin, maybe_destination = split_origin_destination(destination)
        if maybe_origin and maybe_destination:
            origin, destination = maybe_origin, maybe_destination

    if origin and not destination:
        maybe_origin, maybe_destination = split_origin_destination(origin)
        if maybe_origin and maybe_destination:
            origin, destination = maybe_origin, maybe_destination

    if not origin and destination:
        maybe_origin, maybe_destination = split_origin_destination(destination)
        if maybe_origin and maybe_destination:
            origin, destination = maybe_origin, maybe_destination

    if destination and not origin:
        origin_candidate = find_city_candidate(destination, origin_candidates)
        if origin_candidate:
            origin = origin_candidate
            destination = destination.replace(origin_candidate, "").strip() or destination

    if destination:
        destination_candidate = find_city_candidate(destination, destination_candidates)
        if destination_candidate:
            destination = destination_candidate

    if origin and destination:
        origin_is_destination = (
            find_city_candidate(origin, destination_candidates) is not None
        )
        destination_is_origin = (
            find_city_candidate(destination, origin_candidates) is not None
        )
        if origin_is_destination and destination_is_origin:
            origin, destination = destination, origin

    rooms_count = None
    rooms_match = re.search(r"\b(\d+)\s*habitaciones\b", lower)
    if rooms_match:
        rooms_count = int(rooms_match.group(1))

    departure_date, return_date = parse_dates(raw_text)

    currency = None
    if "cop" in lower or "pesos (cop)" in lower:
        currency = "COP"

    return {
        "plan": plan,
        "flight_type": flight_type,
        "origin": clean_city(origin),
        "destination": clean_city(destination),
        "rooms_count": rooms_count,
        "departure_date": departure_date,
        "return_date": return_date,
        "currency": currency,
    }


def find_room_blocks(raw_text: str) -> List[Tuple[int, str]]:
    norm = normalize_text(raw_text)
    lower = norm["lower"]
    blocks = []
    matches = list(re.finditer(r"habitaci[oó]n\s+(\d+)", lower))
    for idx, match in enumerate(matches):
        room_num = int(match.group(1))
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(lower)
        blocks.append((room_num, raw_text[start:end]))
    return blocks


def choose_triplet(values: List[int], max_value: int) -> Optional[Tuple[int, int, int]]:
    if len(values) < 3:
        return None
    # Use the first valid triplet in order to keep OCR ordering intact.
    for i in range(len(values) - 2):
        a, b, c = values[i : i + 3]
        if all(0 <= v <= max_value for v in (a, b, c)):
            return a, b, c
    return None


def parse_rooms(
    raw_text: str,
    rooms_count: Optional[int],
    max_value: int,
    digit_map: Dict[int, int],
) -> Dict[str, object]:
    def map_number(value: int) -> int:
        if value in digit_map:
            return digit_map[value]
        if max_value <= 6 and value == 8:
            return 3
        if max_value <= 6 and value == 7:
            return 1
        return value

    rooms = []
    rooms_parsed = []
    blocks = find_room_blocks(raw_text)

    for room_num, block in blocks:
        noise_tokens = {"e", "ot", "pt", "o)", "y", "-", "--", ".", ","}
        tokens = re.findall(r"[A-Za-z0-9]+", block)
        raw_numbers: List[int] = []
        for token in tokens:
            lower = token.lower()
            if lower in noise_tokens:
                continue
            if lower == "o":
                raw_numbers.append(0)
                continue
            if "tp" in lower:
                raw_numbers.append(1)
                continue
            if lower.isdigit():
                raw_numbers.append(int(lower))

        if raw_numbers and raw_numbers[0] == room_num:
            raw_numbers = raw_numbers[1:]
        mapped_numbers = [map_number(number) for number in raw_numbers]
        mapped_numbers = [
            number for number in mapped_numbers if 0 <= number <= max_value
        ]
        rooms_parsed.append(
            {
                "room": room_num,
                "numbers_raw": raw_numbers,
                "numbers_mapped": mapped_numbers,
            }
        )
        triplet = choose_triplet(mapped_numbers, max_value)
        if triplet:
            adults, children, infants = triplet
        else:
            adults = children = infants = None
        rooms.append(
            {
                "room": room_num,
                "adults": adults,
                "children": children,
                "infants": infants,
            }
        )

    if rooms_count is not None:

        indexed = {room["room"]: room for room in rooms}
        rooms = []
        for room_num in range(1, rooms_count + 1):
            room = indexed.get(room_num)
            if room:
                rooms.append(room)
            else:
                rooms.append(
                    {
                        "room": room_num,
                        "adults": None,
                        "children": None,
                        "infants": None,
                    }
                )

    return {"rooms": rooms, "rooms_parsed": rooms_parsed, "rooms_method": "block_regex"}


def compute_totals(rooms: List[Dict[str, Optional[int]]]) -> Dict[str, int]:
    adults = sum(room["adults"] or 0 for room in rooms)
    children = sum(room["children"] or 0 for room in rooms)
    infants = sum(room["infants"] or 0 for room in rooms)
    return {
        "adults": adults,
        "children": children,
        "infants": infants,
        "passengers": adults + children + infants,
    }


def parse_onvacation_ocr(raw_text: str, config: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    fields = extract_general_fields(raw_text)
    config = config or {}
    max_value = int(config.get("max_value", 6))
    digit_map = {int(k): int(v) for k, v in config.get("digit_map", {}).items()}
    rooms_info = parse_rooms(raw_text, fields["rooms_count"], max_value, digit_map)
    totals = compute_totals(rooms_info["rooms"])

    return {
        "plan": fields["plan"],
        "flight_type": fields["flight_type"],
        "origin": fields["origin"],
        "destination": fields["destination"],
        "rooms_count": fields["rooms_count"],
        "rooms": rooms_info["rooms"],
        "departure_date": fields["departure_date"],
        "return_date": fields["return_date"],
        "currency": fields["currency"],
        "totals": totals,
        "debug": {
            "rooms_parsed": rooms_info["rooms_parsed"],
            "rooms_method": rooms_info["rooms_method"],
        },
    }


def _run_tests() -> None:
    raw_text = (
        "* Ciudad de origen * Ciudad de destino\n"
        "Bogota D.C. (Colombia) San Andres Islas (CO)\n"
        "* Cantidad de habitaciones\n"
        "7 Habitaciones\n"
        "Habitacion 1: Adultos Ninos Infantes\n"
        "2 0 0\n"
        "Habitacion 2: Adultos Ninos Infantes\n"
        "2 0 0\n"
        "Habitacion 3: Adultos Ninos Infantes\n"
        "0 0 0\n"
        "Habitacion 4: Adultos Ninos Infantes\n"
        "0 0 0\n"
        "Habitacion 5: Adultos Ninos Infantes\n"
        "0 0 0\n"
        "Habitacion 6: Adultos Ninos Infantes\n"
        "2 0 0\n"
        "Habitacion 7: Adultos Ninos Infantes\n"
        "1 0 0\n"
        "* Fecha salida * Fecha regreso\n"
        "20260111 20260115\n"
        "Moneda\n"
        "PESOS (COP)\n"
    )
    result = parse_onvacation_ocr(raw_text)
    assert result["rooms_count"] == 7
    assert result["departure_date"] == "2026-01-11"
    assert result["return_date"] == "2026-01-15"
    assert result["currency"] == "COP"
    room2 = result["rooms"][1]
    assert room2["adults"] == 2
    assert room2["children"] == 0
    assert room2["infants"] == 0
    room3 = result["rooms"][2]
    assert room3["adults"] == 0
    assert room3["children"] == 0
    assert room3["infants"] == 0


if __name__ == "__main__":
    _run_tests()
    sample = "Habitacion 1: Adultos Ninos Infantes\n2 0 1"
    result = parse_onvacation_ocr(sample)
    print(json.dumps(result, indent=2, ensure_ascii=False))

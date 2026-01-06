import argparse
import json
import sys

from parser import parse_onvacation_ocr


def read_text(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def prompt_value(label: str, current: str) -> str:
    print(f"{label} [{current}]: ", end="")
    value = input().strip()
    return value or current


def main() -> None:
    parser = argparse.ArgumentParser(
        description="OCR configurator for OnVacation parsing"
    )
    parser.add_argument(
        "input",
        help="Path to a text file with OCR output or '-' to read from stdin",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Allow manual overrides before printing JSON",
    )
    args = parser.parse_args()

    raw_text = read_text(args.input)
    result = parse_onvacation_ocr(raw_text)

    if args.interactive:
        print("\nManual overrides (press Enter to keep current value)\n")
        result["origin"] = prompt_value("Origin", result["origin"] or "")
        result["destination"] = prompt_value(
            "Destination", result["destination"] or ""
        )
        result["departure_date"] = prompt_value(
            "Departure date (YYYY-MM-DD)", result["departure_date"] or ""
        )
        result["return_date"] = prompt_value(
            "Return date (YYYY-MM-DD)", result["return_date"] or ""
        )

        print("\nRooms summary:")
        for room in result["rooms"]:
            label = f"Room {room['room']} (adults, children, infants)"
            current = f"{room['adults']},{room['children']},{room['infants']}"
            print(f"{label} [{current}]: ", end="")
            value = input().strip()
            if value:
                parts = [p.strip() for p in value.split(",")]
                if len(parts) == 3:
                    room["adults"] = int(parts[0]) if parts[0] else None
                    room["children"] = int(parts[1]) if parts[1] else None
                    room["infants"] = int(parts[2]) if parts[2] else None

        totals = {
            "adults": sum((r["adults"] or 0) for r in result["rooms"]),
            "children": sum((r["children"] or 0) for r in result["rooms"]),
            "infants": sum((r["infants"] or 0) for r in result["rooms"]),
        }
        totals["passengers"] = (
            totals["adults"] + totals["children"] + totals["infants"]
        )
        result["totals"] = totals

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

from flask import Flask, jsonify, render_template, request

from parser import parse_onvacation_ocr

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/parse_ocr")
def parse_ocr():
    payload = request.get_json(silent=True) or {}
    raw_text = payload.get("raw_text", "")
    config = payload.get("config") or {}
    if not raw_text:
        return jsonify({"error": "raw_text requerido"}), 400
    result = parse_onvacation_ocr(raw_text, config=config)
    return jsonify(result)




if __name__ == "__main__":
    app.run(debug=True)

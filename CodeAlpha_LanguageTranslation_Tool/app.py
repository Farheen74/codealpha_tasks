from flask import Flask, render_template, request, jsonify
from deep_translator import GoogleTranslator

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()
    source = (data.get("source") or "auto").strip()
    target = (data.get("target") or "hi").strip()

    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        translator = GoogleTranslator(source="auto" if source == "auto" else source, target=target)
        translated_text = translator.translate(text)
        return jsonify({
            "translated_text": translated_text,
            "provider": "deep-translator"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
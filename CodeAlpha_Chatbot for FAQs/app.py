import os

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from flask import Flask, request, jsonify, render_template
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Load AI model
model = SentenceTransformer('all-MiniLM-L6-v2')

# ================= FAQ DATA =================
faq_data = {

# ========================= PHONES =========================

# iPhone 13
"What is price of iPhone 13?": "₹65,000 approx.",
"iPhone 13 RAM?": "4GB RAM.",
"iPhone 13 storage?": "128GB / 256GB.",
"iPhone 13 battery?": "3240mAh.",
"iPhone 13 camera?": "12MP dual camera.",
"iPhone 13 gaming?": "Excellent gaming performance.",
"Why iPhone 13 is special?": "A15 Bionic chip, smooth iOS, long updates.",

# iPhone 15 Pro
"What is price of iPhone 15 Pro?": "₹1,30,000 approx.",
"iPhone 15 Pro RAM?": "8GB RAM.",
"iPhone 15 Pro storage?": "128GB–1TB.",
"iPhone 15 Pro camera?": "48MP triple camera.",
"iPhone 15 Pro battery?": "All-day battery.",
"iPhone 15 Pro gaming?": "Top-tier gaming performance.",
"Why iPhone 15 Pro is special?": "A17 Pro chip, titanium body.",

# Samsung S23 Ultra
"What is price of Samsung S23 Ultra?": "₹1,10,000 approx.",
"Samsung S23 RAM?": "8GB / 12GB.",
"Samsung S23 storage?": "256GB / 512GB.",
"Samsung S23 camera?": "200MP camera.",
"Samsung S23 battery?": "5000mAh.",
"Samsung S23 gaming?": "Excellent gaming.",
"Why Samsung S23 Ultra is special?": "Best display + camera.",

# OnePlus 11
"What is price of OnePlus 11?": "₹56,000 approx.",
"OnePlus 11 RAM?": "8GB / 16GB.",
"OnePlus 11 storage?": "128GB / 256GB.",
"OnePlus 11 battery?": "5000mAh.",
"OnePlus 11 camera?": "50MP.",
"OnePlus 11 gaming?": "Smooth gaming.",
"Why OnePlus 11 is special?": "Fast performance + fast charging.",

# Redmi Note 12
"What is price of Redmi Note 12?": "₹18,000 approx.",
"Redmi RAM?": "6GB / 8GB.",
"Redmi storage?": "128GB.",
"Redmi battery?": "5000mAh.",
"Redmi camera?": "50MP.",
"Redmi gaming?": "Decent gaming.",
"Why Redmi is popular?": "Best budget phone.",


# ========================= LAPTOPS =========================

# MacBook Air M2
"What is price of MacBook Air M2?": "₹1,10,000 approx.",
"MacBook Air RAM?": "8GB / 16GB.",
"MacBook Air storage?": "256GB / 512GB SSD.",
"MacBook Air battery?": "15–18 hours.",
"MacBook Air gaming?": "Not for heavy gaming.",
"Why MacBook Air is special?": "M2 chip, no heating, long battery.",

# Dell XPS 13
"What is price of Dell XPS 13?": "₹1,20,000 approx.",
"Dell XPS RAM?": "8GB / 16GB.",
"Dell XPS storage?": "512GB SSD.",
"Dell XPS battery?": "8–10 hours.",
"Dell XPS gaming?": "Light gaming.",
"Why Dell XPS is special?": "Premium design + display.",

# HP Pavilion
"What is price of HP Pavilion?": "₹60,000 approx.",
"HP Pavilion RAM?": "8GB.",
"HP Pavilion storage?": "512GB SSD.",
"HP Pavilion battery?": "6–8 hours.",
"HP Pavilion gaming?": "Basic gaming.",
"Why HP Pavilion is special?": "Best for students.",

# Lenovo ThinkPad
"What is price of ThinkPad?": "₹80,000 approx.",
"ThinkPad RAM?": "8GB / 16GB.",
"ThinkPad storage?": "512GB SSD.",
"ThinkPad battery?": "8–12 hours.",
"ThinkPad gaming?": "Not for gaming.",
"Why ThinkPad is special?": "Best keyboard + durable.",

# ASUS ROG
"What is price of ASUS ROG?": "₹1,50,000 approx.",
"ASUS ROG RAM?": "16GB.",
"ASUS ROG storage?": "1TB SSD.",
"ASUS ROG battery?": "4–6 hours.",
"ASUS ROG gaming?": "High-end gaming.",
"Why ASUS ROG is special?": "Powerful GPU + cooling.",


# ========================= GENERAL =========================

"Which phone is best for gaming?": "iPhone 15 Pro, Samsung S23, OnePlus 11.",
"Which phone is best for camera?": "iPhone and Samsung.",
"Which laptop is best for coding?": "MacBook Air, ThinkPad.",
"Which laptop is best for gaming?": "ASUS ROG.",
"Best budget phone?": "Redmi Note series.",
"Best student laptop?": "HP Pavilion.",

"Is EMI available?": "Yes EMI available.",
"Is delivery available?": "Delivery across India.",
"What is warranty?": "1 year warranty.",
"What is return policy?": "7-day return policy."
}

# ================= PREPARE MODEL =================
questions = list(faq_data.keys())
answers = list(faq_data.values())
question_embeddings = model.encode(questions)

# ================= RESPONSE FUNCTION =================
def get_response(user_input):
    user_input_lower = user_input.lower()

    # Detect category
    is_phone = any(word in user_input_lower for word in ["phone", "iphone", "samsung", "oneplus", "redmi"])
    is_laptop = any(word in user_input_lower for word in ["laptop", "macbook", "dell", "hp", "lenovo", "asus"])

    # ================= KEYWORD MAP =================
    phone_keywords = {
        "price": "Phones start from ₹18,000 up to ₹1,30,000.",
        "battery": "Phones usually have 5000mAh battery.",
        "camera": "Phones have 50MP–200MP cameras.",
        "gaming": "iPhone, Samsung, OnePlus are best for gaming.",
        "ram": "Phones come with 6GB–12GB RAM.",
        "storage": "Phones offer 128GB–512GB storage.",
        "5g": "Most phones support 5G."
    }

    laptop_keywords = {
        "price": "Laptops start from ₹60,000 up to ₹1,50,000.",
        "battery": "Laptop battery lasts 6–18 hours.",
        "gaming": "ASUS ROG is best for gaming.",
        "ram": "Laptops come with 8GB–16GB RAM.",
        "storage": "Laptops use fast SSD (256GB–1TB).",
        "ssd": "SSD improves laptop speed.",
        "coding": "MacBook and ThinkPad are best for coding."
    }

    general_keywords = {
        "buy": "You can buy online or via store.",
        "emi": "EMI available.",
        "delivery": "Delivery across India."
    }

    # ================= SHORT QUERY =================
    if len(user_input_lower.split()) <= 2:

        if is_phone:
            for key in phone_keywords:
                if key in user_input_lower:
                    return phone_keywords[key]

        if is_laptop:
            for key in laptop_keywords:
                if key in user_input_lower:
                    return laptop_keywords[key]

        for key in general_keywords:
            if key in user_input_lower:
                return general_keywords[key]

    # ================= SEMANTIC MATCH =================
    user_embedding = model.encode(user_input)
    similarities = util.cos_sim(user_embedding, question_embeddings)

    best_match_index = similarities.argmax()
    score = similarities[0][best_match_index]

    if score > 0.5:
        return answers[best_match_index]

    # ================= FALLBACK =================
    if is_phone:
        return "Ask about phone features like price, camera, battery, gaming."
    elif is_laptop:
        return "Ask about laptop features like RAM, SSD, gaming, battery."
    else:
        return "Please specify phone or laptop."

# ================= ROUTES =================
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    msg = request.json.get("message")
    return jsonify({"response": get_response(msg)})

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=False)
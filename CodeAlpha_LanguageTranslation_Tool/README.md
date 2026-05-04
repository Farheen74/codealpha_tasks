## Language Translation Tool

A translation web app that does not need any API keys.

## Run in VS Code

1. Open the project folder in VS Code.
2. Open terminal.
3. Create virtual environment:
   ```bash
   python -m venv venv
   ```
4. Activate it:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Run the app:
   ```bash
   python app.py
   ```
7. Open `http://127.0.0.1:5000` in your browser.

## Folder structure
```bash
project/
├── app.py
├── README.md
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```
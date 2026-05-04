const languages = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' }
];

const el = {
  sourceLang: document.getElementById('sourceLang'),
  targetLang: document.getElementById('targetLang'),
  sourceText: document.getElementById('sourceText'),
  translatedText: document.getElementById('translatedText'),
  translateBtn: document.getElementById('translateBtn'),
  swapBtn: document.getElementById('swapBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  charCount: document.getElementById('charCount'),
  wordCount: document.getElementById('wordCount'),
  statusBox: document.getElementById('statusBox'),
  resultInfo: document.getElementById('resultInfo'),
  providerName: document.getElementById('providerName'),
  themeToggle: document.getElementById('themeToggle')
};

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  el.themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
}

setTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

el.themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

function populateLanguages() {
  el.sourceLang.innerHTML = languages.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
  el.targetLang.innerHTML = languages.filter(l => l.code !== 'auto').map(l => `<option value="${l.code}">${l.name}</option>`).join('');
  el.sourceLang.value = 'en';
  el.targetLang.value = 'hi';
}

function updateCounts() {
  const text = el.sourceText.value.trim();
  el.charCount.textContent = el.sourceText.value.length;
  el.wordCount.textContent = text ? text.split(/\s+/).length : 0;
}

function setStatus(msg) { el.statusBox.textContent = msg; }
function setResult(msg) { el.resultInfo.textContent = msg; }

async function translateText() {
  const text = el.sourceText.value.trim();
  const source = el.sourceLang.value;
  const target = el.targetLang.value;

  if (!text) return setStatus('Please enter text.');
  if (source === target) return setStatus('Source and target languages should be different.');

  setStatus('Translating...');
  const res = await fetch('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source, target })
  });
  const data = await res.json();

  if (!res.ok) {
    setStatus(data.error || 'Translation failed.');
    return;
  }

  el.translatedText.value = data.translated_text;
  el.providerName.textContent = data.provider || 'deep-translator';
  setStatus('Translation completed successfully.');
  setResult(`Done. ${data.translated_text.length} characters translated.`);
}

function swapLanguages() {
  if (el.sourceLang.value === 'auto') return setStatus('Choose a fixed source language before swapping.');
  [el.sourceLang.value, el.targetLang.value] = [el.targetLang.value, el.sourceLang.value];
  [el.sourceText.value, el.translatedText.value] = [el.translatedText.value || el.sourceText.value, el.sourceText.value && el.translatedText.value ? el.sourceText.value : el.translatedText.value];
  updateCounts();
  setStatus('Languages swapped.');
}

async function copyTranslatedText() {
  if (!el.translatedText.value.trim()) return setResult('Nothing to copy yet.');
  await navigator.clipboard.writeText(el.translatedText.value);
  setResult('Copied to clipboard.');
}

function downloadTextFile() {
  const text = el.translatedText.value.trim();
  if (!text) return setResult('Nothing to download yet.');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = 'translated-text.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  setResult('Downloaded.');
}

populateLanguages();
updateCounts();

el.sourceText.addEventListener('input', updateCounts);
el.translateBtn.addEventListener('click', translateText);
el.swapBtn.addEventListener('click', swapLanguages);
el.copyBtn.addEventListener('click', copyTranslatedText);
el.downloadBtn.addEventListener('click', downloadTextFile);

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    translateText();
  }
});
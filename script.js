// grab elements
const pdfInput   = document.getElementById('pdfInput');
const textarea   = document.getElementById('scriptInput');
const loadBtn    = document.getElementById('loadScript');
const displayDiv = document.getElementById('lineDisplay');
const prevBtn    = document.getElementById('prevLine');
const nextBtn    = document.getElementById('nextLine');

let lines = [];
let currentIndex = 0;

// restore last position if any
const savedIndex = localStorage.getItem('lineReaderIndex');
if (savedIndex !== null) {
  currentIndex = parseInt(savedIndex, 10);
}

// speak with Web Speech API
function speak(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// display the current line
function showLine() {
  if (lines.length === 0) {
    displayDiv.innerHTML = 'No script loaded.';
    prevBtn.disabled = nextBtn.disabled = true;
    return;
  }

  // parse speaker label
  const raw = lines[currentIndex];
  const [maybeSpeaker, ...rest] = raw.split(':');
  let html;
  if (rest.length > 0) {
    html = `<span class="speaker">${maybeSpeaker}:</span> ${rest.join(':').trim()}`;
  } else {
    html = raw;
  }
  displayDiv.innerHTML = `(${currentIndex + 1}/${lines.length}) ` + html;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === lines.length - 1;

  // persist position
  localStorage.setItem('lineReaderIndex', currentIndex);
  speak(raw);
}

// load from textarea
function loadFromTextarea() {
  lines = textarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  currentIndex = 0;
  showLine();
}

// load from PDF file
async function loadFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  // iterate all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // PDF.js returns an array of "items" with string chunks
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  // split into lines by common script formats (one per line)
  lines = fullText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  currentIndex = 0;
  showLine();
}

// button: Load Script
loadBtn.addEventListener('click', () => {
  // if a PDF file is selected, use that
  if (pdfInput.files.length > 0) {
    loadFromPDF(pdfInput.files[0]);
  } else {
    loadFromTextarea();
  }
});

// navigation
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showLine();
  }
});
nextBtn.addEventListener('click', () => {
  if (currentIndex < lines.length - 1) {
    currentIndex++;
    showLine();
  }
});

// keyboard arrows
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
});
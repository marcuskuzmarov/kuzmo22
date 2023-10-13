// defines note frequencies
let noteFrequencies = {
    'C4': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.1638,
    'B': 493.88,
    'C5': 523.25,
    'C#5': 554.36,
    'D5': 587.32
};

let midiNotes = {
    60: 'C4',
    61: 'C#',
    62: 'D',
    63: 'D#',
    64: 'E',
    65: 'F',
    66: 'F#',
    67: 'G',
    68: 'G#',
    69: 'A',
    70: 'A#',
    71: 'B',
    72: 'C5',
    73: 'C#5',
    74: 'D5'
}

let keyNotes = {
    60: 'C4',
    61: 'C#',
    62: 'D',
    63: 'D#',
    64: 'E',
    65: 'F',
    66: 'F#',
    67: 'G',
    68: 'G#',
    69: 'A',
    70: 'A#',
    71: 'B',
    72: 'C5',
    73: 'C#5',
    74: 'D5'
}

const activeNotes = new Map();

// Create an audio context
let AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();
//const startMsg = document.getElementById('start-msg');
const keys = document.querySelectorAll('.key');
const masterVol = context.createGain();
masterVol.connect(context.destination);

const canvas = document.getElementById('adsr-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
const canvasWidth = canvas.width;
canvas.height = 200;
const canvasHeight = canvas.height;

const masterKnob = document.getElementById('master');
masterVol.gain.value = masterKnob.value;
const attackKnob = document.getElementById('attack');
const peakKnob = document.getElementById('peak');
const decayKnob = document.getElementById('decay');
const sustainKnob = document.getElementById('sustain');
const releaseKnob = document.getElementById('release');
const waveforms = document.getElementsByName('waveform');
let waveform = 'sine';

let currentAttack = parseFloat(attackKnob.value);
let currentPeak = parseFloat(peakKnob.value);
let currentDecay = parseFloat(decayKnob.value);
let currentSustain = parseFloat(sustainKnob.value);
let currentRelease = parseFloat(releaseKnob.value);
let decayEnd = currentAttack + currentDecay;
let sustainEnd = decayEnd + 0.1;
let releaseEnd = sustainEnd + currentRelease;

function drawADSR() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    decayEnd = currentAttack + currentDecay;
    sustainEnd = decayEnd + 0.1;
    releaseEnd = sustainEnd + currentRelease;
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    ctx.lineTo(currentAttack * canvasWidth, canvasHeight * (1 - currentPeak));
    ctx.lineTo(decayEnd * (canvasWidth), canvasHeight * (1 - currentSustain));
    ctx.lineTo(sustainEnd * canvasWidth, canvasHeight * (1 - currentSustain));
    ctx.lineTo(releaseEnd * canvasWidth, canvasHeight);

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
}

drawADSR();

attackKnob.addEventListener('input', () => {
    currentAttack = parseFloat(attackKnob.value);
    drawADSR();
})
peakKnob.addEventListener('input', () => {
    currentPeak = parseFloat(peakKnob.value);
    drawADSR();
})
decayKnob.addEventListener('input', () => {
    currentDecay = parseFloat(decayKnob.value);
    drawADSR();
})
sustainKnob.addEventListener('input', () => {
    currentSustain = parseFloat(sustainKnob.value);
    drawADSR();
})
releaseKnob.addEventListener('input', () => {
    currentRelease = parseFloat(releaseKnob.value);
    drawADSR();
})

function playNote(note) {
    //console.log(activeNotes)
    if(!activeNotes.has(note)) {
        const oscillator = context.createOscillator();
        oscillator.type = waveform; // You can change this to 'sine', 'square', 'sawtooth', or 'triangle'
        oscillator.frequency.setValueAtTime(noteFrequencies[note], context.currentTime);

        console.log(`M: ${masterVol}, A: ${currentAttack}, P: ${currentPeak}, D: ${currentDecay}, S: ${currentSustain}, R: ${currentRelease}`);

        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0, 0);
        envelope.gain.linearRampToValueAtTime(currentPeak, context.currentTime + currentAttack);
        envelope.gain.exponentialRampToValueAtTime(currentSustain, context.currentTime + currentAttack + currentDecay);
        // envelope.gain.linearRampToValueAtTime(currentSustain, context.currentTime + currentAttack + currentDecay + 1);
        // envelope.gain.linearRampToValueAtTime(0, context.currentTime + currentAttack + currentDecay + 1 + currentRelease);

        // envelope.gain.linearRampToValueAtTime(currentPeak, context.currentTime + currentAttack);
        // envelope.gain.setValueAtTime(currentPeak, context.currentTime);
        // envelope.gain.linearRampToValueAtTime(currentSustain, context.currentTime + currentAttack + currentDecay);
        // envelope.gain.setValueAtTime(currentSustain, context.currentTime);
        // envelope.gain.linearRampToValueAtTime(0, context.currentTime + currentAttack + currentDecay + currentRelease);

        oscillator.start(0);
        activeNotes.set(note, oscillator)
        activeKey(note, true)
        //oscillator.stop(context.currentTime + currentAttack + currentDecay + 1 + currentRelease);
        oscillator.connect(envelope);
        envelope.connect(masterVol);
    }
}

function releaseNote(note) {
    //console.log(activeNotes)
    if(activeNotes.has(midiNotes[note])) {

        const oscillator = activeNotes.get(midiNotes[note]);
        
        oscillator.stop();
        activeNotes.delete(midiNotes[note])
        activeKey(midiNotes[note], false)
    }
}

function activeKey(note, isActive) {
    //console.log(note)
    const key = document.querySelector(`[data-note="${note}"]`);
    //console.log(key)
    if (key) {
        if (isActive) {
            key.classList.add('active-key');
        } else {
            key.classList.remove('active-key');
        }
    }
}



waveforms.forEach(waveformSel => {
    waveformSel.addEventListener('change', () => {
        if(waveformSel.checked) {
            waveform = waveformSel.value;
        }
    })
})

masterKnob.addEventListener('input', () => {
    masterVol.gain.value = masterKnob.value;
})

keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        playNote(key.getAttribute('data-note'));
        key.classList.add('active-key');
    })
    key.addEventListener('mouseup', () => {
        key.classList.remove('active-key');
    })
});

document.addEventListener('keydown', event => {
    switch(event.key.toLowerCase()) {
        case 'a':
            playNote('C4');
            break;
        case 'w':
            playNote('C#');
            break;
        case 's':
            playNote('D');
            break;
        case 'e':
            playNote('D#');
            break;
        case 'd':
            playNote('E');
            break;
        case 'f':
            playNote('F');
            break;
        case 't':
            playNote('F#')
        case 'g':
            playNote('G');
            break;
        case 'y':
            playNote('G#');
            break;
        case 'h':
            playNote('A');
            break;
        case 'u':
            playNote('A#');
            break;
        case 'j':
            playNote('B');
            break;
        case 'k':
            playNote('C5');
            break;
        case 'o':
            playNote('C#5');
            break;
        case 'l':
            playNote('D5');
            break;
        case 'x':
            for(note in noteFrequencies) {
                noteFrequencies[note] = noteFrequencies[note] * 2;
            }
            break;
        case 'z':
            for(note in noteFrequencies) {
                noteFrequencies[note] = noteFrequencies[note] / 2;
            }
            break;
    }
});

document.addEventListener('keyup', event => {
    event.key.releaseNote
})

// Check for Web MIDI API support
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(onMIDISuccess)
        .catch(onMIDIFailure);
}

function onMIDISuccess(midiAccess) {
    // Get a list of available MIDI inputs
    const inputs = midiAccess.inputs.values();

    for (let input of inputs) {
        input.onmidimessage = onMIDIMessage;
    }
}

function onMIDIFailure(error) {
    console.error("MIDI access denied: " + error);
}

function onMIDIMessage(event) {
    // Handle incoming MIDI messages
    const [command, note, velocity] = event.data;

    if (command === 144) { // Note on
        // Trigger the note in your synthesizer
        playNote(midiNotes[note]);
        //console.log(midiNotes[note])
    } else if (command === 128) { // Note off
        // Release the note in your synthesizer
        //console.log(note)
        releaseNote(note);
    }
}

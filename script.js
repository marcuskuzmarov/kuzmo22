let noteFrequencies = {
    'C3': 130.82,
    'C#3': 138.59,
    'D3': 146.83,
    'D#3': 155.57,
    'E3': 164.82,
    'F3': 174.62,
    'F#3': 184.00,
    'G3': 196.00,
    'G#3': 207.65,
    'A3': 220.00,
    'A#3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'C#5': 554.36,
    'D5': 587.32,
    'D#5': 622.26,
    'E5': 659.26,
    'F5': 698.46,
    'F#5': 739.98,
    'G5': 784.00,
    'G#5': 830.60,
    'A5': 880.00,
    'A#5': 932.32,
    'B5': 987.76,
    'C6': 1046.5,
};

let midiNotes = {
    48: 'C3',
    49: 'C#3',
    50: 'D3',
    51: 'D#3',
    52: 'E3',
    53: 'F3',
    54: 'F#3',
    55: 'G3',
    56: 'G#3',
    57: 'A3',
    58: 'A#3',
    59: 'B3',
    60: 'C4',
    61: 'C#4',
    62: 'D4',
    63: 'D#4',
    64: 'E4',
    65: 'F4',
    66: 'F#4',
    67: 'G4',
    68: 'G#4',
    69: 'A4',
    70: 'A#4',
    71: 'B4',
    72: 'C5',
    73: 'C#5',
    74: 'D5',
    75: 'D#5',
    76: 'E5',
    77: 'F5',
    78: 'F#5',
    79: 'G5',
    80: 'G#5',
    81: 'A5',
    82: 'A#5',
    83: 'B5',
    84: 'C6',
}

let letterNotes = {
    'a': 'C4',
    'w': 'C#4',
    's': 'D4',
    'e': 'D#4',
    'd': 'E4',
    'f': 'F4',
    't': 'F#4',
    'g': 'G4',
    'y': 'G#4',
    'h': 'A4',
    'u': 'A#4',
    'j': 'B4',
    'k': 'C5',
    'o': 'C#5',
    'l': 'D5',
}

const activeNotes = new Map();

const context = new (window.AudioContext || window.wedkitAudioContext)();

const masterVol = context.createGain();
masterVol.connect(context.destination);

const canvas = document.getElementById('adsr-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 200;

const keys = document.querySelectorAll('.key');
const masterKnob = document.getElementById('master');
masterVol.gain.value = masterKnob.value;
const attackKnob = document.getElementById('attack');
const peakKnob = document.getElementById('peak');
const decayKnob = document.getElementById('decay');
const sustainKnob = document.getElementById('sustain');
const releaseKnob = document.getElementById('release');
const waveforms = document.getElementsByName('waveform');
const values = document.getElementById('value-nums');
let waveform = 'sine';
let currentAttack = parseFloat(attackKnob.value);
let currentPeak = parseFloat(peakKnob.value);
let currentDecay = parseFloat(decayKnob.value);
let currentSustain = parseFloat(sustainKnob.value);
let currentRelease = parseFloat(releaseKnob.value);
const ADSR = {currentAttack: parseFloat(attackKnob.value), currentDecay: parseFloat(decayKnob.value), currentSustain: parseFloat(sustainKnob.value), currentRelease: parseFloat(releaseKnob.value)}
let sustainStart = context.currentTime;
let sustainEnd = context.currentTime;
let filterFreq = document.getElementById('freq');
let filterQ = document.getElementById('q');
let currentFreq = parseFloat(filterFreq.value);
let currentQ = parseFloat(filterQ.value);
let delayTime = document.getElementById('delay-time');
let delayFeedback = document.getElementById('feedback');
let currentDelay = parseFloat(delayTime.value);
let currentFeedback = parseFloat(delayFeedback.value);

let waveVisual = document.getElementById('wave-canvas');
waveVisualContext = waveVisual.getContext('2d');
waveVisual.height = 300;
waveVisual.width = window.innerWidth;
const analyser = context.createAnalyser();
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);


function playNote(note) {
    if(!activeNotes.has(note)) {
        const oscillator = context.createOscillator();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(noteFrequencies[note], context.currentTime);
        values.textContent = `M: ${masterVol.gain.value}, A: ${currentAttack}, P: ${currentPeak}, D: ${currentDecay}, S: ${currentSustain}, R: ${currentRelease}`;

        const envelope = context.createGain();
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = currentFreq;
        filter.Q.value = currentQ;
        const delayNode = context.createDelay();
        delayNode.delayTime.value = currentDelay;
        const delayGain = context.createGain();
        delayGain.gain.value = currentFeedback;
        //console.log(context.currentTime)
        oscillator.start(0);
        envelope.gain.setValueAtTime(0, context.currentTime);
        //console.log(context.currentTime)

        envelope.gain.linearRampToValueAtTime(currentPeak, context.currentTime + currentAttack);
        //console.log(context.currentTime)
        envelope.gain.setTargetAtTime(currentSustain, context.currentTime + currentAttack, currentDecay);
        //envelope.gain.exponentialRampToValueAtTime(currentSustain, context.currentTime + currentAttack + currentDecay);
        //console.log(context.currentTime)

        sustainStart = context.currentTime;

        //console.log(context.currentTime)

        activeNotes.set(note, [oscillator, envelope]);
        activeKey(note);
        oscillator.connect(envelope);
        envelope.connect(filter);

        filter.connect(masterVol);
        delayNode.connect(masterVol);
        filter.connect(delayNode);
        delayNode.connect(delayGain);
        delayGain.connect(delayNode);

        //drawWave();
    }

}

function releaseNote(note) {
    const oscillator = activeNotes.get(note)[0];
    const envelope = activeNotes.get(note)[1];
    envelope.gain.cancelScheduledValues(0)
    let sustainEnd = context.currentTime - sustainStart;
    envelope.gain.setValueAtTime(envelope.gain.value, context.currentTime)

    //console.log(context.currentTime)
    //console.log(envelope.gain.value)

    envelope.gain.exponentialRampToValueAtTime(0.0000001, context.currentTime + currentRelease);
    //console.log(context.currentTime)
    //console.log(sustainEnd)
    console.log(sustainEnd + currentAttack + currentDecay + currentRelease)
    //oscillator.stop(sustainEnd + currentAttack + currentDecay + currentRelease)
    //console.log(context.currentTime)
    activeNotes.delete(note)
    activeKey(note);
}

function drawADSR() {

}

function drawWave() {
    drawVisual = requestAnimationFrame(waveVisual);

}

function activeKey(note) {
    const key = document.querySelector(`[data-note="${note}"]`);
    if(activeNotes.has(note)) {
        key.classList.add('active-key');
    } else {
        key.classList.remove('active-key');
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
filterFreq.addEventListener('input', () => {
    currentFreq = parseFloat(filterFreq.value);
    drawADSR();
});
filterQ.addEventListener('input', () => {
    currentQ = parseFloat(filterQ.value);
    drawADSR();
});
delayTime.addEventListener('input', () => {
    currentDelay = parseFloat(delayTime.value);
})
delayFeedback.addEventListener('input', () => {
    currentFeedback = parseFloat(delayFeedback.value);
})

keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        playNote(key.getAttribute('data-note'));
    })
    key.addEventListener('mouseup', () => {
        releaseNote(key.getAttribute('data-note'));
    })
    key.addEventListener('touchstart', () => {
        playNote(key.getAttribute('data-note'));
    })
    key.addEventListener('touchend', () => {
        releaseNote(key.getAttribute('data-note'));
    })
});

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
        releaseNote(midiNotes[note]);
    }
}

document.addEventListener('keydown', event => {
    let key = event.key.toLowerCase();
    if(key in letterNotes) {
        playNote(letterNotes[key]);
    } else if(key == 'x') {
        for(note in noteFrequencies) {
            noteFrequencies[note] = noteFrequencies[note] * 2;
        }
    } else if(key == 'z') {
        for(note in noteFrequencies) {
            noteFrequencies[note] = noteFrequencies[note] / 2;
        }
    }
});

document.addEventListener('keyup', event => {
    let key = event.key.toLowerCase();
    if(key in letterNotes) {
        releaseNote(letterNotes[key]);
    }
});
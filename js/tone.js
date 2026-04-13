const A1 = 55;
const note_names = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
];

onload = () => {
  for (let octave = 1; octave <= 4; octave++) {
    for (let note of note_names) {
      const id = note + octave;
      document.getElementById("selection").innerHTML +=
        `<input type="checkbox" id="${id}" value="${id}" /><label for="${id}">${id}</label> `;
    }
    document.getElementById("selection").innerHTML += "<br>";
  }
};

function note_to_frequency(note) {
  var parsed = 0;
  switch (note[0]) {
    case "A":
      parsed = 0;
      break;
    case "B":
      parsed = 2;
      break;
    case "C":
      parsed = 3;
      break;
    case "D":
      parsed = 5;
      break;
    case "E":
      parsed = 7;
      break;
    case "F":
      parsed = 8;
      break;
    case "G":
      parsed = 10;
      break;
  }
  if (note[1] == "#") {
    parsed += 1;
    parsed += (note[2] - 1) * 12;
  } else if (note[1] == "b") {
    parsed -= 1;
    parsed += (note[2] - 1) * 12;
  } else {
    parsed += (note[1] - 1) * 12;
  }
  return 55 * Math.pow(2, parsed / 12);
}

async function play() {
  let notes = document.getElementById("note").value;
  notes = notes.split(" ");
  for (const note of notes) {
    const frequency = note_to_frequency(note);
    play_tone(frequency);
  }
}

async function play_select() {
  for (let octave = 1; octave <= 4; octave++) {
    for (let note of note_names) {
      const id = note + octave;
      if (document.getElementById(id).checked) {
        const frequency = note_to_frequency(id);
        play_tone(frequency);
      }
    }
  }
}

async function play_tone(frequency = 440) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const waveform = document.getElementById("waveform").value;
  const detuneValue = parseFloat(document.getElementById("detune").value);
  var detunedOsc = [];

  if (detuneValue > 0) {
    const detuneOsc = context.createOscillator();
    detuneOsc.type = waveform;
    detuneOsc.frequency.value = frequency;
    detuneOsc.detune.value = detuneValue;
    detuneOsc.connect(context.destination);
    detuneOsc.start();
    detunedOsc.push(detuneOsc);
  }

  oscillator.type = waveform;
  oscillator.frequency.value = frequency;
  oscillator.connect(context.destination);
  await context.resume();
  oscillator.start();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (detunedOsc.length > 0) {
    for (const osc of detunedOsc) {
      osc.stop();
    }
  }
  oscillator.stop();
  context.close();
}

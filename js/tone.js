const A1 = 55;

const flatToSharp = {
  Bb: "A#",
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Cb: "B",
  Fb: "E",
};

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

var wrap = true;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

document.getElementById("wrap").addEventListener("change", (event) => {
  wrap = event.target.checked;
});

window.addEventListener("DOMContentLoaded", () => {
  for (let octave = 1; octave <= 4; octave++) {
    for (let note of note_names) {
      const id = note + octave;
      document.getElementById("selection").innerHTML +=
        `<input type="checkbox" id="${id}" value="${id}" /><label for="${id}">${id}</label> `;
    }
    document.getElementById("selection").innerHTML += "<br>";
  }
  const sequencer = document.querySelector(".chord-sequencer");
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const chordbox = document.createElement("input");
      chordbox.type = "text";
      chordbox.classList.add("chordbox");
      chordbox.id = `cell-${i}-${j}`;
      cell.appendChild(chordbox);
      sequencer.appendChild(cell);
    }
  }
  const melody_sequencer = document.querySelector(".melody-sequencer");
  const melodyRowCount = 24;
  const melodyColumnCount = 32;

  if (melody_sequencer) {
    melody_sequencer.style.setProperty(
      "--melody-column-count",
      melodyColumnCount.toString(),
    );
  }

  for (let i = 0; i < melodyRowCount; i++) {
    const absoluteIndex = melodyRowCount - 1 - i;
    const noteString = note_names[absoluteIndex%12];
    const octave = 4 + Math.floor(absoluteIndex / 12);
    const labelCell = document.createElement("div");
    labelCell.classList.add("cell", "melody-label");
    labelCell.textContent = noteString + octave;
    melody_sequencer.appendChild(labelCell);

    for (let j = 0; j < melodyColumnCount; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell", "melody-cell");

      if (!noteString.includes("#") && !noteString.includes("b")) {
        cell.classList.add("natural-row");
      }
      if (j % 4 === 3) cell.classList.add("melody-divider");
      const melodybox = document.createElement("input");
      melodybox.type = "radio";
      melodybox.name = `melody-col-${j}`; // ts beat
      melodybox.classList.add("melodybox");
      melodybox.id = `melody-cell-${i}-${j}`;
      melodybox.value = `${i}`; // ts note
      cell.appendChild(melodybox);
      melody_sequencer.appendChild(cell);
      melodybox.addEventListener("click", () => {
        if (melodybox.wasChecked) {
          melodybox.checked = false
          melodybox.wasChecked = false;
        }
          else {
            melodybox.checked = true;
          melodybox.wasChecked = true;
        }
      });
    }
  }
});

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
  return A1 * Math.pow(2, parsed / 12);
}

function parse_chord_name(chord) {
  if (!chord) return [];
  chord = chord.trim();
  var root = chord[0].toUpperCase();
  var offset = 1;
  if (chord[1] == "#" || chord[1] == "b") {
    root += chord[1];
    offset = 2;
  }
  var modifier = chord.slice(offset);

  var intervals = [0, 4, 7];
  if (modifier.startsWith("m9")) intervals = [0, 3, 7, 10, 14];
  else if (modifier.startsWith("maj7")) intervals = [0, 4, 7, 11];
  else if (modifier.startsWith("maj9")) intervals = [0, 4, 7, 11, 14];
  else if (modifier.startsWith("m7")) intervals = [0, 3, 7, 10];
  else if (modifier.startsWith("m")) intervals = [0, 3, 7];
  else if (modifier.startsWith("dim7")) intervals = [0, 3, 6, 9];
  else if (modifier.startsWith("dim")) intervals = [0, 3, 6];
  else if (modifier.startsWith("9")) intervals = [0, 4, 7, 10, 14];
  else if (modifier.startsWith("7")) intervals = [0, 4, 7, 10];
  else if (modifier.startsWith("6")) intervals = [0, 4, 9];
  else if (modifier.startsWith("5")) intervals = [0, 7];
  else if (modifier.startsWith("sus4")) intervals = [0, 5, 7];
  else if (modifier.startsWith("sus2")) intervals = [0, 2, 7];
  if (root[1] == "b") {
    var root = flatToSharp[root];
  }
  var root_index = note_names.indexOf(root);
  var notes = [];
  for (var i = 0; i < intervals.length; i++) {
    var semitoneindex = root_index + intervals[i];
    var wrappedindex = semitoneindex % 12;
    if (!wrap) {
      var oct = 3 + Math.floor(semitoneindex / 12);
    } else {
      var oct = 3;
    }
    notes.push(note_names[wrappedindex] + oct);
  }

  if (chord.includes("/")) {
    var parts = chord.split("/");
    var bass = parts[1].trim();
    var bassNote = bass;
    if (bass.length == 1) bassNote = bass + "3";
    notes[0] = bassNote;
  }
  console.log(notes);
  return notes;
}

async function play() {
  let notes = document.getElementById("note").value;
  notes = notes.split(" ");
  for (const note of notes) {
    const frequency = note_to_frequency(note);
    play_tone(frequency);
  }
}

async function play_chord(to_play = null) {
  let chord;
  if (typeof to_play === "string" && to_play.length > 0) chord = to_play;
  else chord = document.getElementById("chord").value;
  const parsed = parse_chord_name(chord);
  if (!parsed || parsed.length === 0) return;
  const promises = parsed.map((note) => {
    const frequency = note_to_frequency(note);
    return play_tone(frequency);
  });
  await Promise.all(promises);
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

async function play_sequence() {
  const sequence = [];
  const seqEl = document.getElementById("chord-sequencer");
  const chordBoxes = seqEl ? seqEl.querySelectorAll(".chordbox") : [];
  console.log("play_sequence: found", chordBoxes.length, "boxes");
  chordBoxes.forEach((el, i) =>
    console.log("box", i, el.tagName, "value=", el.value),
  );
  for (const input of chordBoxes) sequence.push(input.value);
  for (const chord of sequence) {
    console.log("sequence chord ->", chord);
    if (chord && chord.trim().length > 0) await play_chord(chord.trim());
    else await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function play_melody() {
  const melody_sequencer = document.querySelector(".melody-sequencer");
  if (!melody_sequencer) return;
  const melodyRowCount = 12;
  const melodyColumnCount =
    parseInt(
      melody_sequencer.style.getPropertyValue("--melody-column-count"),
      10,
    ) || 8;

  const beatDuration = 250;

  for (let j = 0; j < melodyColumnCount; j++) {
    const checkedBox = melody_sequencer.querySelector(
      `input[name="melody-col-${j}"]:checked`,
    );

    if (checkedBox) {
      // checkedBox.style.backgroundColor = "#f7f7f7";
      const absoluteIndex = parseInt(melodyRowCount - 1 - checkedBox.value, 10);
      const noteString = note_names[absoluteIndex%12];
      const octave = 4 + Math.floor(absoluteIndex / 12);
      const noteToPlay = noteString + octave;

      await play_tone(note_to_frequency(noteToPlay), beatDuration);
    } else {
      await new Promise((resolve) => setTimeout(resolve, beatDuration));
    }
  }
}

async function play_all() {
  play_melody();
  play_sequence();
}

async function play_tone(frequency = 440, duration = 1000) {
  var rawVolume = parseFloat(document.getElementById("volume").value);
  const context = audioCtx;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  function dbToGain(db) {
    if (db === -Infinity) return 0;
    if (db <= -120) return 0;
    return Math.pow(10, db / 20);
  }
  function sliderRawToDb(raw, el) {
    const min = parseFloat(el.min) || -120;
    const max = parseFloat(el.max) || 0;
    let t = (raw - min) / (max - min);
    t = Math.max(0, Math.min(1, t));
    const alpha = 0.1;
    const shaped = Math.pow(t, alpha);
    return min + (max - min) * shaped;
  }
  const now = context.currentTime;
  const volumeDb = sliderRawToDb(rawVolume, document.getElementById("volume"));
  gain.gain.setValueAtTime(dbToGain(volumeDb), now);
  const volume_slider = document.getElementById("volume");
  function onVolInput() {
    const v = parseFloat(volume_slider.value);
    const db = sliderRawToDb(v, volume_slider);
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(dbToGain(db), context.currentTime, 0.02);
  }
  volume_slider.addEventListener("input", onVolInput);
  oscillator.connect(gain);
  gain.connect(context.destination);
  const waveform = document.getElementById("waveform").value;
  const detuneValue = parseFloat(document.getElementById("detune").value);
  var detunedOsc = [];

  if (detuneValue > 0) {
    for (let i = 0; i < document.getElementById("voices").value; i++) {
      const detuneOsc = context.createOscillator();
      detuneOsc.type = waveform;
      detuneOsc.frequency.value = frequency;
      detuneOsc.detune.value = detuneValue;
      detuneOsc.connect(gain);
      detuneOsc.start();
      detunedOsc.push(detuneOsc);
    }
  }

  oscillator.type = waveform;
  oscillator.frequency.value = frequency;
  await context.resume();
  oscillator.start();
  await new Promise((resolve) => setTimeout(resolve, duration));
  if (detunedOsc.length > 0) {
    for (const osc of detunedOsc) {
      osc.stop();
      try {
        osc.disconnect();
      } catch (e) {}
    }
  }
  oscillator.stop();
  try {
    oscillator.disconnect();
  } catch (e) {}
  try {
    gain.disconnect();
  } catch (e) {}
  volume_slider.removeEventListener("input", onVolInput);
}

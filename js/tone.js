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

var bpm = 240;

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
const base_controls = `<div class="control">
<input type="range" id="detune" min="0" max="50" value="0" />
<label for="detune">Detune</label>
<input type="range" id="voices" min="1" max="8" value="1" />
<label for="voices">Voices</label>
<div class="control">
<select id="type">
<option value="sine">Sine</option>
<option value="sawtooth">Sawtooth</option>
<option value="square">Square</option>
<option value="triangle">Triangle</option>
</select>
</div>`;

var tracks = {
  "lead1": {
    "id": "lead1",
    "name": "Lead Synth",
    "settings": {
      "detune": 15,
      "voices": 1,
      "volume": -40,
      "type": "sawtooth",
    },
    "notes": []
  },
  "bass": {
    "id": "bass",
    "name": "Bass Synth",
    "settings": {
      "detune": 15,
      "voices": 1,
      "volume": -40,
      "type": "sawtooth",
    },
    "notes": []
  },
  "pad": {
    "id": "pad",
    "name": "Pad Synth",
    "settings": {
      "detune": 15,
      "voices": 1,
      "volume": -40,
      "type": "sawtooth",
    },
    "notes": []
  }
}

var melodyColumnCount = 64;
const melodyRowCount = 49;

let currentInstrument = "lead1";

var wrap = true;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

document.getElementById("wrap").addEventListener("change", (event) => {
  wrap = event.target.checked;
});

window.addEventListener("DOMContentLoaded", () => {
  // for (let octave = 1; octave <= 4; octave++) {
  //   for (let note of note_names) {
  //     const id = note + octave;
  //     document.getElementById("selection").innerHTML +=
  //       `<input type="checkbox" id="${id}" value="${id}" /><label for="${id}">${id}</label> `;
  //   }
  //   document.getElementById("selection").innerHTML += "<br>";
  // }
  // const sequencer = document.querySelector(".chord-sequencer");
  // for (let i = 0; i < 4; i++) {
  //   for (let j = 0; j < 4; j++) {
  //     const cell = document.createElement("div");
  //     cell.classList.add("cell");
  //     const chordbox = document.createElement("input");
  //     chordbox.type = "text";
  //     chordbox.classList.add("chordbox");
  //     chordbox.id = `cell-${i}-${j}`;
  //     cell.appendChild(chordbox);
  //     sequencer.appendChild(cell);
  //   }
  // }

  const tracks = document.querySelectorAll(".track");
  tracks.forEach((track) => {
    track.addEventListener("click", () => {
      tracks.forEach((t) => t.classList.remove("active"));
      track.classList.add("active");
      currentInstrument = track.dataset.instrument;
      console.log("Selected instrument:", currentInstrument);
    });
  });

  const melody_sequencer = document.querySelector(".melody-sequencer");

  if (melody_sequencer) {
    melody_sequencer.style.setProperty(
      "--melody-column-count",
      melodyColumnCount.toString(),
    );
  }

  const cornerCell = document.createElement("div");
  cornerCell.classList.add("cell", "melody-label");
  cornerCell.style.position = 'sticky';
  cornerCell.style.top = '0';
  cornerCell.style.zIndex = '4';
  cornerCell.textContent = "Chords";
  melody_sequencer.appendChild(cornerCell);

  const numberOfChords = melodyColumnCount/4;
  for (let i = 0; i < numberOfChords; i++) {
    const chordCell = document.createElement("div");
    chordCell.classList.add("chord-cell");
    const chordbox = document.createElement("input");
    chordbox.type = "text";
    chordbox.classList.add("chordbox");
    chordbox.id = `chord-cell-${i}`;
    chordCell.appendChild(chordbox);
    melody_sequencer.appendChild(chordCell);
  }

  for (let i = 0; i < melodyRowCount; i++) {
    const absoluteIndex = melodyRowCount - 1 - i;
    const noteString = note_names[absoluteIndex%12];
    const octave = 2 + Math.floor(absoluteIndex / 12);
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
  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key == " ") {
      play_all();
    }
  });
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
    if (!/\d$/.test(bass)) bassNote = bass + "3";
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
  const seqEl = document.querySelector(".melody-sequencer");
  const chordBoxes = seqEl ? seqEl.querySelectorAll(".chordbox") : [];
  console.log("play_sequence: found", chordBoxes.length, "boxes");
  chordBoxes.forEach((el, i) =>
    console.log("box", i, el.tagName, "value=", el.value),
  );
  for (const input of chordBoxes) sequence.push(input.value);
  for (const chord of sequence) {
    console.log("sequence chord ->", chord);
    if (chord && chord.trim().length > 0) await play_chord(chord.trim());
    else await new Promise((resolve) => setTimeout(resolve, 60000/bpm));
  }
}

async function play_melody(notes = null, settings = null) {
  const melody_sequencer = document.querySelector(".melody-sequencer");
  if (!melody_sequencer) return;
  const melodyColumnCount =
    parseInt(
      melody_sequencer.style.getPropertyValue("--melody-column-count"),
      10,
    ) || 8;

  const beatDuration = 60000 / bpm;

  if (notes && notes.length > 0) {
    for (let j = 0; j < melodyColumnCount; j++) {
      const note = notes[j];
      if (note) {
        const frequency = note_to_frequency(note);
        await play_tone(frequency, beatDuration, settings);
      } else {
        await new Promise((resolve) => setTimeout(resolve, beatDuration));
      }
    }
    return;
  }
  for (let j = 0; j < melodyColumnCount; j++) {
    const checkedBox = melody_sequencer.querySelector(
      `input[name="melody-col-${j}"]:checked`,
    );

    if (checkedBox) {
      // checkedBox.style.backgroundColor = "#f7f7f7";
      const absoluteIndex = parseInt(melodyRowCount - 1 - checkedBox.value, 10);
      const noteString = note_names[absoluteIndex%12];
      const octave = 2 + Math.floor(absoluteIndex / 12);
      const noteToPlay = noteString + octave;

      await play_tone(note_to_frequency(noteToPlay), beatDuration, settings);
    } else {
      await new Promise((resolve) => setTimeout(resolve, beatDuration));
    }
  }
}

async function play_all(position = 0) {
  tracks[currentInstrument].notes = get_melody_notes();
  save_settings();
  var melodies = [];
  Object.values(tracks).forEach((track) => {
    if (track.notes && track.notes.length > 0) {
      melodies.push(track.notes);
      play_melody(track.notes, settings=track.settings)
    }
  });
  play_sequence();
}

async function play_tone(frequency = 440, duration = 1000, settings=null, volume=document.getElementById("volume").value) {
  const useTrackVolume = settings && typeof settings.volume === "number";
  const rawVolume = useTrackVolume ? settings.volume : parseFloat(volume);
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
  const volumeDb = sliderRawToDb(rawVolume, settings && settings.volume ? {min: -120, max: 0} : document.getElementById("volume"));
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
  const type = settings ? settings.type : document.getElementById("type").value;
  const detuneValue = parseFloat(settings ? settings.detune : document.getElementById("detune").value);
  var detunedOsc = [];

  if (detuneValue > 0) {
    for (let i = 0; i < (settings ? settings.voices : document.getElementById("voices").value); i++) {
      const detuneOsc = context.createOscillator();
      detuneOsc.type = type;
      detuneOsc.frequency.value = frequency;
      detuneOsc.detune.value = detuneValue;
      detuneOsc.connect(gain);
      detuneOsc.start();
      detunedOsc.push(detuneOsc);
    }
  }

  oscillator.type = type;
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

function generate_instruments() {
  return
}

function selectInstrument(instrumentName) {
  save_settings();
  currentInstrument = instrumentName;
  reset_melody_sequencer();
  // document.getElementById("controls").innerHTML = base_controls;
  load_settings();
  load_melody_notes(tracks[currentInstrument].notes);
}

function get_melody_notes() {
  const sequencer = document.querySelector(".melody-sequencer");
  const melodyColumnCount =
    parseInt(
      sequencer.style.getPropertyValue("--melody-column-count"),
      10,
    ) || 8;
  const notes = [];
  for (let j = 0; j < melodyColumnCount; j++) {
    const checkedBox = sequencer.querySelector(
      `input[name="melody-col-${j}"]:checked`,
    );
    if (checkedBox) {
      const absoluteIndex = parseInt(melodyRowCount - 1 - checkedBox.value, 10);
      const noteString = note_names[absoluteIndex%12];
      const octave = 2 + Math.floor(absoluteIndex / 12);
      notes.push(noteString + octave);
    } else {
      notes.push(null);
    }
  }
  return notes;
}

function load_melody_notes(notes) {
  const sequencer = document.querySelector(".melody-sequencer");
  const melodyColumnCount =
    parseInt(
      sequencer.style.getPropertyValue("--melody-column-count"),
      10,
    ) || 8;
  const melodyboxes = sequencer.querySelectorAll(".melodybox");
  melodyboxes.forEach((melodybox) => {
    melodybox.checked = false;
    melodybox.wasChecked = false;
  });
  for (let j = 0; j < melodyColumnCount; j++) {
    const note = notes[j];
    if (!note) continue;
    const octave = parseInt(note.slice(-1), 10);
    const noteString = note.slice(0, -1);
    const noteIndex = note_names.indexOf(noteString);
    const absoluteIndex = noteIndex + (octave - 2) * 12;
    const melodybox = sequencer.querySelector(
      `input[name="melody-col-${j}"][value="${melodyRowCount - 1 - absoluteIndex}"]`,
    );
    if (melodybox) {
      melodybox.checked = true;
      melodybox.wasChecked = true;
    }
  }
}

function reset_melody_sequencer() {
  const sequencer = document.querySelector(".melody-sequencer");
  const melodyboxes = sequencer.querySelectorAll(".melodybox");
  melodyboxes.forEach((box) => {
    box.checked = false;
    box.wasChecked = false;
  });
}

function save_settings() {
  const track = tracks[currentInstrument];
  track.settings.detune = parseFloat(document.getElementById("detune").value);
  track.settings.voices = parseInt(document.getElementById("voices").value, 10);
  track.settings.volume = parseFloat(document.getElementById("volume").value);
  track.settings.type = document.getElementById("type").value;
}

function load_settings() {
  const track = tracks[currentInstrument];
  document.getElementById("detune").value = track.settings.detune;
  document.getElementById("voices").value = track.settings.voices;
  document.getElementById("volume").value = track.settings.volume;
  document.getElementById("type").value = track.settings.type;
}
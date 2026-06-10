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

var bpm = 120;

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

var playing = false;
let activePlaybackSession = null;
let playbackSessionId = 0;

var tracks = {
  "lead1": {
    "settings": {
      "detune": 15,
      "voices": 2,
      "volume": -40,
      "type": "sawtooth",
    },
    "notes": []
},
"bass": {
  "settings": {
    "detune": 0,
    "voices": 1,
    "volume": -35,
    "type": "square",
  },
  "notes": []
},
"pad": {
  "settings": {
    "detune": 8,
    "voices": 4,
    "volume": -50,
    "type": "triangle",
  },
  "notes": []
}
}

var chords = {
  "settings": {
    "detune": 0,
    "voices": 1,
    "volume": -40,
    "type": "sawtooth",
  },
  "progression": [],
};

var melodyColumnCount = 64;
const melodyColumnsPerSection = 4;
const melodyRowCount = 49;

let currentInstrument = "lead1";

var wrap = false;

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

  // const tracks = document.querySelectorAll(".track");
  // tracks.forEach((track) => {
  //   track.addEventListener("click", () => {
  //     tracks.forEach((t) => t.classList.remove("active"));
  //     track.classList.add("active");
  //     currentInstrument = track.dataset.instrument;
  //     console.log("Selected instrument:", currentInstrument);
  //   });
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

  const numberOfChords = melodyColumnCount / melodyColumnsPerSection;
  for (let i = 0; i < numberOfChords; i++) {
    const chordCell = document.createElement("div");
    chordCell.classList.add("chord-cell");
    const chordbox = document.createElement("input");
    chordbox.type = "text";
    chordbox.classList.add("chordbox");
    chordbox.id = `chord-cell-${i}`;
    chordbox.addEventListener("input", saveChordProgression);
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
      if (j % melodyColumnsPerSection === melodyColumnsPerSection - 1) {
        cell.classList.add("melody-divider");
      }
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

setupControlBindings();
syncBpmFromControls();
load_settings();
loadChordSettings();
load_melody_notes(tracks[currentInstrument].notes);
saveChordProgression();


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

async function play_chord(to_play = null, session = activePlaybackSession) {
  let chord;
  if (typeof to_play === "string" && to_play.length > 0) chord = to_play;
  else chord = document.getElementById("chord")?.value || "";
  const parsed = parse_chord_name(chord);
  if (!parsed || parsed.length === 0) return;
  const chordDuration = 60000 / syncBpmFromControls();
  const promises = parsed.map((note) => {
    const frequency = note_to_frequency(note);
    return play_tone(frequency, chordDuration, chords.settings, undefined, session);
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

async function play_sequence(session = activePlaybackSession) {
  saveChordProgression();
  await play_chord_sequence(chords.progression, chords.settings, syncBpmFromControls(), session);
}

async function play_chord_sequence(
  progression = [],
  settings = chords.settings,
  tempo = bpm,
  session = activePlaybackSession,
) {
  const chordDuration = 60000 / tempo;
  for (const chord of progression) {
    if (session && !isPlaybackSessionActive(session)) return;
    if (chord && chord.trim().length > 0) {
      await play_chord_with_settings(chord.trim(), settings, chordDuration, session);
    } else {
      await waitForPlayback(chordDuration, session);
    }
  }
}

async function play_chord_with_settings(chord, settings, duration, session = activePlaybackSession) {
  const parsed = parse_chord_name(chord);
  if (!parsed || parsed.length === 0) return;
  const promises = parsed.map((note) => {
    const frequency = note_to_frequency(note);
    return play_tone(frequency, duration, settings, undefined, session);
  });
  await Promise.all(promises);
}

function cloneSettings(settings) {
  return {
    detune: Number(settings.detune),
    voices: Number(settings.voices),
    volume: Number(settings.volume),
    type: settings.type,
  };
}

function cloneNotes(notes) {
  return notes.slice();
}

function createPlaybackSession() {
  return {
    id: ++playbackSessionId,
    active: true,
    waits: new Map(),
    voices: new Set(),
  };
}

function isPlaybackSessionActive(session) {
  return session && session.active && activePlaybackSession === session;
}

function setPlayButtonLabel(label) {
  const playButton = document.querySelector(".play");
  if (playButton) playButton.textContent = label;
}

function stopVoice(voice) {
  if (!voice || voice.stopped) return;
  voice.stopped = true;

  voice.oscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch (e) {}
    try {
      oscillator.disconnect();
    } catch (e) {}
  });

  try {
    voice.gain.disconnect();
  } catch (e) {}
}

function stopPlaybackSession(session) {
  if (!session || !session.active) return;
  session.active = false;

  session.waits.forEach((resolve, timeout) => {
    clearTimeout(timeout);
    resolve(false);
  });
  session.waits.clear();

  session.voices.forEach(stopVoice);
  session.voices.clear();
}

function stopPlayback() {
  stopPlaybackSession(activePlaybackSession);
  activePlaybackSession = null;
  playing = false;
  setPlayButtonLabel("PLAY");
}

function waitForPlayback(duration, session) {
  if (!session) {
    return new Promise((resolve) => setTimeout(() => resolve(true), duration));
  }
  if (!isPlaybackSessionActive(session)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      session.waits.delete(timeout);
      resolve(isPlaybackSessionActive(session));
    }, duration);
    session.waits.set(timeout, resolve);
  });
}

function syncBpmFromControls() {
  const bpmInput = document.getElementById("bpm");
  if (!bpmInput) return bpm;
  const parsed = parseInt(bpmInput.value, 10);
  if (Number.isFinite(parsed)) {
    const min = parseInt(bpmInput.min, 10) || 30;
    const max = parseInt(bpmInput.max, 10) || 400;
    bpm = Math.max(min, Math.min(max, parsed));
  }
  return bpm;
}

function getTrackSettingsFromControls() {
  return {
    detune: parseFloat(document.getElementById("detune").value),
    voices: parseInt(document.getElementById("voices").value, 10),
    volume: parseFloat(document.getElementById("volume").value),
    type: document.getElementById("type").value,
  };
}

function applyTrackSettingsToControls(settings) {
  document.getElementById("detune").value = settings.detune;
  document.getElementById("voices").value = settings.voices;
  document.getElementById("volume").value = settings.volume;
  document.getElementById("type").value = settings.type;
}

function getChordSettingsFromControls() {
  return {
    detune: parseFloat(document.getElementById("chord-detune").value),
    voices: parseInt(document.getElementById("chord-voices").value, 10),
    volume: parseFloat(document.getElementById("chord-volume").value),
    type: document.getElementById("chord-type").value,
  };
}

function applyChordSettingsToControls(settings) {
  document.getElementById("chord-detune").value = settings.detune;
  document.getElementById("chord-voices").value = settings.voices;
  document.getElementById("chord-volume").value = settings.volume;
  document.getElementById("chord-type").value = settings.type;
}

function saveChordSettings() {
  chords.settings = getChordSettingsFromControls();
}

function loadChordSettings() {
  applyChordSettingsToControls(chords.settings);
}

function setupControlBindings() {
  ["detune", "voices", "volume", "type"].forEach((id) => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", save_settings);
    control.addEventListener("change", save_settings);
  });

  ["chord-detune", "chord-voices", "chord-volume", "chord-type"].forEach((id) => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", saveChordSettings);
    control.addEventListener("change", saveChordSettings);
  });

  const bpmInput = document.getElementById("bpm");
  if (bpmInput) {
    bpmInput.addEventListener("input", syncBpmFromControls);
    bpmInput.addEventListener("change", syncBpmFromControls);
  }
}

function getChordProgression() {
  const seqEl = document.querySelector(".melody-sequencer");
  const chordBoxes = seqEl ? seqEl.querySelectorAll(".chordbox") : [];
  return Array.from(chordBoxes, (input) => input.value);
}

function saveChordProgression() {
  chords.progression = getChordProgression();
}

function saveCurrentInstrumentState() {
  if (!tracks[currentInstrument]) return;
  tracks[currentInstrument].notes = get_melody_notes();
  save_settings();
  saveChordSettings();
  saveChordProgression();
  syncBpmFromControls();
}

async function play_melody(notes = null, settings = null, tempo = bpm, session = activePlaybackSession) {
  const melody_sequencer = document.querySelector(".melody-sequencer");
  if (!melody_sequencer) return;
  const melodyColumnCount =
    parseInt(
      melody_sequencer.style.getPropertyValue("--melody-column-count"),
      10,
    ) || 8;

  const beatDuration = 60000 / tempo;
  const stepDuration = beatDuration / melodyColumnsPerSection;

  if (notes && notes.length > 0) {
    for (let j = 0; j < melodyColumnCount; j++) {
      if (session && !isPlaybackSessionActive(session)) return;
      const note = notes[j];
      if (note) {
        const frequency = note_to_frequency(note);
        await play_tone(frequency, stepDuration, settings, undefined, session);
      } else {
        await waitForPlayback(stepDuration, session);
      }
    }
    return;
  }
  for (let j = 0; j < melodyColumnCount; j++) {
    if (session && !isPlaybackSessionActive(session)) return;
    const checkedBox = melody_sequencer.querySelector(
      `input[name="melody-col-${j}"]:checked`,
    );

    if (checkedBox) {
      // checkedBox.style.backgroundColor = "#f7f7f7";
      const absoluteIndex = parseInt(melodyRowCount - 1 - checkedBox.value, 10);
      const noteString = note_names[absoluteIndex%12];
      const octave = 2 + Math.floor(absoluteIndex / 12);
      const noteToPlay = noteString + octave;
      
      await play_tone(note_to_frequency(noteToPlay), stepDuration, settings, undefined, session);
    } else {
      await waitForPlayback(stepDuration, session);
    }
  }
}

async function play_all(position = 0) {
  if (playing) {
    stopPlayback();
    return;
  }

  const session = createPlaybackSession();
  activePlaybackSession = session;
  playing = true;
  setPlayButtonLabel("STOP");
  saveCurrentInstrumentState();

  const playbackBpm = syncBpmFromControls();
  const trackSnapshots = Object.values(tracks).map((track) => ({
    notes: cloneNotes(track.notes),
    settings: cloneSettings(track.settings),
  }));
  const chordProgression = chords.progression.slice();
  const chordSettings = cloneSettings(chords.settings);

  const playbackTasks = [];

  trackSnapshots.forEach((track) => {
    if (track.notes && track.notes.some((note) => note)) {
      playbackTasks.push(play_melody(track.notes, track.settings, playbackBpm, session));
    }
  });

  if (chordProgression.some((chord) => chord && chord.trim())) {
    playbackTasks.push(play_chord_sequence(chordProgression, chordSettings, playbackBpm, session));
  }

  try {
    await Promise.all(playbackTasks);
  } finally {
    stopPlaybackSession(session);
    if (activePlaybackSession === session) {
      activePlaybackSession = null;
      playing = false;
      setPlayButtonLabel("PLAY");
    }
  }
}

async function play_tone(
  frequency = 440,
  duration = 1000,
  settings = null,
  volume = document.getElementById("volume").value,
  session = activePlaybackSession,
) {
  if (session && !isPlaybackSessionActive(session)) return false;
  const useTrackVolume = settings && Number.isFinite(Number(settings.volume));
  const rawVolume = useTrackVolume ? Number(settings.volume) : parseFloat(volume);
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
  const volumeDb = sliderRawToDb(rawVolume, settings ? {min: -120, max: 0} : document.getElementById("volume"));
  gain.gain.setValueAtTime(dbToGain(volumeDb), now);
  const volume_slider = document.getElementById("volume");
  function onVolInput() {
    const v = parseFloat(volume_slider.value);
    const db = sliderRawToDb(v, volume_slider);
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(dbToGain(db), context.currentTime, 0.02);
  }
  if (!settings) {
    volume_slider.addEventListener("input", onVolInput);
  }

  const voice = {
    oscillators: [oscillator],
    gain,
    stopped: false,
  };

  if (session) session.voices.add(voice);

  gain.connect(context.destination);
  const type = settings ? settings.type : document.getElementById("type").value;
  const detuneValue = parseFloat(settings ? settings.detune : document.getElementById("detune").value);
  const voiceCount = parseInt(settings ? settings.voices : document.getElementById("voices").value, 10) || 1;

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);

  try {
    if (detuneValue > 0) {
      for (let i = 0; i < voiceCount; i++) {
        const detuneOsc = context.createOscillator();
        detuneOsc.type = type;
        detuneOsc.frequency.value = frequency;
        detuneOsc.detune.value = detuneValue;
        detuneOsc.connect(gain);
        voice.oscillators.push(detuneOsc);
      }
    }

    await context.resume();
    if (session && !isPlaybackSessionActive(session)) return false;

    voice.oscillators.forEach((osc) => osc.start());
    return await waitForPlayback(duration, session);
  } finally {
    stopVoice(voice);
    if (session) session.voices.delete(voice);
    if (!settings) {
      volume_slider.removeEventListener("input", onVolInput);
    }
  }
}

function generate_instruments() {
  return
}

function selectInstrument(instrumentName) {
  if (!tracks[instrumentName]) return;

  saveCurrentInstrumentState();

  currentInstrument = instrumentName;

  document.querySelectorAll(".track").forEach((track) => {
    track.classList.toggle("active", track.dataset.instrument === instrumentName);
  });

  reset_melody_sequencer();
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
  if (!track) return;
  track.settings = getTrackSettingsFromControls();
}

function load_settings() {
  const track = tracks[currentInstrument];
  if (!track) return;
  applyTrackSettingsToControls(track.settings);
}

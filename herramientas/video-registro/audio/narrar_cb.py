"""Narración con Chatterbox Multilingual (MIT): cada línea de guion.json →
audio/voz/<id>.wav (48 kHz, mono) + audio/voz/duraciones.json.

Kokoro (narrar.py) se entendía perfecto pero sonaba robótico: casi no movía el
tono (desvío de ~28 Hz en una frase; una persona anda por el doble). Chatterbox
entona como una persona. La voz toma el timbre de `audio/ref-voz-masculina.wav`.

Cada línea se transcribe con whisper y se compara con el texto: si sale trabada
o le faltan palabras, se vuelve a generar con otra semilla (hasta 4 intentos) y
queda la mejor.

  ~/.local/share/vaxler-tts/venv-cb/bin/python audio/narrar_cb.py [--solo a1,n3]
"""
import argparse
import difflib
import json
import re
import subprocess
import tempfile
import time
import unicodedata
import zlib
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio as ta

# Los pesos de la voz por defecto vienen guardados en CUDA: en la Mac se cargan
# primero en CPU y después pasan al chip.
_cargar = torch.load


def _cargar_en_cpu(*a, **k):
    k.setdefault("map_location", torch.device("cpu"))
    return _cargar(*a, **k)


torch.load = _cargar_en_cpu
from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # noqa: E402

raiz = Path(__file__).resolve().parent.parent
guion = json.loads((raiz / "guion.json").read_text())
cfg = guion["voz"]
WHISPER = ["whisper-cli", "-m", str(Path.home() / "whisper-models/ggml-large-v3-turbo.bin"), "-l", "es", "-nt", "--no-prints", "-f"]

ap = argparse.ArgumentParser()
ap.add_argument("--solo", default="")
ap.add_argument("--salida", default=str(raiz / "audio" / "voz"))
ap.add_argument("--intentos", type=int, default=4)
a = ap.parse_args()
solo = set(filter(None, a.solo.split(",")))
salida = Path(a.salida)
salida.mkdir(parents=True, exist_ok=True)

modelo = ChatterboxMultilingualTTS.from_pretrained(device="mps" if torch.backends.mps.is_available() else "cpu")
ref = str(raiz / cfg["referencia"])


def normal(s: str) -> list[str]:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("%", " por ciento ")
    return re.findall(r"[a-z0-9]+", s)


def parecido(oido: str, *esperados: str) -> float:
    o = normal(oido)
    return max(difflib.SequenceMatcher(None, o, normal(e)).ratio() for e in esperados)


def oir(wav: np.ndarray, sr: int) -> str:
    with tempfile.TemporaryDirectory() as d:
        f = Path(d) / "a.wav"
        g = Path(d) / "b.wav"
        sf.write(f, wav, sr)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(f), "-ar", "16000", "-ac", "1", str(g)], check=True)
        r = subprocess.run(WHISPER + [str(g)], capture_output=True, text=True)
        return r.stdout.strip()


def recortar(x: np.ndarray, sr: int, umbral=0.006) -> np.ndarray:
    """Saca el silencio del principio y del final (deja 40 ms de aire adelante y 80 atrás)."""
    idx = np.where(np.abs(x) > umbral)[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(sr * 0.04)) : min(len(x), idx[-1] + int(sr * 0.08))]


durs = {}
for esc in guion["escenas"]:
    for ln in esc["lineas"]:
        if solo and ln["id"] not in solo:
            continue
        mejor = None
        for intento in range(a.intentos):
            torch.manual_seed(zlib.crc32(ln["id"].encode()) + intento * 7919)
            t = time.time()
            w = modelo.generate(ln["voz"], language_id=cfg["idioma"], audio_prompt_path=ref,
                                exaggeration=cfg["exageracion"], cfg_weight=cfg["cfg"])
            audio = recortar(w.squeeze(0).cpu().numpy(), modelo.sr)
            texto = oir(audio, modelo.sr)
            p = parecido(texto, ln["texto"], ln["voz"])
            print(f"{ln['id']} intento {intento + 1}: {p:.2f} ({len(audio) / modelo.sr:.1f} s, {time.time() - t:.0f} s) «{texto}»", flush=True)
            if mejor is None or p > mejor[0]:
                mejor = (p, audio)
            if p >= 0.9:
                break
        p, audio = mejor
        tmp = salida / f"{ln['id']}.tmp.wav"
        sf.write(tmp, audio, modelo.sr)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-ar", "48000", "-ac", "1",
                        "-c:a", "pcm_s16le", str(salida / f"{ln['id']}.wav")], check=True)
        tmp.unlink()
        durs[ln["id"]] = round(len(audio) / modelo.sr, 4)
        if p < 0.9:
            print(f"   ⚠ {ln['id']} quedó en {p:.2f}: revisarla de oído", flush=True)

arch = salida / "duraciones.json"
previas = json.loads(arch.read_text()) if arch.exists() else {}
previas.update(durs)
previas["_voz"] = "chatterbox"
arch.write_text(json.dumps(previas, indent=1, ensure_ascii=False))
print("total", round(sum(v for k, v in previas.items() if not k.startswith("_")), 1), "s")

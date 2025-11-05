const NOTE_FREQUENCIES: Record<string, { freq: number; range: number }> = {
  'Sa': { freq: 512.63, range: 30 },
  'Re': { freq: 570.66, range: 30 },
  'Ga': { freq: 640.63, range: 30 },
  'Ma': { freq: 700.23, range: 30 },
  'Pa': { freq: 392.00, range: 30 },
  'Dha': { freq: 440.00, range: 30 },
  'Ni': { freq: 493.88, range: 30 },
};

export const getClosestNote = (frequency: number): { note: string; confidence: number } | null => {
  if (frequency < 100 || frequency > 1000) return null;

  let closestNote = null;
  let closestDistance = Infinity;
  let closestConfidence = 0;

  for (const [note, { freq, range }] of Object.entries(NOTE_FREQUENCIES)) {
    const distance = Math.abs(frequency - freq);
    if (distance < range && distance < closestDistance) {
      closestDistance = distance;
      closestNote = note;
      closestConfidence = Math.max(0, 1 - distance / range);
    }
  }

  return closestNote ? { note: closestNote, confidence: closestConfidence } : null;
};

export const startPitchDetection = async (
  onPitchDetected: (note: string | null, confidence: number, frequency?: number) => void,
  onError: (error: string) => void
): Promise<() => void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 4096;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detectPitch = () => {
      analyser.getByteFrequencyData(dataArray);

      let maxValue = 0;
      let maxIndex = 0;

      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }

      const nyquist = audioContext.sampleRate / 2;
      const frequency = (maxIndex * nyquist) / dataArray.length;

      if (maxValue > 30) {
        const result = getClosestNote(frequency);
        if (result) {
          onPitchDetected(result.note, result.confidence, frequency);
        } else {
          onPitchDetected(null, 0, frequency);
        }
      } else {
        onPitchDetected(null, 0, 0);
      }

      requestAnimationFrame(detectPitch);
    };

    detectPitch();

    return () => {
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    };
  } catch (error) {
    onError('Microphone access denied. Please enable microphone permissions.');
    throw error;
  }
};

export const getFrequencyForNote = (note: string): number => {
  return NOTE_FREQUENCIES[note]?.freq || 0;
};

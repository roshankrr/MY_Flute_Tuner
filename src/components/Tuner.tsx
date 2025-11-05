import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { startPitchDetection, getFrequencyForNote } from '../utils/pitchDetection';

export default function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedFrequency, setDetectedFrequency] = useState<number>(0);
  const [confidence, setConfidence] = useState(0);
  const [history, setHistory] = useState<{ note: string; frequency: number; confidence: number; timestamp: number }[]>([]);
  const cleanupPitchRef = useRef<(() => void) | null>(null);

  const startListening = async () => {
    setIsListening(true);
    setDetectedNote(null);
    setDetectedFrequency(0);
    setHistory([]);

    try {
      cleanupPitchRef.current = await startPitchDetection(
        (note: string | null, conf: number, freq?: number) => {
          setDetectedNote(note);
          setConfidence(conf);
          if (freq !== undefined) {
            setDetectedFrequency(freq);
          }

          if (note && conf > 0.5) {
            setHistory(prev => {
              const newEntry = {
                note,
                frequency: freq || 0,
                confidence: conf,
                timestamp: Date.now()
              };
              return [...prev.slice(-9), newEntry];
            });
          }
        },
        (error: string) => {
          console.error(error);
          alert(error);
          setIsListening(false);
        }
      );
    } catch (error) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (cleanupPitchRef.current) {
      cleanupPitchRef.current();
      cleanupPitchRef.current = null;
    }
    setIsListening(false);
    setDetectedNote(null);
    setDetectedFrequency(0);
    setConfidence(0);
  };

  const getDeviationFromPerfect = () => {
    if (!detectedNote || detectedFrequency === 0) return 0;
    const perfectFreq = getFrequencyForNote(detectedNote);
    return detectedFrequency - perfectFreq;
  };

  const getTuningStatus = () => {
    const deviation = Math.abs(getDeviationFromPerfect());
    if (deviation < 5) return { status: 'Perfect', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (deviation < 10) return { status: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    if (deviation < 20) return { status: 'Close', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    return { status: 'Off', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Flute Tuner</h2>
        <p className="text-slate-600">Check your flute's tuning in real-time</p>
      </div>

      <div className="space-y-6">
        {/* Main Tuner Display */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`
                py-4 px-8 rounded-lg font-semibold flex items-center justify-center space-x-3 transition-all mx-auto
                ${isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {isListening ? (
                <>
                  <Square className="w-6 h-6" />
                  <span>Stop Tuner</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span>Start Tuner</span>
                </>
              )}
            </button>
          </div>

          {isListening && (
            <>
              {/* Note Display */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <p className="text-2xl text-slate-700 font-medium mb-2">Detected Note</p>
                  <div className={`text-9xl font-bold ${detectedNote ? getTuningStatus().color : 'text-slate-300'}`}>
                    {detectedNote || '-'}
                  </div>
                </div>

                {detectedNote && (
                  <div className="space-y-4">
                    {/* Tuning Status */}
                    <div>
                      <p className={`text-2xl font-bold ${getTuningStatus().color}`}>
                        {getTuningStatus().status}
                      </p>
                    </div>

                    {/* Frequency Display */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">Current Frequency</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {detectedFrequency.toFixed(2)} Hz
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Target: {getFrequencyForNote(detectedNote).toFixed(2)} Hz
                      </p>
                      <p className={`text-sm font-medium mt-1 ${getDeviationFromPerfect() > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {getDeviationFromPerfect() > 0 ? '+' : ''}{getDeviationFromPerfect().toFixed(2)} Hz
                      </p>
                    </div>

                    {/* Visual Tuning Indicator */}
                    <div className="bg-slate-100 rounded-lg p-6">
                      <p className="text-sm text-slate-600 mb-3 text-center">Tuning Accuracy</p>
                      <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden">
                        {/* Markers */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-0.5 h-full bg-green-600 opacity-50"></div>
                        </div>

                        {/* Deviation indicator */}
                        <div
                          className="absolute top-0 h-full w-2 bg-blue-600 rounded-full transition-all duration-150"
                          style={{
                            left: `calc(50% + ${Math.max(-50, Math.min(50, getDeviationFromPerfect() * 2))}% - 4px)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Too Low</span>
                        <span>Perfect</span>
                        <span>Too High</span>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-2">Signal Strength</p>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${getTuningStatus().bgColor}`}
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 text-right">{(confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                )}

                {!detectedNote && (
                  <div className="text-slate-400 text-lg mt-4">
                    Play a note on your flute...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Recent Notes</h3>
            <div className="grid grid-cols-5 gap-2">
              {history.map((entry, idx) => (
                <div key={idx} className="bg-slate-50 rounded p-3 text-center">
                  <p className="text-xl font-bold text-slate-800">{entry.note}</p>
                  <p className="text-xs text-slate-500">{entry.frequency.toFixed(1)} Hz</p>
                  <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${entry.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use the Tuner</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Click "Start Tuner" to begin listening through your microphone</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Play a single note on your flute and hold it steady</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The tuner will show the detected note and frequency</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Watch the tuning indicator - center position means perfectly in tune</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Adjust your embouchure or finger positions until you see "Perfect" status</span>
            </li>
          </ul>
        </div>

        {/* Note Reference */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Indian Classical Notes (Swaras)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { note: 'Sa', freq: 261.63 },
              { note: 'Re', freq: 293.66 },
              { note: 'Ga', freq: 329.63 },
              { note: 'Ma', freq: 349.23 },
              { note: 'Pa', freq: 392.00 },
              { note: 'Dha', freq: 440.00 },
              { note: 'Ni', freq: 493.88 },
            ].map(({ note, freq }) => (
              <div
                key={note}
                className={`p-3 rounded-lg text-center border-2 transition-all ${
                  detectedNote === note
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <p className="text-xl font-bold">{note}</p>
                <p className="text-xs opacity-75">{freq.toFixed(2)} Hz</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

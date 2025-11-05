import { useEffect, useState } from 'react';
import { Mic, Square, Play, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Swar } from '../types';
import { recordAudio, playAudioFromBlob, blobToBase64 } from '../utils/audioUtils';

export default function TuneSwars() {
  const [swars, setSwars] = useState<Swar[]>([]);
  const [selectedSwar, setSelectedSwar] = useState<Swar | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    loadSwars();
  }, []);

  const loadSwars = async () => {
    try {
      const { data, error } = await supabase
        .from('swars')
        .select('*')
        .eq('pitch', 'mid')
        .order('name');

      if (error) throw error;
      setSwars(data || []);
    } catch (error) {
      console.error('Error loading swars:', error);
    }
  };

  const startRecording = async () => {
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev! - 1;
      });
    }, 1000);

    setTimeout(async () => {
      setIsRecording(true);
      try {
        const blob = await recordAudio(3000);
        setRecordedBlob(blob);
      } catch (error) {
        console.error('Error recording:', error);
        alert('Failed to record audio. Please check your microphone permissions.');
      } finally {
        setIsRecording(false);
      }
    }, 3000);
  };

  const playRecording = async () => {
    if (!recordedBlob) return;
    setIsPlaying(true);
    try {
      await playAudioFromBlob(recordedBlob);
    } catch (error) {
      console.error('Error playing recording:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob || !selectedSwar) return;

    setIsSaving(true);
    try {
      const base64Audio = await blobToBase64(recordedBlob);

      const { error } = await supabase
        .from('swars')
        .update({
          audio_url: base64Audio,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSwar.id);

      if (error) throw error;

      alert(`Successfully saved recording for ${selectedSwar.name}!`);
      setRecordedBlob(null);
      loadSwars();
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('Failed to save recording. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelRecording = () => {
    setRecordedBlob(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Tune Your Swars</h2>
        <p className="text-slate-600">Record and save each swar sound for practice</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Select Swar to Record</h3>
          <div className="grid grid-cols-2 gap-3">
            {swars.map((swar) => (
              <button
                key={swar.id}
                onClick={() => {
                  setSelectedSwar(swar);
                  setRecordedBlob(null);
                }}
                className={`
                  p-4 rounded-lg font-bold text-lg transition-all
                  ${selectedSwar?.id === swar.id
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  <span>{swar.name}</span>
                  {swar.audio_url && (
                    <span className="text-xs mt-1 opacity-75">✓ Recorded</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            {selectedSwar ? `Recording: ${selectedSwar.name}` : 'Select a Swar First'}
          </h3>

          {selectedSwar && (
            <div className="space-y-4">
              {countdown !== null && (
                <div className="text-center py-12">
                  <div className="text-6xl font-bold text-blue-500 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-slate-600 mt-4">Get ready to play...</p>
                </div>
              )}

              {isRecording && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full animate-pulse mb-4">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-slate-800 font-semibold">Recording... Play your flute now!</p>
                  <p className="text-slate-600 text-sm mt-2">3 seconds</p>
                </div>
              )}

              {!isRecording && !recordedBlob && countdown === null && (
                <button
                  onClick={startRecording}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              )}

              {recordedBlob && (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-medium">Recording Complete!</p>
                  </div>

                  <button
                    onClick={playRecording}
                    disabled={isPlaying}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors disabled:bg-slate-300"
                  >
                    <Play className="w-5 h-5" />
                    <span>{isPlaying ? 'Playing...' : 'Play Recording'}</span>
                  </button>

                  <button
                    onClick={saveRecording}
                    disabled={isSaving}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors disabled:bg-slate-300"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Recording</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={cancelRecording}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Record Again</span>
                  </button>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Make sure your microphone is enabled</li>
                  <li>Play a clear, sustained note</li>
                  <li>You have 3 seconds to play after countdown</li>
                  <li>Listen to your recording before saving</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

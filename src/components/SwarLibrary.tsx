import { useEffect, useState } from 'react';
import { Music, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Swar } from '../types';
import { playAudioFromUrl, playAudioFromBlob, blobToBase64 } from '../utils/audioUtils';

export default function SwarLibrary() {
  const [swars, setSwars] = useState<Swar[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSwar, setPlayingSwar] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const playSwar = async (swar: Swar) => {
    if (!swar.audio_url) {
      alert('No audio recorded for this swar yet. Please record it in the "Tune Swars" tab.');
      return;
    }

    setPlayingSwar(swar.id);
    try {
      await playAudioFromUrl(swar.audio_url);
    } catch (error) {
      console.error('Error playing swar:', error);
      alert('Failed to play audio. The recording might be missing or corrupted.');
    } finally {
      setPlayingSwar(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading swars...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Swar Library</h2>
        <p className="text-slate-600">Click on any swar to hear its sound</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {swars.map((swar) => (
          <button
            key={swar.id}
            onClick={() => playSwar(swar)}
            disabled={playingSwar === swar.id}
            className={`
              relative p-6 rounded-xl transition-all duration-200
              ${playingSwar === swar.id
                ? 'bg-blue-500 text-white scale-105 shadow-lg'
                : 'bg-white text-slate-800 hover:bg-blue-50 hover:shadow-md'
              }
              ${!swar.audio_url ? 'opacity-50' : ''}
              disabled:cursor-not-allowed
            `}
          >
            <div className="flex flex-col items-center space-y-3">
              {playingSwar === swar.id ? (
                <Music className="w-8 h-8 animate-pulse" />
              ) : (
                <Play className="w-8 h-8" />
              )}
              <span className="text-xl font-bold">{swar.name}</span>
              {!swar.audio_url && (
                <span className="text-xs text-slate-500">Not recorded</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> If you haven't recorded the swars yet, go to the "Tune Swars" tab to record each sound.
        </p>
      </div>
    </div>
  );
}

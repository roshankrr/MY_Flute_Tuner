import { useEffect, useState } from 'react';
import { Music, Clock, Play, Pause, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PracticeSong } from '../types';

export default function PracticeSongs() {
  const [songs, setSongs] = useState<PracticeSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<PracticeSong | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSong, setNewSong] = useState({
    title: '',
    notes: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  });

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isPracticing) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPracticing]);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const startPractice = (song: PracticeSong) => {
    setSelectedSong(song);
    setIsPracticing(true);
    setElapsedTime(0);
  };

  const stopPractice = () => {
    setIsPracticing(false);
  };

  const resetPractice = () => {
    setIsPracticing(false);
    setElapsedTime(0);
    setSelectedSong(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addSong = async () => {
    if (!newSong.title || !newSong.notes) {
      alert('Please fill in title and notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_songs')
        .insert({
          title: newSong.title,
          notes: newSong.notes,
          difficulty: newSong.difficulty
        });

      if (error) throw error;

      setNewSong({ title: '', notes: '', difficulty: 'easy' });
      setShowAddForm(false);
      loadSongs();
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Failed to add song');
    }
  };

  const deleteSong = async (id: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;

    try {
      const { error } = await supabase
        .from('practice_songs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSongs();
      if (selectedSong?.id === id) {
        resetPractice();
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Practice Songs</h2>
            <p className="text-slate-600">Learn flute with step-by-step notes</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Song</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Add New Song</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Song Title
                </label>
                <input
                  type="text"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Twinkle Twinkle Little Star"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (use Sa Re Ga Ma Pa Dha Ni)
                </label>
                <textarea
                  value={newSong.notes}
                  onChange={(e) => setNewSong({ ...newSong, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Sa Sa Pa Pa Dha Dha Pa - Ma Ma Ga Ga Re Re Sa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={newSong.difficulty}
                  onChange={(e) => setNewSong({ ...newSong, difficulty: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={addSong}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Save Song
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSong({ title: '', notes: '', difficulty: 'easy' });
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Available Songs</h3>
          {songs.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-600">
              No songs yet. Add your first practice song!
            </div>
          ) : (
            songs.map((song) => (
              <div
                key={song.id}
                className={`
                  bg-white p-4 rounded-lg shadow-sm border-2 transition-all cursor-pointer
                  ${selectedSong?.id === song.id ? 'border-blue-500' : 'border-transparent hover:border-slate-200'}
                `}
                onClick={() => !isPracticing && startPractice(song)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1">{song.title}</h4>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(song.difficulty)}`}>
                      {song.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSong(song.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">{song.notes}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm sticky top-4">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Practice Session</h3>

          {selectedSong ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">{selectedSong.title}</h4>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(selectedSong.difficulty)}`}>
                  {selectedSong.difficulty}
                </span>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Practice Time</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</span>
                </div>

                <div className="flex space-x-2">
                  {!isPracticing ? (
                    <button
                      onClick={() => setIsPracticing(true)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopPractice}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    onClick={resetPractice}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-slate-700 mb-3">Notes to Practice:</h5>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSong.notes}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Practice Tips:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Start slow and focus on accuracy</li>
                  <li>Play each note clearly</li>
                  <li>Gradually increase your speed</li>
                  <li>Practice regularly for best results</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a song to start practicing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

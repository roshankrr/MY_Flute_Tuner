import { useEffect, useState, useRef } from 'react';
import { Play, Square, Mic, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PracticeSong } from '../types';
import { startPitchDetection } from '../utils/pitchDetection';

interface SwarItem {
  swar: string;
  startTime: number;
  endTime: number;
  played: string | null;
  confidence: number;
  status: 'pending' | 'success' | 'partial' | 'fail';
}

export default function PlayAlong() {
  const [songs, setSongs] = useState<PracticeSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<PracticeSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [swars, setSwars] = useState<SwarItem[]>([]);
  const [currentSwarIndex, setCurrentSwarIndex] = useState(-1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [score, setScore] = useState(0);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const cleanupPitchRef = useRef<(() => void) | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const timerRef = useRef<number>();
  const swarsRef = useRef<SwarItem[]>([]);
  const currentSwarIndexRef = useRef<number>(-1);

  const SWAR_DURATION_MS = 1000;
  const GAP_DURATION_MS = 500;
  const COUNTDOWN_SECONDS = 3;

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    swarsRef.current = swars;
  }, [swars]);

  useEffect(() => {
    currentSwarIndexRef.current = currentSwarIndex;
  }, [currentSwarIndex]);

  const actuallyStartListening = async () => {
    setIsListening(true);
    setDetectedNote(null);

    try {
      cleanupPitchRef.current = await startPitchDetection(
        (note: string | null, confidence: number) => {
          setDetectedNote(note);
          setDetectedConfidence(confidence);

          if (note && currentSwarIndexRef.current >= 0) {
            const currentItem = swarsRef.current[currentSwarIndexRef.current];
            if (currentItem) {
              const isCorrect = note === currentItem.swar;
              const isPartial = confidence > 0 && confidence < 0.7;

              const updatedSwars = [...swarsRef.current];
              updatedSwars[currentSwarIndexRef.current] = {
                ...currentItem,
                played: note,
                confidence: confidence,
                status: isCorrect ? 'success' : isPartial ? 'partial' : 'fail',
              };
              setSwars(updatedSwars);

              if (isCorrect && currentItem.status === 'pending') {
                setSuccessCount(prev => prev + 1);
                setScore(prev => prev + 10);
              } else if (isPartial && currentItem.status === 'pending') {
                setScore(prev => prev + 5);
              }
            }
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

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setIsPlaying(true);
      actuallyStartListening();
    }
  }, [countdown]);

  useEffect(() => {
    if (isPlaying && countdown === null) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 50;
          updateCurrentSwar(newTime);
          return newTime;
        });
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, countdown, swars]);

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

  const parseSongNotes = (notesString: string): { note: string; duration: number }[] => {
    return notesString
      .split(/[\s\-]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => {
        // Check if format is "note:duration" (e.g., "Sa:1000")
        const parts = s.split(':');
        if (parts.length === 2) {
          const note = parts[0];
          const duration = parseInt(parts[1], 10);
          return { note, duration: isNaN(duration) ? SWAR_DURATION_MS : duration };
        }
        // Default format, just note name
        return { note: s, duration: SWAR_DURATION_MS };
      });
  };

  const startPlayAlong = (song: PracticeSong) => {
    setSelectedSong(song);
    const noteArray = parseSongNotes(song.notes);

    const swarItems: SwarItem[] = [];
    let currentTime = 0;

    noteArray.forEach(({ note, duration }) => {
      if (note) {
        swarItems.push({
          swar: note,
          startTime: currentTime,
          endTime: currentTime + duration,
          played: null,
          confidence: 0,
          status: 'pending',
        });
        currentTime += duration + GAP_DURATION_MS;
      }
    });

    setSwars(swarItems);
    setCurrentSwarIndex(-1);
    setElapsedTime(0);
    setSuccessCount(0);
    setScore(0);
    setIsPlaying(false);
    setCountdown(null);
    playStartTimeRef.current = Date.now();
  };

  const updateCurrentSwar = (time: number) => {
    // Check if the song is finished
    if (swars.length > 0) {
      const lastSwar = swars[swars.length - 1];
      if (time > lastSwar.endTime + GAP_DURATION_MS) {
        stopPlayAlong();
        return;
      }
    }

    let newIndex = -1;

    for (let i = 0; i < swars.length; i++) {
      const item = swars[i];
      if (time >= item.startTime && time < item.endTime + GAP_DURATION_MS) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== currentSwarIndex) {
      setCurrentSwarIndex(newIndex);
    }
  };

  const startListening = async () => {
    // Start the countdown first
    setCountdown(COUNTDOWN_SECONDS);
  };

  const stopListening = () => {
    if (cleanupPitchRef.current) {
      cleanupPitchRef.current();
      cleanupPitchRef.current = null;
    }
    setIsListening(false);
    setDetectedNote(null);
  };

  const stopPlayAlong = () => {
    setIsPlaying(false);
    stopListening();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetPlayAlong = () => {
    stopPlayAlong();
    setSelectedSong(null);
    setSwars([]);
    setCurrentSwarIndex(-1);
    setElapsedTime(0);
    setSuccessCount(0);
    setScore(0);
    setDetectedNote(null);
    setCountdown(null);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSwarColor = (item: SwarItem) => {
    if (item.status === 'success') return 'bg-green-500';
    if (item.status === 'partial') return 'bg-yellow-500';
    if (item.status === 'fail') return 'bg-red-500';
    return 'bg-slate-300';
  };

  if (songs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No Songs Available</h3>
          <p className="text-yellow-700">
            Please go to the "Practice Songs" tab and add or create some songs first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Play Along</h2>
        <p className="text-slate-600">Play each swar as it appears on screen</p>
      </div>

      {!selectedSong ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => startPlayAlong(song)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 border-2 border-transparent transition-all text-left"
            >
              <h3 className="font-semibold text-slate-800 mb-2">{song.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{song.notes}</p>
              <span className={`
                inline-block px-2 py-1 rounded text-xs font-medium
                ${song.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  song.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {song.difficulty}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {countdown !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-full w-48 h-48 flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <p className="text-6xl font-bold text-blue-600">{countdown}</p>
                  <p className="text-lg text-slate-600 mt-2">Get Ready!</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedSong.title}</h3>
            <p className="text-slate-600 mb-4">Follow the scrolling notes and play along with your flute</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-700 font-medium">Time</p>
                <p className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-700 font-medium">Correct</p>
                <p className="text-2xl font-bold text-green-600">{successCount}/{swars.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-700 font-medium">Score</p>
                <p className="text-2xl font-bold text-purple-600">{score}</p>
              </div>
            </div>

            {detectedNote && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700 font-medium">Detected Note</p>
                <p className="text-xl font-bold text-blue-600">{detectedNote}</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${detectedConfidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4">Song Sequence</h4>
            <div className="relative h-32 bg-slate-50 rounded-lg overflow-hidden border-2 border-slate-200">
              <div className="absolute top-0 left-1/2 w-1 h-full bg-blue-500 transform -translate-x-1/2 z-10" />

              <div className="flex items-center justify-center h-full space-x-2 px-4 overflow-x-auto">
                {swars.map((item, idx) => (
                  <div
                    key={idx}
                    className={`
                      flex-shrink-0 px-4 py-3 rounded-lg font-bold text-white transition-all
                      ${idx === currentSwarIndex ? 'scale-110 shadow-lg' : 'opacity-60'}
                      ${getSwarColor(item)}
                    `}
                  >
                    {item.swar}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={countdown !== null}
              className={`
                py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors
                ${isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-slate-300'
                }
              `}
            >
              {isListening ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Start Listening</span>
                </>
              )}
            </button>

            <button
              onClick={resetPlayAlong}
              className="bg-slate-500 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Back to Songs</span>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How to play:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Click "Start Listening" to begin (3-second countdown will appear)</li>
              <li>Play each swar when it reaches the center line</li>
              <li>Green = Correct, Yellow = Partially correct, Red = Incorrect</li>
              <li>Your score increases for each correct match</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Songs now support custom timing! Each note can have different durations to match real song rhythms.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4">Detailed Feedback</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {swars.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="font-bold text-lg w-8">{idx + 1}</span>
                    <span className="font-semibold text-slate-800">{item.swar}</span>
                    {item.played && (
                      <span className="text-sm text-slate-600">→ You played: {item.played}</span>
                    )}
                  </div>
                  <div className={`
                    w-4 h-4 rounded-full
                    ${item.status === 'success' ? 'bg-green-500' :
                      item.status === 'partial' ? 'bg-yellow-500' :
                      item.status === 'fail' ? 'bg-red-500' :
                      'bg-slate-300'}
                  `} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

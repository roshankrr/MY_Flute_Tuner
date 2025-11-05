import { useEffect, useState } from 'react';
import { Trophy, Zap, Target, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Swar } from '../types';
import { playAudioFromUrl } from '../utils/audioUtils';

export default function PracticeGame() {
  const [swars, setSwars] = useState<Swar[]>([]);
  const [currentSwar, setCurrentSwar] = useState<Swar | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const sessionId = useState(() => `session-${Date.now()}`)[0];

  useEffect(() => {
    loadSwars();
    loadHighScore();
  }, []);

  const loadSwars = async () => {
    try {
      const { data, error } = await supabase
        .from('swars')
        .select('*')
        .eq('pitch', 'mid')
        .not('audio_url', 'is', null);

      if (error) throw error;
      setSwars(data || []);
    } catch (error) {
      console.error('Error loading swars:', error);
    }
  };

  const loadHighScore = async () => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('score')
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setHighScore(data.score);
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  };

  const playRandomSwar = async () => {
    if (swars.length === 0) {
      alert('Please record some swars first in the "Tune Swars" tab!');
      return;
    }

    setFeedback(null);
    const randomSwar = swars[Math.floor(Math.random() * swars.length)];
    setCurrentSwar(randomSwar);
    setIsPlaying(true);

    try {
      await playAudioFromUrl(randomSwar.audio_url!);
    } catch (error) {
      console.error('Error playing swar:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleGuess = async (guessedSwar: Swar) => {
    if (!currentSwar || isPlaying) return;

    const isCorrect = guessedSwar.id === currentSwar.id;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);

      if (newScore > highScore) {
        setHighScore(newScore);
        await saveScore(newScore, newStreak);
      }

      setTimeout(() => {
        playRandomSwar();
      }, 800);
    } else {
      setStreak(0);
      setTimeout(() => {
        setFeedback(null);
        setCurrentSwar(null);
      }, 1500);
    }
  };

  const saveScore = async (finalScore: number, finalStreak: number) => {
    try {
      await supabase.from('game_scores').insert({
        score: finalScore,
        streak: finalStreak,
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setCurrentSwar(null);
    setFeedback(null);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
    playRandomSwar();
  };

  if (swars.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No Swars Recorded Yet</h3>
          <p className="text-yellow-700">
            Please go to the "Tune Swars" tab and record your flute sounds before starting the practice game.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm text-slate-600">Score</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{score}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm text-slate-600">Streak</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{streak}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-sm text-slate-600">High Score</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{highScore}</div>
          </div>
        </div>

        {!gameStarted ? (
          <div className="text-center bg-white p-12 rounded-xl shadow-sm">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Swar Recognition Game</h2>
            <p className="text-slate-600 mb-8">
              Listen to the swar and guess which one it is. Build your streak and beat your high score!
            </p>
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        ) : (
          <>
            <div className="text-center bg-white p-8 rounded-xl shadow-sm mb-6">
              <h3 className="text-xl font-semibold text-slate-700 mb-4">
                {currentSwar ? 'Which swar is this?' : 'Click "Play Swar" to begin!'}
              </h3>
              <button
                onClick={playRandomSwar}
                disabled={isPlaying}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all
                  ${isPlaying
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  }
                `}
              >
                {isPlaying ? 'Playing...' : currentSwar ? 'Play Again' : 'Play Swar'}
              </button>
            </div>

            {currentSwar && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="text-center text-slate-600 font-medium mb-4">Select your answer:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {swars.map((swar) => (
                    <button
                      key={swar.id}
                      onClick={() => handleGuess(swar)}
                      disabled={feedback !== null}
                      className={`
                        p-4 rounded-lg font-bold text-lg transition-all
                        ${feedback === 'correct' && swar.id === currentSwar.id
                          ? 'bg-green-500 text-white scale-105'
                          : feedback === 'wrong' && swar.id === currentSwar.id
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }
                        disabled:cursor-not-allowed
                      `}
                    >
                      {swar.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {feedback && (
              <div className={`
                mt-6 p-4 rounded-lg text-center font-semibold text-lg
                ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}>
                {feedback === 'correct' ? '✓ Correct! Great job!' : `✗ Wrong! It was ${currentSwar?.name}`}
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={resetGame}
                className="inline-flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Game
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

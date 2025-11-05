import { useState } from 'react';
import { Music2, Gamepad2, Settings, BookOpen, Zap, Radio } from 'lucide-react';
import SwarLibrary from './components/SwarLibrary';
import PracticeGame from './components/PracticeGame';
import TuneSwars from './components/TuneSwars';
import PracticeSongs from './components/PracticeSongs';
import PlayAlong from './components/PlayAlong';
import Tuner from './components/Tuner';

type Tab = 'library' | 'game' | 'tune' | 'songs' | 'playalong' | 'tuner';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('library');

  const tabs = [
    { id: 'library' as Tab, name: 'Swar Library', icon: Music2 },
    { id: 'tuner' as Tab, name: 'Tuner', icon: Radio },
    { id: 'game' as Tab, name: 'Practice Game', icon: Gamepad2 },
    { id: 'tune' as Tab, name: 'Tune Swars', icon: Settings },
    { id: 'songs' as Tab, name: 'Practice Songs', icon: BookOpen },
    { id: 'playalong' as Tab, name: 'Play Along', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Music2 className="w-10 h-10 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Flute Learning Hub</h1>
              <p className="text-slate-600">Master the art of flute playing</p>
            </div>
          </div>

          <nav className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'library' && <SwarLibrary />}
        {activeTab === 'tuner' && <Tuner />}
        {activeTab === 'game' && <PracticeGame />}
        {activeTab === 'tune' && <TuneSwars />}
        {activeTab === 'songs' && <PracticeSongs />}
        {activeTab === 'playalong' && <PlayAlong />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-600">
          <p>Practice regularly and enjoy your flute learning journey!</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

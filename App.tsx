
import React, { useState, useRef } from 'react';
import { AppStatus, AnalysisResult } from './types';
import { analyzeForm, generateSpeech, decodeBase64, decodeAudioData } from './services/geminiService';
import { Camera, Upload, Play, Volume2, Loader2, RefreshCcw, Info, Trophy, Target, Dumbbell, Sparkles, Share2, Check } from 'lucide-react';

const SAMPLES = [
  { id: 'ideal', label: '理想的', url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&q=80&w=800' },
  { id: 'back', label: '後傾', url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=800' },
  { id: 'stride', label: 'オーバーストライド', url: 'https://images.unsplash.com/photo-1530143311094-34d807799e8f?auto=format&fit=crop&q=80&w=800' },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setStatus(AppStatus.IDLE);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectSample = (url: string) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
          setStatus(AppStatus.IDLE);
          setAnalysis(null);
        };
        reader.readAsDataURL(blob);
      });
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    
    setStatus(AppStatus.ANALYZING);
    setAnalysis(null);
    setError(null);

    try {
      const base64Data = selectedImage.split(',')[1];
      const result = await analyzeForm(base64Data);
      setAnalysis(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError('分析中にエラーが発生しました。インターネット接続や画像形式を確認してください。');
      setStatus(AppStatus.ERROR);
    }
  };

  const playAnalysisAudio = async () => {
    if (!analysis || isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      const fullText = `まずはフォームの改善アドバイスです。${analysis.advice}。次に、おすすめの練習メニューです。${analysis.training}`;
      const base64Audio = await generateSpeech(fullText);
      const audioData = decodeBase64(base64Audio);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const buffer = await decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start();
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
      alert('音声の生成に失敗しました。');
    }
  };

  const handleShare = async () => {
    if (!analysis) return;

    const shareText = `【フォームチェッカー診断結果】\n\n■アドバイス\n${analysis.advice}\n\n■特訓ドリル\n${analysis.training}\n\n#フォームチェッカー #ランニング #AIコーチ`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'フォームチェッカー診断結果',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (err) {
        alert('クリップボードへのコピーに失敗しました。');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-sky-500 p-2 rounded-lg">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">フォームチェッカー</h1>
        </div>
        <div className="flex items-center gap-2">
          {status === AppStatus.SUCCESS && analysis && (
            <>
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all font-bold shadow-md active:scale-95 ${
                  showCopySuccess ? 'bg-green-500 text-white' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                }`}
              >
                {showCopySuccess ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                <span className="hidden sm:inline">{showCopySuccess ? 'コピー完了' : '共有'}</span>
              </button>
              <button 
                onClick={playAnalysisAudio}
                disabled={isPlayingAudio}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-bold ${
                  isPlayingAudio 
                    ? 'bg-orange-100 text-orange-400 cursor-not-allowed' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg active:scale-95'
                }`}
              >
                {isPlayingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                <span className="hidden md:inline">解説を聴く</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Inputs */}
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-white">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <Camera className="w-6 h-6 text-sky-500" />
                フォーム画像を入力
              </h2>

              <div className="relative group aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center transition-all hover:border-sky-400 hover:bg-slate-50">
                {selectedImage ? (
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-8">
                    <div className="bg-white p-5 rounded-full inline-block mb-4 shadow-sm">
                      <Upload className="w-10 h-10 text-sky-500" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg">画像をアップロード</p>
                    <p className="text-sm text-slate-400 mt-2">カメラで直接撮影も可能です</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-slate-400 mb-3 ml-1 uppercase tracking-wider">サンプル画像で試す</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLES.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => selectSample(sample.url)}
                      className="px-4 py-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-xl text-sm font-bold transition-all border border-slate-200 hover:border-sky-200"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={!selectedImage || status === AppStatus.ANALYZING}
                className={`w-full mt-8 py-4 md:py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl uppercase tracking-tighter ${
                  !selectedImage || status === AppStatus.ANALYZING
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white hover:shadow-sky-200 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {status === AppStatus.ANALYZING ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Target className="w-7 h-7" />
                    AI診断を開始
                  </>
                )}
              </button>
            </div>

            <div className="bg-sky-100/50 p-5 rounded-2xl border border-sky-100 flex gap-4 backdrop-blur-sm">
              <div className="bg-sky-500 p-1.5 rounded-lg h-fit">
                <Info className="w-5 h-5 text-white shrink-0" />
              </div>
              <div className="text-sm text-sky-900 leading-relaxed">
                <p className="font-bold mb-1">より正確な分析のために：</p>
                <ul className="list-disc list-inside space-y-1 text-sky-800 opacity-90">
                  <li>足が地面に着いた瞬間を撮影</li>
                  <li>真横、全身が入るように撮影</li>
                  <li>明るい場所でブレないように</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Right Column: Results */}
          <section className="space-y-6 lg:sticky lg:top-24">
            {(status === AppStatus.IDLE || status === AppStatus.ANALYZING) && !analysis && (
              <div className="bg-white rounded-3xl p-12 shadow-xl border border-white flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                <div className="relative">
                  <div className="absolute -inset-4 bg-sky-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative bg-sky-50 p-8 rounded-full mb-8">
                    <Sparkles className="w-16 h-16 text-sky-300" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">
                  {status === AppStatus.ANALYZING ? "プロコーチが画像を確認中" : "AIコーチが待機しています"}
                </h3>
                <p className="text-slate-400 max-w-sm font-medium leading-relaxed">
                  {status === AppStatus.ANALYZING 
                    ? "姿勢、関節の角度、重心バランスを計算しています。少々お待ちください。" 
                    : "画像をアップロードして分析を開始しましょう。あなたのフォームを科学的に解析します。"}
                </p>
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-red-800 flex flex-col items-center gap-6 shadow-lg">
                <div className="bg-red-100 p-4 rounded-full">
                  <RefreshCcw className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-bold text-lg text-center leading-relaxed">{error}</p>
                <button 
                  onClick={runAnalysis}
                  className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-95"
                >
                  もう一度試す
                </button>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                {/* Result Card 1: Advice */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white transition-all hover:translate-y-[-4px]">
                  <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="text-white w-6 h-6" />
                      <h3 className="text-white font-black text-xl tracking-tight">フォームの改善アドバイス</h3>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-widest">Analysis</span>
                  </div>
                  <div className="p-8">
                    <p className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                      {analysis.advice}
                    </p>
                  </div>
                </div>

                {/* Result Card 2: Training */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white transition-all hover:translate-y-[-4px]">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="text-white w-6 h-6" />
                      <h3 className="text-white font-black text-xl tracking-tight">克服のための特訓ドリル</h3>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-widest">Drill</span>
                  </div>
                  <div className="p-8">
                    <p className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                      {analysis.training}
                    </p>
                  </div>
                </div>
                
                {/* Secondary Share Button at bottom of results */}
                <button 
                  onClick={handleShare}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  {showCopySuccess ? <Check className="w-6 h-6 text-green-500" /> : <Share2 className="w-6 h-6 text-sky-500" />}
                  {showCopySuccess ? '診断結果をコピーしました' : '結果をコーチや友人に共有する'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-200/50 py-10 px-4 text-center mt-12 backdrop-blur-sm">
        <p className="text-slate-500 font-bold text-sm tracking-wide">© 2024 フォームチェッカー | POWERED BY GEMINI AI</p>
      </footer>
    </div>
  );
};

export default App;

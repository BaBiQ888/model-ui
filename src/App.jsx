import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import ModelProvider from './contexts/ModelContext';
import './App.css';

// 导入模型页面组件
import TextToMusicPage from './pages/models/TextToMusicPage';
import SynthesiseDanceV6Page from './pages/models/SynthesiseDanceV6Page';
import AudioVideoSynthesisV3Page from './pages/models/AudioVideoSynthesisV3Page';
import TxtImageGenerateMusicPage from './pages/models/TxtImageGenerateMusicPage';
import RvcInferPage from './pages/models/RvcInferPage';
import TtsInferPage from './pages/models/TtsInferPage';
import Fbx2SplitBundleV6Page from './pages/models/Fbx2SplitBundleV6Page';
import SongInfoGenPage from './pages/models/SongInfoGenPage';
import MusicSeedSerialV6V2Page from './pages/models/MusicSeedSerialV6V2Page';
import LyricTimeAnalyzerPage from './pages/models/LyricTimeAnalyzerPage';
import TtsZeroShotPage from './pages/models/TtsZeroShotPage';
import Mdx23Page from './pages/models/Mdx23Page';
import TtsF5InferPage from './pages/models/TtsF5InferPage';
import MusicGamePage from './pages/models/MusicGamePage';
import SeedVcV2Page from './pages/models/SeedVcV2Page';
import RhythmMusicGamePage from './pages/models/RhythmMusicGamePage';
import InstantIdPhoto3DRealPage from './pages/models/InstantIdPhoto3DRealPage';
import ImageStyleTransferV2Page from './pages/models/ImageStyleTransferV2Page';
import InstantIdPhotoPage from './pages/models/InstantIdPhotoPage';
import FreePromptImagePage from './pages/models/FreePromptImagePage';
import FlamePage from './pages/models/FlamePage';
import ConfigurableFlamePage from './pages/models/ConfigurableFlamePage';
import AstrologyPage from './pages/models/AstrologyPage';
import GptServicePage from './pages/models/GptServicePage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
      <ModelProvider>
        <Router>
          <div className="app-container">
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/text-to-music" element={<TextToMusicPage />} />
                <Route path="/synthesise-dance-v6" element={<SynthesiseDanceV6Page />} />
                <Route path="/audio-video-synthesis-v3" element={<AudioVideoSynthesisV3Page />} />
                <Route path="/txt-image-generate-music" element={<TxtImageGenerateMusicPage />} />
                <Route path="/rvc-infer" element={<RvcInferPage />} />
                <Route path="/tts-infer" element={<TtsInferPage />} />
                <Route path="/fbx2split-bundle-v6" element={<Fbx2SplitBundleV6Page />} />
                <Route path="/song-info-gen" element={<SongInfoGenPage />} />
                <Route path="/music-seed-serial-v6-v2" element={<MusicSeedSerialV6V2Page />} />
                <Route path="/lyric-time-analyzer" element={<LyricTimeAnalyzerPage />} />
                <Route path="/tts-zero-shot" element={<TtsZeroShotPage />} />
                <Route path="/mdx23" element={<Mdx23Page />} />
                <Route path="/tts-f5-infer" element={<TtsF5InferPage />} />
                <Route path="/music-game" element={<MusicGamePage />} />
                <Route path="/seed-vc-v2" element={<SeedVcV2Page />} />
                <Route path="/rhythm-music-game" element={<RhythmMusicGamePage />} />
                <Route path="/instantid-photo-3dreal" element={<InstantIdPhoto3DRealPage />} />
                <Route path="/image-style-transfer-v2" element={<ImageStyleTransferV2Page />} />
                <Route path="/instantid-photo" element={<InstantIdPhotoPage />} />
                <Route path="/free-prompt-image" element={<FreePromptImagePage />} />
                <Route path="/flame" element={<FlamePage />} />
                <Route path="/configurable-flame" element={<ConfigurableFlamePage />} />
                <Route path="/astrology" element={<AstrologyPage />} />
                <Route path="/gpt-service" element={<GptServicePage />} />
              </Routes>
            </MainLayout>
          </div>
        </Router>
      </ModelProvider>
    </ConfigProvider>
  );
}

export default App;

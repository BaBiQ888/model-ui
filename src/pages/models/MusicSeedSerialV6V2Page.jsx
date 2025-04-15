import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Tabs, Steps, message, Collapse, Divider, Alert, Tag, Upload, Radio, Slider } from 'antd';
import { CustomerServiceOutlined, LoadingOutlined, CodeOutlined, CopyOutlined, LinkOutlined, UploadOutlined, SwapOutlined, SoundOutlined, ArrowRightOutlined, DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

// 增强样式组件
const StepsContainer = styled.div`
  margin-bottom: 32px;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
`;

const OutputCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-head {
    background-color: #fafafa;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f7ff;
    transform: translateY(-2px);
  }
`;

const InfoLabel = styled(Text)`
  display: block;
  color: #8c8c8c;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .content {
    flex: 1;
    word-break: break-word;
  }
  
  .actions {
    margin-left: 8px;
    flex-shrink: 0;
  }
`;

const AudioPlayerWrapper = styled.div`
  margin: 16px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  
  audio {
    width: 100%;
    outline: none;
  }
  
  .audio-controls {
    display: flex;
    align-items: center;
    margin-top: 8px;
  }
`;

const UploadContainer = styled.div`
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const StepContent = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

const ProcessFlowCard = styled(Card)`
  margin-top: 16px;
  margin-bottom: 24px;
  
  .step-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .step-icon {
    font-size: 24px;
    margin-right: 16px;
    color: #1890ff;
  }
  
  .step-content {
    flex: 1;
  }
  
  .step-arrow {
    font-size: 24px;
    color: #1890ff;
    margin: 0 24px;
  }
`;

const DataPanel = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

const AudioProgressContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
  
  .progress-bar {
    flex: 1;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    margin: 0 8px;
    position: relative;
    overflow: hidden;
    
    .progress {
      position: absolute;
      height: 100%;
      background: #1890ff;
      left: 0;
      top: 0;
    }
  }
`;

// 串行歌曲换声模型页面组件
const MusicSeedSerialV6V2Page = () => {
  const [form] = Form.useForm();
  const [step2Form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();

  // 获取步骤1和步骤2的模型数据
  const step1Data = getModelData('music_seed_serial_v6_v2_step1');
  const step2Data = getModelData('music_seed_serial_v6_v2_step2');

  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('input');
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 音频播放相关状态
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingVocals, setIsPlayingVocals] = useState(false);
  const [isPlayingBackingTrack, setIsPlayingBackingTrack] = useState(false);
  const [isPlayingOutput, setIsPlayingOutput] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  // 参考音频URL
  const [referenceAudioUrl, setReferenceAudioUrl] = useState('');

  // 音频元素引用
  const originalAudioRef = useRef(null);
  const vocalsAudioRef = useRef(null);
  const backingTrackAudioRef = useRef(null);
  const outputAudioRef = useRef(null);
  const referenceAudioRef = useRef(null);  // 添加参考音频引用

  // 当收到第一步结果时自动前进到第二步
  useEffect(() => {
    if (step1Data.responseData && step1Data.responseData.data && !step1Data.loading) {
      // 切换到输出标签页查看结果
      setActiveTab('output');
    }
  }, [step1Data.responseData, step1Data.loading]);

  // 当收到第二步结果时显示最终输出
  useEffect(() => {
    if (step2Data.responseData && step2Data.responseData.data && !step2Data.loading) {
      // 切换到输出标签页查看结果
      setActiveTab('output');
    }
  }, [step2Data.responseData, step2Data.loading]);

  // 当组件卸载时停止音频播放和清除响应数据
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      // 停止所有音频播放
      if (originalAudioRef.current) originalAudioRef.current.pause();
      if (vocalsAudioRef.current) vocalsAudioRef.current.pause();
      if (backingTrackAudioRef.current) backingTrackAudioRef.current.pause();
      if (outputAudioRef.current) outputAudioRef.current.pause();
      if (referenceAudioRef.current) referenceAudioRef.current.pause();

      // 组件卸载时清除响应数据
      clearResponseData('music_seed_serial_v6_v2_step1');
      clearResponseData('music_seed_serial_v6_v2_step2');
    };
  }, []);

  // 步骤1提交表单 - 文生音+拆分
  const handleStep1Submit = async (values) => {
    try {
      // 调用模型API
      await callModelApi('music_seed_serial_v6_v2_step1', {
        text: values.text
      });
    } catch (error) {
      message.error('生成歌曲并拆分失败: ' + error.message);
    }
  };

  // 步骤2提交表单 - 合成
  const handleStep2Submit = async (values) => {
    try {
      // 从第一步获取必要的参数 - 使用uiData
      const step1UIData = step1Data.responseData?.uiData;

      if (!step1UIData) {
        message.error('请先完成第一步生成');
        return;
      }

      // 检查必要参数
      if (!step1UIData.vocalsAudioUrl || !step1UIData.backingTrackUrl) {
        message.error('缺少必要的音频数据，请重新生成');
        return;
      }

      // 调用模型API
      await callModelApi('music_seed_serial_v6_v2_step2', {
        vocals_audio: step1UIData.vocalsAudioUrl,
        backing_track: step1UIData.backingTrackUrl,
        reference_audio: step1UIData.referenceAudio || referenceAudioUrl
      });
    } catch (error) {
      message.error('合成失败: ' + error.message);
    }
  };

  // 处理音量变化
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (originalAudioRef.current) originalAudioRef.current.volume = value / 100;
    if (vocalsAudioRef.current) vocalsAudioRef.current.volume = value / 100;
    if (backingTrackAudioRef.current) backingTrackAudioRef.current.volume = value / 100;
    if (outputAudioRef.current) outputAudioRef.current.volume = value / 100;
    if (referenceAudioRef.current) referenceAudioRef.current.volume = value / 100;
  };

  // 处理原始音频播放/暂停
  const toggleOriginalPlay = () => {
    if (originalAudioRef.current) {
      try {
        if (isPlayingOriginal) {
          originalAudioRef.current.pause();
          setIsPlayingOriginal(false);
        } else {
          // 暂停其他音频
          if (vocalsAudioRef.current) vocalsAudioRef.current.pause();
          if (backingTrackAudioRef.current) backingTrackAudioRef.current.pause();
          if (outputAudioRef.current) outputAudioRef.current.pause();
          setIsPlayingVocals(false);
          setIsPlayingBackingTrack(false);
          setIsPlayingOutput(false);

          // 使用 Promise 处理播放
          const playPromise = originalAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlayingOriginal(true);
              })
              .catch(error => {
                console.error('播放被中断: ', error);
                setIsPlayingOriginal(false);
              });
          }
        }
      } catch (error) {
        console.error('播放控制错误:', error);
        setIsPlayingOriginal(false);
      }
    }
  };

  // 处理人声音频播放/暂停
  const toggleVocalsPlay = () => {
    if (vocalsAudioRef.current) {
      try {
        if (isPlayingVocals) {
          vocalsAudioRef.current.pause();
          setIsPlayingVocals(false);
        } else {
          // 暂停其他音频
          if (originalAudioRef.current) originalAudioRef.current.pause();
          if (backingTrackAudioRef.current) backingTrackAudioRef.current.pause();
          if (outputAudioRef.current) outputAudioRef.current.pause();
          setIsPlayingOriginal(false);
          setIsPlayingBackingTrack(false);
          setIsPlayingOutput(false);

          // 使用 Promise 处理播放
          const playPromise = vocalsAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlayingVocals(true);
              })
              .catch(error => {
                console.error('播放被中断: ', error);
                setIsPlayingVocals(false);
              });
          }
        }
      } catch (error) {
        console.error('播放控制错误:', error);
        setIsPlayingVocals(false);
      }
    }
  };

  // 处理伴奏音频播放/暂停
  const toggleBackingTrackPlay = () => {
    if (backingTrackAudioRef.current) {
      try {
        if (isPlayingBackingTrack) {
          backingTrackAudioRef.current.pause();
          setIsPlayingBackingTrack(false);
        } else {
          // 暂停其他音频
          if (originalAudioRef.current) originalAudioRef.current.pause();
          if (vocalsAudioRef.current) vocalsAudioRef.current.pause();
          if (outputAudioRef.current) outputAudioRef.current.pause();
          setIsPlayingOriginal(false);
          setIsPlayingVocals(false);
          setIsPlayingOutput(false);

          // 使用 Promise 处理播放
          const playPromise = backingTrackAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlayingBackingTrack(true);
              })
              .catch(error => {
                console.error('播放被中断: ', error);
                setIsPlayingBackingTrack(false);
              });
          }
        }
      } catch (error) {
        console.error('播放控制错误:', error);
        setIsPlayingBackingTrack(false);
      }
    }
  };

  // 处理输出音频播放/暂停
  const toggleOutputPlay = () => {
    if (outputAudioRef.current) {
      try {
        if (isPlayingOutput) {
          outputAudioRef.current.pause();
          setIsPlayingOutput(false);
        } else {
          // 暂停其他音频
          if (originalAudioRef.current) originalAudioRef.current.pause();
          if (vocalsAudioRef.current) vocalsAudioRef.current.pause();
          if (backingTrackAudioRef.current) backingTrackAudioRef.current.pause();
          setIsPlayingOriginal(false);
          setIsPlayingVocals(false);
          setIsPlayingBackingTrack(false);

          // 使用 Promise 处理播放
          const playPromise = outputAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlayingOutput(true);
              })
              .catch(error => {
                console.error('播放被中断: ', error);
                setIsPlayingOutput(false);
              });
          }
        }
      } catch (error) {
        console.error('播放控制错误:', error);
        setIsPlayingOutput(false);
      }
    }
  };

  // 音频结束事件处理
  const handleAudioEnded = (audioType) => {
    switch (audioType) {
      case 'original':
        setIsPlayingOriginal(false);
        break;
      case 'vocals':
        setIsPlayingVocals(false);
        break;
      case 'backingTrack':
        setIsPlayingBackingTrack(false);
        break;
      case 'output':
        setIsPlayingOutput(false);
        break;
      default:
        break;
    }
  };

  // 处理参考音频上传
  const handleReferenceAudioUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      // 如果服务器返回了URL，使用服务器URL，否则使用本地URL
      const url = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setReferenceAudioUrl(url);
      step2Form.setFieldsValue({ referenceAudio: url });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 下载音频文件
  const downloadAudio = (url, fileName = '音频.mp3') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`开始下载: ${fileName}`);
  };

  // 进入第二步
  const goToStep2 = () => {
    if (step1Data.responseData?.data) {
      setCurrentStep(1);
    } else {
      message.warning('请先完成第一步生成音频并拆分');
    }
  };

  // 渲染音量控制
  const renderVolumeControl = () => (
    <div style={{ marginBottom: 16 }}>
      <Text strong>音量控制</Text>
      <Slider
        min={0}
        max={100}
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '100%' }}
      />
    </div>
  );

  // 渲染音频进度条
  const renderAudioProgress = () => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const formattedCurrentTime = formatTime(currentTime);
    const formattedDuration = formatTime(duration);

    return (
      <AudioProgressContainer>
        <Text>{formattedCurrentTime}</Text>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
        <Text>{formattedDuration}</Text>
      </AudioProgressContainer>
    );
  };

  // 格式化时间为分:秒
  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 渲染步骤1表单 - 文生音+拆分
  const renderStep1Form = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleStep1Submit}
    >
      <Alert
        message="文生音歌曲创作和拆分"
        description="请输入您想要创作的歌曲描述，AI将根据您的描述生成一首歌曲并自动拆分出人声和伴奏"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <FormSection>
        <Form.Item
          name="text"
          label="输入文本"
          rules={[{ required: true, message: '请输入文本' }]}
        >
          <TextArea
            placeholder="请输入需要生成音乐的文本描述，例如：一首关于宇航员的韩语歌曲，表达对太空的向往和未知的探索..."
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={step1Data.loading}
          icon={step1Data.loading ? <LoadingOutlined /> : <CustomerServiceOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {step1Data.loading ? "生成中..." : "生成歌曲并拆分"}
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染步骤2表单 - 合成
  const renderStep2Form = () => {
    // 检查是否有第一步的数据
    const hasStep1Data = step1Data.responseData?.uiData;

    if (!hasStep1Data) {
      return (
        <Alert
          message="请先完成第一步"
          description="需要先生成歌曲并拆分，才能进行声音转换和合成"
          type="warning"
          showIcon
        />
      );
    }

    // 从第一步提取有用的信息展示
    const { musicName, gender, language } = hasStep1Data;

    return (
      <Form
        form={step2Form}
        layout="vertical"
        onFinish={handleStep2Submit}
      >
        <Alert
          message={`即将转换 "${musicName || '歌曲'}" 的声音`}
          description={
            <Space direction="vertical">
              <Text>原始歌曲信息：{gender || ''} {language || ''}</Text>
              <Text>请上传一段参考音频，AI将使用该声音特征替换原唱声音</Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <FormSection>
          <Form.Item
            label="参考音频"
            extra="上传一段10秒以内的干净人声作为声音参考"
          >
            <UploadContainer>
              <Form.Item name="referenceAudio" noStyle>
                <Upload
                  name="file"
                  action="/api/upload" // 替换为您的上传端点
                  onChange={handleReferenceAudioUpload}
                  maxCount={1}
                  accept="audio/*"
                >
                  <Button icon={<UploadOutlined />}>上传参考音频</Button>
                </Upload>
              </Form.Item>

              {referenceAudioUrl && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>已选参考音频:</Text>
                  <audio
                    ref={referenceAudioRef}
                    src={referenceAudioUrl}
                    controls
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>
              )}
            </UploadContainer>
          </Form.Item>

          <Form.Item name="referenceAudioUrl" label="或输入参考音频URL">
            <Input
              placeholder="请输入参考音频URL"
              onChange={(e) => {
                if (e.target.value) {
                  setReferenceAudioUrl(e.target.value);
                }
              }}
            />
          </Form.Item>
        </FormSection>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={step2Data.loading}
            icon={step2Data.loading ? <LoadingOutlined /> : <SwapOutlined />}
            size="large"
            style={{ width: '100%' }}
          >
            {step2Data.loading ? "合成中..." : "合成转换"}
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 渲染步骤1结果展示
  const renderStep1Result = () => {
    // 避免在组件已卸载时继续渲染，防止循环
    if (!isMountedRef.current) return null;

    // 没有数据时显示引导信息
    if (!step1Data.responseData || !step1Data.responseData.uiData) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <CustomerServiceOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先生成歌曲并拆分</Text>
        </div>
      );
    }

    // 从响应数据中提取结果 - 使用提取后的uiData数据
    const uiData = step1Data.responseData.uiData;
    const musicUrl = uiData.musicUrl;
    const musicName = uiData.musicName;
    const vocalsAudioUrl = uiData.vocalsAudioUrl;
    const backingTrackUrl = uiData.backingTrackUrl;
    const coverImageUrl = uiData.imageUrl;

    // 从uiData中提取附加信息
    const { beat, bpm, duration, gender, language, isOriginalMusic, peopleNames, clothesNames } = uiData;

    return (
      <div>
        <OutputCard title="歌曲生成与拆分结果">
          <Alert
            message="歌曲生成并拆分成功"
            description="AI已根据您的描述生成歌曲，并将其拆分为人声和伴奏，您可以分别试听或下载。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 歌曲基本信息卡片 */}
          <Card
            style={{ marginBottom: 20 }}
            cover={
              coverImageUrl && (
                <img
                  alt={musicName}
                  src={coverImageUrl}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover'
                  }}
                />
              )
            }
          >
            <Card.Meta
              title={<Title level={4}>{musicName}</Title>}
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  {gender && <Tag color="purple">{gender}</Tag>}
                  {language && <Tag color="blue">{language}</Tag>}
                  {isOriginalMusic && <Tag color="green">原创</Tag>}
                  {peopleNames && peopleNames.length > 0 && (
                    <Text>演唱者: {peopleNames.join(', ')}</Text>
                  )}
                  {clothesNames && clothesNames.length > 0 && (
                    <Text>主题: {clothesNames.join(', ')}</Text>
                  )}
                </Space>
              }
            />
          </Card>

          {renderVolumeControl()}

          {renderAudioProgress()}

          {/* 歌曲参数信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <InfoItem>
                <InfoLabel>节拍</InfoLabel>
                <Text strong>{beat || '未知'}</Text>
              </InfoItem>
            </Col>
            <Col span={8}>
              <InfoItem>
                <InfoLabel>BPM</InfoLabel>
                <Text strong>{bpm || '未知'}</Text>
              </InfoItem>
            </Col>
            <Col span={8}>
              <InfoItem>
                <InfoLabel>时长</InfoLabel>
                <Text strong>{duration ? `${duration.toFixed(2)}秒` : '未知'}</Text>
              </InfoItem>
            </Col>
          </Row>

          {/* 原始音频播放器 */}
          <InfoItem>
            <InfoLabel>原始歌曲</InfoLabel>
            <AudioPlayerWrapper>
              <audio
                ref={originalAudioRef}
                src={musicUrl}
                onEnded={() => handleAudioEnded('original')}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                preload="metadata"
              />
              <div className="audio-controls">
                <Button
                  type={isPlayingOriginal ? "primary" : "default"}
                  icon={isPlayingOriginal ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleOriginalPlay}
                >
                  {isPlayingOriginal ? "暂停" : "播放"}
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  icon={<DownloadOutlined />}
                  onClick={() => downloadAudio(musicUrl, `${musicName || '原始歌曲'}.mp3`)}
                >
                  下载
                </Button>
              </div>
            </AudioPlayerWrapper>
          </InfoItem>

          {/* 人声音频播放器 */}
          <InfoItem>
            <InfoLabel>人声（干声）</InfoLabel>
            <AudioPlayerWrapper>
              <audio
                ref={vocalsAudioRef}
                src={vocalsAudioUrl}
                onEnded={() => handleAudioEnded('vocals')}
                preload="metadata"
              />
              <div className="audio-controls">
                <Button
                  type={isPlayingVocals ? "primary" : "default"}
                  icon={isPlayingVocals ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleVocalsPlay}
                >
                  {isPlayingVocals ? "暂停" : "播放"}
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  icon={<DownloadOutlined />}
                  onClick={() => downloadAudio(vocalsAudioUrl, `${musicName || '人声'}_vocals.mp3`)}
                >
                  下载
                </Button>
              </div>
            </AudioPlayerWrapper>
          </InfoItem>

          {/* 伴奏音频播放器 */}
          <InfoItem>
            <InfoLabel>伴奏</InfoLabel>
            <AudioPlayerWrapper>
              <audio
                ref={backingTrackAudioRef}
                src={backingTrackUrl}
                onEnded={() => handleAudioEnded('backingTrack')}
                preload="metadata"
              />
              <div className="audio-controls">
                <Button
                  type={isPlayingBackingTrack ? "primary" : "default"}
                  icon={isPlayingBackingTrack ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleBackingTrackPlay}
                >
                  {isPlayingBackingTrack ? "暂停" : "播放"}
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  icon={<DownloadOutlined />}
                  onClick={() => downloadAudio(backingTrackUrl, `${musicName || '伴奏'}_backing.mp3`)}
                >
                  下载
                </Button>
              </div>
            </AudioPlayerWrapper>
          </InfoItem>
        </OutputCard>

        <Divider />

        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={goToStep2}
          style={{ width: '100%' }}
        >
          进入下一步：合成转换
        </Button>
      </div>
    );
  };

  // 渲染步骤2结果展示
  const renderStep2Result = () => {
    // 避免在组件已卸载时继续渲染，防止循环
    if (!isMountedRef.current) return null;

    // 没有数据时显示引导信息
    if (!step2Data.responseData || !step2Data.responseData.uiData) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SwapOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先进行合成转换</Text>
        </div>
      );
    }

    // 从响应数据中提取结果
    const uiData = step2Data.responseData.uiData;
    const outputPath = uiData.outputPath;

    // 如果从第一步有数据，获取原始歌曲名称
    const originalMusicName = step1Data.responseData?.uiData?.musicName || '转换歌曲';
    const coverImageUrl = step1Data.responseData?.uiData?.imageUrl;

    return (
      <div>
        <OutputCard
          title="歌曲转换合成结果"
          cover={
            coverImageUrl && (
              <img
                alt={originalMusicName}
                src={coverImageUrl}
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  opacity: 0.8 // 稍微降低不透明度使其作为背景
                }}
              />
            )
          }
        >
          <Alert
            message="歌曲转换合成完成"
            description="已根据参考音频成功转换人声并与伴奏合成，您可以试听或下载最终音频。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {renderVolumeControl()}

          {renderAudioProgress()}

          {/* 输出音频播放器 */}
          <InfoItem>
            <InfoLabel>最终合成歌曲 - {originalMusicName}</InfoLabel>
            <AudioPlayerWrapper>
              <audio
                ref={outputAudioRef}
                src={outputPath}
                onEnded={() => handleAudioEnded('output')}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                preload="metadata"
              />
              <div className="audio-controls">
                <Button
                  type={isPlayingOutput ? "primary" : "default"}
                  icon={isPlayingOutput ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleOutputPlay}
                >
                  {isPlayingOutput ? "暂停" : "播放"}
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  icon={<DownloadOutlined />}
                  onClick={() => downloadAudio(outputPath, `${originalMusicName}_转换后.mp3`)}
                >
                  下载最终歌曲
                </Button>
              </div>
            </AudioPlayerWrapper>
          </InfoItem>

          {/* 添加比较功能 */}
          <Collapse style={{ marginTop: 16 }}>
            <Collapse.Panel header="对比原始歌曲和转换后歌曲" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="原始歌曲" size="small">
                    <audio
                      src={step1Data.responseData?.uiData?.musicUrl}
                      controls
                      style={{ width: '100%' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="转换后歌曲" size="small">
                    <audio
                      src={outputPath}
                      controls
                      style={{ width: '100%' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Collapse.Panel>
          </Collapse>
        </OutputCard>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Title level={5}>转换完成! 您可以:</Title>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => downloadAudio(outputPath, `${originalMusicName}_转换后.mp3`)}>
              下载最终歌曲
            </Button>
            <Button type="primary" onClick={() => setCurrentStep(0)}>
              创建新歌曲
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  // 渲染流程介绍
  const renderProcessFlow = () => (
    <ProcessFlowCard title="文生音串行歌曲换声流程">
      <div className="step-item">
        <div className="step-icon">
          <CustomerServiceOutlined />
        </div>
        <div className="step-content">
          <Title level={5}>步骤一：文生音 + 拆分</Title>
          <Text>根据文本生成音乐，并自动将音乐拆分为人声（干声）和伴奏两个部分</Text>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <ArrowRightOutlined className="step-arrow" />
      </div>

      <div className="step-item">
        <div className="step-icon">
          <SwapOutlined />
        </div>
        <div className="step-content">
          <Title level={5}>步骤二：声音转换 + 合成</Title>
          <Text>上传参考声音，对人声进行转换，然后与原始伴奏合成为最终歌曲</Text>
        </div>
      </div>
    </ProcessFlowCard>
  );

  // 自定义Tabs组件，使用自己的activeTab状态
  const renderTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      size="large"
      tabBarGutter={24}
      type="card"
    >
      <Tabs.TabPane tab="输入" key="input">
        <div style={{ padding: '16px 0' }}>
          {renderProcessFlow()}

          <StepsContainer>
            <Steps current={currentStep}>
              <Step title="文生音 + 拆分" description="生成歌曲并拆分" />
              <Step title="声音转换 + 合成" description="转换声音并合成" />
            </Steps>
          </StepsContainer>

          <StepContent>
            {currentStep === 0 ? renderStep1Form() : renderStep2Form()}
          </StepContent>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tab="输出" key="output">
        <div style={{ padding: '16px 0' }}>
          {currentStep === 0 ? renderStep1Result() : renderStep2Result()}
        </div>
      </Tabs.TabPane>
    </Tabs>
  );

  return (
    <Card title={
      <Space>
        <CustomerServiceOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>文生音串行歌曲换声</span>
      </Space>
    } size="large">
      {renderTabs()}
    </Card>
  );
};

export default MusicSeedSerialV6V2Page; 
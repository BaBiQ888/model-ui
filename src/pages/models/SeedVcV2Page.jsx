import React, { useState, useEffect, useRef } from 'react';
import { Form, Upload, Button, message, Progress, Slider, Typography, Card, Space, Row, Col, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Title, Text } = Typography;

// Styled components
const StepsContainer = styled.div`
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 8px;
`;

const OutputCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const AudioControlWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
`;

const VolumeControlContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;
  
  .ant-slider {
    flex: 1;
    margin: 0 12px;
  }
`;

const SeedVcV2Page = () => {
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const { callModelApi, getModelData } = useModel();

  // Step 1 state
  const [originalAudio, setOriginalAudio] = useState(null);
  const [vocalsAudio, setVocalsAudio] = useState(null);
  const [backingTrack, setBackingTrack] = useState(null);

  // Step 2 state
  const [referenceAudio, setReferenceAudio] = useState(null);
  const [outputAudio, setOutputAudio] = useState(null);

  // Audio playback state
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingVocal, setIsPlayingVocal] = useState(false);
  const [isPlayingBacking, setIsPlayingBacking] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isPlayingOutput, setIsPlayingOutput] = useState(false);
  const [volume, setVolume] = useState(80);

  // Audio element refs
  const originalAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);
  const backingAudioRef = useRef(null);
  const referenceAudioRef = useRef(null);
  const outputAudioRef = useRef(null);

  // Handle original audio upload
  const handleOriginalUpload = (info) => {
    const { status, name } = info.file;
    if (status === 'done') {
      message.success(`${name} 上传成功`);
      if (info.file.originFileObj) {
        const fileUrl = URL.createObjectURL(info.file.originFileObj);
        setOriginalAudio(fileUrl);
      }
    } else if (status === 'error') {
      message.error(`${name} 上传失败`);
    }
  };

  // Handle reference audio upload
  const handleReferenceUpload = (info) => {
    const { status, name } = info.file;
    if (status === 'done') {
      message.success(`${name} 上传成功`);
      if (info.file.originFileObj) {
        const fileUrl = URL.createObjectURL(info.file.originFileObj);
        setReferenceAudio(fileUrl);
      }
    } else if (status === 'error') {
      message.error(`${name} 上传失败`);
    }
  };

  // Volume control
  const handleVolumeChange = (value) => {
    setVolume(value);

    // Update volume for all audio elements
    if (originalAudioRef.current) originalAudioRef.current.volume = value / 100;
    if (vocalAudioRef.current) vocalAudioRef.current.volume = value / 100;
    if (backingAudioRef.current) backingAudioRef.current.volume = value / 100;
    if (referenceAudioRef.current) referenceAudioRef.current.volume = value / 100;
    if (outputAudioRef.current) outputAudioRef.current.volume = value / 100;
  };

  // Play/pause toggle
  const togglePlay = (audioRef, isPlaying, setIsPlaying) => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle ended event
  const handleEnded = (audioRef, setIsPlaying) => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  // Initialize volume
  const initVolume = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  };

  // Set up audio event listeners
  useEffect(() => {
    // Set audio ended handlers
    handleEnded(originalAudioRef, setIsPlayingOriginal);
    handleEnded(vocalAudioRef, setIsPlayingVocal);
    handleEnded(backingAudioRef, setIsPlayingBacking);
    handleEnded(referenceAudioRef, setIsPlayingReference);
    handleEnded(outputAudioRef, setIsPlayingOutput);

    // Initialize volume for all audio elements
    initVolume(originalAudioRef);
    initVolume(vocalAudioRef);
    initVolume(backingAudioRef);
    initVolume(referenceAudioRef);
    initVolume(outputAudioRef);

    return () => {
      // Clean up event listeners
      if (originalAudioRef.current) originalAudioRef.current.onended = null;
      if (vocalAudioRef.current) vocalAudioRef.current.onended = null;
      if (backingAudioRef.current) backingAudioRef.current.onended = null;
      if (outputAudioRef.current) outputAudioRef.current.onended = null;
      if (referenceAudioRef.current) referenceAudioRef.current.onended = null;
    };
  }, [originalAudioRef, vocalAudioRef, backingAudioRef, outputAudioRef, referenceAudioRef, volume]);

  // Handle form submission for Step 1
  const handleStep1Submit = async (values) => {
    try {
      const { originalFile } = values;

      if (!originalFile || !originalFile.file) {
        message.error('请上传原始音频文件');
        return;
      }

      // 构建请求参数
      const formData = new FormData();
      formData.append('server_id', '99');
      formData.append('music_name', originalFile.file.name || 'music');

      if (originalFile.file) {
        formData.append('audio', originalFile.file);
      }

      // 调用模型API
      await callModelApi('seed_vc_v2_step1', formData);

      // 获取响应数据
      const modelData = getModelData('seed_vc_v2_step1');
      const { responseData } = modelData;

      if (responseData && responseData.data) {
        const { vocals_audio, backing_track } = responseData.data;

        // 设置音频URL
        setVocalsAudio(vocals_audio);
        setBackingTrack(backing_track);

        message.success('音频分离成功');
      }
    } catch (error) {
      message.error('提交失败: ' + error.message);
    }
  };

  // Handle form submission for Step 2
  const handleStep2Submit = async (values) => {
    try {
      const { referenceFile } = values;

      if (!referenceFile || !referenceFile.file) {
        message.error('请上传参考音频文件');
        return;
      }

      if (!vocalsAudio || !backingTrack) {
        message.error('请先完成步骤1');
        return;
      }

      // 构建请求参数
      const formData = new FormData();
      formData.append('server_id', '100');
      formData.append('vocals_audio', vocalsAudio);
      formData.append('backing_track', backingTrack);

      if (referenceFile.file) {
        formData.append('reference_audio', referenceFile.file);
      } else if (referenceAudio) {
        formData.append('reference_audio', referenceAudio);
      }

      // 调用模型API
      await callModelApi('seed_vc_v2_step2', formData);

      // 获取响应数据
      const modelData = getModelData('seed_vc_v2_step2');
      const { responseData } = modelData;

      if (responseData && responseData.data) {
        const { output_path } = responseData.data;

        // 设置音频URL
        setOutputAudio(output_path);

        message.success('合成成功');
      }
    } catch (error) {
      message.error('提交失败: ' + error.message);
    }
  };

  // Download audio file
  const downloadAudio = (url, filename) => {
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render volume control
  const renderVolumeControl = () => {
    return (
      <VolumeControlContainer>
        <Text>音量:</Text>
        <Slider
          value={volume}
          onChange={handleVolumeChange}
          min={0}
          max={100}
        />
        <Text>{volume}%</Text>
      </VolumeControlContainer>
    );
  };

  // Render Step 1 form
  const renderStep1Form = () => {
    const modelData = getModelData('seed_vc_v2_step1');
    const { loading } = modelData || { loading: false };

    return (
      <FormSection>
        <Title level={4}>步骤 1: 分离音频</Title>
        <Text type="secondary">上传原始音频文件，系统将分离出人声和伴奏</Text>

        <Form
          form={form1}
          layout="vertical"
          onFinish={handleStep1Submit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="originalFile"
            label="原始音频"
            rules={[{ required: true, message: '请上传原始音频文件' }]}
          >
            <Upload
              name="audio"
              accept="audio/*"
              maxCount={1}
              onChange={handleOriginalUpload}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>上传音频文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              提交
            </Button>
          </Form.Item>
        </Form>
      </FormSection>
    );
  };

  // Render Step 1 results
  const renderStep1Results = () => {
    if (!vocalsAudio && !backingTrack) return null;

    return (
      <FormSection>
        <Title level={4}>步骤 1 结果</Title>

        {renderVolumeControl()}

        <OutputCard title="原始音频">
          <AudioControlWrapper>
            <Button
              shape="circle"
              icon={isPlayingOriginal ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePlay(originalAudioRef, isPlayingOriginal, setIsPlayingOriginal)}
              disabled={!originalAudio}
            />
            <audio ref={originalAudioRef} src={originalAudio} />
            <Text ellipsis style={{ flex: 1 }}>{originalAudio || '未上传原始音频'}</Text>
            {originalAudio && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadAudio(originalAudio, '原始音频.mp3')}
              >
                下载
              </Button>
            )}
          </AudioControlWrapper>
        </OutputCard>

        <OutputCard title="人声">
          <AudioControlWrapper>
            <Button
              shape="circle"
              icon={isPlayingVocal ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePlay(vocalAudioRef, isPlayingVocal, setIsPlayingVocal)}
            />
            <audio ref={vocalAudioRef} src={vocalsAudio} />
            <Text ellipsis style={{ flex: 1 }}>{vocalsAudio}</Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAudio(vocalsAudio, '人声.mp3')}
            >
              下载
            </Button>
          </AudioControlWrapper>
        </OutputCard>

        <OutputCard title="伴奏">
          <AudioControlWrapper>
            <Button
              shape="circle"
              icon={isPlayingBacking ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePlay(backingAudioRef, isPlayingBacking, setIsPlayingBacking)}
            />
            <audio ref={backingAudioRef} src={backingTrack} />
            <Text ellipsis style={{ flex: 1 }}>{backingTrack}</Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAudio(backingTrack, '伴奏.mp3')}
            >
              下载
            </Button>
          </AudioControlWrapper>
        </OutputCard>
      </FormSection>
    );
  };

  // Render Step 2 form
  const renderStep2Form = () => {
    const modelData = getModelData('seed_vc_v2_step2');
    const { loading } = modelData || { loading: false };

    // Disable step 2 if step 1 is not completed
    const isStep1Completed = vocalsAudio && backingTrack;

    return (
      <FormSection>
        <Title level={4}>步骤 2: 音频合成</Title>
        <Text type="secondary">
          上传参考人声音频，系统将根据参考音频的声音特征，合成新的人声并与伴奏合并
        </Text>

        <Form
          form={form2}
          layout="vertical"
          onFinish={handleStep2Submit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="referenceFile"
            label="参考人声音频"
            rules={[{ required: true, message: '请上传参考人声音频文件' }]}
          >
            <Upload
              name="reference"
              accept="audio/*"
              maxCount={1}
              onChange={handleReferenceUpload}
              beforeUpload={() => false}
              disabled={!isStep1Completed}
            >
              <Button
                icon={<UploadOutlined />}
                disabled={!isStep1Completed}
              >
                上传参考音频文件
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!isStep1Completed}
            >
              合成
            </Button>
          </Form.Item>
        </Form>
      </FormSection>
    );
  };

  // Render Step 2 results
  const renderStep2Results = () => {
    if (!outputAudio) return null;

    return (
      <FormSection>
        <Title level={4}>步骤 2 结果</Title>

        <OutputCard title="参考人声">
          <AudioControlWrapper>
            <Button
              shape="circle"
              icon={isPlayingReference ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePlay(referenceAudioRef, isPlayingReference, setIsPlayingReference)}
              disabled={!referenceAudio}
            />
            <audio ref={referenceAudioRef} src={referenceAudio} />
            <Text ellipsis style={{ flex: 1 }}>{referenceAudio || '参考人声'}</Text>
            {referenceAudio && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadAudio(referenceAudio, '参考人声.mp3')}
              >
                下载
              </Button>
            )}
          </AudioControlWrapper>
        </OutputCard>

        <OutputCard title="合成结果">
          <AudioControlWrapper>
            <Button
              shape="circle"
              icon={isPlayingOutput ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePlay(outputAudioRef, isPlayingOutput, setIsPlayingOutput)}
            />
            <audio ref={outputAudioRef} src={outputAudio} />
            <Text ellipsis style={{ flex: 1 }}>{outputAudio}</Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAudio(outputAudio, '合成结果.mp3')}
            >
              下载
            </Button>
          </AudioControlWrapper>
        </OutputCard>
      </FormSection>
    );
  };

  return (
    <StepsContainer>
      <Title level={3}>歌曲换声v2</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        上传您的歌曲，使用AI将其分离为人声和伴奏，然后将人声替换为您指定的参考人声，生成新的歌曲。
      </Text>

      {/* Step 1 */}
      {renderStep1Form()}
      {renderStep1Results()}

      {/* Step 2 */}
      {renderStep2Form()}
      {renderStep2Results()}
    </StepsContainer>
  );
};

export default SeedVcV2Page; 
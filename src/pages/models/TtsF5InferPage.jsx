import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Tabs, message, Upload, Radio, Divider, Alert, Slider, Select, Checkbox } from 'antd';
import { SoundOutlined, LoadingOutlined, UploadOutlined, CopyOutlined, DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// 样式组件
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

const AudioPlayer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  .play-button {
    font-size: 36px;
    cursor: pointer;
    color: #1890ff;
    margin-right: 16px;
  }
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  
  .volume-slider {
    width: 100px;
    margin: 0 8px;
  }
`;

const AudioVisual = styled.div`
  height: 40px;
  background: #e6f7ff;
  border-radius: 4px;
  margin-top: 16px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${props => props.progress || 0}%;
    height: 100%;
    background: rgba(24, 144, 255, 0.2);
    transition: width 0.3s linear;
  }
`;

const ReferenceAudioItem = styled(Card)`
  margin-bottom: 8px;
  cursor: pointer;
  border: ${props => props.selected ? '2px solid #1890ff' : '1px solid #f0f0f0'};
  
  &:hover {
    border-color: #1890ff;
  }
`;

// 样本音频列表，如果有特定的音频，可以在apiConfig中添加
const SAMPLE_REFERENCE_AUDIOS = [
  {
    id: "卢天惠",
    name: "卢天惠",
    url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/卢天惠.wav"
  },
  {
    id: "王承渲",
    name: "王承渲",
    url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/王承渲.wav"
  },
  {
    id: "许杨玉琢",
    name: "许杨玉琢",
    url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/许杨玉琢.wav"
  }
];

// 单人推理模型页面组件
const TtsF5InferPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('tts_f5_infer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioProgress, setAudioProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('input');
  const [audioSource, setAudioSource] = useState('preset');
  const [audioFile, setAudioFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_REFERENCE_AUDIOS[0]?.id || '');
  const audioRef = useRef(null);
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
    }
  }, [responseData, loading]);

  // 组件挂载和卸载时的处理
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      // 组件卸载时停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // 组件卸载时清除当前模型的响应数据
      clearResponseData('tts_f5_infer');
    };
  }, []); // 空依赖数组，仅在挂载和卸载时执行

  // 处理音频播放结束事件
  const handleAudioEnded = () => {
    if (!isMountedRef.current) return;
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // 处理音频时间更新事件
  const handleTimeUpdate = () => {
    if (!isMountedRef.current || !audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setAudioProgress(progress);
  };

  // 处理参考音频来源变更
  const handleAudioSourceChange = (e) => {
    setAudioSource(e.target.value);
    setAudioFile(null);
    form.resetFields(['refAudioUrl', 'refAudioFile']);
  };

  // 处理预设参考音频选择
  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    form.setFieldsValue({ refId: presetId });
  };

  // 处理文件上传
  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      setAudioFile(info.file.originFileObj);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      let refAudioBase64 = null;

      // 如果选择了自定义参考音频
      if (audioSource === 'custom') {
        if (values.refAudioUrl) {
          // 使用URL
          refAudioBase64 = values.refAudioUrl;
        } else if (audioFile) {
          // 使用上传的文件，转换为Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioFile);

          refAudioBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = reader.result.split(',')[1]; // 去掉前缀如 "data:audio/mp3;base64,"
              resolve(base64);
            };
            reader.onerror = reject;
          });
        } else {
          message.error('请提供参考音频URL或上传音频文件');
          return;
        }
      } else if (audioSource === 'preset') {
        // 使用预设音频
        const preset = SAMPLE_REFERENCE_AUDIOS.find(item => item.id === selectedPreset);
        if (preset) {
          refAudioBase64 = preset.url;
        } else {
          message.error('请选择预设参考音频');
          return;
        }
      }

      // 准备请求参数
      const params = {
        ref_id: values.refId || selectedPreset,
        infer_text: values.inferText,
        ref_audio_base64: refAudioBase64,
        model_name: values.modelName,
        ref_text: values.refText,
        purifier: values.purifier,
        speed: values.speed
      };

      // 调用API
      await callModelApi('tts_f5_infer', params);
      message.success('语音合成请求已提交');
    } catch (error) {
      message.error('语音合成失败: ' + error.message);
    }
  };

  // 播放/暂停音频
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("播放失败:", err);
          message.error("音频播放失败，请重试");
        });
    }
  };

  // 处理音量变化
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  // 下载生成的音频
  const downloadAudio = (audioData, fileName = '合成语音.mp3') => {
    try {
      if (!audioData) {
        message.error('无法下载，音频数据为空');
        return;
      }

      // 判断是URL还是Base64
      if (audioData.startsWith('http')) {
        // 处理URL
        const link = document.createElement('a');
        link.href = audioData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // 处理Base64
        const binary = atob(audioData.replace(/\s/g, ''));
        const len = binary.length;
        const buffer = new ArrayBuffer(len);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < len; i++) {
          view[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      message.success('下载已开始');
    } catch (error) {
      console.error('下载音频失败:', error);
      message.error('下载音频失败，请重试');
    }
  };

  // 获取音频URL（处理Base64或URL）
  const getAudioUrl = (audioData) => {
    if (!audioData) return '';

    // 判断是否为URL
    if (audioData.startsWith('http')) {
      return audioData;
    }

    // 如果是Base64，转换为可播放的URL
    return `data:audio/mp3;base64,${audioData}`;
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        refId: selectedPreset,
        modelName: 'e2-tts',
        purifier: false,
        speed: 1.0
      }}
    >
      <FormSection>
        <Title level={5}>参考音频设置</Title>
        <Form.Item>
          <Radio.Group onChange={handleAudioSourceChange} value={audioSource}>
            <Radio value="preset">使用预设音频</Radio>
            <Radio value="custom">自定义参考音频</Radio>
          </Radio.Group>
        </Form.Item>

        {audioSource === 'preset' && (
          <Form.Item
            name="refId"
            label="选择预设参考音频"
            rules={[{ required: true, message: '请选择预设参考音频' }]}
          >
            <Row gutter={[16, 16]}>
              {SAMPLE_REFERENCE_AUDIOS.map(audio => (
                <Col span={8} key={audio.id}>
                  <ReferenceAudioItem
                    size="small"
                    onClick={() => handlePresetSelect(audio.id)}
                    selected={selectedPreset === audio.id}
                    hoverable
                  >
                    <Space>
                      <SoundOutlined />
                      <span>{audio.name}</span>
                    </Space>
                  </ReferenceAudioItem>
                </Col>
              ))}
            </Row>
          </Form.Item>
        )}

        {audioSource === 'custom' && (
          <>
            <Form.Item
              name="refId"
              label="参考音频ID"
              rules={[{ required: true, message: '请输入参考音频ID' }]}
            >
              <Input placeholder="请输入参考音频的标识ID，用于后续引用相同音频" />
            </Form.Item>

            <Form.Item label="参考音频" required>
              <Radio.Group defaultValue="url">
                <Radio value="url">音频URL</Radio>
                <Radio value="upload">上传音频文件</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="refAudioUrl"
              label="参考音频URL"
              rules={[{ required: audioSource === 'custom', message: '请输入参考音频URL' }]}
            >
              <Input placeholder="请输入参考音频的URL地址" />
            </Form.Item>

            <Form.Item
              name="refAudioFile"
              label="上传参考音频文件"
              valuePropName="fileList"
              getValueFromEvent={e => e && e.fileList}
            >
              <Upload
                name="audioFile"
                maxCount={1}
                beforeUpload={file => {
                  // 限制文件类型和大小
                  const isAudio =
                    file.type.startsWith('audio/') ||
                    /\.(wav|mp3|mp4|ogg|aac|flac|amr|m4a)$/i.test(file.name);

                  if (!isAudio) {
                    message.error('只能上传音频文件！支持格式：wav, mp3, mp4, ogg, aac, flac, amr, m4a');
                    return Upload.LIST_IGNORE;
                  }

                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    message.error('音频文件必须小于10MB！');
                    return Upload.LIST_IGNORE;
                  }

                  return false; // 阻止自动上传
                }}
                onChange={handleFileUpload}
              >
                <Button icon={<UploadOutlined />}>上传参考音频</Button>
                <Text type="secondary" style={{ marginLeft: 8 }}>支持格式：wav, mp3, mp4, ogg, aac, flac, amr, m4a</Text>
              </Upload>
            </Form.Item>

            <Form.Item
              name="refText"
              label="参考音频文本"
              extra="可选，不填则自动识别。如果参考音频中有多语言，建议填写对应文本以提升效果"
            >
              <TextArea
                placeholder="请输入参考音频中包含的文本内容"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
          </>
        )}
      </FormSection>

      <FormSection>
        <Title level={5}>合成设置</Title>
        <Form.Item
          name="inferText"
          label="待合成文本"
          rules={[{ required: true, message: '请输入待合成文本' }]}
        >
          <TextArea
            placeholder="请输入需要转换为语音的文本内容"
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="modelName"
          label="模型选择"
        >
          <Radio.Group>
            <Radio value="e2-tts">E2-TTS (质量优先)</Radio>
            <Radio value="f5-tts">F5-TTS (速度优先)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="speed"
          label="语速调整"
          extra="调整生成语音的速度，默认为1.0"
        >
          <Slider
            min={0.5}
            max={2.0}
            step={0.1}
            defaultValue={1.0}
            marks={{
              0.5: '慢',
              1.0: '正常',
              2.0: '快'
            }}
          />
        </Form.Item>

        <Form.Item
          name="purifier"
          valuePropName="checked"
          extra="启用后会对参考音频进行降噪处理，提升合成质量"
        >
          <Checkbox>启用降噪处理</Checkbox>
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? "语音合成中..." : "开始合成语音"}
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    // 避免在组件已卸载时继续输出日志和渲染，防止循环
    if (!isMountedRef.current) return null;

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交文本进行语音合成</Text>
        </div>
      );
    }

    // 从响应数据中提取音频
    const audioData = responseData.data?.data?.infer_file_base64;

    if (!audioData) {
      return (
        <Alert
          message="合成失败"
          description="未能获取到合成的音频数据，请检查参数后重试"
          type="error"
          showIcon
        />
      );
    }

    return (
      <div>
        <OutputCard title="合成结果">
          <Alert
            message="语音合成成功"
            description="系统已成功合成语音，您可以播放或下载"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <AudioPlayer>
            <audio
              ref={audioRef}
              src={getAudioUrl(audioData)}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
              style={{ display: 'none' }}
            />

            <PlayerControls>
              <div
                className="play-button"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              </div>

              <Text>{isPlaying ? '暂停' : '播放'}</Text>

              <VolumeControl>
                <Text>音量:</Text>
                <Slider
                  className="volume-slider"
                  min={0}
                  max={100}
                  onChange={handleVolumeChange}
                  value={volume}
                />
                <Text>{volume}%</Text>
              </VolumeControl>
            </PlayerControls>

            <AudioVisual progress={audioProgress} />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadAudio(audioData)}
              >
                下载音频
              </Button>
            </div>
          </AudioPlayer>
        </OutputCard>

        <Divider />

        <Title level={5}>语音合成详情</Title>
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong>参考音频ID: </Text>
              <Text>{responseData.requestData?.ref_id || '未指定'}</Text>
            </Col>
            <Col span={24}>
              <Text strong>合成文本: </Text>
              <Paragraph>{responseData.requestData?.infer_text}</Paragraph>
            </Col>
            <Col span={12}>
              <Text strong>使用模型: </Text>
              <Text>{responseData.requestData?.model_name || 'e2-tts'}</Text>
            </Col>
            <Col span={12}>
              <Text strong>语速: </Text>
              <Text>{responseData.requestData?.speed || '1.0'}</Text>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // 自定义Tabs组件
  const CustomTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      size="large"
      tabBarGutter={24}
      type="card"
    >
      <Tabs.TabPane tab="输入" key="input">
        <div style={{ padding: '16px 0' }}>
          {renderInputForm()}
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tab="输出" key="output">
        <div style={{ padding: '16px 0' }}>
          {renderOutputDisplay()}
        </div>
      </Tabs.TabPane>
    </Tabs>
  );

  return (
    <Card title={
      <Space>
        <SoundOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>单人推理(TTS F5)</span>
      </Space>
    } size="large">
      <Paragraph>
        使用参考音频，将文本转换为与参考音色相似的语音。支持两种模型：E2-TTS(质量优先)和F5-TTS(速度优先)。
      </Paragraph>
      <CustomTabs />
    </Card>
  );
};

export default TtsF5InferPage;

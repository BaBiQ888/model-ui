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

// 声音克隆模型页面组件
const TtsZeroShotPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('tts_zero_shot');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioProgress, setAudioProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('input');
  const [audioSource, setAudioSource] = useState('preset');
  const [audioFile, setAudioFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(MODEL_RESOURCES.tts_zero_shot.sampleReferenceAudios[0]?.id || '');
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
      clearResponseData('tts_zero_shot');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

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
        // 使用预设参考音频
        const preset = MODEL_RESOURCES.tts_zero_shot.sampleReferenceAudios.find(item => item.id === selectedPreset);
        if (preset) {
          refAudioBase64 = preset.url;
        } else {
          message.error('请选择参考音频');
          return;
        }
      }

      // 构建请求参数
      const params = {
        ref_id: values.refId || selectedPreset,
        infer_text: values.inferText,
        ref_audio_base64: refAudioBase64,
        ref_text: values.refText,
        purifier: values.purifier,
        infer_language: values.inferLanguage || 'zh',
        ref_language: values.refLanguage || 'zh',
        text_split_method: values.textSplitMethod || 'cut3',
        speed_factor: values.speedFactor || 1.0
      };

      // 调用模型API
      await callModelApi('tts_zero_shot', params);
    } catch (error) {
      message.error('声音克隆失败: ' + error.message);
    }
  };

  // 切换音频播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // 调整音量
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  // 下载音频
  const downloadAudio = (audioData, fileName = '克隆语音.mp3') => {
    try {
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
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      message.success('音频下载已开始');
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
        inferLanguage: 'zh',
        refLanguage: 'zh',
        textSplitMethod: 'cut3',
        speedFactor: 1.0,
        purifier: false
      }}
    >
      <FormSection>
        <Title level={5}>参考音频设置</Title>
        <Form.Item label="参考音频来源" required>
          <Radio.Group onChange={handleAudioSourceChange} value={audioSource}>
            <Radio value="preset">使用预设音频</Radio>
            <Radio value="custom">自定义音频</Radio>
          </Radio.Group>
        </Form.Item>

        {audioSource === 'preset' ? (
          <>
            <Form.Item
              name="refId"
              label="选择参考音频"
              rules={[{ required: true, message: '请选择参考音频' }]}
            >
              <Select placeholder="请选择参考音频">
                {MODEL_RESOURCES.tts_zero_shot.sampleReferenceAudios.map(audio => (
                  <Option key={audio.id} value={audio.id}>{audio.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={[16, 16]}>
              {MODEL_RESOURCES.tts_zero_shot.sampleReferenceAudios.map(audio => (
                <Col span={12} key={audio.id}>
                  <ReferenceAudioItem
                    size="small"
                    title={audio.name}
                    selected={selectedPreset === audio.id}
                    onClick={() => handlePresetSelect(audio.id)}
                  >
                    <audio
                      src={audio.url}
                      controls
                      style={{ width: '100%' }}
                    />
                  </ReferenceAudioItem>
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <>
            <Form.Item
              name="refAudioUrl"
              label="参考音频URL"
              extra="输入参考音频的URL地址"
            >
              <Input placeholder="请输入参考音频URL，支持MP3、WAV等格式" />
            </Form.Item>
            <Text type="secondary">-- 或者 --</Text>
            <Form.Item
              name="refAudioFile"
              label="上传参考音频文件"
              valuePropName="fileList"
              getValueFromEvent={e => e && e.fileList}
            >
              <Upload
                name="refAudioFile"
                maxCount={1}
                beforeUpload={file => {
                  // 限制文件类型和大小
                  const isAudio = file.type.startsWith('audio/');
                  if (!isAudio) {
                    message.error('只能上传音频文件！');
                    return Upload.LIST_IGNORE;
                  }

                  const isLt20M = file.size / 1024 / 1024 < 20;
                  if (!isLt20M) {
                    message.error('音频文件必须小于20MB！');
                    return Upload.LIST_IGNORE;
                  }

                  setAudioFile(file);
                  return false; // 阻止自动上传
                }}
                onChange={handleFileUpload}
              >
                <Button icon={<UploadOutlined />}>上传音频文件</Button>
                <Text type="secondary" style={{ marginLeft: 8 }}>支持MP3、WAV等格式，大小不超过20MB</Text>
              </Upload>
            </Form.Item>
          </>
        )}

        <Form.Item
          name="refText"
          label="参考音频文本"
          tooltip="不填写则自动识别参考音频中的文本"
        >
          <Input placeholder="参考音频对应的文本内容（可选）" />
        </Form.Item>
      </FormSection>

      <FormSection>
        <Title level={5}>合成文本设置</Title>
        <Form.Item
          name="inferText"
          label="待合成文本"
          rules={[{ required: true, message: '请输入需要合成的文本' }]}
        >
          <TextArea
            placeholder="请输入需要转为语音的文本内容"
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="inferLanguage"
              label="文本语种"
              tooltip="输入文本的语言类型"
            >
              <Select>
                {MODEL_RESOURCES.tts_zero_shot.languages.map(lang => (
                  <Option key={lang.id} value={lang.value}>{lang.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="refLanguage"
              label="参考音频语种"
              tooltip="参考音频的语言类型"
            >
              <Select>
                {MODEL_RESOURCES.tts_zero_shot.languages.map(lang => (
                  <Option key={lang.id} value={lang.value}>{lang.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="textSplitMethod"
              label="文本切割方式"
              tooltip="控制合成时文本的切割方式"
            >
              <Select>
                {MODEL_RESOURCES.tts_zero_shot.textSplitMethods.map(method => (
                  <Option key={method.id} value={method.value}>{method.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="speedFactor"
              label="语速"
              tooltip="控制生成语音的速度因子，1.0为正常速度"
            >
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                marks={{
                  0.5: '慢',
                  1: '正常',
                  2: '快'
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="purifier"
          valuePropName="checked"
          tooltip="是否对参考音频进行降噪处理"
        >
          <Checkbox>去背景去噪</Checkbox>
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
          {loading ? "克隆中..." : "开始声音克隆"}
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
          <Text type="secondary" style={{ display: 'block' }}>请先提交文本进行声音克隆</Text>
        </div>
      );
    }

    // 从响应数据中提取结果
    const audioData = responseData.data?.data?.infer_file_base64;
    const audioUrl = getAudioUrl(audioData);
    const requestData = responseData.requestData || {};

    return (
      <div>
        <OutputCard title="克隆结果">
          <Alert
            message="声音克隆成功"
            description="系统已成功克隆参考音频的声音特征并完成文本朗读"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="合成信息">
                <Row gutter={[8, 8]}>
                  <Col span={8}><Text strong>参考音频：</Text></Col>
                  <Col span={16}><Text>{requestData.ref_id || '未指定'}</Text></Col>

                  <Col span={8}><Text strong>输入文本：</Text></Col>
                  <Col span={16}><Paragraph ellipsis={{ rows: 2, expandable: true }}>{requestData.infer_text}</Paragraph></Col>

                  <Col span={8}><Text strong>文本语种：</Text></Col>
                  <Col span={16}><Text>{requestData.infer_language || '中英混合(zh)'}</Text></Col>

                  <Col span={8}><Text strong>语速：</Text></Col>
                  <Col span={16}><Text>{requestData.speed_factor || '1.0'}</Text></Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <AudioPlayer>
                <Title level={5}>合成音频</Title>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  onTimeUpdate={handleTimeUpdate}
                  style={{ display: 'none' }}
                />

                <PlayerControls>
                  {isPlaying ? (
                    <PauseCircleOutlined className="play-button" onClick={togglePlay} />
                  ) : (
                    <PlayCircleOutlined className="play-button" onClick={togglePlay} />
                  )}

                  <Text>{isPlaying ? '正在播放...' : '点击播放'}</Text>

                  <VolumeControl>
                    <SoundOutlined />
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

                <Space style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadAudio(audioData)}
                  >
                    下载音频
                  </Button>
                </Space>
              </AudioPlayer>
            </Col>
          </Row>
        </OutputCard>
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
        <span>声音克隆(TTS Zero Shot)</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default TtsZeroShotPage; 
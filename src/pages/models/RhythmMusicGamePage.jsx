import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Upload, Card, Typography, Row, Col, Tabs, Space, Divider, Alert, message, Select } from 'antd';
import {
  SoundOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  FileOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// 样式组件
const FormSection = styled.div`
  margin-bottom: 24px;
  background-color: #fafafa;
  padding: 24px;
  border-radius: 8px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const AudioPlayerContainer = styled.div`
  margin: 16px 0;
  padding: 16px;
  background-color: #f6f6f6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AudioVisualizer = styled.div`
  width: 100%;
  height: 80px;
  background-color: #e8f4ff;
  margin: 16px 0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
`;

const PlayButton = styled(Button)`
  margin: 0 8px;
`;

const ResultCard = styled(Card)`
  margin-top: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const BeatMapVisualizer = styled.div`
  width: 100%;
  height: 400px;
  background-color: #000;
  margin: 16px 0;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
`;

const BeatMapCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const ActionButton = styled(Button)`
  margin: 4px;
`;

/**
 * 节奏音乐游戏谱面生成页面组件
 */
const RhythmMusicGamePage = () => {
  // 表单和状态
  const [form] = Form.useForm();
  const { callModelApi, getModelData } = useModel();
  const { loading, responseData } = getModelData('rhythm_music_game');
  const [activeTab, setActiveTab] = useState('input');
  const [audioSource, setAudioSource] = useState('preset');
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const beatMapData = useRef(null);

  // 当收到响应数据时切换到输出标签页
  useEffect(() => {
    if (responseData && !loading) {
      setActiveTab('output');
      // 如果有节拍数据，初始化可视化
      if (responseData.data?.result) {
        try {
          beatMapData.current = JSON.parse(responseData.data.result);
          initBeatMapVisualizer();
        } catch (error) {
          console.error('无法解析节拍数据:', error);
        }
      }
    }
  }, [responseData, loading]);

  // 组件卸载时停止音频播放
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // 初始化节拍图可视化
  const initBeatMapVisualizer = () => {
    if (!canvasRef.current || !beatMapData.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const beats = beatMapData.current.notes || [];

    // 绘制节拍图背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制节拍线
    ctx.fillStyle = '#3f87ff';
    beats.forEach(beat => {
      const x = (beat.time / beatMapData.current.duration) * canvas.width;
      const height = 10 + (beat.intensity || 1) * 20;
      ctx.fillRect(x, canvas.height - height, 3, height);
    });
  };

  // 切换音频源类型
  const handleAudioSourceChange = (value) => {
    setAudioSource(value);
    setAudioUrl('');
    form.setFieldsValue({ audioUrl: '', audioFile: undefined });
  };

  // 处理文件上传
  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      setAudioUrl(URL.createObjectURL(info.file.originFileObj));
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    let audioData = '';

    if (audioSource === 'url') {
      audioData = values.audioUrl;
    } else if (audioSource === 'upload' && values.audioFile && values.audioFile.file) {
      audioData = await fileToBase64(values.audioFile.file.originFileObj);
    }

    if (!audioData) {
      message.error('请提供有效的音频数据');
      return;
    }

    try {
      await callModelApi('rhythm_music_game', {
        data: audioData,
        version: values.version || '1'
      });
    } catch (error) {
      message.error('生成节奏谱面失败: ' + error.message);
    }
  };

  // 将文件转换为Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  // 音频播放结束处理
  const handleAudioEnded = () => {
    // 不再需要设置播放状态
    // setIsPlaying(false);
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 下载文件
  const downloadFile = (url, fileName = '节拍谱面.json') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Title level={4}>音频来源</Title>
        <Form.Item name="audioSource" initialValue={audioSource}>
          <Select onChange={handleAudioSourceChange} value={audioSource}>
            <Option value="url">音频URL</Option>
            <Option value="upload">上传音频文件</Option>
          </Select>
        </Form.Item>

        {audioSource === 'url' ? (
          <Form.Item
            name="audioUrl"
            label="音频URL"
            rules={[{ required: true, message: '请输入音频URL' }]}
          >
            <Input
              placeholder="请输入音频文件URL"
              onChange={(e) => setAudioUrl(e.target.value)}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="audioFile"
            label="上传音频文件"
            valuePropName="file"
            rules={[{ required: true, message: '请上传音频文件' }]}
          >
            <Upload
              name="audio"
              listType="text"
              beforeUpload={() => false}
              onChange={handleFileUpload}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>上传音频文件 (MP3格式)</Button>
            </Upload>
          </Form.Item>
        )}

        {audioUrl && (
          <AudioPlayerContainer>
            <Text>预览音频</Text>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              controls
              style={{ width: '100%', marginTop: '10px' }}
            />
          </AudioPlayerContainer>
        )}

        <Form.Item
          name="version"
          label="谱面版本"
          initialValue="1"
        >
          <Select>
            <Option value="1">标准版本</Option>
            <Option value="2">高级版本</Option>
          </Select>
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SoundOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? "生成中..." : "生成节奏谱面"}
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <FileOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交表单生成节奏谱面</Text>
        </div>
      );
    }

    const resultData = responseData.data;
    const resultUrl = resultData.result;

    return (
      <div>
        <Alert
          message="节奏谱面生成成功"
          description="节奏谱面已成功生成，您可以下载谱面文件或查看可视化效果"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <StyledCard title="节奏谱面可视化">
              <BeatMapVisualizer>
                {beatMapData.current ? (
                  <BeatMapCanvas ref={canvasRef} width="800" height="400" />
                ) : (
                  <Text>无法显示节拍可视化</Text>
                )}
              </BeatMapVisualizer>
            </StyledCard>
          </Col>

          <Col span={24}>
            <StyledCard title="音频预览">
              {audioUrl && (
                <AudioPlayerContainer>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    controls
                    style={{ width: '100%' }}
                  />
                </AudioPlayerContainer>
              )}
            </StyledCard>
          </Col>

          <Col span={24}>
            <StyledCard title="谱面文件">
              <Row align="middle" gutter={[16, 16]}>
                <Col span={24}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>谱面文件地址：</Text>
                    <Paragraph
                      ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                      style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}
                    >
                      {resultUrl}
                    </Paragraph>
                    <Space>
                      <ActionButton
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile(resultUrl, '节奏谱面.json')}
                      >
                        下载谱面文件
                      </ActionButton>
                      <ActionButton
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(resultUrl)}
                      >
                        复制链接
                      </ActionButton>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </StyledCard>
          </Col>
        </Row>
      </div>
    );
  };

  // 自定义Tabs组件
  const CustomTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      tabBarGutter={10}
      items={[
        {
          key: 'input',
          label: '输入',
          children: (
            <div style={{ padding: '16px 0' }}>
              {renderInputForm()}
            </div>
          )
        },
        {
          key: 'output',
          label: '输出',
          children: (
            <div style={{ padding: '16px 0' }}>
              {renderOutputDisplay()}
            </div>
          )
        }
      ]}
    />
  );

  return (
    <Card title={
      <Space>
        <SoundOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>节奏音乐游戏谱面生成</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default RhythmMusicGamePage; 
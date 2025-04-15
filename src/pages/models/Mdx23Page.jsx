import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Tabs, Upload, Radio, Divider, Alert, Spin, List, App } from 'antd';
import {
  SoundOutlined,
  LoadingOutlined,
  UploadOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileImageOutlined,
  PictureOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { Text, Title, Paragraph } = Typography;

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

const TrackItem = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-head {
    background-color: ${props => props.color || '#f9f9f9'};
    border-bottom: none;
  }
  
  .ant-card-head-title {
    color: ${props => props.textColor || '#000'};
  }
  
  .track-card-content {
    padding: 16px;
  }
  
  .track-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
`;

const CardIcon = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.bgColor || '#e6f7ff'};
  margin-right: 8px;
  
  .icon {
    color: ${props => props.iconColor || '#1890ff'};
    font-size: 18px;
  }
`;

const UploadHint = styled.div`
  background-color: #f0f7ff;
  padding: 12px;
  margin-top: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  border-left: 4px solid #1890ff;
  
  .hint-icon {
    color: #1890ff;
    font-size: 18px;
    margin-right: 12px;
  }
`;

const UploadDragger = styled(Upload.Dragger)`
  .ant-upload-drag {
    border-color: #d9d9d9;
    background: #fafafa;
    transition: all 0.3s;
  }
  
  .ant-upload-drag:hover {
    border-color: #1890ff;
  }
  
  .upload-hint {
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    margin-top: 8px;
  }
`;

// 歌曲分轨模型页面组件
const Mdx23Page = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('mdx23');
  const [audioFile, setAudioFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundType, setBackgroundType] = useState('1'); // 默认使用绿色背景
  const [activeTab, setActiveTab] = useState('input');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const { message: messageApi } = App.useApp(); // 使用 App 上下文中的 message API
  // 添加一个ref来跟踪组件是否已卸载和是否已经切换标签页
  const isMountedRef = useRef(true);
  const hasTabSwitched = useRef(false);
  const audioNameRef = useRef('');

  // 音轨图标和颜色配置
  const trackConfig = {
    bass: { icon: <SoundOutlined />, color: '#91d5ff', textColor: '#003a8c', iconColor: '#1890ff', bgColor: '#e6f7ff' },
    drums: { icon: <SoundOutlined />, color: '#b7eb8f', textColor: '#135200', iconColor: '#52c41a', bgColor: '#f6ffed' },
    instrum: { icon: <SoundOutlined />, color: '#87e8de', textColor: '#006d75', iconColor: '#13c2c2', bgColor: '#e6fffb' },
    vocals: { icon: <SoundOutlined />, color: '#ffadd2', textColor: '#c41d7f', iconColor: '#eb2f96', bgColor: '#fff0f6' },
    other: { icon: <SoundOutlined />, color: '#d9d9d9', textColor: '#434343', iconColor: '#595959', bgColor: '#f5f5f5' },
  };

  // 当收到结果时切换到输出页签 - 优化以防止循环更新
  useEffect(() => {
    if (isMountedRef.current && responseData && !loading && !hasTabSwitched.current) {
      hasTabSwitched.current = true;
      setActiveTab('output');

      // 从结果中提取轨道信息
      const tracks = ['bass', 'drums', 'instrum', 'vocals', 'other'];
      // 找到第一个存在的轨道作为默认选择
      for (const track of tracks) {
        if (responseData.data?.[track]) {
          setSelectedTrack(track);
          break;
        }
      }
    }

    // 如果没有响应数据，重置切换标记
    if (!responseData) {
      hasTabSwitched.current = false;
    }
  }, [responseData, loading]);

  // 当activeTab变化时，处理状态
  useEffect(() => {
    if (activeTab === 'input' && responseData) {
      // 重置切换标记，允许下次提交后再次自动切换
      hasTabSwitched.current = false;

      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [activeTab, responseData]);

  // 当组件挂载和卸载时处理 - 减少依赖项避免不必要的重渲染
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      // 组件卸载时清除当前模型的响应数据
      clearResponseData('mdx23');

      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []); // 空依赖数组，确保仅在组件挂载和卸载时执行

  // 处理背景类型变更
  const handleBackgroundTypeChange = useCallback((e) => {
    setBackgroundType(e.target.value);
    // 只有在选择自定义背景时才需要上传背景图片
    if (e.target.value !== 'custom') {
      setBackgroundFile(null);
      form.resetFields(['backgroundFile']);
    }
  }, [form]);

  // 处理音频文件上传前的验证 - 提取为独立函数
  const beforeAudioUpload = useCallback((file) => {
    // 限制文件类型和大小
    const isAudio = file.type.startsWith('audio/');
    if (!isAudio) {
      messageApi.error('只能上传音频文件！');
      return Upload.LIST_IGNORE;
    }

    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      messageApi.error('音频文件必须小于20MB！');
      return Upload.LIST_IGNORE;
    }

    // 保存文件名以便后续使用
    audioNameRef.current = file.name;

    return false; // 阻止自动上传
  }, [messageApi]);

  // 处理图片文件上传前的验证 - 提取为独立函数
  const beforeImageUpload = useCallback((file) => {
    // 限制文件类型和大小
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error('图片文件必须小于5MB！');
      return Upload.LIST_IGNORE;
    }

    return false; // 阻止自动上传
  }, [messageApi]);

  // 处理音频文件上传
  const handleFileUpload = useCallback((info) => {
    if (info.file.status === 'done') {
      messageApi.success(`${info.file.name} 上传成功`);
      setAudioFile(info.file.originFileObj);
      // 手动设置表单值，确保验证通过
      form.setFieldsValue({ audioFile: info.fileList });
    } else if (info.file.status === 'error') {
      messageApi.error(`${info.file.name} 上传失败`);
    } else if (info.file.status === 'removed') {
      setAudioFile(null);
    }
  }, [messageApi, form]);

  // 处理背景图片上传
  const handleBackgroundUpload = useCallback((info) => {
    if (info.file.status === 'done') {
      messageApi.success(`${info.file.name} 上传成功`);
      setBackgroundFile(info.file.originFileObj);
      // 手动设置表单值
      form.setFieldsValue({ backgroundFile: info.fileList });
    } else if (info.file.status === 'error') {
      messageApi.error(`${info.file.name} 上传失败`);
    } else if (info.file.status === 'removed') {
      setBackgroundFile(null);
    }
  }, [messageApi, form]);

  // 文件转Base64函数
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // 去掉前缀如 "data:audio/mp3;base64,"
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      if (!audioFile) {
        messageApi.error('请上传音频文件');
        return;
      }

      // 读取音频文件为Base64
      const audioBase64 = await fileToBase64(audioFile);

      // 处理背景设置
      let bgValue;
      if (backgroundType === '1' || backgroundType === '2') {
        // 使用预设背景
        bgValue = backgroundType;
      } else if (backgroundType === 'custom') {
        // 使用自定义背景
        if (backgroundFile) {
          bgValue = await fileToBase64(backgroundFile);
        } else {
          messageApi.warning('未选择自定义背景图片，将使用默认绿色背景');
          bgValue = '1';
        }
      } else {
        // 默认使用绿色背景
        bgValue = '1';
      }

      // 重置标签切换标记
      hasTabSwitched.current = false;

      // 调用模型API
      await callModelApi('mdx23', {
        audio: audioBase64,
        bg: bgValue,
        audio_name: audioNameRef.current // 添加音频文件名，便于后续文件管理
      });
    } catch (error) {
      messageApi.error('歌曲分轨失败: ' + error.message);
    }
  }, [audioFile, backgroundFile, backgroundType, callModelApi, fileToBase64, messageApi]);

  // 播放指定音轨
  const playTrack = useCallback((trackKey) => {
    if (selectedTrack === trackKey && isPlaying) {
      // 如果当前正在播放这个音轨，则暂停
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // 如果当前没在播放或者正在播放其他音轨，则切换到这个音轨
      setSelectedTrack(trackKey);

      // 获取音频数据
      const trackData = responseData?.data?.[trackKey];
      if (!trackData) {
        messageApi.error(`获取${trackKey}音轨数据失败`);
        return;
      }

      // 设置音频源并播放
      if (audioRef.current) {
        audioRef.current.src = getAudioUrl(trackData);
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("播放失败:", err);
            messageApi.error("音频播放失败，请重试");
          });
      }
    }
  }, [selectedTrack, isPlaying, responseData, messageApi]);

  // 下载音轨
  const downloadTrack = useCallback((trackData, trackName) => {
    try {
      if (!trackData) {
        messageApi.error(`获取${trackName}音轨数据失败`);
        return;
      }

      const fileName = audioNameRef.current
        ? `${trackName}_${audioNameRef.current}`
        : `${trackName}.mp3`;

      // 判断是URL还是Base64
      if (trackData.startsWith('http')) {
        // 处理URL
        const link = document.createElement('a');
        link.href = trackData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        messageApi.success(`${trackName || '音轨'}下载已开始`);
      } else {
        // 处理Base64
        const byteCharacters = atob(trackData);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });

        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        messageApi.success(`${trackName || '音轨'}下载已开始`);
      }
    } catch (error) {
      console.error('下载音轨失败:', error);
      messageApi.error('下载音轨失败，请重试');
    }
  }, [messageApi]);

  // 处理音频播放结束事件
  const handleAudioEnded = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsPlaying(false);
  }, []);

  // 获取音频URL（处理Base64或URL）
  const getAudioUrl = useCallback((audioData) => {
    if (!audioData) return '';

    // 判断是否为URL
    if (typeof audioData === 'string' && audioData.startsWith('http')) {
      return audioData;
    }

    // 如果是Base64，转换为可播放的URL
    try {
      // 检查是否已经是data URL
      if (typeof audioData === 'string' && audioData.startsWith('data:')) {
        return audioData;
      }
      return `data:audio/mp3;base64,${audioData}`;
    } catch (error) {
      console.error('音频数据格式不正确:', error);
      return '';
    }
  }, []);

  // 处理标签页切换
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
  }, []);

  // 渲染输入表单
  const renderInputForm = useCallback(() => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Title level={5}>音频设置</Title>
        <Form.Item
          name="audioFile"
          label="上传音频文件"
          rules={[{ required: true, message: '请上传音频文件' }]}
          valuePropName="fileList"
          getValueFromEvent={e => {
            if (Array.isArray(e)) {
              return e;
            }
            return e && e.fileList;
          }}
          // 添加自定义验证器以防止已选择文件但验证失败的情况
          validateFirst={true}
        >
          <UploadDragger
            name="audioFile"
            maxCount={1}
            beforeUpload={beforeAudioUpload}
            onChange={handleFileUpload}
            onRemove={() => {
              setAudioFile(null);
              return true;
            }}
          >
            <p className="ant-upload-drag-icon">
              <SoundOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽上传音频文件</p>
            <p className="upload-hint">支持MP3、WAV等格式，大小不超过20MB</p>
          </UploadDragger>
        </Form.Item>

        <UploadHint>
          <SoundOutlined className="hint-icon" />
          <div>
            <Text strong>提示：</Text>
            <Text>上传时请选择音质较好的音频文件，以获得更好的分轨效果。分轨过程可能需要较长时间，请耐心等待。</Text>
          </div>
        </UploadHint>
      </FormSection>

      <FormSection>
        <Title level={5}>背景设置</Title>
        <Form.Item
          name="backgroundType"
          label="背景类型"
          initialValue={backgroundType}
        >
          <Radio.Group onChange={handleBackgroundTypeChange} value={backgroundType}>
            {MODEL_RESOURCES.mdx23.backgroundOptions.map(option => (
              <Radio key={option.id} value={option.value}>{option.name}</Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {backgroundType === 'custom' && (
          <Form.Item
            name="backgroundFile"
            label="上传背景图片"
            valuePropName="fileList"
            getValueFromEvent={e => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
            rules={[{ required: backgroundType === 'custom', message: '请上传背景图片' }]}
          >
            <Upload
              name="backgroundFile"
              maxCount={1}
              listType="picture"
              beforeUpload={beforeImageUpload}
              onChange={handleBackgroundUpload}
              onRemove={() => {
                setBackgroundFile(null);
                return true;
              }}
            >
              <Button icon={<PictureOutlined />}>上传背景图片</Button>
              <Text type="secondary" style={{ marginLeft: 8 }}>支持JPG、PNG等格式，大小不超过5MB</Text>
            </Upload>
          </Form.Item>
        )}
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
          size="large"
          style={{ width: '100%' }}
          disabled={!audioFile && !loading}
        >
          {loading ? "分轨处理中..." : "开始歌曲分轨"}
        </Button>
      </Form.Item>
    </Form>
  ), [
    form,
    handleSubmit,
    loading,
    backgroundType,
    handleBackgroundTypeChange,
    beforeAudioUpload,
    beforeImageUpload,
    handleFileUpload,
    handleBackgroundUpload,
    audioFile
  ]);

  // 渲染输出展示
  const renderOutputDisplay = useCallback(() => {
    // 避免在组件已卸载时继续输出日志和渲染，防止循环
    if (!isMountedRef.current) return null;

    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交音频文件进行分轨</Text>
        </div>
      );
    }

    // 从响应数据中提取各个音轨
    const data = responseData.data;
    const tracks = ['bass', 'drums', 'instrum', 'vocals', 'other'];
    const availableTracks = tracks.filter(track => !!data[track]);

    if (availableTracks.length === 0) {
      return (
        <Alert
          message="处理结果异常"
          description="未找到有效的音轨数据，请重新尝试"
          type="warning"
          showIcon
          action={
            <Button type="primary" size="small" onClick={() => setActiveTab('input')}>
              返回重试
            </Button>
          }
        />
      );
    }

    return (
      <div>
        <OutputCard title="分轨结果">
          <Alert
            message="歌曲分轨成功"
            description="系统已成功将歌曲分离成多个音轨，您可以单独播放和下载各音轨"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 隐藏的音频播放器用于控制 */}
          <audio
            ref={audioRef}
            style={{ display: 'none' }}
            onEnded={handleAudioEnded}
            controls
          />

          <Row gutter={[16, 16]}>
            {availableTracks.map(trackKey => {
              const trackInfo = trackConfig[trackKey];
              const trackValue = data[trackKey];
              const trackName = MODEL_RESOURCES.mdx23.trackTypes.find(t => t.id === trackKey)?.name || trackKey;

              return (
                <Col xs={24} md={12} key={trackKey}>
                  <TrackItem
                    title={
                      <Space>
                        <CardIcon bgColor={trackInfo.bgColor} iconColor={trackInfo.iconColor}>
                          <span className="icon">{trackInfo.icon}</span>
                        </CardIcon>
                        <span>{trackName}</span>
                      </Space>
                    }
                    color={trackInfo.color}
                    textColor={trackInfo.textColor}
                  >
                    <div className="track-card-content">
                      <div>已成功提取{trackName}</div>
                      <div className="track-actions">
                        <Space>
                          <Button
                            type="primary"
                            icon={(selectedTrack === trackKey && isPlaying) ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={() => playTrack(trackKey)}
                          >
                            {(selectedTrack === trackKey && isPlaying) ? '暂停' : '播放'}
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => downloadTrack(trackValue, trackName)}
                          >
                            下载
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </TrackItem>
                </Col>
              );
            })}
          </Row>
        </OutputCard>
      </div>
    );
  }, [responseData, selectedTrack, isPlaying, playTrack, downloadTrack, handleAudioEnded]);

  return (
    <Card title={
      <Space>
        <SoundOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>歌曲分轨(MDX23)</span>
      </Space>
    } size="large">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
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
    </Card>
  );
};

export default Mdx23Page; 
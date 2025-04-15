import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, Typography, Upload, Card, Space, Tabs, Radio, Collapse, message, Alert } from 'antd';
import { UploadOutlined, SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, LoadingOutlined, CodeOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 增强样式组件
const AudioPlayer = styled.div`
  margin-top: 24px;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const AudioPlayerControls = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const PlayButton = styled(Button)`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .anticon {
    font-size: 24px;
  }
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

const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
`;

const DataPanel = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

const BeatChartContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  position: relative;
  min-height: 200px;
`;

const BeatMarker = styled.div`
  position: absolute;
  width: 2px;
  height: 100%;
  background-color: ${props => props.active ? '#ff4d4f' : '#1890ff'};
  left: ${props => props.position}%;
  top: 0;
  opacity: ${props => props.active ? 1 : 0.7};
`;

const VisualizeContainer = styled.div`
  width: 100%;
  height: 120px;
  margin-top: 16px;
  background: #000;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
`;

// 歌曲节拍打谱模型页面组件
const MusicGamePage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('music_game');
  const [audioSource, setAudioSource] = useState('url');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const audioRef = useRef(null);
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
      // 如果有节拍数据，解析并设置 (注释掉未使用的代码)
      if (responseData.data?.data?.result) {
        try {
          // 这里假设返回的是JSON格式的节拍数据
          // 实际使用时可能需要根据返回数据格式调整
          // setBeatData(JSON.parse(responseData.data.result));
          console.log("节拍数据URL:", responseData.data.result);
        } catch (error) {
          console.error("解析节拍数据失败:", error);
        }
      }
    }
  }, [responseData, loading]);

  // 组件挂载和卸载时的处理
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // 组件卸载时清除当前模型的响应数据
      clearResponseData('music_game');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 音频源类型变更
  const handleAudioSourceChange = (e) => {
    setAudioSource(e.target.value);
    // 修改setSelectedFile调用，使用空字符串代替null
    // setSelectedFile(null);
    form.setFieldsValue({ audioUrl: '', audioFile: null });
  };

  // 文件上传处理
  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      // 注释掉对setSelectedFile的调用
      // setSelectedFile(info.file.originFileObj);
      // 可能需要将文件转为URL或base64
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      let audioData;

      if (audioSource === 'url') {
        // 使用URL
        audioData = values.audioUrl;
      } else {
        // 使用上传文件，这需要将文件上传到服务器或转为base64
        message.warning('当前仅支持URL方式，文件上传功能开发中');
        return;
      }

      // 调用模型API
      await callModelApi('music_game', {
        data: audioData,
        version: values.version || 1
      });
    } catch (error) {
      message.error('生成节拍谱面失败: ' + error.message);
    }
  };

  // 音频结束处理
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
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
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ version: 1, audioSource: 'url' }}
    >
      <FormSection>
        <Form.Item label="音频来源" name="audioSource">
          <Radio.Group onChange={handleAudioSourceChange} value={audioSource}>
            <Radio value="url">音频URL</Radio>
            <Radio value="upload">上传音频文件</Radio>
          </Radio.Group>
        </Form.Item>

        {audioSource === 'url' ? (
          <Form.Item
            label="音频URL"
            name="audioUrl"
            rules={[{ required: true, message: '请输入音频URL' }]}
          >
            <Input placeholder="请输入MP3格式的音频URL" />
          </Form.Item>
        ) : (
          <Form.Item
            label="上传MP3文件"
            name="audioFile"
            valuePropName="fileList"
            getValueFromEvent={e => e && e.fileList}
            rules={[{ required: true, message: '请上传MP3文件' }]}
          >
            <Upload
              name="audioFile"
              beforeUpload={file => {
                const isMp3 = file.type === 'audio/mpeg';
                if (!isMp3) {
                  message.error('只能上传MP3文件!');
                }
                return isMp3 || Upload.LIST_IGNORE;
              }}
              onChange={handleFileUpload}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择MP3文件</Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item
          label="模型版本"
          name="version"
          tooltip="v1和v2版本适用于不同的音乐类型"
        >
          <Select>
            <Option value={1}>v1版本</Option>
            <Option value={2}>v2版本</Option>
          </Select>
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
          {loading ? "生成中..." : "生成节拍谱面"}
        </Button>
      </Form.Item>

      {responseData && responseData.data && (
        <DataPanel>
          <Collapse
            ghost
            defaultActiveKey={[]}
            expandIcon={({ isActive }) => <CodeOutlined rotate={isActive ? 90 : 0} />}
          >
            <Panel header={<Text strong>请求/响应数据</Text>} key="1">
              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="请求参数" key="1">
                  <pre>{JSON.stringify(responseData.requestData, null, 2)}</pre>
                </Tabs.TabPane>
                <Tabs.TabPane tab="响应数据" key="2">
                  <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {JSON.stringify(responseData.data, null, 2)}
                  </pre>
                </Tabs.TabPane>
              </Tabs>
            </Panel>
          </Collapse>
        </DataPanel>
      )}
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    // 避免在组件已卸载时继续输出日志，防止循环
    if (!isMountedRef.current) return null;

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交音频生成节拍谱面</Text>
        </div>
      );
    }

    // 从响应数据中提取结果
    const resultUrl = responseData.data?.data?.result;
    const audioUrl = responseData.requestData?.data;

    return (
      <div>
        <OutputCard title="节拍谱面生成结果">
          <Alert
            message="节拍谱面生成成功"
            description="您可以播放音频并查看节拍谱面，也可以下载谱面文件"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {audioUrl && (
            <AudioPlayer>
              <Title level={5}>音频播放</Title>
              <AudioPlayerControls>
                <PlayButton
                  type="primary"
                  shape="circle"
                  onClick={togglePlay}
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                />
                <Text style={{ marginLeft: 16 }}>
                  {isPlaying ? '正在播放' : '点击播放'}
                </Text>
              </AudioPlayerControls>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                style={{ display: 'none' }}
              />
            </AudioPlayer>
          )}

          <div style={{ marginTop: 20 }}>
            <Title level={5}>节拍谱面文件</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>节拍谱面文件:</Text>
                    <div style={{ wordBreak: 'break-all', marginTop: 8 }}>
                      <Text>{resultUrl}</Text>
                    </div>
                  </div>
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(resultUrl)}
                      type="text"
                    >
                      复制
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile(resultUrl)}
                    >
                      下载
                    </Button>
                  </Space>
                </div>
              </Card>
            </Space>
          </div>

          <BeatChartContainer>
            <Title level={5}>节拍可视化（示例）</Title>
            <VisualizeContainer>
              {/* 这里可以实现节拍可视化界面 */}
              <Text style={{ color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                节拍可视化界面开发中
              </Text>
            </VisualizeContainer>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              注意：实际节拍数据需要解析返回的文件内容才能展示
            </Text>
          </BeatChartContainer>
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
        <span>歌曲节拍打谱</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default MusicGamePage; 
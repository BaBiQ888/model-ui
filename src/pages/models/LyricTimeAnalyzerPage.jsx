import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Tabs, message, Upload, Radio, Divider, Alert, Empty } from 'antd';
import { FileTextOutlined, LoadingOutlined, SoundOutlined, UploadOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { TextArea } = Input;
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

const LyricCard = styled(Card)`
  margin-top: 16px;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const LyricLine = styled.div`
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: all 0.3s;
  display: flex;
  
  &:hover {
    background-color: #f0f7ff;
  }
  
  .timestamp {
    width: 80px;
    color: #1890ff;
    font-weight: 500;
    flex-shrink: 0;
  }
  
  .content {
    flex: 1;
  }
`;

// 歌词时间解析模型页面组件
const LyricTimeAnalyzerPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('lyric_time_analyzer');
  const [activeTab, setActiveTab] = useState('input');
  const [audioSource, setAudioSource] = useState('url');
  const [audioFile, setAudioFile] = useState(null);
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

      // 组件卸载时清除当前模型的响应数据
      clearResponseData('lyric_time_analyzer');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 处理音频来源变更
  const handleAudioSourceChange = (e) => {
    setAudioSource(e.target.value);
    setAudioFile(null);
    form.resetFields(['audioUrl', 'audioFile']);
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
      let audioParam;

      if (audioSource === 'url') {
        // 使用URL
        audioParam = values.audioUrl;
      } else {
        // 使用上传的文件，转换为Base64
        if (!audioFile) {
          message.error('请上传音频文件');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioFile);

        audioParam = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // 去掉前缀如 "data:audio/mp3;base64,"
            resolve(base64);
          };
          reader.onerror = reject;
        });
      }

      // 调用模型API
      await callModelApi('lyric_time_analyzer', {
        audio: audioParam
      });
    } catch (error) {
      message.error('解析歌词失败: ' + error.message);
    }
  };

  // 复制歌词到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 下载歌词文本文件
  const downloadLyrics = (lyrics, fileName = '歌词.txt') => {
    const element = document.createElement('a');
    const file = new Blob([lyrics], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // 格式化歌词显示，将LRC格式转换为结构化数据
  const formatLyrics = (lyricsText) => {
    if (!lyricsText) return [];

    // 解析LRC格式的歌词
    const lines = lyricsText.split('\n');
    const lyricsData = lines
      .map(line => {
        // 匹配时间标签 [00:00.00] 和歌词内容
        const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
        if (match) {
          return {
            time: match[1],
            text: match[2].trim()
          };
        }
        return null;
      })
      .filter(item => item !== null && item.text !== '');

    return lyricsData;
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Form.Item label="音频来源" required>
          <Radio.Group onChange={handleAudioSourceChange} value={audioSource}>
            <Radio value="url">音频URL</Radio>
            <Radio value="upload">上传音频文件</Radio>
          </Radio.Group>
        </Form.Item>

        {audioSource === 'url' ? (
          <Form.Item
            name="audioUrl"
            label="音频URL"
            rules={[{ required: true, message: '请输入音频URL' }]}
          >
            <Input placeholder="请输入音频文件的URL，支持MP3、WAV等格式" />
          </Form.Item>
        ) : (
          <Form.Item
            name="audioFile"
            label="上传音频文件"
            valuePropName="fileList"
            getValueFromEvent={e => e && e.fileList}
            rules={[{ required: true, message: '请上传音频文件' }]}
          >
            <Upload
              name="audioFile"
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
        )}
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <FileTextOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? "解析中..." : "解析歌词和时间点"}
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
          <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交音频解析歌词</Text>
        </div>
      );
    }

    // 从响应数据中提取结果
    const lyricsText = responseData.data?.data?.res || '';
    const formattedLyrics = formatLyrics(lyricsText);

    return (
      <div>
        <OutputCard title="解析结果">
          <Alert
            message="歌词解析成功"
            description="系统已成功从音频中提取歌词和时间点"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(lyricsText)}
                >
                  复制歌词
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => downloadLyrics(lyricsText)}
                >
                  下载歌词文件
                </Button>
              </Space>

              <LyricCard title="歌词内容">
                {formattedLyrics.length > 0 ? (
                  formattedLyrics.map((line, index) => (
                    <LyricLine key={index}>
                      <span className="timestamp">[{line.time}]</span>
                      <span className="content">{line.text}</span>
                    </LyricLine>
                  ))
                ) : (
                  <Empty description="暂无歌词内容" />
                )}
              </LyricCard>
            </Col>
          </Row>
        </OutputCard>

        <Divider />

        <Title level={5}>原始歌词文本</Title>
        <Card>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
            {lyricsText}
          </pre>
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
        <span>歌词时间解析模型</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default LyricTimeAnalyzerPage; 
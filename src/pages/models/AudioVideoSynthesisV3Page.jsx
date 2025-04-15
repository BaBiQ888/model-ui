import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Row, Col, Card, Image, Space, Tabs, Collapse, Table, Badge, message } from 'antd';
import { FileOutlined, VideoCameraOutlined, LoadingOutlined, CodeOutlined, CopyOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import ModelCallPanel from '../../components/ModelCallPanel';
import { useModel } from '../../contexts/ModelContext';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

// 增强样式组件
const VideoContainer = styled.div`
  margin-top: 24px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
  
  video {
    width: 100%;
    display: block;
  }
`;

const FileLink = styled.a`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .anticon {
    margin-right: 12px;
    font-size: 18px;
    color: #1890ff;
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

const DataTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #f0f7ff;
  }
  
  .key-column {
    font-weight: 500;
    color: #1890ff;
  }
  
  .value-column {
    word-break: break-all;
  }
  
  .ant-table-row:hover .copy-button {
    opacity: 1;
  }
  
  .copy-button {
    opacity: 0;
    transition: opacity 0.3s;
  }
`;

const ValueContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  
  .label {
    color: #8c8c8c;
    margin-right: 8px;
    width: 100px;
  }
  
  .value {
    font-weight: 500;
  }
`;

// 音视频合成模型页面组件
const AudioVideoSynthesisV3Page = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('audio_video_synthesis_v3');
  const [activeTab, setActiveTab] = useState('input');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = React.useRef(null);
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
      // 根据is_end状态更新处理状态
      setIsProcessing(!responseData.data.is_end);
    }
  }, [responseData, loading]);

  // 当组件挂载和卸载时处理
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      if (videoRef.current) {
        videoRef.current.pause();
      }
      // 组件卸载时清除当前模型的响应数据
      clearResponseData('audio_video_synthesis_v3');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 视频播放结束事件处理
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      console.log('提交表单:', values);
      // 调用模型API
      await callModelApi('audio_video_synthesis_v3', {
        optype: 'create_video_sp',
        config_url: values.configUrl
      });
    } catch (error) {
      message.error('合成失败: ' + error.message);
    }
  };

  // 控制视频播放
  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(e => {
          console.error('播放失败:', e);
          message.error('视频播放失败，请稍后重试');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 添加复制到剪贴板函数
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 格式化请求数据为表格数据
  const formatRequestData = (data) => {
    if (!data) return [];

    const result = [];

    Object.entries(data).forEach(([key, value]) => {
      result.push({
        key: key,
        value: (
          <ValueContainer>
            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(typeof value === 'object' ? JSON.stringify(value) : String(value))}
            />
          </ValueContainer>
        ),
        rawValue: value
      });
    });

    return result;
  };

  // 格式化响应数据为表格数据
  const formatResponseData = (data) => {
    if (!data || !data.data) return [];

    const result = [];
    const apiData = data.data || {};

    // 处理关键字段
    const keyFields = [
      { key: 'm3u8_url', label: 'M3U8链接' },
      { key: 'video_url', label: '视频链接' },
      { key: 'cover_url', label: '封面链接' },
      { key: 'project_url', label: '项目文件链接' },
      { key: 'is_end', label: '是否完成' }
    ];

    keyFields.forEach(field => {
      if (apiData[field.key] !== undefined) {
        let displayValue = apiData[field.key];

        if (field.key === 'is_end') {
          displayValue = displayValue ? '是' : '否';
        }

        result.push({
          key: field.label,
          value: (
            <ValueContainer>
              <span>{displayValue}</span>
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                className="copy-button"
                onClick={() => copyToClipboard(String(displayValue))}
              />
            </ValueContainer>
          ),
          rawValue: apiData[field.key]
        });
      }
    });

    return result;
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Form.Item
          name="configUrl"
          label="配置文件URL"
          rules={[{ required: true, message: '请输入配置文件URL' }]}
        >
          <Input placeholder="输入合成配置文件的URL" />
        </Form.Item>

        <Paragraph style={{ marginTop: 16 }}>
          <Text strong>配置文件示例:</Text>
        </Paragraph>
        <Card size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
          <Text code>{`{
  "audio_url": "https://example.com/audio.mp3",
  "video_elements": [
    {
      "type": "image",
      "url": "https://example.com/image1.jpg",
      "start_time": 0,
      "duration": 5,
      "position": { "x": 0, "y": 0 }
    },
    {
      "type": "video",
      "url": "https://example.com/video1.mp4",
      "start_time": 5,
      "duration": 10
    }
  ],
  "output_settings": {
    "resolution": "1080p",
    "framerate": 30
  }
}`}</Text>
        </Card>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <VideoCameraOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? '合成中...' : '开始合成'}
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
                  <DataTable
                    dataSource={formatRequestData(responseData.requestData)}
                    columns={[
                      {
                        title: '参数名',
                        dataIndex: 'key',
                        key: 'key',
                        width: '30%',
                        className: 'key-column'
                      },
                      {
                        title: '值',
                        dataIndex: 'value',
                        key: 'value',
                        className: 'value-column'
                      }
                    ]}
                    pagination={false}
                    size="small"
                    bordered
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="响应数据" key="2">
                  <DataTable
                    dataSource={formatResponseData(responseData)}
                    columns={[
                      {
                        title: '字段',
                        dataIndex: 'key',
                        key: 'key',
                        width: '30%',
                        className: 'key-column'
                      },
                      {
                        title: '值',
                        dataIndex: 'value',
                        key: 'value',
                        className: 'value-column'
                      }
                    ]}
                    pagination={false}
                    size="small"
                    bordered
                  />
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
    // 避免在组件已卸载时继续渲染，防止循环
    if (!isMountedRef.current) return null;

    // 添加调试日志查看响应数据 - 取消注释以启用
    // console.log("响应数据结构：", responseData);

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <VideoCameraOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交配置文件进行音视频合成</Text>
        </div>
      );
    }

    const { data } = responseData;

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <OutputCard
              title="合成状态"
              extra={
                isProcessing ? (
                  <Badge status="processing" text="处理中" />
                ) : (
                  <Badge status="success" text="已完成" />
                )
              }
            >
              <InfoItem>
                <Text type="secondary" className="label">配置文件:</Text>
                <Text className="value">{responseData.requestData?.configUrl || '未知'}</Text>
              </InfoItem>
            </OutputCard>
          </Col>

          {data.cover_url && (
            <Col span={24}>
              <OutputCard title="封面预览">
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={data.cover_url}
                    alt="视频封面"
                    style={{ maxWidth: '100%', maxHeight: 300 }}
                  />
                </div>
              </OutputCard>
            </Col>
          )}

          {(data.m3u8_url || data.video_url) && (
            <Col span={24}>
              <OutputCard
                title="视频预览"
                extra={
                  <Button
                    type="primary"
                    shape="circle"
                    icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={togglePlay}
                    size="large"
                  />
                }
              >
                <VideoContainer>
                  <video
                    ref={videoRef}
                    src={isProcessing ? data.m3u8_url : data.video_url}
                    controls
                    poster={data.cover_url}
                    onEnded={handleVideoEnded}
                    style={{ width: '100%' }}
                  />
                </VideoContainer>
              </OutputCard>
            </Col>
          )}

          {(data.video_url || data.project_url) && (
            <Col span={24}>
              <OutputCard title="文件下载">
                {data.video_url && (
                  <FileLink
                    href={data.video_url}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      const a = document.createElement('a');
                      a.href = data.video_url;
                      a.download = '合成视频.mp4';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      message.success('正在下载视频文件');
                    }}
                  >
                    <FileOutlined /> 视频文件下载
                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<FileOutlined />}
                      style={{ marginLeft: 'auto' }}
                    >
                      下载
                    </Button>
                  </FileLink>
                )}

                {data.project_url && (
                  <FileLink
                    href={data.project_url}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      const a = document.createElement('a');
                      a.href = data.project_url;
                      a.download = '项目文件.json';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      message.success('正在下载项目文件');
                    }}
                  >
                    <FileOutlined /> 项目文件下载
                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<FileOutlined />}
                      style={{ marginLeft: 'auto' }}
                    >
                      下载
                    </Button>
                  </FileLink>
                )}
              </OutputCard>
            </Col>
          )}
        </Row>
      </div>
    );
  };

  // 自定义Tabs组件，使用我们自己的activeTab状态
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
        <VideoCameraOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>音视频合成 V3</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default AudioVideoSynthesisV3Page;

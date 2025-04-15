import React, { useRef, useState, useEffect } from 'react';
import { Form, Input, Button, Select, Typography, Row, Col, Card, message, Radio, Divider, Tabs, Collapse, Table, Badge, Space, Tooltip } from 'antd';
import { UploadOutlined, FileOutlined, LoadingOutlined, PlayCircleOutlined, DownloadOutlined, PauseCircleOutlined, SoundOutlined, CodeOutlined, CopyOutlined, QuestionCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import ModelCallPanel from '../../components/ModelCallPanel';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 示例音频
const SAMPLE_AUDIOS = MODEL_RESOURCES.synthesise_dance_v6.sampleAudios;

// 增强样式组件
const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
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
    font-size: 20px;
    color: #1890ff;
  }
`;

const AudioContainer = styled.div`
  margin-top: 16px;
  width: 100%;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

const ArrayTag = styled(Badge)`
  .ant-badge-count {
    background-color: #108ee9;
  }
`;

const ObjectTag = styled(Badge)`
  .ant-badge-count {
    background-color: #87d068;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
  
  .label {
    width: 120px;
    color: #8c8c8c;
  }
  
  .value {
    font-weight: 500;
  }
`;

// 音生舞模型页面组件
const SynthesiseDanceV6Page = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData, error } = getModelData('synthesise_dance_v6');
  const audioRef = useRef(null);
  const [audioSource, setAudioSource] = useState('url');
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioEnded, setAudioEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // Reset audioEnded state when audio source changes
  useEffect(() => {
    setAudioEnded(false);
  }, [responseData?.requestData?.audioPath]);

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
    }
  }, [responseData, loading]);

  // 当组件挂载和卸载时处理
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 组件卸载时清除当前模型的响应数据
      clearResponseData('synthesise_dance_v6');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      let audioPath = values.audioPath;

      // 如果是预设音频
      if (audioSource === 'sample' && selectedAudio !== 'custom') {
        audioPath = SAMPLE_AUDIOS.find(audio => audio.id === selectedAudio)?.url || audioPath;
      }

      if (!audioPath) {
        message.error('请输入音频文件URL');
        return;
      }

      // 调用模型API
      await callModelApi('synthesise_dance_v6', {
        audioPath: audioPath, // 使用audioPath与ModelContext保持一致
        scale: values.scale || 'low',
        version: values.version || 'v6'
      });
    } catch (err) {
      message.error(`生成舞蹈动作失败: ${err.message}`);
    }
  };

  // 音频播放相关函数
  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => {
          console.error('Failed to play audio:', error);
          message.error('音频播放失败，请检查音频文件是否可访问');
        });
      }
      setIsPlaying(!isPlaying);
      setAudioEnded(false);
    }
  };

  // 音频播放结束事件
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioEnded(true);
    console.log('Audio playback completed, additional logic can be added here');
  };

  // 处理音频源类型切换
  const handleAudioSourceChange = (e) => {
    const value = e.target.value;
    setAudioSource(value);
    setSelectedAudio(null);
    // 重置表单中的audioPath
    form.setFieldsValue({ audioPath: undefined });
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
      // 转换参数名称，让展示更友好
      const displayKey = key === 'audioPath' ? '音频路径' :
        key === 'scale' ? '时长类型' :
          key === 'version' ? '模型版本' : key;

      // 转换参数值，让展示更友好
      let displayValue = value;
      if (key === 'scale') {
        displayValue = value === 'full' ? '全长版 (约3分钟)' :
          value === 'mid' ? '中长版 (约1分钟)' :
            value === 'low' ? '短版 (约30秒)' :
              value === 'slow' ? '超短版 (约15秒)' : value;
      }

      result.push({
        key: displayKey,
        value: (
          <ValueContainer>
            <span>{typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue)}</span>
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
      { key: 'emo_path', label: 'EMO动作文件', description: 'EMO格式动作数据文件，包含动作关键点' },
      { key: 'fbx_path', label: 'FBX模型文件', description: '可在专业3D软件中查看的动作模型文件' },
      { key: 'origin', label: '是否原创', description: '指示此舞蹈动作是否为原创生成' },
    ];

    keyFields.forEach(field => {
      if (apiData[field.key] !== undefined) {
        let displayValue = apiData[field.key];

        if (field.key === 'origin') {
          displayValue = displayValue ? '是' : '否';
        }

        result.push({
          key: (
            <span>
              {field.label}
              {field.description && (
                <Tooltip title={field.description}>
                  <QuestionCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                </Tooltip>
              )}
            </span>
          ),
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

  // 从URL中获取文件名
  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname;
      return path.substring(path.lastIndexOf('/') + 1);
    } catch {
      return 'download';
    }
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        scale: 'low',
        version: 'v6',
        audioPath: SAMPLE_AUDIOS[0].url
      }}
    >
      <FormSection>
        <Divider orientation="left">音频设置</Divider>

        <Form.Item label="音频来源">
          <Radio.Group value={audioSource} onChange={handleAudioSourceChange}>
            <Radio.Button value="sample">使用示例音频</Radio.Button>
            <Radio.Button value="custom">使用自定义音频</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {audioSource === 'sample' ? (
          <Form.Item
            name="sampleAudio"
            label="选择示例音频"
            rules={[{ required: true, message: '请选择示例音频' }]}
          >
            <Select
              placeholder="请选择示例音频"
              onChange={(value) => {
                setSelectedAudio(value);
                if (value !== 'custom') {
                  const url = SAMPLE_AUDIOS.find(audio => audio.id === value)?.url || '';
                  form.setFieldsValue({ audioPath: url });
                }
              }}
              value={selectedAudio}
            >
              {SAMPLE_AUDIOS.map(audio => (
                <Option key={audio.id} value={audio.id}>{audio.name}</Option>
              ))}
            </Select>
          </Form.Item>
        ) : null}

        <Form.Item
          name="audioPath"
          label="音频文件URL"
          rules={[{ required: true, message: '请输入音频文件URL' }]}
          extra="输入可公开访问的音频文件URL，支持MP3、WAV格式"
          style={{ display: audioSource === 'custom' || selectedAudio === 'custom' ? 'block' : 'none' }}
        >
          <Input placeholder="输入可访问的音频文件URL" />
        </Form.Item>
      </FormSection>

      <FormSection>
        <Divider orientation="left">模型设置</Divider>

        <Form.Item
          name="scale"
          label={
            <span>
              生成时长
              <Tooltip title="影响生成的舞蹈动作时长，请根据你的音频长度选择合适的参数">
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </span>
          }
        >
          <Select>
            <Option value="slow">超短版 (约15秒)</Option>
            <Option value="low">短版 (约30秒)</Option>
            <Option value="mid">中长版 (约1分钟)</Option>
            <Option value="full">全长版 (约3分钟)</Option>
          </Select>
        </Form.Item>

        <Form.Item name="version" label="模型版本">
          <Select>
            <Option value="v6">V6 (最新版本)</Option>
            <Option value="v3">V3 (旧版本)</Option>
          </Select>
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? '生成中...' : '生成舞蹈动作'}
        </Button>
        {error && (
          <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {error}
          </Text>
        )}
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
          <Text type="secondary" style={{ display: 'block' }}>请先提交音频生成舞蹈</Text>
        </div>
      );
    }

    const { data } = responseData;

    // 检查是否有错误信息
    if (responseData.code !== 200) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="danger">生成失败: {responseData.message || '未知错误'}</Text>
        </div>
      );
    }

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <OutputCard title="模型信息">
              <InfoRow>
                <Text className="label">模型版本:</Text>
                <Text className="value">{responseData.requestData?.version || 'v6'}</Text>
              </InfoRow>
              <InfoRow>
                <Text className="label">生成时长:</Text>
                <Text className="value">
                  {responseData.requestData?.scale === 'full' ? '全长版 (约3分钟)' :
                    responseData.requestData?.scale === 'mid' ? '中长版 (约1分钟)' :
                      responseData.requestData?.scale === 'low' ? '短版 (约30秒)' :
                        responseData.requestData?.scale === 'slow' ? '超短版 (约15秒)' :
                          responseData.requestData?.scale || '未知'}
                </Text>
              </InfoRow>
              <InfoRow>
                <Text className="label">原创状态:</Text>
                <Text className="value">
                  {data.origin ?
                    <Badge status="success" text="原创动作" /> :
                    <Badge status="warning" text="非原创动作" />}
                </Text>
              </InfoRow>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="原始音频">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <AudioContainer>
                    {responseData.requestData?.audioPath ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                          <Button
                            type="primary"
                            shape="circle"
                            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={togglePlay}
                            size="large"
                            style={{ marginRight: 16 }}
                          />
                          <Text strong>{isPlaying ? '正在播放' : '点击播放'}</Text>
                        </div>
                        <audio
                          ref={audioRef}
                          src={responseData.requestData.audioPath}
                          controls
                          style={{ width: '100%' }}
                          onEnded={handleAudioEnded}
                        />
                        {audioEnded && (
                          <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                            音频播放完成
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text type="secondary">无原始音频</Text>
                    )}
                  </AudioContainer>
                </Col>
              </Row>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard
              title="生成文件"
              extra={
                <Badge
                  status={data.emo_path || data.fbx_path ? "success" : "warning"}
                  text={data.emo_path || data.fbx_path ? '生成成功' : '暂无文件'}
                />
              }
            >
              {data.emo_path && (
                <FileLink
                  href={data.emo_path}
                  target="_blank"
                  onClick={(e) => {
                    e.preventDefault();
                    const a = document.createElement('a');
                    a.href = data.emo_path;
                    a.download = getFileNameFromUrl(data.emo_path);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    message.success('开始下载EMO动作文件');
                  }}
                >
                  <FileOutlined /> 动作数据文件 (EMO)
                  <Tooltip title="EMO格式包含动作的关键点数据，可用于专业动画应用">
                    <QuestionCircleOutlined style={{ marginLeft: 8, marginRight: 'auto' }} />
                  </Tooltip>
                  <Button
                    type="primary"
                    size="small"
                    shape="round"
                    icon={<DownloadOutlined />}
                  >
                    下载
                  </Button>
                </FileLink>
              )}

              {data.fbx_path && (
                <FileLink
                  href={data.fbx_path}
                  target="_blank"
                  onClick={(e) => {
                    e.preventDefault();
                    const a = document.createElement('a');
                    a.href = data.fbx_path;
                    a.download = getFileNameFromUrl(data.fbx_path);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    message.success('开始下载FBX模型文件');
                  }}
                >
                  <FileOutlined /> 动作模型文件 (FBX)
                  <Tooltip title="FBX格式广泛用于3D建模和动画，可在Maya、Blender等软件中打开">
                    <QuestionCircleOutlined style={{ marginLeft: 8, marginRight: 'auto' }} />
                  </Tooltip>
                  <Button
                    type="primary"
                    size="small"
                    shape="round"
                    icon={<DownloadOutlined />}
                  >
                    下载
                  </Button>
                </FileLink>
              )}

              {!data.emo_path && !data.fbx_path && (
                <Text type="secondary">暂无生成文件</Text>
              )}
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="预览与使用提示">
              <PreviewContainer>
                <div style={{ width: '100%', padding: 24, backgroundColor: '#f7f7f7', borderRadius: 8, textAlign: 'left' }}>
                  <Title level={5}>如何使用生成的文件:</Title>
                  <ul style={{ paddingLeft: 24 }}>
                    <li>
                      <Text>EMO文件: 包含动作关键点数据，可导入支持该格式的专业工具</Text>
                    </li>
                    <li>
                      <Text>FBX文件: 可在以下软件中预览和编辑:</Text>
                      <ul style={{ paddingLeft: 24 }}>
                        <li><Text>Autodesk Maya</Text></li>
                        <li><Text>Blender</Text></li>
                        <li><Text>3ds Max</Text></li>
                        <li><Text>Unity或Unreal游戏引擎</Text></li>
                      </ul>
                    </li>
                  </ul>

                  <Divider />

                  <Text type="secondary">
                    提示: 生成的动作适用于人型角色，可能需要在专业软件中进行微调以适应特定角色骨骼。
                  </Text>
                </div>
              </PreviewContainer>
            </OutputCard>
          </Col>
        </Row>
      </div>
    );
  };

  // 自定义Tabs组件，使用自己的activeTab状态
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
        <span>音生舞模型 V6</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default SynthesiseDanceV6Page; 
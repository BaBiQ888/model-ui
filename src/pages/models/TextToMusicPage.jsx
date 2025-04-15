import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Space, Typography, Row, Col, Card, Tag, message, Tooltip, Divider, Tabs, Collapse, Table, Badge } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, PauseCircleOutlined, LoadingOutlined, PlusOutlined, SoundOutlined, InfoCircleOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import ModelCallPanel from '../../components/ModelCallPanel';
import { useModel } from '../../contexts/ModelContext';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 增强样式组件
const MusicPlayer = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const MusicCover = styled.div`
  width: 200px;
  height: 200px;
  margin-bottom: 24px;
  background-color: #f0f0f0;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  &:empty {
    &:before {
      content: '封面图片';
      color: #bfbfbf;
    }
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

const LyricContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
  border: 1px solid #f0f0f0;
`;

const PlayerControls = styled(Space)`
  margin-top: 16px;
  display: flex;
  justify-content: center;
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

const TagsContainer = styled.div`
  margin-bottom: 16px;
`;

const TagField = styled(Space)`
  width: 100%;
  margin-bottom: 8px;
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  
  .label {
    color: #8c8c8c;
    margin-right: 8px;
    width: 80px;
  }
  
  .value {
    font-weight: 500;
  }
`;

const AudioContainer = styled.div`
  width: 100%;
  margin-top: 16px;
  
  audio {
    width: 100%;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
`;

const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
`;

const MetadataTag = styled(Tag)`
  margin-bottom: 8px;
  padding: 4px 8px;
  font-size: 12px;
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

// 文生音模型页面组件
const TextToMusicPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData, error } = getModelData('text_to_music');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [activeTab, setActiveTab] = useState('input');
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 当组件卸载时停止音频播放和清除响应数据
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 组件卸载时清除当前模型的响应数据，避免影响其他页面
      clearResponseData('text_to_music');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
    }
  }, [responseData, loading]);

  // 测试API直接调用
  const testDirectApiCall = async () => {
    try {
      message.info("开始直接测试API调用");

      // 使用简单测试数据
      const testTags = ["欢快", "流行"];
      const result = await callModelApi('text_to_music', {
        tags: testTags
      });

      console.log("直接API测试结果:", result);
      message.success("API测试调用完成");
    } catch (err) {
      console.error("API测试调用失败:", err);
      message.error(`API测试失败: ${err.message}`);
    }
  };

  // 处理音频时间更新
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      // 音频进度更新，可在需要时使用
      console.log(`Audio progress: ${(audioRef.current.currentTime / audioRef.current.duration) * 100}%`);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      // 过滤空标签
      const tags = values.tags.filter(tag => tag && tag.trim() !== '');

      if (tags.length === 0) {
        message.error('请至少输入一个有效标签');
        return;
      }

      // 调用模型API
      await callModelApi('text_to_music', {
        tags
      });
    } catch (err) {
      message.error(`生成音乐失败: ${err.message}`);
    }
  };

  // 控制音乐播放
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error('播放失败:', e);
          message.error('音频播放失败，请稍后重试');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 下载音乐
  const downloadMusic = (url, fileName = '音乐.mp3') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success(`正在下载 ${fileName}`);
  };

  // 音频播放结束事件
  const handleAudioEnded = () => {
    setIsPlaying(false);
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
      if (key === 'tags' && Array.isArray(value)) {
        // 处理标签数组
        result.push({
          key: key,
          value: (
            <ValueContainer>
              <div>
                <ArrayTag count={`数组[${value.length}]`} />
                <div style={{ marginTop: 8 }}>
                  {value.map((tag, i) => (
                    <Tag key={i} color="blue" style={{ margin: '2px' }}>{tag}</Tag>
                  ))}
                </div>
              </div>
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                className="copy-button"
                onClick={() => copyToClipboard(JSON.stringify(value))}
              />
            </ValueContainer>
          ),
          rawValue: value
        });
      } else {
        // 处理其他类型值
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
      }
    });

    return result;
  };

  // 格式化响应数据为表格数据
  const formatResponseData = (data) => {
    if (!data || !data.data) return [];

    const result = [];
    const apiData = data.data.data || {};

    // 处理关键字段
    const keyFields = [
      { key: 'music_name', label: '音乐名称' },
      { key: 'music_url', label: '音频链接' },
      { key: 'img_url', label: '封面链接' },
      { key: 'beat', label: '节拍' },
      { key: 'bpm', label: 'BPM' },
      { key: 'duration', label: '时长(秒)' },
      { key: 'gender', label: '性别' },
      { key: 'language', label: '语言' },
      { key: 'is_original_music', label: '是否原创' },
    ];

    keyFields.forEach(field => {
      if (apiData[field.key] !== undefined) {
        let displayValue = apiData[field.key];

        // 特殊处理某些字段
        if (field.key === 'is_original_music') {
          displayValue = displayValue ? '是' : '否';
        } else if (field.key === 'duration') {
          displayValue = displayValue.toFixed(2);
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

    // 处理数组字段
    ['people_names', 'clothes_names'].forEach(arrayKey => {
      if (Array.isArray(apiData[arrayKey]) && apiData[arrayKey].length > 0) {
        const fieldLabel = arrayKey === 'people_names' ? '相关人物' : '服装风格';

        result.push({
          key: fieldLabel,
          value: (
            <ValueContainer>
              <div>
                <ArrayTag count={`数组[${apiData[arrayKey].length}]`} />
                <div style={{ marginTop: 8 }}>
                  {apiData[arrayKey].map((item, i) => (
                    <Tag key={i} color={arrayKey === 'people_names' ? 'blue' : 'green'} style={{ margin: '2px' }}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                className="copy-button"
                onClick={() => copyToClipboard(JSON.stringify(apiData[arrayKey]))}
              />
            </ValueContainer>
          ),
          rawValue: apiData[arrayKey]
        });
      }
    });

    // 如果有歌词数据
    if (apiData.lyric) {
      result.push({
        key: '歌词',
        value: (
          <ValueContainer>
            <div style={{ maxHeight: '100px', overflow: 'auto', width: '90%' }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{apiData.lyric}</Text>
            </div>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(apiData.lyric)}
            />
          </ValueContainer>
        ),
        rawValue: apiData.lyric
      });
    }

    return result;
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ tags: [''] }}
    >
      <FormSection>
        <Paragraph>
          <Text strong>音乐描述标签</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            添加描述性的标签，帮助模型生成符合您想象的音乐
          </Text>
        </Paragraph>

        <Form.List name="tags">
          {(fields, { add, remove }) => (
            <TagsContainer>
              {fields.map((field, index) => (
                <Form.Item
                  key={field.key}
                  required={false}
                  style={{ marginBottom: 8 }}
                >
                  <TagField align="baseline">
                    <Form.Item
                      name={field.name}
                      fieldKey={[field.fieldKey, 'tag']}
                      rules={[{ required: true, message: '请输入标签或删除此项' }]}
                      noStyle
                    >
                      <Input
                        placeholder={index === 0 ? "例如：欢快、轻松、电子" : "继续添加标签"}
                        style={{ width: '100%' }}
                        prefix={<SoundOutlined style={{ color: '#1890ff' }} />}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        onClick={() => remove(field.name)}
                        type="text"
                        danger
                        icon={<span>×</span>}
                      />
                    )}
                  </TagField>
                </Form.Item>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                style={{ width: '100%' }}
                icon={<PlusOutlined />}
              >
                添加标签
              </Button>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                提示：添加多个标签可以更精确地描述您想要的音乐风格和情感。
              </Text>
            </TagsContainer>
          )}
        </Form.List>
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
          {loading ? '生成中...' : '生成音乐'}
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
    // 避免在组件已卸载时继续输出日志和渲染，防止循环
    if (!isMountedRef.current) return null;

    // 可选：添加调试日志查看响应数据
    // console.log("响应数据结构：", responseData);

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      // 可选：记录数据为空的情况
      // console.log("无响应数据或responseData.data为空");
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先在输入标签生成音乐</Text>
        </div>
      );
    }

    // 检查data的正确结构
    const data = responseData.data.data || {};
    console.log("处理后的data对象：", data);

    // 提取额外信息
    const audioUrl = data.music_url;
    const imageUrl = data.img_url;

    console.log("音频URL:", audioUrl);
    console.log("图片URL:", imageUrl);

    // 检查是否有错误信息
    if (responseData.code !== 200) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="danger">生成失败: {responseData.message}</Text>
        </div>
      );
    }

    // 提取音乐文件名
    const musicFileName = data.music_name ? `${data.music_name}.mp3` : '生成的音乐.mp3';

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <MusicPlayer>
              <MusicCover style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }}>
                {!imageUrl && '暂无封面'}
              </MusicCover>
              <Title level={4} style={{ marginBottom: 4 }}>{data.music_name || '未命名音乐'}</Title>

              {data.people_names && data.people_names.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {data.people_names.map((name, index) => (
                    <Tag key={index} color="blue">{name}</Tag>
                  ))}
                </div>
              )}

              <PlayerControls>
                <PlayButton
                  type="primary"
                  shape="circle"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  disabled={!audioUrl}
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  disabled={!audioUrl}
                  onClick={() => downloadMusic(audioUrl, musicFileName)}
                >
                  下载
                </Button>
              </PlayerControls>

              {audioUrl && (
                <AudioContainer>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                  />
                </AudioContainer>
              )}
            </MusicPlayer>
          </Col>

          <Col xs={24} md={12}>
            <OutputCard title="音乐信息">
              <div style={{ padding: '8px 0' }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">风格:</Text>
                      <Text className="value">{data.beat || '未知'}</Text>
                    </InfoItem>
                  </Col>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">BPM:</Text>
                      <Text className="value">{data.bpm || '未知'}</Text>
                    </InfoItem>
                  </Col>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">时长:</Text>
                      <Text className="value">{data.duration ? `${data.duration.toFixed(2)}秒` : '未知'}</Text>
                    </InfoItem>
                  </Col>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">性别:</Text>
                      <Text className="value">{data.gender || '未知'}</Text>
                    </InfoItem>
                  </Col>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">语言:</Text>
                      <Text className="value">{data.language || '未知'}</Text>
                    </InfoItem>
                  </Col>
                  <Col span={12}>
                    <InfoItem>
                      <Text type="secondary" className="label">原创:</Text>
                      <Text className="value">{data.is_original_music ? '是' : '否'}</Text>
                    </InfoItem>
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text type="secondary">标签:</Text>
                <div style={{ marginTop: 8 }}>
                  {responseData.requestData?.tags?.map((tag, index) => (
                    <MetadataTag key={index} color="blue">{tag}</MetadataTag>
                  )) || '无标签'}
                </div>
              </div>

              {data.clothes_names && data.clothes_names.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">服装风格:</Text>
                  <div style={{ marginTop: 8 }}>
                    {data.clothes_names.map((name, index) => (
                      <MetadataTag key={index} color="green">{name}</MetadataTag>
                    ))}
                  </div>
                </div>
              )}
            </OutputCard>

            {data.lyric && (
              <OutputCard title="歌词">
                <LyricContainer>{data.lyric}</LyricContainer>
              </OutputCard>
            )}
          </Col>
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
    <>
      {!loading && !responseData?.data && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            onClick={testDirectApiCall}
            type="link"
            icon={<InfoCircleOutlined />}
          >
            测试API
          </Button>
        </div>
      )}
      <Card title={
        <Space>
          <SoundOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <span>文生音模型</span>
        </Space>
      } size="large">
        <CustomTabs />
      </Card>
    </>
  );
};

export default TextToMusicPage; 
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Tabs, message, Collapse, Divider, Alert, Tag } from 'antd';
import { FileTextOutlined, LoadingOutlined, CodeOutlined, CopyOutlined, LinkOutlined, PictureOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

// 增强样式组件
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

const InfoItem = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f7ff;
    transform: translateY(-2px);
  }
`;

const InfoLabel = styled(Text)`
  display: block;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-size: 14px;
`;

const InfoValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .content {
    flex: 1;
    word-break: break-word;
  }
  
  .actions {
    margin-left: 8px;
    flex-shrink: 0;
  }
`;

const DataPanel = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

const LinkButton = styled(Button)`
  margin-top: 12px;
`;

const SongTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
`;

const PromptTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
  border-radius: 12px;
`;

const ImagePromptBox = styled.div`
  background-color: #f0f7ff;
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
  border: 1px dashed #91d5ff;
`;

// 生成歌曲名称和封面图描述词模型页面组件
const SongInfoGenPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('song_info_gen');
  const [activeTab, setActiveTab] = useState('input');
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
      clearResponseData('song_info_gen');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      // 调用模型API
      await callModelApi('song_info_gen', {
        usr_input: values.usrInput
      });
    } catch (error) {
      message.error('生成歌曲信息失败: ' + error.message);
    }
  };

  // 复制到剪贴板函数
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 跳转到生成封面页面
  const goToGenerateCover = (prompt, musicName) => {
    // 将封面生成描述词和歌曲名称传递到封面生成页面
    const encodedPrompt = encodeURIComponent(prompt);
    const encodedMusicName = encodeURIComponent(musicName || '');
    window.location.href = `/txt-image-generate-music?prompt=${encodedPrompt}&musicName=${encodedMusicName}`;
  };

  // 从嵌套响应中安全地提取数据
  const extractResponseData = (responseData) => {
    try {
      // 处理多层嵌套的响应数据结构
      if (!responseData) return null;

      let data = responseData.data;

      // 如果data包含data字段，则进一步解包
      if (data && data.data) {
        data = data.data;
      }

      // 再次检查data是否包含data字段
      if (data && data.data) {
        data = data.data;
      }

      return {
        musicName: data.music_name,
        songCoverImagePrompt: data.song_cover_image_prompt
      };
    } catch (error) {
      console.error("提取响应数据失败:", error);
      return null;
    }
  };

  // 将封面描述词拆分为标签
  const splitPromptToTags = (prompt) => {
    if (!prompt) return [];
    return prompt.split('，').filter(tag => tag.trim() !== '');
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
          name="usrInput"
          label="描述文本"
          rules={[{ required: true, message: '请输入描述文本' }]}
        >
          <TextArea
            placeholder="请输入音乐主题或关键词，例如：恋爱告急、夏日海滩、伤感雨夜..."
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>
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
          {loading ? "生成中..." : "生成歌曲信息"}
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
                  <Paragraph>
                    <pre>{JSON.stringify(responseData.requestData, null, 2)}</pre>
                  </Paragraph>
                </Tabs.TabPane>
                <Tabs.TabPane tab="响应数据" key="2">
                  <Paragraph>
                    <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                      {JSON.stringify(responseData.data, null, 2)}
                    </pre>
                  </Paragraph>
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
          <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交描述文本生成歌曲信息</Text>
        </div>
      );
    }

    // 提取数据
    const extractedData = extractResponseData(responseData);

    if (!extractedData) {
      return (
        <Alert
          message="数据解析错误"
          description="无法从响应中提取歌曲信息，请重试或联系技术支持"
          type="error"
          showIcon
        />
      );
    }

    const { musicName, songCoverImagePrompt } = extractedData;
    const promptTags = splitPromptToTags(songCoverImagePrompt);

    return (
      <div>
        <OutputCard title="生成结果">
          <Alert
            message="歌曲信息生成成功"
            description="您可以复制歌曲名称和封面图描述词，或直接跳转到生成封面页面"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <InfoItem>
            <InfoLabel>歌曲名称</InfoLabel>
            <InfoValue>
              <div className="content">
                <SongTitle>{musicName}</SongTitle>
              </div>
              <div className="actions">
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(musicName)}
                  type="primary"
                  ghost
                >
                  复制
                </Button>
              </div>
            </InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>封面图描述词</InfoLabel>
            <InfoValue>
              <div className="content">
                <Paragraph>
                  {songCoverImagePrompt}
                </Paragraph>
                <ImagePromptBox>
                  {promptTags.map((tag, index) => (
                    <PromptTag key={index} color="#1890ff">{tag}</PromptTag>
                  ))}
                </ImagePromptBox>
              </div>
              <div className="actions">
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(songCoverImagePrompt)}
                  type="primary"
                  ghost
                >
                  复制
                </Button>
              </div>
            </InfoValue>
            <LinkButton
              type="primary"
              icon={<PictureOutlined />}
              onClick={() => goToGenerateCover(songCoverImagePrompt, musicName)}
              block
            >
              使用此描述词生成封面
            </LinkButton>
          </InfoItem>
        </OutputCard>

        <Divider />

        <Title level={5}>下一步操作</Title>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
                border: '1px solid #91d5ff'
              }}
            >
              <Card.Meta
                title={
                  <Space>
                    <PictureOutlined style={{ color: '#1890ff' }} />
                    <span>生成"{musicName}"的封面</span>
                  </Space>
                }
                description="使用AI根据生成的描述词创建完美匹配的歌曲封面图片"
              />
              <Button
                type="primary"
                icon={<PictureOutlined />}
                style={{ marginTop: 16 }}
                onClick={() => goToGenerateCover(songCoverImagePrompt, musicName)}
                block
              >
                立即生成封面
              </Button>
            </Card>
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
        <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>生成歌曲名称和封面图描述词</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default SongInfoGenPage;
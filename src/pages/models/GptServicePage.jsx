import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Typography, Card, Row, Col, message, Divider, Avatar, List, Tag, Radio, Checkbox, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, CustomerServiceOutlined, PlayCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import ModelCallPanel from '../../components/ModelCallPanel';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Styled components
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
  
  .ant-card-head {
    background-color: #fafafa;
  }
`;

const MessageList = styled(List)`
  margin-top: 16px;
  
  .ant-list-item {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .user-message {
    background-color: #f0f7ff;
    margin-left: 20%;
    position: relative;
  }
  
  .assistant-message {
    background-color: #f6f6f6;
    margin-right: 20%;
    position: relative;
  }
`;

const AvatarContainer = styled.div`
  margin-right: 12px;
`;

const MessageContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
`;

const TagsContainer = styled.div`
  margin-top: 16px;
`;

const TagGroup = styled.div`
  margin-bottom: 12px;
`;

const TagTitle = styled(Text)`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
`;

const ContentTag = styled(Tag)`
  margin-bottom: 8px;
  cursor: pointer;
  
  &.selected {
    background-color: #1890ff;
    color: white;
  }
`;

const GptServicePage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData } = useModel();
  const [history, setHistory] = useState([]);
  const [userIntent, setUserIntent] = useState(0); // 0: undetermined, 1: song, 2: dance
  const [selectedMusicTags, setSelectedMusicTags] = useState({
    gender: [],
    emotion: [],
    style: [],
    scene: []
  });
  const [selectedDanceTags, setSelectedDanceTags] = useState({
    music_id: 0,
    music_name: "",
    music_url: "",
    people_number: 1,
    scene_id: 0,
    cloth_id: 0,
    model_type: "2",
    gender: "Man"
  });

  // Tag options
  const musicTags = {
    gender: ["男", "女", "混唱", "纯音乐"],
    emotion: ["伤感", "兴奋", "安静", "宣泄", "浪漫", "欢快", "怀旧", "恢弘", "放空", "滑稽"],
    style: ["蓝调", "古典", "乡村", "迪斯科", "爵士", "金属", "流行", "雷鬼", "摇滚", "嘻哈"],
    scene: ["中国风", "二次元", "儿歌", "喜庆", "情歌", "旅行", "校园", "歌剧", "游戏", "纯自然"]
  };

  // Dance settings
  const danceSettings = {
    model_type: [
      { value: "1", label: "模型类型1" },
      { value: "2", label: "模型类型2" },
      { value: "3", label: "模型类型3" }
    ],
    gender: [
      { value: "Man", label: "男性" },
      { value: "Woman", label: "女性" }
    ],
    scene_id: [
      { value: 0, label: "默认场景" },
      { value: 1, label: "场景1" },
      { value: 2, label: "场景2" },
      { value: 3, label: "场景3" }
    ],
    cloth_id: [
      { value: 0, label: "默认服装" },
      { value: 1, label: "服装1" },
      { value: 2, label: "服装2" },
      { value: 3, label: "服装3" }
    ]
  };

  // Handle response data update
  useEffect(() => {
    const { responseData } = getModelData('gpt_service_maas');

    if (responseData && responseData.data) {
      const { label, history: newHistory } = responseData.data;

      // Update the chat history
      if (newHistory && Array.isArray(newHistory)) {
        const formattedHistory = newHistory.map(item => ({
          role: item.usr ? 'user' : 'assistant',
          content: item.usr || item.gpt
        }));
        setHistory(formattedHistory);
      }

      // Update labels
      if (label) {
        // Update user intent
        if (label.usr_intent !== undefined) {
          setUserIntent(label.usr_intent);
        }

        // Update music tags
        if (label.music_tags) {
          setSelectedMusicTags({
            gender: label.music_tags.gender || [],
            emotion: label.music_tags.emotion || [],
            style: label.music_tags.style || [],
            scene: label.music_tags.scene || []
          });
        }

        // Update dance tags
        if (label.dance_tags) {
          setSelectedDanceTags({
            music_id: label.dance_tags.music_id || 0,
            music_name: label.dance_tags.music_name || "",
            music_url: label.dance_tags.music_url || "",
            people_number: label.dance_tags.people_number || 1,
            scene_id: label.dance_tags.scene_id || 0,
            cloth_id: label.dance_tags.cloth_id || 0,
            model_type: label.dance_tags.model_type || "2",
            gender: label.dance_tags.gender || "Man"
          });
        }
      }
    }
  }, [getModelData]);

  // Toggle music tag selection
  const handleMusicTagToggle = (category, tag) => {
    setSelectedMusicTags(prev => {
      const updated = { ...prev };
      if (updated[category].includes(tag)) {
        updated[category] = updated[category].filter(t => t !== tag);
      } else {
        updated[category] = [...updated[category], tag];
      }
      return updated;
    });
  };

  // Handle dance setting change
  const handleDanceSettingChange = (setting, value) => {
    setSelectedDanceTags(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Handle user intent change
  const handleUserIntentChange = (e) => {
    setUserIntent(e.target.value);
  };

  // Submit message
  const handleSubmit = async (values) => {
    try {
      const { message } = values;

      // Format the history in the required format
      const formattedHistory = history.map(item => {
        if (item.role === 'user') {
          return { usr: item.content, gpt: "" };
        } else {
          return { usr: "", gpt: item.content };
        }
      });

      // Add the new message
      formattedHistory.push({ usr: message, gpt: "" });

      // Add to UI history
      setHistory(prev => [...prev, { role: 'user', content: message }]);

      // Clear the input field
      form.resetFields(['message']);

      // Prepare the request payload
      const params = {
        server_id: '36',
        label: {
          usr_intent: userIntent,
          music_tags: selectedMusicTags,
          dance_tags: selectedDanceTags
        },
        history: formattedHistory
      };

      // Call the API
      await callModelApi('gpt_service_maas', params);
    } catch (error) {
      message.error('发送失败: ' + error.message);
    }
  };

  // Render the input form
  const renderInputForm = () => {
    const { loading } = getModelData('gpt_service_maas');

    return (
      <div>
        <FormSection>
          <Title level={5}>偏好设置</Title>
          <Radio.Group onChange={handleUserIntentChange} value={userIntent}>
            <Radio value={0}>不确定</Radio>
            <Radio value={1}>音乐</Radio>
            <Radio value={2}>舞蹈</Radio>
          </Radio.Group>
        </FormSection>

        {userIntent === 1 && (
          <FormSection>
            <Title level={5}>音乐偏好</Title>

            <TagGroup>
              <TagTitle>性别类型</TagTitle>
              <div>
                {musicTags.gender.map(tag => (
                  <ContentTag
                    key={tag}
                    className={selectedMusicTags.gender.includes(tag) ? 'selected' : ''}
                    onClick={() => handleMusicTagToggle('gender', tag)}
                  >
                    {tag}
                  </ContentTag>
                ))}
              </div>
            </TagGroup>

            <TagGroup>
              <TagTitle>情感类型</TagTitle>
              <div>
                {musicTags.emotion.map(tag => (
                  <ContentTag
                    key={tag}
                    className={selectedMusicTags.emotion.includes(tag) ? 'selected' : ''}
                    onClick={() => handleMusicTagToggle('emotion', tag)}
                  >
                    {tag}
                  </ContentTag>
                ))}
              </div>
            </TagGroup>

            <TagGroup>
              <TagTitle>风格类型</TagTitle>
              <div>
                {musicTags.style.map(tag => (
                  <ContentTag
                    key={tag}
                    className={selectedMusicTags.style.includes(tag) ? 'selected' : ''}
                    onClick={() => handleMusicTagToggle('style', tag)}
                  >
                    {tag}
                  </ContentTag>
                ))}
              </div>
            </TagGroup>

            <TagGroup>
              <TagTitle>场景类型</TagTitle>
              <div>
                {musicTags.scene.map(tag => (
                  <ContentTag
                    key={tag}
                    className={selectedMusicTags.scene.includes(tag) ? 'selected' : ''}
                    onClick={() => handleMusicTagToggle('scene', tag)}
                  >
                    {tag}
                  </ContentTag>
                ))}
              </div>
            </TagGroup>
          </FormSection>
        )}

        {userIntent === 2 && (
          <FormSection>
            <Title level={5}>舞蹈偏好</Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="模型类型">
                  <Select
                    value={selectedDanceTags.model_type}
                    onChange={(value) => handleDanceSettingChange('model_type', value)}
                  >
                    {danceSettings.model_type.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="性别">
                  <Select
                    value={selectedDanceTags.gender}
                    onChange={(value) => handleDanceSettingChange('gender', value)}
                  >
                    {danceSettings.gender.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="场景">
                  <Select
                    value={selectedDanceTags.scene_id}
                    onChange={(value) => handleDanceSettingChange('scene_id', value)}
                  >
                    {danceSettings.scene_id.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="服装">
                  <Select
                    value={selectedDanceTags.cloth_id}
                    onChange={(value) => handleDanceSettingChange('cloth_id', value)}
                  >
                    {danceSettings.cloth_id.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </FormSection>
        )}

        <FormSection>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="message"
              rules={[{ required: true, message: '请输入消息' }]}
            >
              <TextArea
                placeholder="请输入您的问题或需求..."
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
                style={{ float: 'right' }}
              >
                发送
              </Button>
            </Form.Item>
          </Form>
        </FormSection>
      </div>
    );
  };

  // Render the output display
  const renderOutputDisplay = () => {
    const { loading } = getModelData('gpt_service_maas');

    // No messages yet
    if (history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <CustomerServiceOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>
            请在左侧开始与AI助手对话，探讨您的音乐或舞蹈需求
          </Text>
        </div>
      );
    }

    return (
      <div>
        <OutputCard title="对话记录">
          <MessageList
            itemLayout="horizontal"
            dataSource={history}
            renderItem={item => (
              <List.Item className={item.role === 'user' ? 'user-message' : 'assistant-message'}>
                <List.Item.Meta
                  avatar={
                    <AvatarContainer>
                      <Avatar
                        icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{
                          backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a'
                        }}
                      />
                    </AvatarContainer>
                  }
                  title={item.role === 'user' ? '您的消息' : 'AI助手'}
                  description={<MessageContent>{item.content}</MessageContent>}
                />
              </List.Item>
            )}
          />

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text>正在思考，请稍候...</Text>
            </div>
          )}
        </OutputCard>

        <OutputCard title="偏好摘要">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong>您当前的偏好：</Text>{' '}
              {userIntent === 0 && <Tag>尚未确定</Tag>}
              {userIntent === 1 && <Tag color="blue">音乐创作</Tag>}
              {userIntent === 2 && <Tag color="purple">舞蹈创作</Tag>}
            </Col>

            {userIntent === 1 && selectedMusicTags.gender.length +
              selectedMusicTags.emotion.length +
              selectedMusicTags.style.length +
              selectedMusicTags.scene.length > 0 && (
                <Col span={24}>
                  <TagsContainer>
                    <TagTitle>已选音乐标签：</TagTitle>
                    <Space wrap>
                      {selectedMusicTags.gender.map(tag => (
                        <Tag key={`gender-${tag}`} color="cyan">{tag}</Tag>
                      ))}
                      {selectedMusicTags.emotion.map(tag => (
                        <Tag key={`emotion-${tag}`} color="green">{tag}</Tag>
                      ))}
                      {selectedMusicTags.style.map(tag => (
                        <Tag key={`style-${tag}`} color="orange">{tag}</Tag>
                      ))}
                      {selectedMusicTags.scene.map(tag => (
                        <Tag key={`scene-${tag}`} color="magenta">{tag}</Tag>
                      ))}
                    </Space>
                  </TagsContainer>
                </Col>
              )}

            {userIntent === 2 && (
              <Col span={24}>
                <TagsContainer>
                  <TagTitle>舞蹈设置：</TagTitle>
                  <Space wrap>
                    <Tag color="purple">
                      模型类型: {danceSettings.model_type.find(opt => opt.value === selectedDanceTags.model_type)?.label || selectedDanceTags.model_type}
                    </Tag>
                    <Tag color="purple">
                      性别: {danceSettings.gender.find(opt => opt.value === selectedDanceTags.gender)?.label || selectedDanceTags.gender}
                    </Tag>
                    <Tag color="purple">
                      场景: {danceSettings.scene_id.find(opt => opt.value === selectedDanceTags.scene_id)?.label || selectedDanceTags.scene_id}
                    </Tag>
                    <Tag color="purple">
                      服装: {danceSettings.cloth_id.find(opt => opt.value === selectedDanceTags.cloth_id)?.label || selectedDanceTags.cloth_id}
                    </Tag>
                  </Space>
                </TagsContainer>
              </Col>
            )}
          </Row>
        </OutputCard>

        <OutputCard title="使用指南">
          <Paragraph>
            <ol>
              <li>选择您想要探讨的内容类型：音乐或舞蹈</li>
              <li>根据您的选择，设置相关的偏好标签</li>
              <li>与AI助手对话，逐步完善您的创意</li>
              <li>当所有必要参数都设置完成后，AI将帮助您实现创意</li>
            </ol>
          </Paragraph>
          <Divider dashed />
          <Paragraph type="secondary">
            提示：您可以随时更改偏好设置，系统会记住您的选择用于后续对话
          </Paragraph>
        </OutputCard>
      </div>
    );
  };

  return (
    <ModelCallPanel
      title="AI助手对话"
      inputForm={renderInputForm()}
      outputDisplay={renderOutputDisplay()}
      modelType="gpt_service_maas"
    />
  );
};

export default GptServicePage; 
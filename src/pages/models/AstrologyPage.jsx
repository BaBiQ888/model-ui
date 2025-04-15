import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, Typography, Card, Row, Col, message, Divider, Avatar, List } from 'antd';
import { SendOutlined, StarOutlined, UserOutlined, RobotOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import ModelCallPanel from '../../components/ModelCallPanel';
import moment from 'moment';

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

const AstrologyPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData } = useModel();
  const [messages, setMessages] = useState([]);

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const { birthCity, birthTime, gender, message } = values;

      // 将时间格式化为 "YYYY-MM-DD HH:mm" 格式
      const formattedBirthTime = birthTime.format('YYYY-MM-DD HH:mm');

      // 构建消息列表
      const messagesList = [
        ...messages,
        {
          role: 'user',
          content: message
        }
      ];

      // 更新UI中的消息列表
      setMessages(messagesList);

      // 清空消息输入框
      form.setFieldsValue({ message: '' });

      // 构建请求参数
      const params = {
        server_id: '31',
        birthcity: birthCity,
        birthtime: formattedBirthTime,
        gender: gender === 'male' ? 'male' : 'female',
        messages: messagesList
      };

      // 调用模型API
      await callModelApi('astrology', params);
    } catch (error) {
      message.error('提问失败: ' + error.message);
    }
  };

  // 渲染输入表单
  const renderInputForm = () => {
    const { loading } = getModelData('astrology');

    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          gender: 'male',
          birthTime: moment()
        }}
      >
        <FormSection>
          <Title level={5}>个人信息设置</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="birthCity"
                label="出生城市"
                rules={[{ required: true, message: '请输入出生城市' }]}
              >
                <Input
                  placeholder="请输入出生城市"
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select>
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="birthTime"
            label="出生时间"
            rules={[{ required: true, message: '请选择出生时间' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="选择出生日期和时间"
            />
          </Form.Item>
        </FormSection>

        <FormSection>
          <Title level={5}>提问</Title>
          <Form.Item
            name="message"
            rules={[{ required: true, message: '请输入您的问题' }]}
          >
            <TextArea
              placeholder="请输入您想问的问题，例如：我适合什么工作？"
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
        </FormSection>
      </Form>
    );
  };

  // 渲染输出展示
  const renderOutputDisplay = () => {
    const { loading, responseData } = getModelData('astrology');

    // 从响应数据中提取结果
    let assistantResponse = '';
    if (responseData && responseData.data && responseData.data.result) {
      // 合并所有的token
      assistantResponse = responseData.data.result
        .filter(item => item.role === 'assistant')
        .map(item => item.content)
        .join('');
    }

    // 构建显示的消息列表
    const displayMessages = [
      ...messages
    ];

    if (assistantResponse) {
      displayMessages.push({
        role: 'assistant',
        content: assistantResponse
      });
    }

    if (displayMessages.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <StarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请填写您的出生信息并提出问题，获取专业占星分析</Text>
        </div>
      );
    }

    return (
      <div>
        <OutputCard title="对话记录">
          <MessageList
            itemLayout="horizontal"
            dataSource={displayMessages}
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
                  title={item.role === 'user' ? '您的问题' : '占星解读'}
                  description={<MessageContent>{item.content}</MessageContent>}
                />
              </List.Item>
            )}
          />

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text>正在解读星盘，请稍候...</Text>
            </div>
          )}
        </OutputCard>

        <OutputCard title="使用指南">
          <Paragraph>
            <ol>
              <li>填写您的出生城市、出生时间和性别；</li>
              <li>在提问框中输入您想了解的问题，例如职业发展、人际关系等；</li>
              <li>点击"发送"按钮获取占星分析结果；</li>
              <li>您可以继续提问，系统会根据您的星盘信息提供更多解读。</li>
            </ol>
          </Paragraph>
          <Divider dashed />
          <Paragraph type="secondary">
            注意：占星分析仅供参考，重要人生决策请结合实际情况综合考虑。
          </Paragraph>
        </OutputCard>
      </div>
    );
  };

  return (
    <ModelCallPanel
      title="占星分析"
      inputForm={renderInputForm()}
      outputDisplay={renderOutputDisplay()}
      modelType="astrology"
    />
  );
};

export default AstrologyPage; 
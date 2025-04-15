import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Row, Col, Card, Image, Space, Tabs, Collapse, Table, Badge, message } from 'antd';
import { DownloadOutlined, PictureOutlined, LoadingOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { useLocation } from 'react-router-dom';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 增强样式组件
const ImagesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const ImageCard = styled(Card)`
  overflow: hidden;
  height: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-body {
    padding: 12px;
  }
  
  .ant-card-cover {
    height: 200px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    &:hover img {
      transform: scale(1.05);
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 12px;
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

// 音乐封面生成模型页面组件
const TxtImageGenerateMusicPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('txt_image_generate_music');
  const [activeTab, setActiveTab] = useState('input');
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 获取URL参数
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const promptFromUrl = queryParams.get('prompt');

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

    // 如果URL中有prompt参数，设置表单值
    if (promptFromUrl) {
      form.setFieldsValue({ prompt: promptFromUrl });
      // 自动提交表单（可选）
      // form.submit();
    }

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      // 组件卸载时清除当前模型的响应数据
      clearResponseData('txt_image_generate_music');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      console.log('提交表单:', values);
      // 调用模型API，确保传递batch_size参数
      await callModelApi('txt_image_generate_music', {
        prompt: values.prompt,
        batch_size: parseInt(values.batchSize) || 1,  // 确保batch_size是数字类型
        music_name: values.prompt.substring(0, 30)  // 使用prompt的前30个字符作为音乐名称
      });
    } catch (error) {
      message.error('生成封面失败: ' + error.message);
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
    // 处理嵌套的数据结构
    const apiData = data.data?.data || {};

    // 生成的图片数量
    if (apiData.res) {
      result.push({
        key: '生成图片数量',
        value: (
          <ValueContainer>
            <span>{apiData.res.length}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(String(apiData.res.length))}
            />
          </ValueContainer>
        ),
        rawValue: apiData.res.length
      });

      // 添加图片URL
      apiData.res.forEach((url, index) => {
        result.push({
          key: `图片 #${index + 1}`,
          value: (
            <ValueContainer>
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                className="copy-button"
                onClick={() => copyToClipboard(url)}
              />
            </ValueContainer>
          ),
          rawValue: url
        });
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
      initialValues={{ batchSize: 1 }}
    >
      <FormSection>
        <Form.Item
          name="prompt"
          label="描述文本"
          rules={[{ required: true, message: '请输入描述文本' }]}
        >
          <TextArea
            placeholder="详细描述您想要的封面风格、内容和感觉..."
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="batchSize"
          label="生成数量"
          extra="设置要生成的封面图片数量(1-8)"
        >
          <Input type="number" min={1} max={8} defaultValue={1} />
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <PictureOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? "生成中..." : "生成封面"}
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

    // 添加详细的调试日志 - 取消注释以启用
    // console.log("完整响应数据：", responseData);
    // console.log("data字段：", responseData?.data);
    // console.log("嵌套data字段：", responseData?.data?.data);
    // console.log("res数组：", responseData?.data?.data?.res);

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交描述文本生成图片</Text>
        </div>
      );
    }

    // 直接访问res数组
    const imageUrls = responseData.data?.data?.res || [];

    // console.log("最终图片URL数组：", imageUrls);

    if (imageUrls.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="warning">未生成任何图片</Text>
        </div>
      );
    }

    return (
      <div>
        <OutputCard title="生成结果">
          <div style={{ marginBottom: 16 }}>
            <Text>已生成 {imageUrls.length} 张音乐封面图片</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">描述: {responseData.requestData?.prompt}</Text>
            </div>
          </div>
          <ImagesContainer>
            {imageUrls.map((url, index) => {
              console.log(`渲染图片 #${index + 1}:`, url);
              return (
                <ImageCard
                  key={index}
                  cover={
                    <Image
                      src={url}
                      alt={`封面-${index + 1}`}
                      preview={{ mask: '预览' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                    />
                  }
                >
                  <Text strong>封面 #{index + 1}</Text>
                  <ButtonContainer>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      size="small"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `音乐封面_${index + 1}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        message.success(`正在下载封面 #${index + 1}`);
                      }}
                    >
                      下载
                    </Button>
                  </ButtonContainer>
                </ImageCard>
              );
            })}
          </ImagesContainer>
        </OutputCard>
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
        <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>生成音乐封面</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default TxtImageGenerateMusicPage; 
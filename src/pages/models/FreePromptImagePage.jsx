import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Tabs,
  message,
  Divider,
  Spin,
  Alert,
  Image,
  Empty,
  Tag
} from 'antd';
import {
  PictureOutlined,
  LoadingOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

// 增强样式组件
const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
`;

const SizeOption = styled(Card)`
  width: 150px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid ${props => props.$selected ? '#1890ff' : '#f0f0f0'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-body {
    padding: 12px;
    text-align: center;
  }
`;

const SamplePrompt = styled(Tag)`
  margin: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ResultImageWrapper = styled.div`
  margin: 20px 0;
`;

const ResultImage = styled.div`
  margin: 16px 0;
  text-align: center;
  
  img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .actions {
    margin-top: 12px;
  }
`;

const OutputCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

// 自由提示词生图页面组件
const FreePromptImagePage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData, error } = getModelData('free_prompt_image');
  const [activeTab, setActiveTab] = useState('input');
  const [imgSize, setImgSize] = useState("1"); // 默认选择2:3社交媒体比例
  const isMountedRef = useRef(true);

  // 使用useRef来跟踪是否已经切换过标签页，避免重复切换导致的循环
  const hasTabSwitched = useRef(false);

  // 样例提示词和尺寸选项
  const samplePrompts = MODEL_RESOURCES.free_prompt_image.samplePrompts;
  const imgSizes = MODEL_RESOURCES.free_prompt_image.imgSizes;

  // 当收到结果时切换到输出页签 - 优化以防止循环更新
  useEffect(() => {
    if (isMountedRef.current && responseData && responseData.data && !loading && !hasTabSwitched.current) {
      hasTabSwitched.current = true;
      setActiveTab('output');
    }

    // 如果没有响应数据，重置切换标记
    if (!responseData) {
      hasTabSwitched.current = false;
    }
  }, [responseData, loading]);

  // 当activeTab变化时处理状态
  useEffect(() => {
    if (activeTab === 'input' && responseData) {
      // 重置切换标记，允许下次提交后再次自动切换
      hasTabSwitched.current = false;
    }
  }, [activeTab, responseData]);

  // 组件挂载和卸载时的处理 - 减少依赖项，避免不必要的重渲染
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearResponseData('free_prompt_image');
    };
  }, []); // 空依赖数组，确保只在组件挂载和卸载时执行

  // 复制到剪贴板
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  }, []);

  // 下载图片
  const downloadImage = useCallback((url, filename = 'generated-image.png') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`开始下载图片: ${filename}`);
  }, []);

  // 处理提交
  const handleSubmit = useCallback(async (values) => {
    try {
      // 重置切换标记，允许下次响应后自动切换标签页
      hasTabSwitched.current = false;

      await callModelApi('free_prompt_image', {
        server_id: '48',
        prompt: values.prompt,
        img_size: imgSize
      });
    } catch (error) {
      message.error('生成图片失败: ' + error.message);
    }
  }, [callModelApi, imgSize]);

  // 处理重置
  const handleReset = useCallback(() => {
    form.resetFields();
    setImgSize("1");
    if (responseData) {
      clearResponseData('free_prompt_image');
    }
  }, [form, responseData, clearResponseData]);

  // 选择样例提示词
  const selectSamplePrompt = useCallback((prompt) => {
    form.setFieldsValue({ prompt });
    message.info(`已选择提示词: ${prompt}`);
  }, [form]);

  // 渲染尺寸比例选项
  const renderSizeOptions = useCallback(() => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
      {imgSizes.map(size => (
        <SizeOption
          key={size.id}
          $selected={imgSize === size.value}
          onClick={() => setImgSize(size.value)}
          hoverable
        >
          <div>
            <Text strong>{size.name}</Text>
          </div>
          <div style={{ marginTop: '8px' }}>
            <FileImageOutlined style={{ fontSize: '24px', color: imgSize === size.value ? '#1890ff' : '#bfbfbf' }} />
          </div>
        </SizeOption>
      ))}
    </div>
  ), [imgSize, imgSizes]);

  // 渲染结果图片
  const renderResult = useCallback(() => {
    if (!responseData) {
      return (
        <Empty
          description="暂无生成结果"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // 处理嵌套响应结构
    let images = [];
    let prompt = '';

    try {
      // 检查多层嵌套结构
      if (responseData.data?.data?.data?.res) {
        images = responseData.data.data.data.res;
      } else if (responseData.data?.data?.res) {
        images = responseData.data.data.res;
      } else if (responseData.data?.res) {
        images = responseData.data.res;
      } else {
        // 尝试递归查找res数组
        const findResArray = (obj) => {
          if (!obj || typeof obj !== 'object') return null;

          // 检查是否有res属性且是数组
          if (obj.res && Array.isArray(obj.res)) {
            return obj.res;
          }

          // 递归搜索嵌套对象
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              const found = findResArray(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };

        const foundImages = findResArray(responseData);
        if (foundImages && foundImages.length > 0) {
          images = foundImages;
        } else {
          console.error('无法解析响应数据中的图像URL数组:', responseData);
          return (
            <Alert
              message="数据格式错误"
              description="未能从响应中解析出图片数据，请检查控制台日志以获取详细信息"
              type="error"
              showIcon
            />
          );
        }
      }

      // 确保images是数组
      if (!Array.isArray(images)) {
        if (typeof images === 'string') {
          // 如果images是单个URL字符串，转换为数组
          images = [images];
        } else {
          throw new Error('解析到的images不是数组或字符串');
        }
      }

      // 获取请求中的提示词
      prompt = responseData.requestData?.params?.prompt || '';

    } catch (error) {
      console.error('解析响应数据时出错:', error, responseData);
      return (
        <Alert
          message="处理响应数据失败"
          description={`在处理服务器响应时遇到错误: ${error.message}`}
          type="error"
          showIcon
        />
      );
    }

    // 如果没有找到图片
    if (!images || images.length === 0) {
      return (
        <Alert
          message="生成结果异常"
          description="未能获取生成的图片，请重新尝试"
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
        <Alert
          message="图片生成成功"
          description={`根据提示词"${prompt}"已成功生成${images.length}张图片`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Paragraph>
          <Text strong>提示词：</Text>
          <Text style={{ marginLeft: 8 }}>{prompt}</Text>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(prompt)}
            style={{ marginLeft: 8 }}
          />
        </Paragraph>

        <Paragraph>
          <Text strong>图片尺寸：</Text>
          <Text style={{ marginLeft: 8 }}>
            {imgSizes.find(s => s.value === responseData.requestData?.params?.img_size)?.name || '默认比例'}
          </Text>
        </Paragraph>

        <Divider />

        <ResultImageWrapper>
          <Row gutter={[16, 16]}>
            {images.map((imageUrl, index) => (
              <Col xs={24} sm={12} key={index}>
                <ResultImage>
                  <Image
                    src={imageUrl}
                    alt={`生成图片${index + 1}`}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg"
                    onError={() => {
                      console.error(`图片加载失败: ${imageUrl}`);
                      message.error(`图片加载失败，已使用占位图`);
                    }}
                  />
                  <div className="actions">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadImage(imageUrl, `生成图片${index + 1}.jpg`)}
                      style={{ marginRight: 8 }}
                    >
                      下载图片
                    </Button>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(imageUrl)}
                    >
                      复制链接
                    </Button>
                  </div>
                </ResultImage>
              </Col>
            ))}
          </Row>
        </ResultImageWrapper>
      </div>
    );
  }, [responseData, imgSizes, copyToClipboard, downloadImage, setActiveTab, message]);

  // 渲染输入表单
  const renderInputForm = useCallback(() => (
    <div>
      <Title level={3}>自由提示词生图</Title>
      <Paragraph>
        通过自然语言描述，生成您想要的图片。支持中、英、日、韩提示词，可选择不同的图片尺寸。
      </Paragraph>

      <FormSection>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ prompt: '' }}
        >
          <Form.Item
            name="prompt"
            label="提示词"
            rules={[{ required: true, message: '请输入提示词' }]}
          >
            <TextArea
              placeholder="请描述您想要生成的图片，如：一个真人版的蓝色头发女孩在塞纳河畔跳舞"
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item label="图片尺寸">
            {renderSizeOptions()}
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PictureOutlined />}
                loading={loading}
                disabled={loading}
              >
                生成图片
              </Button>
              <Button onClick={handleReset} disabled={loading}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </FormSection>

      <FormSection>
        <Title level={4}>样例提示词</Title>
        <div style={{ marginTop: 16 }}>
          {samplePrompts.map((prompt, index) => (
            <SamplePrompt
              key={index}
              color="blue"
              onClick={() => selectSamplePrompt(prompt)}
            >
              {prompt}
            </SamplePrompt>
          ))}
        </div>
      </FormSection>
    </div>
  ), [form, handleSubmit, handleReset, loading, renderSizeOptions, samplePrompts, selectSamplePrompt]);

  // 渲染输出显示
  const renderOutputDisplay = useCallback(() => (
    <div>
      <Title level={3}>生成结果</Title>
      <OutputCard>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
            <div style={{ marginTop: 16 }}>正在生成图片，请稍候...</div>
          </div>
        ) : error ? (
          <Alert
            message="生成失败"
            description={error.message || '请稍后重试'}
            type="error"
            showIcon
          />
        ) : (
          renderResult()
        )}
      </OutputCard>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button onClick={() => setActiveTab('input')}>返回编辑提示词</Button>
      </div>
    </div>
  ), [loading, error, renderResult]);

  // 处理标签页切换
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
  }, []);

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'input',
            label: '提示词输入',
            children: renderInputForm(),
          },
          {
            key: 'output',
            label: '生成结果',
            children: renderOutputDisplay(),
            disabled: !responseData && !loading && !error,
          }
        ]}
      />
    </div>
  );
};

export default FreePromptImagePage;
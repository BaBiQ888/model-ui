import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Upload, Card, Typography, Row, Col, Tabs, Space, Divider, Alert, message, Spin, Radio } from 'antd';
import {
  PictureOutlined,
  UploadOutlined,
  DownloadOutlined,
  CopyOutlined,
  LinkOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Text, Title, Paragraph } = Typography;

// 样式组件
const FormSection = styled.div`
  margin-bottom: 24px;
  background-color: #fafafa;
  padding: 24px;
  border-radius: 8px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ImagePreviewContainer = styled.div`
  margin: 16px 0;
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const ImageCard = styled(Card)`
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .ant-card-head {
    background-color: #fafafa;
  }

  .image-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #f5f5f5;
  }

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;

const ActionButton = styled(Button)`
  margin: 4px;
`;

/**
 * lora推理v2 (instantid_photo_3DReal) 页面组件 
 */
const InstantIdPhoto3DRealPage = () => {
  // 表单和状态
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('instantid_photo_3DReal');
  const [activeTab, setActiveTab] = useState('input');
  const [imageSource, setImageSource] = useState('url');
  const [previewImage, setPreviewImage] = useState('');
  const [imageBase64, setImageBase64] = useState('');

  // 使用useRef跟踪是否已经切换过标签页，避免重复切换导致的循环
  const hasTabSwitched = useRef(false);

  // 添加一个debug辅助函数，统一管理日志输出
  const debug = useRef({
    log: (message, data) => {
      // 在开发环境下输出日志，避免使用process.env
      const isDevelopment = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (isDevelopment) {
        console.log(`[InstantIdPhoto3DReal] ${message}`, data);
      }
    }
  }).current;

  // 使用useMemo缓存结果图片URL的提取，避免重复计算
  const extractedImageUrls = React.useMemo(() => {
    if (!responseData) return { resultImageUrl: null, originalImageUrl: previewImage };

    debug.log('提取图片URL，当前响应数据:', responseData);

    // 提取结果图片URL
    let resultImageUrl = null;

    // 检查是否已有处理好的UI数据
    if (responseData.uiData && responseData.uiData.imageUrl) {
      resultImageUrl = responseData.uiData.imageUrl;
      debug.log('从uiData中提取到图片URL:', resultImageUrl);
    } else {
      // 递归查找嵌套结构中的res字段
      const findResField = (obj) => {
        if (!obj || typeof obj !== 'object') return null;

        // 直接检查当前对象是否有res字段
        if (obj.res && typeof obj.res === 'string' && obj.res.startsWith('http')) {
          return obj.res;
        }

        // 递归检查所有子对象
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            const found = findResField(obj[key]);
            if (found) return found;
          }
        }

        return null;
      };

      resultImageUrl = findResField(responseData);
      debug.log('递归查找到的图片URL:', resultImageUrl);
    }

    const originalImageUrl = responseData.uiData?.originalImageUrl || previewImage;

    return { resultImageUrl, originalImageUrl };
  }, [responseData, previewImage]);

  // 当收到响应数据时切换到输出标签页
  useEffect(() => {
    // 只有当有响应数据，且不在加载中，且尚未切换过标签页时才执行
    if (responseData && !loading && !hasTabSwitched.current) {
      debug.log('切换到输出标签页', { responseData, loading });
      hasTabSwitched.current = true;
      setActiveTab('output');
    }

    // 如果没有响应数据，重置切换标记
    if (!responseData) {
      hasTabSwitched.current = false;
    }
  }, [responseData, loading, debug]);

  // 当activeTab变化时进行处理
  useEffect(() => {
    if (activeTab === 'input' && responseData) {
      // 重置切换标记，允许下次提交后再次自动切换
      hasTabSwitched.current = false;
    }
  }, [activeTab, responseData]);

  // 组件卸载时清除响应数据
  useEffect(() => {
    return () => {
      clearResponseData('instantid_photo_3DReal');
    };
  }, [clearResponseData]);

  // 切换图片源类型
  const handleImageSourceChange = (e) => {
    setImageSource(e.target.value);
    setPreviewImage('');
    setImageBase64('');
    form.setFieldsValue({ imageUrl: '', imageFile: undefined });
  };

  // 处理图片URL输入变化
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setPreviewImage(url);
  };

  // 处理文件上传
  const handleFileUpload = async (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);

      // 生成预览URL
      const previewUrl = URL.createObjectURL(info.file.originFileObj);
      setPreviewImage(previewUrl);

      // 转换为Base64
      try {
        const base64 = await fileToBase64(info.file.originFileObj);
        setImageBase64(base64);
      } catch {
        // 忽略错误详情
        message.error('图片转换失败');
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    let imgSrc = '';

    if (imageSource === 'url') {
      imgSrc = values.imageUrl;
    } else if (imageSource === 'upload' && imageBase64) {
      imgSrc = imageBase64;
    }

    if (!imgSrc) {
      message.error('请提供有效的图片数据');
      return;
    }

    try {
      await callModelApi('instantid_photo_3DReal', {
        src: imgSrc
      });
    } catch (error) {
      message.error('图片处理失败: ' + error.message);
    }
  };

  // 将文件转换为Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // 完整的base64字符串包含前缀，如 "data:image/jpeg;base64,"
        // 根据API要求可能需要截取掉前缀部分
        const fullBase64 = reader.result;
        resolve(fullBase64);
      };
      reader.onerror = error => reject(error);
    });
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

  // 下载图片
  const downloadImage = (url, fileName = 'lora推理结果.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Title level={4}>图片来源</Title>
        <Form.Item name="imageSource" initialValue={imageSource}>
          <Radio.Group onChange={(e) => handleImageSourceChange(e)} value={imageSource}>
            <Radio value="url">图片URL</Radio>
            <Radio value="upload">上传图片</Radio>
          </Radio.Group>
        </Form.Item>

        {imageSource === 'url' ? (
          <Form.Item
            name="imageUrl"
            label="图片URL"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input
              placeholder="请输入图片文件URL"
              onChange={handleImageUrlChange}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="imageFile"
            label="上传图片"
            valuePropName="file"
            rules={[{ required: true, message: '请上传图片文件' }]}
          >
            <Upload
              name="image"
              listType="picture"
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件!');
                }
                return isImage || Upload.LIST_IGNORE;
              }}
              onChange={handleFileUpload}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>上传图片文件</Button>
            </Upload>
          </Form.Item>
        )}

        {previewImage && (
          <ImagePreviewContainer>
            <Text>预览图片</Text>
            <div style={{ marginTop: 8 }}>
              <PreviewImage src={previewImage} alt="上传预览" />
            </div>
          </ImagePreviewContainer>
        )}
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
          {loading ? "处理中..." : "生成3D真实感图片"}
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交图片生成3D真实感效果</Text>
        </div>
      );
    }

    const { resultImageUrl, originalImageUrl } = extractedImageUrls;

    // 检查是否找到有效的结果图片URL
    if (!resultImageUrl) {
      return (
        <Alert
          message="处理结果异常"
          description="未能从响应中提取图片URL，请检查控制台日志或重试"
          type="error"
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
          message="3D真实感图片生成成功"
          description="图片已成功生成，您可以下载图片或对比查看效果"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <ComparisonContainer>
          <ImageCard
            title="原始图片"
            extra={
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => downloadImage(originalImageUrl, '原始图片.png')}
              />
            }
          >
            <div className="image-container">
              {originalImageUrl ? (
                <img src={originalImageUrl} alt="原始图片" />
              ) : (
                <div>无法显示原始图片</div>
              )}
            </div>
          </ImageCard>

          <ImageCard
            title="生成结果"
            extra={
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => downloadImage(resultImageUrl, 'lora推理结果.png')}
              />
            }
          >
            <div className="image-container">
              {resultImageUrl ? (
                <img src={resultImageUrl} alt="生成的3D真实感图片" />
              ) : (
                <div>无法显示生成结果</div>
              )}
            </div>
          </ImageCard>
        </ComparisonContainer>

        <StyledCard title="图片地址">
          <Row align="middle" gutter={[16, 16]}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>生成图片地址：</Text>
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                  style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}
                >
                  {resultImageUrl}
                </Paragraph>
                <Space>
                  <ActionButton
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadImage(resultImageUrl, 'lora推理结果.png')}
                  >
                    下载图片
                  </ActionButton>
                  <ActionButton
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(resultImageUrl)}
                  >
                    复制链接
                  </ActionButton>
                  <ActionButton
                    icon={<LinkOutlined />}
                    onClick={() => window.open(resultImageUrl, '_blank')}
                  >
                    在新窗口打开
                  </ActionButton>
                </Space>
              </Space>
            </Col>
          </Row>
        </StyledCard>
      </div>
    );
  };

  // 自定义Tabs组件
  const CustomTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      tabBarGutter={10}
      items={[
        {
          key: 'input',
          label: '输入',
          children: (
            <div style={{ padding: '16px 0' }}>
              {renderInputForm()}
            </div>
          )
        },
        {
          key: 'output',
          label: '输出',
          children: (
            <div style={{ padding: '16px 0' }}>
              {renderOutputDisplay()}
            </div>
          )
        }
      ]}
    />
  );

  return (
    <Card title={
      <Space>
        <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>lora推理v2 - 3D真实感</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default InstantIdPhoto3DRealPage; 
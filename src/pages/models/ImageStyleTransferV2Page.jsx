import React, { useState, useRef, useEffect } from 'react';
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
  Collapse,
  Upload,
  Radio,
  Select,
  Divider,
  Spin,
  Alert,
  Image,
  Empty,
  Tag
} from 'antd';
import {
  PictureOutlined,
  UploadOutlined,
  LoadingOutlined,
  CopyOutlined,
  DownloadOutlined,
  InboxOutlined,
  LinkOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { Dragger } = Upload;
const { Option } = Select;

// 增强样式组件
const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
`;

const StyleOptionWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
`;

const StyleOption = styled(Card)`
  width: 130px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid ${props => props.$selected ? '#1890ff' : '#f0f0f0'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-body {
    padding: 12px;
    text-align: center;
  }
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

const UploadContainer = styled.div`
  background-color: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
  text-align: center;
  transition: all 0.3s;
  
  &:hover {
    border-color: #40a9ff;
  }
`;

const PreviewImage = styled.div`
  margin-top: 16px;
  
  img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const StyleTypeTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
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

// 图片风格化v2组件
const ImageStyleTransferV2Page = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData, error } = getModelData('image_style_transfer_v2');
  const [activeTab, setActiveTab] = useState('input');
  const [imageUrl, setImageUrl] = useState('');
  const [styleType, setStyleType] = useState(0);
  const [imgSize, setImgSize] = useState(1);
  const isMountedRef = useRef(true);

  // 图片上传前验证
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB!');
      return false;
    }

    // 读取并预览图片
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (isMountedRef.current) {
        setImageUrl(reader.result);
        form.setFieldsValue({ oriImg: reader.result });
      }
    };

    // 阻止自动上传
    return false;
  };

  // 处理图片上传
  const handleImageUpload = (info) => {
    if (info.file) {
      // 读取图片为base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (isMountedRef.current) {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(info.file);
    }
  };

  // 处理图片URL输入变更
  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    if (url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      setImageUrl(url);
    } else if (url) {
      // 仅在有值且格式不正确时显示警告
      message.warning('请输入有效的图片URL (以http或https开头，以常见图片格式结尾)');
    }
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
  const downloadImage = (url, filename = 'styled-image.png') => {
    // 如果是Base64格式
    if (url.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('图片下载已开始');
      return;
    }

    // 如果是URL格式
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('图片下载已开始');
      })
      .catch(error => {
        console.error('下载图片失败:', error);
        message.error('下载图片失败');
      });
  };

  // 提交表单，调用模型API
  const handleSubmit = async (values) => {
    try {
      let imageData = values.imageUrl;

      // 如果有上传的图片文件，使用base64数据
      if (imageUrl && imageUrl.startsWith('data:')) {
        imageData = imageUrl;
      } else if (imageUrl && imageUrl.startsWith('http')) {
        imageData = imageUrl;
      }

      if (!imageData) {
        message.error('请上传图片或输入图片URL');
        return;
      }

      // 调用模型API
      await callModelApi('image_style_transfer_v2', {
        prompt: values.prompt || '',
        ori_img: imageData,
        style_type: styleType,
        img_size: imgSize
      });

      // 成功提交后自动切换到输出选项卡，但不再需要手动设置，
      // 因为我们在useEffect中添加了依赖项来监听响应数据变化
    } catch (error) {
      message.error('生成失败: ' + error.message);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setImageUrl('');
    setStyleType(0);
    setImgSize(1);
    clearResponseData('image_style_transfer_v2');
  };

  // 生命周期处理
  useEffect(() => {
    isMountedRef.current = true;

    // 组件卸载时清理
    return () => {
      isMountedRef.current = false;
      clearResponseData('image_style_transfer_v2');
    };
  }, [clearResponseData]);

  // 当响应数据发生变化时，自动切换到输出标签页
  useEffect(() => {
    if (responseData && !loading && isMountedRef.current) {
      setActiveTab('output');
    }
  }, [responseData, loading]);

  // 渲染风格选项
  const renderStyleOptions = () => {
    const styleOptions = MODEL_RESOURCES.image_style_transfer_v2.styleTypes;

    return (
      <FormSection>
        <Title level={5}>风格选择</Title>
        <StyleOptionWrapper>
          {styleOptions.map(style => (
            <StyleOption
              key={style.id}
              $selected={styleType === style.value}
              onClick={() => setStyleType(style.value)}
              hoverable
            >
              <div className="style-icon">
                <PictureOutlined style={{ fontSize: 24, color: styleType === style.value ? '#1890ff' : '#8c8c8c' }} />
              </div>
              <div className="style-name">
                <Text strong={styleType === style.value}>{style.name}</Text>
              </div>
            </StyleOption>
          ))}
        </StyleOptionWrapper>
      </FormSection>
    );
  };

  // 渲染尺寸选项
  const renderSizeOptions = () => {
    const sizeOptions = MODEL_RESOURCES.image_style_transfer_v2.imgSizes;

    return (
      <FormSection>
        <Title level={5}>输出尺寸</Title>
        <StyleOptionWrapper>
          {sizeOptions.map(size => (
            <SizeOption
              key={size.id}
              $selected={imgSize === size.value}
              onClick={() => setImgSize(size.value)}
              hoverable
            >
              <div className="size-icon">
                {size.value === 0 && <div style={{ width: '40px', height: '40px', background: '#1890ff', margin: '0 auto' }}></div>}
                {size.value === 1 && <div style={{ width: '30px', height: '45px', background: '#1890ff', margin: '0 auto' }}></div>}
                {size.value === 2 && <div style={{ width: '36px', height: '48px', background: '#1890ff', margin: '0 auto' }}></div>}
                {size.value === 3 && <div style={{ width: '48px', height: '36px', background: '#1890ff', margin: '0 auto' }}></div>}
                {size.value === 4 && <div style={{ width: '27px', height: '48px', background: '#1890ff', margin: '0 auto' }}></div>}
                {size.value === 5 && <div style={{ width: '48px', height: '27px', background: '#1890ff', margin: '0 auto' }}></div>}
              </div>
              <div className="size-name" style={{ marginTop: '8px' }}>
                <Text strong={imgSize === size.value}>{size.name}</Text>
              </div>
            </SizeOption>
          ))}
        </StyleOptionWrapper>
      </FormSection>
    );
  };

  // 渲染结果
  const renderResult = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">正在处理图片，这可能需要一些时间...</Text>
          </div>
        </div>
      );
    }

    // 处理嵌套的错误信息 - 使用从uiData中提取的errorMessage
    if (responseData && responseData.uiData && responseData.uiData.errorMessage) {
      const { errorMessage, errorCode } = responseData.uiData;
      return (
        <Alert
          message="风格化处理失败"
          description={<>
            <div>{errorMessage}</div>
            <div style={{ marginTop: 8 }}>
              {errorCode === 500 &&
                <Text type="secondary">服务器内部错误，请稍后重试或尝试使用其他图片或风格。</Text>
              }
            </div>
          </>}
          type="error"
          showIcon
          action={
            <Space direction="vertical" style={{ marginLeft: 8 }}>
              <Button
                size="small"
                type="primary"
                onClick={() => setActiveTab('input')}
              >
                返回重试
              </Button>
              <Button
                size="small"
                onClick={handleReset}
              >
                重置所有
              </Button>
            </Space>
          }
        />
      );
    }

    if (error) {
      return (
        <Alert
          message="生成失败"
          description={<>
            <div>{error}</div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">请检查您的网络连接或稍后重试</Text>
            </div>
          </>}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => setActiveTab('input')}
            >
              返回重试
            </Button>
          }
        />
      );
    }

    if (!responseData || !responseData.uiData) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交图片进行风格化处理</Text>
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => setActiveTab('input')}
          >
            去上传图片
          </Button>
        </div>
      );
    }

    const { uiData } = responseData;
    const stylizedImageUrl = uiData.stylizedImageUrl;
    const originalImageUrl = uiData.originalImageUrl;

    if (!stylizedImageUrl) {
      return (
        <Alert
          message="处理结果异常"
          description={<>
            <div>未能获取风格化后的图片，请重新尝试</div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">可能是图片格式不兼容或服务暂时不可用</Text>
            </div>
          </>}
          type="warning"
          showIcon
          action={
            <Space direction="vertical" style={{ marginLeft: 8 }}>
              <Button
                size="small"
                type="primary"
                onClick={() => setActiveTab('input')}
              >
                返回重试
              </Button>
              <Button
                size="small"
                onClick={handleReset}
              >
                重置所有
              </Button>
            </Space>
          }
        />
      );
    }

    return (
      <div>
        <OutputCard title="风格化结果">
          <Alert
            message="图片风格化处理成功"
            description="您可以保存图片或使用其他风格继续尝试"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="原始图片" size="small">
                <Image
                  src={originalImageUrl || imageUrl}
                  alt="原始图片"
                  style={{ maxWidth: '100%' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title={
                  <div>
                    风格化图片
                    <StyleTypeTag color="blue">{MODEL_RESOURCES.image_style_transfer_v2.styleTypes.find(s => s.value === (responseData.requestData?.style_type || styleType))?.name || '默认风格'}</StyleTypeTag>
                    <StyleTypeTag color="purple">{MODEL_RESOURCES.image_style_transfer_v2.imgSizes.find(s => s.value === (responseData.requestData?.img_size || imgSize))?.name || '默认尺寸'}</StyleTypeTag>
                  </div>
                }
                size="small"
              >
                <ResultImage>
                  <Image
                    src={stylizedImageUrl}
                    alt="风格化结果"
                    style={{ maxWidth: '100%' }}
                  />
                  <div className="actions">
                    <Button
                      icon={<DownloadOutlined />}
                      type="primary"
                      onClick={() => downloadImage(stylizedImageUrl, `styled-image-${MODEL_RESOURCES.image_style_transfer_v2.styleTypes.find(s => s.value === (responseData.requestData?.style_type || styleType))?.name || '风格化'}.png`)}
                      style={{ marginRight: 8 }}
                    >
                      下载图片
                    </Button>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(stylizedImageUrl)}
                    >
                      复制链接
                    </Button>
                  </div>
                </ResultImage>
              </Card>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<PictureOutlined />}
                onClick={() => setActiveTab('input')}
              >
                尝试其他风格
              </Button>
              <Button
                size="large"
                onClick={handleReset}
              >
                重新开始
              </Button>
            </Space>
          </div>
        </OutputCard>
      </div>
    );
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        style_type: 0,
        img_size: 1
      }}
    >
      <Alert
        message="图片风格化"
        description="上传图片后选择喜欢的风格，AI将为您创建独特的艺术效果"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <FormSection>
        <Title level={5}>选择图片</Title>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="oriImg"
              hidden
            >
              <Input />
            </Form.Item>

            <UploadContainer>
              <Upload
                name="oriImg"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleImageUpload}
              >
                {imageUrl && imageUrl.startsWith('data:') ? (
                  <PreviewImage>
                    <img src={imageUrl} alt="预览" />
                  </PreviewImage>
                ) : (
                  <div>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: 24 }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽上传图片</p>
                    <p className="ant-upload-hint">支持JPG、PNG等格式，大小不超过5MB</p>
                  </div>
                )}
              </Upload>
            </UploadContainer>
          </Col>

          <Col span={12}>
            <Form.Item
              name="imageUrl"
              label="或输入图片URL"
              rules={[
                {
                  pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
                  message: '请输入有效的图片URL',
                }
              ]}
            >
              <Input
                placeholder="https://example.com/image.jpg"
                onChange={handleImageUrlChange}
              />
            </Form.Item>

            {imageUrl && imageUrl.startsWith('http') && (
              <PreviewImage>
                <img
                  src={imageUrl}
                  alt="URL预览"
                  onError={() => {
                    message.error('图片加载失败，请检查URL是否有效');
                    setImageUrl('');
                  }}
                />
              </PreviewImage>
            )}
          </Col>
        </Row>
      </FormSection>

      <FormSection>
        <Form.Item
          name="prompt"
          label="提示词（可选）"
        >
          <TextArea
            placeholder="输入提示词以增强风格效果，支持中、英、日、韩提示词"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </Form.Item>
        <Text type="secondary">提示词可以更好地引导AI理解您想要的风格效果</Text>
      </FormSection>

      {renderStyleOptions()}

      {renderSizeOptions()}

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={loading ? <LoadingOutlined /> : <PictureOutlined />}
            size="large"
            disabled={!imageUrl}
          >
            {loading ? "处理中..." : "开始风格化"}
          </Button>
          <Button onClick={handleReset} size="large">重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => (
    <div>{renderResult()}</div>
  );

  return (
    <Card title={
      <Space>
        <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>图片风格化v2</span>
      </Space>
    } size="large">
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
    </Card>
  );
};

export default ImageStyleTransferV2Page; 
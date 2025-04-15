import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Space, Tabs, message, Radio, Upload, Switch, Alert } from 'antd';
import { PictureOutlined, LoadingOutlined, UploadOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Text, Title } = Typography;

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
  padding: 12px;
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
  margin-bottom: 4px;
`;

const DataPanel = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

const ImagePreviewContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
`;

const ResultImagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 16px;
`;

const ResultImageWrapper = styled.div`
  text-align: center;
`;

const ResultImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

// 证件照页面组件
const InstantIdPhotoPage = () => {
  // 表单和状态
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('instantid_photo');
  const [activeTab, setActiveTab] = useState('input');
  const [imageSource, setImageSource] = useState('url');
  const [previewImage, setPreviewImage] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [isWhitePerson, setIsWhitePerson] = useState(true);

  // 使用useRef来跟踪是否已经切换过标签页，避免重复切换导致的循环
  const hasTabSwitched = useRef(false);

  // 当收到响应数据时切换到输出标签页 - 优化依赖和条件判断
  useEffect(() => {
    // 只有当有响应数据，且不在加载中，且尚未切换过标签页时才执行
    if (responseData && !loading && !hasTabSwitched.current) {
      hasTabSwitched.current = true;
      setActiveTab('output');
    }

    // 如果没有响应数据，重置切换标记
    if (!responseData) {
      hasTabSwitched.current = false;
    }
  }, [responseData, loading]);

  // 组件卸载时清除响应数据 - 移除不必要的依赖
  useEffect(() => {
    // 组件挂载时不执行任何操作，只在卸载时清理
    return () => {
      clearResponseData('instantid_photo');
    };
  }, []); // 空依赖数组，确保只在组件卸载时执行清理

  // 当activeTab变化时，如果是从output切换到input，清除历史响应数据
  useEffect(() => {
    if (activeTab === 'input' && responseData) {
      // 重置切换标记，允许下次提交后再次自动切换
      hasTabSwitched.current = false;
      // 这里不要主动清除responseData，避免不必要的重渲染
    }
  }, [activeTab, responseData]);

  // 切换图片源类型
  const handleImageSourceChange = (e) => {
    setImageSource(e.target.value);
    setPreviewImage('');
    setImageBase64('');
    form.setFieldsValue({ imageUrl: '', imageFile: undefined });
  };

  // 处理图片URL输入变化
  const handleImageUrlChange = useCallback((e) => {
    const url = e.target.value;
    setPreviewImage(url);
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(async (info) => {
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
        message.error('图片转换失败');
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  }, []);

  // 处理种族选择变更
  const handleRaceChange = useCallback((checked) => {
    setIsWhitePerson(checked);
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async (values) => {
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
      // 重置切换标记，允许下次响应后自动切换标签页
      hasTabSwitched.current = false;

      await callModelApi('instantid_photo', {
        src: imgSrc,
        flag: isWhitePerson ? 'True' : 'False'
      });
    } catch (error) {
      message.error('证件照处理失败: ' + error.message);
    }
  }, [imageSource, imageBase64, isWhitePerson, callModelApi]);

  // 将文件转换为Base64
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const fullBase64 = reader.result;
        resolve(fullBase64);
      };
      reader.onerror = error => reject(error);
    });
  }, []);

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
  const downloadImage = useCallback((url, fileName = '证件照.jpg') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

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

      <FormSection>
        <Title level={4}>人物种族选择</Title>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Switch
            checked={isWhitePerson}
            onChange={handleRaceChange}
            style={{ marginRight: 8 }}
          />
          <Text>{isWhitePerson ? '白人' : '黑人'}</Text>
        </div>
        <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
          请根据图片中人物的实际种族进行选择，以获得更好的处理效果
        </Text>
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
          {loading ? "处理中..." : "生成证件照"}
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示 - 提取到外面以防止循环更新
  const renderOutputDisplay = useCallback(() => {
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交图片生成证件照</Text>
        </div>
      );
    }

    // 处理嵌套响应结构
    let resultData;
    let resultImageUrl;

    try {
      // 检查更多层级的嵌套结构 - 适应各种可能的响应格式
      if (responseData.data?.data?.data?.res) {
        resultData = responseData.data.data.data;
        resultImageUrl = resultData.res;
      } else if (responseData.data?.data?.res) {
        resultData = responseData.data.data;
        resultImageUrl = resultData.res;
      } else if (responseData.data?.res) {
        resultData = responseData.data;
        resultImageUrl = resultData.res;
      } else if (typeof responseData.data === 'string' && responseData.data.includes('http')) {
        // 直接返回URL的情况
        resultImageUrl = responseData.data;
      } else {
        // 尝试在整个响应对象中查找res属性
        const findRes = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.res && typeof obj.res === 'string' && obj.res.startsWith('http')) {
            return obj.res;
          }
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              const found = findRes(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };

        resultImageUrl = findRes(responseData);

        if (!resultImageUrl) {
          console.error('无法解析响应数据中的图像URL:', responseData);
          return (
            <Alert
              message="数据格式错误"
              description="未能从响应中解析出证件照数据，请检查控制台日志以获取详细信息"
              type="error"
              showIcon
            />
          );
        }
      }
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

    const originalImageUrl = responseData.uiData?.originalImageUrl || previewImage;

    // 如果找不到结果图像链接，显示错误提示
    if (!resultImageUrl) {
      return (
        <Alert
          message="处理结果异常"
          description="未能获取证件照生成结果，请重新尝试"
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
        <OutputCard title="处理结果">
          <Alert
            message="证件照生成成功"
            description="已成功处理图片为标准证件照格式"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <ResultImagesContainer>
            <InfoItem>
              <InfoLabel>原始图片</InfoLabel>
              <ResultImageWrapper>
                <ResultImage
                  src={originalImageUrl}
                  alt="原始图片"
                  onError={(e) => {
                    console.error('原始图片加载失败');
                    e.target.src = 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png';
                    message.error('原始图片加载失败，已使用占位图');
                  }}
                />
              </ResultImageWrapper>
            </InfoItem>

            <InfoItem>
              <InfoLabel>处理后的证件照</InfoLabel>
              <ResultImageWrapper>
                <ResultImage
                  src={resultImageUrl}
                  alt="证件照结果"
                  onError={(e) => {
                    console.error('证件照结果加载失败');
                    e.target.src = 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png';
                    message.error('证件照结果加载失败，已使用占位图');
                  }}
                />
              </ResultImageWrapper>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => downloadImage(resultImageUrl, '证件照.jpg')}
                >
                  下载证件照
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(resultImageUrl)}
                >
                  复制图片链接
                </Button>
              </div>
            </InfoItem>
          </ResultImagesContainer>
        </OutputCard>

        <DataPanel>
          <Title level={5}>处理详情</Title>
          <InfoItem>
            <InfoLabel>处理参数</InfoLabel>
            <div>
              <Text strong>种族设置: </Text>
              <Text>{responseData.requestData?.params?.flag === 'True' ? '白人' : '黑人'}</Text>
            </div>
          </InfoItem>
        </DataPanel>
      </div>
    );
  }, [responseData, previewImage, copyToClipboard, downloadImage, setActiveTab, message]);

  // 在外部定义一个handleTabChange函数，以避免每次渲染都重新创建函数
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
  }, []);

  return (
    <Card title={
      <Space>
        <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>证件照</span>
      </Space>
    } size="large">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        size="large"
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

export default InstantIdPhotoPage; 
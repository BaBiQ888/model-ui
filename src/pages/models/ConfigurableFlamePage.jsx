import React, { useState } from 'react';
import { Form, Input, Button, Select, Typography, Card, Row, Col, message, Upload, Radio, Image, Divider, Alert, Spin } from 'antd';
import { UploadOutlined, LinkOutlined, DownloadOutlined, CopyOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import ModelCallPanel from '../../components/ModelCallPanel';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// Styled components
const FormSection = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const OutputCard = styled(Card)`
  margin-bottom: 28px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  
  .ant-card-head {
    background-color: #f7f7f7;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .ant-card-body {
    padding: 24px;
  }
`;

const ResultImage = styled(Image)`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.01);
  }
`;

const ImagePreview = styled.div`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  img {
    width: 100%;
    display: block;
    transition: all 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.02);
  }
`;

const DownloadItem = styled.div`
  padding: 16px;
  background-color: #f0f8ff;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #e6f7ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .title {
    margin-right: 8px;
    color: #1890ff;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const InfoBox = styled.div`
  padding: 12px;
  background-color: #e6f7ff;
  border-radius: 8px;
  margin-bottom: 16px;
  
  .ant-typography {
    margin-bottom: 0;
  }
`;

const ConfigurableFlamePage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData } = useModel();
  const [fileList, setFileList] = useState([]);

  // 处理图片来源变更
  const handleImageSourceChange = (e) => {
    const value = e.target.value;
    form.setFieldsValue({ imageSource: value });
    setFileList([]);
  };

  // 处理文件上传
  const handleFileUpload = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }

    if (info.file.status === 'done') {
      // 获取上传的文件并转换为 Base64
      const file = info.file.originFileObj;
      try {
        const base64 = await fileToBase64(file);
        setFileList([info.file]);
        form.setFieldsValue({ base64Image: base64 });
        message.success(`${info.file.name} 已成功上传`);
      } catch (error) {
        console.error('图片处理失败:', error);
        message.error('图片处理失败，请重试');
        setFileList([]);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
      setFileList([]);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const { imageSource, imageUrl, skinColor } = values;

      // 构建请求参数
      const params = {
        server_id: '37',
        user_callback_url: '',
        user_callback_data: {},
        flag: skinColor === 'white' ? 'True' : 'False'
      };

      // 根据图片来源设置src参数
      if (imageSource === 'url') {
        params.src = imageUrl;
      } else if (imageSource === 'upload' && fileList.length > 0) {
        // 如果是上传的图片，直接使用base64
        params.src = values.base64Image || 'https://formernew.48.cn/idolgpt.48.cn/appgamework/backend/dev/2024/07/05/syp_test1/final_uv.png';
        message.info('使用上传的图片生成模型');
      } else {
        message.error('请先上传或输入有效的图片URL');
        return;
      }

      // 显示提交中状态
      message.loading({ content: '正在生成头部参数化模型，请稍候...', key: 'flameLoading', duration: 0 });

      // 调用模型API
      await callModelApi('configurable_flame', params);

      // 成功后显示提示
      message.success({ content: '头部参数化模型生成成功', key: 'flameLoading', duration: 2 });
    } catch (error) {
      message.error({ content: `生成失败: ${error.message}`, key: 'flameLoading', duration: 3 });
      console.error('配置化Flame模型调用失败:', error);
    }
  };

  // 将文件转换为Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // 返回完整的 base64 字符串，包括 data:image/jpeg;base64, 前缀
        // 服务端可能需要完整的 base64 字符串
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(error);
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

  // 下载文件
  const downloadFile = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success(`开始下载: ${fileName}`);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        imageSource: 'url',
        skinColor: 'asian'
      }}
    >
      <InfoBox>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          上传人物照片，生成头部参数化模型，获取表情和普通Blendshape数据
        </Paragraph>
      </InfoBox>

      <FormSection>
        <Title level={4}>参考图片</Title>
        <Form.Item name="imageSource">
          <Radio.Group onChange={handleImageSourceChange} buttonStyle="solid">
            <Radio.Button value="url">输入图片URL</Radio.Button>
            <Radio.Button value="upload">上传图片</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {form.getFieldValue('imageSource') === 'url' ? (
          <Form.Item
            name="imageUrl"
            label="图片URL"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input
              placeholder="请输入有效的图片URL"
              suffix={<LinkOutlined />}
              size="large"
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="uploadImage"
            label="上传图片"
            extra="支持 jpg、png 格式，建议使用高质量的图片获得更好效果"
          >
            <Upload
              name="avatar"
              listType="picture-card"
              fileList={fileList}
              customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              onChange={handleFileUpload}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('只能上传 JPG/PNG 格式的图片!');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('图片大小不能超过 2MB!');
                }
                return isJpgOrPng && isLt2M;
              }}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        )}

        <Form.Item name="base64Image" hidden>
          <Input />
        </Form.Item>
      </FormSection>

      <FormSection>
        <Title level={4}>肤色设置</Title>
        <Form.Item
          name="skinColor"
          label="肤色"
          rules={[{ required: true, message: '请选择肤色' }]}
        >
          <Select size="large">
            <Option value="white">白人</Option>
            <Option value="black">黑人</Option>
          </Select>
        </Form.Item>

        <Alert
          message="肤色选择提示"
          description="请根据图片中人物的实际肤色进行选择，以获得更准确的模型效果"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<UserOutlined />}
          size="large"
          style={{ width: '100%', height: '50px', fontSize: '16px' }}
          loading={getModelData('configurable_flame').loading}
        >
          生成头部参数化模型
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    const { loading, responseData } = getModelData('configurable_flame');

    // 输出返回结果以便调试
    if (responseData) {
      console.log('Configurable Flame响应数据:', JSON.stringify(responseData, null, 2));
    }

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 24, fontSize: 16 }}>处理中，请稍候...</Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 14 }}>
            头部参数化模型生成需要一定时间，请耐心等待
          </Text>
        </div>
      );
    }

    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <UserOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
          <Title level={4} style={{ color: '#8c8c8c' }}>请先提交参考图片生成头部参数化模型</Title>
          <Paragraph style={{ color: '#8c8c8c' }}>
            上传高质量的照片，系统将生成包含表情和基本形态的Blendshape数据
          </Paragraph>
        </div>
      );
    }

    const {
      blendshape_exp,
      blendshape_normal
    } = responseData.data;

    return (
      <div>
        <OutputCard title="生成结果">
          <Alert
            message="头部参数化模型生成成功"
            description="模型已成功生成，您可以下载Blendshape数据用于3D应用开发"
            type="success"
            showIcon
            style={{ marginBottom: 32 }}
          />

          <Title level={4}>Blendshape资源</Title>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <OutputCard
                title="表情Blendshape"
                extra={
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => downloadFile(blendshape_exp, 'blendshape_with_expression.txt')}
                  >
                    下载
                  </Button>
                }
              >
                <Paragraph>
                  <Text strong>描述：</Text> 包含完整面部表情参数的Blendshape数据
                </Paragraph>
                <Paragraph>
                  <Text strong>用途：</Text> 适用于需要表情动画的3D角色
                </Paragraph>
                <Paragraph>
                  <Text strong>格式：</Text> 文本格式，可导入3D软件
                </Paragraph>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <ButtonWrapper>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(blendshape_exp)}
                    >
                      复制链接
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile(blendshape_exp, 'blendshape_with_expression.txt')}
                    >
                      下载数据
                    </Button>
                  </ButtonWrapper>
                </div>
              </OutputCard>
            </Col>

            <Col xs={24} md={12}>
              <OutputCard
                title="普通Blendshape"
                extra={
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => downloadFile(blendshape_normal, 'blendshape_normal.txt')}
                  >
                    下载
                  </Button>
                }
              >
                <Paragraph>
                  <Text strong>描述：</Text> 基础面部ID参数的Blendshape数据
                </Paragraph>
                <Paragraph>
                  <Text strong>用途：</Text> 适用于基础3D模型构建
                </Paragraph>
                <Paragraph>
                  <Text strong>格式：</Text> 文本格式，可导入3D软件
                </Paragraph>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <ButtonWrapper>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(blendshape_normal)}
                    >
                      复制链接
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile(blendshape_normal, 'blendshape_normal.txt')}
                    >
                      下载数据
                    </Button>
                  </ButtonWrapper>
                </div>
              </OutputCard>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Title level={4}>所有资源</Title>

          <DownloadItem>
            <div>
              <Text className="title" strong>表情Blendshape</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>包含面部表情的参数化数据，适用于需要表情动画的场景</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(blendshape_exp)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(blendshape_exp, 'blendshape_with_expression.txt')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>

          <DownloadItem>
            <div>
              <Text className="title" strong>普通Blendshape</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>仅包含面部ID参数，不包含表情变化，适用于基础模型构建</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(blendshape_normal)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(blendshape_normal, 'blendshape_normal.txt')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>
        </OutputCard>

        <OutputCard title="使用说明">
          <Title level={5}>如何使用生成的Blendshape数据</Title>
          <Paragraph>
            1. 表情Blendshape包含面部表情的参数化数据，适用于需要表情动画的场景。
          </Paragraph>
          <Paragraph>
            2. 普通Blendshape仅包含面部ID参数，不包含表情变化，适用于基础模型构建。
          </Paragraph>
          <Paragraph>
            3. 下载的文件可以直接导入到支持Blendshape的3D软件中使用，如Maya、Blender、Unity等。
          </Paragraph>
          <Paragraph>
            4. 在导入时，请确保正确设置对应的骨骼结构和权重，以获得最佳效果。
          </Paragraph>
        </OutputCard>
      </div>
    );
  };

  return (
    <ModelCallPanel
      title="头部参数化生成"
      subtitle="根据照片生成带表情控制的3D头部模型参数"
      inputForm={renderInputForm()}
      outputDisplay={renderOutputDisplay()}
      modelType="configurable_flame"
    />
  );
};

export default ConfigurableFlamePage; 
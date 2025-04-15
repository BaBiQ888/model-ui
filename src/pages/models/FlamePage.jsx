import React, { useState } from 'react';
import { Form, Input, Button, Select, Slider, Typography, Card, Row, Col, message, Upload, Radio, Image, Divider, Alert, Spin } from 'antd';
import { UploadOutlined, LinkOutlined, DownloadOutlined, CopyOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import ModelCallPanel from '../../components/ModelCallPanel';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// Styled components - 优化样式组件
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

const StyledSlider = styled(Slider)`
  margin-top: 8px;
  
  .ant-slider-track {
    background-color: #1890ff;
  }
  
  .ant-slider-handle {
    border-color: #1890ff;
  }
`;

const ParameterLabel = styled(Text)`
  display: block;
  margin-bottom: 4px;
  color: #666;
  font-size: 13px;
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

const FlamePage = () => {
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
      const { imageSource, imageUrl, sex, race, modelType, headScale } = values;

      // 构建符合API文档的请求参数
      const params = {
        server_id: '1',
        sex: sex, // female 或 male
        flag: race === 'white' ? 'True' : 'False', // True-白人，False-黑人
        ModelType: parseInt(modelType), // 0-亚洲，1-二次元，2-欧洲
        head_scale: parseInt(headScale),
        user_callback_data: {} // 添加空对象作为user_callback_data
      };

      // 设置图片URL参数
      if (imageSource === 'url') {
        params.imageUrl = imageUrl;
      } else if (imageSource === 'upload' && fileList.length > 0) {
        // 实际环境中应该先上传图片获取URL，这里仅做示例
        message.info('使用上传的图片生成模型');

        // 示例URL，实际应替换为上传后的图片URL
        params.imageUrl = values.imageUrl || "https://formernew.48.cn/idolgpt.48.cn/appgamework/mmexport1704340270499.jpg";
      } else {
        message.error('请先上传或输入有效的图片URL');
        return;
      }

      // 打印请求参数以便调试
      console.log('Flame请求参数:', JSON.stringify(params, null, 2));

      // 显示提交中状态
      message.loading({ content: '正在生成人脸模型，请稍候...', key: 'flameLoading', duration: 0 });

      // 调用模型API - 移除多余的"flame"参数
      const result = await callModelApi('flame', params);

      // 成功后显示提示
      message.success({ content: '人脸模型生成成功！', key: 'flameLoading', duration: 2 });

      return result;
    } catch (error) {
      // 失败时关闭loading并显示错误
      message.error({ content: `生成失败: ${error.message}`, key: 'flameLoading', duration: 3 });
      console.error('Flame模型调用失败:', error);
    }
  };

  // 将文件转换为Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
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
        sex: 'female',
        race: 'asian',
        modelType: '0',
        headScale: 100
      }}
    >
      <InfoBox>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          上传人物正面清晰照片，Flame模型将生成3D人脸模型及相关贴图资源
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
            extra="支持 jpg、png 格式，建议使用正面清晰的人像照片"
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
        <Title level={4}>模型配置</Title>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="sex"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
            >
              <Select size="large">
                <Option value="female">女性</Option>
                <Option value="male">男性</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="race"
              label="肤色"
              rules={[{ required: true, message: '请选择肤色' }]}
            >
              <Select size="large">
                <Option value="white">白人</Option>
                <Option value="black">黑人</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="modelType"
          label="头部模型类别"
          rules={[{ required: true, message: '请选择头部模型类别' }]}
        >
          <Select size="large">
            <Option value="0">亚洲</Option>
            <Option value="1">二次元</Option>
            <Option value="2">欧洲</Option>
          </Select>
        </Form.Item>

        <div>
          <ParameterLabel strong>头部模型大小</ParameterLabel>
          <Form.Item
            name="headScale"
            rules={[{ required: true, message: '请设置头部模型大小' }]}
          >
            <StyledSlider
              min={50}
              max={150}
              step={1}
              marks={{
                50: '小',
                100: '标准',
                150: '大'
              }}
            />
          </Form.Item>
        </div>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<UserOutlined />}
          size="large"
          style={{ width: '100%', height: '50px', fontSize: '16px' }}
          loading={getModelData('flame').loading}
        >
          生成人脸形象
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染输出展示
  const renderOutputDisplay = () => {
    const { loading, responseData, error } = getModelData('flame');

    // 输出返回结果以便调试
    if (responseData) {
      console.log('Flame响应数据:', JSON.stringify(responseData, null, 2));
    }

    if (error) {
      console.error('Flame错误:', error);
    }

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 24, fontSize: 16 }}>处理中，请稍候...</Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 14 }}>
            人脸模型生成需要一定时间，请耐心等待
          </Text>
        </div>
      );
    }

    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <UserOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
          <Title level={4} style={{ color: '#8c8c8c' }}>请先提交参考图片生成3D人脸模型</Title>
          <Paragraph style={{ color: '#8c8c8c' }}>
            上传清晰的正面人像照片，系统将生成高质量的3D人脸模型和贴图资源
          </Paragraph>
        </div>
      );
    }

    // 从嵌套响应中提取数据
    let resultData;
    if (responseData.data?.data) {
      resultData = responseData.data.data;
    } else {
      resultData = responseData.data;
    }

    const {
      map_images_path,
      ModelPath,
      texture_path,
      body_texture_path,
      Map_Color
    } = resultData;

    return (
      <div>
        <OutputCard title="生成结果">
          <Alert
            message="3D人脸模型生成成功"
            description="模型已成功生成，您可以下载贴图和模型资源用于3D应用开发"
            type="success"
            showIcon
            style={{ marginBottom: 32 }}
          />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Title level={5}>面部贴图</Title>
              <ResultImage src={texture_path} alt="面部贴图" />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(texture_path, 'face_texture.png')}
                style={{ width: '100%', height: '40px' }}
              >
                下载面部贴图
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>蒙皮图片</Title>
              <ResultImage src={map_images_path} alt="蒙皮图片" />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(map_images_path, 'skin_map.png')}
                style={{ width: '100%', height: '40px' }}
              >
                下载蒙皮图片
              </Button>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Title level={5}>身体贴图</Title>
              <ResultImage src={body_texture_path} alt="身体贴图" />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(body_texture_path, 'body_texture.png')}
                style={{ width: '100%', height: '40px' }}
              >
                下载身体贴图
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Title level={4}>所有资源</Title>

          {Map_Color && (
            <DownloadItem>
              <div>
                <Text className="title" strong>贴图颜色值</Text>
                <div>
                  <Text code copyable style={{ fontSize: '13px', marginTop: '8px', display: 'block' }}>{Map_Color}</Text>
                </div>
              </div>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(Map_Color)}
              />
            </DownloadItem>
          )}

          <DownloadItem>
            <div>
              <Text className="title" strong>模型文件 (FBX)</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>适用于Unity/Unreal等3D引擎的模型文件</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(ModelPath)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(ModelPath, 'face_model.fbx')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>

          <DownloadItem>
            <div>
              <Text className="title" strong>面部贴图</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>用于模型面部的高清贴图</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(texture_path)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(texture_path, 'face_texture.png')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>

          <DownloadItem>
            <div>
              <Text className="title" strong>蒙皮图片</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>模型的蒙皮映射图</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(map_images_path)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(map_images_path, 'skin_map.png')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>

          <DownloadItem>
            <div>
              <Text className="title" strong>身体贴图</Text>
              <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>用于模型身体部分的贴图</Text>
              </div>
            </div>
            <ButtonWrapper>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(body_texture_path)}
                size="middle"
              >
                复制链接
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(body_texture_path, 'body_texture.png')}
                size="middle"
              >
                下载
              </Button>
            </ButtonWrapper>
          </DownloadItem>
        </OutputCard>

        <OutputCard title="使用说明">
          <Paragraph>
            1. 已生成的模型文件(.fbx)可直接导入到Unity、Unreal Engine等3D开发引擎中。
          </Paragraph>
          <Paragraph>
            2. 贴图文件应与模型一起导入，并正确设置材质关联以获得最佳效果。
          </Paragraph>
          <Paragraph>
            3. 模型支持基本骨骼动画，可进一步调整以适应您的项目需求。
          </Paragraph>
        </OutputCard>
      </div>
    );
  };

  return (
    <ModelCallPanel
      title="Flame 人脸形象生成"
      subtitle="将您的照片转换为高质量3D人脸模型"
      inputForm={renderInputForm()}
      outputDisplay={renderOutputDisplay()}
      modelType="flame"
    />
  );
};

export default FlamePage; 
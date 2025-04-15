import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Select, Card, Row, Col, Space, Tabs, Tag, message, Collapse, Badge, Alert } from 'antd';
import { DownloadOutlined, UploadOutlined, PlusOutlined, MinusCircleOutlined, FileOutlined, CodeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import ModelCallPanel from '../../components/ModelCallPanel';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

// 样式组件
const UrlInputContainer = styled.div`
  margin-bottom: 16px;
`;

const StyledFormSection = styled.div`
  background-color: #fafafa;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
  gap: 16px;
`;

const ResultCard = styled(Card)`
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ResultItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled(Text)`
  font-weight: 500;
  margin-right: 8px;
`;

const CopyLinkButton = styled(Button)`
  margin-left: 8px;
`;

// 从AudioVideoSynthesisV3Page添加的新样式组件
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

const FileLink = styled.a`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .anticon {
    margin-right: 12px;
    font-size: 18px;
    color: #1890ff;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  
  .label {
    color: #8c8c8c;
    margin-right: 8px;
    width: 100px;
  }
  
  .value {
    font-weight: 500;
  }
`;

const DataPanel = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
`;

// FBX到Split Bundle转换模型页面组件
const Fbx2SplitBundleV6Page = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('fbx2split_bundle_v6');
  const [fbxUrls, setFbxUrls] = useState(['']);
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
      clearResponseData('fbx2split_bundle_v6');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 添加FBX URL输入框
  const addFbxUrl = () => {
    setFbxUrls([...fbxUrls, '']);
  };

  // 移除FBX URL输入框
  const removeFbxUrl = (index) => {
    if (fbxUrls.length > 1) {
      const newUrls = [...fbxUrls];
      newUrls.splice(index, 1);
      setFbxUrls(newUrls);
    }
  };

  // 更新FBX URL
  const updateFbxUrl = (index, value) => {
    const newUrls = [...fbxUrls];
    newUrls[index] = value;
    setFbxUrls(newUrls);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      console.log('提交表单:', values);

      // 过滤掉空URL
      const filteredUrls = fbxUrls.filter(url => url.trim() !== '');

      if (filteredUrls.length === 0) {
        message.error('请至少添加一个有效的FBX URL');
        return;
      }

      // 调用模型API
      await callModelApi('fbx2split_bundle_v6', {
        fbxUrls: filteredUrls,
        bundleSystem: values.bundleSystem,
        optype: values.optype
      });
    } catch (error) {
      message.error('转换失败: ' + error.message);
    }
  };

  // 下载文件
  const downloadFile = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`开始下载: ${fileName || 'file'}`);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        optype: 'bundle',
        bundleSystem: 'windows'
      }}
    >
      <StyledFormSection>
        <Form.Item
          name="optype"
          label="转换格式"
          tooltip="选择FBX转换的目标格式"
        >
          <Select defaultValue="bundle">
            <Option value="bundle">Bundle</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="bundleSystem"
          label="平台"
          tooltip="选择Bundle的目标平台"
        >
          <Select defaultValue="windows">
            <Option value="windows">Windows</Option>
            <Option value="android">Android</Option>
            <Option value="ios">iOS</Option>
            <Option value="web">Web</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="FBX文件URL"
          required
          tooltip="添加一个或多个FBX文件URL"
        >
          <div>
            {fbxUrls.map((url, index) => (
              <UrlInputContainer key={index}>
                <Input
                  value={url}
                  onChange={(e) => updateFbxUrl(index, e.target.value)}
                  placeholder="输入FBX文件URL"
                  addonAfter={
                    fbxUrls.length > 1 ? (
                      <MinusCircleOutlined
                        onClick={() => removeFbxUrl(index)}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : null
                  }
                />
              </UrlInputContainer>
            ))}
            <Button
              type="dashed"
              onClick={addFbxUrl}
              block
              icon={<PlusOutlined />}
            >
              添加FBX URL
            </Button>
          </div>
        </Form.Item>
      </StyledFormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? null : <UploadOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? "转换中..." : "开始转换"}
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
                <Tabs.TabPane tab="提取数据" key="3">
                  <Paragraph>
                    <Alert
                      message="数据结构说明"
                      description="API 返回的数据有多层嵌套：data > data > data 才能找到真正的packageUrl和packageManifestUrl"
                      type="info"
                      showIcon
                      style={{ marginBottom: '12px' }}
                    />
                    <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                      {JSON.stringify({
                        packageUrl: responseData.data.data?.data?.packageUrl || '未找到',
                        packageManifestUrl: responseData.data.data?.data?.packageManifestUrl || '未找到',
                        message: responseData.data.message || '未找到',
                        success: responseData.data.success || false,
                        code: responseData.data.code || 0
                      }, null, 2)}
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
          <FileOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交FBX文件进行转换</Text>
        </div>
      );
    }

    // 从响应数据中提取结果 - 处理嵌套的数据结构
    // 处理多层嵌套的数据结构
    const resultData = responseData.data;
    const nestedData = resultData.data?.data; // 访问嵌套的data.data对象

    // 获取packageUrl和packageManifestUrl，考虑多种可能的路径
    const packageUrl = nestedData?.packageUrl || resultData.packageUrl || resultData.package_url;
    const packageManifestUrl = nestedData?.packageManifestUrl || resultData.packageManifestUrl || resultData.package_manifest_url;

    // 检查是否成功找到了URL
    const isSuccess = !!packageUrl && !!packageManifestUrl;

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <OutputCard
              title="转换状态"
              extra={
                <Badge status={isSuccess ? "success" : "error"} text={isSuccess ? "已完成" : "失败"} />
              }
            >
              <InfoItem>
                <Text type="secondary" className="label">目标平台:</Text>
                <Text className="value">{responseData.requestData?.bundleSystem || 'windows'}</Text>
              </InfoItem>
              <InfoItem>
                <Text type="secondary" className="label">转换格式:</Text>
                <Text className="value">{responseData.requestData?.optype || 'bundle'}</Text>
              </InfoItem>
              <InfoItem>
                <Text type="secondary" className="label">FBX文件数:</Text>
                <Text className="value">{responseData.requestData?.fbxUrls?.length || 0}</Text>
              </InfoItem>
              <InfoItem>
                <Text type="secondary" className="label">请求状态:</Text>
                <Text className="value">{resultData.message || '未知'}</Text>
              </InfoItem>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="FBX文件列表">
              {responseData.requestData?.fbxUrls?.map((url, index) => (
                <Tag key={index} color="blue" style={{ margin: '4px' }}>{url}</Tag>
              ))}
            </OutputCard>
          </Col>

          {isSuccess && (
            <Col span={24}>
              <OutputCard title="转换结果文件">
                {packageUrl && (
                  <FileLink
                    href={packageUrl}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadFile(packageUrl, 'package.unity3d');
                    }}
                  >
                    <FileOutlined /> Package文件 (.unity3d)
                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<DownloadOutlined />}
                      style={{ marginLeft: 'auto' }}
                    >
                      下载
                    </Button>
                  </FileLink>
                )}

                {packageManifestUrl && (
                  <FileLink
                    href={packageManifestUrl}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadFile(packageManifestUrl, 'package_manifest.manifest');
                    }}
                  >
                    <FileOutlined /> Manifest文件 (.manifest)
                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<DownloadOutlined />}
                      style={{ marginLeft: 'auto' }}
                    >
                      下载
                    </Button>
                  </FileLink>
                )}
              </OutputCard>
            </Col>
          )}

          {!isSuccess && (
            <Col span={24}>
              <OutputCard title="转换结果">
                <Alert
                  message="转换失败或未找到有效文件"
                  description="未能找到有效的Package或Manifest文件链接，请检查API响应数据。"
                  type="warning"
                  showIcon
                />
              </OutputCard>
            </Col>
          )}
        </Row>
      </div>
    );
  };

  // 使用自定义的Tabs组件替代ModelCallPanel
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
        <FileOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>FBX到Split Bundle转换</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default Fbx2SplitBundleV6Page; 
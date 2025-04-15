import React from 'react';
import { Card, Tabs, Divider, Typography, Spin, Alert, Row, Col } from 'antd';
import JsonView from '@uiw/react-json-view';
import styled from 'styled-components';
import { useModel } from '../contexts/ModelContext';

const { Title, Text } = Typography;

// 更新样式使页面更加饱满
const PanelContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 150px); // 减去头部和边距后几乎填满屏幕
`;

const ModelTitle = styled(Title)`
  margin-bottom: 16px !important;
`;

const InteractionCard = styled(Card)`
  flex: 1;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  
  .ant-card-head {
    background-color: #fafafa;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  .ant-tabs-content {
    padding: 8px 0;
  }
`;

const ResponseCard = styled(Card)`
  flex: 1;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
`;

const DataDisplayContainer = styled.div`
  flex: 1;
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
  margin-bottom: 24px;
`;

const JsonContainer = styled.div`
  height: 400px; // 固定更高的高度
  overflow: auto;
  margin-top: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 80px 0;
  background-color: #fafafa;
  border-radius: 8px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

/**
 * 模型调用面板组件 - 用于展示模型调用的界面
 * @param {string} title - 模型标题
 * @param {React.ReactNode} inputForm - 输入表单组件
 * @param {React.ReactNode} outputDisplay - 输出展示组件
 * @param {string} modelType - 模型类型
 */
const ModelCallPanel = ({ title, inputForm, outputDisplay, modelType }) => {
  // 使用getModelData从Context获取特定模型类型的数据
  const { getModelData } = useModel();

  // 获取当前模型的数据
  const { loading, error, requestData, responseData } = getModelData(modelType);

  // 定义Tabs的items配置，不再使用TabPane
  const inputOutputTabs = [
    {
      key: 'input',
      label: '输入',
      children: (
        <div style={{ padding: '16px 0' }}>
          {inputForm}
        </div>
      )
    },
    {
      key: 'output',
      label: '输出',
      children: loading ? (
        <LoadingContainer>
          <Spin size="large" />
          <div style={{ marginTop: 24 }}>
            <Text>模型处理中，请稍候...</Text>
          </div>
        </LoadingContainer>
      ) : error ? (
        <Alert
          message="请求错误"
          description={error}
          type="error"
          showIcon
          style={{ margin: '24px 0' }}
        />
      ) : (
        <div style={{ padding: '16px 0' }}>
          {outputDisplay}
        </div>
      )
    }
  ];

  // 定义数据展示Tabs的items配置
  const dataTabs = [
    {
      key: 'model',
      label: '模型信息',
      children: (
        <Row gutter={[16, 16]} style={{ padding: '16px 0' }}>
          <Col span={24}>
            <Card variant="borderless" style={{ background: '#fafafa' }}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Text strong>模型类型：</Text>
                </Col>
                <Col span={18}>
                  <Text>{modelType}</Text>
                </Col>
                {responseData?.uiData && Object.keys(responseData.uiData).map(key => (
                  <React.Fragment key={key}>
                    <Col span={6}>
                      <Text strong>{key}：</Text>
                    </Col>
                    <Col span={18}>
                      <Text>{typeof responseData.uiData[key] === 'object'
                        ? JSON.stringify(responseData.uiData[key])
                        : responseData.uiData[key]}</Text>
                    </Col>
                  </React.Fragment>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'request',
      label: '请求参数',
      children: (
        <JsonContainer>
          {requestData && Object.keys(requestData).length > 0 ? (
            <JsonView
              value={requestData}
              displayDataTypes={false}
              style={{ fontSize: '14px' }}
              collapsed={1}
            />
          ) : (
            <Text type="secondary">暂无请求数据</Text>
          )}
        </JsonContainer>
      )
    },
    {
      key: 'response',
      label: '响应数据',
      children: (
        <JsonContainer>
          {responseData && Object.keys(responseData).length > 0 ? (
            <JsonView
              value={responseData}
              displayDataTypes={false}
              style={{ fontSize: '14px' }}
              collapsed={1}
            />
          ) : (
            <Text type="secondary">暂无响应数据</Text>
          )}
        </JsonContainer>
      )
    }
  ];

  return (
    <PanelContainer>
      <ModelTitle level={3}>{title}</ModelTitle>
      <Divider />

      {/* 上部分：用户交互界面 */}
      <InteractionCard title="模型交互界面" size="large">
        <Tabs defaultActiveKey="input" size="large" tabBarGutter={24} items={inputOutputTabs} />
      </InteractionCard>

      {/* 下部分：请求和响应数据展示 */}
      <DataDisplayContainer>
        <Title level={4}>数据展示</Title>
        <Tabs defaultActiveKey="model" size="large" tabBarGutter={24} items={dataTabs} />
      </DataDisplayContainer>
    </PanelContainer>
  );
};

export default ModelCallPanel; 
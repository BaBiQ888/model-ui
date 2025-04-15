import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, Typography, Row, Col, Card, Slider, Space, Tabs, Collapse, Table, Badge, message } from 'antd';
import { DownloadOutlined, SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, LoadingOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 语音模型列表
const VOICE_MODELS = [
  { id: 'yuanyiqi', name: '袁一琦', value: '袁一琦' },
  { id: 'wangyi', name: '王奕', value: '王奕' },
  { id: 'zhoushiyu', name: '周诗雨', value: '周诗雨' },
  { id: 'zhengdanni', name: '郑丹妮', value: '郑丹妮' },
  { id: 'songxinran', name: '宋昕冉', value: '宋昕冉' },
  { id: 'boxinyu', name: '柏欣妤', value: '柏欣妤' },
  { id: 'zhuyixin', name: '朱怡欣', value: '朱怡欣' },
  { id: 'yangbingyi', name: '杨冰怡', value: '杨冰怡' },
  { id: 'liulifei', name: '刘力菲', value: '刘力菲' },
  { id: 'tanglijia', name: '唐莉佳', value: '唐莉佳' },
  { id: 'zengaijia', name: '曾艾佳', value: '曾艾佳' },
  { id: 'liuzengyan', name: '刘增艳', value: '刘增艳' },
  { id: 'zhouxiang', name: '周湘', value: '周湘' },
  { id: 'huxiaohui', name: '胡晓慧', value: '胡晓慧' },
  { id: 'hanjiayue', name: '韩家乐', value: '韩家乐' },
  { id: 'huangyici', name: '黄怡慈', value: '黄怡慈' },
  { id: 'feiqinyuan', name: '费沁源', value: '费沁源' },
  { id: 'jiangshuting', name: '蒋舒婷', value: '蒋舒婷' },
  { id: 'linshuqing', name: '林舒晴', value: '林舒晴' },
  { id: 'youmiao', name: '由淼', value: '由淼' },
  { id: 'tianshuli', name: '田姝丽', value: '田姝丽' },
  { id: 'xuchuwen', name: '徐楚雯', value: '徐楚雯' },
  { id: 'zhangrun', name: '张润', value: '张润' },
  { id: 'huangxuanqi', name: '黄宣绮', value: '黄宣绮' },
  { id: 'chenyuzi', name: '陈雨孜', value: '陈雨孜' },
  { id: 'qingyuwen', name: '青钰雯', value: '青钰雯' },
  { id: 'wangyuchen', name: '王语晨', value: '王语晨' },
  { id: 'wangruiqi', name: '王睿琦', value: '王睿琦' },
  { id: 'yangruoxi', name: '杨若惜', value: '杨若惜' },
  { id: 'lutianhui', name: '卢天惠', value: '卢天惠' },
  { id: 'linjiayi', name: '林佳怡', value: '林佳怡' },
  { id: 'jinyingyue', name: '金莹玥', value: '金莹玥' },
  { id: 'shenxiaoai', name: '沈小爱', value: '沈小爱' },
  { id: 'yeshuqi', name: '叶舒淇', value: '叶舒淇' },
  { id: 'huangchuyin', name: '黄楚茵', value: '黄楚茵' },
  { id: 'chenzhenzen', name: '陈蓁蓁', value: '陈蓁蓁' },
  { id: 'liangjiao', name: '梁娇', value: '梁娇' },
  { id: 'chenlin', name: '陈琳', value: '陈琳' },
  { id: 'zhaotianyang', name: '赵天杨', value: '赵天杨' },
  { id: 'linzhi', name: '林芝', value: '林芝' },
  { id: 'zhengzhaoxuan', name: '郑照暄', value: '郑照暄' },
  { id: 'leiyuxiao', name: '雷宇霄', value: '雷宇霄' },
  { id: 'lijiaen', name: '李佳恩', value: '李佳恩' },
  { id: 'yanna', name: '闫娜', value: '闫娜' },
  { id: 'wangzixin', name: '王秭歆', value: '王秭歆' },
  { id: 'guoxiaoying', name: '郭晓盈', value: '郭晓盈' },
  { id: 'liangqiao', name: '梁乔', value: '梁乔' },
  { id: 'fangqi', name: '方琪', value: '方琪' }
];

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '自动识别多语种' },
  { value: 'auto_yue', label: '自动识别多语种(含粤语)' },
  { value: 'en', label: '英文' },
  { value: 'zh', label: '中英混合' },
  { value: 'ja', label: '日英混合' },
  { value: 'yue', label: '粤英混合' },
  { value: 'ko', label: '韩英混合' },
  { value: 'all_zh', label: '全部中文' },
  { value: 'all_ja', label: '全部日文' },
  { value: 'all_yue', label: '全部粤语' },
  { value: 'all_ko', label: '全部韩文' }
];

// 文本切割方式
const TEXT_SPLIT_METHODS = [
  { value: 'cut0', label: '不切割' },
  { value: 'cut1', label: '凑四句一切' },
  { value: 'cut2', label: '凑50字一切' },
  { value: 'cut3', label: '按中文句号切' },
  { value: 'cut4', label: '按英文句号切' },
  { value: 'cut5', label: '按标点符号切' }
];

// 增强样式组件
const AudioPlayer = styled.div`
  margin-top: 24px;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const AudioPlayerControls = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  width: 200px;
`;

const PlayButton = styled(Button)`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .anticon {
    font-size: 24px;
  }
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

// 语音合成模型页面组件
const TtsInferPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('tts_infer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [activeTab, setActiveTab] = useState('input');
  const audioRef = useRef(null);
  // 添加一个ref来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 当收到结果时切换到输出页签
  useEffect(() => {
    if (responseData && responseData.data && !loading) {
      setActiveTab('output');
    }
  }, [responseData, loading]);

  // 当组件卸载时停止音频播放和清除响应数据
  useEffect(() => {
    // 组件挂载时设置为true
    isMountedRef.current = true;

    return () => {
      // 组件卸载时设置为false
      isMountedRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 组件卸载时清除当前模型的响应数据
      clearResponseData('tts_infer');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 音频播放结束事件处理
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      console.log('提交表单:', values);

      // 构建API调用参数
      const apiParams = {
        train_id: values.train_id,
        infer_text: values.infer_text,
        infer_language: values.infer_language,
        ref_language: values.ref_language,
        text_split_method: values.text_split_method,
        speed_factor: values.speed_factor
      };

      console.log('API调用参数:', apiParams);

      // 调用模型API
      await callModelApi('tts_infer', apiParams);
    } catch (error) {
      console.error("语音合成失败:", error);
      message.error("语音合成失败: " + error.message);
    }
  };

  // 控制音频播放
  const togglePlay = () => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play().catch(e => {
          console.error("音频播放失败:", e);
          message.error("音频播放失败，请稍后重试");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 调整音量
  const handleVolumeChange = (value) => {
    setVolume(value);
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.volume = value / 100;
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

    // 处理文本内容
    if (responseData.requestData?.infer_text) {
      result.push({
        key: '合成文本',
        value: (
          <ValueContainer>
            <span>{responseData.requestData.infer_text}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(responseData.requestData.infer_text)}
            />
          </ValueContainer>
        ),
        rawValue: responseData.requestData.infer_text
      });
    }

    // 处理语音模型
    if (responseData.requestData?.train_id) {
      const modelName = VOICE_MODELS.find(model => model.value === responseData.requestData.train_id)?.name || responseData.requestData.train_id;
      result.push({
        key: '语音模型',
        value: (
          <ValueContainer>
            <span>{modelName}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(modelName)}
            />
          </ValueContainer>
        ),
        rawValue: modelName
      });
    }

    // 处理语速
    if (responseData.requestData?.speed_factor) {
      result.push({
        key: '语速',
        value: (
          <ValueContainer>
            <span>{responseData.requestData.speed_factor}x</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(responseData.requestData.speed_factor.toString() + 'x')}
            />
          </ValueContainer>
        ),
        rawValue: responseData.requestData.speed_factor
      });
    }

    // 处理语言
    if (responseData.requestData?.infer_language) {
      const languageName = LANGUAGE_OPTIONS.find(lang => lang.value === responseData.requestData.infer_language)?.label || responseData.requestData.infer_language;
      result.push({
        key: '文本语言',
        value: (
          <ValueContainer>
            <span>{languageName}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(languageName)}
            />
          </ValueContainer>
        ),
        rawValue: languageName
      });
    }

    // 处理分割方式
    if (responseData.requestData?.text_split_method) {
      const methodName = TEXT_SPLIT_METHODS.find(method => method.value === responseData.requestData.text_split_method)?.label || responseData.requestData.text_split_method;
      result.push({
        key: '分割方式',
        value: (
          <ValueContainer>
            <span>{methodName}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(methodName)}
            />
          </ValueContainer>
        ),
        rawValue: methodName
      });
    }

    return result;
  };

  // 生成音频 URL
  const getAudioUrl = (audioLink) => {
    if (!audioLink) return '';
    // 如果已经是完整的URL，直接返回
    return audioLink;
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        speed_factor: 1,
        train_id: VOICE_MODELS[0].value,
        infer_language: 'zh',
        ref_language: 'zh',
        text_split_method: 'cut3'
      }}
    >
      <FormSection>
        <Form.Item
          name="infer_text"
          label="合成文本"
          rules={[{ required: true, message: '请输入需要合成的文本' }]}
        >
          <TextArea
            placeholder="输入需要合成的文本内容..."
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Form.Item>
      </FormSection>

      <FormSection>
        <Form.Item
          name="train_id"
          label="语音模型"
          rules={[{ required: true, message: '请选择语音模型' }]}
        >
          <Select placeholder="请选择语音模型" showSearch optionFilterProp="children">
            {VOICE_MODELS.map(model => (
              <Option key={model.id} value={model.value}>
                {model.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="infer_language"
              label="文本语言"
            >
              <Select>
                {LANGUAGE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ref_language"
              label="参考音频语言"
            >
              <Select>
                {LANGUAGE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="text_split_method"
          label="文本切割方式"
        >
          <Select>
            {TEXT_SPLIT_METHODS.map(method => (
              <Option key={method.value} value={method.value}>
                {method.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="speed_factor" label="语速调整">
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            marks={{
              '0.5': '0.5x',
              '1': '正常',
              '1.5': '1.5x',
              '2': '2x'
            }}
          />
        </Form.Item>
      </FormSection>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
          size="large"
          style={{ width: '100%' }}
        >
          {loading ? '合成中...' : '开始合成'}
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

    // 添加调试日志查看响应数据 - 取消注释以启用
    // console.log("响应数据结构：", responseData);

    // 没有数据时显示引导信息
    if (!responseData || !responseData.data) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>请先提交文本进行语音合成</Text>
        </div>
      );
    }

    const { data } = responseData;
    const audioUrl = getAudioUrl(data.data?.infer_file_base64);

    if (!audioUrl) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="warning">语音合成失败，未获得有效音频数据</Text>
        </div>
      );
    }

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <OutputCard title="合成文本">
              <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8, marginBottom: 16 }}>
                <Text>{responseData.requestData?.infer_text || '无文本'}</Text>
              </div>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="合成语音">
              <AudioPlayer>
                <AudioPlayerControls>
                  <PlayButton
                    type="primary"
                    shape="circle"
                    icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={togglePlay}
                    size="large"
                  />
                  <VolumeControl>
                    <SoundOutlined style={{ marginRight: 8 }} />
                    <Slider
                      value={volume}
                      onChange={handleVolumeChange}
                      style={{ flex: 1 }}
                    />
                  </VolumeControl>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    style={{ marginLeft: 16 }}
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = audioUrl;
                      a.download = '合成语音.mp3';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      message.success('正在下载合成语音');
                    }}
                  >
                    下载
                  </Button>
                </AudioPlayerControls>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  style={{ width: '100%' }}
                  onEnded={handleAudioEnded}
                />
              </AudioPlayer>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="合成参数">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <InfoItem>
                    <Text type="secondary" className="label">语音模型:</Text>
                    <Text className="value">
                      {VOICE_MODELS.find(model => model.value === responseData.requestData?.train_id)?.name || responseData.requestData?.train_id || '未知'}
                    </Text>
                  </InfoItem>
                </Col>
                <Col span={12}>
                  <InfoItem>
                    <Text type="secondary" className="label">语速:</Text>
                    <Text className="value">{responseData.requestData?.speed_factor || '1.0'}x</Text>
                  </InfoItem>
                </Col>
                <Col span={12}>
                  <InfoItem>
                    <Text type="secondary" className="label">文本语言:</Text>
                    <Text className="value">
                      {LANGUAGE_OPTIONS.find(lang => lang.value === responseData.requestData?.infer_language)?.label || responseData.requestData?.infer_language || '中英混合'}
                    </Text>
                  </InfoItem>
                </Col>
                <Col span={12}>
                  <InfoItem>
                    <Text type="secondary" className="label">文本切割:</Text>
                    <Text className="value">
                      {TEXT_SPLIT_METHODS.find(method => method.value === responseData.requestData?.text_split_method)?.label || responseData.requestData?.text_split_method || '按中文句号切'}
                    </Text>
                  </InfoItem>
                </Col>
              </Row>
            </OutputCard>
          </Col>
        </Row>
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
        <SoundOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        <span>语音合成</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default TtsInferPage; 
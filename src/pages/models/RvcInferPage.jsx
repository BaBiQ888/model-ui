import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, Typography, Row, Col, Card, Slider, Space, Divider, Radio, Tabs, Collapse, Table, Badge, message, Switch } from 'antd';
import { UploadOutlined, SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, DownloadOutlined, LoadingOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useModel } from '../../contexts/ModelContext';
import { MODEL_RESOURCES } from '../../config/apiConfig';

const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 预设的声音模型列表 - 更新为新的模型列表
const VOICE_MODELS = [
  { id: 'yuanyiqi', name: '袁一琦', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2Fdc0536c3-c070-4b9f-b22b-84d27aa9165d.pth' },
  { id: 'yonglanfemale', name: '慵懒个性空灵自由的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F24%2Fmini_program%2F15ed2941-9048-41d5-baea-2505fd9303fa.pth' },
  { id: 'diyinfemale', name: '低音魅力的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F62ff5a96-6526-4bc9-aa2d-e9b5efca315e.pth' },
  { id: 'shangyaofemale', name: '闪耀温暖泛音的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F24%2Fmini_program%2F0f384a3d-f0a6-4e8e-9ba3-173463c4ef3d.pth' },
  { id: 'qingchefemale', name: '清澈棉长沁人心脾的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F24%2Fmini_program%2F1bcc2b85-c8b5-48ef-b401-6c1c3543b9fa.pth' },
  { id: 'chunjingfemale', name: '纯净细腻的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F797d16d9-4462-4ed9-b096-37a10d6faae0.pth' },
  { id: 'kuangfemale', name: '硬朗狂野的华语女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F85097474-f677-4ead-9aa7-1f9c9c316a30.pth' },
  { id: 'wennuanomei', name: '温暖甜美的欧美女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F24%2Fmini_program%2Fad2b9e67-eaff-40c7-80f2-89ca69abdd69.pth' },
  { id: 'keaidongman', name: '可爱萌人的动漫女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F1c88e110-4029-408a-b141-2c8a523c3bad.pth' },
  { id: 'hangguo', name: '清澈明亮的韩国女声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F5cc9d3f3-5ea1-4fed-acde-6eaf26983f45.pth' },
  { id: 'omeimale', name: '欧美醇厚质感男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2Fc6958919-9c36-4eb9-98db-6de6e2e1bfbc.pth' },
  { id: 'gaochingmale', name: '高清亮特质的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F7dc731f9-57b1-4a4a-a6d5-89533795a6a3.pth' },
  { id: 'xushimale', name: '叙事情感丰富的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F5a18cb80-6de8-4871-893a-02858e4a82ae.pth' },
  { id: 'gaokangmale', name: '高亢激昂且温柔的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F7865ab06-8d74-4404-9bc2-d03c995c98a9.pth' },
  { id: 'rouhemale', name: '柔和圆润的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2Fb52b4dc4-687e-40dd-9144-32ed0550bed7.pth' },
  { id: 'cangsangmale', name: '沧桑富有穿透力的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F20%2Fmini_program%2F5869c04f-c73f-4672-a556-bbe0a108d3a4.pth' },
  { id: 'konglingmale', name: '空灵梦幻高音域的华语男声', ossPath: 'https://formernew.48.cn/idolgpt.48.cn%2Fappgamework%2Fdance_aigc%2Fplatform%2Fpro%2F2024%2F09%2F24%2Fmini_program%2Fab679107-a197-4a7c-a8d3-7dee47270e63.pth' },
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

// 歌曲推理模型页面组件
const RvcInferPage = () => {
  const [form] = Form.useForm();
  const { callModelApi, getModelData, clearResponseData } = useModel();
  const { loading, responseData } = getModelData('rvc_infer');
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
      clearResponseData('rvc_infer');
    };
  }, []); // 不需要依赖clearResponseData，避免重新创建清理函数

  // 音频播放结束事件处理
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      console.log('提交表单原始值:', values);

      // 验证必要参数
      if (!values.fileUrl) {
        message.error('请输入需要克隆的音频URL');
        return;
      }

      if (!values.modelId) {
        message.error('请选择推理模型');
        return;
      }

      // 获取选中的模型
      const selectedModel = VOICE_MODELS.find(model => model.id === values.modelId);
      if (!selectedModel) {
        message.error('无法找到所选模型');
        return;
      }

      // 准备API调用参数
      const apiParams = {
        model_oss: selectedModel.ossPath,
        fileb: values.fileUrl
      };

      console.log('调用API参数:', apiParams);

      // 调用模型API
      await callModelApi('rvc_infer', apiParams);
    } catch (error) {
      console.error("歌曲克隆失败:", error);
      message.error("歌曲克隆失败: " + error.message);
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

    // 处理嵌套的数据结构 - data.data.data
    const nestedData = data.data.data || {};

    // 处理克隆音频URL
    if (nestedData.file_oss_url) {
      result.push({
        key: '克隆音频链接',
        value: (
          <ValueContainer>
            <span>{nestedData.file_oss_url}</span>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              className="copy-button"
              onClick={() => copyToClipboard(nestedData.file_oss_url)}
            />
          </ValueContainer>
        ),
        rawValue: nestedData.file_oss_url
      });
    }

    return result;
  };

  // 下载音频
  const downloadAudio = (url, fileName) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success(`正在下载 ${fileName}`);
  };

  // 渲染输入表单
  const renderInputForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <FormSection>
        <Form.Item
          name="fileUrl"
          label="需要克隆的音频URL"
          rules={[{ required: true, message: '请输入需要克隆的音频URL' }]}
        >
          <Input placeholder="输入音频文件的URL地址..." />
        </Form.Item>

        <Form.Item
          name="modelId"
          label="克隆模型"
          rules={[{ required: true, message: '请选择克隆模型' }]}
        >
          <Select
            placeholder="请选择克隆模型"
          >
            {VOICE_MODELS.map(model => (
              <Option key={model.id} value={model.id}>
                {model.name}
              </Option>
            ))}
          </Select>
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
          {loading ? '克隆中...' : '开始克隆'}
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
          <Text type="secondary" style={{ display: 'block' }}>请先提交音频进行克隆</Text>
        </div>
      );
    }

    // 获取嵌套的数据结构
    const nestedData = responseData.data.data || {};
    const audioUrl = nestedData.file_oss_url;
    const selectedModel = VOICE_MODELS.find(model => model.ossPath === responseData.requestData?.model_oss) || {};

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <OutputCard title="对比结果">
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <OutputCard title="原始音频" size="small">
                    {responseData.requestData?.fileb ? (
                      <>
                        <audio
                          src={responseData.requestData.fileb}
                          controls
                          style={{ width: '100%' }}
                        />
                        <div style={{ marginTop: 12, textAlign: 'right' }}>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => downloadAudio(responseData.requestData.fileb, '原始音频.mp3')}
                          >
                            下载原始音频
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary">原始音频不可用</Text>
                    )}
                  </OutputCard>
                </Col>
                <Col xs={24} md={12}>
                  <OutputCard title="克隆音频" size="small">
                    {audioUrl ? (
                      <AudioPlayer>
                        <AudioPlayerControls>
                          <PlayButton
                            type="primary"
                            shape="circle"
                            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={togglePlay}
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
                            onClick={() => downloadAudio(audioUrl, '克隆音频.mp3')}
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
                    ) : (
                      <Text type="secondary">克隆音频未生成</Text>
                    )}
                  </OutputCard>
                </Col>
              </Row>
            </OutputCard>
          </Col>

          <Col span={24}>
            <OutputCard title="模型信息">
              <InfoItem>
                <Text type="secondary" className="label">使用模型:</Text>
                <Text className="value">{selectedModel.name || '未知模型'}</Text>
              </InfoItem>
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
        <span>歌曲推理</span>
      </Space>
    } size="large">
      <CustomTabs />
    </Card>
  );
};

export default RvcInferPage; 
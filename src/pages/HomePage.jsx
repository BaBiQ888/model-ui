import { Typography, Card, Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import {
  CustomerServiceOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  SoundOutlined,
  FileOutlined,
  FileTextOutlined,
  UserOutlined,
  StarOutlined,
  RobotOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

const StyledCard = styled(Card)`
  height: 100%;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrapper = styled.div`
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
  color: #1890ff;
`;

const modelList = [
  {
    title: '文生音模型',
    description: '通过文本描述生成音乐，可以指定音乐风格、情绪等属性。',
    icon: <CustomerServiceOutlined />,
    path: '/text-to-music',
  },
  {
    title: '串行歌曲换声',
    description: '生成音乐并将歌曲中的人声替换成指定参考音色，保持原有伴奏。',
    icon: <CustomerServiceOutlined />,
    path: '/music-seed-serial-v6-v2',
  },
  {
    title: '歌曲换声v2',
    description: '将现有歌曲拆分为人声和伴奏，使用参考音频替换原有声音特征并重新合成。',
    icon: <CustomerServiceOutlined />,
    path: '/seed-vc-v2',
  },
  {
    title: 'GPT服务',
    description: '智能AI助手，帮助您探讨音乐和舞蹈创意，根据您的偏好提供专业建议。',
    icon: <RobotOutlined />,
    path: '/gpt-service',
  },
  {
    title: '歌曲信息生成',
    description: '根据描述文本生成歌曲名称和封面图的描述词，可用于后续生成封面图。',
    icon: <FileTextOutlined />,
    path: '/song-info-gen',
  },
  {
    title: '音生舞模型',
    description: '根据输入的音频生成舞蹈动作，可以应用于虚拟形象的动画生成。',
    icon: <VideoCameraOutlined />,
    path: '/synthesise-dance-v6',
  },
  {
    title: '音视频合成',
    description: '将音频与视频进行合成，生成完整的音视频内容。',
    icon: <VideoCameraOutlined />,
    path: '/audio-video-synthesis-v3',
  },
  {
    title: '生成音乐封面',
    description: '根据文本描述生成音乐封面图像，可用于音乐作品的视觉呈现。',
    icon: <PictureOutlined />,
    path: '/txt-image-generate-music',
  },
  {
    title: '图片风格化v2',
    description: '将图片转换为不同艺术风格，支持多种风格类型和尺寸比例选择。',
    icon: <PictureOutlined />,
    path: '/image-style-transfer-v2',
  },
  {
    title: '证件照',
    description: '将普通照片处理成标准证件照格式，支持针对不同种族生成更好的效果。',
    icon: <PictureOutlined />,
    path: '/instantid-photo',
  },
  {
    title: '自由提示词生图',
    description: '通过自然语言描述，生成您想要的图片。支持中、英、日、韩提示词，可选择不同的图片尺寸。',
    icon: <PictureOutlined />,
    path: '/free-prompt-image',
  },
  {
    title: '歌曲分轨',
    description: '将歌曲分离为人声、鼓、贝斯、乐器和其他多个独立音轨，可用于混音和单独处理。',
    icon: <SoundOutlined />,
    path: '/mdx23',
  },
  {
    title: '歌曲推理',
    description: '对歌曲进行声音克隆，可以变换演唱者的声音特征。',
    icon: <SoundOutlined />,
    path: '/rvc-infer',
  },
  {
    title: '语音合成',
    description: '将文本转换为语音，可以自定义声音特征和语调。',
    icon: <SoundOutlined />,
    path: '/tts-infer',
  },
  {
    title: '单人推理(F5)',
    description: '使用参考音频，将文本转换为与参考音色相似的语音，支持不同模型和语速。',
    icon: <SoundOutlined />,
    path: '/tts-f5-infer',
  },
  {
    title: '声音克隆',
    description: '克隆参考音频的声音特征，将任意文本转换为具有相同声音特征的语音。',
    icon: <SoundOutlined />,
    path: '/tts-zero-shot',
  },
  {
    title: '歌词时间解析',
    description: '从音频中提取歌词并生成带时间标签的LRC格式歌词文件。',
    icon: <FileTextOutlined />,
    path: '/lyric-time-analyzer',
  },
  {
    title: '歌曲节拍打谱',
    description: '分析音乐文件并生成节拍谱面，可用于音乐游戏、伴奏或节奏训练。',
    icon: <SoundOutlined />,
    path: '/music-game',
  },
  {
    title: '节奏游戏谱面',
    description: '生成适用于节奏音乐游戏的专业谱面，提供节拍可视化和游戏数据。',
    icon: <SoundOutlined />,
    path: '/rhythm-music-game',
  },
  {
    title: 'lora推理v2',
    description: '将平面图片转换为3D真实感效果，提供更具深度和真实感的图像表现。',
    icon: <PictureOutlined />,
    path: '/instantid-photo-3dreal',
  },
  {
    title: 'FBX转换',
    description: '将FBX模型文件转换为不同平台可用的Split Bundle格式。',
    icon: <FileOutlined />,
    path: '/fbx2split-bundle-v6',
  },
  {
    title: '人脸形象生成',
    description: '基于参考照片生成3D人脸模型，提供多种参数调整，适用于虚拟形象创建。',
    icon: <UserOutlined />,
    path: '/flame',
  },
  {
    title: '头部参数化',
    description: '生成头部的blendshape参数数据，包含表情和非表情两种模式，可用于3D角色制作。',
    icon: <UserOutlined />,
    path: '/configurable-flame',
  },
  {
    title: '占星分析',
    description: '根据您的出生时间和地点分析星盘，提供个性化的占星解读，解答您的人生问题。',
    icon: <StarOutlined />,
    path: '/astrology',
  },
];

const HomePage = () => {
  return (
    <div>
      <Title level={2}>AI模型交互展示平台</Title>
      <Paragraph>
        欢迎使用AI模型交互展示平台。本平台集成了多种AI模型，提供直观的用户界面，
        方便您体验各种模型的功能和效果。请从左侧菜单选择您想要体验的模型，或点击下方卡片快速导航。
      </Paragraph>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {modelList.map((model, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <StyledCard>
              <IconWrapper>{model.icon}</IconWrapper>
              <Title level={4} style={{ textAlign: 'center' }}>{model.title}</Title>
              <Paragraph>{model.description}</Paragraph>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to={model.path}>
                  <Button type="primary">进入模型</Button>
                </Link>
              </div>
            </StyledCard>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomePage; 
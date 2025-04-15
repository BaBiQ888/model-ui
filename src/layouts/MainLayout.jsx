import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  CustomerServiceOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  SoundOutlined,
  HomeOutlined,
  FileOutlined,
  FileTextOutlined,
  UserOutlined,
  StarOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 样式组件
const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  position: fixed;
  z-index: 1;
  width: calc(100% - ${props => props.$collapsed ? '80px' : '250px'});
  right: 0;
  transition: all 0.2s;
`;

const StyledContent = styled(Content)`
  margin: 24px;
  background: #fff;
  padding: 24px;
  min-height: 280px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: 88px;
`;

const Logo = styled.div`
  height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
`;

// 自定义Sider样式
const StyledSider = styled(Sider)`
  &.ant-layout-sider {
    background: #1890ff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
`;

// 自定义菜单样式
const StyledMenu = styled(Menu)`
  background: #1890ff;
  
  &&& .ant-menu-item {
    display: flex;
    align-items: center;
    padding: 0 16px;
    margin: 0;
  }

  &&& .ant-menu-item-selected {
    background-color: #40a9ff;
  }

  &&& .ant-menu-item:hover {
    background-color: #69c0ff;
  }

  &&& .ant-menu-item .ant-menu-item-icon {
    margin-right: 8px;
    color: rgba(255, 255, 255, 0.85);
  }

  &&& .ant-menu-item a {
    display: flex;
    align-items: center;
    width: 100%;
    color: rgba(255, 255, 255, 0.85);
  }

  &&& .ant-menu-item-selected a {
    color: #fff;
  }
`;

// 自定义菜单项链接组件
const MenuItemLink = styled(Link)`
  display: flex;
  align-items: center;
  
  .menu-item-icon {
    margin-right: 8px;
    font-size: 16px;
    line-height: 1;
  }
  
  .menu-item-text {
    flex: 1;
  }
`;

// 导航菜单项配置
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/'
  },
  {
    key: 'text-to-music',
    icon: <CustomerServiceOutlined />,
    label: '文生音模型',
    path: '/text-to-music'
  },
  {
    key: 'music-seed-serial-v6-v2',
    icon: <CustomerServiceOutlined />,
    label: '串行歌曲换声',
    path: '/music-seed-serial-v6-v2'
  },
  {
    key: 'seed-vc-v2',
    icon: <CustomerServiceOutlined />,
    label: '歌曲换声v2',
    path: '/seed-vc-v2'
  },
  {
    key: 'song-info-gen',
    icon: <FileTextOutlined />,
    label: '歌曲信息生成',
    path: '/song-info-gen'
  },
  {
    key: 'synthesise-dance-v6',
    icon: <VideoCameraOutlined />,
    label: '音生舞模型',
    path: '/synthesise-dance-v6'
  },
  {
    key: 'audio-video-synthesis-v3',
    icon: <VideoCameraOutlined />,
    label: '音视频合成',
    path: '/audio-video-synthesis-v3'
  },
  {
    key: 'txt-image-generate-music',
    icon: <PictureOutlined />,
    label: '生成音乐封面',
    path: '/txt-image-generate-music'
  },
  {
    key: 'image-style-transfer-v2',
    icon: <PictureOutlined />,
    label: '图片风格化v2',
    path: '/image-style-transfer-v2'
  },
  {
    key: 'instantid-photo',
    icon: <PictureOutlined />,
    label: '证件照',
    path: '/instantid-photo'
  },
  {
    key: 'free-prompt-image',
    icon: <PictureOutlined />,
    label: '自由提示词生图',
    path: '/free-prompt-image'
  },
  {
    key: 'mdx23',
    icon: <SoundOutlined />,
    label: '歌曲分轨',
    path: '/mdx23'
  },
  {
    key: 'rvc-infer',
    icon: <SoundOutlined />,
    label: '歌曲推理',
    path: '/rvc-infer'
  },
  {
    key: 'tts-infer',
    icon: <SoundOutlined />,
    label: '语音合成',
    path: '/tts-infer'
  },
  {
    key: 'tts-f5-infer',
    icon: <SoundOutlined />,
    label: '单人推理(F5)',
    path: '/tts-f5-infer'
  },
  {
    key: 'tts-zero-shot',
    icon: <SoundOutlined />,
    label: '声音克隆',
    path: '/tts-zero-shot'
  },
  {
    key: 'lyric-time-analyzer',
    icon: <FileTextOutlined />,
    label: '歌词时间解析',
    path: '/lyric-time-analyzer'
  },
  {
    key: 'music-game',
    icon: <SoundOutlined />,
    label: '歌曲节拍打谱',
    path: '/music-game'
  },
  {
    key: 'rhythm-music-game',
    icon: <SoundOutlined />,
    label: '节奏游戏谱面',
    path: '/rhythm-music-game'
  },
  {
    key: 'instantid-photo-3dreal',
    icon: <PictureOutlined />,
    label: 'lora推理v2',
    path: '/instantid-photo-3dreal'
  },
  {
    key: 'fbx2split-bundle-v6',
    icon: <FileOutlined />,
    label: 'FBX转换',
    path: '/fbx2split-bundle-v6'
  },
  {
    key: 'flame',
    icon: <UserOutlined />,
    label: '人脸形象生成',
    path: '/flame'
  },
  {
    key: 'configurable-flame',
    icon: <UserOutlined />,
    label: '头部参数化',
    path: '/configurable-flame'
  },
  {
    key: 'astrology',
    icon: <StarOutlined />,
    label: '占星分析',
    path: '/astrology'
  }
];

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // 根据当前路径获取选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find(item => item.path === path);
    return item ? [item.key] : ['/'];
  };

  return (
    <StyledLayout>
      <StyledSider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 2
        }}
        theme="light"
      >
        <Logo>模型测试平台</Logo>
        <StyledMenu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path} style={{ display: 'flex', alignItems: 'center' }}>{item.label}</Link>
          }))}
          theme="light"
        />
      </StyledSider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <StyledContent>
          {children}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default MainLayout;
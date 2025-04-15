/**
 * API配置文件 - 统一管理所有模型API的配置
 */

// API基础配置
const API_CONFIG = {
	// 认证信息 - 更新为与Python示例匹配的值
	appId: "01JPJ32P20537CNHYB6CBJ5XA0",
	apiKey: "01JPJ32P21SZVB0VXJPRW8N2RM",
	secretKey: "fX2I40ToGTMfEwXkPPkfCG3Nu5higDbrCHBk3XVyUK0",

	// API基础URL
	baseUrl: "https://maas.48.cn/api",
	microservicesUrl: "/microservices",
	taskResultUrl: "/microservices/maas-task-result",
	taskResultAccessToken: "bCREZMrvPO87i210EU6oDPBC7iy7xl-ekDgrXPva1jw",

	// 模型服务ID
	modelServers: {
		text_to_music: "83",
		synthesise_dance_v6: "84",
		audio_video_synthesis_v3: "95",
		fbx2split_bundle_v6: "89",
		song_info_gen: "70",
		music_seed_serial_v6_v2_step1: "98",
		music_seed_serial_v6_v2_step2: "100",
		seed_vc_v2_step1: "99", // 歌曲换声v2拆分服务
		seed_vc_v2_step2: "100", // 歌曲换声v2合成服务
		txt_image_generate_music: "65",
		song_dance_bundle: "90",
		rvc_infer: "23",
		tts_infer: "17",
		lyric_time_analyzer: "54",
		tts_zero_shot: "53",
		mdx23: "55",
		tts_f5_infer: "60",
		music_game: "66",
		rhythm_music_game: "94", // 节奏音乐游戏谱面生成
		seed_vc: "77",
		instantid_photo_3DReal: "62",
		image_style_transfer_v2: "86", // 图片风格化v2
		instantid_photo: "18", // 证件照服务
		free_prompt_image: "48", // 自由提示词生图
		image_rendering_generate: "64",
		flame: "1",
		configurable_flame: "37", // 头部参数化服务
		astrology: "31",
		gpt_service_maas: "36",
	},
};

// 模型样例资源URL
export const MODEL_RESOURCES = {
	// 文生音串行歌曲换声模型
	music_seed_serial_v6_v2: {
		sampleReferenceAudios: [
			{
				id: "reference_audio_1",
				name: "女声参考1",
				url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/袁一琦.wav",
			},
			{
				id: "reference_audio_2",
				name: "男声参考1",
				url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/赵品霖.wav",
			},
		],
	},

	// TTS语音合成模型
	tts_infer: {
		voiceModels: [
			{ id: "zh_female_young", name: "女声（年轻）", value: "zh_female_young" },
			{
				id: "zh_female_middle",
				name: "女声（中年）",
				value: "zh_female_middle",
			},
			{ id: "zh_male_young", name: "男声（年轻）", value: "zh_male_young" },
			{ id: "zh_male_middle", name: "男声（中年）", value: "zh_male_middle" },
			{ id: "zh_child", name: "童声", value: "zh_child" },
		],
	},

	// 声音克隆模型
	tts_zero_shot: {
		sampleReferenceAudios: [
			{
				id: "yuan_yiqi",
				name: "袁一琦",
				url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/袁一琦.wav",
			},
			{
				id: "zhao_pinlin",
				name: "赵品霖",
				url: "https://meta-maas.48.cn/static/tts/tts-zero-shot/赵品霖.wav",
			},
		],
		languages: [
			{ id: "auto", name: "多语种自动识别", value: "auto" },
			{ id: "auto_yue", name: "多语种自动识别(粤语)", value: "auto_yue" },
			{ id: "en", name: "英文", value: "en" },
			{ id: "zh", name: "中英混合", value: "zh" },
			{ id: "ja", name: "日英混合", value: "ja" },
			{ id: "yue", name: "粤英混合", value: "yue" },
			{ id: "ko", name: "韩英混合", value: "ko" },
			{ id: "all_zh", name: "全部按中文识别", value: "all_zh" },
			{ id: "all_ja", name: "全部按日文识别", value: "all_ja" },
			{ id: "all_yue", name: "全部按粤语识别", value: "all_yue" },
			{ id: "all_ko", name: "全部按韩文识别", value: "all_ko" },
		],
		textSplitMethods: [
			{ id: "cut0", name: "不切分", value: "cut0" },
			{ id: "cut1", name: "四句一切", value: "cut1" },
			{ id: "cut2", name: "50字一切", value: "cut2" },
			{ id: "cut3", name: "按中文句号切", value: "cut3" },
			{ id: "cut4", name: "按英文句号切", value: "cut4" },
			{ id: "cut5", name: "按标点符号切", value: "cut5" },
		],
	},

	// 文生音模型
	text_to_music: {
		sampleTags: [
			"流行",
			"轻松",
			"欢快",
			"电子",
			"古典",
			"爵士",
			"摇滚",
			"民谣",
		],
	},

	// 音生舞模型
	synthesise_dance_v6: {
		sampleAudios: [
			{
				id: "dance_audio_1",
				name: "示例音频1",
				url: "https://maas-models.48.cn/samples/audio/dance_sample1.mp3",
			},
			{
				id: "dance_audio_2",
				name: "示例音频2",
				url: "https://maas-models.48.cn/samples/audio/dance_sample2.mp3",
			},
		],
	},

	// 生成歌曲名称和封面图描述词模型
	song_info_gen: {
		sampleInputs: ["恋爱告急", "夏日海滩", "伤感雨夜", "未来科技", "青春校园"],
	},

	// 歌曲分轨模型
	mdx23: {
		backgroundOptions: [
			{ id: "1", name: "绿色背景", value: "1" },
			{ id: "2", name: "白色背景", value: "2" },
			{ id: "custom", name: "自定义背景", value: "custom" },
		],
		trackTypes: [
			{ id: "bass", name: "Bass音轨", icon: "bass" },
			{ id: "drums", name: "Drums音轨", icon: "drums" },
			{ id: "instrum", name: "Instrum音轨", icon: "instrum" },
			{ id: "vocals", name: "Vocals音轨", icon: "vocals" },
			{ id: "other", name: "其他音轨", icon: "other" },
		],
	},

	// 图片风格化v2模型
	image_style_transfer_v2: {
		styleTypes: [
			{ id: 0, name: "赛博科幻", value: 0 },
			{ id: 1, name: "3D卡通", value: 1 },
			{ id: 2, name: "真人写真", value: 2 },
			{ id: 3, name: "二次元媚影", value: 3 },
			{ id: 4, name: "动漫画风", value: 4 },
			{ id: 5, name: "繁花似锦", value: 5 },
			{ id: 6, name: "古风春节", value: 6 },
			{ id: 7, name: "油画笔触", value: 7 },
		],
		imgSizes: [
			{ id: 0, name: "1:1 正方形", value: 0 },
			{ id: 1, name: "2:3 社交媒体", value: 1 },
			{ id: 2, name: "3:4 社交媒体", value: 2 },
			{ id: 3, name: "4:3 文章配图", value: 3 },
			{ id: 4, name: "9:16 手机壁纸", value: 4 },
			{ id: 5, name: "16:9 桌面壁纸", value: 5 },
		],
	},

	// 自由提示词生图模型
	free_prompt_image: {
		imgSizes: [
			{ id: "0", name: "1:1 正方形", value: "0" },
			{ id: "1", name: "2:3 社交媒体", value: "1" },
			{ id: "2", name: "3:4 社交媒体", value: "2" },
			{ id: "3", name: "4:3 文章配图", value: "3" },
			{ id: "4", name: "9:16 手机壁纸", value: "4" },
			{ id: "5", name: "16:9 桌面壁纸", value: "5" },
		],
		samplePrompts: [
			"一个真人版的蓝色头发女孩在塞纳河畔跳舞",
			"一个卡通版的蓝色头发女孩在塞纳河畔跳舞",
			"职业西装，短发，笔记本电脑，全身，脚，全景镜头，站在桥上",
			"未来城市，科技感，高楼，霓虹灯，晚上",
		],
	},
};

export default API_CONFIG;

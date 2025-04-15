import axios from "axios";
import AuthService from "./authService";
import API_CONFIG from "../config/apiConfig";

// 创建axios实例
const apiClient = axios.create({
	baseURL: API_CONFIG.baseUrl, // 使用配置的baseUrl - https://maas.48.cn/api
	timeout: 30000, // 30秒超时
	headers: {
		"Content-Type": "application/json",
	},
});

// 添加请求拦截器，用于添加认证头
apiClient.interceptors.request.use(
	(config) => {
		// 添加认证头
		const authHeaders = AuthService.getAuthHeader();
		Object.keys(authHeaders).forEach((key) => {
			config.headers[key] = authHeaders[key];
		});
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// 添加响应拦截器，用于处理错误
apiClient.interceptors.response.use(
	(response) => {
		// 如果响应成功，直接返回响应数据
		return response.data;
	},
	(error) => {
		// 处理错误响应
		const errorMessage =
			error.response?.data?.message || "网络错误，请稍后重试";
		return Promise.reject(new Error(errorMessage));
	}
);

// 轮询任务结果的函数
const pollTaskResult = async (traceId, maxRetries = 100, interval = 2000) => {
	let retries = 0;

	// 获取任务结果的请求头
	const taskResultHeaders = AuthService.getTaskResultHeader();

	while (retries < maxRetries) {
		try {
			// 构建完整的任务结果URL - 参照Python示例的URL格式
			const response = await axios.get(
				`${API_CONFIG.baseUrl}/microservices/maas-task-result`,
				{
					params: { trace_id: traceId },
					headers: taskResultHeaders,
				}
			);

			const data = response.data;

			if (data.success) {
				return data.data;
			} else if (data.code !== 202) {
				// 202表示任务进行中
				throw new Error(data.message || "获取任务结果失败");
			}

			// 如果任务还在进行中，等待一段时间后继续轮询
			await new Promise((resolve) => setTimeout(resolve, interval));
			retries++;
		} catch (error) {
			console.error("轮询任务结果失败:", error);
			throw error;
		}
	}

	throw new Error("获取任务结果超时");
};

// 通用模型调用方法 - 参照Go后端的调用方式
const callModel = async (modelType, params) => {
	try {
		// 获取模型服务ID
		const serverId = AuthService.getModelServerId(modelType);
		if (!serverId) {
			throw new Error(`未找到模型类型 ${modelType} 对应的服务器ID`);
		}

		// 构造统一的请求参数，与Go后端保持一致
		const requestData = {
			server_id: serverId,
			...params,
		};

		// 使用统一的微服务URL，不再按模型类型拼接
		console.log(`[${modelType}] 发送API请求:`, {
			url: `${API_CONFIG.baseUrl}/microservices`,
			请求参数: requestData,
		});

		const response = await apiClient.post("/microservices", requestData);
		console.log(`[${modelType}] 接收原始响应:`, response);

		// 检查是否需要轮询结果
		if (response.data && response.data.trace_id) {
			console.log(
				`[${modelType}] 发现trace_id，开始轮询结果:`,
				response.data.trace_id
			);
			const pollResult = await pollTaskResult(response.data.trace_id);
			console.log(`[${modelType}] 轮询结果:`, pollResult);
			return pollResult;
		}

		return response;
	} catch (error) {
		console.error(`[${modelType}] 调用失败:`, error);
		throw error;
	}
};

// 模型API服务
const ModelApi = {
	// 文生音模型
	callTextToMusic: async (tags, scale = "mid") => {
		try {
			console.log("[text_to_music] 调用开始，参数:", { tags, scale });

			// 参考Go后端参数格式调整
			const params = {
				text: tags.join(","), // 将标签数组转为逗号分隔的字符串
				scale: scale,
			};

			const result = await callModel("text_to_music", params);
			console.log("[text_to_music] 调用结果详情:", {
				音乐名称: result.music_name,
				音乐链接: result.music_url,
				封面链接: result.img_url,
				歌词:
					result.lyric?.substring(0, 100) +
					(result.lyric?.length > 100 ? "..." : ""),
				拍号: result.beat,
				BPM: result.bpm,
				时长: result.duration,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用文生音模型失败:", error);
			throw error;
		}
	},

	// 文生音串行歌曲换声模型 - 步骤1：文生音+拆分
	callMusicSeedSerialV6V2Step1: async (text) => {
		try {
			console.log("[music_seed_serial_v6_v2_step1] 调用开始，参数:", { text });

			const params = {
				text: text, // 输入文本
			};

			const result = await callModel("music_seed_serial_v6_v2_step1", params);
			console.log("[music_seed_serial_v6_v2_step1] 调用结果详情:", {
				音乐名称: result.music_name,
				音乐链接: result.music_url,
				人声路径: result.vocals_audio,
				伴奏路径: result.backing_track,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用文生音+拆分模型失败:", error);
			throw error;
		}
	},

	// 文生音串行歌曲换声模型 - 步骤2：合成
	callMusicSeedSerialV6V2Step2: async (
		vocalsAudio,
		backingTrack,
		referenceAudio
	) => {
		try {
			console.log("[music_seed_serial_v6_v2_step2] 调用开始，参数:", {
				vocalsAudio,
				backingTrack,
				referenceAudio,
			});

			const params = {
				vocals_audio: vocalsAudio, // 干声路径
				backing_track: backingTrack, // 伴奏路径
				reference_audio: referenceAudio, // 参考音频路径
			};

			const result = await callModel("music_seed_serial_v6_v2_step2", params);
			console.log("[music_seed_serial_v6_v2_step2] 调用结果详情:", {
				输出音频路径: result.output_path,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用合成模型失败:", error);
			throw error;
		}
	},

	// 生成歌曲名称和封面图描述词模型
	callSongInfoGen: async (usrInput) => {
		try {
			console.log("[song_info_gen] 调用开始，参数:", { usrInput });

			const params = {
				usr_input: usrInput, // 用户输入的描述文本
			};

			const result = await callModel("song_info_gen", params);
			console.log("[song_info_gen] 调用结果详情:", {
				音乐名称: result.music_name,
				封面描述词:
					result.song_cover_image_prompt?.substring(0, 100) +
					(result.song_cover_image_prompt?.length > 100 ? "..." : ""),
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用生成歌曲名称和封面图描述词模型失败:", error);
			throw error;
		}
	},

	// 音生舞模型
	callSynthesiseDanceV6: async (audioPath, scale = "low", version = "v6") => {
		try {
			console.log("[synthesise_dance_v6] 调用开始，参数:", {
				audioPath,
				scale,
				version,
			});

			// 调整参数名称以匹配后端期望
			const params = {
				audio_path: audioPath, // 确保将audioPath正确转换为audio_path
				scale: scale,
				version: version,
			};

			const result = await callModel("synthesise_dance_v6", params);
			console.log("[synthesise_dance_v6] 调用结果详情:", {
				EMO文件路径: result.emo_path,
				FBX文件路径: result.fbx_path,
				是否原创: result.origin,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用音生舞模型失败:", error);
			throw error;
		}
	},

	// 音视频合成模型
	callAudioVideoSynthesisV3: async (configUrl) => {
		try {
			console.log("[audio_video_synthesis_v3] 调用开始，参数:", { configUrl });

			const params = {
				optype: "create_video_split", // 根据Go后端添加必要参数
				config_url: configUrl,
			};

			const result = await callModel("audio_video_synthesis_v3", params);
			console.log("[audio_video_synthesis_v3] 调用结果详情:", {
				M3U8链接: result.m3u8_url,
				视频链接: result.video_url,
				项目数据链接: result.project_url,
				封面链接: result.cover_url,
				是否完成: result.is_end,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用音视频合成模型失败:", error);
			throw error;
		}
	},

	// 音乐封面生成模型
	callTxtImageGenerateMusic: async (prompt, musicName, batchSize) => {
		try {
			console.log("[txt_image_generate_music] 调用开始，参数:", {
				prompt,
				musicName,
				batchSize,
			});

			const params = {
				prompt: prompt,
				music_name: musicName, // 调整参数名以匹配后端
				batch_size: batchSize,
			};

			const result = await callModel("txt_image_generate_music", params);
			console.log("[txt_image_generate_music] 调用结果详情:", {
				生成图片数量: result.res?.length || 0,
				图片链接列表: result.res,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用音乐封面生成模型失败:", error);
			throw error;
		}
	},

	// 歌曲推理模型
	callRvcInfer: async (params) => {
		try {
			console.log("[rvc_infer] 调用开始，参数:", params);

			const requestParams = {
				model_oss: params.model_oss,
				fileb: params.fileb,
			};

			const result = await callModel("rvc_infer", requestParams);
			console.log("[rvc_infer] 调用结果详情:", {
				克隆音频链接: result.file_oss_url,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌曲推理模型失败:", error);
			throw error;
		}
	},

	// 语音合成模型
	callTtsInfer: async (params) => {
		try {
			console.log("[tts_infer] 调用开始，参数:", params);

			// 构建API参数 - 使用train_id和infer_text作为主要参数
			const apiParams = {
				train_id: params.train_id,
				infer_text: params.infer_text,
				infer_language: params.infer_language,
				ref_language: params.ref_language,
				text_split_method: params.text_split_method,
				speed_factor: params.speed_factor,
			};

			const result = await callModel("tts_infer", apiParams);
			console.log("[tts_infer] 调用结果详情:", {
				音频链接长度: result.infer_file_base64?.length || 0,
				有无音频数据: !!result.infer_file_base64,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用语音合成模型失败:", error);
			throw error;
		}
	},

	// 歌词时间解析模型
	callLyricTimeAnalyzer: async (audio) => {
		try {
			console.log("[lyric_time_analyzer] 调用开始，参数:", { audio });

			// 构建API参数
			const apiParams = {
				audio: audio, // 歌曲链接或base64
			};

			const result = await callModel("lyric_time_analyzer", apiParams);
			console.log("[lyric_time_analyzer] 调用结果详情:", {
				歌词内容:
					result.res?.substring(0, 100) +
					(result.res?.length > 100 ? "..." : ""),
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌词时间解析模型失败:", error);
			throw error;
		}
	},

	// FBX到Split Bundle转换模型
	callFbx2SplitBundleV6: async (params) => {
		try {
			console.log("[fbx2split_bundle_v6] 调用开始，参数:", {
				fbxUrls: params.fbxUrls,
				bundleSystem: params.bundleSystem,
				optype: params.optype,
			});

			// 构建API参数
			const apiParams = {
				fbx_url: params.fbxUrls, // FBX链接列表
				optype: params.optype, // 转换格式，默认bundle
				bundle_system: params.bundleSystem, // 平台，默认windows，可选windows，android，ios，web
			};

			const result = await callModel("fbx2split_bundle_v6", apiParams);

			// 处理多层嵌套的数据结构
			const nestedData = result.data?.data;
			const packageUrl = nestedData?.packageUrl || result.packageUrl;
			const packageManifestUrl =
				nestedData?.packageManifestUrl || result.packageManifestUrl;

			console.log("[fbx2split_bundle_v6] 调用结果详情:", {
				包地址: packageUrl || "未找到package地址",
				包清单地址: packageManifestUrl || "未找到manifest地址",
				状态: result.message || "未知状态",
				状态码: result.code || "未知状态码",
				嵌套数据结构: nestedData ? "存在" : "不存在",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用FBX到Split Bundle转换模型失败:", error);
			throw error;
		}
	},

	// 声音克隆模型（TTS Zero Shot）
	callTtsZeroShot: async (params) => {
		try {
			console.log("[tts_zero_shot] 调用开始，参数:", {
				ref_id: params.ref_id,
				infer_text: params.infer_text,
				ref_audio: params.ref_audio_base64 ? "已设置" : "未设置",
				ref_text: params.ref_text,
				purifier: params.purifier,
				infer_language: params.infer_language,
				ref_language: params.ref_language,
				text_split_method: params.text_split_method,
				speed_factor: params.speed_factor,
			});

			// 构建API参数
			const apiParams = {
				ref_id: params.ref_id, // 参考音频ID
				infer_text: params.infer_text, // 待转换文本
				ref_audio_base64: params.ref_audio_base64, // 参考音频（链接或base64）
				ref_text: params.ref_text, // 参考音频的文本
				purifier: params.purifier, // 是否去噪
				infer_language: params.infer_language, // 输入文本语种
				ref_language: params.ref_language, // 参考音频语种
				text_split_method: params.text_split_method, // 文本切割方式
				speed_factor: params.speed_factor, // 生成语速
			};

			const result = await callModel("tts_zero_shot", apiParams);
			console.log("[tts_zero_shot] 调用结果详情:", {
				音频数据: result.infer_file_base64 ? "已生成" : "未生成",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用声音克隆模型失败:", error);
			throw error;
		}
	},

	// 歌曲分轨模型（MDX23）
	callMdx23: async (params) => {
		try {
			console.log("[mdx23] 调用开始，参数:", {
				音频数据: params.audio ? "已设置" : "未设置",
				背景设置: params.bg,
			});

			// 构建API参数
			const apiParams = {
				audio: params.audio, // 输入音频base64或URL
				bg: params.bg || "1", // 背景设置：1表示绿色背景，2表示白色背景，也可以是自定义背景路径
			};

			const result = await callModel("mdx23", apiParams);
			console.log("[mdx23] 调用结果详情:", {
				Bass音轨: result.bass ? "已生成" : "未生成",
				Drums音轨: result.drums ? "已生成" : "未生成",
				Instrum音轨: result.instrum ? "已生成" : "未生成",
				Other音轨: result.other ? "已生成" : "未生成",
				Vocals音轨: result.vocals ? "已生成" : "未生成",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌曲分轨模型失败:", error);
			throw error;
		}
	},

	// 单人推理模型(TTS F5 Infer)
	callTtsF5Infer: async (params) => {
		try {
			console.log("[tts_f5_infer] 调用开始，参数:", {
				ref_id: params.ref_id,
				infer_text: params.infer_text,
				ref_audio_base64: params.ref_audio_base64 ? "已设置" : "未设置",
				model_name: params.model_name,
				ref_text: params.ref_text,
				purifier: params.purifier,
				speed: params.speed,
			});

			// 构建API参数
			const apiParams = {
				ref_id: params.ref_id, // 参考音频ID
				infer_text: params.infer_text, // 待转换文本
				ref_audio_base64: params.ref_audio_base64, // 参考音频（链接或base64）
				model_name: params.model_name, // 模型名称：默认e2-tts，可选f5-tts（速度快）, e2-tts（质量好）
				ref_text: params.ref_text, // 参考音频的文本
				purifier: params.purifier, // 是否去噪
				speed: params.speed, // 生成语速
			};

			const result = await callModel("tts_f5_infer", apiParams);
			console.log("[tts_f5_infer] 调用结果详情:", {
				音频数据: result.infer_file_base64 ? "已生成" : "未生成",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用单人推理模型失败:", error);
			throw error;
		}
	},

	// 歌曲节拍打谱模型(music_game)
	callMusicGame: async (data, version = 1) => {
		try {
			console.log("[music_game] 调用开始，参数:", {
				data: data,
				version: version,
			});

			// 构建API参数
			const apiParams = {
				data: data, // 输入音频URL
				version: version, // 模型版本：1-v1版本，2-v2版本，默认为1
			};

			const result = await callModel("music_game", apiParams);
			console.log("[music_game] 调用结果详情:", {
				结果文件: result.result || "未生成",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌曲节拍打谱模型失败:", error);
			throw error;
		}
	},

	// 歌曲换声v2模型 - 步骤1：拆分
	callSeedVcV2Step1: async (musicName, musicUrl) => {
		try {
			console.log("[seed_vc_v2_step1] 调用开始，参数:", {
				musicName: musicName,
				musicUrl: musicUrl,
			});

			const params = {
				music_name: musicName, // 歌曲名称
				music_url: musicUrl, // 歌曲URL
			};

			const result = await callModel("seed_vc_v2_step1", params);
			console.log("[seed_vc_v2_step1] 调用结果详情:", {
				干音路径: result.vocals_audio,
				伴奏路径: result.backing_track,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌曲换声v2拆分模型失败:", error);
			throw error;
		}
	},

	// 歌曲换声v2模型 - 步骤2：合成
	callSeedVcV2Step2: async (vocalsAudio, backingTrack, referenceAudio) => {
		try {
			console.log("[seed_vc_v2_step2] 调用开始，参数:", {
				vocalsAudio: vocalsAudio,
				backingTrack: backingTrack,
				referenceAudio: referenceAudio,
			});

			const params = {
				vocals_audio: vocalsAudio, // 干声路径
				backing_track: backingTrack, // 伴奏路径
				reference_audio: referenceAudio, // 参考音频路径
			};

			const result = await callModel("seed_vc_v2_step2", params);
			console.log("[seed_vc_v2_step2] 调用结果详情:", {
				输出音频路径: result.output_path,
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用歌曲换声v2合成模型失败:", error);
			throw error;
		}
	},

	/**
	 * 调用节奏音乐游戏谱面生成API
	 * @param {string} data - 音乐文件URL
	 * @param {string} [version='1'] - 版本号
	 * @returns {Promise<object>} 服务调用结果
	 */
	callRhythmMusicGame: async (data, version = "1") => {
		console.log("🎮 调用节奏音乐游戏谱面生成API");
		console.log("📝 音乐文件:", data);
		console.log("📝 版本号:", version);
		return callModel("rhythm_music_game", { data, version });
	},

	/**
	 * 调用lora推理v2 (instantid_photo_3DReal) API
	 * @param {string} src - 图片链接或base64编码
	 * @returns {Promise<object>} 服务调用结果
	 */
	callInstantIdPhoto3DReal: async (src) => {
		console.log("🖼️ 调用lora推理v2 API");
		console.log(
			"📝 图片源:",
			typeof src === "string" && src.length > 100
				? `${src.substring(0, 50)}...`
				: src
		);
		return callModel("instantid_photo_3DReal", { src });
	},

	/**
	 * 调用图片风格化v2服务
	 * @param {string} prompt - 提示词
	 * @param {string} imageData - 图片base64或链接
	 * @param {number} styleType - 风格化类型代码
	 * @param {number} imgSize - 图片尺寸代码
	 * @returns {Promise} - 返回API调用结果
	 */
	callImageStyleTransferV2: async (prompt, imageData, styleType, imgSize) => {
		console.group("🎨 调用图片风格化v2服务");
		console.log("提示词:", prompt);
		console.log(
			"图片数据:",
			imageData
				? imageData.startsWith("http")
					? imageData
					: "BASE64_IMAGE_DATA"
				: "无"
		);
		console.log("风格类型:", styleType);
		console.log("图片尺寸:", imgSize);

		try {
			const result = await callModel("image_style_transfer_v2", {
				prompt,
				ori_img: imageData,
				style_type: styleType,
				img_size: imgSize,
			});

			console.log("风格化结果:", result);
			console.groupEnd();
			return result;
		} catch (error) {
			console.error("图片风格化v2服务调用失败:", error);
			console.groupEnd();
			throw error;
		}
	},

	/**
	 * 调用证件照服务
	 * @param {string} src - 图片base64或链接
	 * @param {boolean} flag - 是否为白人(true=白人，false=黑人)
	 * @returns {Promise} - 返回API调用结果
	 */
	callInstantIdPhoto: async (src, flag) => {
		console.group("📷 调用证件照服务");
		console.log(
			"图片数据:",
			src ? (src.startsWith("http") ? src : "BASE64_IMAGE_DATA") : "无"
		);
		console.log("是否为白人:", flag);

		try {
			const result = await callModel("instantid_photo", {
				src,
				flag: String(flag), // 转为字符串，接口要求传 'True' 或 'False'
			});

			console.log("证件照处理结果:", result);
			console.groupEnd();
			return result;
		} catch (error) {
			console.error("证件照服务调用失败:", error);
			console.groupEnd();
			throw error;
		}
	},

	// 自由提示词生图模型
	callFreePromptImage: async (prompt, imgSize = "1") => {
		try {
			console.log("[free_prompt_image] 调用开始，参数:", { prompt, imgSize });

			const params = {
				prompt,
				img_size: imgSize,
			};

			const result = await callModel("free_prompt_image", params);
			console.log("[free_prompt_image] 调用结果详情:", {
				图片列表: result.res ? `生成了${result.res.length}张图片` : "无图片",
				完整返回: result,
			});
			return result;
		} catch (error) {
			console.error("调用自由提示词生图模型失败:", error);
			throw error;
		}
	},
	callFlame: async (params) => {
		try {
			console.log(
				"[flame] 调用开始，原始参数:",
				JSON.stringify(params, null, 2)
			);

			// 构建标准化的请求参数，确保参数正确
			const requestParams = {
				server_id: params.server_id || "1",
				user_callback_url: params.user_callback_url || "",
				user_callback_data: params.user_callback_data || {},
				imageUrl: params.imageUrl,
				sex: params.sex, // female 或 male
				flag: params.flag, // True-白人，False-黑人
				ModelType: params.ModelType, // 0-亚洲，1-二次元，2-欧洲
				head_scale: params.head_scale,
			};

			// 删除undefined或null值，避免发送无效参数
			Object.keys(requestParams).forEach((key) => {
				if (requestParams[key] === undefined || requestParams[key] === null) {
					delete requestParams[key];
				}
			});

			console.log(
				"[flame] 处理后的请求参数:",
				JSON.stringify(requestParams, null, 2)
			);

			// 调用模型API，传递规范化后的参数
			const result = await callModel("flame", requestParams);

			console.log("[flame] 调用结果:", JSON.stringify(result, null, 2));
			return result;
		} catch (error) {
			console.error("[flame] 调用失败:", error);
			throw error;
		}
	},
	callConfigurableFlame: async (params) => {
		try {
			console.log(
				"[configurable_flame] 调用开始，原始参数:",
				JSON.stringify(params, null, 2)
			);

			// 构建标准化的请求参数，确保参数正确
			const requestParams = {
				server_id: params.server_id || "37",
				user_callback_url: params.user_callback_url || "",
				user_callback_data: params.user_callback_data || {},
				src: params.src,
				flag: params.flag, // True-白人，False-黑人
			};

			// 删除undefined或null值，避免发送无效参数
			Object.keys(requestParams).forEach((key) => {
				if (requestParams[key] === undefined || requestParams[key] === null) {
					delete requestParams[key];
				}
			});

			console.log(
				"[configurable_flame] 处理后的请求参数:",
				JSON.stringify(requestParams, null, 2)
			);

			// 调用模型API，传递规范化后的参数
			const result = await callModel("configurable_flame", requestParams);

			console.log(
				"[configurable_flame] 调用结果:",
				JSON.stringify(result, null, 2)
			);
			return result;
		} catch (error) {
			console.error("[configurable_flame] 调用失败:", error);
			throw error;
		}
	},
	callGptServiceMaas: async (params) => {
		console.log("[gpt_service_maas] 调用开始，参数:", params);
		return callModel("gpt_service_maas", params);
	},
};

export default ModelApi;

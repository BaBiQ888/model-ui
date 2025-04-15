import React, { createContext, useContext, useState } from 'react';
import AuthService from '../api/authService';
import API_CONFIG from '../config/apiConfig';
import ModelApi from '../api/modelApi';

// 创建模型上下文
const ModelContext = createContext();

// 模型提供者组件
const ModelProvider = ({ children }) => {
  // 存储每种模型类型的请求和响应数据 - 使用对象映射实现数据隔离
  const [modelData, setModelData] = useState({
    // 每个模型类型都有自己的数据存储
    // 格式: modelType: { requestData, responseData, loading, error }
  });

  // 获取指定模型类型的数据
  const getModelData = (modelType) => {
    return modelData[modelType] || { requestData: null, responseData: null, loading: false, error: null };
  };

  // 通用API调用函数
  const callModelApi = async (modelType, params) => {
    try {
      console.group(`🚀 [${modelType}] 模型调用流程开始`);

      // 更新当前模型的加载状态
      setModelData(prevData => ({
        ...prevData,
        [modelType]: {
          ...getModelData(modelType),
          loading: true,
          error: null,
          requestData: { modelType, params }
        }
      }));
      console.log(`[${modelType}] 设置加载状态 loading = true`);
      console.log(`[${modelType}] 清除错误状态 error = null`);
      console.log(`[${modelType}] 请求参数:`, params);

      // 根据模型类型调用不同的API
      let response;
      console.log(`[${modelType}] 准备调用模型API`);

      switch (modelType) {
        case 'text_to_music':
          console.log(`[${modelType}] 调用文生音模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器, 音乐名称, 封面图片, 可选的歌词展示`);
          response = await ModelApi.callTextToMusic(
            params.tags,
            params.scale
          );
          break;
        case 'music_seed_serial_v6_v2_step1':
          console.log(`[${modelType}] 调用文生音+拆分模型（第一步）`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频、人声和伴奏音频播放器, 下载按钮`);
          response = await ModelApi.callMusicSeedSerialV6V2Step1(
            params.text
          );
          break;
        case 'music_seed_serial_v6_v2_step2':
          console.log(`[${modelType}] 调用声音转换合成模型（第二步）`);
          console.log(`[${modelType}] UI渲染提示: 需要显示最终合成音频播放器, 下载按钮`);
          response = await ModelApi.callMusicSeedSerialV6V2Step2(
            params.vocals_audio,
            params.backing_track,
            params.reference_audio
          );
          break;
        case 'song_info_gen':
          console.log(`[${modelType}] 调用生成歌曲名称和封面图描述词模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示歌曲名称, 封面图描述词, 提供跳转到生成封面页面的功能`);
          response = await ModelApi.callSongInfoGen(
            params.usr_input
          );
          break;
        case 'synthesise_dance_v6':
          console.log(`[${modelType}] 调用音生舞模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频播放器, EMO/FBX文件下载链接`);
          response = await ModelApi.callSynthesiseDanceV6(
            params.audioPath,
            params.scale,
            params.version
          );
          break;
        case 'audio_video_synthesis_v3':
          console.log(`[${modelType}] 调用音视频合成模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示视频播放器, 封面图片, 下载链接`);
          response = await ModelApi.callAudioVideoSynthesisV3(
            params.configUrl
          );
          break;
        case 'txt_image_generate_music':
          console.log(`[${modelType}] 调用音乐封面生成模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示多张生成的图片, 提供下载功能`);
          response = await ModelApi.callTxtImageGenerateMusic(
            params.prompt,
            params.musicName,
            params.batchSize
          );
          break;
        case 'rvc_infer':
          console.log(`[${modelType}] 调用歌曲推理模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频和克隆后音频播放器, 对比效果`);
          response = await ModelApi.callRvcInfer(params);
          break;
        case 'tts_infer':
          console.log(`[${modelType}] 调用语音合成模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器, 音量控制, 下载按钮`);
          response = await ModelApi.callTtsInfer(params);
          break;
        case 'fbx2split_bundle_v6':
          console.log(`[${modelType}] 调用FBX到Split Bundle转换模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示FBX文件下载链接, 包地址, 包清单地址`);
          response = await ModelApi.callFbx2SplitBundleV6(params);
          break;
        case 'music_game':
          console.log(`[${modelType}] 调用歌曲节拍打谱模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器和节拍谱面`);
          response = await ModelApi.callMusicGame(
            params.data,
            params.version
          );
          break;
        case 'rhythm_music_game':
          console.log(`[${modelType}] 调用节奏音乐游戏谱面生成模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器和节拍谱面可视化`);
          response = await ModelApi.callRhythmMusicGame(
            params.data,
            params.version
          );
          break;
        case 'instantid_photo_3DReal':
          console.log(`[${modelType}] 调用lora推理v2模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示上传的图片和生成的3D真实感图片`);
          response = await ModelApi.callInstantIdPhoto3DReal(
            params.src
          );
          break;
        case 'instantid_photo':
          console.log(`[${modelType}] 调用证件照模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示上传的图片和处理后的证件照`);
          response = await ModelApi.callInstantIdPhoto(
            params.src,
            params.flag
          );
          break;
        case 'free_prompt_image':
          console.log(`[${modelType}] 调用自由提示词生图模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示生成的图片列表，提供放大和下载功能`);
          response = await ModelApi.callFreePromptImage(
            params.prompt,
            params.img_size
          );
          break;
        case 'seed_vc_v2_step1':
          console.log(`[${modelType}] 调用歌曲换声v2拆分模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频和分离后的干音`);
          response = await ModelApi.callSeedVcV2Step1(
            params.music_name,
            params.music_url
          );
          break;
        case 'seed_vc_v2_step2':
          console.log(`[${modelType}] 调用歌曲换声v2合成模型（第二步）`);
          console.log(`[${modelType}] UI渲染提示: 需要显示合成后的音频`);
          response = await ModelApi.callSeedVcV2Step2(
            params.vocals_audio,
            params.backing_track,
            params.reference_audio
          );
          break;
        case 'seed_vc':
          console.log(`[${modelType}] 调用歌曲换声模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频和分离后的干音`);
          response = await ModelApi.callSeedVcV2Step1(
            params.music_name,
            params.music_url
          );
          break;
        case 'mdx23':
          console.log(`[${modelType}] 调用歌曲分轨模型（MDX23）`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始音频和分离后的各个音轨的音频播放器, 下载按钮`);
          response = await ModelApi.callMdx23(params);
          break;
        case 'tts_f5_infer':
          console.log(`[${modelType}] 调用TTS-F5模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器, 音量控制, 下载按钮`);
          response = await ModelApi.callTtsF5Infer(params);
          break;
        case 'tts_zero_shot':
          console.log(`[${modelType}] 调用声音克隆模型（TTS Zero Shot）`);
          console.log(`[${modelType}] UI渲染提示: 需要显示音频播放器, 参考音频对比, 下载按钮`);
          response = await ModelApi.callTtsZeroShot(params);
          break;
        case 'lyric_time_analyzer':
          console.log(`[${modelType}] 调用歌词时间解析模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示歌词时间轴, 音频播放器, 歌词同步显示`);
          response = await ModelApi.callLyricTimeAnalyzer(params.audio);
          break;
        case 'image_style_transfer_v2':
          console.log(`[${modelType}] 调用图片风格化v2模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示原始图片和风格化后的图片, 提供下载功能`);
          response = await ModelApi.callImageStyleTransferV2(
            params.prompt,
            params.ori_img,
            params.style_type,
            params.img_size
          );
          break;
        case 'flame': {
          console.log(`[${modelType}] 调用Flame模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示交互界面, 支持功能按钮和执行结果`);
          response = await ModelApi.callFlame(params);
          break;
        }
        case 'configurable_flame':
          console.log(`[${modelType}] 调用可配置Flame模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示配置面板, 参数设置和执行结果`);
          response = await ModelApi.callConfigurableFlame(params);
          break;
        case 'gpt_service_maas':
          console.log(`[${modelType}] 调用GPT服务模型`);
          console.log(`[${modelType}] UI渲染提示: 需要显示聊天界面, 用户输入和AI回复`);
          response = await ModelApi.callGptServiceMaas("gpt_service_maas", params);
          break;
        default:
          console.error(`[${modelType}] 未知的模型类型`);
          throw new Error(`未知的模型类型: ${modelType}`);
      }

      console.log(`[${modelType}] 模型调用完成，开始处理响应数据`);
      console.log(`[${modelType}] 原始响应数据:`, response);

      // 根据模型类型提取UI渲染所需的关键字段
      let extractedUIData = {};
      let musicData;
      let rvcData;
      let songInfoData;
      let musicSeedStep1Data;
      let musicSeedStep2Data;
      let nestedData; // 添加这个变量声明，用于fbx2split_bundle_v6模型

      switch (modelType) {
        case 'text_to_music':
          // 检查response的数据结构，适应可能的数据嵌套
          musicData = response.data || response;

          console.log("文生音模型原始数据:", response);
          console.log("文生音处理后数据:", musicData);

          extractedUIData = {
            audioUrl: musicData.music_url,
            coverUrl: musicData.img_url,
            musicName: musicData.music_name,
            lyric: musicData.lyric,
            duration: musicData.duration,
            beat: musicData.beat,
            bpm: musicData.bpm,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'music_seed_serial_v6_v2_step1':
          // 处理文生音+拆分模型的响应数据
          // 适应多层嵌套的数据结构
          musicSeedStep1Data = response.data?.data?.data || response.data?.data || response.data || response;
          console.log("文生音+拆分模型原始数据:", response);
          console.log("文生音+拆分处理后数据:", musicSeedStep1Data);

          extractedUIData = {
            musicUrl: musicSeedStep1Data.music_url,
            musicName: musicSeedStep1Data.music_name,
            vocalsAudioUrl: musicSeedStep1Data.vocals_audio,
            backingTrackUrl: musicSeedStep1Data.backing_track,
            imageUrl: musicSeedStep1Data.img_url,
            beat: musicSeedStep1Data.beat,
            bpm: musicSeedStep1Data.bpm,
            duration: musicSeedStep1Data.duration,
            lyric: musicSeedStep1Data.lyric,
            gender: musicSeedStep1Data.gender,
            language: musicSeedStep1Data.language,
            isOriginalMusic: musicSeedStep1Data.is_original_music,
            isHaveCopyright: musicSeedStep1Data.is_have_copyright,
            peopleNames: musicSeedStep1Data.people_names,
            clothesNames: musicSeedStep1Data.clothes_names,
            peopleNumber: musicSeedStep1Data.people_number,
            scale: musicSeedStep1Data.scale,
            version: musicSeedStep1Data.version,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'music_seed_serial_v6_v2_step2':
          // 处理声音转换合成模型的响应数据
          musicSeedStep2Data = response.data || response;
          console.log("声音转换合成模型原始数据:", response);
          console.log("声音转换合成处理后数据:", musicSeedStep2Data);

          extractedUIData = {
            outputPath: musicSeedStep2Data.output_path,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'song_info_gen':
          // 处理歌曲信息生成模型的响应数据
          songInfoData = response.data || response;
          console.log("歌曲信息生成模型原始数据:", response);
          console.log("歌曲信息生成处理后数据:", songInfoData);

          extractedUIData = {
            musicName: songInfoData.music_name,
            songCoverImagePrompt: songInfoData.song_cover_image_prompt,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'synthesise_dance_v6':
          extractedUIData = {
            emoPath: response.emo_path,
            fbxPath: response.fbx_path,
            isOriginal: response.origin,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'rvc_infer':
          // 处理嵌套结构的响应数据
          rvcData = response.data || response;
          console.log("歌曲推理模型原始数据:", response);
          console.log("歌曲推理处理后数据:", rvcData);

          extractedUIData = {
            audioUrl: rvcData.file_oss_url,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'tts_infer':
          extractedUIData = {
            audioUrl: response.infer_file_base64,
            // 为TTS模型添加UI数据提取
          };
          break;
        case 'music_game':
          extractedUIData = {
            result: response.result || response.data?.result,
            audioUrl: params.data, // 使用输入的音频URL作为播放源
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'rhythm_music_game':
          extractedUIData = {
            result: response.result || response.data?.result,
            audioUrl: params.data, // 使用输入的音频URL作为播放源
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'instantid_photo_3DReal':
          extractedUIData = {
            imageUrl: response.res || response.data?.res, // 生成的图片地址
            originalImageUrl: params.src, // 原始图片地址
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'instantid_photo':
          extractedUIData = {
            imageUrl: response.res || response.data?.res, // 生成的图片地址
            originalImageUrl: params.src, // 原始图片地址
            isWhitePerson: params.flag === 'True', // 是否为白人
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'free_prompt_image':
          extractedUIData = {
            imageUrls: response.res || [], // 生成的图片地址列表
            prompt: params.prompt, // 用户输入的提示词
            imgSize: params.img_size, // 图片尺寸比例
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'seed_vc_v2_step1':
          extractedUIData = {
            vocalsAudio: response.vocals_audio,
            backingTrack: response.backing_track,
            musicName: params.music_name,
            musicUrl: params.music_url,
          };
          break;
        case 'seed_vc_v2_step2':
          extractedUIData = {
            outputPath: response.output_path,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'tts_zero_shot':
          extractedUIData = {
            audioUrl: response.infer_file_base64,
            referenceAudioUrl: params.ref_audio_base64,
            referenceText: params.ref_text,
            inferText: params.infer_text,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'tts_f5_infer':
          extractedUIData = {
            audioUrl: response.infer_file_base64,
            referenceAudioUrl: params.ref_audio_base64,
            modelName: params.model_name,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'lyric_time_analyzer':
          extractedUIData = {
            lyricWithTime: response.res,
            audioUrl: params.audio,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'mdx23':
          extractedUIData = {
            bassTrack: response.bass,
            drumsTrack: response.drums,
            instrumTrack: response.instrum,
            otherTrack: response.other,
            vocalsTrack: response.vocals,
            originalAudio: params.audio,
            background: params.bg,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'image_style_transfer_v2':
          // 检查是否有嵌套的错误信息
          if (response.data && response.data.success === false) {
            // 如果内层数据表示失败，保留错误信息，但不提取UI数据
            extractedUIData = {
              errorMessage: response.data.message,
              errorCode: response.data.code,
              originalImageUrl: params.ori_img,
              styleType: params.style_type,
              imageSize: params.img_size,
            };
          } else {
            // 正常情况下提取UI数据
            extractedUIData = {
              stylizedImageUrl: response.res || response.data?.res,
              originalImageUrl: params.ori_img,
              prompt: params.prompt,
              styleType: params.style_type,
              imageSize: params.img_size,
            };
          }
          break;
        case 'seed_vc':
          // 由于使用了callSeedVcV2Step1方法，数据结构与seed_vc_v2_step1相同
          extractedUIData = {
            vocalsAudio: response.vocals_audio,
            backingTrack: response.backing_track,
            musicName: params.music_name,
            musicUrl: params.music_url,
          };
          break;
        case 'audio_video_synthesis_v3':
          extractedUIData = {
            m3u8Url: response.m3u8_url,
            videoUrl: response.video_url,
            projectUrl: response.project_url,
            coverUrl: response.cover_url,
            isEnd: response.is_end,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'fbx2split_bundle_v6':
          // 处理可能存在的嵌套数据结构
          nestedData = response.data?.data;
          extractedUIData = {
            packageUrl: nestedData?.packageUrl || response.packageUrl,
            packageManifestUrl: nestedData?.packageManifestUrl || response.packageManifestUrl,
            status: response.message || '未知状态',
            statusCode: response.code || '未知状态码',
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'txt_image_generate_music':
          extractedUIData = {
            imageUrls: response.res || [],
            prompt: params.prompt,
            musicName: params.music_name,
            batchSize: params.batch_size,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'gpt_service_maas':
          extractedUIData = {
            responseText: response.response || response.message,
            metadata: response.metadata,
            prompt: params.prompt,
            history: params.history,
            // 其他UI渲染可能需要的字段
          };
          break;
        case 'configurable_flame':
          extractedUIData = {
            result: response.result || response.data,
            status: response.status || response.code,
            message: response.message,
            configuration: params.configuration,
            callbackData: params.user_callback_data,
            // 其他UI渲染可能需要的字段
          };
          break;
        // ...可以为其他模型类型添加类似的字段提取
      }

      console.log(`[${modelType}] 提取的UI渲染数据:`, extractedUIData);

      // 设置响应数据 - 只更新当前模型类型的数据
      const formattedResponse = {
        code: response.code || 200,
        message: response.message || '请求成功',
        data: response,
        requestData: params,
        uiData: extractedUIData  // 添加UI渲染所需的关键字段
      };

      // 更新指定模型类型的数据
      setModelData(prevData => ({
        ...prevData,
        [modelType]: {
          ...getModelData(modelType),
          loading: false,
          responseData: formattedResponse,
          requestData: { modelType, params }
        }
      }));

      console.log(`[${modelType}] 更新模型数据:`, formattedResponse);
      console.log(`[${modelType}] 设置加载状态 loading = false`);
      console.log(`[${modelType}] 模型调用流程完成 ✅`);
      console.groupEnd();
      return true;
    } catch (err) {
      console.error(`[${modelType}] 模型调用失败 ❌:`, err);

      // 更新错误状态 - 只更新当前模型类型的数据
      setModelData(prevData => ({
        ...prevData,
        [modelType]: {
          ...getModelData(modelType),
          loading: false,
          error: err.message || '请求失败'
        }
      }));

      console.log(`[${modelType}] 设置错误状态 error =`, err.message || '请求失败');
      console.log(`[${modelType}] 设置加载状态 loading = false`);
      console.groupEnd();
      return false;
    }
  };

  // 清除指定模型类型的响应数据
  const clearResponseData = (modelType) => {
    // 验证modelType是否为有效的模型类型
    if (modelType && !Object.keys(API_CONFIG.modelServers).includes(modelType)) {
      console.warn(`⚠️ 尝试清除未定义的模型 [${modelType}] 的响应数据`);
      return; // 如果不是有效的模型类型，则不执行清除操作
    }

    console.log(`🧹 清除模型 [${modelType}] 的响应数据`);
    if (modelType) {
      // 确保模型数据存在后再清除
      if (modelData[modelType]) {
        setModelData(prevData => ({
          ...prevData,
          [modelType]: {
            ...getModelData(modelType),
            responseData: null
          }
        }));
      }
    } else {
      // 如果未指定模型类型，清除所有响应数据
      console.log('🧹 清除所有模型的响应数据');
      const resetData = {};
      Object.keys(modelData).forEach(type => {
        resetData[type] = {
          ...modelData[type],
          responseData: null
        };
      });
      setModelData(resetData);
    }
  };

  // 提供的上下文值 - 包含获取特定模型数据的函数
  const contextValue = {
    modelData,
    getModelData,
    callModelApi,
    clearResponseData,
  };

  return (
    <ModelContext.Provider value={contextValue}>
      {children}
    </ModelContext.Provider>
  );
};

// 自定义钩子，方便在组件中使用上下文
export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel必须在ModelProvider内部使用');
  }
  return context;
};

export default ModelProvider; 
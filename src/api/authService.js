import CryptoJS from "crypto-js";
import API_CONFIG from "../config/apiConfig";

// 认证服务 - 基于Python示例完全重写
const AuthService = {
	// 生成当前时间戳
	getTimestamp: () => {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		console.log("🕒 生成时间戳:", timestamp);
		return timestamp;
	},

	// 生成签名 - 与Python示例完全一致
	generateSignature: () => {
		console.group("🔐 生成API签名");

		// 1. 构建签名字符串 - 与Python保持完全一致
		const signatureString = `${API_CONFIG.apiKey}\n${API_CONFIG.secretKey}`;
		console.log("签名字符串构建完成");

		// 2. 获取当前时间戳
		const timestamp = AuthService.getTimestamp();

		// 3. 使用HMAC-SHA1算法生成签名
		// Python: signature = hmac.new(signature_time_bytes, signature_string_bytes, hashlib.sha1)
		// 在Python中，第一个参数是密钥(key)，第二个参数是消息(message)
		console.log("使用HMAC-SHA1算法计算签名");
		const hmac = CryptoJS.HmacSHA1(signatureString, timestamp);
		const signatureHex = hmac.toString(CryptoJS.enc.Hex).toUpperCase();
		console.log("签名生成完成:", signatureHex);

		// 4. 构建最终的签名字符串 - 与Python格式完全一致
		const finalSignature = `${API_CONFIG.appId}.${signatureHex}.${timestamp}`;
		console.log("最终签名字符串:", finalSignature);

		console.groupEnd();
		return finalSignature;
	},

	// 获取认证头
	getAuthHeader: () => {
		console.log("📡 获取API认证头");
		const signature = AuthService.generateSignature();
		console.log("📝 生成的签名:", signature);

		const headers = {
			maas_sign: signature,
		};
		console.log("🔑 认证头:", headers);
		return headers;
	},

	// 获取任务结果请求头 - 与Python保持一致
	getTaskResultHeader: () => {
		console.log("🔍 获取任务结果请求头");
		const headers = {
			accessToken: API_CONFIG.taskResultAccessToken,
		};
		console.log("🔑 任务结果访问令牌:", headers);
		return headers;
	},

	// 获取模型服务ID
	getModelServerId: (modelType) => {
		const serverId = API_CONFIG.modelServers[modelType];
		console.log(`📋 获取模型服务ID: ${modelType} => ${serverId}`);
		return serverId;
	},
};

export default AuthService;

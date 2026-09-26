/**
 * Backend API origin. Override with EXPO_PUBLIC_API_BASE_URL in `.env`.
 */
export const API_BASE_URL = "http://66.179.251.12:3000/api/v1";
  // process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://66.179.251.12:3000/api/v1';

// #region agent log
fetch('http://127.0.0.1:7428/ingest/4063d08e-9d60-4cb7-9d29-b20c170daa4f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1ba5eb'},body:JSON.stringify({sessionId:'1ba5eb',hypothesisId:'B',location:'src/api/config.ts',message:'API_BASE_URL resolved',data:{apiBaseUrl:API_BASE_URL,fromEnv:Boolean(process.env.EXPO_PUBLIC_API_BASE_URL)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

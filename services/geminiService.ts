
import { GoogleGenAI } from "@google/genai";
import { GolfGame } from "../types";

export const getAICommentary = async (latestGames: GolfGame[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const gameDataSummary = latestGames.map(g => 
    `날짜: ${g.date}, 코스: ${g.course}, 스코어: ${g.scores.map(s => `${s.playerName}: ${s.score}`).join(', ')}`
  ).join('\n');

  const prompt = `
    당신은 "CLUB F4"라는 전설적인 아마추어 골프 모임의 전문 해설가입니다.
    멤버는 GREGORY, BIRCHAN, PETER, SEVEN 네 명의 남성 골퍼입니다.
    
    최근 경기 데이터를 바탕으로 다음 가이드라인에 따라 한국어 코멘터리를 작성하세요:
    1. 현재 가장 낮은 스코어를 기록 중인 멤버를 '황제'로 칭하며 독보적인 실력을 치켜세우세요.
    2. 가장 점수가 높은(실력이 다소 부진한) 멤버에게는 "잔디와 대화를 나눈다"거나 "홀컵이 공을 밀어낸다"는 식의 유쾌하고 위트 있는 농담을 건네세요.
    3. BIRCHAN님의 최근 상승세나 다른 멤버들의 추격 기세도 언급하며 다음 라운드의 기대감을 높이세요.
    4. 전체적으로 고급스럽고 격려하는 분위기를 유지하세요.
    5. 4~5문장 내외로 풍성하게 작성하세요.
    6. 가독성을 위해 명조체 스타일의 우아하고 격조 높은 문체(안녕하십니까... 합니다... 습니다...)를 사용하세요.

    최근 경기 데이터:
    ${gameDataSummary}
  `;

  const defaultText = "안녕하십니까, 전설적인 \"CLUB F4\"의 전담 해설가입니다. 최근 경기에서 정점에 선 GREGORY님은 필드의 '황제'라는 칭호가 전혀 아깝지 않은 독보적인 샷 메이킹과 완벽한 경기 운영을 유감없이 보여주고 계십니다. 특히 매 경기 무서운 집중력으로 타수를 줄여나가고 계신 BIRCHAN님의 가파른 상승세와, 언제든 다시 70대 타수로 복귀할 준비가 된 PETER님의 매서운 추격 기세가 맞물리며 CLUB F4의 긴장감은 그 어느 때보다 뜨겁게 달아오르고 있습니다. 한편, 우리 SEVEN님은 최근 홀컵이 수줍게 공을 밀어내는 야속한 순간들이 잦았으나, 이는 필드 구석구석 잔디와 깊은 대화를 나누며 다음 라운드의 대반전을 위해 위대한 서사를 준비하는 과정이라 믿어 의심치 않습니다. 네 분 모두 실력이 눈부시게 상향 평준화되며 아마추어 골프의 품격을 새롭게 정의하고 계신 만큼, 다음 라운드에서 펼쳐질 더 우아하고 격조 높은 명승부를 설레는 마음으로 중계석에서 기다려 보겠습니다.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || defaultText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return defaultText;
  }
};

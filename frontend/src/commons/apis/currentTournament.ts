import API from "./api";

export type CurrentTournament = { id: number; name: string; year: number };

// 가장 최근 대회 (백엔드 /tournaments 가 year, createdAt 내림차순으로 정렬해서 줌)
let cached: Promise<CurrentTournament> | null = null;

export const getCurrentTournament = (): Promise<CurrentTournament> => {
  if (!cached) {
    cached = API.get("/tournaments")
      .then((res) => res.data.tournaments[0])
      .catch((e) => {
        cached = null;
        throw e;
      });
  }
  return cached;
};

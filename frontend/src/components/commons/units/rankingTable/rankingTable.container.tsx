import React, { useEffect, useState } from "react";
import {
  GroupSelectorContainer,
  GroupSelector,
  RankingTable,
  TableWrapper,
  RankingContainer,
} from "./rankingTable.style";

import API from "../../../../commons/apis/api"; // api.ts에서 axios 인스턴스 가져옴
import ErrorAlert from "../../../../commons/libraries/showErrorCode";

type Team = {
  id: number;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  rank: number;
  [key: string]: any;
};

type GroupedTeams = Record<string, Team[]>;
// 여기만 바꾸면 어떤 tournamentId로 가져올지 제어됨
const TOURNAMENT_ID = "1";

export default function RankingTableComponent() {
  const [groupData, setGroupData] = useState<GroupedTeams>({});
  const [error, setError] = useState<any>(null);

  const fetchGroupedTeams = async (tid: string): Promise<GroupedTeams> => {
    const response = await API.get(`/tournaments/${tid}/teams/grouped`);
    return response.data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchGroupedTeams(TOURNAMENT_ID);
        setGroupData(data);
      } catch (err: any) {
        setError(err);
        const errorCode = err?.response?.data?.errorCode; // 에러코드 추출
        console.error(err, "errorCode:", errorCode);
        console.error("❌ 그룹 요청 에러:", err);
      }
    };

    fetchData();
  }, []);

  const getGroupName = (key: string) => `${key}조`;

  // (선택) 고정된 순서로 보여주고 싶다면 여기에 순서를 정의하고, 없으면 API에서 내려준 순서대로
  const groupOrder = ["A", "B", "C", "D"];
  const entriesToRender = groupOrder
    .filter((g) => groupData[g])
    .map((g) => [g, groupData[g]] as const).length
    ? groupOrder
        .filter((g) => groupData[g])
        .map((g) => [g, groupData[g]] as const)
    : Object.entries(groupData);

  return (
    <RankingContainer>
      <div
        style={{
          marginBottom: "100px",
        }}
      >
        {entriesToRender.map(([groupKey, teams]) => (
          <div key={groupKey}>
            <GroupSelectorContainer>
              <GroupSelector>{getGroupName(groupKey)}</GroupSelector>
            </GroupSelectorContainer>
            <TableWrapper>
              <RankingTable>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>팀명</th>
                    <th>경기수</th>
                    <th>승</th>
                    <th>무</th>
                    <th>패</th>
                  </tr>
                </thead>
                <tbody>
                  {[...teams]
                    .sort((a, b) => {
                      const rankA = a.rank ?? Infinity;
                      const rankB = b.rank ?? Infinity;
                      if (rankA !== rankB) return rankA - rankB;
                      // 동률일 경우 이름 기준으로 안정적인 정렬
                      return (a.name ?? "").localeCompare(b.name ?? "");
                    })
                    .map((team: Team, index: number) => (
                      <tr key={team.id ?? index}>
                        <td>{team.rank ?? ""}</td>
                        <td>{team.name ?? team.teamName ?? ""}</td>
                        <td>{team.games ?? ""}</td>
                        <td>{team.wins ?? ""}</td>
                        <td>{team.draws ?? ""}</td>
                        <td>{team.losses ?? ""}</td>
                      </tr>
                    ))}
                </tbody>
              </RankingTable>
            </TableWrapper>
          </div>
        ))}
      </div>
      <ErrorAlert error={error} />
    </RankingContainer>
  );
}

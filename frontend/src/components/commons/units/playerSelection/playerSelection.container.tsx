// PlayerSelectionPage.tsx
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { playerListState } from "../../../../commons/stores";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";

// 페이지 전체를 감싸는 컨테이너 스타일 (모달 오버레이 제거)
const PageContainer = styled.div`
  padding: 20px;
`;

// 페이지 타이틀
const PageTitle = styled.h2`
  margin-bottom: 20px;
  font-size: 18px;
  text-align: center;
`;

// 선수 목록 테이블 스타일은 기존과 동일
export const PlayerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th,
  td {
    border-bottom: 1px solid #ddd;
    padding: 10px;
    font-size: 14px;
    text-align: center;
  }

  th {
    background-color: #f7f7f7;
  }

  tr:last-of-type td {
    border-bottom: none;
  }

  /* hover 효과 */
  tbody tr:hover {
    background-color: #f2f2f2;
    cursor: pointer;
  }
`;

// 뒤로가기 버튼 (원하는 동작에 맞게 수정 가능)
const BackButton = styled.button`
  background-color: #0f0f70;
  border: none;
  color: #fff;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: block;
  margin: 0 auto;

  &:hover {
    background-color: #2f2f9f;
  }
`;

interface IPlayerSelectionPageProps {
  onSelectPlayer: (playerName: string) => void;
  selectedPlayerNames: string[];
}

export default function PlayerSelectionPage({
  onSelectPlayer,
  selectedPlayerNames,
}: IPlayerSelectionPageProps) {
  const router = useRouter();
  const [playerList] = useRecoilState(playerListState);
  const [pageTitle, setPageTitle] = useState("선수를 선택해주세요");
  const [error, setError] = useState(null);
  // document.referrer를 사용해 직전 페이지가 /records/substitution인지 확인
  useEffect(() => {
    if (typeof document !== "undefined") {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.pathname === "/records/substitution") {
          setPageTitle("교체할 선수를 선택해주세요");
        }
      } catch (error) {
        setError(error);
        const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
        console.error(error, "errorCode:", errorCode);
        // 유효한 URL이 아닐 경우 무시
      }
    }
  }, []);

  // 전체 플레이어 목록을 그대로 사용
  const allPlayersList = playerList;

  // 이미 선택된 선수면 클릭 무효, 선택 시 onSelectPlayer 호출 후 이전 페이지로 이동
  const handleRowClick = (playerName: string, isAlreadySelected: boolean) => {
    if (isAlreadySelected) return;
    onSelectPlayer(playerName);
    router.back();
  };

  return (
    <PageContainer>
      <PageTitle>{pageTitle}</PageTitle>
      <PlayerTable>
        <thead>
          <tr>
            <th>학과</th>
            <th>성명</th>
            <th>선출/WC</th>
          </tr>
        </thead>
        <tbody>
          {allPlayersList.map((player, idx) => {
            const isAlreadySelected = selectedPlayerNames.includes(player.name);
            return (
              <tr
                key={idx}
                onClick={() => handleRowClick(player.name, isAlreadySelected)}
                style={{
                  color: isAlreadySelected ? "gray" : "inherit",
                  cursor: isAlreadySelected ? "default" : "pointer",
                }}
              >
                <td>{player.department}</td>
                <td>{player.name}</td>
                <td>{player.wc || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </PlayerTable>
      <BackButton onClick={() => router.back()}>뒤로가기</BackButton>
      <ErrorAlert error={error} />
    </PageContainer>
  );
}

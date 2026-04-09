// PlayerSelectionModal.tsx
import { useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { useRouter } from "next/router";
import {
  AwayTeamPlayerListState,
  HomeTeamPlayerListState,
} from "../../../commons/stores";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 120px; /* 헤더 높이 만큼 띄워줌 */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start; /* 모달 컨텐츠가 헤더 밑에 표시되도록 */
  justify-content: center;
`;

export const ModalContainer = styled.div`
  background-color: #fff;
  width: 100vw; /* 테이블을 위해 살짝 넓힘 */
  height: 100vh; /* 모달의 높이를 고정 */
  max-height: calc(100vh - 120px); /* 헤더를 제외한 최대 높이 */
  margin-bottom: 200px;
  padding: 20px;
  text-align: center;
  overflow-y: auto; /* 콘텐츠가 높이를 넘으면 스크롤되도록 */
`;

export const ModalTitle = styled.h2`
  margin-bottom: 35px;
  margin-top: 35px;
  font-size: 18px;
  font-family: "KBO-Dia-Gothic_bold";
`;

export const PlayerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th,
  td {
    padding: 10px;
    font-size: 14px;
    text-align: center;
  }

  th {
    background-color: white;
    border-bottom: 1px solid black;
    border-top: 1px solid black;
  }

  tr:last-of-type td {
    border-bottom: none;
  }

  tbody tr:hover {
    cursor: pointer;
  }
`;

export const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
`;

export const ControlButton = styled.button`
  background-color: #0f0f70;
  width: 90%;
  height: 6vh;
  border: 1px solid #999;
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: bold;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  border-radius: 2vh;
`;

interface IPlayerSelectionModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectPlayer: (selectedPlayer: {
    name: string;
    id: number;
    wc?: string;
  }) => void;
  selectedPlayerIds: number[]; // 이름 대신 ID 리스트
  allowDuplicates: boolean; // P행에서 중복 선택 허용 여부
}

export default function PlayerSelectionModal({
  setIsModalOpen,
  onSelectPlayer,
  selectedPlayerIds, // prop 이름 변경
  allowDuplicates,
}: IPlayerSelectionModalProps) {
  const router = useRouter();
  const [homeTeamPlayers] = useRecoilState(HomeTeamPlayerListState);
  const [awayTeamPlayers] = useRecoilState(AwayTeamPlayerListState);
  const allPlayersList = router.asPath.includes("homeTeamRegistration")
    ? homeTeamPlayers
    : awayTeamPlayers;
  // ↓ 여기를 추가: name 기준 가나(한국어) 정렬
  const sortedPlayers = useMemo(
    () =>
      [...allPlayersList].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [allPlayersList]
  );

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => setIsModalOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setIsModalOpen]);

  const handleOverlayClick = () => setIsModalOpen(false);
  const handleContainerClick = (e: React.MouseEvent) => e.stopPropagation();

  const handleRowClick = (
    player: {
      id: number;
      department: string;
      name: string;
      isElite: boolean;
      isWc: boolean;
    },
    isAlreadySelected: boolean
  ) => {
    if (isAlreadySelected) return;
    onSelectPlayer({
      name: player.name,
      id: player.id,
      wc: player.isWc ? "WC" : undefined,
    });
    setIsModalOpen(false);
  };

  console.log("selected IDs:", selectedPlayerIds);

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={handleContainerClick}>
        <ModalTitle>선수를 선택해주세요</ModalTitle>
        <PlayerTable>
          <thead>
            <tr>
              <th>학과</th>
              <th>성명</th>
              <th>선출/WC</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const isAlreadySelected =
                !allowDuplicates && selectedPlayerIds.includes(player.id);
              return (
                <tr
                  key={player.id}
                  onClick={() => handleRowClick(player, isAlreadySelected)}
                  style={{
                    color: isAlreadySelected ? "gray" : "inherit",
                    cursor: isAlreadySelected ? "default" : "pointer",
                  }}
                >
                  <td>{player.department}</td>
                  <td>{player.name}</td>
                  <td>
                    {player.isElite && player.isWc
                      ? "선출/WC"
                      : player.isElite
                      ? "선출"
                      : player.isWc
                      ? "WC"
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </PlayerTable>
        <ButtonContainer>
          <ControlButton onClick={() => setIsModalOpen(false)}>
            닫기
          </ControlButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
}

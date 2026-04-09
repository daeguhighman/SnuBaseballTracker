// TeamRegistrationPageComponent.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useRecoilState } from "recoil";
import {
  Container,
  Title,
  PlayerList,
  PlayerRow,
  OrderNumber,
  NameWrapper,
  InputWrapper,
  PlayerNameInput,
  SearchIcon,
  PositionWrapper,
  PositionText,
  PositionDropdown,
  ControlButton,
  LargeTitle,
  WildCardBox,
  ArrowIcon,
  ButtonWrapper,
  ArrowIconNone,
  PitcherPositionText,
} from "./teamRegistration.style";
import RecordStartModal from "../../modals/recordStart";
import PlayerSelectionModal from "../../modals/playerSelectionModal";
import {
  TeamListState,
  HomeTeamPlayerListState,
  AwayTeamPlayerListState,
  IHAPlayer,
  gameId,
  lastRouteState,
} from "../../../../commons/stores/index";
import API from "../../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import { count } from "console";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
  ModalTitleSmaller,
} from "../../modals/modal.style";

interface PlayerInfo {
  battingOrder: number | string;
  name?: string;
  position?: string;
  selectedViaModal?: boolean;
  id?: number;
}

interface IProps {
  isHomeTeam: boolean;
}

const positionOptions = [
  "CF",
  "LF",
  "RF",
  "SS",
  "1B",
  "2B",
  "3B",
  "C",
  "DH",
  "P",
];

export default function TeamRegistrationPageComponent(props: IProps) {
  const router = useRouter();
  // 기존 useState 훅들 아래에 추가
  const [validationError, setValidationError] = useState<string | null>(null);
  // const [recordId, setGameId] = useRecoilState(gameId);
  const recordId = router.query.recordId;
  const [teamInfo] = useRecoilState(TeamListState);
  const [homeTeamPlayers, setHomeTeamPlayers] = useRecoilState(
    HomeTeamPlayerListState
  );
  const [awayTeamPlayers, setAwayTeamPlayers] = useRecoilState(
    AwayTeamPlayerListState
  );
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [error, setError] = useState(null);

  // 컴포넌트 내부 상단에 상태 추가
  const [selectedMatch, setSelectedMatch] = useState<any[]>([]);
  const [matchGameId, setMatchGameId] = useState<number | null>(null);
  const [homeTeamIdState, setHomeTeamIdState] = useState<number | null>(null);
  const [awayTeamIdState, setAwayTeamIdState] = useState<number | null>(null);
  // 로컬스토리지에서 selectedMatch 읽어오기 + 정규화
  useEffect(() => {
    try {
      const raw = localStorage.getItem("selectedMatch");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSelectedMatch(parsed);
      } else if (parsed && typeof parsed === "object") {
        // 객체로 저장돼 있는 구 버전 대응: 배열로 감싸서 사용
        setSelectedMatch([parsed]);
        // (선택) 이후에 형식 통일을 위해 다시 배열로 덮어쓰기
        localStorage.setItem("selectedMatch", JSON.stringify([parsed]));
      } else {
        console.warn("selectedMatch is neither array nor object:", parsed);
      }
    } catch (e) {
      console.warn("failed to parse selectedMatch from localStorage", e);
    }
  }, []);
  console.log("selectedMatch", selectedMatch);
  interface StoredMatch {
    gameId: number;
    awayTeam?: { id: number; name?: string };
    homeTeam?: { id: number; name?: string };
    status?: string;
    [key: string]: any;
  }

  useEffect(() => {
    if (selectedMatch.length === 0) return;
    const first = selectedMatch[0] as StoredMatch;
    setMatchGameId(first.gameId ?? null);
    setHomeTeamIdState(first.homeTeam?.id ?? null);
    setAwayTeamIdState(first.awayTeam?.id ?? null);
  }, [selectedMatch]);

  console.log(matchGameId, homeTeamIdState, awayTeamIdState);

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      // matchGameId 우선, 없으면 query에서
      const gameId =
        matchGameId ?? (router.query.recordId as string | undefined);
      if (!gameId) return;

      // 홈/원정에 따라 적절한 팀 ID 선택
      const teamTournamentId = props.isHomeTeam
        ? homeTeamIdState
        : awayTeamIdState;
      if (!teamTournamentId) return; // 아직 teamId가 준비 안 된 경우 스킵

      try {
        const endpoint = `/games/${gameId}/teams/${teamTournamentId}/players`;
        const res = await API.get(endpoint);
        console.log(
          `응답이 도착! (${props.isHomeTeam ? "홈팀" : "원정팀"} 멤버)`,
          res.data
        );
        const dataObj =
          typeof res.data === "string" ? JSON.parse(res.data) : res.data;

        if (props.isHomeTeam) {
          setHomeTeamName(dataObj.name);
          setHomeTeamPlayers(dataObj.players);
        } else {
          setAwayTeamName(dataObj.name);
          setAwayTeamPlayers(dataObj.players);
        }
      } catch (err: any) {
        setError(err);
        const errorCode = err?.response?.data?.errorCode;
        console.error("팀 선수 목록 요청 에러:", err, "errorCode:", errorCode);
      }
    };

    fetchTeamPlayers();
  }, [
    matchGameId,
    router.query.recordId,
    homeTeamIdState,
    awayTeamIdState,
    props.isHomeTeam,
  ]);

  console.log("homeTeamPlayers", homeTeamPlayers);
  // useEffect(() => {
  //   // 둘 다 빈 배열일 때는 아무 것도 하지 않음
  //   // if (awayTeamPlayers.length === 0 && homeTeamPlayers.length === 0) return;
  //   console.log(homeTeamName);
  //   // // 하나라도 값이 있으면 로그 출력
  //   if (awayTeamPlayers.length > 0) {
  //     console.log("awayTeamPlayers", awayTeamPlayers);
  //   }
  //   if (homeTeamPlayers.length > 0) {
  //     console.log("homeTeamPlayers", homeTeamPlayers);
  //   }
  // }, [awayTeamPlayers, homeTeamPlayers]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [players, setPlayers] = useState<PlayerInfo[]>([
    { battingOrder: 1, selectedViaModal: false },
    { battingOrder: 2, selectedViaModal: false },
    { battingOrder: 3, selectedViaModal: false },
    { battingOrder: 4, selectedViaModal: false },
    { battingOrder: 5, selectedViaModal: false },
    { battingOrder: 6, selectedViaModal: false },
    { battingOrder: 7, selectedViaModal: false },
    { battingOrder: 8, selectedViaModal: false },
    { battingOrder: 9, selectedViaModal: false },
    { battingOrder: "P", selectedViaModal: false },
  ]);

  const duplicatePositions = useMemo(() => {
    const counts: Record<string, number> = {};
    // 1~9번(인덱스 0~8) 포지션만 집계
    players.slice(0, 9).forEach((p) => {
      if (p.position) {
        counts[p.position] = (counts[p.position] || 0) + 1;
      }
    });
    // 2회 이상 등장한 포지션 이름만 반환
    return Object.keys(counts).filter((pos) => counts[pos] > 1);
  }, [players]);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      players: players.map((player) => ({
        name: player.name ?? "",
        position: player.position ?? "",
        id: player.id,
      })),
    },
  });

  const [lastPUpdateIndex, setLastPUpdateIndex] = useState<number | null>(null);
  const [openPositionRow, setOpenPositionRow] = useState<number | null>(null);
  const handlePositionClick = (index: number) => {
    setOpenPositionRow(openPositionRow === index ? null : index);
  };
  const handlePositionSelect = (index: number, pos: string) => {
    const updated = [...players];
    updated[index].position = pos;
    if (pos === "P" && updated[index].battingOrder !== "P") {
      setLastPUpdateIndex(index);
    }
    setPlayers(updated);
    setValue(`players.${index}.position`, pos);
    setOpenPositionRow(null);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayerSelectionModalOpen, setIsPlayerSelectionModalOpen] =
    useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(
    null
  );

  const [localPlayerList, setLocalPlayerList] = useState<IHAPlayer[]>([]);

  useEffect(() => {
    if (!router.query.recordId) return;
    if (router.asPath.includes("homeTeamRegistration")) {
      setLocalPlayerList(homeTeamPlayers);
    } else {
      setLocalPlayerList(awayTeamPlayers);
    }
  }, [router.query.recordId, homeTeamPlayers, awayTeamPlayers]);
  console.log("localPlayerList", localPlayerList);

  const handleSelectPlayer = (sel: {
    name: string;
    id: number;
    wc?: string;
  }) => {
    if (selectedPlayerIndex === null) return;
    const updated = [...players];
    updated[selectedPlayerIndex].name = sel.name;
    updated[selectedPlayerIndex].id = sel.id;
    updated[selectedPlayerIndex].selectedViaModal = true;
    setPlayers(updated);
    setValue(`players.${selectedPlayerIndex}.name`, sel.name);
    setValue(`players.${selectedPlayerIndex}.id`, sel.id);
    if (
      updated[selectedPlayerIndex].battingOrder !== "P" &&
      updated[selectedPlayerIndex].position === "P"
    ) {
      setLastPUpdateIndex(selectedPlayerIndex);
    }
    setIsPlayerSelectionModalOpen(false);
    setSelectedPlayerIndex(null);
  };
  const onSubmit = async (data: any) => {
    // 1. 폼의 입력값으로 players 배열 업데이트
    const updatedPlayers = players.map((player, index) => {
      if (player.battingOrder === "P") {
        return {
          ...player,
          name: data.players[index].name,
          position: "P",
        };
      }
      return {
        ...player,
        name: data.players[index].name,
        position: data.players[index].position,
      };
    });

    // 2. P행 제외한 선수들
    const nonPRows = updatedPlayers.filter(
      (player) => player.battingOrder !== "P"
    );

    // 3. 비‑P 행 필수값 체크 (이름, 포지션)
    const blankNameNonP = nonPRows.find((player) => !player.name?.trim());
    if (blankNameNonP) {
      alert(
        `${blankNameNonP.battingOrder}번 타자의 선수명 입력칸이 \n 비어 있습니다.`
      );
      return;
    }
    const blankPositionNonP = nonPRows.find(
      (player) => !player.position?.trim()
    );
    if (blankPositionNonP) {
      alert(
        `${blankPositionNonP.battingOrder}번 타자의 포지션 입력칸이 \n  비어 있습니다.`
      );
      return;
    }

    // 4. 1~9번 행에서 DH와 P가 동시에 선택되지 않도록 검증
    const nonPPositions = nonPRows.map((player) => player.position!.trim());
    const hasDH = nonPPositions.includes("DH");
    const hasP = nonPPositions.includes("P");
    if (hasDH && hasP) {
      alert(
        "1번~9번 타순에서는 \n DH와 P를 동시에 선택할 수 없습니다. \n DH만 선택하거나 P만 선택해주세요."
      );
      return;
    }

    // 5. 1~9번 행에 P만 있을 때, 그 P 선수명과 P행 이름이 일치하는지 검증
    const pRow = updatedPlayers.find((player) => player.battingOrder === "P");
    if (!hasDH && hasP) {
      const nonPpitcher = nonPRows.find((player) => player.position === "P");
      if (nonPpitcher && pRow && nonPpitcher.name !== pRow.name) {
        alert(
          "1번~9번 타순에 투수가 있는 경우, \n 해당 선수명과 P행 선수명이 \n  일치해야 합니다."
        );
        return;
      }
    }

    // 6. 1~9번 행에 DH가 있는 경우, P행의 선수이름은 1~9번 행 내에 존재하면 안됨
    if (hasDH) {
      if (pRow && nonPRows.some((player) => player.name === pRow.name)) {
        alert(
          "1번~9번 타순에 DH가 있는 경우, \nP행의 선수명은 1번~9번 타순 내에 \n존재해서는 안됩니다."
        );
        return;
      }
    }

    // 7. DH 여부 확인
    const hasDHOverall = hasDH;

    // 8. DH가 없고 P행이 비어 있으면, 비‑P 행 중 P 포지션 선수명 복사
    if (!hasDHOverall && pRow && !pRow.name?.trim()) {
      const sourceRow = nonPRows.find(
        (player) => player.position === "P" && player.name?.trim()
      );
      if (sourceRow) {
        pRow.name = sourceRow.name!;
        pRow.id = sourceRow.id;
        pRow.selectedViaModal = sourceRow.selectedViaModal;
        const pIndex = updatedPlayers.findIndex(
          (player) => player.battingOrder === "P"
        );
        setValue(`players.${pIndex}.name`, sourceRow.name);
      }
    }

    // 9. P행 검증
    if (pRow && !pRow.name?.trim()) {
      alert("P행의 선수명 입력 칸이 비어 있습니다.");
      return;
    }

    // 10. 필수 포지션 검증
    const requiredPositions = hasDHOverall
      ? ["CF", "LF", "RF", "SS", "1B", "2B", "3B", "C", "DH"]
      : ["CF", "LF", "RF", "SS", "1B", "2B", "3B", "C", "P"];
    const nonPPosList = nonPRows.map((player) => player.position!.trim());
    for (const pos of requiredPositions) {
      if (!nonPPosList.includes(pos)) {
        alert("포지션 입력이 올바르지 않습니다.");
        return;
      }
    }

    // 11. 와일드카드(WC) 제한 체크
    const uniqueWildcardNames = new Set(
      updatedPlayers.reduce<string[]>((acc, player) => {
        if (player.name?.trim()) {
          const global = localPlayerList.find((p) => p.name === player.name);
          if (global?.isWc) acc.push(player.name.trim());
        }
        return acc;
      }, [])
    );
    const wildcardCount = uniqueWildcardNames.size;
    console.log(wildcardCount);
    if (wildcardCount > 3) {
      alert(`와일드카드 제한을 초과했습니다\n (현재 ${wildcardCount}명)`);
      return;
    }

    // 12. 요청 바디 구성
    let batters, pitcherData;
    if (hasDHOverall) {
      batters = nonPRows.map((player) => ({
        battingOrder: player.battingOrder,
        id: player.id,
        position: player.position,
      }));
      pitcherData = pRow;
    } else {
      batters = nonPRows.map((player) => ({
        battingOrder: player.battingOrder,
        id: player.id,
        position: player.position,
      }));
      pitcherData = nonPRows.find((player) => player.position === "P");
    }

    const requestBody = {
      batters,
      pitcher: { id: pitcherData.id },
    };

    console.log(requestBody);

    // 13. 서버에 POST 요청
    setIsSubmitting(true);
    try {
      if (props.isHomeTeam) {
        //  const url = `/games/${recordId}/lineup?teamType=${teamType}`;
        const url = `/games/${recordId}/teams/${homeTeamIdState}/lineup`;
        const res = await API.post(
          url,
          requestBody
          // { withCredentials: true }
        );
        console.log("홈팀POST 요청 성공:", res.data);
      } else {
        const url = `/games/${recordId}/teams/${awayTeamIdState}/lineup`;
        const res = await API.post(
          url,
          requestBody
          // { withCredentials: true }
        );
        console.log("원정팀POST 요청 성공:", res.data);
      }
      // const teamType = props.isHomeTeam ? "home" : "away";

      setPlayers(updatedPlayers);
      setIsSubmitting(false);

      if (props.isHomeTeam) {
        router.push(
          `/matches/${recordId}/homeTeamRegistration/homeTeamSubRegistration`
        );
      } else {
        router.push(
          `/matches/${recordId}/awayTeamRegistration/awayTeamSubRegistration`
        );
      }
    } catch (error) {
      setError(error);
      const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      console.error(error, "errorCode:", errorCode);
      console.error("POST 요청 실패:", error);
      setIsSubmitting(false);
    }
  };
  const [showTitle, setShowTitle] = useState(false);
  // router와 팀 이름이 준비되면 true
  useEffect(() => {
    if (router.isReady) {
      setShowTitle(true);
    }
  }, [recordId, router.isReady]);

  // ① watch로 가져오기
  const watchedPlayers = watch("players");

  // ② 상태나 렌더링마다 로그 찍기 (의존성 배열에 watchedPlayers)
  useEffect(() => {
    console.log("watch('players'):", watchedPlayers);
    console.log(router.asPath.includes("homeTeamRegistration"));
  }, []);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      setValidationError(msg);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);
  const [lastRoute, setLastRoute] = useRecoilState(lastRouteState);
  // 페이지가 마운트될 때 현재 경로 저장
  useEffect(() => {
    if (router.pathname !== "/") {
      // 홈은 굳이 저장하지 않음
      setLastRoute(router.asPath);
    }
  }, [router.asPath]);
  console.log("lastRoute", lastRoute);
  return (
    <Container onClick={() => setOpenPositionRow(null)}>
      <LargeTitle>라인업을 등록해주세요</LargeTitle>
      {showTitle ? (
        <Title>
          {router.asPath.includes("homeTeamRegistration")
            ? homeTeamName
            : awayTeamName}{" "}
          야구부
        </Title>
      ) : (
        <div style={{ height: "1.2em" }} /> // 높이만 미리 차지
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <PlayerList style={{ flexGrow: 1 }}>
          {players.map((player, index) => {
            const currentName = watch(`players.${index}.name`) || "";
            const prevName =
              index === 0 ? "dummy" : watch(`players.${index - 1}.name`) || "";
            const prevPos =
              index === 0 ? "dummy" : players[index - 1].position || "";
            const isRowEnabled =
              index === 0 || (prevName.trim() !== "" && prevPos.trim() !== "");
            const globalPlayer = localPlayerList.find(
              (p) => p.name === currentName
            );
            // console.log(globalPlayer);
            return (
              <PlayerRow key={`${player.battingOrder}-${index}`}>
                <OrderNumber>{player.battingOrder}</OrderNumber>
                <NameWrapper hasValue={!!currentName}>
                  <InputWrapper hasValue={!!currentName}>
                    <PlayerNameInput
                      hasValue={!!currentName}
                      {...register(`players.${index}.name`)}
                      placeholder="선수명 선택"
                      autoComplete="off"
                      readOnly
                      disabled={!isRowEnabled}
                      onClick={() => {
                        if (isRowEnabled) {
                          setSelectedPlayerIndex(index);
                          setIsPlayerSelectionModalOpen(true);
                        }
                      }}
                    />
                    {currentName && globalPlayer?.isWc && (
                      <WildCardBox>WC</WildCardBox>
                    )}
                  </InputWrapper>
                  <SearchIcon
                    src="/images/magnifier.png"
                    alt="Search Icon"
                    onClick={() => {
                      if (isRowEnabled) {
                        setSelectedPlayerIndex(index);
                        setIsPlayerSelectionModalOpen(true);
                      }
                    }}
                  />
                </NameWrapper>

                {player.battingOrder !== "P" ? (
                  <PositionWrapper
                    onClick={(e) => {
                      if (isRowEnabled) {
                        e.stopPropagation();
                        handlePositionClick(index);
                      }
                    }}
                  >
                    <PositionText
                      isPlaceholder={!player.position}
                      style={{
                        color:
                          player.position &&
                          duplicatePositions.includes(player.position)
                            ? "red"
                            : undefined,
                      }}
                    >
                      {!player.position ? (
                        <>
                          <ArrowIconNone>▽</ArrowIconNone>
                          포지션 선택
                          <ArrowIcon>▽</ArrowIcon>
                        </>
                      ) : (
                        <>
                          <ArrowIconNone>▽</ArrowIconNone>
                          {player.position}
                          <ArrowIconNone>▽</ArrowIconNone>
                        </>
                      )}
                    </PositionText>
                    {openPositionRow === index && (
                      <PositionDropdown
                        dropUp={
                          typeof player.battingOrder === "number" &&
                          player.battingOrder >= 6
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        {positionOptions.map((pos) => (
                          <li
                            key={pos}
                            onClick={(e) => {
                              if (isRowEnabled) {
                                e.stopPropagation();
                                handlePositionSelect(index, pos);
                              }
                            }}
                          >
                            {pos}
                          </li>
                        ))}
                      </PositionDropdown>
                    )}
                  </PositionWrapper>
                ) : (
                  <PositionWrapper>
                    <PitcherPositionText>P</PitcherPositionText>
                  </PositionWrapper>
                )}
              </PlayerRow>
            );
          })}
        </PlayerList>

        <ButtonWrapper>
          <ControlButton type="submit" disabled={isSubmitting}>
            제출하기
          </ControlButton>
        </ButtonWrapper>
      </form>

      {isModalOpen && <RecordStartModal setIsModalOpen={setIsModalOpen} />}
      {isPlayerSelectionModalOpen && selectedPlayerIndex !== null && (
        <PlayerSelectionModal
          setIsModalOpen={setIsPlayerSelectionModalOpen}
          onSelectPlayer={handleSelectPlayer}
          // 마지막 요소를 제외하기 위해 slice(0, -1) 사용
          selectedPlayerIds={
            (watch("players") || [])
              .slice(0, -1) // 마지막 행 제외
              .map((p: any) => p.id) // playerId 매핑
              .filter((id: number | undefined) => id != null) // undefined 제외
          }
          allowDuplicates={players[selectedPlayerIndex].battingOrder === "P"}
        />
      )}
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
      {validationError && (
        <ModalOverlay>
          <ModalContainer>
            <ModalTitleSmaller>{validationError}</ModalTitleSmaller>

            <ModalButton onClick={() => setValidationError(null)}>
              확인
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </Container>
  );
}

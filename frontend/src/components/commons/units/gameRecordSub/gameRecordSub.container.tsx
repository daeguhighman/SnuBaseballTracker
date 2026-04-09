import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useRecoilState } from "recoil";
import {
  Container,
  Title,
  PlayerList,
  PlayerRow,
  BlankPlayerRow,
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
  ArrowIconNone,
  PitcherPositionText,
  SuggestionList,
  SuggestionItem,
  ButtonWrapper,
} from "./gameRecordSub.style";
import RecordStartModal from "../../modals/recordStart";
import PlayerSelectionModal from "../../modals/playerSelectionModal";
import {
  TeamListState,
  HomeTeamPlayerListState,
  AwayTeamPlayerListState,
  IHAPlayer,
  snapshotState,
} from "../../../../commons/stores/index";
import API from "../../../../commons/apis/api";
import SubPlayerSelectionModal from "../../modals/playerSubstituteModal";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmaller,
} from "../../modals/modal.style";
import SubReturnModal from "../../modals/subReturnModal";

// 선수 정보를 나타내는 인터페이스
interface PlayerInfo {
  battingOrder: number | string;
  name?: string;
  position?: string;
  selectedViaModal?: boolean;
  id?: number;
  isWc: boolean;
}

// 포지션 선택 옵션
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

// 기본 라인업 (API 응답 전 fallback default 값)
// 기존 기본값은 사용하지 않고 API에서 받아온 pitcher row가 초기값으로 반영됩니다.
const defaultLineup = {
  batters: [
    { battingOrder: 1, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 2, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 3, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 4, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 5, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 6, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 7, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 8, id: 0, name: "", position: "", isWc: false },
    { battingOrder: 9, id: 0, name: "", position: "", isWc: false },
  ],
  pitcher: {
    id: 0,
    name: "", // 이 값은 API 결과에서 대체됩니다.
    isWc: false,
  },
};

// defaultPlayers 초기값 (초기 렌더링 전에 사용하므로 API 호출 전 fallback 값)
const defaultPlayers: PlayerInfo[] = [
  ...defaultLineup.batters.map((batter) => ({
    battingOrder: batter.battingOrder,
    name: batter.name,
    position: batter.position,
    id: batter.id,
    isWc: batter.isWc,
    selectedViaModal: false,
  })),
  {
    battingOrder: "P",
    name: defaultLineup.pitcher.name,
    position: "P",
    id: defaultLineup.pitcher.id,
    isWc: defaultLineup.pitcher.isWc,
    selectedViaModal: false,
  },
];

export default function TeamRegistrationPageComponent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wildCardCount, setWildCardCount] = useState(0);

  // 홈/원정 여부 상태
  const [isHomeTeam, setIsHomeTeam] = useState(true);

  // Recoil: 홈/원정 선수 목록
  const [homeTeamPlayers, setHomeTeamPlayers] = useRecoilState(
    HomeTeamPlayerListState
  );
  const [awayTeamPlayers, setAwayTeamPlayers] = useRecoilState(
    AwayTeamPlayerListState
  );
  const [error, setError] = useState(null);

  // 팀 API 응답 (선수 목록)
  const [teamPlayersData, setTeamPlayersData] = useState<any[]>([]);
  // 라인업 API 응답
  const [lineupPlayersData, setLineupPlayersData] = useState<any[]>([]);
  // 커스텀으로 WC 체크된 선수 관리 (key=id, value=true/false)
  const [customWcMap, setCustomWcMap] = useState<{
    [id: number]: boolean;
  }>({});

  // react-hook-form 및 선수 state 초기화
  const [players, setPlayers] = useState<PlayerInfo[]>(defaultPlayers);

  const { register, handleSubmit, watch, getValues, setValue } = useForm({
    defaultValues: {
      players: defaultPlayers.map((player) => ({
        name: player.name || "",
        position: player.position || "",
        isWc: player.isWc,
        id: player.id,
      })),
    },
  });
  // ★ 최근 수정한 batter 행(투수 행 제외)의 인덱스를 추적하는 state
  const [lastPUpdateIndex, setLastPUpdateIndex] = useState<number | null>(null);

  // URL 쿼리로 홈/원정 설정
  useEffect(() => {
    if (router.isReady) {
      const queryValue = router.query.isHomeTeam;
      if (queryValue === "true") {
        setIsHomeTeam(true);
        console.log("홈팀입니다");
      } else if (queryValue === "false") {
        setIsHomeTeam(false);
        console.log("원정입니다");
      }
    }
  }, [router.isReady, router.query.isHomeTeam]);

  const [teamTournamentId, setTeamTournamentId] = useState<number | null>(null);

  // 팀 ID 결정: isHomeTeam이 확정된 후에만 실행
  useEffect(() => {
    if (!router.isReady) return;

    // isHomeTeam이 아직 설정되지 않았으면 대기
    if (router.query.isHomeTeam === undefined) return;

    let id: number | null = null;

    // 1) localStorage(selectedMatch) 우선
    try {
      const s = localStorage.getItem("selectedMatch");
      if (s) {
        const m = JSON.parse(s);
        id = isHomeTeam ? m?.homeTeam?.id ?? null : m?.awayTeam?.id ?? null;
      }
    } catch (e) {
      console.warn("selectedMatch 파싱 실패:", e);
    }

    // 2) snapshotData 폴백
    if (id == null) {
      const snapId = isHomeTeam
        ? snapshotData?.snapshot?.gameSummary?.homeTeam?.id
        : snapshotData?.snapshot?.gameSummary?.awayTeam?.id;
      id = typeof snapId === "number" ? snapId : null;
    }

    setTeamTournamentId(id);
    console.log(
      "resolved teamTournamentId =",
      id,
      "(isHomeTeam:",
      isHomeTeam,
      ")"
    );
  }, [router.isReady, router.query.isHomeTeam, isHomeTeam]); // isHomeTeam 의존성 추가

  // // localStorage에서 selectedMatch 읽고 팀 선수 목록(API) 호출
  // useEffect(() => {
  //   if (!router.query.recordId) return;
  //   if (teamTournamentId === null) return; // ← 이것 때문에 undefined로 안 나갑니다.
  //   if (isHomeTeam === undefined) return;

  //   const selectedMatchStr = localStorage.getItem("selectedMatch");
  //   if (!selectedMatchStr) {
  //     console.error("selectedMatch 데이터가 없습니다.");
  //     return;
  //   }

  //   try {
  //     const parsed = JSON.parse(selectedMatchStr);
  //     // 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
  //     const selectedMatch = Array.isArray(parsed) ? parsed[0] : parsed;
  //     if (isHomeTeam) {
  //       // const homeTeamId = snapshotData.snapshot.gameSummary.homeTeam.id;

  //       const homeTeamId = selectedMatch.homeTeam.id;
  //       // setTeamTournamentId(homeTeamId);
  //       console.log(homeTeamId);
  //       if (homeTeamId) {
  //         API.get(
  //           // `/games/${router.query.recordId}/players?teamType=home`,
  //           `/games/${router.query.recordId}/teams/${homeTeamId}/lineup`,

  //           {
  //             // withCredentials: true,
  //           }
  //         )
  //           .then((res) => {
  //             const parsedData =
  //               typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  //             // setTeamPlayersData(parsedData.players);

  //             setTeamPlayersData(parsedData);
  //             console.log("HomeTeam Players (team API):", parsedData);
  //           })
  //           .catch((error) => {
  //             setError(error);
  //             const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
  //             console.error(error, "errorCode:", errorCode);
  //             console.error("Error fetching homeTeam players:", error);
  //           });
  //       }
  //     } else {
  //       // const awayTeamId = snapshotData.snapshot.gameSummary.awayTeam.id;
  //       const awayTeamId = selectedMatch.awayTeam.id;
  //       // setTeamTournamentId(awayTeamId);
  //       if (awayTeamId) {
  //         API.get(
  //           // `/games/${router.query.recordId}/players?teamType=away`,
  //           `/games/${router.query.recordId}/teams/${awayTeamId}/lineup`,

  //           {
  //             // withCredentials: true,
  //           }
  //         )
  //           .then((res) => {
  //             const parsedData =
  //               typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  //             // setTeamPlayersData(parsedData.players);
  //             setTeamPlayersData(parsedData);
  //             console.log("AwayTeam Players (team API):", parsedData);
  //           })
  //           .catch((error) => {
  //             setError(error);
  //             const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
  //             console.error(error, "errorCode:", errorCode);
  //             console.error("Error fetching awayTeam players:", error);
  //           });
  //       }
  //     }
  //   } catch (error) {
  //     setError(error);
  //     const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
  //     console.error(error, "errorCode:", errorCode);
  //     console.error("로컬스토리지 파싱 에러:", error);
  //   }
  // }, [isHomeTeam, teamTournamentId, router.query.recordId]);

  // // 라인업 API 호출 & recoil 업데이트
  // useEffect(() => {
  //   const fetchTeamPlayers = async () => {
  //     const queryValue = router.query.isHomeTeam;
  //     if (!router.query.recordId) return;
  //     if (teamTournamentId === null) return; // ← 이것 때문에 undefined로 안 나갑니다.
  //     if (isHomeTeam === undefined) return;
  //     const teamType = router.query.isHomeTeam === "true" ? "home" : "away";
  //     // const homeTeamId = snapshotData.snapshot.gameSummary.homeTeam.id;
  //     try {
  //       if (queryValue === "true") {
  //         // 홈팀
  //         const res = await API.get(
  //           // `/games/${router.query.recordId}/lineup?teamType=home`
  //           `/games/${router.query.recordId}/teams/${teamTournamentId}/lineup`
  //           // { withCredentials: true }
  //         );
  //         const dataObj =
  //           typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  //         console.log("홈팀 응답 (lineup API):", dataObj);
  //         // ★ 이 부분을 추가 ★
  //         const minimalLineup = {
  //           batters: dataObj.batters.map(({ battingOrder, id, name }: any) => ({
  //             battingOrder,
  //             id,
  //             name,
  //           })),
  //           // 만약 투수 정보도 저장하고 싶으면 아래 주석 해제
  //           pitcher: {
  //             id: dataObj.pitcher.id,
  //             name: dataObj.pitcher.name,
  //           },
  //         };
  //         localStorage.setItem(
  //           `lineup_${teamType}`,
  //           JSON.stringify(minimalLineup)
  //         );
  //         // API의 pitcher row 값을 그대로 사용
  //         let lineupPlayers = [
  //           ...dataObj.batters.map((batter: any) => ({
  //             battingOrder: batter.battingOrder,
  //             name: batter.name,
  //             position: batter.position,
  //             id: batter.id,
  //             selectedViaModal: false,
  //             isWc: batter.isWc ?? false,
  //           })),
  //           {
  //             battingOrder: "P",
  //             name: dataObj.pitcher.name,
  //             position: "P",
  //             id: dataObj.pitcher.id,
  //             selectedViaModal: false,
  //             isWc: dataObj.pitcher.isWc ?? false,
  //           },
  //         ];
  //         // 기존에는 DH가 없으면 P행을 초기화했지만, 이제 API의 pitcher 값을 그대로 유지합니다.
  //         setHomeTeamPlayers(lineupPlayers);
  //         setLineupPlayersData(lineupPlayers);
  //       } else {
  //         // 원정팀
  //         // const awayTeamId = snapshotData.snapshot.gameSummary.awayTeam.id;
  //         const res = await API.get(
  //           // `/games/${router.query.recordId}/lineup?teamType=away`
  //           `/games/${router.query.recordId}/teams/${teamTournamentId}/lineup`
  //           // { withCredentials: true }
  //         );

  //         const dataObj =
  //           typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  //         console.log("원정팀 응답 (lineup API):", dataObj);
  //         const minimalLineup = {
  //           batters: dataObj.batters.map(({ battingOrder, id, name }: any) => ({
  //             battingOrder,
  //             id,
  //             name,
  //           })),
  //           // 만약 투수 정보도 저장하고 싶으면 아래 주석 해제
  //           pitcher: {
  //             id: dataObj.pitcher.id,
  //             name: dataObj.pitcher.name,
  //           },
  //         };
  //         localStorage.setItem(
  //           `lineup_${teamType}`,
  //           JSON.stringify(minimalLineup)
  //         );
  //         let lineupPlayers = [
  //           ...dataObj.batters.map((batter: any) => ({
  //             battingOrder: batter.battingOrder,
  //             name: batter.name,
  //             position: batter.position,
  //             id: batter.id,
  //             selectedViaModal: false,
  //             isWc: batter.isWc ?? false,
  //           })),
  //           {
  //             battingOrder: "P",
  //             name: dataObj.pitcher.name,
  //             position: "P",
  //             id: dataObj.pitcher.id,
  //             selectedViaModal: false,
  //             isWc: dataObj.pitcher.isWc ?? false,
  //           },
  //         ];
  //         // 원정팀도 DH 여부 상관없이 API의 pitcher 값을 그대로 사용합니다.
  //         setAwayTeamPlayers(lineupPlayers);
  //         setLineupPlayersData(lineupPlayers);
  //         console.log("awayTeamPlayers", awayTeamPlayers);
  //       }
  //     } catch (err) {
  //       setError(err);
  //       const errorCode = err?.response?.data?.errorCode; // 에러코드 추출
  //       console.error(err, "errorCode:", errorCode);
  //       console.error("팀 선수 목록 요청 에러:", err);
  //     }
  //   };
  //   fetchTeamPlayers();
  // }, [router, teamTournamentId, isHomeTeam]);

  useEffect(() => {
    if (!router.query.recordId) return;
    if (teamTournamentId === null) return;
    if (isHomeTeam === undefined) return;

    const fetchTeamPlayers = async () => {
      try {
        const res = await API.get(
          `/games/${router.query.recordId}/teams/${teamTournamentId}/lineup`
        );

        const dataObj =
          typeof res.data === "string" ? JSON.parse(res.data) : res.data;

        // 데이터 처리 및 상태 업데이트
        const lineupPlayers = [
          ...dataObj.batters.map((batter: any) => ({
            battingOrder: batter.battingOrder,
            name: batter.name,
            position: batter.position,
            id: batter.id,
            selectedViaModal: false,
            isWc: batter.isWc ?? false,
          })),
          {
            battingOrder: "P",
            name: dataObj.pitcher.name,
            position: "P",
            id: dataObj.pitcher.id,
            selectedViaModal: false,
            isWc: dataObj.pitcher.isWc ?? false,
          },
        ];

        // localStorage 저장
        const teamType = isHomeTeam ? "home" : "away";
        const minimalLineup = {
          batters: dataObj.batters.map(({ battingOrder, id, name }: any) => ({
            battingOrder,
            id,
            name,
          })),
          pitcher: {
            id: dataObj.pitcher.id,
            name: dataObj.pitcher.name,
          },
        };
        localStorage.setItem(
          `lineup_${teamType}`,
          JSON.stringify(minimalLineup)
        );

        // 상태 업데이트
        if (isHomeTeam) {
          setHomeTeamPlayers(lineupPlayers);
        } else {
          setAwayTeamPlayers(lineupPlayers);
        }
        setLineupPlayersData(lineupPlayers);
        setTeamPlayersData(dataObj);
      } catch (error) {
        setError(error);
        console.error("팀 선수 목록 요청 에러:", error);
      }
    };

    fetchTeamPlayers();
  }, [router.query.recordId, teamTournamentId, isHomeTeam]);

  useEffect(() => {
    console.log("Updated homeTeamPlayers:", homeTeamPlayers);
  }, [homeTeamPlayers]);

  useEffect(() => {
    console.log("Updated awayTeamPlayers:", awayTeamPlayers);
  }, [awayTeamPlayers]);

  // 1) lineupPlayersData 기반으로 preObject를 미리 계산
  const preObject = useMemo(() => {
    if (!lineupPlayersData.length) return null;
    return {
      batters: lineupPlayersData
        .filter((p: any) => p.battingOrder !== "P")
        .map((p: any) => ({
          battingOrder: p.battingOrder,
          id: p.id,
          position: p.position,
        })),
      pitcher: {
        id:
          lineupPlayersData.find((p: any) => p.battingOrder === "P")?.id ??
          null,
      },
    };
  }, [lineupPlayersData]);

  // 2) 페이지 접속 시(또는 lineupPlayersData 갱신될 때) 콘솔에 찍기
  useEffect(() => {
    if (preObject) {
      console.log("=== 초기 preObject ===", preObject);
    }
  }, [preObject]);

  // wcMap 계산 (lineupPlayersData & teamPlayersData)

  // 폼 기본값 & players 배열 업데이트
  useEffect(() => {
    if (router.query.isHomeTeam === "true" && homeTeamPlayers.length > 0) {
      const updatedPlayers = players.map((player) => {
        if (player.battingOrder === "P") {
          const pitcherRow = homeTeamPlayers.find(
            (p: any) => p.battingOrder === "P"
          );
          return pitcherRow ? { ...player, ...pitcherRow } : player;
        } else {
          const responsePlayer = homeTeamPlayers.find(
            (p: any) => p.battingOrder === player.battingOrder
          );
          return responsePlayer ? { ...player, ...responsePlayer } : player;
        }
      });
      setPlayers(updatedPlayers);
      updatedPlayers.forEach((player, index) => {
        setValue(`players.${index}.name`, player.name || "");
        setValue(`players.${index}.position`, player.position || "");
        setValue(`players.${index}.id`, player.id);
      });
    } else if (
      router.query.isHomeTeam === "false" &&
      awayTeamPlayers.length > 0
    ) {
      const updatedPlayers = players.map((player) => {
        if (player.battingOrder === "P") {
          const pitcherRow = awayTeamPlayers.find(
            (p: any) => p.battingOrder === "P"
          );
          return pitcherRow ? { ...player, ...pitcherRow } : player;
        } else {
          const responsePlayer = awayTeamPlayers.find(
            (p: any) => p.battingOrder === player.battingOrder
          );
          return responsePlayer ? { ...player, ...responsePlayer } : player;
        }
      });
      setPlayers(updatedPlayers);
      updatedPlayers.forEach((player, index) => {
        setValue(`players.${index}.name`, player.name || "");
        setValue(`players.${index}.position`, player.position || "");
        setValue(`players.${index}.id`, player.id);
      });
    }
  }, [router.query.isHomeTeam, homeTeamPlayers, awayTeamPlayers]);

  // 추가: 배터 WC 개수
  const [batterWcCount, setBatterWcCount] = useState(0);
  // 추가: 투수 WC 개수
  const [pitcherWcCount, setPitcherWcCount] = useState(0);
  // WildCardBox 계산 (콘솔용)
  // WildCardBox 계산 (배터/투수 따로, 중복 없이)
  // useEffect(() => {
  //   // 1) 배터(1~9번) WC 개수
  //   const batterCount = players.filter(
  //     (p) =>
  //       p.battingOrder !== "P" &&
  //       p.name &&
  //       p.id &&
  //       (p.isWc || wcMap[p.id] || customWcMap[p.id])
  //   ).length;

  //   // 2) 투수(P행) WC 개수 (중복 검사 없이)
  //   const pitcherCount = players.filter(
  //     (p) =>
  //       p.battingOrder === "P" &&
  //       p.name &&
  //       p.id &&
  //       (p.isWc || wcMap[p.id] || customWcMap[p.id])
  //   ).length;

  //   console.log("Batter WC count:", batterCount);
  //   console.log("Pitcher WC count:", pitcherCount);

  //   // 상태 업데이트
  //   setBatterWcCount(batterCount);
  //   setPitcherWcCount(pitcherCount);
  //   setWildCardCount(batterCount + pitcherCount);
  // }, [players, wcMap, customWcMap]);

  // 포지션 드롭다운 관련 상태 및 핸들러
  const [openPositionRow, setOpenPositionRow] = useState<number | null>(null);
  const handlePositionClick = (index: number) => {
    setOpenPositionRow(openPositionRow === index ? null : index);
  };

  // ★ handlePositionSelect에서 batter 행(투수 행이 아닌)에서 "P" 선택 시 lastPUpdateIndex 업데이트
  const handlePositionSelect = (index: number, pos: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].position = pos;
    if (updatedPlayers[index].battingOrder !== "P" && pos === "P") {
      setLastPUpdateIndex(index);
    }
    // DH 선택 시 P행 기본값 유지 (API에서 받아온 pitcher 값을 그대로 사용)
    if (pos === "DH" && updatedPlayers[index].battingOrder !== "P") {
      const hasDH = updatedPlayers.some(
        (player) => player.battingOrder !== "P" && player.position === "DH"
      );
      if (!hasDH) {
        const pRowIndex = updatedPlayers.findIndex(
          (p) => p.battingOrder === "P"
        );
        if (pRowIndex !== -1) {
          updatedPlayers[pRowIndex] = {
            battingOrder: "P",
            name: players[pRowIndex].name, // 기존 API에서 받아온 값 유지
            position: "P",
            id: players[pRowIndex].id,
            selectedViaModal: false,
            isWc: players[pRowIndex].isWc,
          };
          setValue(`players.${pRowIndex}.name`, players[pRowIndex].name);
          setValue(`players.${pRowIndex}.position`, "P");
        }
      }
    }
    setPlayers(updatedPlayers);
    setValue(`players.${index}.position`, pos);
    setOpenPositionRow(null);
  };

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayerSelectionModalOpen, setIsPlayerSelectionModalOpen] =
    useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(
    null
  );

  // Recoil 전역 상태
  const [teamName] = useRecoilState(TeamListState);

  // localPlayerList (제안 목록)
  const [localPlayerList, setLocalPlayerList] = useState<IHAPlayer[]>([]);
  useEffect(() => {
    if (router.asPath.includes("homeTeamRegistration")) {
      setLocalPlayerList(homeTeamPlayers);
    } else {
      setLocalPlayerList(awayTeamPlayers);
    }
  }, [router.asPath, homeTeamPlayers, awayTeamPlayers]);

  // ★ 모달에서 선수를 선택했을 때, batter 행(투수 행이 아닌)에서 선택 시 lastPUpdateIndex 업데이트
  const handleSelectPlayer = (selectedPlayer: { name: string; id: number }) => {
    if (selectedPlayerIndex === null) return;
    const updatedPlayers = [...players];
    updatedPlayers[selectedPlayerIndex].name = selectedPlayer.name;
    updatedPlayers[selectedPlayerIndex].id = selectedPlayer.id;
    updatedPlayers[selectedPlayerIndex].selectedViaModal = true;
    console.log("teamPlayersData", teamPlayersData);
    // const matchingPlayer = teamPlayersData.find(
    //   (tp) => tp.id === selectedPlayer.id
    // );
    const matchingPlayer = false;
    if (matchingPlayer) {
      if (matchingPlayer) {
        setCustomWcMap((prev) => ({
          ...prev,
          [selectedPlayer.id]: true,
        }));
      }
      updatedPlayers[selectedPlayerIndex].isWc = matchingPlayer;
    } else {
      updatedPlayers[selectedPlayerIndex].isWc = false;
    }
    if (
      updatedPlayers[selectedPlayerIndex].battingOrder !== "P" &&
      updatedPlayers[selectedPlayerIndex].position === "P"
    ) {
      setLastPUpdateIndex(selectedPlayerIndex);
    }
    setPlayers(updatedPlayers);
    setValue(`players.${selectedPlayerIndex}.name`, selectedPlayer.name);
    setValue(`players.${selectedPlayerIndex}.id`, selectedPlayer.id);
    setIsPlayerSelectionModalOpen(false);
    setSelectedPlayerIndex(null);
  };

  // ★ 입력창 수정 시, batter 행(투수 행이 아닌)에서 입력하면 lastPUpdateIndex 업데이트
  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].selectedViaModal = false;
    updatedPlayers[index].id = undefined;
    setPlayers(updatedPlayers);
    if (
      updatedPlayers[index].battingOrder !== "P" &&
      updatedPlayers[index].position === "P"
    ) {
      setLastPUpdateIndex(index);
    }
  };

  // Hidden inputs
  const renderHiddenPositionInput = (index: number) => {
    return <input type="hidden" {...register(`players.${index}.position`)} />;
  };
  const renderHiddenPlayerIdInput = (index: number) => {
    return <input type="hidden" {...register(`players.${index}.id`)} />;
  };

  const duplicatePositions = useMemo(() => {
    const counts: Record<string, number> = {};
    players
      .filter((p) => p.battingOrder !== "P")
      .forEach((p) => {
        if (p.position) counts[p.position] = (counts[p.position] || 0) + 1;
      });
    return new Set(
      Object.entries(counts)
        .filter(([_, c]) => c > 1)
        .map(([pos]) => pos)
    );
  }, [players]);

  const [isSubReturnModalOpen, setIsSubReturnModalOpen] = useState(false);

  const [snapshotData, setSnapshotData] = useRecoilState(snapshotState);

  // 교체완료 버튼 시
  const onSubmit = async () => {
    // 이미 제출 중이면 무시
    if (isSubmitting) return;
    // 1) form 에서 넘어온 플레이어들
    const currentPlayersFromForm = getValues("players");
    // 2) WC 플래그 갱신
    const updatedCurrentPlayers = currentPlayersFromForm.map((player: any) => {
      const updatedIsWc = false;
      return { ...player, isWc: updatedIsWc };
    });

    // ─── 여기서만 쓰는 임시 wildCardCount 계산 ───

    // 3) 배터(1~9번) WC 개수
    const batterWcCount = updatedCurrentPlayers
      .slice(0, -1) // 마지막 요소 제외
      .filter((p) => p.isWc).length; // WC인 선수만

    console.log("batterWcCount", batterWcCount);

    // 4) 투수(P행) WC 개수
    const pitcherWcCount = updatedCurrentPlayers
      .slice(-1) // 마지막 요소만 남음
      .filter((p) => p.isWc).length; // WC 여부 필터
    console.log("pitcherWcCount", pitcherWcCount);

    // 5) 합산
    const rawTotal = batterWcCount + pitcherWcCount;
    // 6) 배터와 투수 같은 ID 로 중복된 경우 1만 빼기

    // 1) pitcher: 배열의 마지막 요소를 가져오기
    const pitcher = updatedCurrentPlayers[updatedCurrentPlayers.length - 1];

    // 2) 마지막 행을 제외한 나머지에서 중복 검사
    const isDuplicate =
      pitcher &&
      updatedCurrentPlayers
        .slice(0, -1) // 마지막 요소(투수) 제외
        .some((p) => p.id === pitcher.id && p.isWc && pitcher.isWc);

    // 3) 최종 WC 카운트
    const wildCardCount = isDuplicate ? rawTotal - 1 : rawTotal;
    console.log("isDuplicate", isDuplicate);
    console.log("wildCardCount", wildCardCount);

    // 7) 최종 검증 (기존과 동일하게 wildCardCount 사용)
    if (wildCardCount > 3) {
      alert(
        `WC 조건을 만족하는 선수가 3명을 초과합니다. 현재 ${wildCardCount} 명`
      );
      return;
    }
    // ────────────────────────────────────────────────
    const nonPPlayers = updatedCurrentPlayers.slice(0, 9);
    console.log("nonPPlayers", nonPPlayers);
    const ids = nonPPlayers.map((p: any) => p.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      alert(
        "1번~9번 타순에 중복된 선수가 있습니다. 각 타자를 고유한 선수로 선택해주세요."
      );
      return;
    }

    const hasDHInNonP = nonPPlayers.some((p: any) => p.position === "DH");
    const requiredPositions = hasDHInNonP
      ? ["CF", "LF", "RF", "SS", "1B", "2B", "3B", "C", "DH"]
      : ["CF", "LF", "RF", "SS", "1B", "2B", "3B", "C", "P"];
    const assignedPositionsNonP = nonPPlayers
      .slice(0, 9)
      .map((p: any) => p.position);
    console.log("확인할 포지션", assignedPositionsNonP);
    const missingPositions = requiredPositions.filter(
      (pos) => !assignedPositionsNonP.includes(pos)
    );
    if (missingPositions.length > 0) {
      alert(`포지션 설정이 올바르지 않습니다.`);
      return;
    }
    // const pitcherCandidate = updatedCurrentPlayers.find(
    //   (p: any) => p.position === "P"
    // );
    // const batters = updatedCurrentPlayers
    //   .filter((p: any) => p.battingOrder !== "P")
    //   .slice(0, -1)
    //   .map((p: any) => ({
    //     battingOrder: p.battingOrder,
    //     id: p.id,
    //     position: p.position,
    //   }));
    const batters = updatedCurrentPlayers
      // 투수(P) 행은 제외
      .filter((p: any) => p.battingOrder !== "P")
      .slice(0, -1)
      // map의 두 번째 인자 index를 이용해 순서대로 1~9를 부여
      .map((p: any, idx: number) => ({
        battingOrder: idx + 1,
        id: p.id,
        position: p.position,
      }));

    console.log("batters", batters);
    // pitcher: 항상 맨마지막행(index가 9인 선수)
    const pitcherRow = updatedCurrentPlayers[9]; //
    console.log(pitcherRow);

    const dupId = pitcherRow.id;
    if (nonPPlayers.some((p) => p.id === dupId && p.position !== "P")) {
      alert("한 선수가 야수인 동시에 투수일 수 없습니다");
      return;
    }
    const nonPPitchers = nonPPlayers.filter((p) => p.position === "P");
    // 하나라도 있으면 모두 마지막 pitcherRow.id 와 일치해야 함
    if (nonPPitchers.some((p) => p.id !== pitcherRow.id)) {
      alert("투수 이름이 일치하지 않습니다");
      return;
    }

    const formattedObject = {
      batters,
      pitcher: {
        id: pitcherRow?.id,
      },
    };
    console.log("Formatted Object:", JSON.stringify(formattedObject, null, 2));
    console.log("Formatted Object:", formattedObject);

    // ── 둘을 문자열로 비교 ──
    const preJson = JSON.stringify(preObject);
    const postJson = JSON.stringify(formattedObject);

    if (preJson === postJson) {
      setIsSubReturnModalOpen(true);
      return;
    }

    try {
      // 중복 제출 방지 시작
      setIsSubmitting(true);
      const gameId = router.query.recordId;
      // const teamType = isHomeTeam ? "home" : "away";
      if (isHomeTeam) {
        // const homeTeamId = snapshotData.snapshot.gameSummary.homeTeam.id;
        const response = await API.patch(
          `/games/${gameId}/teams/${teamTournamentId}/lineup`,
          formattedObject
        );
        console.log("전송 성공:", response.data);
        setSnapshotData(response.data);
      } else {
        // const awayTeamId = snapshotData.snapshot.gameSummary.homeTeam.id;
        const response = await API.patch(
          `/games/${gameId}/teams/${teamTournamentId}/lineup`,
          formattedObject
        );
        console.log("전송 성공:", response.data);
        setSnapshotData(response.data);
      }

      router.push(`/matches/${gameId}/records`);
    } catch (error) {
      setError(error);
      const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      console.error(error, "errorCode:", errorCode);
      console.error("PATCH 요청 에러:", error);
    } finally {
      // 3) 제출 상태 해제
      setIsSubmitting(false);
    }
  };
  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      setValidationError(msg);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <Container onClick={() => setOpenPositionRow(null)}>
      <LargeTitle>교체할 선수를 선택해주세요</LargeTitle>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <PlayerList style={{ flexGrow: 1 }}>
          {players.map((player, index) => {
            // 입력된 이름
            const currentName = watch(`players.${index}.name`) || "";

            // 실제 표시할 포지션 (API나 상태값에서 가져온 값)
            const actualPosition =
              player.position ||
              (isHomeTeam
                ? homeTeamPlayers[index]?.position
                : awayTeamPlayers[index]?.position) ||
              "";

            // 중복 포지션인지 여부
            const isDup = duplicatePositions.has(actualPosition);

            return (
              <PlayerRow key={`${player.battingOrder}-${index}`}>
                {/* 순번 */}
                <OrderNumber>{player.battingOrder}</OrderNumber>

                {/* 선수 이름 입력 */}
                <NameWrapper
                  onClick={() => {
                    setSelectedPlayerIndex(index);
                    setIsPlayerSelectionModalOpen(true);
                  }}
                  hasValue={!!currentName}
                >
                  <InputWrapper hasValue={!!currentName}>
                    <PlayerNameInput
                      {...register(`players.${index}.name`, {
                        onChange: (e) => handleInputChange(index, e),
                      })}
                      placeholder="선수명 입력"
                      autoComplete="off"
                      readOnly
                    />
                    {currentName && player.id && player.isWc ? (
                      <WildCardBox>WC</WildCardBox>
                    ) : (
                      <div />
                    )}
                  </InputWrapper>
                  <SearchIcon
                    src="/images/magnifier.png"
                    alt="Search Icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerIndex(index);
                      setIsPlayerSelectionModalOpen(true);
                    }}
                  />
                </NameWrapper>

                {/* 포지션 */}
                {player.battingOrder !== "P" ? (
                  <PositionWrapper
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePositionClick(index);
                    }}
                  >
                    <PositionText
                      isPlaceholder={!actualPosition}
                      isDuplicate={isDup} // ← 중복 시 빨간색 처리
                    >
                      {actualPosition ? (
                        <>
                          <ArrowIconNone>▽</ArrowIconNone>
                          <span>{actualPosition}</span>
                          <ArrowIconNone>▽</ArrowIconNone>
                        </>
                      ) : (
                        <>
                          <ArrowIconNone>▽</ArrowIconNone>
                          <span>포지션 입력</span>
                          <ArrowIcon>▽</ArrowIcon>
                        </>
                      )}
                    </PositionText>
                    {renderHiddenPositionInput(index)}
                    {renderHiddenPlayerIdInput(index)}
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
                              e.stopPropagation();
                              handlePositionSelect(index, pos);
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
                    <PitcherPositionText>{"P"}</PitcherPositionText>
                  </PositionWrapper>
                )}
              </PlayerRow>
            );
          })}
        </PlayerList>

        <ButtonWrapper>
          <ControlButton type="submit" disabled={isSubmitting}>
            교체완료
          </ControlButton>
        </ButtonWrapper>
      </form>
      {/* SubReturnModal 렌더링 */}
      {isSubReturnModalOpen && (
        <SubReturnModal setIsOpen={setIsSubReturnModalOpen} />
      )}
      {isModalOpen && <RecordStartModal setIsModalOpen={setIsModalOpen} />}
      {isPlayerSelectionModalOpen && (
        <SubPlayerSelectionModal
          setIsModalOpen={setIsPlayerSelectionModalOpen}
          onSelectPlayer={handleSelectPlayer}
          isPitcher={
            selectedPlayerIndex !== null &&
            players[selectedPlayerIndex].battingOrder === "P"
          }
          selectedPlayerIds={watch("players")
            .filter((_, idx) =>
              players[selectedPlayerIndex!].battingOrder === "P"
                ? idx === 9
                : idx < 9
            )
            .map((p: any) => p.id)
            .filter((id: number) => id != null)}
          rowOrder={players[selectedPlayerIndex!].battingOrder}
        />
      )}
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
      {!isSubmitting && validationError && (
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

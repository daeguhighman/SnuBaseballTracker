// FinalGameRecordPage.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  Container,
  ScoreBoardWrapper,
  InningHeader,
  InningCell,
  TeamScoreCell,
  TeamTitle,
  TableWrapper,
  TableTitle,
  RecordTable,
  ControlButton,
  HomeButton,
  ButtonContainer,
  RecordTableP,
  TeamRow,
  TeamNameCell,
  EditableInput,
  EditableInputScore,
  PageTitle,
  TeamHeaderTitle,
} from "./gameResult.style";
import Link from "next/link";
import { useRouter } from "next/router";
import ResultSubmitModal from "../../modals/submitModal/resultSubmitModal";
import API from "../../../../commons/apis/api";
import ScorePatchModal from "../../modals/scorePatchModal";
import ScoreCorrectionModal from "../../modals/scoreCorrectionModal";
import { authMe, errorGlobal, gameId } from "../../../../commons/stores";
import { useRecoilState } from "recoil";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import { getAccessToken } from "../../../../commons/libraries/getAccessToken";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmaller,
} from "../../modals/modal.style";
import API2 from "../../../../commons/apis/api2";

interface ISelectedCell {
  cellValue: string;
  team: "A" | "B";
  cellIndex: number; // 이닝 인덱스(0-based)
}

// 점수 배열 초기값 (1~7회, R, H)
const defaultTeamAScores = ["", "", "", "", "", "", "", "", ""];
const defaultTeamBScores = ["", "", "", "", "", "", "", "", ""];

export default function FinalGameRecordPage() {
  const inningHeaders = ["", "1", "2", "3", "4", "5", "6", "7", "R", "H"];
  const router = useRouter();

  // IP 값을 이닝 표기법으로 변환하는 함수 추가
  const formatInnings = (ip: number): string => {
    if (!ip || ip === 0) return "0";

    const fullInnings = Math.floor(ip / 3);
    const outs = ip % 3;

    if (outs === 0) {
      return fullInnings.toString();
    } else {
      return `${fullInnings} ${outs}/3`;
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  // ➊ 초기값은 “비어 있음”으로 설정
  const [, setMatchStr] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState<boolean>(false);
  // const [recordId] = useRecoilState(gameId);
  const [authInfo, setAuthInfo] = useRecoilState(authMe);
  // const [recordId, setRecordId] = useState(router.query.recordId);
  // const recordId = router.query.recordId;
  // const [error, setError] = useState(null);
  const [error, setError] = useRecoilState(errorGlobal);
  /* ───────── 클라이언트(브라우저)에서만 실행 ───────── */
  const recordId = router.query.recordId;
  useEffect(() => {
    // localStorage 접근은 반드시 브라우저에서!
    const stored = localStorage.getItem("selectedMatch");
    setMatchStr(stored);

    if (stored) {
      try {
        const status: string | null = JSON.parse(stored).status ?? null;
        setMatchStatus(status);
        setIsFinalized(status === "FINALIZED");
      } catch (error) {
        // 파싱 오류 대비
        setError(error);
        const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
        console.error(error, "errorCode:", errorCode);
        setMatchStatus(null);
        setIsFinalized(false);
      }
    } else {
      // 값이 없을 때
      setMatchStatus(null);
      setIsFinalized(false);
    }
  }, [recordId]); // 필요하다면 router.query 등 의존성 추가

  // useEffect(() => {
  //   if (!router.isReady) return;
  //   (async () => {
  //     try {
  //       const authRes = await API2.get("/auth/me");
  //       setAuthInfo(authRes.data);
  //       console.log("Fetched auth info:", authRes.data);
  //     } catch (err) {
  //       setError(err);
  //       console.error("Failed to fetch auth info:", err);
  //     }
  //   })();
  // }, [router.isReady]);
  // console.log(authInfo);

  // const currentGameId = typeof recordId === "string" ? Number(recordId) : null;

  // console.log(currentGameId);
  // console.log(matchStatus); // 확인용

  // 팀 이름 상태
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  // 점수 상태
  const [teamAScores, setTeamAScores] = useState(defaultTeamAScores);
  const [teamBScores, setTeamBScores] = useState(defaultTeamBScores);

  // 선수 기록 상태
  const [awayBatters, setAwayBatters] = useState<any[]>([]);
  const [homeBatters, setHomeBatters] = useState<any[]>([]);
  const [awayPitchers, setAwayPitchers] = useState<any[]>([]);
  const [homePitchers, setHomePitchers] = useState<any[]>([]);

  // 제출 모달
  const [isResultSubmitModalOpen, setIsResultSubmitModalOpen] = useState(false);

  // ScorePatchModal 열림 여부 + 데이터
  const [isScorePatchModalOpen, setIsScorePatchModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<ISelectedCell | null>(null);

  // (A) 모달이 열리는 이유(모드)
  const [modalMode, setModalMode] = useState<"score" | "batter" | "pitcher">(
    "score"
  );
  // (B) 모달에서 띄울 알림 메시지 (타자/투수)
  const [alertMessage, setAlertMessage] = useState<string>("");

  // 점수·안타 정정 대상 칸
  const [correction, setCorrection] = useState<{
    team: "A" | "B";
    idx: number;
    value: number;
  } | null>(null);

  // 마지막 이닝 정보 보관(ref)
  const lastEntryRef = useRef<{ inning: number; inningHalf: string } | null>(
    null
  );
  // scoreboard DOM 컨테이너 ref
  const scoreboardRef = useRef<HTMLDivElement>(null);

  // canRecord 상태 추가
  const [canRecord, setCanRecord] = useState<boolean>(false);
  const fetchResults = useCallback(async () => {
    if (!recordId) return;
    try {
      const { data } = await API.get(`/games/${recordId}/result`);
      const {
        canRecord: apiCanRecord,
        scoreboard,
        teamSummary,
        batterStats,
        pitcherStats,
      } = data;
      // canRecord 상태 설정
      setCanRecord(apiCanRecord);
      // 🎯 새로운 scoreboard 구조 처리
      const newA = Array(9).fill("");
      const newB = Array(9).fill("");

      // 1~7이닝 점수 처리
      if (scoreboard?.innings) {
        scoreboard.innings.forEach((inning: any) => {
          const idx = inning.inning - 1; // 0-based index
          if (idx >= 0 && idx < 7) {
            newA[idx] = String(inning.away ?? "");
            newB[idx] = String(inning.home ?? "");
          }

          console.log(
            `이닝 ${inning.inning}: home=${
              inning.home
            }, home type=${typeof inning.home}, home === null: ${
              inning.home === null
            }`
          );
        });
      }

      // R, H 컬럼 처리 (scoreboard.totals 사용)
      if (teamSummary) {
        newA[7] = String(teamSummary.away?.runs ?? "");
        newA[8] = String(teamSummary.away?.hits ?? "");
        newB[7] = String(teamSummary.home?.runs ?? "");
        newB[8] = String(teamSummary.home?.hits ?? "");
      }

      // 마지막 이닝 정보 저장 (기존 로직 유지)
      const lastInning = scoreboard?.innings?.[scoreboard.innings.length - 1];
      if (lastInning) {
        lastEntryRef.current = {
          inning: lastInning.inning,
          inningHalf: lastInning.away > lastInning.home ? "TOP" : "BOT",
        };
      }

      setTeamAScores(newA);
      setTeamBScores(newB);

      // 팀 이름 설정 (teamSummary 사용)
      setTeamAName(teamSummary?.away?.name ?? "");
      setTeamBName(teamSummary?.home?.name ?? "");

      // 선수 기록 설정
      setAwayBatters(batterStats?.away ?? []);
      setHomeBatters(batterStats?.home ?? []);
      setAwayPitchers(pitcherStats?.away ?? []);
      setHomePitchers(pitcherStats?.home ?? []);

      console.log("결과요청됨");
      console.log(data);
    } catch (e) {
      console.error("results GET 실패:", e);
      setError(e);
    }
  }, [recordId]);

  // console.log(awayPitchers);
  // Mount: load initial results
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Manual DOM fallback if needed
  // useLayoutEffect(() => {
  //   const entry = lastEntryRef.current;
  //   const root = scoreboardRef.current;
  //   if (!entry || entry.inningHalf !== "TOP" || !root) return;
  //   const rows = root.querySelectorAll<HTMLElement>(".team-row");
  //   const idx = entry.inning - 1;
  //   if (rows.length > 1) {
  //     const botCells = rows[1].querySelectorAll<HTMLElement>(".score-cell");
  //     if (botCells[idx]) botCells[idx].textContent = "-";
  //   }
  // }, [teamAScores, teamBScores]);

  // 제출 버튼
  const handleSubmitClick = () => {
    setIsResultSubmitModalOpen(true);
  };

  // (1) 스코어보드 셀 클릭 → 모달 열기 (mode="score")
  // const handleScoreCellClick = (
  //   score: string,
  //   team: "A" | "B",
  //   idx: number
  // ) => {
  //   if (!score || score === "-" || idx === 7 || idx === 8) return;
  //   setSelectedCell({ cellValue: score, team, cellIndex: idx });
  //   setModalMode("score");
  //   setAlertMessage("");
  //   setIsScorePatchModalOpen(true);
  // };
  const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

  // 이닝 점수(0~6)·안타(8) 칸만 정정할 수 있다. 득점(R)은 이닝 점수의 합이다
  const isCorrectableCell = (score: string, idx: number) =>
    canRecord && score !== "" && score !== "-" && (idx < 7 || idx === 8);

  const saveCorrection = async (value: number) => {
    if (!correction) return;
    const { team, idx } = correction;
    if (idx === 8) {
      await API.patch(`/games/${recordId}/result/hits`, {
        team: team === "A" ? "away" : "home",
        hits: value,
      });
    } else {
      await API.patch(`/games/${recordId}/result/innings`, {
        inning: idx + 1,
        inningHalf: team === "A" ? "TOP" : "BOT",
        runs: value,
      });
    }
    setCorrection(null);
    await fetchResults();
  };

  // (2) 타자 칸 클릭 → 모달 열기 (mode="batter")
  const handleBatterClick = (player: any) => {
    if (!canRecord) return;
    setSelectedStatId(player.id);
    const msg =
      `id: ${player.id}\n` +
      `플레이어: ${player.name}\n` +
      `타석: ${player.PA}\n` +
      `타수: ${player.AB}\n` +
      `안타: ${player["H"]}\n` +
      `2루타: ${player["2B"]}\n` +
      `3루타: ${player["3B"]}\n` +
      `홈런: ${player["HR"]}\n` +
      `득점: ${player["R"]}\n` +
      `볼넷: ${player.BB}\n` +
      `삼진: ${player["SO"]}\n` +
      `희플: ${player["SH"]}\n` +
      `희번: ${player["SF"]}`;
    setAlertMessage(msg);
    setModalMode("batter");
    setSelectedCell({ cellValue: "", team: "A", cellIndex: 0 });
    setIsScorePatchModalOpen(true);
  };

  // (3) 투수 칸 클릭 → 모달 열기 (mode="pitcher")
  const handlePitcherClick = (pitcher: any) => {
    if (!canRecord) return;
    setSelectedStatId(pitcher.id);
    const msg =
      `id: ${pitcher.id}\n` +
      `플레이어: ${pitcher.name}\n` +
      `아웃: ${pitcher.IP}\n` +
      `실점: ${pitcher.R}\n` +
      // `자책: ${pitcher.ER}\n` +
      `삼진: ${pitcher.K}\n` +
      `볼넷: ${pitcher.BB}`;
    setAlertMessage(msg);
    setModalMode("pitcher");
    setSelectedCell({ cellValue: "", team: "A", cellIndex: 0 });
    setIsScorePatchModalOpen(true);
  };

  // 타자 표에서 "battingOrder" 표시 로직
  const getDisplayOrder = (
    currentIndex: number,
    batters: any[]
  ): string | number => {
    const currentOrder = batters[currentIndex].battingOrder;
    // 해당 order가 배열에 몇 번 등장하는지 확인
    const occurrences = batters.filter(
      (b) => b.battingOrder === currentOrder
    ).length;
    if (occurrences <= 1) {
      // 중복이 아니면 그냥 숫자 반환
      return currentOrder;
    }
    // 중복이면, 첫 등장 위치를 구해서
    const firstIndex = batters.findIndex(
      (b) => b.battingOrder === currentOrder
    );
    // 현재 인덱스가 첫 번째면 숫자, 아니면 화살표
    return currentIndex === firstIndex ? currentOrder : "↑";
  };

  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // useEffect(() => {
  //   const token = getAccessToken();
  //   setIsAuthenticated(!!token); // accessToken이 있으면 true
  // }, []);

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
    <Container>
      {/* 페이지 타이틀 */}
      <PageTitle>GAME RESULT</PageTitle>

      {/* 스코어보드 */}
      <ScoreBoardWrapper ref={scoreboardRef}>
        <InningHeader>
          {inningHeaders.map((inn, idx) => (
            <InningCell key={idx}>{inn}</InningCell>
          ))}
        </InningHeader>

        {/* 팀 A (원정) - away 팀 */}
        <TeamRow className="team-row">
          <TeamNameCell>{teamAName.slice(0, 3)}</TeamNameCell>
          {teamAScores.map((score, idx) => (
            <TeamScoreCell
              key={idx}
              className="score-cell"
              onClick={
                isCorrectableCell(score, idx)
                  ? () =>
                      setCorrection({ team: "A", idx, value: Number(score) })
                  : undefined
              }
              style={{
                cursor: isCorrectableCell(score, idx) ? "pointer" : undefined,
              }}
            >
              <EditableInputScore
                type={score === "-" ? "text" : "number"}
                value={score}
                readOnly
              />
            </TeamScoreCell>
          ))}
        </TeamRow>

        {/* 팀 B (홈) - home 팀 */}
        <TeamRow className="team-row">
          <TeamNameCell>{teamBName.slice(0, 3)}</TeamNameCell>
          {teamBScores.map((score, idx) => (
            <TeamScoreCell
              key={idx}
              className="score-cell"
              onClick={
                isCorrectableCell(score, idx)
                  ? () =>
                      setCorrection({ team: "B", idx, value: Number(score) })
                  : undefined
              }
              style={{
                cursor: isCorrectableCell(score, idx) ? "pointer" : undefined,
              }}
            >
              <EditableInputScore
                type={score === "-" ? "text" : "number"}
                value={score}
                readOnly
              />
            </TeamScoreCell>
          ))}
        </TeamRow>
      </ScoreBoardWrapper>

      {/* 원정팀 타자 기록 */}
      <TeamTitle>{teamAName}</TeamTitle>
      <TableWrapper>
        <RecordTable>
          <thead>
            <tr>
              <th>타자</th>
              <th>이름</th>
              <th>타석</th>
              <th>타수</th>
              <th>안타</th>
              <th>2루타</th>
              <th>3루타</th>
              <th>홈런</th>
              <th>득점</th>
              <th>볼넷</th>
              <th>삼진</th>
              <th>희플</th>
              <th>희번</th>
            </tr>
          </thead>
          <tbody>
            {awayBatters.map((player, idx) => (
              <tr key={player.id || idx}>
                <td>{getDisplayOrder(idx, awayBatters)}</td>
                <td>{player.name}</td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.PA || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.AB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.H || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player["2B"] || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player["3B"] || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.HR || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.R || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>

                <td>
                  <EditableInput
                    type="number"
                    value={player.BB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SO || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SH || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SF || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </RecordTable>
      </TableWrapper>

      {/* 원정팀 투수 기록 */}
      <TableWrapper>
        <RecordTableP>
          <thead>
            <tr>
              <th>투수</th>
              <th>이름</th>
              <th>이닝</th>
              <th>실점</th>
              <th>삼진</th>
              <th>볼넷</th>
            </tr>
          </thead>
          <tbody>
            {awayPitchers.map((pitcher, idx) => (
              <tr key={pitcher.id || idx}>
                <td>{idx === 0 ? "" : "↑"}</td>
                <td>{pitcher.name}</td>
                <td>
                  <EditableInput
                    type="text"
                    value={formatInnings(pitcher.IP || 0)}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.R || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.K || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.BB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </RecordTableP>
      </TableWrapper>

      {/* 홈팀 타자 기록 */}
      <TeamTitle>{teamBName}</TeamTitle>
      <TableWrapper>
        <RecordTable>
          <thead>
            <tr>
              <th>타자</th>
              <th>이름</th>
              <th>타석</th>
              <th>타수</th>
              <th>안타</th>
              <th>2루타</th>
              <th>3루타</th>
              <th>홈런</th>
              <th>득점</th>
              <th>볼넷</th>
              <th>삼진</th>
              <th>희플</th>
              <th>희번</th>
            </tr>
          </thead>
          <tbody>
            {homeBatters.map((player, idx) => (
              <tr key={player.id || idx}>
                <td>{getDisplayOrder(idx, homeBatters)}</td>
                <td>{player.name}</td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.PA || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.AB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.H || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>

                <td>
                  <EditableInput
                    type="number"
                    value={player["2B"] || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player["3B"] || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.HR || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.R || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>

                <td>
                  <EditableInput
                    type="number"
                    value={player.BB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SO || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SH || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={player.SF || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handleBatterClick(player)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </RecordTable>
      </TableWrapper>

      {/* 홈팀 투수 기록 */}
      <TableWrapper>
        <RecordTableP>
          <thead>
            <tr>
              <th>투수</th>
              <th>이름</th>
              <th>이닝</th>
              <th>실점</th>
              <th>삼진</th>
              <th>볼넷</th>
            </tr>
          </thead>
          <tbody>
            {homePitchers.map((pitcher, idx) => (
              <tr key={pitcher.id || idx}>
                <td>{idx === 0 ? "" : "↑"}</td>
                <td>{pitcher.name}</td>
                <td>
                  <EditableInput
                    type="text"
                    value={formatInnings(pitcher.IP || 0)}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.R || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.K || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
                <td>
                  <EditableInput
                    type="number"
                    value={pitcher.BB || 0}
                    readOnly
                    onClick={
                      !canRecord ? undefined : () => handlePitcherClick(pitcher)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </RecordTableP>
      </TableWrapper>

      {/* 하단 버튼 */}
      <ButtonContainer>
        <Link href="/" passHref>
          <a>
            <HomeButton>홈으로</HomeButton>
          </a>
        </Link>
        {matchStatus !== "FINALIZED" &&
          // && isAuthenticated
          authInfo.role === "UMPIRE" &&
          // && currentGameId !== null
          authInfo.gameIds.includes(Number(router.query.recordId)) && (
            <ControlButton onClick={handleSubmitClick}>제출하기</ControlButton>
          )}
      </ButtonContainer>

      {authInfo.role === "UMPIRE" &&
        // && currentGameId !== null
        authInfo.gameIds.includes(Number(router.query.recordId)) &&
        isResultSubmitModalOpen && (
          <ResultSubmitModal
            setIsResultSubmitModalOpen={setIsResultSubmitModalOpen}
          />
        )}

      {/* {authInfo.role === "UMPIRE" &&
        // && currentGameId !== null
        authInfo.gameIds.includes(Number(router.query.recordId)) &&
        isScorePatchModalOpen &&
        selectedCell && (
          <ScorePatchModal
            setIsModalOpen={setIsScorePatchModalOpen}
            cellValue={selectedCell.cellValue}
            team={selectedCell.team}
            cellIndex={selectedCell.cellIndex}
            mode={modalMode}
            statId={selectedStatId}
            alertMessage={alertMessage}
            onSuccess={fetchResults}
            // setError={setError}
            // isSubmitting={isSubmitting}
            // setIsSubmitting={setIsSubmitting}
          />
        )} */}

      {/* // 권한 제공 이후 모달 오픈 여부 바꾸기 */}

      {correction && (
        <ScoreCorrectionModal
          title={`${correction.team === "A" ? teamAName : teamBName} ${
            correction.idx === 8
              ? "안타"
              : `${correction.idx + 1}회${correction.team === "A" ? "초" : "말"} 점수`
          }`}
          notice={
            correction.idx === 8
              ? undefined
              : "총점과 승패, 순위표가 함께 바뀝니다."
          }
          initialValue={correction.value}
          onSave={saveCorrection}
          onClose={() => setCorrection(null)}
        />
      )}

      {isScorePatchModalOpen && selectedCell && (
        <ScorePatchModal
          setIsModalOpen={setIsScorePatchModalOpen}
          cellValue={selectedCell.cellValue}
          team={selectedCell.team}
          cellIndex={selectedCell.cellIndex}
          mode={modalMode}
          statId={selectedStatId}
          alertMessage={alertMessage}
          onSuccess={fetchResults}
          // setError={setError}
          // isSubmitting={isSubmitting}
          // setIsSubmitting={setIsSubmitting}
        />
      )}
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert
        error={error}
        onClose={() => {
          setError(null); // ErrorAlert 언마운트
        }}
      />
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

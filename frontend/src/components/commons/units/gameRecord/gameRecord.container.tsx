// src/components/pages/GameRecordPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";
import {
  GameRecordContainer,
  InningHeader,
  InningCell,
  TeamRow,
  TeamNameCell,
  TeamScoreCell,
  ControlButtonsRow,
  ControlButtonsWrapper,
  ControlButton,
  InningScoreContainer,
  InningScoreTitle,
  InningScoreControls,
  ScoreButton,
  ScoreDisplay,
  PlayersRow,
  PlayerBox,
  PlayerChangeButton,
  OrderBadge,
  PlayerWrapper,
  PlayerPosition,
  PlayerInfo,
  PlayerExWrapper,
  EliteBox,
  WildCardBox,
  WildCardBoxNone,
  RecordActionsRow,
  RecordActionButton,
  ScoreBoardWrapper,
} from "./gameRecord.style";
import HitModal from "../../modals/recordModal/hitModal";
import OutModal from "../../modals/recordModal/outModal";
import EtcModal from "../../modals/recordModal/etcModal";
import DefenseChangeModal from "../../modals/defenseChange";
import GameOverModal from "../../modals/gameOverModal";
import ScorePatchModal from "../../modals/scorePatchModal";
import {
  awayBatterNumberState,
  homeBatterNumberState,
  substitutionSwappedState,
} from "../../../../commons/stores";
import { useRecoilState } from "recoil";
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

export default function GameRecordPage() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const recordId = router.query.recordId;

  // 이닝 헤더 (1~7, R, H)
  const inningHeaders = ["", "1", "2", "3", "4", "5", "6", "7", "R", "H"];

  // 팀 이름
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  // 이닝별 점수 (9칸: 7이닝 + R, H)
  const [teamAScores, setTeamAScores] = useState(Array(9).fill(""));
  const [teamBScores, setTeamBScores] = useState(Array(9).fill(""));

  // 이번 이닝 득점
  const [thisInningScore, setThisInningScore] = useState(0);

  // 현재 타자/투수
  const [batter, setBatter] = useState({
    battingOrder: 0,
    playerId: 0,
    playerName: "-",
    isElite: false,
    isWc: false,
    position: "-",
  });
  const [pitcher, setPitcher] = useState({
    battingOrder: 0,
    playerId: 0,
    playerName: "-",
    isElite: false,
    isWc: false,
    position: "P",
  });
  const [batterPlayerId, setBatterPlayerId] = useState(0);

  // Recoil 상태들
  const [homeBatterNumber, setHomeBatterNumber] = useRecoilState(
    homeBatterNumberState
  );
  const [awayBatterNumber, setAwayBatterNumber] = useRecoilState(
    awayBatterNumberState
  );
  const [isSubstitutionSwapped, setIsSubstitutionSwapped] = useRecoilState(
    substitutionSwappedState
  );

  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // attack 쿼리 동기화를 위한 state
  const [attackVal, setAttackVal] = useState("");

  // ── 1) 이닝 점수 GET ──
  const fetchInningScores = useCallback(async () => {
    if (!recordId) return;
    try {
      const res = await API.get(`/games/${recordId}/scores`, {
        // withCredentials: true,
      });

      const response = res.data;
      console.log("스코어보드 응답도착");
      const newA = Array(9).fill("");
      const newB = Array(9).fill("");

      if (Array.isArray(response.scoreboard)) {
        response.scoreboard.forEach((entry) => {
          const idx = entry.inning - 1;
          if (idx >= 0 && idx < 7) {
            if (entry.inningHalf === "TOP") newA[idx] = entry.runs;
            else newB[idx] = entry.runs;
          }
        });
      }

      // R, H 컬럼
      newA[7] = response.teamSummary.away.runs;
      newA[8] = response.teamSummary.away.hits;
      newB[7] = response.teamSummary.home.runs;
      newB[8] = response.teamSummary.home.hits;

      setTeamAScores(newA);
      setTeamBScores(newB);

      // attackVal 계산
      let newAttack = "away";
      if (Array.isArray(response.scoreboard) && response.scoreboard.length) {
        const last = response.scoreboard[response.scoreboard.length - 1];
        newAttack = last.inningHalf === "TOP" ? "home" : "away";
      }
      setAttackVal(newAttack);
      return newAttack;
    } catch (err) {
      console.error("이닝 점수 로드 실패:", err);
      setError(err);
    }
  }, [router.query.recordId, attackVal]);

  // ── 2) 현재 타자 GET ──
  const fetchBatter = useCallback(
    async (newAttakVal) => {
      if (!recordId || !attackVal) return;
      try {
        const teamType = newAttakVal === "home" ? "home" : "away";
        console.log("useEffect내부 팀타입", teamType);
        const res = await API.get(
          `/games/${recordId}/current-batter?teamType=${teamType}`
          // { withCredentials: true }
        );
        setBatter(res.data);

        setBatterPlayerId(res.data.playerId);
        console.log("타자 응답도착");
      } catch (err) {
        console.error("타자 로드 실패:", err);
        setError(err);
      }
    },
    [recordId, attackVal]
  );

  // ── 3) 현재 투수 GET ──
  const fetchPitcher = useCallback(
    async (newAttack) => {
      if (!recordId || !attackVal) return;
      try {
        const teamType = newAttack === "home" ? "away" : "home";
        const res = await API.get(
          `/games/${recordId}/current-pitcher?teamType=${teamType}`
          // { withCredentials: true }
        );
        setPitcher(res.data);

        console.log("투수 응답도착");
      } catch (err) {
        console.error("투수 로드 실패:", err);
        setError(err);
      }
    },
    [recordId, attackVal]
  );

  // ── 마운트 및 의존성 변경 시 호출 ──
  useEffect(() => {
    // 팀 이름 로컬스토리지에서
    const matchStr = localStorage.getItem("selectedMatch");
    if (matchStr) {
      try {
        const { awayTeam, homeTeam } = JSON.parse(matchStr);
        setTeamAName(awayTeam.name);
        setTeamBName(homeTeam.name);
      } catch {
        console.error("selectedMatch 파싱 실패");
      }
    }
    fetchInningScores();
  }, [fetchInningScores]);

  useEffect(() => {
    fetchBatter(attackVal);
  }, [fetchBatter]);
  useEffect(() => {
    fetchPitcher(attackVal);
  }, [fetchPitcher]);

  // ── 4) attack 쿼리 실제 동기화 ──
  useEffect(() => {
    if (!recordId) return;
    if (router.query.attack !== attackVal) {
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, attack: attackVal },
      });
    }
  }, [recordId, attackVal, router.query.attack, router]);

  // ── 점수 조정 ──
  const handleScoreIncrement = () => setThisInningScore((p) => p + 1);
  const handleScoreDecrement = () =>
    setThisInningScore((p) => (p > 0 ? p - 1 : 0));
  console.log("thisInningScore", thisInningScore);
  // ── 기록 액션 ──
  const handleRecordAction = async (action: string) => {
    if (isSubmitting) return;

    switch (action) {
      case "안타":
        setIsHitModalOpen(true);
        break;

      case "볼넷/사구":
        setIsSubmitting(true);
        try {
          // 1) POST 요청
          await API.post(
            `/games/${recordId}/plate-appearance`,
            {
              result: "BB",
            }
            // { withCredentials: true }
          );

          // 3) GET 요청들만 다시 실행
          const newAttack = await fetchInningScores();
          await fetchBatter(newAttack);
          await fetchPitcher(newAttack);
          // 2) Alert 표시 (확인 클릭 후 다음 로직 실행)
          // alert("볼넷/사구 기록 전송 완료");
        } catch (e) {
          console.error("볼넷/사구 오류:", e);
          setError(e);
          // alert("볼넷/사구 오류");
        } finally {
          setIsSubmitting(false);
        }
        break;

      case "아웃":
        setIsOutModalOpen(true);
        break;

      case "etc":
        setIsEtcModalOpen(true);
        break;

      default:
        break;
    }
  };

  // ── 교체/공수교대/경기종료 ──
  const handleSubstitution = (isHome) => {
    router.push({
      pathname: `/matches/${recordId}/substitution`,
      query: { isHomeTeam: isHome },
    });
  };
  // ① POST + alert 후에 resolve 되는 async 함수로 변경
  // → 여기에 모든 “공수교대” 로직을 몰아서 처리
  const handleDefenseChange = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 1) POST
      await API.post(`/games/${recordId}/scores`, { runs: thisInningScore }),
        // { withCredentials: true };
        // 2) 사용자 알림 (확인 클릭 후 다음 단계)
        console.log({ runs: thisInningScore });

      // 3) 로컬 state 리셋
      setIsSubstitutionSwapped((prev) => !prev);
      setThisInningScore(0);
      // 4) GET 리패치
      // alert("공수교대 완료");
      const newAttack = await fetchInningScores();
      await fetchBatter(newAttack);
      await fetchPitcher(newAttack);
    } catch (error) {
      console.error("교대 오류:", error);
      setError(error);
      // alert("교대 오류");
    } finally {
      setIsSubmitting(false);
      setIsChangeModalOpen(false);
    }
  }, [
    recordId,
    thisInningScore,
    isSubmitting,
    fetchInningScores,
    fetchBatter,
    fetchPitcher,
    setIsSubstitutionSwapped,
  ]);

  // ── 모달 상태 ──
  const [isHitModalOpen, setIsHitModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const [isEtcModalOpen, setIsEtcModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isGameEndModalOpen, setIsGameEndModalOpen] = useState(false);
  const [isScorePatchModalOpen, setIsScorePatchModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const handleScoreCellClick = (score, team, idx) => {
    if (score === "" || idx >= 7) return;
    setSelectedCell({ score: String(score), team, index: idx });
    setIsScorePatchModalOpen(true);
  };
  // 에러 상태
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

  const isHomeAttack = router.query.attack === "home";
  console.log("isHomeAttack", isHomeAttack);

  return (
    <GameRecordContainer>
      <ScoreBoardWrapper>
        <InningHeader>
          {inningHeaders.map((inn, i) => (
            <InningCell key={i}>{inn}</InningCell>
          ))}
        </InningHeader>

        {/* Team A */}
        <TeamRow>
          <TeamNameCell>{teamAName.slice(0, 3)}</TeamNameCell>
          {teamAScores.map((s, i) => (
            <TeamScoreCell
              key={i}
              onClick={() => handleScoreCellClick(s, "A", i)}
            >
              {s}
            </TeamScoreCell>
          ))}
        </TeamRow>

        {/* Team B */}
        <TeamRow>
          <TeamNameCell>{teamBName.slice(0, 3)}</TeamNameCell>
          {teamBScores.map((s, i) => (
            <TeamScoreCell
              key={i}
              onClick={() => handleScoreCellClick(s, "B", i)}
            >
              {s}
            </TeamScoreCell>
          ))}
        </TeamRow>
      </ScoreBoardWrapper>

      <ControlButtonsRow>
        <ControlButtonsWrapper>
          <ControlButton
            onClick={() => setIsChangeModalOpen(true)}
            disabled={isSubmitting}
          >
            공수교대
          </ControlButton>
          <ControlButton onClick={() => setIsGameEndModalOpen(true)}>
            경기종료
          </ControlButton>
        </ControlButtonsWrapper>
      </ControlButtonsRow>

      <InningScoreContainer>
        <InningScoreTitle>이번 이닝 득점</InningScoreTitle>
        <InningScoreControls>
          <ScoreButton onClick={handleScoreDecrement}>-</ScoreButton>
          <ScoreDisplay>{thisInningScore}</ScoreDisplay>
          <ScoreButton onClick={handleScoreIncrement}>+</ScoreButton>
        </InningScoreControls>
      </InningScoreContainer>

      <PlayersRow>
        <PlayerBox>
          <PlayerChangeButton onClick={() => handleSubstitution(isHomeAttack)}>
            선수교체
          </PlayerChangeButton>
          <OrderBadge>{batter.battingOrder}번</OrderBadge>
          <PlayerWrapper>
            <PlayerPosition>{batter.position}</PlayerPosition>
            <PlayerInfo>{batter.playerName}</PlayerInfo>
            <PlayerExWrapper
              count={(batter.isElite ? 1 : 0) + (batter.isWc ? 1 : 0)}
            >
              {batter.isElite && <EliteBox>선출</EliteBox>}
              {batter.isWc && <WildCardBox>WC</WildCardBox>}
              {!batter.isElite && !batter.isWc && <WildCardBoxNone />}
            </PlayerExWrapper>
          </PlayerWrapper>
        </PlayerBox>
        <PlayerBox>
          <PlayerChangeButton onClick={() => handleSubstitution(!isHomeAttack)}>
            선수교체
          </PlayerChangeButton>
          <PlayerWrapper>
            <PlayerPosition>P</PlayerPosition>
            <PlayerInfo>{pitcher.playerName}</PlayerInfo>
            <PlayerExWrapper
              count={(pitcher.isElite ? 1 : 0) + (pitcher.isWc ? 1 : 0)}
            >
              {pitcher.isElite && <EliteBox>선출</EliteBox>}
              {pitcher.isWc && <WildCardBox>WC</WildCardBox>}
              {!pitcher.isElite && !pitcher.isWc && <WildCardBoxNone />}
            </PlayerExWrapper>
          </PlayerWrapper>
        </PlayerBox>
      </PlayersRow>

      <RecordActionsRow>
        <RecordActionButton onClick={() => handleRecordAction("안타")}>
          안타
        </RecordActionButton>
        <RecordActionButton
          onClick={() => handleRecordAction("볼넷/사구")}
          disabled={isSubmitting}
        >
          볼넷/사구
        </RecordActionButton>
        <RecordActionButton onClick={() => handleRecordAction("아웃")}>
          아웃
        </RecordActionButton>
        <RecordActionButton onClick={() => handleRecordAction("etc")}>
          etc
        </RecordActionButton>
      </RecordActionsRow>

      {isHitModalOpen && (
        <HitModal
          setIsHitModalOpen={setIsHitModalOpen}
          playerId={batterPlayerId}
          onSuccess={async () => {
            const newAttack = await fetchInningScores();
            await fetchBatter(newAttack);
            await fetchPitcher(newAttack);
          }}
        />
      )}
      {isOutModalOpen && (
        <OutModal
          setIsOutModalOpen={setIsOutModalOpen}
          playerId={batterPlayerId}
          onSuccess={async () => {
            const newAttack = await fetchInningScores();
            await fetchBatter(newAttack);
            await fetchPitcher(newAttack);
          }}
        />
      )}
      {isEtcModalOpen && (
        <EtcModal
          setIsEtcModalOpen={setIsEtcModalOpen}
          playerId={batterPlayerId}
          onSuccess={async () => {
            const newAttack = await fetchInningScores();
            await fetchBatter(newAttack);
            await fetchPitcher(newAttack);
          }}
        />
      )}
      {isChangeModalOpen && (
        <DefenseChangeModal
          setIsChangeModalOpen={setIsChangeModalOpen}
          onSuccess={handleDefenseChange}
        />
      )}

      {isGameEndModalOpen && (
        <GameOverModal
          inningScore={thisInningScore}
          setIsGameEndModalOpen={setIsGameEndModalOpen}
        />
      )}
      {/* {isScorePatchModalOpen && selectedCell && (
        <ScorePatchModal
          setIsModalOpen={setIsScorePatchModalOpen}
          cellValue={selectedCell.score}
          team={selectedCell.team}
          cellIndex={selectedCell.index}
          onSuccess={async () => {
            await fetchInningScores();
            await fetchBatter();
            await fetchPitcher();
          }}
        />
      )} */}

      {isScorePatchModalOpen && selectedCell && (
        <ScorePatchModal
          setIsModalOpen={setIsScorePatchModalOpen}
          cellValue={selectedCell.score}
          team={selectedCell.team}
          cellIndex={selectedCell.index}
          onSuccess={async () => {
            // setIsSubmitting(true);
            try {
              const newAttack = await fetchInningScores();
              await fetchBatter(newAttack);
              await fetchPitcher(newAttack);
            } finally {
              // setIsSubmitting(false);
            }
          }}
        />
      )}
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
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </GameRecordContainer>
  );
}

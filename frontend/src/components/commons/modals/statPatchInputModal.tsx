// src/components/modals/statPatchInputModal.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  LongModalContainer,
  ModalButton,
  ModalCancleButton,
  ModalOverlay,
  ModalTitleSmall,
  StatPatchInput,
} from "./modal.style";
import API from "../../../commons/apis/api";
import { useModalBack } from "../../../commons/hooks/useModalBack";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../commons/libraries/showErrorCode";
import { useRecoilState } from "recoil";
import { errorGlobal } from "../../../commons/stores";

/* ──────────────────────────────────────────
   props
   ────────────────────────────────────────── */
interface IStatPatchInputModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode: "score" | "batter" | "pitcher"; // 어떤 스탯인지
  alertMessage: string; // FinalGameRecordPage 에서 넘어온 msg
  onSuccess?: () => Promise<void>;
}

type StatFields = Record<string, string | number>;

export default function StatPatchInputModal({
  setIsModalOpen,
  mode,
  alertMessage,
  onSuccess,
}: // setError
IStatPatchInputModalProps) {
  // useModalBack(() => setIsModalOpen(false));
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [error, setError] = useState(null);
  const [error, setError] = useRecoilState(errorGlobal);
  /* msg(문자열) → 객체로 변환 */
  const parseMessage = (msg: string): StatFields => {
    const obj: StatFields = {};
    msg.split("\n").forEach((line) => {
      if (!line.trim()) return;
      const [rawKey, ...rest] = line.split(":");
      const key = rawKey.trim();
      const value = rest.join(":").trim();
      obj[key] = isNaN(Number(value)) ? value : Number(value);
    });
    return obj;
  };

  /* 원본 스탯 (초기 상태) */
  const [originalStat, setOriginalStat] = useState<StatFields>({});
  /* 편집 중 스탯 */
  const [stat, setStat] = useState<StatFields>({});

  /* 파싱 & 초기값 세팅 */
  useEffect(() => {
    const parsed = parseMessage(alertMessage);
    setStat(parsed);
    setOriginalStat(parsed);
  }, [alertMessage]);

  /* input onChange 헬퍼 */
  const handleChange = (key: string, val: string) => {
    setStat((prev) => ({
      ...prev,
      [key]: val === "" ? "" : isNaN(Number(val)) ? val : Number(val),
    }));
  };

  /* PATCH 요청 */
  const handleSubmit = async () => {
    // 중복 제출 방지
    if (isSubmitting) return;

    // 변경 여부 확인
    const hasChanged = Object.entries(stat).some(([key, value]) => {
      if (key === "id" || key === "플레이어" || key === "playerName")
        return false;
      return value !== originalStat[key];
    });
    if (!hasChanged) {
      alert("스탯이 수정되지 않았습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const id = stat.id;
      if (!id) {
        alert("id가 없습니다.");
        return;
      }

      /* ❶ 영문 키 매핑 테이블 */
      const batterKeyMap: Record<string, string> = {
        타석: "PA",
        타수: "AB",
        안타: "H",
        "2루타": "2B",
        "3루타": "3B",
        홈런: "HR",
        // 타점: "RBI",
        득점: "R",
        볼넷: "BB",
        삼진: "SO",
        희플: "SH",
        희번: "SF",
      };
      const pitcherKeyMap: Record<string, string> = {
        아웃: "IP",
        실점: "R",
        // 자책: "ER",
        삼진: "K",
        볼넷: "BB",
      };

      /* ❷ 키 변환하여 body 구성 */
      const { id: _omit, 플레이어, playerName, ...rest } = stat;
      const body: Record<string, number> = {};
      Object.entries(rest).forEach(([k, v]) => {
        const key =
          mode === "batter"
            ? batterKeyMap[k] ?? k
            : mode === "pitcher"
            ? pitcherKeyMap[k] ?? k
            : k;
        body[key] = Number(v);
      });

      /* ❸ URL 분기 */
      const url =
        mode === "batter"
          ? `/games/${router.query.recordId}/result/batters/${id}`
          : mode === "pitcher"
          ? `/games/${router.query.recordId}/result/pitchers/${id}`
          : null;

      if (!url) {
        alert("수정에 실패하였습니다.");
        return;
      }
      console.log("body", body);
      const res = await API.patch(
        url,
        body
        // { withCredentials: true }
      );
      console.log("응답:", res.data);
      if (onSuccess) await onSuccess();
      alert("스탯 수정이 완료되었습니다.");
    } catch (err) {
      console.error(err);
      // alert("수정 실패");
      setError(err);
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <LongModalContainer>
        <ModalTitleSmall>스탯을 수정해주세요</ModalTitleSmall>

        {(stat["플레이어"] || stat.playerName) && (
          <div style={{ marginBottom: 30 }}>
            {stat["플레이어"] ?? stat.playerName}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mode === "batter" ? "1fr 1fr" : "1fr",
            gap: mode === "batter" ? "1.5rem 2rem" : "1.5rem 0",
            marginBottom: 25,
            // backgroundColor: "red",
            // justifyContent: "space-evenly",
          }}
        >
          {/* 왼쪽 열: 타석~홈런 (타자 모드에서만) */}
          {mode === "batter" && (
            <div>
              {Object.entries(stat).map(([key, value]) => {
                if (key === "id" || key === "플레이어" || key === "playerName")
                  return null;
                if (
                  ["타석", "타수", "안타", "2루타", "3루타", "홈런"].includes(
                    key
                  )
                ) {
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 25,
                      }}
                    >
                      <label
                        style={{
                          width: "15vw",
                          textAlign: "left",
                          fontWeight: 600,
                        }}
                      >
                        {key}
                      </label>
                      <StatPatchInput
                        type="number"
                        value={stat[key] as string | number}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* 오른쪽 열: 타점~희번 (타자 모드에서만) */}
          {mode === "batter" && (
            <div>
              {Object.entries(stat).map(([key, value]) => {
                if (key === "id" || key === "플레이어" || key === "playerName")
                  return null;
                if (["득점", "볼넷", "삼진", "희플", "희번"].includes(key)) {
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 25,
                      }}
                    >
                      <label
                        style={{
                          width: "15vw",
                          textAlign: "left",
                          fontWeight: 600,
                        }}
                      >
                        {key}
                      </label>
                      <StatPatchInput
                        type="number"
                        value={stat[key] as string | number}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* 투수 모드: 1줄로 표시 */}
          {mode === "pitcher" && (
            <div>
              {Object.entries(stat).map(([key, value]) => {
                if (key === "id" || key === "플레이어" || key === "playerName")
                  return null;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 25,
                    }}
                  >
                    <label
                      style={{
                        width: "15vw",
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      {key}
                    </label>
                    <StatPatchInput
                      type="number"
                      value={stat[key] as string | number}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ModalButton onClick={handleSubmit} disabled={isSubmitting}>
          수정하기
        </ModalButton>
        <ModalCancleButton onClick={() => setIsModalOpen(false)}>
          닫기
        </ModalCancleButton>
      </LongModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </ModalOverlay>
  );
}

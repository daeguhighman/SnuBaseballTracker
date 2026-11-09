import { useState } from "react";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import { ModalCancleButton, ModalOverlay, ModalTitleSmall } from "./modal.style";
import {
  Field,
  FormFields,
  FormModalContainer,
  Hint,
  SubmitButton,
} from "./adminForm.style";

export interface AdminTeamOption {
  /** TeamTournament ID */
  id: number;
  name: string;
  group: string;
}

interface IProps {
  tournamentId: number;
  teams: AdminTeamOption[];
  /** YYYY-MM-DD: 관리 페이지에서 보고 있던 날짜 */
  defaultDate: string;
  onClose: () => void;
  onDone: () => void;
}

/**
 * 관리 페이지의 리그 경기 신규 등록.
 * 8강 이후 경기는 대진표 탭에서 만든다. 승자 배치가 대진 자리 전체를 전제로 하기 때문.
 */
export default function CreateGameModal({
  tournamentId,
  teams,
  defaultDate,
  onClose,
  onDone,
}: IProps) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [awayId, setAwayId] = useState("");
  const [homeId, setHomeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!date || !time || !awayId || !homeId) {
      alert("날짜, 시간, 두 팀을 모두 입력해 주세요.");
      return;
    }
    if (awayId === homeId) {
      alert("같은 팀끼리는 경기를 등록할 수 없습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post("/admin/games", {
        tournamentId,
        awayTeamTournamentId: Number(awayId),
        homeTeamTournamentId: Number(homeId),
        stage: "LEAGUE",
        startTime: `${date}T${time}:00+09:00`,
      });
      onDone();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ?? "등록에 실패했습니다. 다시 시도해 주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamOptions = (
    <>
      <option value="">팀 선택</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.group ? `${team.group}조 ` : ""}
          {team.name}
        </option>
      ))}
    </>
  );

  return (
    <ModalOverlay>
      <FormModalContainer>
        <ModalTitleSmall>리그 경기 등록</ModalTitleSmall>
        <FormFields>
          <Field>
            날짜
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field>
            시간
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field>
            원정팀 (선공)
            <select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
              {teamOptions}
            </select>
          </Field>
          <Field>
            홈팀 (후공)
            <select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
              {teamOptions}
            </select>
          </Field>
        </FormFields>
        <Hint>8강 이후 경기는 대진표 탭에서 만듭니다.</Hint>
        <SubmitButton onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? "등록 중…" : "등록하기"}
        </SubmitButton>
        <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
      </FormModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
